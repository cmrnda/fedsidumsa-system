from marshmallow import Schema, ValidationError, fields, validate, validates_schema


CERTIFICATE_STATUSES = [
    "draft",
    "requested",
    "under_review",
    "approved",
    "rejected",
    "issued",
    "delivered",
    "cancelled",
]


class CertificateTypeCreateSchema(Schema):
    code = fields.String(required=True, validate=validate.Length(min=2, max=50))
    name = fields.String(required=True, validate=validate.Length(min=2, max=120))
    description = fields.String(required=False, allow_none=True)
    requires_event = fields.Boolean(required=False, load_default=False)
    is_active = fields.Boolean(required=False, load_default=True)


class CertificateTypeResponseSchema(Schema):
    id = fields.Integer()
    code = fields.String()
    name = fields.String()
    description = fields.String()
    requires_event = fields.Boolean()
    is_active = fields.Boolean()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class CertificateTemplateCreateSchema(Schema):
    certificate_type_id = fields.Integer(required=True)
    name = fields.String(required=True, validate=validate.Length(min=2, max=150))
    header_text = fields.String(required=False, allow_none=True)
    body_template = fields.String(required=True, validate=validate.Length(min=10))
    footer_text = fields.String(required=False, allow_none=True)
    is_active = fields.Boolean(required=False, load_default=True)


class CertificateTemplateResponseSchema(Schema):
    id = fields.Integer()
    certificate_type_id = fields.Integer()
    name = fields.String()
    header_text = fields.String()
    body_template = fields.String()
    footer_text = fields.String()
    is_active = fields.Boolean()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class CertifiableEventCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=180))
    description = fields.String(required=False, allow_none=True)
    location = fields.String(required=False, allow_none=True, validate=validate.Length(max=180))
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=False, allow_none=True)
    status = fields.String(
        required=False,
        load_default="planned",
        validate=validate.OneOf(["planned", "active", "completed", "cancelled"]),
    )
    supporting_document_id = fields.Integer(required=False, allow_none=True)

    @validates_schema
    def validate_dates(self, data, **kwargs):
        start_date = data.get("start_date")
        end_date = data.get("end_date")

        if start_date and end_date and end_date < start_date:
            raise ValidationError({"end_date": ["End date must be greater than or equal to start date."]})


class CertifiableEventResponseSchema(Schema):
    id = fields.Integer()
    name = fields.String()
    description = fields.String()
    location = fields.String()
    start_date = fields.Date()
    end_date = fields.Date()
    status = fields.String()
    supporting_document_id = fields.Integer()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class EventParticipationCreateSchema(Schema):
    teacher_id = fields.Integer(required=True)
    event_id = fields.Integer(required=True)
    role_name = fields.String(required=False, allow_none=True, validate=validate.Length(max=120))
    participation_type = fields.String(required=False, load_default="participant", validate=validate.Length(max=60))
    status = fields.String(
        required=False,
        load_default="registered",
        validate=validate.OneOf(["registered", "confirmed", "cancelled"]),
    )
    observation = fields.String(required=False, allow_none=True)


class EventParticipationResponseSchema(Schema):
    id = fields.Integer()
    teacher_id = fields.Integer()
    event_id = fields.Integer()
    role_name = fields.String()
    participation_type = fields.String()
    status = fields.String()
    observation = fields.String()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class CertificateSignerInputSchema(Schema):
    appointment_id = fields.Integer(required=True)
    order_index = fields.Integer(required=False, load_default=1)
    label_override = fields.String(required=False, allow_none=True, validate=validate.Length(max=120))


class CertificateCreateSchema(Schema):
    teacher_id = fields.Integer(required=True)
    certificate_type_id = fields.Integer(required=True)
    template_id = fields.Integer(required=True)
    event_id = fields.Integer(required=False, allow_none=True)
    participation_id = fields.Integer(required=False, allow_none=True)
    purpose = fields.String(required=False, allow_none=True, validate=validate.Length(max=180))
    observation = fields.String(required=False, allow_none=True)
    signer_ids = fields.List(fields.Nested(CertificateSignerInputSchema()), required=False, load_default=list)
    status = fields.String(required=False, load_default="draft", validate=validate.OneOf(CERTIFICATE_STATUSES))


class CertificateUpdateSchema(Schema):
    template_id = fields.Integer(required=False)
    event_id = fields.Integer(required=False, allow_none=True)
    participation_id = fields.Integer(required=False, allow_none=True)
    purpose = fields.String(required=False, allow_none=True, validate=validate.Length(max=180))
    observation = fields.String(required=False, allow_none=True)
    signer_ids = fields.List(fields.Nested(CertificateSignerInputSchema()), required=False)


class CertificateStatusActionSchema(Schema):
    reason = fields.String(required=False, allow_none=True)


class AvailableSignerResponseSchema(Schema):
    appointment_id = fields.Integer()
    teacher_id = fields.Integer()
    teacher_name = fields.String()
    position_name = fields.String()
    instance_name = fields.String()
    period_name = fields.String()
    start_date = fields.Date()
    end_date = fields.Date()


class CertificateSignerResponseSchema(Schema):
    id = fields.Integer()
    appointment_id = fields.Integer()
    order_index = fields.Integer()
    label_override = fields.String()
    teacher_name = fields.Method("get_teacher_name")
    position_name = fields.Method("get_position_name")
    instance_name = fields.Method("get_instance_name")

    def get_teacher_name(self, obj):
        return f"{obj.appointment.teacher.first_names} {obj.appointment.teacher.last_names}"

    def get_position_name(self, obj):
        return obj.appointment.position.name

    def get_instance_name(self, obj):
        return obj.appointment.position.instance.name


class CertificateHistoryResponseSchema(Schema):
    id = fields.Integer()
    from_status = fields.String()
    to_status = fields.String()
    changed_by_user_id = fields.Integer()
    changed_by_name = fields.Method("get_changed_by_name")
    reason = fields.String()
    created_at = fields.DateTime()

    def get_changed_by_name(self, obj):
        if not obj.changed_by_user:
            return None
        return obj.changed_by_user.full_name


class CertificateResponseSchema(Schema):
    id = fields.Integer()
    teacher_id = fields.Integer()
    certificate_type_id = fields.Integer()
    template_id = fields.Integer()
    event_id = fields.Integer()
    participation_id = fields.Integer()
    request_number = fields.String()
    requested_by_user_id = fields.Integer()
    status = fields.String()
    purpose = fields.String()
    observation = fields.String()
    rejection_reason = fields.String()
    cancel_reason = fields.String()
    issued_at = fields.DateTime()
    delivered_at = fields.DateTime()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
    teacher_name = fields.Method("get_teacher_name")
    certificate_type_name = fields.Method("get_type_name")
    certificate_type_code = fields.Method("get_type_code")
    template_name = fields.Method("get_template_name")
    event_name = fields.Method("get_event_name")
    signers = fields.Nested(CertificateSignerResponseSchema, many=True)
    history = fields.Nested(CertificateHistoryResponseSchema, many=True)

    def get_teacher_name(self, obj):
        return f"{obj.teacher.first_names} {obj.teacher.last_names}"

    def get_type_name(self, obj):
        return obj.certificate_type.name

    def get_type_code(self, obj):
        return obj.certificate_type.code

    def get_template_name(self, obj):
        return obj.template.name

    def get_event_name(self, obj):
        return obj.event.name if obj.event else None
