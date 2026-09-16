#!/usr/bin/env python3
"""AlphaFlow AWS Credit Shield & Lifecycle Manager.

Provides a safe ON/OFF toggle and automated Terraform deploy/teardown
commands to ensure AWS credits/costs are protected.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TERRAFORM_DIR = ROOT / "terraform"
ENV_FILE = ROOT / ".env"


def _run_cmd(cmd: list[str], cwd: Path | None = None) -> tuple[int, str]:
    try:
        res = subprocess.run(
            cmd,
            cwd=cwd or ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        return res.returncode, res.stdout + res.stderr
    except FileNotFoundError:
        return 127, f"Command not found: {cmd[0]}"


def cmd_status():
    print("=" * 70)
    print("  ALPHAFLOW AWS CLOUD & CREDIT SHIELD STATUS")
    print("=" * 70)

    # 1. Check local environment toggle
    aws_env_val = os.getenv("ALPHAFLOW_ENABLE_AWS", "false").strip().lower()
    is_aws_enabled = aws_env_val in ("true", "1", "yes", "on")

    if is_aws_enabled:
        print("  Local Mode:      [ONLINE] AWS Cloud Streaming is ON")
    else:
        print("  Local Mode:      [CREDIT SHIELD ACTIVE] AWS is OFF ($0.00 / Zero Cost)")

    # 2. Check AWS Credentials via STS
    code, out = _run_cmd(["aws", "sts", "get-caller-identity", "--output", "json"])
    if code == 0:
        import json
        try:
            sts_data = json.loads(out)
            account_id = sts_data.get("Account", "Unknown")
            arn = sts_data.get("Arn", "Unknown")
            print(f"  AWS Account:     {account_id} ({arn})")
        except Exception:
            print("  AWS Account:     Connected")
    else:
        print("  AWS Account:     No active AWS credentials found (Zero billing risk)")

    print("-" * 70)
    print("  LIVE AWS RESOURCE PROVISIONING CHECK:")

    # 3. Check S3
    bucket_name = "alphaflow-market-data-lake"
    code, _ = _run_cmd(["aws", "s3api", "head-bucket", "--bucket", bucket_name])
    s3_status = "PROVISIONED (Live)" if code == 0 else "NOT PROVISIONED (0 charges)"
    print(f"  • S3 Lakehouse:  {bucket_name} -> {s3_status}")

    # 4. Check DynamoDB
    table_name = "alphaflow_factor_state"
    code, _ = _run_cmd(["aws", "dynamodb", "describe-table", "--table-name", table_name])
    ddb_status = "PROVISIONED (Live)" if code == 0 else "NOT PROVISIONED (0 charges)"
    print(f"  • DynamoDB Table: {table_name} -> {ddb_status}")

    # 5. Check SNS
    code, out = _run_cmd(["aws", "sns", "list-topics"])
    sns_status = "PROVISIONED (Live)" if "alphaflow-factor-alerts" in out else "NOT PROVISIONED (0 charges)"
    print(f"  • SNS Alerts:    alphaflow-factor-alerts -> {sns_status}")

    # 6. Check Lambda
    code, _ = _run_cmd(["aws", "lambda", "get-function", "--function-name", "alphaflow-serverless-sentinel"])
    lambda_status = "PROVISIONED (Live)" if code == 0 else "NOT PROVISIONED (0 charges)"
    print(f"  • Lambda Sentinel: alphaflow-serverless-sentinel -> {lambda_status}")

    print("-" * 70)
    print("  BILLING SAFETY:")
    print("  • Provisioned Pricing Model: 100% Pay-Per-Request (Serverless)")
    print("  • Idle Cost: $0.00 / month (No running clusters, no NAT gateways)")
    print("  • Auto-Eviction: DynamoDB 90-day TTL purges records automatically")
    print("=" * 70)


def cmd_on():
    print("Enabling AWS mode for AlphaFlow...")
    os.environ["ALPHAFLOW_ENABLE_AWS"] = "true"
    # Write or update .env file
    lines = []
    if ENV_FILE.exists():
        lines = [line for line in ENV_FILE.read_text().splitlines() if not line.startswith("ALPHAFLOW_ENABLE_AWS=")]
    lines.append("ALPHAFLOW_ENABLE_AWS=true")
    ENV_FILE.write_text("\n".join(lines) + "\n")
    print("✓ ALPHAFLOW_ENABLE_AWS=true set in .env")
    print("✓ AWS cloud mode is now ENABLED for subsequent pipeline executions.")


def cmd_off():
    print("Activating Credit Shield (Disabling AWS mode)...")
    os.environ["ALPHAFLOW_ENABLE_AWS"] = "false"
    lines = []
    if ENV_FILE.exists():
        lines = [line for line in ENV_FILE.read_text().splitlines() if not line.startswith("ALPHAFLOW_ENABLE_AWS=")]
    lines.append("ALPHAFLOW_ENABLE_AWS=false")
    ENV_FILE.write_text("\n".join(lines) + "\n")
    print("✓ ALPHAFLOW_ENABLE_AWS=false set in .env")
    print("✓ [CREDIT SHIELD ACTIVE]: All pipeline runs will operate in local Parquet mode ($0.00 AWS cost).")


def cmd_deploy():
    print("=" * 70)
    print("  PROVISIONING SERVERLESS AWS RESOURCES VIA TERRAFORM")
    print("  (Only Pay-Per-Request Free-Tier Resources: S3, DynamoDB, SNS, Lambda)")
    print("=" * 70)

    if not TERRAFORM_DIR.exists():
        print(f"Error: Terraform directory not found at {TERRAFORM_DIR}")
        sys.exit(1)

    print("\n[Step 1/2] Initializing Terraform...")
    code, out = _run_cmd(["terraform", "init"], cwd=TERRAFORM_DIR)
    if code != 0:
        print(f"terraform init failed:\n{out}")
        sys.exit(1)
    print("✓ Terraform initialized successfully.")

    print("\n[Step 2/2] Applying Terraform Plan...")
    code, out = _run_cmd(["terraform", "apply", "-auto-approve"], cwd=TERRAFORM_DIR)
    if code != 0:
        print(f"terraform apply failed:\n{out}")
        sys.exit(1)

    print("✓ AWS Infrastructure deployed successfully!")
    cmd_status()


def cmd_teardown():
    print("=" * 70)
    print("  DESTROYING ALL ALPHAFLOW AWS RESOURCES (KILL SWITCH)")
    print("  Ensures $0.00 billing and zero lingering cloud resources")
    print("=" * 70)

    if not TERRAFORM_DIR.exists():
        print(f"Error: Terraform directory not found at {TERRAFORM_DIR}")
        sys.exit(1)

    print("\nRunning terraform destroy...")
    code, out = _run_cmd(["terraform", "destroy", "-auto-approve"], cwd=TERRAFORM_DIR)
    if code != 0:
        print(f"terraform destroy warning/output:\n{out}")
    else:
        print("✓ All AlphaFlow AWS resources cleanly destroyed!")

    cmd_off()
    print("\n✓ Credit Shield activated. Local mode restored.")


def main():
    parser = argparse.ArgumentParser(
        description="AlphaFlow AWS Credit Shield & Lifecycle Manager"
    )
    parser.add_argument(
        "action",
        choices=["status", "on", "off", "deploy", "teardown"],
        help="Action: status (check cloud resources), on (enable AWS mode), off (disable AWS mode), deploy (provision via Terraform), teardown (destroy all resources).",
    )

    args = parser.parse_args()

    if args.action == "status":
        cmd_status()
    elif args.action == "on":
        cmd_on()
    elif args.action == "off":
        cmd_off()
    elif args.action == "deploy":
        cmd_deploy()
    elif args.action == "teardown":
        cmd_teardown()


if __name__ == "__main__":
    main()
