from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.pagination import paginate_collection
from app.schemas.teacher import TeacherCreateSchema, TeacherResponseSchema, TeacherUpdateSchema
from app.security.decorators import roles_required
from app.services.teacher_service import TeacherService

teachers_bp = Blueprint("teachers", __name__)

teacher_service = TeacherService()
teacher_create_schema = TeacherCreateSchema()
teacher_update_schema = TeacherUpdateSchema()
teacher_response_schema = TeacherResponseSchema()
teachers_response_schema = TeacherResponseSchema(many=True)


@teachers_bp.get("/")
@jwt_required()
def list_teachers():
    filters = {
        "faculty_id": request.args.get("faculty_id", type=int),
        "association_id": request.args.get("association_id", type=int),
        "status": request.args.get("status", type=str),
    }
    teachers = teacher_service.list_teachers(filters)
    result = paginate_collection(
        teachers,
        page=request.args.get("page", type=int),
        per_page=request.args.get("per_page", type=int),
    )
    return jsonify({"data": teachers_response_schema.dump(result["items"]), "pagination": result["pagination"]}), 200


@teachers_bp.get("/<int:teacher_id>")
@jwt_required()
def get_teacher(teacher_id):
    teacher = teacher_service.get_teacher(teacher_id)
    return jsonify({"data": teacher_response_schema.dump(teacher)}), 200


@teachers_bp.post("/")
@roles_required("admin", "administration")
def create_teacher():
    payload = teacher_create_schema.load(request.get_json() or {})
    teacher = teacher_service.create_teacher(payload)
    return jsonify({"message": "Teacher created successfully", "data": teacher_response_schema.dump(teacher)}), 201


@teachers_bp.put("/<int:teacher_id>")
@roles_required("admin", "administration")
def update_teacher(teacher_id):
    payload = teacher_update_schema.load(request.get_json() or {})
    teacher = teacher_service.update_teacher(teacher_id, payload)
    return jsonify({"message": "Teacher updated successfully", "data": teacher_response_schema.dump(teacher)}), 200
