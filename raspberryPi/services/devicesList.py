import time

class DevicesList:
    def __init__(self):
        self.devicesList = {}

    def upsert(self, serial: str, **fields):
        now = time.time()
        rec = self.devicesList.get(serial, {"serial": serial})
        rec.update(fields)
        rec["last_seen"] = now
        self.devicesList[serial] = rec

    def set_online(self, serial: str, online: bool):
        if serial in self.devicesList:
            self.devicesList[serial]["online"] = online
            self.devicesList[serial]["last_seen"] = time.time()

    def list(self):
        return list(self.devicesList.values())
