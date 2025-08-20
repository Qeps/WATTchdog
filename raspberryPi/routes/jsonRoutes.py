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
