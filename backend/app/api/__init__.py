from app.api.auth import auth_bp
from app.api.certificates import certificates_bp
from app.api.certificates import public_certificates_bp
from app.api.debts import debts_bp
from app.api.health import health_bp
from app.api.organizational import organizational_bp
from app.api.teachers import teachers_bp
from app.api.users import users_bp


def register_blueprints(app):
    app.register_blueprint(health_bp, url_prefix="/api/health")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(teachers_bp, url_prefix="/api/teachers")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(organizational_bp, url_prefix="/api/organizational")
    app.register_blueprint(certificates_bp, url_prefix="/api/certificates")
    app.register_blueprint(public_certificates_bp, url_prefix="/api/public/certificates")
    app.register_blueprint(debts_bp, url_prefix="/api/debts")
