from app.extensions import db
from app.models.mixins import TimestampMixin


class Position(db.Model, TimestampMixin):
    __tablename__ = "positions"

    id = db.Column(db.BigInteger, primary_key=True)
    instance_id = db.Column(db.BigInteger, db.ForeignKey("organizational_instances.id"), nullable=False)
    position_group_id = db.Column(db.BigInteger, db.ForeignKey("position_groups.id"), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    is_exclusive = db.Column(db.Boolean, nullable=False, default=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    instance = db.relationship("OrganizationalInstance", back_populates="positions")
    position_group = db.relationship("PositionGroup", back_populates="positions")
    appointments = db.relationship("Appointment", back_populates="position")

    __table_args__ = (
        db.UniqueConstraint("instance_id", "name", name="uq_positions_instance_name"),
    )