from flask import Blueprint, jsonify, request, current_app
from logger import Logger
from services.configPreparation import prepareConfigPayload, ConfigValidationError

# Flask "Blueprint" groups related endpoints; here they are JSON API routes.
jsonRoutes = Blueprint("jsonRoutes", __name__)

@jsonRoutes.get("/devices")
def apiDevices():
    devices_list = current_app.config["DEVICES_LIST"]
    return jsonify(devices_list.list())

@jsonRoutes.post("/config")
def apiConfig():
    # Parse JSON payload
    try:
        data = request.get_json(force=True, silent=False)
    except Exception as e:
        Logger.error(f"JSON parse error: {e}")
        return jsonify({"error": "invalid JSON"}), 400

    devices_list = current_app.config["DEVICES_LIST"]

    # Validate + prepare message (does not publish yet)
    try:
        msg_id, prepared = prepareConfigPayload(data, devices_list)
    except ConfigValidationError as e:
        msg = str(e)
        if msg in {
            "payload must be a JSON object",
            "missing 'serial'",
            "recipients must be a list",
            "events must be a list",
        }:
            Logger.warning(msg)
            return jsonify({"error": msg}), 400
        Logger.error(msg)
        return jsonify({"error": "bad request"}), 400

    # For now just acknowledge; MQTT/other transport can use `prepared`
    return {"status": "ok", "id": msg_id}, 200


def _handle_simulated_mqtt(topic, payload):
    """Parse a simulated MQTT topic and update the devices list.

    Expected topics:
      - devices/<serial>/hello
      - devices/<serial>/status
    Returns: (ok: bool, message: str)
    """
    if not isinstance(topic, str):
        return False, "topic must be a string"

    parts = topic.split("/")
    if len(parts) != 3 or parts[0] != "devices" or not parts[1]:
        return False, "invalid topic format"

    serial, action = parts[1], parts[2]

    devices_list = current_app.config["DEVICES_LIST"]

    if action == "hello":
        if not isinstance(payload, dict):
            return False, "payload must be an object for hello"
        name = str(payload.get("name", "")).strip() or None
        ip = str(payload.get("ip", "")).strip() or None
        online = bool(payload.get("online", True))
        Logger.info(f"MQTT HELLO serial={serial} name={name} ip={ip} online={online}")
        fields = {"online": online}
        if name is not None:
            fields["name"] = name
        if ip is not None:
            fields["ip"] = ip
        devices_list.upsert(serial, **fields)
        return True, "hello processed"

    if action == "status":
        if not isinstance(payload, dict):
            return False, "payload must be an object for status"
        if "online" not in payload:
            return False, "missing 'online' in status payload"
        online = bool(payload.get("online"))
        Logger.info(f"MQTT STATUS serial={serial} online={online}")
        devices_list.set_online(serial, online)
        return True, "status processed"

    return False, "unsupported action"


@jsonRoutes.post("/mock/mqtt")
def apiMockMqtt():
    """Test-only endpoint to simulate an MQTT message via HTTP.

    Body JSON example:
    {
      "topic": "devices/ABC123/hello",
      "payload": {"name": "Node-1", "ip": "192.168.0.50", "online": true}
    }
    """
    try:
        data = request.get_json(force=True, silent=False)
    except Exception as e:
        Logger.error(f"MQTT mock JSON parse error: {e}")
        return jsonify({"error": "invalid JSON"}), 400

    topic = data.get("topic")
    payload = data.get("payload")
    ok, msg = _handle_simulated_mqtt(topic, payload)
    if not ok:
        Logger.warning(f"MQTT mock rejected: {msg}")
        return jsonify({"error": msg}), 400
    return jsonify({"status": "ok", "message": msg}), 200
