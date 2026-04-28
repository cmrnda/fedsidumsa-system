from app.commands.seed import create_admin, seed_certificate_types, seed_debt_concepts, seed_roles


def register_commands(app):
    app.cli.add_command(seed_roles)
    app.cli.add_command(seed_certificate_types)
    app.cli.add_command(seed_debt_concepts)
    app.cli.add_command(create_admin)
