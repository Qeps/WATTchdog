from flask import Flask, request, jsonify, render_template
import socket
import time
import uuid
import json
from services.devicesList import DevicesList

app = Flask(__name__)

# --- Utilities ---
def get_local_ip() -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "unknown"
    finally:
        s.close()
    return ip

# --- Device list (seed demo devices; later via mDNS/MQTT) ---
devices_list = DevicesList()  # ✅ instancja w snake_case
devices_list.upsert("122334", name="WATTchdog", online=True, ip=get_local_ip())
devices_list.upsert("122335", name="WATTchdog", online=True, ip=get_local_ip())

# ---------------- Views ----------------
@app.route("/", methods=["GET"])
def index():
    return render_template("index.html", ip=get_local_ip(), title="WATTCHdog", motto="It watches over your energy.")

# ---------------- API ----------------
@app.route("/api/devices", methods=["GET"])
def api_devices():
    return jsonify(devices_list.list())   # ✅ korzystamy z instancji

@app.route("/api/config", methods=["POST"])
def api_config():
    # Parse JSON
    data = request.get_json(force=True, silent=False)
    if not isinstance(data, dict):
        return jsonify({"error": "payload must be a JSON object"}), 400

    # Target device must be set
    serial = (data.get("serial") or "").strip()
    if not serial:
        return jsonify({"error": "missing 'serial'"}), 400

    # Recipients: allow empty; require list type only
    recipients = data.get("recipients")
    if recipients is None:
        recipients = []
    if not isinstance(recipients, list):
        return jsonify({"error": "recipients must be a list"}), 400
    # Ensure keys exist (stringify empties) but DO NOT enforce content
    for r in recipients:
        if isinstance(r, dict):
            r.setdefault("name", "")
            r.setdefault("email", "")
            r.setdefault("number", "")

    # Events: allow empty; require list type only; do NOT enforce fields
    events = data.get("events")
    if events is None:
        events = []
    if not isinstance(events, list):
        return jsonify({"error": "events must be a list"}), 400
    # We accept any object shape here; no validation of recipientName/trigger/channels

    # (Optional) warn if serial not known; do not block
    try:
        known_serials = { d.get("serial") for d in devices_list.list() }
        if serial not in known_serials:
            print(f"[WARN] serial '{serial}' not in devices_list; proceeding anyway")
    except Exception:
        pass

    # Metadata for logs (not required by STM32)
    msg_id = str(uuid.uuid4())
    prepared = {
        "id": msg_id,
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "recipients": recipients,
        "events": events,
    }

    # Console output — exactly what will be sent next (MQTT later)
    print("\n=== CONFIG PREPARED ===")
    print(f"serial: {serial}")
    print(json.dumps(prepared, indent=2, ensure_ascii=False))
    print("=======================\n")

    return {"status": "ok", "id": msg_id}, 200


# ---------------- Main ----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
