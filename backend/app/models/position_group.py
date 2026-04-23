from app.extensions import db
from app.models.mixins import TimestampMixin


class PositionGroup(db.Model, TimestampMixin):
    __tablename__ = "position_groups"

    id = db.Column(db.BigInteger, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    positions = db.relationship("Position", back_populates="position_group")