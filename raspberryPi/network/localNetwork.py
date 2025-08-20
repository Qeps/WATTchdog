import socket
from logger import Logger

def getLocalIp() -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception as e:
        Logger.warning(f"Could not determine local IP: {e}")
        ip = "unknown"
    finally:
        s.close()
    return ip
