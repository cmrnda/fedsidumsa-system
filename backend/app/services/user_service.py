from app.errors import ApiError
from app.extensions import db
from app.models.role import Role
from app.models.user import User


class UserService:
    def list_users(self, filters=None):
        filters = filters or {}
        query = User.query.join(Role)

        if filters.get("role_id"):
            query = query.filter(User.role_id == filters["role_id"])

        if filters.get("is_active") is not None:
            query = query.filter(User.is_active == filters["is_active"])

        search = (filters.get("search") or "").strip()
        if search:
            pattern = f"%{search}%"
            query = query.filter(
                db.or_(
                    User.username.ilike(pattern),
                    User.full_name.ilike(pattern),
                    User.email.ilike(pattern),
                )
            )

        return query.order_by(User.full_name.asc()).all()

    def list_roles(self):
        return Role.query.filter_by(is_active=True).order_by(Role.name.asc()).all()

    def get_user(self, user_id):
        user = User.query.get(user_id)
        if not user:
            raise ApiError("User not found", 404)
        return user

    def create_user(self, data):
        self.validate_role(data["role_id"])
        self.ensure_unique_identity(data["username"], data.get("email"))

        user = User(
            username=data["username"].strip(),
            full_name=data["full_name"].strip(),
            email=self.normalize_email(data.get("email")),
            role_id=data["role_id"],
            is_active=data.get("is_active", True),
        )
        user.set_password(data["password"])

        db.session.add(user)
        db.session.commit()
        return user

    def update_user(self, user_id, data, current_user_id):
        user = self.get_user(user_id)

        if "role_id" in data:
            self.validate_role(data["role_id"])

        username = data.get("username", user.username)
        email = data.get("email", user.email)
        self.ensure_unique_identity(username, email, user.id)

        if user.id == current_user_id and data.get("is_active") is False:
            raise ApiError("You cannot deactivate your own user", 400)

        if user.id == current_user_id and "role_id" in data and data["role_id"] != user.role_id:
            raise ApiError("You cannot change your own role", 400)

        for key in ["username", "full_name"]:
            if key in data:
                setattr(user, key, data[key].strip())

        if "email" in data:
            user.email = self.normalize_email(data.get("email"))

        if "role_id" in data:
            user.role_id = data["role_id"]

        if "is_active" in data:
            user.is_active = data["is_active"]

        db.session.commit()
        return user

    def change_password(self, user_id, data):
        user = self.get_user(user_id)
        user.set_password(data["password"])
        db.session.commit()
        return user

    def validate_role(self, role_id):
        role = Role.query.filter_by(id=role_id, is_active=True).first()
        if not role:
            raise ApiError("Role not found", 404)
        return role

    def ensure_unique_identity(self, username, email, excluded_user_id=None):
        username = username.strip()
        normalized_email = self.normalize_email(email)

        query = User.query.filter(User.username == username)
        if excluded_user_id:
            query = query.filter(User.id != excluded_user_id)
        if query.first():
            raise ApiError("Username already exists", 409)

        if normalized_email:
            email_query = User.query.filter(User.email == normalized_email)
            if excluded_user_id:
                email_query = email_query.filter(User.id != excluded_user_id)
            if email_query.first():
                raise ApiError("Email already exists", 409)

    def normalize_email(self, email):
        return email.strip().lower() if email else None
