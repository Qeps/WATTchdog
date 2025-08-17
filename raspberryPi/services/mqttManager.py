class MqttManager:
    def __init__(self, host="127.0.0.1", port=1883):
        self.host = host
        self.port = port

    def start(self):
        print(f"[MQTT] connected to {self.host}:{self.port}")

    def publish_config(self, serial, payload):
        print(f"[MQTT] sent to {serial}: {payload}")
