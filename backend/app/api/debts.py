from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.pagination import paginate_collection
from app.schemas.debt import (
    ObligationConceptCreateSchema,
    ObligationConceptResponseSchema,
    TeacherClearanceResponseSchema,
    TeacherObligationCreateSchema,
    TeacherObligationResponseSchema,
    TeacherPaymentCreateSchema,
    TeacherStatementResponseSchema,
)
from app.security.decorators import roles_required
from app.services.debt_service import DebtService

debts_bp = Blueprint("debts", __name__)

debt_service = DebtService()

concept_create_schema = ObligationConceptCreateSchema()
concept_response_schema = ObligationConceptResponseSchema()
concepts_response_schema = ObligationConceptResponseSchema(many=True)

obligation_create_schema = TeacherObligationCreateSchema()
obligation_response_schema = TeacherObligationResponseSchema()
obligations_response_schema = TeacherObligationResponseSchema(many=True)

payment_create_schema = TeacherPaymentCreateSchema()
statement_response_schema = TeacherStatementResponseSchema()
clearance_response_schema = TeacherClearanceResponseSchema()


@debts_bp.get("/concepts")
@jwt_required()
def list_concepts():
    items = debt_service.list_concepts()
    return jsonify({"data": concepts_response_schema.dump(items)}), 200


@debts_bp.post("/concepts")
@roles_required("admin", "administration")
def create_concept():
    payload = concept_create_schema.load(request.get_json() or {})
    item = debt_service.create_concept(payload)
    return jsonify({"message": "Obligation concept created successfully", "data": concept_response_schema.dump(item)}), 201


@debts_bp.get("/obligations")
@jwt_required()
def list_obligations():
    filters = {
        "teacher_id": request.args.get("teacher_id", type=int),
        "status": request.args.get("status", type=str),
        "concept_id": request.args.get("concept_id", type=int),
    }
    items = debt_service.list_obligations(filters)
    result = paginate_collection(
        items,
        page=request.args.get("page", type=int),
        per_page=request.args.get("per_page", type=int),
    )
    return jsonify({"data": obligations_response_schema.dump(result["items"]), "pagination": result["pagination"]}), 200


@debts_bp.post("/obligations")
@roles_required("admin", "administration")
def create_obligation():
    payload = obligation_create_schema.load(request.get_json() or {})
    item = debt_service.create_obligation(payload)
    return jsonify({"message": "Obligation created successfully", "data": obligation_response_schema.dump(item)}), 201


@debts_bp.get("/obligations/<int:obligation_id>")
@jwt_required()
def get_obligation(obligation_id):
    item = debt_service.get_obligation(obligation_id)
    return jsonify({"data": obligation_response_schema.dump(item)}), 200


@debts_bp.post("/obligations/<int:obligation_id>/payments")
@roles_required("admin", "administration")
def add_payment(obligation_id):
    payload = payment_create_schema.load(request.get_json() or {})
    item = debt_service.add_payment(obligation_id, payload)
    return jsonify({"message": "Payment registered successfully", "data": obligation_response_schema.dump(item)}), 201


@debts_bp.get("/teachers/<int:teacher_id>/statement")
@jwt_required()
def get_teacher_statement(teacher_id):
    item = debt_service.get_teacher_statement(teacher_id)
    return jsonify({"data": statement_response_schema.dump(item)}), 200


@debts_bp.get("/teachers/<int:teacher_id>/clearance")
@jwt_required()
def get_teacher_clearance(teacher_id):
    item = debt_service.get_teacher_clearance(teacher_id)
    return jsonify({"data": clearance_response_schema.dump(item)}), 200


@debts_bp.get("/dashboard-summary")
@jwt_required()
def get_dashboard_summary():
    item = debt_service.get_dashboard_summary()
    return jsonify({"data": item}), 200
