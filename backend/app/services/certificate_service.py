from datetime import date, datetime, timezone

from flask_jwt_extended import get_jwt_identity

from app.errors import ApiError
from app.extensions import db
from app.models.appointment import Appointment
from app.models.certificate import Certificate
from app.models.certificate_signer import CertificateSigner
from app.models.certificate_status_history import CertificateStatusHistory
from app.models.certificate_template import CertificateTemplate
from app.models.certificate_type import CertificateType
from app.models.certifiable_event import CertifiableEvent
from app.models.event_participation import EventParticipation
from app.models.supporting_document import SupportingDocument
from app.models.teacher import Teacher
from app.repositories.certificate_repository import CertificateRepository
from app.services.debt_service import DebtService


class CertificateService:
    PUBLIC_REQUEST_TYPE_CODES = {"participation_general"}
    PUBLIC_LOOKUP_TYPE_CODES = {"participation_general", "participation_event", "recognition", "no_debt"}
    STATUS_TRANSITIONS = {
        "draft": {"requested", "cancelled"},
        "requested": {"under_review", "cancelled"},
        "under_review": {"approved", "rejected", "cancelled"},
        "approved": {"issued", "cancelled"},
        "rejected": set(),
        "issued": {"delivered"},
        "delivered": set(),
        "cancelled": set(),
    }

    def __init__(self):
        self.repository = CertificateRepository()
        self.debt_service = DebtService()

    def list_certificate_types(self):
        return CertificateType.query.order_by(CertificateType.name.asc()).all()

    def list_public_request_types(self):
        return (
            CertificateType.query.filter(
                CertificateType.is_active.is_(True),
                CertificateType.code.in_(self.PUBLIC_REQUEST_TYPE_CODES),
            )
            .order_by(CertificateType.name.asc())
            .all()
        )

    def create_certificate_type(self, data):
        existing = CertificateType.query.filter_by(code=data["code"]).first()
        if existing:
            raise ApiError("Certificate type code already exists", 409)

        certificate_type = CertificateType(**data)
        db.session.add(certificate_type)
        db.session.commit()
        db.session.refresh(certificate_type)
        return certificate_type

    def list_certificate_templates(self):
        return CertificateTemplate.query.order_by(CertificateTemplate.created_at.desc()).all()

    def create_certificate_template(self, data):
        certificate_type = db.session.get(CertificateType, data["certificate_type_id"])
        if not certificate_type:
            raise ApiError("Certificate type not found", 404)

        template = CertificateTemplate(**data)
        db.session.add(template)
        db.session.commit()
        db.session.refresh(template)
        return template

    def list_events(self):
        return CertifiableEvent.query.order_by(CertifiableEvent.start_date.desc()).all()

    def create_event(self, data):
        if data.get("supporting_document_id"):
            document = db.session.get(SupportingDocument, data["supporting_document_id"])
            if not document:
                raise ApiError("Supporting document not found", 404)

        event = CertifiableEvent(**data)
        db.session.add(event)
        db.session.commit()
        db.session.refresh(event)
        return event

    def list_participations(self):
        return EventParticipation.query.order_by(EventParticipation.created_at.desc()).all()

    def create_participation(self, data):
        teacher = db.session.get(Teacher, data["teacher_id"])
        if not teacher:
            raise ApiError("Teacher not found", 404)

        event = db.session.get(CertifiableEvent, data["event_id"])
        if not event:
            raise ApiError("Event not found", 404)

        existing = EventParticipation.query.filter_by(
            teacher_id=data["teacher_id"],
            event_id=data["event_id"],
        ).first()
        if existing:
            raise ApiError("Teacher participation already exists for this event", 409)

        participation = EventParticipation(**data)
        db.session.add(participation)
        db.session.commit()
        db.session.refresh(participation)
        return participation

    def list_available_signers(self, effective_date=None):
        signers = self.repository.get_available_signers(effective_date or date.today())
        response = []

        for signer in signers:
            response.append(
                {
                    "appointment_id": signer.id,
                    "teacher_id": signer.teacher_id,
                    "teacher_name": f"{signer.teacher.first_names} {signer.teacher.last_names}",
                    "position_name": signer.position.name,
                    "instance_name": signer.position.instance.name,
                    "period_name": signer.period.name,
                    "start_date": signer.start_date,
                    "end_date": signer.end_date,
                }
            )

        return response

    def list_certificates(self, filters=None):
        normalized_filters = dict(filters or {})

        if normalized_filters.get("date_from"):
            normalized_filters["date_from"] = datetime.fromisoformat(f"{normalized_filters['date_from']}T00:00:00")

        if normalized_filters.get("date_to"):
            normalized_filters["date_to"] = datetime.fromisoformat(f"{normalized_filters['date_to']}T23:59:59")

        return self.repository.get_all(normalized_filters)

    def get_certificate(self, certificate_id):
        certificate = self.repository.get_by_id(certificate_id)
        if not certificate:
            raise ApiError("Certificate not found", 404)
        return certificate

    def create_certificate(self, data):
        teacher = self._get_teacher(data["teacher_id"])
        certificate_type = self._get_certificate_type(data["certificate_type_id"])
        template = self._get_template(data["template_id"], certificate_type.id)
        event = self._validate_event_requirement(certificate_type, data.get("event_id"))
        participation = self._validate_participation(data.get("participation_id"), teacher.id, event.id if event else None)
        requested_by_user_id = self._get_current_user_id()

        certificate = Certificate(
            teacher_id=teacher.id,
            certificate_type_id=certificate_type.id,
            template_id=template.id,
            event_id=event.id if event else None,
            participation_id=participation.id if participation else None,
            request_number=self._generate_request_number(),
            requested_by_user_id=requested_by_user_id,
            status=data.get("status", "draft"),
            purpose=data.get("purpose"),
            observation=data.get("observation"),
        )

        db.session.add(certificate)
        db.session.flush()

        self._replace_signers(certificate, data.get("signer_ids", []))
        self._record_history(certificate, None, certificate.status, requested_by_user_id, None)

        db.session.commit()
        return self.get_certificate(certificate.id)

    def update_certificate(self, certificate_id, data):
        certificate = self.get_certificate(certificate_id)
        certificate_type = certificate.certificate_type

        if "template_id" in data:
            template = self._get_template(data["template_id"], certificate_type.id)
            certificate.template_id = template.id

        if "event_id" in data:
            event = self._validate_event_requirement(certificate_type, data.get("event_id"))
            certificate.event_id = event.id if event else None

        if "participation_id" in data:
            participation = self._validate_participation(
                data.get("participation_id"),
                certificate.teacher_id,
                certificate.event_id,
            )
            certificate.participation_id = participation.id if participation else None

        if "purpose" in data:
            certificate.purpose = data.get("purpose")

        if "observation" in data:
            certificate.observation = data.get("observation")

        if "signer_ids" in data:
            self._replace_signers(certificate, data["signer_ids"])

        db.session.commit()
        return self.get_certificate(certificate.id)

    def request_certificate(self, certificate_id):
        return self._change_status(certificate_id, "requested")

    def review_certificate(self, certificate_id):
        return self._change_status(certificate_id, "under_review")

    def approve_certificate(self, certificate_id):
        return self._change_status(certificate_id, "approved")

    def reject_certificate(self, certificate_id, reason=None):
        return self._change_status(certificate_id, "rejected", reason=reason)

    def issue_certificate(self, certificate_id):
        certificate = self._change_status(certificate_id, "issued")
        certificate.issued_at = datetime.now(timezone.utc)
        db.session.commit()
        return self.get_certificate(certificate.id)

    def deliver_certificate(self, certificate_id):
        certificate = self._change_status(certificate_id, "delivered")
        certificate.delivered_at = datetime.now(timezone.utc)
        db.session.commit()
        return self.get_certificate(certificate.id)

    def cancel_certificate(self, certificate_id, reason=None):
        return self._change_status(certificate_id, "cancelled", reason=reason)

    def get_certificate_history(self, certificate_id):
        return self.get_certificate(certificate_id).history

    def create_public_request(self, data):
        teacher = self._get_teacher_by_identity_document(data["ci"], data.get("ci_extension"))
        certificate_type = self._get_public_request_type(data["certificate_type_code"])

        if certificate_type.requires_event:
            raise ApiError("This certificate type must be processed internally", 400)

        template = self._get_latest_active_template_for_type(certificate_type.id)

        certificate = Certificate(
            teacher_id=teacher.id,
            certificate_type_id=certificate_type.id,
            template_id=template.id,
            request_number=self._generate_request_number(),
            requested_by_user_id=None,
            status="requested",
            purpose=data.get("purpose"),
            observation="Public certificate request",
        )

        db.session.add(certificate)
        db.session.flush()
        self._record_history(certificate, None, certificate.status, None, "Public request")
        db.session.commit()
        return certificate

    def get_public_certificate_status(self, data):
        certificate = self._find_public_certificate(
            request_number=data["request_number"],
            ci=data["ci"],
            ci_extension=data.get("ci_extension"),
        )
        return {
            "request_number": certificate.request_number,
            "certificate_type_code": certificate.certificate_type.code,
            "certificate_type_name": certificate.certificate_type.name,
            "status": certificate.status,
            "public_status": self._public_status_label(certificate.status),
            "created_at": certificate.created_at,
            "issued_at": certificate.issued_at,
            "delivered_at": certificate.delivered_at,
            "message": self._public_status_message(certificate.status),
        }

    def validate_public_certificate(self, data):
        certificate = self._find_public_certificate(
            request_number=data["request_number"],
            ci=data["ci"],
            ci_extension=data.get("ci_extension"),
        )
        is_valid = certificate.status in {"issued", "delivered"}
        return {
            "request_number": certificate.request_number,
            "certificate_type_code": certificate.certificate_type.code,
            "certificate_type_name": certificate.certificate_type.name,
            "is_valid": is_valid,
            "status": certificate.status,
            "public_status": self._public_status_label(certificate.status),
            "issued_at": certificate.issued_at,
            "delivered_at": certificate.delivered_at,
            "message": "Certificate is valid and was issued by the system"
            if is_valid
            else "Certificate exists but is not yet issued for public validation",
        }

    def _change_status(self, certificate_id, to_status, reason=None):
        certificate = self.get_certificate(certificate_id)
        current_status = certificate.status
        requested_by_user_id = self._get_current_user_id()

        if to_status not in self.STATUS_TRANSITIONS.get(current_status, set()):
            raise ApiError(f"Cannot change certificate status from '{current_status}' to '{to_status}'", 400)

        if to_status in {"approved", "issued"} and not certificate.signers:
            raise ApiError("At least one signer is required before approving or issuing the certificate", 400)

        if to_status in {"approved", "issued"} and certificate.certificate_type.code == "no_debt":
            clearance = self.debt_service.get_teacher_clearance(certificate.teacher_id)
            if not clearance["eligible"]:
                raise ApiError(
                    "The teacher has pending obligations and is not eligible for a no debt certificate",
                    400,
                )

        if to_status in {"rejected", "cancelled"} and not reason:
            raise ApiError("A reason is required for this status change", 400)

        if certificate.certificate_type.requires_event and not certificate.event_id:
            raise ApiError("This certificate type requires an event", 400)

        certificate.status = to_status

        if to_status == "rejected":
            certificate.rejection_reason = reason

        if to_status == "cancelled":
            certificate.cancel_reason = reason

        self._record_history(certificate, current_status, to_status, requested_by_user_id, reason)
        db.session.commit()
        return certificate

    def _replace_signers(self, certificate, signer_payloads):
        certificate.signers.clear()

        for item in signer_payloads:
            appointment = self._get_valid_signer_appointment(item["appointment_id"])
            certificate.signers.append(
                CertificateSigner(
                    appointment_id=appointment.id,
                    order_index=item.get("order_index", 1),
                    label_override=item.get("label_override"),
                )
            )

    def _get_teacher(self, teacher_id):
        teacher = db.session.get(Teacher, teacher_id)
        if not teacher:
            raise ApiError("Teacher not found", 404)
        return teacher

    def _get_teacher_by_identity_document(self, ci, ci_extension=None):
        query = Teacher.query.filter(Teacher.ci == ci)
        if ci_extension:
            query = query.filter(Teacher.ci_extension == ci_extension)
        teacher = query.order_by(Teacher.id.desc()).first()
        if not teacher:
            raise ApiError("Teacher not found", 404)
        return teacher

    def _get_certificate_type(self, certificate_type_id):
        certificate_type = db.session.get(CertificateType, certificate_type_id)
        if not certificate_type:
            raise ApiError("Certificate type not found", 404)
        return certificate_type

    def _get_public_request_type(self, code):
        certificate_type = CertificateType.query.filter_by(code=code, is_active=True).first()
        if not certificate_type:
            raise ApiError("Certificate type not found", 404)
        if certificate_type.code not in self.PUBLIC_REQUEST_TYPE_CODES:
            raise ApiError("This certificate type cannot be requested publicly", 403)
        if certificate_type.code == "no_debt":
            raise ApiError("No debt certificates must be processed internally after financial validation", 403)
        return certificate_type

    def _get_template(self, template_id, certificate_type_id):
        template = db.session.get(CertificateTemplate, template_id)
        if not template:
            raise ApiError("Certificate template not found", 404)
        if template.certificate_type_id != certificate_type_id:
            raise ApiError("Certificate template does not belong to the selected certificate type", 400)
        return template

    def _get_latest_active_template_for_type(self, certificate_type_id):
        template = (
            CertificateTemplate.query.filter_by(certificate_type_id=certificate_type_id, is_active=True)
            .order_by(CertificateTemplate.created_at.desc())
            .first()
        )
        if not template:
            raise ApiError("No active template is configured for this certificate type", 409)
        return template

    def _validate_event_requirement(self, certificate_type, event_id):
        if certificate_type.requires_event and not event_id:
            raise ApiError("This certificate type requires an event", 400)

        if not event_id:
            return None

        event = db.session.get(CertifiableEvent, event_id)
        if not event:
            raise ApiError("Event not found", 404)
        return event

    def _validate_participation(self, participation_id, teacher_id, event_id):
        if not participation_id:
            return None

        participation = db.session.get(EventParticipation, participation_id)
        if not participation:
            raise ApiError("Participation not found", 404)
        if participation.teacher_id != teacher_id:
            raise ApiError("Participation does not belong to the selected teacher", 400)
        if event_id and participation.event_id != event_id:
            raise ApiError("Participation does not belong to the selected event", 400)
        return participation

    def _get_valid_signer_appointment(self, appointment_id):
        appointment = db.session.get(Appointment, appointment_id)
        if not appointment:
            raise ApiError("Signer appointment not found", 404)
        if appointment.status != "active" or not appointment.is_signer:
            raise ApiError("Appointment is not valid as a certificate signer", 400)
        today = date.today()
        if appointment.start_date > today or (appointment.end_date and appointment.end_date < today):
            raise ApiError("Appointment is outside its valid signing period", 400)
        return appointment

    def _record_history(self, certificate, from_status, to_status, changed_by_user_id, reason):
        db.session.add(
            CertificateStatusHistory(
                certificate_id=certificate.id,
                from_status=from_status,
                to_status=to_status,
                changed_by_user_id=changed_by_user_id,
                reason=reason,
            )
        )

    def _generate_request_number(self):
        current_year = datetime.now(timezone.utc).year
        count = Certificate.query.count() + 1
        return f"CERT-{current_year}-{count:05d}"

    def _get_current_user_id(self):
        identity = get_jwt_identity()
        return int(identity) if identity else None

    def _find_public_certificate(self, request_number, ci, ci_extension=None):
        query = (
            Certificate.query.join(Certificate.teacher).join(Certificate.certificate_type).filter(
                Certificate.request_number == request_number,
                Teacher.ci == ci,
            )
        )

        if ci_extension:
            query = query.filter(Teacher.ci_extension == ci_extension)

        certificate = query.first()
        if not certificate:
            raise ApiError("Certificate request not found", 404)
        if certificate.certificate_type.code not in self.PUBLIC_LOOKUP_TYPE_CODES:
            raise ApiError("This certificate type is not available for public lookup", 403)
        return certificate

    def _public_status_message(self, status):
        return {
            "requested": "The request was received and is awaiting administrative review",
            "under_review": "The request is currently under administrative review",
            "approved": "The request was approved and is pending issuance",
            "issued": "The certificate was issued and is ready for validation or delivery",
            "delivered": "The certificate was already delivered",
            "rejected": "The request was rejected",
            "cancelled": "The request was cancelled",
            "draft": "The request is still being prepared internally",
        }.get(status, status)

    def _public_status_label(self, status):
        return {
            "draft": "En preparación",
            "requested": "Recibido",
            "under_review": "En revisión",
            "approved": "Aprobado",
            "rejected": "Rechazado",
            "issued": "Emitido",
            "delivered": "Entregado",
            "cancelled": "Cancelado",
        }.get(status, status)
