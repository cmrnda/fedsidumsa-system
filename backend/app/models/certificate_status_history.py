from app.extensions import db
from app.models.mixins import TimestampMixin


class CertificateStatusHistory(db.Model, TimestampMixin):
    __tablename__ = "certificate_status_history"

    id = db.Column(db.BigInteger, primary_key=True)
    certificate_id = db.Column(db.BigInteger, db.ForeignKey("certificates.id"), nullable=False)
    from_status = db.Column(db.String(20))
    to_status = db.Column(db.String(20), nullable=False)
    changed_by_user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"))
    reason = db.Column(db.Text)

    certificate = db.relationship("Certificate", back_populates="history")
    changed_by_user = db.relationship("User")
