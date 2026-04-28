from marshmallow import Schema, fields, validate


class RoleResponseSchema(Schema):
    id = fields.Integer(dump_only=True)
    name = fields.String()
    description = fields.String(allow_none=True)
    is_active = fields.Boolean()


class UserCreateSchema(Schema):
    username = fields.String(required=True, validate=validate.Length(min=3, max=80))
    password = fields.String(required=True, validate=validate.Length(min=8, max=128))
    full_name = fields.String(required=True, validate=validate.Length(min=3, max=150))
    email = fields.Email(required=False, allow_none=True)
    role_id = fields.Integer(required=True)
    is_active = fields.Boolean(required=False, load_default=True)


class UserUpdateSchema(Schema):
    username = fields.String(required=False, validate=validate.Length(min=3, max=80))
    full_name = fields.String(required=False, validate=validate.Length(min=3, max=150))
    email = fields.Email(required=False, allow_none=True)
    role_id = fields.Integer(required=False)
    is_active = fields.Boolean(required=False)


class UserPasswordUpdateSchema(Schema):
    password = fields.String(required=True, validate=validate.Length(min=8, max=128))


class UserResponseSchema(Schema):
    id = fields.Integer(dump_only=True)
    username = fields.String()
    full_name = fields.String()
    email = fields.String(allow_none=True)
    role_id = fields.Integer()
    role_name = fields.Method("get_role_name")
    is_active = fields.Boolean()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

    def get_role_name(self, user):
        return user.role.name if user.role else None
