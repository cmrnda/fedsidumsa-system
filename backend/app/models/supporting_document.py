from app.extensions import db
from app.models.mixins import TimestampMixin


class SupportingDocument(db.Model, TimestampMixin):
    __tablename__ = "supporting_documents"

    id = db.Column(db.BigInteger, primary_key=True)
    document_type = db.Column(db.String(40), nullable=False)
    document_number = db.Column(db.String(100))
    document_date = db.Column(db.Date)
    description = db.Column(db.Text)
    file_path = db.Column(db.Text)
    file_hash = db.Column(db.Text)
    observation = db.Column(db.Text)

    appointments = db.relationship("Appointment", back_populates="supporting_document")

    __table_args__ = (
        db.CheckConstraint(
            "document_type in ('resolution','minutes','note','memorandum','call','certificate','other')",
            name="ck_supporting_documents_type",
        ),
    )