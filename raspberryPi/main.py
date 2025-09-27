from flask import Flask, request
from services.devicesList import DevicesList
from network.localNetwork import getLocalIp
from logger import Logger
from routes import registerRoutes

app = Flask(__name__)

# --- Devices live here (per your requirement) ---
devices_list = DevicesList()
# devices_list.upsert("122334", name="WATTchdog", online=True, ip=getLocalIp())
# devices_list.upsert("122335", name="WATTchdog", online=True, ip=getLocalIp())
app.config["DEVICES_LIST"] = devices_list

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
