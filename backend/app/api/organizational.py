from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.pagination import paginate_collection
from app.schemas.organization import (
    AppointmentCreateSchema,
    AppointmentResponseSchema,
    AppointmentUpdateSchema,
    IncompatibilityRuleCreateSchema,
    IncompatibilityRuleResponseSchema,
    ManagementPeriodCreateSchema,
    ManagementPeriodResponseSchema,
    OrganizationalInstanceCreateSchema,
    OrganizationalInstanceResponseSchema,
    PositionCreateSchema,
    PositionGroupCreateSchema,
    PositionGroupResponseSchema,
    PositionResponseSchema,
    SupportingDocumentCreateSchema,
    SupportingDocumentResponseSchema,
)
from app.security.decorators import roles_required
from app.services.organizational_service import OrganizationalService

organizational_bp = Blueprint("organizational", __name__)

organizational_service = OrganizationalService()

management_period_create_schema = ManagementPeriodCreateSchema()
management_period_response_schema = ManagementPeriodResponseSchema()
management_periods_response_schema = ManagementPeriodResponseSchema(many=True)

organizational_instance_create_schema = OrganizationalInstanceCreateSchema()
organizational_instance_response_schema = OrganizationalInstanceResponseSchema()
organizational_instances_response_schema = OrganizationalInstanceResponseSchema(many=True)

position_group_create_schema = PositionGroupCreateSchema()
position_group_response_schema = PositionGroupResponseSchema()
position_groups_response_schema = PositionGroupResponseSchema(many=True)

position_create_schema = PositionCreateSchema()
position_response_schema = PositionResponseSchema()
positions_response_schema = PositionResponseSchema(many=True)

supporting_document_create_schema = SupportingDocumentCreateSchema()
supporting_document_response_schema = SupportingDocumentResponseSchema()
supporting_documents_response_schema = SupportingDocumentResponseSchema(many=True)

incompatibility_rule_create_schema = IncompatibilityRuleCreateSchema()
incompatibility_rule_response_schema = IncompatibilityRuleResponseSchema()
incompatibility_rules_response_schema = IncompatibilityRuleResponseSchema(many=True)

appointment_create_schema = AppointmentCreateSchema()
appointment_update_schema = AppointmentUpdateSchema()
appointment_response_schema = AppointmentResponseSchema()
appointments_response_schema = AppointmentResponseSchema(many=True)


@organizational_bp.get("/periods")
@jwt_required()
def list_management_periods():
    periods = organizational_service.list_management_periods()
    result = paginate_collection(
        periods,
        page=request.args.get("page", type=int),
        per_page=request.args.get("per_page", type=int),
    )
    return jsonify({"data": management_periods_response_schema.dump(result["items"]), "pagination": result["pagination"]}), 200


@organizational_bp.post("/periods")
@roles_required("admin", "administration")
def create_management_period():
    payload = management_period_create_schema.load(request.get_json() or {})
    period = organizational_service.create_management_period(payload)
    return jsonify({"message": "Management period created successfully", "data": management_period_response_schema.dump(period)}), 201


@organizational_bp.get("/instances")
@jwt_required()
def list_organizational_instances():
    instances = organizational_service.list_organizational_instances()
    result = paginate_collection(
        instances,
        page=request.args.get("page", type=int),
        per_page=request.args.get("per_page", type=int),
    )
    return jsonify({"data": organizational_instances_response_schema.dump(result["items"]), "pagination": result["pagination"]}), 200


@organizational_bp.post("/instances")
@roles_required("admin", "administration")
def create_organizational_instance():
    payload = organizational_instance_create_schema.load(request.get_json() or {})
    instance = organizational_service.create_organizational_instance(payload)
    return jsonify({"message": "Organizational instance created successfully", "data": organizational_instance_response_schema.dump(instance)}), 201


@organizational_bp.get("/position-groups")
@jwt_required()
def list_position_groups():
    groups = organizational_service.list_position_groups()
    result = paginate_collection(
        groups,
        page=request.args.get("page", type=int),
        per_page=request.args.get("per_page", type=int),
    )
    return jsonify({"data": position_groups_response_schema.dump(result["items"]), "pagination": result["pagination"]}), 200


@organizational_bp.post("/position-groups")
@roles_required("admin", "administration")
def create_position_group():
    payload = position_group_create_schema.load(request.get_json() or {})
    position_group = organizational_service.create_position_group(payload)
    return jsonify({"message": "Position group created successfully", "data": position_group_response_schema.dump(position_group)}), 201


@organizational_bp.get("/positions")
@jwt_required()
def list_positions():
    positions = organizational_service.list_positions()
    result = paginate_collection(
        positions,
        page=request.args.get("page", type=int),
        per_page=request.args.get("per_page", type=int),
    )
    return jsonify({"data": positions_response_schema.dump(result["items"]), "pagination": result["pagination"]}), 200


@organizational_bp.post("/positions")
@roles_required("admin", "administration")
def create_position():
    payload = position_create_schema.load(request.get_json() or {})
    position = organizational_service.create_position(payload)
    return jsonify({"message": "Position created successfully", "data": position_response_schema.dump(position)}), 201


@organizational_bp.get("/documents")
@jwt_required()
def list_supporting_documents():
    documents = organizational_service.list_supporting_documents()
    result = paginate_collection(
        documents,
        page=request.args.get("page", type=int),
        per_page=request.args.get("per_page", type=int),
    )
    return jsonify({"data": supporting_documents_response_schema.dump(result["items"]), "pagination": result["pagination"]}), 200


@organizational_bp.post("/documents")
@roles_required("admin", "administration")
def create_supporting_document():
    payload = supporting_document_create_schema.load(request.get_json() or {})
    document = organizational_service.create_supporting_document(payload)
    return jsonify({"message": "Supporting document created successfully", "data": supporting_document_response_schema.dump(document)}), 201


@organizational_bp.get("/incompatibility-rules")
@jwt_required()
def list_incompatibility_rules():
    rules = organizational_service.list_incompatibility_rules()
    result = paginate_collection(
        rules,
        page=request.args.get("page", type=int),
        per_page=request.args.get("per_page", type=int),
    )
    return jsonify({"data": incompatibility_rules_response_schema.dump(result["items"]), "pagination": result["pagination"]}), 200


@organizational_bp.post("/incompatibility-rules")
@roles_required("admin", "administration")
def create_incompatibility_rule():
    payload = incompatibility_rule_create_schema.load(request.get_json() or {})
    rule = organizational_service.create_incompatibility_rule(payload)
    return jsonify({"message": "Incompatibility rule created successfully", "data": incompatibility_rule_response_schema.dump(rule)}), 201


@organizational_bp.get("/appointments")
@jwt_required()
def list_appointments():
    filters = {
        "teacher_id": request.args.get("teacher_id", type=int),
        "period_id": request.args.get("period_id", type=int),
        "status": request.args.get("status", type=str),
    }
    appointments = organizational_service.list_appointments(filters)
    result = paginate_collection(
        appointments,
        page=request.args.get("page", type=int),
        per_page=request.args.get("per_page", type=int),
    )
    return jsonify({"data": appointments_response_schema.dump(result["items"]), "pagination": result["pagination"]}), 200


@organizational_bp.get("/appointments/<int:appointment_id>")
@jwt_required()
def get_appointment(appointment_id):
    appointment = organizational_service.get_appointment(appointment_id)
    return jsonify({"data": appointment_response_schema.dump(appointment)}), 200


@organizational_bp.post("/appointments")
@roles_required("admin", "administration")
def create_appointment():
    payload = appointment_create_schema.load(request.get_json() or {})
    appointment = organizational_service.create_appointment(payload)
    return jsonify({"message": "Appointment created successfully", "data": appointment_response_schema.dump(appointment)}), 201


@organizational_bp.put("/appointments/<int:appointment_id>")
@roles_required("admin", "administration")
def update_appointment(appointment_id):
    payload = appointment_update_schema.load(request.get_json() or {})
    appointment = organizational_service.update_appointment(appointment_id, payload)
    return jsonify({"message": "Appointment updated successfully", "data": appointment_response_schema.dump(appointment)}), 200
