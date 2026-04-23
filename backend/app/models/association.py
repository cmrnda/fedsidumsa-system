from app.extensions import db
from app.models.mixins import TimestampMixin


class Association(db.Model, TimestampMixin):
    __tablename__ = "associations"

    id = db.Column(db.BigInteger, primary_key=True)
    faculty_id = db.Column(db.BigInteger, db.ForeignKey("faculties.id"), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    acronym = db.Column(db.String(30))
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    faculty = db.relationship("Faculty", back_populates="associations")
    teachers = db.relationship("Teacher", back_populates="association")

    __table_args__ = (
        db.UniqueConstraint("faculty_id", name="uq_associations_faculty_id"),
    )