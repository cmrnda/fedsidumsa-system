from marshmallow import Schema, fields, validate


class TeacherCreateSchema(Schema):
    teacher_code = fields.String(required=False, allow_none=True)
    ci = fields.String(required=True, validate=validate.Length(min=1, max=20))
    ci_extension = fields.String(required=False, allow_none=True, validate=validate.Length(max=10))
    first_names = fields.String(required=True, validate=validate.Length(min=2, max=120))
    last_names = fields.String(required=True, validate=validate.Length(min=2, max=150))
    email = fields.Email(required=False, allow_none=True)
    phone = fields.String(required=False, allow_none=True, validate=validate.Length(max=30))
    address = fields.String(required=False, allow_none=True)
    faculty_id = fields.Integer(required=False, allow_none=True)
    association_id = fields.Integer(required=False, allow_none=True)
    base_position = fields.String(required=False, allow_none=True, validate=validate.Length(max=150))
    teacher_type = fields.String(required=False, allow_none=True, validate=validate.Length(max=50))
    teacher_category = fields.String(required=False, allow_none=True, validate=validate.Length(max=50))
    status = fields.String(
        required=False,
        load_default="active",
        validate=validate.OneOf(["active", "inactive", "retired", "leave"]),
    )


class TeacherUpdateSchema(Schema):
    teacher_code = fields.String(required=False, allow_none=True)
    first_names = fields.String(required=False)
    last_names = fields.String(required=False)
    email = fields.Email(required=False, allow_none=True)
    phone = fields.String(required=False, allow_none=True)
    address = fields.String(required=False, allow_none=True)
    faculty_id = fields.Integer(required=False, allow_none=True)
    association_id = fields.Integer(required=False, allow_none=True)
    base_position = fields.String(required=False, allow_none=True)
    teacher_type = fields.String(required=False, allow_none=True)
    teacher_category = fields.String(required=False, allow_none=True)
    status = fields.String(
        required=False,
        validate=validate.OneOf(["active", "inactive", "retired", "leave"]),
    )


class TeacherResponseSchema(Schema):
    id = fields.Integer(dump_only=True)
    teacher_code = fields.String()
    ci = fields.String()
    ci_extension = fields.String()
    first_names = fields.String()
    last_names = fields.String()
    email = fields.String()
    phone = fields.String()
    address = fields.String()
    faculty_id = fields.Integer()
    association_id = fields.Integer()
    base_position = fields.String()
    teacher_type = fields.String()
    teacher_category = fields.String()
    status = fields.String()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()