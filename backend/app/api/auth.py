from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.schemas.auth import LoginSchema
from app.services.auth_service import AuthService

auth_bp = Blueprint("auth", __name__)

auth_service = AuthService()
login_schema = LoginSchema()


@auth_bp.post("/login")
def login():
    payload = login_schema.load(request.get_json() or {})
    result = auth_service.login(payload)
    return jsonify(result), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = auth_service.get_current_user(user_id)
    return jsonify({"data": user}), 200