from decimal import Decimal

from marshmallow import Schema, ValidationError, fields, validate, validates_schema


OBLIGATION_STATUSES = ["pending", "partial", "paid", "cancelled"]


class ObligationConceptCreateSchema(Schema):
    code = fields.String(required=True, validate=validate.Length(min=2, max=50))
    name = fields.String(required=True, validate=validate.Length(min=2, max=120))
    description = fields.String(required=False, allow_none=True)
    is_active = fields.Boolean(required=False, load_default=True)


class ObligationConceptResponseSchema(Schema):
    id = fields.Integer()
    code = fields.String()
    name = fields.String()
    description = fields.String()
    is_active = fields.Boolean()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class TeacherObligationCreateSchema(Schema):
    teacher_id = fields.Integer(required=True)
    concept_id = fields.Integer(required=True)
    reference_label = fields.String(required=False, allow_none=True, validate=validate.Length(max=180))
    total_amount = fields.Decimal(required=True, as_string=False, places=2)
    due_date = fields.Date(required=False, allow_none=True)
    observation = fields.String(required=False, allow_none=True)

    @validates_schema
    def validate_amount(self, data, **kwargs):
        total_amount = data.get("total_amount")
        if total_amount is not None and total_amount <= Decimal("0"):
            raise ValidationError({"total_amount": ["Amount must be greater than zero."]})


class TeacherPaymentCreateSchema(Schema):
    amount = fields.Decimal(required=True, as_string=False, places=2)
    payment_date = fields.Date(required=True)
    reference = fields.String(required=False, allow_none=True, validate=validate.Length(max=120))
    observation = fields.String(required=False, allow_none=True)

    @validates_schema
    def validate_amount(self, data, **kwargs):
        amount = data.get("amount")
        if amount is not None and amount <= Decimal("0"):
            raise ValidationError({"amount": ["Amount must be greater than zero."]})


class TeacherPaymentResponseSchema(Schema):
    id = fields.Integer()
    amount = fields.Decimal(as_string=False, places=2)
    payment_date = fields.Date()
    reference = fields.String()
    observation = fields.String()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class TeacherObligationResponseSchema(Schema):
    id = fields.Integer()
    teacher_id = fields.Integer()
    concept_id = fields.Integer()
    reference_label = fields.String()
    total_amount = fields.Decimal(as_string=False, places=2)
    due_date = fields.Date()
    status = fields.String(validate=validate.OneOf(OBLIGATION_STATUSES))
    observation = fields.String()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
    concept_name = fields.Method("get_concept_name")
    teacher_name = fields.Method("get_teacher_name")
    paid_amount = fields.Method("get_paid_amount")
    balance = fields.Method("get_balance")
    payments = fields.Nested(TeacherPaymentResponseSchema, many=True)

    def get_concept_name(self, obj):
        return obj.concept.name

    def get_teacher_name(self, obj):
        return f"{obj.teacher.first_names} {obj.teacher.last_names}"

    def get_paid_amount(self, obj):
        total = sum((payment.amount for payment in obj.payments), Decimal("0"))
        return float(total)

    def get_balance(self, obj):
        total_paid = sum((payment.amount for payment in obj.payments), Decimal("0"))
        return float(max(Decimal("0"), obj.total_amount - total_paid))


class TeacherStatementResponseSchema(Schema):
    teacher_id = fields.Integer()
    teacher_name = fields.String()
    obligations = fields.Nested(TeacherObligationResponseSchema, many=True)
    total_obligated = fields.Float()
    total_paid = fields.Float()
    pending_amount = fields.Float()
    pending_obligations_count = fields.Integer()
    eligible_for_no_debt = fields.Boolean()
    message = fields.String()


class TeacherClearanceResponseSchema(Schema):
    teacher_id = fields.Integer()
    teacher_name = fields.String()
    eligible = fields.Boolean()
    pending_amount = fields.Float()
    pending_obligations_count = fields.Integer()
    message = fields.String()
