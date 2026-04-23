from app.extensions import db
from app.models.mixins import TimestampMixin


class Certificate(db.Model, TimestampMixin):
    __tablename__ = "certificates"

    id = db.Column(db.BigInteger, primary_key=True)
    teacher_id = db.Column(db.BigInteger, db.ForeignKey("teachers.id"), nullable=False)
    certificate_type_id = db.Column(db.BigInteger, db.ForeignKey("certificate_types.id"), nullable=False)
    template_id = db.Column(db.BigInteger, db.ForeignKey("certificate_templates.id"), nullable=False)
    event_id = db.Column(db.BigInteger, db.ForeignKey("certifiable_events.id"))
    participation_id = db.Column(db.BigInteger, db.ForeignKey("event_participations.id"))
    request_number = db.Column(db.String(40), nullable=False, unique=True)
    requested_by_user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"))
    status = db.Column(db.String(20), nullable=False, default="draft")
    purpose = db.Column(db.String(180))
    observation = db.Column(db.Text)
    rejection_reason = db.Column(db.Text)
    cancel_reason = db.Column(db.Text)
    issued_at = db.Column(db.DateTime(timezone=True))
    delivered_at = db.Column(db.DateTime(timezone=True))

    teacher = db.relationship("Teacher")
    certificate_type = db.relationship("CertificateType", back_populates="certificates")
    template = db.relationship("CertificateTemplate", back_populates="certificates")
    event = db.relationship("CertifiableEvent", back_populates="certificates")
    participation = db.relationship("EventParticipation", back_populates="certificates")
    requested_by_user = db.relationship("User")
    signers = db.relationship("CertificateSigner", back_populates="certificate", cascade="all, delete-orphan")
    history = db.relationship(
        "CertificateStatusHistory",
        back_populates="certificate",
        cascade="all, delete-orphan",
        order_by="CertificateStatusHistory.changed_at.desc()",
    )

    __table_args__ = (
        db.CheckConstraint(
            "status in ('draft','requested','under_review','approved','rejected','issued','delivered','cancelled')",
            name="ck_certificates_status",
        ),
    )
