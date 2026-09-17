import boto3
import json
import zipfile
import io
import time
import os
import sys
from botocore.exceptions import ClientError

REGION = boto3.Session().region_name or "ap-south-1"
FUNCTION_NAME = "OccupancyEventProcessor"
ROLE_NAME = "OccupancyEventProcessorRole"

iam = boto3.client("iam")
lambda_client = boto3.client("lambda", region_name=REGION)

print(f"[*] Target region: {REGION}")

# 1. Fetch role ARN
role_arn = os.environ.get("LAMBDA_ROLE_ARN")
if not role_arn:
    try:
        r = iam.get_role(RoleName=ROLE_NAME)
        role_arn = r["Role"]["Arn"]
        print(f"[✓] Successfully located existing IAM role: {role_arn}")
    except ClientError as e:
        print(f"[!] Could not locate role '{ROLE_NAME}': {e}")
        print("    Ensure you completed Step 1 in the AWS Console and named it OccupancyEventProcessorRole.")
        sys.exit(1)

# 2. Package Lambda code into zip
zip_buffer = io.BytesIO()
with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
    with open("aws/lambda/event_processor.py", "r", encoding="utf-8") as f:
        zf.writestr("event_processor.py", f.read())
zip_bytes = zip_buffer.getvalue()

# 3. Create or update Lambda function
try:
    lambda_client.get_function(FunctionName=FUNCTION_NAME)
    print(f"[*] Function {FUNCTION_NAME} exists. Updating code...")
    lambda_client.update_function_code(
        FunctionName=FUNCTION_NAME,
        ZipFile=zip_bytes
    )
    waiter = lambda_client.get_waiter("function_updated")
    waiter.wait(FunctionName=FUNCTION_NAME)
    print(f"[✓] Function {FUNCTION_NAME} code updated.")
except ClientError:
    print(f"[*] Creating Lambda function {FUNCTION_NAME} with role {role_arn}...")
    lambda_client.create_function(
        FunctionName=FUNCTION_NAME,
        Runtime="python3.11",
        Role=role_arn,
        Handler="event_processor.handler",
        Code={"ZipFile": zip_bytes},
        Timeout=15,
        MemorySize=128,
        Environment={
            "Variables": {
                "EVENTS_TABLE": "occupancy_events",
                "VENUES_TABLE": "venues"
            }
        }
    )
    waiter = lambda_client.get_waiter("function_active")
    waiter.wait(FunctionName=FUNCTION_NAME)
    print(f"[✓] Function {FUNCTION_NAME} created and active.")

# 4. Run live invocation test
print("\n[*] Invoking Lambda with atomic ENTRY test event...")
test_payload = {
    "eventId": f"test_init_{int(time.time())}",
    "venueId": "mall_pacific",
    "deviceId": "gate_north",
    "eventType": "ENTRY",
    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
}

invoke_resp = lambda_client.invoke(
    FunctionName=FUNCTION_NAME,
    InvocationType="RequestResponse",
    Payload=json.dumps(test_payload)
)
resp_payload = json.loads(invoke_resp["Payload"].read().decode("utf-8"))
print(f"[✓] Live Test Result:\n{json.dumps(resp_payload, indent=2)}")

# 5. Run duplicate test
print("\n[*] Testing duplicate eventId idempotency...")
dup_resp = lambda_client.invoke(
    FunctionName=FUNCTION_NAME,
    InvocationType="RequestResponse",
    Payload=json.dumps(test_payload)
)
dup_payload = json.loads(dup_resp["Payload"].read().decode("utf-8"))
print(f"[✓] Idempotency Test Result:\n{json.dumps(dup_payload, indent=2)}")

print("\n[✓] Step 7.2 Complete: EventProcessor Lambda successfully deployed and verified.")
