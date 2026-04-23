from flask_jwt_extended import create_access_token

from app.errors import ApiError
from app.models.user import User


class AuthService:
    def login(self, data):
        user = User.query.filter_by(username=data["username"], is_active=True).first()
        if not user or not user.check_password(data["password"]):
            raise ApiError("Invalid credentials", 401)

        token = create_access_token(
            identity=str(user.id),
            additional_claims={"role": user.role.name},
        )

        return {
            "access_token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role.name,
            },
        }

    def get_current_user(self, user_id):
        user = User.query.filter_by(id=user_id, is_active=True).first()
        if not user:
            raise ApiError("User not found", 404)

        return {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role.name,
        }