from marshmallow import Schema, fields, validate


class ManagementPeriodCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=100))
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=True)
    status = fields.String(
        required=False,
        load_default="active",
        validate=validate.OneOf(["active", "closed", "cancelled"]),
    )
    observation = fields.String(required=False, allow_none=True)


class ManagementPeriodResponseSchema(Schema):
    id = fields.Integer()
    name = fields.String()
    start_date = fields.Date()
    end_date = fields.Date()
    status = fields.String()
    observation = fields.String()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class OrganizationalInstanceCreateSchema(Schema):
    code = fields.String(required=True, validate=validate.Length(min=2, max=30))
    name = fields.String(required=True, validate=validate.Length(min=2, max=150))
    level = fields.String(
        required=True,
        validate=validate.OneOf(["university", "faculty", "career", "federation", "association", "other"]),
    )
    instance_type = fields.String(
        required=True,
        validate=validate.OneOf(["teacher_representation", "academic_authority", "union_organization", "committee", "other"]),
    )
    is_active = fields.Boolean(required=False, load_default=True)


class OrganizationalInstanceResponseSchema(Schema):
    id = fields.Integer()
    code = fields.String()
    name = fields.String()
    level = fields.String()
    instance_type = fields.String()
    is_active = fields.Boolean()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class PositionGroupCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=100))
    description = fields.String(required=False, allow_none=True)
    is_active = fields.Boolean(required=False, load_default=True)


class PositionGroupResponseSchema(Schema):
    id = fields.Integer()
    name = fields.String()
    description = fields.String()
    is_active = fields.Boolean()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class PositionCreateSchema(Schema):
    instance_id = fields.Integer(required=True)
    position_group_id = fields.Integer(required=True)
    name = fields.String(required=True, validate=validate.Length(min=2, max=150))
    is_exclusive = fields.Boolean(required=False, load_default=True)
    is_active = fields.Boolean(required=False, load_default=True)


class PositionResponseSchema(Schema):
    id = fields.Integer()
    instance_id = fields.Integer()
    position_group_id = fields.Integer()
    name = fields.String()
    is_exclusive = fields.Boolean()
    is_active = fields.Boolean()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class SupportingDocumentCreateSchema(Schema):
    document_type = fields.String(
        required=True,
        validate=validate.OneOf(["resolution", "minutes", "note", "memorandum", "call", "certificate", "other"]),
    )
    document_number = fields.String(required=False, allow_none=True)
    document_date = fields.Date(required=False, allow_none=True)
    description = fields.String(required=False, allow_none=True)
    file_path = fields.String(required=False, allow_none=True)
    file_hash = fields.String(required=False, allow_none=True)
    observation = fields.String(required=False, allow_none=True)


class SupportingDocumentResponseSchema(Schema):
    id = fields.Integer()
    document_type = fields.String()
    document_number = fields.String()
    document_date = fields.Date()
    description = fields.String()
    file_path = fields.String()
    file_hash = fields.String()
    observation = fields.String()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class IncompatibilityRuleCreateSchema(Schema):
    origin_group_id = fields.Integer(required=True)
    target_group_id = fields.Integer(required=True)
    reason = fields.String(required=False, allow_none=True)
    is_active = fields.Boolean(required=False, load_default=True)


class IncompatibilityRuleResponseSchema(Schema):
    id = fields.Integer()
    origin_group_id = fields.Integer()
    target_group_id = fields.Integer()
    reason = fields.String()
    is_active = fields.Boolean()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class AppointmentCreateSchema(Schema):
    teacher_id = fields.Integer(required=True)
    period_id = fields.Integer(required=True)
    position_id = fields.Integer(required=True)
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=False, allow_none=True)
    status = fields.String(
        required=False,
        load_default="active",
        validate=validate.OneOf(["active", "finished", "revoked", "cancelled"]),
    )
    is_signer = fields.Boolean(required=False, load_default=False)
    supporting_document_id = fields.Integer(required=False, allow_none=True)
    observation = fields.String(required=False, allow_none=True)


class AppointmentUpdateSchema(Schema):
    period_id = fields.Integer(required=False)
    position_id = fields.Integer(required=False)
    start_date = fields.Date(required=False)
    end_date = fields.Date(required=False, allow_none=True)
    status = fields.String(
        required=False,
        validate=validate.OneOf(["active", "finished", "revoked", "cancelled"]),
    )
    is_signer = fields.Boolean(required=False)
    supporting_document_id = fields.Integer(required=False, allow_none=True)
    observation = fields.String(required=False, allow_none=True)


class AppointmentResponseSchema(Schema):
    id = fields.Integer()
    teacher_id = fields.Integer()
    period_id = fields.Integer()
    position_id = fields.Integer()
    start_date = fields.Date()
    end_date = fields.Date()
    status = fields.String()
    is_signer = fields.Boolean()
    supporting_document_id = fields.Integer()
    observation = fields.String()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()