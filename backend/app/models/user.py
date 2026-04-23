from app.extensions import bcrypt, db
from app.models.mixins import TimestampMixin


class User(db.Model, TimestampMixin):
    __tablename__ = "users"

    id = db.Column(db.BigInteger, primary_key=True)
    username = db.Column(db.String(80), nullable=False, unique=True)
    password_hash = db.Column(db.Text, nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    role_id = db.Column(db.BigInteger, db.ForeignKey("roles.id"), nullable=False)

    role = db.relationship("Role", back_populates="users")

    def set_password(self, raw_password):
        self.password_hash = bcrypt.generate_password_hash(raw_password).decode("utf-8")

    def check_password(self, raw_password):
        return bcrypt.check_password_hash(self.password_hash, raw_password)