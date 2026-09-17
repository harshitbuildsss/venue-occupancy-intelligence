import os
import boto3
import json
import time
from botocore.exceptions import ClientError

REGION = os.environ.get("AWS_REGION", "ap-south-1")
dynamodb = boto3.client("dynamodb", region_name=REGION)

EVENTS_TABLE = os.environ.get("EVENTS_TABLE", "occupancy_events")
VENUES_TABLE = os.environ.get("VENUES_TABLE", "venues")

def calculate_crowd_status(occupancy, capacity):
    if capacity <= 0:
        return "QUIET"
    percentage = (occupancy / capacity) * 100.0
    if percentage > 100.0:
        return "CAPACITY_ANOMALY"
    elif percentage >= 95.0:
        return "NEAR_CAPACITY"
    elif percentage >= 80.0:
        return "VERY_BUSY"
    elif percentage >= 60.0:
        return "BUSY"
    elif percentage >= 30.0:
        return "MODERATE"
    else:
        return "QUIET"

def handler(event, context):
    print(f"[*] Received event payload: {json.dumps(event)}")

    event_id = event.get("eventId")
    venue_id = event.get("venueId")
    device_id = event.get("deviceId", "sensor_unknown")
    event_type = event.get("eventType")
    timestamp = event.get("timestamp", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))

    if not event_id or not venue_id or not event_type:
        return {
            "status": "REJECTED_MALFORMED",
            "message": "Missing required fields: eventId, venueId, or eventType"
        }

    if event_type not in ["ENTRY", "EXIT"]:
        return {
            "status": "REJECTED_INVALID_TYPE",
            "message": f"Invalid eventType: {event_type}. Must be ENTRY or EXIT."
        }

    # 1. Fetch current venue state
    try:
        venue_resp = dynamodb.get_item(
            TableName=VENUES_TABLE,
            Key={"venueId": {"S": venue_id}}
        )
        if "Item" not in venue_resp:
            return {
                "status": "INVALID_VENUE_MISMATCH",
                "message": f"Venue not found: {venue_id}"
            }
        venue_item = venue_resp["Item"]
        current_occ = int(venue_item["currentOccupancy"]["N"])
        capacity = int(venue_item["capacity"]["N"])
    except Exception as e:
        print(f"[!] DynamoDB read error for venue {venue_id}: {e}")
        raise e

    # 2. Check for duplicate eventId
    try:
        existing_evt = dynamodb.get_item(
            TableName=EVENTS_TABLE,
            Key={"eventId": {"S": event_id}}
        )
        if "Item" in existing_evt:
            return {
                "status": "DUPLICATE_IGNORED",
                "currentOccupancy": current_occ,
                "crowdStatus": venue_item.get("crowdStatus", {}).get("S", "QUIET"),
                "message": f"Event {event_id} already processed. Duplicate ignored."
            }
    except Exception as e:
        print(f"[!] DynamoDB read error for event {event_id}: {e}")
        raise e

    # 3. Enforce zero floor protection on EXIT
    if event_type == "EXIT" and current_occ <= 0:
        return {
            "status": "REJECTED_NEGATIVE_OCCUPANCY",
            "currentOccupancy": 0,
            "crowdStatus": "QUIET",
            "message": "Occupancy is already 0. Decrement rejected."
        }

    # 4. Determine resulting count and new status
    delta = 1 if event_type == "ENTRY" else -1
    new_occ = max(0, current_occ + delta)
    new_status = calculate_crowd_status(new_occ, capacity)
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    ttl_epoch = int(time.time()) + (86400 * 7) # 7 days retention

    # 5. Execute atomic transaction
    transact_items = [
        {
            "Put": {
                "TableName": EVENTS_TABLE,
                "Item": {
                    "eventId": {"S": event_id},
                    "venueId": {"S": venue_id},
                    "deviceId": {"S": device_id},
                    "eventType": {"S": event_type},
                    "timestamp": {"S": timestamp},
                    "ttl": {"N": str(ttl_epoch)}
                },
                "ConditionExpression": "attribute_not_exists(eventId)"
            }
        },
        {
            "Update": {
                "TableName": VENUES_TABLE,
                "Key": {"venueId": {"S": venue_id}},
                "UpdateExpression": "SET currentOccupancy = :newOcc, crowdStatus = :newStatus, updatedAt = :nowIso",
                "ExpressionAttributeValues": {
                    ":newOcc": {"N": str(new_occ)},
                    ":newStatus": {"S": new_status},
                    ":nowIso": {"S": now_iso}
                },
                "ConditionExpression": "attribute_exists(venueId)"
            }
        }
    ]

    try:
        dynamodb.transact_write_items(TransactItems=transact_items)
        print(f"[✓] Successfully processed {event_id}: {event_type} at {venue_id}. New occupancy: {new_occ}")
        return {
            "status": "PROCESSED",
            "resultingOccupancy": new_occ,
            "resultingStatus": new_status,
            "message": "Event processed successfully"
        }
    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code == "TransactionCanceledException":
            # Concurrent race caught by condition expression
            return {
                "status": "DUPLICATE_IGNORED",
                "currentOccupancy": current_occ,
                "crowdStatus": venue_item.get("crowdStatus", {}).get("S", "QUIET"),
                "message": "Concurrent duplicate transaction canceled safely."
            }
        print(f"[!] TransactWriteItems failed: {e}")
        raise e
