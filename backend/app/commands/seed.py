import click
from flask.cli import with_appcontext

from app.extensions import db
from app.models.role import Role
from app.models.user import User


@click.command("seed-roles")
@with_appcontext
def seed_roles():
    roles = [
        {"name": "admin", "description": "Full system access"},
        {"name": "administration", "description": "Administrative management access"},
        {"name": "certificates", "description": "Certificates management access"},
        {"name": "read_only", "description": "Read-only access"},
    ]

    for item in roles:
        existing_role = Role.query.filter_by(name=item["name"]).first()
        if not existing_role:
            db.session.add(Role(name=item["name"], description=item["description"]))

    db.session.commit()
    click.echo("Roles seeded successfully")


@click.command("create-admin")
@click.option("--username", prompt=True)
@click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True)
@click.option("--full-name", prompt=True)
@click.option("--email", prompt=True)
@with_appcontext
def create_admin(username, password, full_name, email):
    existing_user = User.query.filter(
        (User.username == username) | (User.email == email)
    ).first()

    if existing_user:
        click.echo("User already exists")
        return

    admin_role = Role.query.filter_by(name="admin").first()
    if not admin_role:
        click.echo("Admin role not found. Run seed-roles first")
        return

    user = User(
        username=username,
        full_name=full_name,
        email=email,
        role_id=admin_role.id,
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    click.echo("Admin user created successfully")