from app.extensions import db
from app.models.mixins import TimestampMixin


class Appointment(db.Model, TimestampMixin):
    __tablename__ = "appointments"

    id = db.Column(db.BigInteger, primary_key=True)
    teacher_id = db.Column(db.BigInteger, db.ForeignKey("teachers.id"), nullable=False)
    period_id = db.Column(db.BigInteger, db.ForeignKey("management_periods.id"), nullable=False)
    position_id = db.Column(db.BigInteger, db.ForeignKey("positions.id"), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)
    status = db.Column(db.String(20), nullable=False, default="active")
    is_signer = db.Column(db.Boolean, nullable=False, default=False)
    supporting_document_id = db.Column(db.BigInteger, db.ForeignKey("supporting_documents.id"))
    observation = db.Column(db.Text)

    teacher = db.relationship("Teacher")
    period = db.relationship("ManagementPeriod", back_populates="appointments")
    position = db.relationship("Position", back_populates="appointments")
    supporting_document = db.relationship("SupportingDocument", back_populates="appointments")

    __table_args__ = (
        db.CheckConstraint(
            "status in ('active','finished','revoked','cancelled')",
            name="ck_appointments_status",
        ),
        db.CheckConstraint(
            "end_date is null or end_date >= start_date",
            name="ck_appointments_dates",
        ),
    )