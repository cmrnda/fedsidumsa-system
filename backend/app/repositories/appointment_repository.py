from sqlalchemy.orm import joinedload

from app.models.appointment import Appointment


class AppointmentRepository:
    def get_all(self, filters=None):
        query = Appointment.query.options(
            joinedload(Appointment.position).joinedload("position_group"),
            joinedload(Appointment.position).joinedload("instance"),
            joinedload(Appointment.period),
            joinedload(Appointment.supporting_document),
        )

        if filters:
            if filters.get("teacher_id"):
                query = query.filter(Appointment.teacher_id == filters["teacher_id"])
            if filters.get("period_id"):
                query = query.filter(Appointment.period_id == filters["period_id"])
            if filters.get("status"):
                query = query.filter(Appointment.status == filters["status"])

        return query.order_by(Appointment.start_date.desc()).all()

    def get_by_id(self, appointment_id):
        return Appointment.query.options(
            joinedload(Appointment.position).joinedload("position_group"),
            joinedload(Appointment.position).joinedload("instance"),
            joinedload(Appointment.period),
            joinedload(Appointment.supporting_document),
        ).filter(Appointment.id == appointment_id).first()

    def get_overlapping_active(self, teacher_id, start_date, end_date=None, exclude_id=None):
        query = Appointment.query.options(
            joinedload(Appointment.position).joinedload("position_group"),
            joinedload(Appointment.position).joinedload("instance"),
        ).filter(
            Appointment.teacher_id == teacher_id,
            Appointment.status == "active",
        )

        if exclude_id:
            query = query.filter(Appointment.id != exclude_id)

        query = query.filter(
            (Appointment.end_date.is_(None)) | (Appointment.end_date >= start_date)
        )

        if end_date:
            query = query.filter(Appointment.start_date <= end_date)

        return query.all()