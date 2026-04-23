from app.extensions import db
from app.models.mixins import TimestampMixin


class CertificateType(db.Model, TimestampMixin):
    __tablename__ = "certificate_types"

    id = db.Column(db.BigInteger, primary_key=True)
    code = db.Column(db.String(50), nullable=False, unique=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    requires_event = db.Column(db.Boolean, nullable=False, default=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    templates = db.relationship("CertificateTemplate", back_populates="certificate_type")
    certificates = db.relationship("Certificate", back_populates="certificate_type")
