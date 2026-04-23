import os
from flask import Flask

from app.commands import register_commands
from app.config import config_by_name
from app.errors import register_error_handlers
from app.extensions import bcrypt, cors, db, jwt, migrate


def create_app():
    config_name = os.getenv("FLASK_ENV", "default")
    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["default"]))

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app)

    from app.models.role import Role
    from app.models.user import User
    from app.models.faculty import Faculty
    from app.models.association import Association
    from app.models.teacher import Teacher
    from app.api import register_blueprints

    register_blueprints(app)
    register_error_handlers(app)
    register_commands(app)

    return app