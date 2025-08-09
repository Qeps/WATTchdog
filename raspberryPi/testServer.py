from flask import Flask, request, redirect, url_for, render_template_string
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
        ip = "nieznane"
    finally:
        s.close()
    return ip

TEMPLATE = """
<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><title>RPi</title>
<style>
body{font-family:system-ui,Arial;margin:24px}.wrap{display:flex;gap:24px}
.card{border:1px solid #ddd;border-radius:12px;padding:16px;width:420px}
.ip{font-size:24px;font-weight:600}pre{white-space:pre-wrap;word-break:break-word}
textarea{width:100%;height:100px}button{padding:8px 12px;border-radius:8px;border:1px solid #ccc;background:#f6f6f6}
.msg{background:#fafafa;border:1px solid #eee;padding:8px;border-radius:8px;margin:6px 0}
</style></head><body>
<div class="wrap">
  <div class="card">
    <h2>Adres Raspberry Pi w LAN</h2>
    <div class="ip">{{ ip }}</div>
    <p>Wejdź z laptopa: <code>http://{{ ip }}:8000</code></p>
  </div>
  <div class="card">
    <h2>Wyślij znaki ASCII</h2>
    <form action="{{ url_for('send') }}" method="post">
      <textarea name="text" placeholder="Wpisz wiadomość ASCII..."></textarea>
      <div style="margin-top:8px;"><button type="submit">Wyślij</button></div>
    </form>
    <p style="margin-top:12px;">Albo z terminala/Postmana (JSON):</p>
    <pre>POST http://{{ ip }}:8000/api/send
Body (JSON): {"text":"Hello RPi"}</pre>
  </div>
  <div class="card">
    <h2>Odebrane wiadomości</h2>
    {% if messages %}
      {% for m in messages %}<div class="msg"><pre>{{ m }}</pre></div>{% endfor %}
    {% else %}<p>Brak wiadomości.</p>{% endif %}
  </div>
</div>
</body></html>
"""

@app.route("/", methods=["GET"])
def index():
    return render_template_string(TEMPLATE, ip=get_local_ip(), messages=list(messages))

@app.route("/send", methods=["POST"])
def send():
    text = request.form.get("text", "")
    try:
        text.encode("ascii")
    except UnicodeEncodeError:
        text = "".join(ch if ord(ch) < 128 else "?" for ch in text)
    messages.append(text)
    return redirect(url_for("index"))

@app.route("/api/send", methods=["POST"])
def api_send():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    try:
        text.encode("ascii")
    except UnicodeEncodeError:
        text = "".join(ch if ord(ch) < 128 else "?" for ch in text)
    messages.append(text)
    return {"status":"ok","stored":text,"count":len(messages)}, 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
