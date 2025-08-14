from flask import Flask, request, jsonify, render_template
from collections import deque
import socket

app = Flask(__name__)
messages = deque(maxlen=100)

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "unknown"
    finally:
        s.close()
    return ip

@app.route("/", methods=["GET"])
def index():
    return render_template(
        "index.html",
        ip=get_local_ip(),
        title="WATTCHdog",
        motto="It watches over your energy."
    )

# API: accept a message (JSON: {"text":"..."})
@app.route("/api/send", methods=["POST"])
def api_send():
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    if not text:
        return {"status": "error", "msg": "empty"}, 400
    try:
        text.encode("ascii")
    except UnicodeEncodeError:
        text = "".join(ch if ord(ch) < 128 else "?" for ch in text)
    messages.append(text)
    return {"status": "ok", "stored": text, "count": len(messages)}, 200

# API: fetch messages
@app.route("/api/messages", methods=["GET"])
def api_messages():
    return jsonify({"messages": list(messages)})

# (optional) IP as API
@app.route("/api/ip", methods=["GET"])
def api_ip():
    return {"ip": get_local_ip()}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
