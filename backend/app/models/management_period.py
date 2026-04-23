from app.extensions import db
from app.models.mixins import TimestampMixin


class ManagementPeriod(db.Model, TimestampMixin):
    __tablename__ = "management_periods"

    id = db.Column(db.BigInteger, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="active")
    observation = db.Column(db.Text)

    appointments = db.relationship("Appointment", back_populates="period")

    __table_args__ = (
        db.CheckConstraint(
            "status in ('active','closed','cancelled')",
            name="ck_management_periods_status",
        ),
        db.CheckConstraint(
            "end_date >= start_date",
            name="ck_management_periods_dates",
        ),
    )