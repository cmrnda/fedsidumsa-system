from sqlalchemy import and_, or_

from app.errors import ApiError
from app.extensions import db
from app.models.appointment import Appointment
from app.models.incompatibility_rule import IncompatibilityRule
from app.models.management_period import ManagementPeriod
from app.models.organizational_instance import OrganizationalInstance
from app.models.position import Position
from app.models.position_group import PositionGroup
from app.models.supporting_document import SupportingDocument
from app.models.teacher import Teacher
from app.repositories.appointment_repository import AppointmentRepository


class OrganizationalService:
    def __init__(self):
        self.appointment_repository = AppointmentRepository()

    def list_management_periods(self):
        return ManagementPeriod.query.order_by(ManagementPeriod.start_date.desc()).all()

    def create_management_period(self, data):
        period = ManagementPeriod(**data)
        db.session.add(period)
        db.session.commit()
        db.session.refresh(period)
        return period

    def list_organizational_instances(self):
        return OrganizationalInstance.query.order_by(OrganizationalInstance.name.asc()).all()

    def create_organizational_instance(self, data):
        existing = OrganizationalInstance.query.filter_by(code=data["code"]).first()
        if existing:
            raise ApiError("Organizational instance code already exists", 409)

        instance = OrganizationalInstance(**data)
        db.session.add(instance)
        db.session.commit()
        db.session.refresh(instance)
        return instance

    def list_position_groups(self):
        return PositionGroup.query.order_by(PositionGroup.name.asc()).all()

    def create_position_group(self, data):
        existing = PositionGroup.query.filter_by(name=data["name"]).first()
        if existing:
            raise ApiError("Position group already exists", 409)

        position_group = PositionGroup(**data)
        db.session.add(position_group)
        db.session.commit()
        db.session.refresh(position_group)
        return position_group

    def list_positions(self):
        return Position.query.order_by(Position.name.asc()).all()

    def create_position(self, data):
        instance = db.session.get(OrganizationalInstance, data["instance_id"])
        if not instance:
            raise ApiError("Organizational instance not found", 404)

        position_group = db.session.get(PositionGroup, data["position_group_id"])
        if not position_group:
            raise ApiError("Position group not found", 404)

        existing = Position.query.filter_by(
            instance_id=data["instance_id"],
            name=data["name"],
        ).first()
        if existing:
            raise ApiError("Position already exists for this instance", 409)

        position = Position(**data)
        db.session.add(position)
        db.session.commit()
        db.session.refresh(position)
        return position

    def list_supporting_documents(self):
        return SupportingDocument.query.order_by(SupportingDocument.created_at.desc()).all()

    def create_supporting_document(self, data):
        document = SupportingDocument(**data)
        db.session.add(document)
        db.session.commit()
        db.session.refresh(document)
        return document

    def list_incompatibility_rules(self):
        return IncompatibilityRule.query.order_by(IncompatibilityRule.id.asc()).all()

    def create_incompatibility_rule(self, data):
        origin_group = db.session.get(PositionGroup, data["origin_group_id"])
        if not origin_group:
            raise ApiError("Origin position group not found", 404)

        target_group = db.session.get(PositionGroup, data["target_group_id"])
        if not target_group:
            raise ApiError("Target position group not found", 404)

        if data["origin_group_id"] == data["target_group_id"]:
            raise ApiError("Origin and target position groups must be different", 400)

        existing = IncompatibilityRule.query.filter_by(
            origin_group_id=data["origin_group_id"],
            target_group_id=data["target_group_id"],
        ).first()
        if existing:
            raise ApiError("Incompatibility rule already exists", 409)

        rule = IncompatibilityRule(**data)
        db.session.add(rule)
        db.session.commit()
        db.session.refresh(rule)
        return rule

    def list_appointments(self, filters=None):
        return self.appointment_repository.get_all(filters)

    def get_appointment(self, appointment_id):
        appointment = self.appointment_repository.get_by_id(appointment_id)
        if not appointment:
            raise ApiError("Appointment not found", 404)
        return appointment

    def create_appointment(self, data):
        teacher = db.session.get(Teacher, data["teacher_id"])
        if not teacher:
            raise ApiError("Teacher not found", 404)

        period = db.session.get(ManagementPeriod, data["period_id"])
        if not period:
            raise ApiError("Management period not found", 404)

        position = db.session.get(Position, data["position_id"])
        if not position:
            raise ApiError("Position not found", 404)

        if data.get("supporting_document_id"):
            document = db.session.get(SupportingDocument, data["supporting_document_id"])
            if not document:
                raise ApiError("Supporting document not found", 404)

        overlaps = self.appointment_repository.get_overlapping_active(
            teacher_id=data["teacher_id"],
            start_date=data["start_date"],
            end_date=data.get("end_date"),
        )

        for existing in overlaps:
            if existing.position_id == position.id:
                raise ApiError("Teacher already has this position in an overlapping period", 409)

            if self._has_position_conflict(position, existing.position):
                raise ApiError(
                    f"Incompatible overlapping appointment with position '{existing.position.name}'",
                    409,
                )

        appointment = Appointment(**data)
        db.session.add(appointment)
        db.session.commit()
        db.session.refresh(appointment)
        return appointment

    def update_appointment(self, appointment_id, data):
        appointment = self.get_appointment(appointment_id)

        position_id = data.get("position_id", appointment.position_id)
        position = db.session.get(Position, position_id)
        if not position:
            raise ApiError("Position not found", 404)

        period_id = data.get("period_id", appointment.period_id)
        period = db.session.get(ManagementPeriod, period_id)
        if not period:
            raise ApiError("Management period not found", 404)

        supporting_document_id = data.get("supporting_document_id", appointment.supporting_document_id)
        if supporting_document_id:
            document = db.session.get(SupportingDocument, supporting_document_id)
            if not document:
                raise ApiError("Supporting document not found", 404)

        start_date = data.get("start_date", appointment.start_date)
        end_date = data.get("end_date", appointment.end_date)

        overlaps = self.appointment_repository.get_overlapping_active(
            teacher_id=appointment.teacher_id,
            start_date=start_date,
            end_date=end_date,
            exclude_id=appointment.id,
        )

        for existing in overlaps:
            if existing.position_id == position.id:
                raise ApiError("Teacher already has this position in an overlapping period", 409)

            if self._has_position_conflict(position, existing.position):
                raise ApiError(
                    f"Incompatible overlapping appointment with position '{existing.position.name}'",
                    409,
                )

        for key, value in data.items():
            setattr(appointment, key, value)

        db.session.commit()
        db.session.refresh(appointment)
        return appointment

    def _has_position_conflict(self, new_position, existing_position):
        same_group_conflict = (
            new_position.position_group_id == existing_position.position_group_id
            and (new_position.is_exclusive or existing_position.is_exclusive)
        )

        if same_group_conflict:
            return True

        rule = IncompatibilityRule.query.filter(
            IncompatibilityRule.is_active.is_(True),
            or_(
                and_(
                    IncompatibilityRule.origin_group_id == new_position.position_group_id,
                    IncompatibilityRule.target_group_id == existing_position.position_group_id,
                ),
                and_(
                    IncompatibilityRule.origin_group_id == existing_position.position_group_id,
                    IncompatibilityRule.target_group_id == new_position.position_group_id,
                ),
            ),
        ).first()

        return rule is not None