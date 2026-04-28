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


@click.command("seed-certificate-types")
@with_appcontext
def seed_certificate_types():
    from app.models.certificate_type import CertificateType

    items = [
        {
            "code": "participation_general",
            "name": "Participacion general",
            "description": "General participation certificate",
            "requires_event": False,
        },
        {
            "code": "participation_event",
            "name": "Participacion en evento",
            "description": "Event participation certificate",
            "requires_event": True,
        },
        {
            "code": "recognition",
            "name": "Reconocimiento",
            "description": "Recognition certificate",
            "requires_event": False,
        },
        {
            "code": "no_debt",
            "name": "No debt",
            "description": "Reserved structure for no debt certificates",
            "requires_event": False,
        },
    ]

    for item in items:
        existing = CertificateType.query.filter_by(code=item["code"]).first()
        if not existing:
            db.session.add(CertificateType(**item))

    db.session.commit()
    click.echo("Certificate types seeded successfully")


@click.command("seed-debt-concepts")
@with_appcontext
def seed_debt_concepts():
    from app.models.obligation_concept import ObligationConcept

    items = [
        {
            "code": "ordinary_contribution",
            "name": "Aporte ordinario",
            "description": "Regular teacher contribution",
        },
        {
            "code": "extraordinary_contribution",
            "name": "Aporte extraordinario",
            "description": "Exceptional institutional contribution",
        },
        {
            "code": "documentation_penalty",
            "name": "Regularizacion documental",
            "description": "Pending documentation related obligation",
        },
    ]

    for item in items:
        existing = ObligationConcept.query.filter_by(code=item["code"]).first()
        if not existing:
            db.session.add(ObligationConcept(**item))

    db.session.commit()
    click.echo("Debt concepts seeded successfully")


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
