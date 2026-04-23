from marshmallow import Schema, fields, validate


class RegisterSchema(Schema):
    username = fields.String(required=True, validate=validate.Length(min=3, max=80))
    password = fields.String(required=True, validate=validate.Length(min=6))
    full_name = fields.String(required=True, validate=validate.Length(min=3, max=150))
    email = fields.Email(required=False, allow_none=True)
    role_id = fields.Integer(required=True)


class LoginSchema(Schema):
    username = fields.String(required=True)
    password = fields.String(required=True)