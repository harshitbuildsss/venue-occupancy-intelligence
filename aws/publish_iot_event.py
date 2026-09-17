import boto3
import json
import time

REGION = "ap-south-1"
iot_data = boto3.client("iot-data", region_name=REGION)

topic = "occupancy/venues/mall_pacific/events"
event_id = f"mqtt_evt_{int(time.time())}"

payload = {
    "eventId": event_id,
    "venueId": "mall_pacific",
    "deviceId": "gate_north",
    "eventType": "ENTRY",
    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
}

print(f"[*] Publishing MQTT event to '{topic}' via AWS IoT Data Plane...")
print(f"[*] Payload: {json.dumps(payload, indent=2)}")

response = iot_data.publish(
    topic=topic,
    qos=1,
    payload=json.dumps(payload)
)

print("[✓] MQTT message published successfully to AWS IoT Core!")
print(f"[*] Event ID: {event_id}")
