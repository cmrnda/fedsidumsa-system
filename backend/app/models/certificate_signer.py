from app.extensions import db
from app.models.mixins import TimestampMixin


class CertificateSigner(db.Model, TimestampMixin):
    __tablename__ = "certificate_signers"

    id = db.Column(db.BigInteger, primary_key=True)
    certificate_id = db.Column(db.BigInteger, db.ForeignKey("certificates.id"), nullable=False)
    appointment_id = db.Column(db.BigInteger, db.ForeignKey("appointments.id"), nullable=False)
    order_index = db.Column(db.Integer, nullable=False, default=1)
    label_override = db.Column(db.String(120))

    certificate = db.relationship("Certificate", back_populates="signers")
    appointment = db.relationship("Appointment")

    __table_args__ = (
        db.UniqueConstraint("certificate_id", "appointment_id", name="uq_certificate_signers_certificate_appointment"),
    )
