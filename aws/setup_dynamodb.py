import boto3
import time
import sys
from botocore.exceptions import ClientError

REGION = boto3.Session().region_name or "ap-south-1" # Default to Mumbai region
dynamodb = boto3.client("dynamodb", region_name=REGION)

print(f"[*] Initializing DynamoDB provisioning in region: {REGION}")

def create_table_if_not_exists(table_name, key_schema, attribute_definitions, global_secondary_indexes=None):
    try:
        kwargs = {
            "TableName": table_name,
            "KeySchema": key_schema,
            "AttributeDefinitions": attribute_definitions,
            "BillingMode": "PAY_PER_REQUEST"
        }
        if global_secondary_indexes:
            kwargs["GlobalSecondaryIndexes"] = global_secondary_indexes

        print(f"[*] Creating table '{table_name}'...")
        dynamodb.create_table(**kwargs)
        
        waiter = dynamodb.get_waiter("table_exists")
        waiter.wait(TableName=table_name)
        print(f"[✓] Table '{table_name}' is ready.")
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceInUseException":
            print(f"[-] Table '{table_name}' already exists. Skipping creation.")
        else:
            print(f"[!] Error creating '{table_name}': {e}")
            sys.exit(1)

# 1. Create 'venues' table
create_table_if_not_exists(
    table_name="venues",
    key_schema=[
        {"AttributeName": "venueId", "KeyType": "HASH"}
    ],
    attribute_definitions=[
        {"AttributeName": "venueId", "AttributeType": "S"}
    ]
)

# 2. Create 'occupancy_events' table with GSI for Venue analytics
create_table_if_not_exists(
    table_name="occupancy_events",
    key_schema=[
        {"AttributeName": "eventId", "KeyType": "HASH"}
    ],
    attribute_definitions=[
        {"AttributeName": "eventId", "AttributeType": "S"},
        {"AttributeName": "venueId", "AttributeType": "S"},
        {"AttributeName": "timestamp", "AttributeType": "S"}
    ],
    global_secondary_indexes=[
        {
            "IndexName": "VenueTimeIndex",
            "KeySchema": [
                {"AttributeName": "venueId", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"}
            ],
            "Projection": {"ProjectionType": "ALL"}
        }
    ]
)

# 3. Seed Initial Venues
initial_venues = [
    {
        "venueId": {"S": "mall_pacific"},
        "name": {"S": "Pacific Mall (Tagore Garden)"},
        "type": {"S": "MALL"},
        "capacity": {"N": "2500"},
        "currentOccupancy": {"N": "840"},
        "crowdStatus": {"S": "MODERATE"},
        "updatedAt": {"S": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    },
    {
        "venueId": {"S": "gym_cult"},
        "name": {"S": "Cult.fit Premium Gym"},
        "type": {"S": "GYM"},
        "capacity": {"N": "150"},
        "currentOccupancy": {"N": "110"},
        "crowdStatus": {"S": "BUSY"},
        "updatedAt": {"S": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    },
    {
        "venueId": {"S": "lib_central"},
        "name": {"S": "Central University Library"},
        "type": {"S": "LIBRARY"},
        "capacity": {"N": "400"},
        "currentOccupancy": {"N": "95"},
        "crowdStatus": {"S": "QUIET"},
        "updatedAt": {"S": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    }
]

print("[*] Seeding venues table...")
for venue in initial_venues:
    try:
        dynamodb.put_item(
            TableName="venues",
            Item=venue,
            ConditionExpression="attribute_not_exists(venueId)"
        )
        print(f"  [+] Seeded venue: {venue['venueId']['S']}")
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            print(f"  [-] Venue '{venue['venueId']['S']}' already exists.")
        else:
            print(f"  [!] Failed to seed '{venue['venueId']['S']}': {e}")

print("\n[✓] Step 7.1 Complete: DynamoDB infrastructure is provisioned and seeded successfully.")
