from app.extensions import db
from app.models.mixins import TimestampMixin


class Teacher(db.Model, TimestampMixin):
    __tablename__ = "teachers"

    id = db.Column(db.BigInteger, primary_key=True)
    teacher_code = db.Column(db.String(50))
    ci = db.Column(db.String(20), nullable=False)
    ci_extension = db.Column(db.String(10))
    first_names = db.Column(db.String(120), nullable=False)
    last_names = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150))
    phone = db.Column(db.String(30))
    address = db.Column(db.Text)
    faculty_id = db.Column(db.BigInteger, db.ForeignKey("faculties.id"))
    association_id = db.Column(db.BigInteger, db.ForeignKey("associations.id"))
    base_position = db.Column(db.String(150))
    teacher_type = db.Column(db.String(50))
    teacher_category = db.Column(db.String(50))
    status = db.Column(db.String(20), nullable=False, default="active")

    faculty = db.relationship("Faculty", back_populates="teachers")
    association = db.relationship("Association", back_populates="teachers")
    certificates = db.relationship("Certificate")
    event_participations = db.relationship("EventParticipation")

    __table_args__ = (
        db.UniqueConstraint("ci", "ci_extension", name="uq_teachers_ci_extension"),
        db.CheckConstraint(
            "status in ('active','inactive','retired','leave')",
            name="ck_teachers_status",
        ),
    )
