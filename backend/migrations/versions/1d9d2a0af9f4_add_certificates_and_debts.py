"""add certificates and debts

Revision ID: 1d9d2a0af9f4
Revises: d4001e3e0a05
Create Date: 2026-04-24 11:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "1d9d2a0af9f4"
down_revision = "d4001e3e0a05"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "certificate_types",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("requires_event", sa.Boolean(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_table(
        "obligation_concepts",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_table(
        "certifiable_events",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("location", sa.String(length=180), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("supporting_document_id", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("end_date is null or end_date >= start_date", name="ck_certifiable_events_dates"),
        sa.CheckConstraint(
            "status in ('planned','active','completed','cancelled')",
            name="ck_certifiable_events_status",
        ),
        sa.ForeignKeyConstraint(["supporting_document_id"], ["supporting_documents.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "certificate_templates",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("certificate_type_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("header_text", sa.Text(), nullable=True),
        sa.Column("body_template", sa.Text(), nullable=False),
        sa.Column("footer_text", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["certificate_type_id"], ["certificate_types.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("certificate_type_id", "name", name="uq_certificate_templates_type_name"),
    )
    op.create_table(
        "event_participations",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("teacher_id", sa.BigInteger(), nullable=False),
        sa.Column("event_id", sa.BigInteger(), nullable=False),
        sa.Column("role_name", sa.String(length=120), nullable=True),
        sa.Column("participation_type", sa.String(length=60), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("observation", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "status in ('registered','confirmed','cancelled')",
            name="ck_event_participations_status",
        ),
        sa.ForeignKeyConstraint(["event_id"], ["certifiable_events.id"]),
        sa.ForeignKeyConstraint(["teacher_id"], ["teachers.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("teacher_id", "event_id", name="uq_event_participations_teacher_event"),
    )
    op.create_table(
        "teacher_obligations",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("teacher_id", sa.BigInteger(), nullable=False),
        sa.Column("concept_id", sa.BigInteger(), nullable=False),
        sa.Column("reference_label", sa.String(length=180), nullable=True),
        sa.Column("total_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("observation", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("status in ('pending','partial','paid','cancelled')", name="ck_teacher_obligations_status"),
        sa.CheckConstraint("total_amount >= 0", name="ck_teacher_obligations_total_amount_positive"),
        sa.ForeignKeyConstraint(["concept_id"], ["obligation_concepts.id"]),
        sa.ForeignKeyConstraint(["teacher_id"], ["teachers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "certificates",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("teacher_id", sa.BigInteger(), nullable=False),
        sa.Column("certificate_type_id", sa.BigInteger(), nullable=False),
        sa.Column("template_id", sa.BigInteger(), nullable=False),
        sa.Column("event_id", sa.BigInteger(), nullable=True),
        sa.Column("participation_id", sa.BigInteger(), nullable=True),
        sa.Column("request_number", sa.String(length=40), nullable=False),
        sa.Column("requested_by_user_id", sa.BigInteger(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("purpose", sa.String(length=180), nullable=True),
        sa.Column("observation", sa.Text(), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("cancel_reason", sa.Text(), nullable=True),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "status in ('draft','requested','under_review','approved','rejected','issued','delivered','cancelled')",
            name="ck_certificates_status",
        ),
        sa.ForeignKeyConstraint(["certificate_type_id"], ["certificate_types.id"]),
        sa.ForeignKeyConstraint(["event_id"], ["certifiable_events.id"]),
        sa.ForeignKeyConstraint(["participation_id"], ["event_participations.id"]),
        sa.ForeignKeyConstraint(["requested_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["teacher_id"], ["teachers.id"]),
        sa.ForeignKeyConstraint(["template_id"], ["certificate_templates.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("request_number"),
    )
    op.create_table(
        "teacher_payments",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("obligation_id", sa.BigInteger(), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("payment_date", sa.Date(), nullable=False),
        sa.Column("reference", sa.String(length=120), nullable=True),
        sa.Column("observation", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("amount > 0", name="ck_teacher_payments_amount_positive"),
        sa.ForeignKeyConstraint(["obligation_id"], ["teacher_obligations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "certificate_signers",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("certificate_id", sa.BigInteger(), nullable=False),
        sa.Column("appointment_id", sa.BigInteger(), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("label_override", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"]),
        sa.ForeignKeyConstraint(["certificate_id"], ["certificates.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("certificate_id", "appointment_id", name="uq_certificate_signers_certificate_appointment"),
    )
    op.create_table(
        "certificate_status_history",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("certificate_id", sa.BigInteger(), nullable=False),
        sa.Column("from_status", sa.String(length=20), nullable=True),
        sa.Column("to_status", sa.String(length=20), nullable=False),
        sa.Column("changed_by_user_id", sa.BigInteger(), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["certificate_id"], ["certificates.id"]),
        sa.ForeignKeyConstraint(["changed_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("certificate_status_history")
    op.drop_table("certificate_signers")
    op.drop_table("teacher_payments")
    op.drop_table("certificates")
    op.drop_table("teacher_obligations")
    op.drop_table("event_participations")
    op.drop_table("certificate_templates")
    op.drop_table("certifiable_events")
    op.drop_table("obligation_concepts")
    op.drop_table("certificate_types")
