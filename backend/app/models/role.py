from app.extensions import db
from app.models.mixins import TimestampMixin


class Role(db.Model, TimestampMixin):
    __tablename__ = "roles"

    id = db.Column(db.BigInteger, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    users = db.relationship("User", back_populates="role")