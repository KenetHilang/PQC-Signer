import json
import os


class JsonStorage:
    def __init__(self, keys_dir, signatures_dir):
        self.keys_dir = keys_dir
        self.signatures_dir = signatures_dir
        os.makedirs(self.keys_dir, exist_ok=True)
        os.makedirs(self.signatures_dir, exist_ok=True)

    def get_key_path(self, key_id):
        return os.path.join(self.keys_dir, f"{key_id}.json")

    def get_signature_path(self, signature_id):
        return os.path.join(self.signatures_dir, f"{signature_id}.json")

    def list_key_ids(self):
        if not os.path.exists(self.keys_dir):
            return []
        return sorted(
            filename[:-5] for filename in os.listdir(self.keys_dir) if filename.endswith(".json")
        )

    def list_signature_ids(self):
        if not os.path.exists(self.signatures_dir):
            return []
        return sorted(
            filename[:-5]
            for filename in os.listdir(self.signatures_dir)
            if filename.endswith(".json")
        )

    def read_json(self, path):
        with open(path, "r") as f:
            return json.load(f)

    def write_json(self, path, payload):
        with open(path, "w") as f:
            json.dump(payload, f, indent=2)

    def read_key_record(self, key_id):
        path = self.get_key_path(key_id)
        if not os.path.exists(path):
            return None
        return self.read_json(path)

    def write_key_record(self, key_id, payload):
        self.write_json(self.get_key_path(key_id), payload)

    def read_signature_record(self, signature_id):
        path = self.get_signature_path(signature_id)
        if not os.path.exists(path):
            return None
        return self.read_json(path)

    def write_signature_record(self, signature_id, payload):
        self.write_json(self.get_signature_path(signature_id), payload)
