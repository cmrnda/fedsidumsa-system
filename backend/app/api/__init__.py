from app.api.auth import auth_bp
from app.api.health import health_bp
from app.api.teachers import teachers_bp


def register_blueprints(app):
    app.register_blueprint(health_bp, url_prefix="/api/health")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(teachers_bp, url_prefix="/api/teachers")