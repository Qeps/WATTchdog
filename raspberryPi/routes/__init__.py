from .htmlRoutes import htmlRoutes
from .jsonRoutes import jsonRoutes

def registerRoutes(app) -> None:
    # Internally uses Flask's register_blueprint to attach route groups.
    app.register_blueprint(htmlRoutes)
    app.register_blueprint(jsonRoutes, url_prefix="/api")
