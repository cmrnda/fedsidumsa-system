from app.extensions import db
from app.models.mixins import TimestampMixin


class TeacherPayment(db.Model, TimestampMixin):
    __tablename__ = "teacher_payments"

    id = db.Column(db.BigInteger, primary_key=True)
    obligation_id = db.Column(db.BigInteger, db.ForeignKey("teacher_obligations.id"), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    payment_date = db.Column(db.Date, nullable=False)
    reference = db.Column(db.String(120))
    observation = db.Column(db.Text)

    obligation = db.relationship("TeacherObligation", back_populates="payments")

    __table_args__ = (
        db.CheckConstraint("amount > 0", name="ck_teacher_payments_amount_positive"),
    )

