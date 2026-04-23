from flask import jsonify
from marshmallow import ValidationError


class ApiError(Exception):
    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(error):
        return jsonify({"message": error.message}), error.status_code

    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return jsonify({"message": "Validation error", "errors": error.messages}), 400

    @app.errorhandler(404)
    def handle_not_found(_):
        return jsonify({"message": "Resource not found"}), 404

    @app.errorhandler(500)
    def handle_internal_error(_):
        return jsonify({"message": "Internal server error"}), 500