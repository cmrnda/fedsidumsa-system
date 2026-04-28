from app.extensions import db
from app.models.mixins import TimestampMixin


class TeacherObligation(db.Model, TimestampMixin):
    __tablename__ = "teacher_obligations"

    id = db.Column(db.BigInteger, primary_key=True)
    teacher_id = db.Column(db.BigInteger, db.ForeignKey("teachers.id"), nullable=False)
    concept_id = db.Column(db.BigInteger, db.ForeignKey("obligation_concepts.id"), nullable=False)
    reference_label = db.Column(db.String(180))
    total_amount = db.Column(db.Numeric(12, 2), nullable=False)
    due_date = db.Column(db.Date)
    status = db.Column(db.String(20), nullable=False, default="pending")
    observation = db.Column(db.Text)

    teacher = db.relationship("Teacher", back_populates="obligations")
    concept = db.relationship("ObligationConcept", back_populates="obligations")
    payments = db.relationship(
        "TeacherPayment",
        back_populates="obligation",
        cascade="all, delete-orphan",
        order_by="TeacherPayment.payment_date.desc()",
    )

    __table_args__ = (
        db.CheckConstraint(
            "status in ('pending','partial','paid','cancelled')",
            name="ck_teacher_obligations_status",
        ),
        db.CheckConstraint("total_amount >= 0", name="ck_teacher_obligations_total_amount_positive"),
    )

