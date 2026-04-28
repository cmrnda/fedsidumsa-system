from app.extensions import db
from app.models.mixins import TimestampMixin


class EventParticipation(db.Model, TimestampMixin):
    __tablename__ = "event_participations"

    id = db.Column(db.BigInteger, primary_key=True)
    teacher_id = db.Column(db.BigInteger, db.ForeignKey("teachers.id"), nullable=False)
    event_id = db.Column(db.BigInteger, db.ForeignKey("certifiable_events.id"), nullable=False)
    role_name = db.Column(db.String(120))
    participation_type = db.Column(db.String(60), nullable=False, default="participant")
    status = db.Column(db.String(20), nullable=False, default="registered")
    observation = db.Column(db.Text)

    teacher = db.relationship("Teacher", back_populates="event_participations")
    event = db.relationship("CertifiableEvent", back_populates="participations")
    certificates = db.relationship("Certificate", back_populates="participation")

    __table_args__ = (
        db.CheckConstraint(
            "status in ('registered','confirmed','cancelled')",
            name="ck_event_participations_status",
        ),
        db.UniqueConstraint("teacher_id", "event_id", name="uq_event_participations_teacher_event"),
    )
