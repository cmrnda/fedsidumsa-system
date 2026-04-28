from sqlalchemy import or_
from sqlalchemy.orm import joinedload

from app.models.appointment import Appointment
from app.models.certificate import Certificate
from app.models.certificate_signer import CertificateSigner
from app.models.certificate_status_history import CertificateStatusHistory
from app.models.event_participation import EventParticipation
from app.models.position import Position
from app.models.teacher import Teacher


class CertificateRepository:
    def get_all(self, filters=None):
        query = Certificate.query.options(
            joinedload(Certificate.teacher),
            joinedload(Certificate.certificate_type),
            joinedload(Certificate.template),
            joinedload(Certificate.event),
            joinedload(Certificate.participation),
            joinedload(Certificate.signers).joinedload(CertificateSigner.appointment).joinedload(Appointment.teacher),
            joinedload(Certificate.signers)
            .joinedload(CertificateSigner.appointment)
            .joinedload(Appointment.position)
            .joinedload(Position.instance),
        )

        if filters:
            if filters.get("status"):
                query = query.filter(Certificate.status == filters["status"])
            if filters.get("type_id"):
                query = query.filter(Certificate.certificate_type_id == filters["type_id"])
            if filters.get("teacher_id"):
                query = query.filter(Certificate.teacher_id == filters["teacher_id"])
            if filters.get("event_id"):
                query = query.filter(Certificate.event_id == filters["event_id"])
            if filters.get("date_from"):
                query = query.filter(Certificate.created_at >= filters["date_from"])
            if filters.get("date_to"):
                query = query.filter(Certificate.created_at <= filters["date_to"])
            if filters.get("search"):
                term = f"%{filters['search'].strip()}%"
                query = query.join(Certificate.teacher).outerjoin(Certificate.event).filter(
                    or_(
                        Teacher.first_names.ilike(term),
                        Teacher.last_names.ilike(term),
                        Teacher.ci.ilike(term),
                        Certificate.request_number.ilike(term),
                    )
                )

        return query.order_by(Certificate.created_at.desc()).all()

    def get_by_id(self, certificate_id):
        return Certificate.query.options(
            joinedload(Certificate.teacher),
            joinedload(Certificate.certificate_type),
            joinedload(Certificate.template),
            joinedload(Certificate.event),
            joinedload(Certificate.participation).joinedload(EventParticipation.event),
            joinedload(Certificate.history).joinedload(CertificateStatusHistory.changed_by_user),
            joinedload(Certificate.signers).joinedload(CertificateSigner.appointment).joinedload(Appointment.teacher),
            joinedload(Certificate.signers)
            .joinedload(CertificateSigner.appointment)
            .joinedload(Appointment.position)
            .joinedload(Position.instance),
        ).filter(Certificate.id == certificate_id).first()

    def get_available_signers(self, effective_date=None):
        query = Appointment.query.options(
            joinedload(Appointment.teacher),
            joinedload(Appointment.position).joinedload(Position.instance),
            joinedload(Appointment.period),
        ).filter(
            Appointment.status == "active",
            Appointment.is_signer.is_(True),
        )

        if effective_date:
            query = query.filter(
                Appointment.start_date <= effective_date,
                (Appointment.end_date.is_(None)) | (Appointment.end_date >= effective_date),
            )

        return query.order_by(Appointment.start_date.desc(), Appointment.id.desc()).all()
