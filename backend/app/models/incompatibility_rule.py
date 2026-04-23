from app.extensions import db
from app.models.mixins import TimestampMixin


class IncompatibilityRule(db.Model, TimestampMixin):
    __tablename__ = "incompatibility_rules"

    id = db.Column(db.BigInteger, primary_key=True)
    origin_group_id = db.Column(db.BigInteger, db.ForeignKey("position_groups.id"), nullable=False)
    target_group_id = db.Column(db.BigInteger, db.ForeignKey("position_groups.id"), nullable=False)
    reason = db.Column(db.Text)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    origin_group = db.relationship("PositionGroup", foreign_keys=[origin_group_id])
    target_group = db.relationship("PositionGroup", foreign_keys=[target_group_id])

    __table_args__ = (
        db.CheckConstraint(
            "origin_group_id <> target_group_id",
            name="ck_incompatibility_rules_different_groups",
        ),
        db.UniqueConstraint(
            "origin_group_id",
            "target_group_id",
            name="uq_incompatibility_rules_groups",
        ),
    )