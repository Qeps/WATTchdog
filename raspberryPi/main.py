from flask import Flask, request
import os
from services.devicesList import DevicesList
from network.localNetwork import getLocalIp
from logger import Logger
from routes import registerRoutes
from services.mqttManager import MqttManager

app = Flask(__name__)

# --- Devices live here (per your requirement) ---
devices_list = DevicesList()
app.config["DEVICES_LIST"] = devices_list

# --- MQTT: instantiate and subscribe; all logic lives in MqttManager ---
MQTT_HOST = os.getenv("MQTT_HOST", "wattchdog.local")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
mqtt = MqttManager(host=MQTT_HOST, port=MQTT_PORT, devices_list=devices_list)
mqtt.subscribe(["devices/+/hello", "devices/+/status"])
mqtt.start()

# --- Minimal request logging (no separate middleware) ---
@app.before_request
def logRequestStart():
    Logger.info(f"HTTP {request.method} {request.path} from {request.remote_addr or 'unknown'}")

@app.after_request
def logRequestEnd(response):
    Logger.info(f"HTTP {request.method} {request.path} -> {response.status_code}")
    return response

# --- Route registration (keeps Flask's 'blueprint' API out of main) ---
registerRoutes(app)

if __name__ == "__main__":
    Logger.info("Starting Flask server on 0.0.0.0:8000 (debug=False)")
    app.run(host="0.0.0.0", port=8000, debug=False)
