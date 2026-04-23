from app.extensions import db
from app.models.mixins import TimestampMixin


class CertifiableEvent(db.Model, TimestampMixin):
    __tablename__ = "certifiable_events"

    id = db.Column(db.BigInteger, primary_key=True)
    name = db.Column(db.String(180), nullable=False)
    description = db.Column(db.Text)
    location = db.Column(db.String(180))
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)
    status = db.Column(db.String(20), nullable=False, default="planned")
    supporting_document_id = db.Column(db.BigInteger, db.ForeignKey("supporting_documents.id"))

    supporting_document = db.relationship("SupportingDocument")
    participations = db.relationship("EventParticipation", back_populates="event")
    certificates = db.relationship("Certificate", back_populates="event")

    __table_args__ = (
        db.CheckConstraint(
            "status in ('planned','active','completed','cancelled')",
            name="ck_certifiable_events_status",
        ),
        db.CheckConstraint(
            "end_date is null or end_date >= start_date",
            name="ck_certifiable_events_dates",
        ),
    )
