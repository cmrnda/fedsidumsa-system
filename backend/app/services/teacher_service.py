from app.errors import ApiError
from app.models.association import Association
from app.models.faculty import Faculty
from app.models.teacher import Teacher
from app.repositories.teacher_repository import TeacherRepository


class TeacherService:
    def __init__(self):
        self.repository = TeacherRepository()

    def list_teachers(self, filters=None):
        return self.repository.get_all(filters)

    def get_teacher(self, teacher_id):
        teacher = self.repository.get_by_id(teacher_id)
        if not teacher:
            raise ApiError("Teacher not found", 404)
        return teacher

    def create_teacher(self, data):
        existing_teacher = self.repository.get_by_ci(
            data["ci"],
            data.get("ci_extension"),
        )
        if existing_teacher:
            raise ApiError("Teacher already exists", 409)

        if data.get("faculty_id"):
            faculty = Faculty.query.get(data["faculty_id"])
            if not faculty:
                raise ApiError("Faculty not found", 404)

        if data.get("association_id"):
            association = Association.query.get(data["association_id"])
            if not association:
                raise ApiError("Association not found", 404)

        teacher = Teacher(**data)
        return self.repository.save(teacher)

    def update_teacher(self, teacher_id, data):
        teacher = self.get_teacher(teacher_id)

        if data.get("faculty_id"):
            faculty = Faculty.query.get(data["faculty_id"])
            if not faculty:
                raise ApiError("Faculty not found", 404)

        if data.get("association_id"):
            association = Association.query.get(data["association_id"])
            if not association:
                raise ApiError("Association not found", 404)

        for key, value in data.items():
            setattr(teacher, key, value)

        return self.repository.save(teacher)