from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.errors import ApiError
from app.pagination import paginate_collection
from app.schemas.certificate import (
    AvailableSignerResponseSchema,
    CertificateCreateSchema,
    CertificateHistoryResponseSchema,
    PublicCertificateLookupSchema,
    PublicCertificateRequestSchema,
    PublicCertificateStatusResponseSchema,
    CertificateResponseSchema,
    CertificateStatusActionSchema,
    CertificateTemplateCreateSchema,
    CertificateTemplateResponseSchema,
    CertificateTypeCreateSchema,
    CertificateTypeResponseSchema,
    CertificateUpdateSchema,
    CertifiableEventCreateSchema,
    CertifiableEventResponseSchema,
    EventParticipationCreateSchema,
    EventParticipationResponseSchema,
    PublicCertificateTypeResponseSchema,
    PublicCertificateValidationResponseSchema,
)
from app.security.decorators import roles_required
from app.services.certificate_service import CertificateService

certificates_bp = Blueprint("certificates", __name__)
public_certificates_bp = Blueprint("public_certificates", __name__)

certificate_service = CertificateService()

certificate_type_create_schema = CertificateTypeCreateSchema()
certificate_type_response_schema = CertificateTypeResponseSchema()
certificate_types_response_schema = CertificateTypeResponseSchema(many=True)

certificate_template_create_schema = CertificateTemplateCreateSchema()
certificate_template_response_schema = CertificateTemplateResponseSchema()
certificate_templates_response_schema = CertificateTemplateResponseSchema(many=True)

event_create_schema = CertifiableEventCreateSchema()
event_response_schema = CertifiableEventResponseSchema()
events_response_schema = CertifiableEventResponseSchema(many=True)

participation_create_schema = EventParticipationCreateSchema()
participation_response_schema = EventParticipationResponseSchema()
participations_response_schema = EventParticipationResponseSchema(many=True)

certificate_create_schema = CertificateCreateSchema()
certificate_update_schema = CertificateUpdateSchema()
certificate_action_schema = CertificateStatusActionSchema()
certificate_response_schema = CertificateResponseSchema()
certificates_response_schema = CertificateResponseSchema(many=True)
available_signers_response_schema = AvailableSignerResponseSchema(many=True)
certificate_history_response_schema = CertificateHistoryResponseSchema(many=True)
public_certificate_type_response_schema = PublicCertificateTypeResponseSchema(many=True)
public_certificate_request_schema = PublicCertificateRequestSchema()
public_certificate_lookup_schema = PublicCertificateLookupSchema()
public_certificate_status_response_schema = PublicCertificateStatusResponseSchema()
public_certificate_validation_response_schema = PublicCertificateValidationResponseSchema()


@certificates_bp.get("/types")
@jwt_required()
def list_certificate_types():
    items = certificate_service.list_certificate_types()
    return jsonify({"data": certificate_types_response_schema.dump(items)}), 200


@certificates_bp.post("/types")
@roles_required("admin", "administration")
def create_certificate_type():
    payload = certificate_type_create_schema.load(request.get_json() or {})
    item = certificate_service.create_certificate_type(payload)
    return jsonify({"message": "Certificate type created successfully", "data": certificate_type_response_schema.dump(item)}), 201


@certificates_bp.get("/templates")
@jwt_required()
def list_certificate_templates():
    items = certificate_service.list_certificate_templates()
    return jsonify({"data": certificate_templates_response_schema.dump(items)}), 200


@certificates_bp.post("/templates")
@roles_required("admin", "administration")
def create_certificate_template():
    payload = certificate_template_create_schema.load(request.get_json() or {})
    item = certificate_service.create_certificate_template(payload)
    return jsonify({"message": "Certificate template created successfully", "data": certificate_template_response_schema.dump(item)}), 201


@certificates_bp.get("/events")
@jwt_required()
def list_events():
    items = certificate_service.list_events()
    return jsonify({"data": events_response_schema.dump(items)}), 200


@certificates_bp.post("/events")
@roles_required("admin", "administration")
def create_event():
    payload = event_create_schema.load(request.get_json() or {})
    item = certificate_service.create_event(payload)
    return jsonify({"message": "Certifiable event created successfully", "data": event_response_schema.dump(item)}), 201


@certificates_bp.get("/participations")
@jwt_required()
def list_participations():
    items = certificate_service.list_participations()
    return jsonify({"data": participations_response_schema.dump(items)}), 200


@certificates_bp.post("/participations")
@roles_required("admin", "administration")
def create_participation():
    payload = participation_create_schema.load(request.get_json() or {})
    item = certificate_service.create_participation(payload)
    return jsonify({"message": "Event participation created successfully", "data": participation_response_schema.dump(item)}), 201


@certificates_bp.get("/available-signers")
@jwt_required()
def list_available_signers():
    effective_date = request.args.get("date", type=str)
    parsed_date = None
    if effective_date:
        from datetime import date

        try:
            parsed_date = date.fromisoformat(effective_date)
        except ValueError as exc:
            raise ApiError("Invalid date filter", 400) from exc

    items = certificate_service.list_available_signers(parsed_date)
    return jsonify({"data": available_signers_response_schema.dump(items)}), 200


@certificates_bp.get("/")
@jwt_required()
def list_certificates():
    filters = {
        "status": request.args.get("status", type=str),
        "type_id": request.args.get("type_id", type=int),
        "teacher_id": request.args.get("teacher_id", type=int),
        "event_id": request.args.get("event_id", type=int),
        "date_from": request.args.get("date_from", type=str),
        "date_to": request.args.get("date_to", type=str),
        "search": request.args.get("search", type=str),
    }
    items = certificate_service.list_certificates(filters)
    result = paginate_collection(
        items,
        page=request.args.get("page", type=int),
        per_page=request.args.get("per_page", type=int),
    )
    return jsonify({"data": certificates_response_schema.dump(result["items"]), "pagination": result["pagination"]}), 200


@certificates_bp.get("/<int:certificate_id>")
@jwt_required()
def get_certificate(certificate_id):
    item = certificate_service.get_certificate(certificate_id)
    return jsonify({"data": certificate_response_schema.dump(item)}), 200


@certificates_bp.post("/")
@roles_required("admin", "administration")
def create_certificate():
    payload = certificate_create_schema.load(request.get_json() or {})
    item = certificate_service.create_certificate(payload)
    return jsonify({"message": "Certificate created successfully", "data": certificate_response_schema.dump(item)}), 201


@certificates_bp.put("/<int:certificate_id>")
@roles_required("admin", "administration")
def update_certificate(certificate_id):
    payload = certificate_update_schema.load(request.get_json() or {})
    item = certificate_service.update_certificate(certificate_id, payload)
    return jsonify({"message": "Certificate updated successfully", "data": certificate_response_schema.dump(item)}), 200


@certificates_bp.get("/<int:certificate_id>/history")
@jwt_required()
def get_certificate_history(certificate_id):
    items = certificate_service.get_certificate_history(certificate_id)
    return jsonify({"data": certificate_history_response_schema.dump(items)}), 200


@certificates_bp.post("/<int:certificate_id>/request")
@roles_required("admin", "administration")
def request_certificate(certificate_id):
    item = certificate_service.request_certificate(certificate_id)
    return jsonify({"message": "Certificate moved to requested", "data": certificate_response_schema.dump(item)}), 200


@certificates_bp.post("/<int:certificate_id>/review")
@roles_required("admin", "administration")
def review_certificate(certificate_id):
    item = certificate_service.review_certificate(certificate_id)
    return jsonify({"message": "Certificate moved to under review", "data": certificate_response_schema.dump(item)}), 200


@certificates_bp.post("/<int:certificate_id>/approve")
@roles_required("admin", "administration")
def approve_certificate(certificate_id):
    item = certificate_service.approve_certificate(certificate_id)
    return jsonify({"message": "Certificate approved successfully", "data": certificate_response_schema.dump(item)}), 200


@certificates_bp.post("/<int:certificate_id>/reject")
@roles_required("admin", "administration")
def reject_certificate(certificate_id):
    payload = certificate_action_schema.load(request.get_json() or {})
    item = certificate_service.reject_certificate(certificate_id, payload.get("reason"))
    return jsonify({"message": "Certificate rejected successfully", "data": certificate_response_schema.dump(item)}), 200


@certificates_bp.post("/<int:certificate_id>/issue")
@roles_required("admin", "administration")
def issue_certificate(certificate_id):
    item = certificate_service.issue_certificate(certificate_id)
    return jsonify({"message": "Certificate issued successfully", "data": certificate_response_schema.dump(item)}), 200


@certificates_bp.post("/<int:certificate_id>/deliver")
@roles_required("admin", "administration")
def deliver_certificate(certificate_id):
    item = certificate_service.deliver_certificate(certificate_id)
    return jsonify({"message": "Certificate delivered successfully", "data": certificate_response_schema.dump(item)}), 200


@certificates_bp.post("/<int:certificate_id>/cancel")
@roles_required("admin", "administration")
def cancel_certificate(certificate_id):
    payload = certificate_action_schema.load(request.get_json() or {})
    item = certificate_service.cancel_certificate(certificate_id, payload.get("reason"))
    return jsonify({"message": "Certificate cancelled successfully", "data": certificate_response_schema.dump(item)}), 200


@public_certificates_bp.get("/types")
def list_public_certificate_types():
    items = certificate_service.list_public_request_types()
    return jsonify({"data": public_certificate_type_response_schema.dump(items)}), 200


@public_certificates_bp.post("/request")
def create_public_certificate_request():
    payload = public_certificate_request_schema.load(request.get_json() or {})
    item = certificate_service.create_public_request(payload)
    return (
        jsonify(
            {
                "message": "Certificate request submitted successfully",
                "data": {
                    "request_number": item.request_number,
                    "status": item.status,
                    "certificate_type_code": item.certificate_type.code,
                },
            }
        ),
        201,
    )


@public_certificates_bp.post("/status")
def get_public_certificate_status():
    payload = public_certificate_lookup_schema.load(request.get_json() or {})
    item = certificate_service.get_public_certificate_status(payload)
    return jsonify({"data": public_certificate_status_response_schema.dump(item)}), 200


@public_certificates_bp.post("/validate")
def validate_public_certificate():
    payload = public_certificate_lookup_schema.load(request.get_json() or {})
    item = certificate_service.validate_public_certificate(payload)
    return jsonify({"data": public_certificate_validation_response_schema.dump(item)}), 200
