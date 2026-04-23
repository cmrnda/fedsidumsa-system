from app.extensions import db
from app.models.teacher import Teacher


class TeacherRepository:
    def get_all(self, filters=None):
        query = Teacher.query

        if filters:
            if filters.get("faculty_id"):
                query = query.filter(Teacher.faculty_id == filters["faculty_id"])
            if filters.get("association_id"):
                query = query.filter(Teacher.association_id == filters["association_id"])
            if filters.get("status"):
                query = query.filter(Teacher.status == filters["status"])

        return query.order_by(Teacher.last_names.asc(), Teacher.first_names.asc()).all()

    def get_by_id(self, teacher_id):
        return db.session.get(Teacher, teacher_id)

    def get_by_ci(self, ci, ci_extension=None):
        return Teacher.query.filter_by(ci=ci, ci_extension=ci_extension).first()

    def save(self, teacher):
        db.session.add(teacher)
        db.session.commit()
        db.session.refresh(teacher)
        return teacher