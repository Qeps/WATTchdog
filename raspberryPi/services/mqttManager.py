"""
Tiny MQTT manager: connects to a broker, subscribes to device topics,
and updates the in-memory DevicesList.

Handled topics:
- devices/<serial>/hello  -> upsert(name?, ip?, online default true)
- devices/<serial>/status -> set_online(online)
"""

import json
from typing import Iterable, Union

from logger import Logger

try:
    import paho.mqtt.client as mqtt  # type: ignore
except Exception:  # pragma: no cover
    mqtt = None


class MqttManager:
    def __init__(self, devices_list, host: str = "wattchdog.local", port: int = 1883):
        self.devices_list = devices_list
        self.host = host
        self.port = port
        self._client = None  # created on start
        self._topics: list[tuple[str, int]] = []

    def subscribe(self, topics: Iterable[Union[str, tuple[str, int]]]) -> None:
        for t in topics:
            if isinstance(t, tuple):
                self._topics.append((t[0], int(t[1])))
            else:
                self._topics.append((t, 0))

    def start(self) -> None:
        if mqtt is None:
            Logger.error("paho-mqtt not installed; MQTT disabled")
            return
        self._client = mqtt.Client(clean_session=True)
        self._client.on_connect = self._on_connect
        self._client.on_message = self._on_message
        try:
            self._client.connect(self.host, self.port, keepalive=60)
            self._client.loop_start()
            Logger.info(f"[MQTT] Connecting to {self.host}:{self.port}")
        except Exception as e:
            Logger.error(f"[MQTT] connect error: {e}")

    def stop(self) -> None:
        if not self._client:
            return
        try:
            self._client.loop_stop()
            self._client.disconnect()
        except Exception as e:
            Logger.error(f"[MQTT] stop error: {e}")

    # ---- MQTT callbacks ----
    def _on_connect(self, client, userdata, flags, rc, properties=None):  # v3/v5 safe
        if rc == 0:
            Logger.info("[MQTT] Connected")
            subs = self._topics or [("devices/+/hello", 0), ("devices/+/status", 0)]
            for s in subs:
                try:
                    client.subscribe(s)
                except Exception as e:
                    Logger.error(f"[MQTT] subscribe failed for {s}: {e}")
        else:
            Logger.error(f"[MQTT] Connection failed rc={rc}")

    def _on_message(self, client, userdata, msg):
        topic = msg.topic
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
        except Exception:
            payload = {}
        parts = topic.split("/")
        if len(parts) != 3 or parts[0] != "devices":
            return
        serial, action = parts[1], parts[2]

        if action == "hello":
            name = payload.get("name") or payload.get("n")
            ip = payload.get("ip")
            online_raw = payload.get("online", payload.get("on", True))
            online = self._to_bool(online_raw)
            fields = {"online": online}
            if name:
                fields["name"] = str(name)
            if ip:
                fields["ip"] = str(ip)
            try:
                self.devices_list.upsert(serial, **fields)
                Logger.info(f"[MQTT] hello -> upsert serial={serial} fields={fields}")
            except Exception as e:
                Logger.error(f"[MQTT] DevicesList upsert error: {e}")
            return

        if action == "status":
            if not isinstance(payload, dict) or ("online" not in payload and "on" not in payload):
                Logger.warning("[MQTT] status payload missing 'online'/'on'")
                return
            online = self._to_bool(payload.get("online", payload.get("on")))
            try:
                self.devices_list.set_online(serial, online)
                Logger.info(f"[MQTT] status -> set_online serial={serial} online={online}")
            except Exception as e:
                Logger.error(f"[MQTT] DevicesList set_online error: {e}")

    # ---- helpers ----
    @staticmethod
    def _to_bool(v) -> bool:
        if isinstance(v, bool):
            return v
        if isinstance(v, (int, float)):
            return v != 0
        s = str(v).strip().lower()
        return s in {"1", "true", "yes", "on"}

