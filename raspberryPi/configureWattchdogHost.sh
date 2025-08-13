#!/usr/bin/env bash
set -euo pipefail

# --- CONFIG ---
PROJECT_DIR="/home/gb/WATTchdog/WATTchdog/raspberryPi"
RUN_USER="${SUDO_USER:-gb}"
PORT="8000"
APP_MODULE="hostServer:app"
SERVICE_NAME="wattchdog"
HOSTNAME_TARGET="wattchdog"
PYTHON_BIN="python3"

die(){ echo "ERROR: $*" >&2; exit 1; }
[ "$(id -u)" -eq 0 ] || die "Run as root: sudo $0"

# --- Install mDNS ---
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y avahi-daemon libnss-mdns
systemctl enable --now avahi-daemon

# --- Set hostname ---
if [ "$(hostnamectl --static)" != "${HOSTNAME_TARGET}" ]; then
  hostnamectl set-hostname "${HOSTNAME_TARGET}"
  systemctl restart avahi-daemon
else
  echo "Hostname already set to ${HOSTNAME_TARGET}"
fi

# --- Check project files ---
[ -d "${PROJECT_DIR}" ] || die "Missing dir: ${PROJECT_DIR}"
[ -f "${PROJECT_DIR}/hostServer.py" ] || die "Missing file: ${PROJECT_DIR}/hostServer.py"

# --- Setup venv & deps ---
cd "${PROJECT_DIR}"
if [ ! -d ".venv" ]; then
  sudo -u "${RUN_USER}" ${PYTHON_BIN} -m venv .venv
fi
sudo -u "${RUN_USER}" bash -lc "source .venv/bin/activate && pip install --upgrade pip && pip install flask gunicorn"

# --- Create systemd service ---
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
cat > "${SERVICE_FILE}" <<EOF
[Unit]
Description=WATTchdog Flask server (Gunicorn)
After=network-online.target avahi-daemon.service
Wants=network-online.target

[Service]
Type=simple
User=${RUN_USER}
WorkingDirectory=${PROJECT_DIR}
Environment=PYTHONUNBUFFERED=1
Environment=PATH=${PROJECT_DIR}/.venv/bin
ExecStart=${PROJECT_DIR}/.venv/bin/gunicorn --bind 0.0.0.0:${PORT} --workers 2 ${APP_MODULE}
Restart=always
RestartSec=2
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# --- Enable & start service ---
systemctl daemon-reload
systemctl enable "${SERVICE_NAME}.service"
systemctl restart "${SERVICE_NAME}.service"
sleep 1
systemctl --no-pager --full status "${SERVICE_NAME}.service" || true

# --- Summary ---
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo "
--- SUMMARY ---
mDNS: http://${HOSTNAME_TARGET}.local:${PORT}/
IP:   http://${IP}:${PORT}/
Logs: journalctl -u ${SERVICE_NAME}.service -n 100 --no-pager
"
