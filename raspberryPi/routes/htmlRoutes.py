from flask import Blueprint, render_template
from network.localNetwork import getLocalIp

# Flask "Blueprint" = a modular group of routes that plugs into one Flask app.
# Name is explicit: these are browser-facing HTML routes.
htmlRoutes = Blueprint("htmlRoutes", __name__)

@htmlRoutes.get("/")
def index():
    return render_template(
        "index.html",
        ip=getLocalIp(),
        title="WATTCHdog",
        motto="It watches over your energy.",
    )
