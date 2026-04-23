from app.extensions import db
from app.models.mixins import TimestampMixin


class Faculty(db.Model, TimestampMixin):
    __tablename__ = "faculties"

    id = db.Column(db.BigInteger, primary_key=True)
    name = db.Column(db.String(150), nullable=False, unique=True)
    acronym = db.Column(db.String(30))
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    associations = db.relationship("Association", back_populates="faculty")
    teachers = db.relationship("Teacher", back_populates="faculty")