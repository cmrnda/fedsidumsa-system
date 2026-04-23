from functools import wraps

from flask_jwt_extended import get_jwt, verify_jwt_in_request

from app.errors import ApiError


def roles_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get("role")

            if user_role not in allowed_roles:
                raise ApiError("You do not have permission to perform this action", 403)

            return fn(*args, **kwargs)

        return wrapper

    return decorator