from app.extensions import db
from app.models.mixins import TimestampMixin


class OrganizationalInstance(db.Model, TimestampMixin):
    __tablename__ = "organizational_instances"

    id = db.Column(db.BigInteger, primary_key=True)
    code = db.Column(db.String(30), nullable=False, unique=True)
    name = db.Column(db.String(150), nullable=False)
    level = db.Column(db.String(30), nullable=False)
    instance_type = db.Column(db.String(30), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    positions = db.relationship("Position", back_populates="instance")

    __table_args__ = (
        db.CheckConstraint(
            "level in ('university','faculty','career','federation','association','other')",
            name="ck_organizational_instances_level",
        ),
        db.CheckConstraint(
            "instance_type in ('teacher_representation','academic_authority','union_organization','committee','other')",
            name="ck_organizational_instances_type",
        ),
    )