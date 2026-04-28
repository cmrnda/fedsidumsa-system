from app.extensions import db
from app.models.mixins import TimestampMixin


class ObligationConcept(db.Model, TimestampMixin):
    __tablename__ = "obligation_concepts"

    id = db.Column(db.BigInteger, primary_key=True)
    code = db.Column(db.String(50), nullable=False, unique=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    obligations = db.relationship("TeacherObligation", back_populates="concept")

