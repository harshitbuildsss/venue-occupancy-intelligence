import boto3
import json
import time
import random

REGION = "ap-south-1"
iot_data = boto3.client("iot-data", region_name=REGION)

VENUES = ["mall_pacific", "gym_cult", "lib_central"]
EVENT_TYPES = ["ENTRY", "ENTRY", "EXIT"] # 2:1 ingress bias

print("[*] Starting AWS IoT Core live streaming simulation...")
print("[*] Press Ctrl+C to stop.")

try:
    for i in range(1, 11):
        v_id = random.choice(VENUES)
        e_type = random.choice(EVENT_TYPES)
        evt_id = f"stream_{int(time.time()*1000)}_{i}"
        
        payload = {
            "eventId": evt_id,
            "venueId": v_id,
            "deviceId": f"turnstile_{random.randint(1, 4)}",
            "eventType": e_type,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        
        topic = f"occupancy/venues/{v_id}/events"
        iot_data.publish(
            topic=topic,
            qos=1,
            payload=json.dumps(payload)
        )
        print(f"[{i}/10] Published {e_type} to {topic} (Event ID: {evt_id})")
        time.sleep(1.5)
        
    print("[✓] Simulation batch completed successfully.")
except KeyboardInterrupt:
    print("\n[!] Simulation terminated by user.")
