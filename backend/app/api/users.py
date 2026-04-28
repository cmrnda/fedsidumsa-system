from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.pagination import paginate_collection
from app.schemas.user import (
    RoleResponseSchema,
    UserCreateSchema,
    UserPasswordUpdateSchema,
    UserResponseSchema,
    UserUpdateSchema,
)
from app.security.decorators import roles_required
from app.services.user_service import UserService

users_bp = Blueprint("users", __name__)

user_service = UserService()
role_response_schema = RoleResponseSchema(many=True)
user_create_schema = UserCreateSchema()
user_update_schema = UserUpdateSchema()
user_password_update_schema = UserPasswordUpdateSchema()
user_response_schema = UserResponseSchema()
users_response_schema = UserResponseSchema(many=True)


@users_bp.get("/")
@roles_required("admin")
def list_users():
    is_active = request.args.get("is_active")
    filters = {
        "role_id": request.args.get("role_id", type=int),
        "search": request.args.get("search", type=str),
        "is_active": None if is_active in (None, "") else is_active.lower() == "true",
    }
    users = user_service.list_users(filters)
    result = paginate_collection(
        users,
        page=request.args.get("page", type=int),
        per_page=request.args.get("per_page", type=int),
    )
    return jsonify({"data": users_response_schema.dump(result["items"]), "pagination": result["pagination"]}), 200


@users_bp.get("/roles")
@roles_required("admin")
def list_roles():
    roles = user_service.list_roles()
    return jsonify({"data": role_response_schema.dump(roles)}), 200


@users_bp.post("/")
@roles_required("admin")
def create_user():
    payload = user_create_schema.load(request.get_json() or {})
    user = user_service.create_user(payload)
    return jsonify({"message": "User created successfully", "data": user_response_schema.dump(user)}), 201


@users_bp.put("/<int:user_id>")
@roles_required("admin")
def update_user(user_id):
    payload = user_update_schema.load(request.get_json() or {})
    current_user_id = int(get_jwt_identity())
    user = user_service.update_user(user_id, payload, current_user_id)
    return jsonify({"message": "User updated successfully", "data": user_response_schema.dump(user)}), 200


@users_bp.put("/<int:user_id>/password")
@roles_required("admin")
def change_user_password(user_id):
    payload = user_password_update_schema.load(request.get_json() or {})
    user = user_service.change_password(user_id, payload)
    return jsonify({"message": "Password updated successfully", "data": user_response_schema.dump(user)}), 200
