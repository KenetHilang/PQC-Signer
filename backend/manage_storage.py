#!/usr/bin/env python3
import argparse
import json

from app import create_app


def main():
    parser = argparse.ArgumentParser(description="Manage q-sealnet backend storage")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("migrate-storage", help="Upgrade key/signature JSON files to the latest schema")
    args = parser.parse_args()

    app = create_app()
    service = app.config["SIGNER_SERVICE"]

    if args.command == "migrate-storage":
        report = service.migrate_storage()
        print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
