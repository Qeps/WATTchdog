import json
import time
import uuid
from typing import Any, Dict, List, Tuple
from logger import Logger

class ConfigValidationError(Exception):
    pass

def validateRecipients(value: Any) -> List[Dict[str, str]]:
    if value is None:
        return []
    if not isinstance(value, list):
        raise ConfigValidationError("recipients must be a list")
    normalized: List[Dict[str, str]] = []
    for item in value:
        if isinstance(item, dict):
            normalized.append({
                "name": str(item.get("name", "")),
                "email": str(item.get("email", "")),
                "number": str(item.get("number", "")),
            })
        else:
            Logger.warning("Skipping non-dict recipient entry")
    return normalized

def validateEvents(value: Any) -> List[Dict[str, Any]]:
    if value is None:
        return []
    if not isinstance(value, list):
        raise ConfigValidationError("events must be a list")
    return value

def prepareConfigPayload(data: Dict[str, Any], devicesList) -> Tuple[str, Dict[str, Any]]:
    if not isinstance(data, dict):
        raise ConfigValidationError("payload must be a JSON object")

    serial = str(data.get("serial", "")).strip()
    if not serial:
        raise ConfigValidationError("missing 'serial'")

    recipients = validateRecipients(data.get("recipients"))
    events = validateEvents(data.get("events"))

    # Warn if serial not known; do not block
    try:
        knownSerials = {d.get("serial") for d in devicesList.list()}
        if serial not in knownSerials:
            Logger.warning(f"Serial '{serial}' not found in devicesList; proceeding")
    except Exception as e:
        Logger.error(f"Could not check devicesList: {e}")

    msgId = str(uuid.uuid4())
    prepared = {
        "id": msgId,
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "serial": serial,
        "recipients": recipients,
        "events": events,
    }

    Logger.debug(f"Config prepared for serial '{serial}' with id '{msgId}'")
    Logger.debug(f"Prepared payload: {json.dumps(prepared, separators=(',', ':'))}")
    return msgId, prepared
