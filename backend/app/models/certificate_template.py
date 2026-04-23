from app.extensions import db
from app.models.mixins import TimestampMixin


class CertificateTemplate(db.Model, TimestampMixin):
    __tablename__ = "certificate_templates"

    id = db.Column(db.BigInteger, primary_key=True)
    certificate_type_id = db.Column(db.BigInteger, db.ForeignKey("certificate_types.id"), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    header_text = db.Column(db.Text)
    body_template = db.Column(db.Text, nullable=False)
    footer_text = db.Column(db.Text)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    certificate_type = db.relationship("CertificateType", back_populates="templates")
    certificates = db.relationship("Certificate", back_populates="template")

    __table_args__ = (
        db.UniqueConstraint("certificate_type_id", "name", name="uq_certificate_templates_type_name"),
    )
