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

    from app.models.appointment import Appointment
    from app.models.certificate import Certificate
    from app.models.certificate_signer import CertificateSigner
    from app.models.certificate_status_history import CertificateStatusHistory
    from app.models.certificate_template import CertificateTemplate
    from app.models.certificate_type import CertificateType
    from app.models.certifiable_event import CertifiableEvent
    from app.models.event_participation import EventParticipation
    from app.models.obligation_concept import ObligationConcept
    from app.models.association import Association
    from app.models.faculty import Faculty
    from app.models.incompatibility_rule import IncompatibilityRule
    from app.models.management_period import ManagementPeriod
    from app.models.organizational_instance import OrganizationalInstance
    from app.models.position import Position
    from app.models.position_group import PositionGroup
    from app.models.role import Role
    from app.models.supporting_document import SupportingDocument
    from app.models.teacher import Teacher
    from app.models.teacher_obligation import TeacherObligation
    from app.models.teacher_payment import TeacherPayment
    from app.models.user import User
    from app.api import register_blueprints

    register_blueprints(app)
    register_error_handlers(app)
    register_commands(app)

    return app
