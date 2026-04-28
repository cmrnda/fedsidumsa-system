from decimal import Decimal

from app.errors import ApiError
from app.extensions import db
from app.models.obligation_concept import ObligationConcept
from app.models.teacher import Teacher
from app.models.teacher_obligation import TeacherObligation
from app.models.teacher_payment import TeacherPayment


class DebtService:
    def list_concepts(self):
        return ObligationConcept.query.order_by(ObligationConcept.name.asc()).all()

    def create_concept(self, data):
        existing = ObligationConcept.query.filter_by(code=data["code"]).first()
        if existing:
            raise ApiError("Obligation concept code already exists", 409)

        concept = ObligationConcept(**data)
        db.session.add(concept)
        db.session.commit()
        db.session.refresh(concept)
        return concept

    def list_obligations(self, filters=None):
        query = TeacherObligation.query.join(TeacherObligation.teacher).join(TeacherObligation.concept)

        if filters:
            if filters.get("teacher_id"):
                query = query.filter(TeacherObligation.teacher_id == filters["teacher_id"])
            if filters.get("status"):
                query = query.filter(TeacherObligation.status == filters["status"])
            if filters.get("concept_id"):
                query = query.filter(TeacherObligation.concept_id == filters["concept_id"])

        return query.order_by(TeacherObligation.created_at.desc()).all()

    def get_obligation(self, obligation_id):
        obligation = db.session.get(TeacherObligation, obligation_id)
        if not obligation:
            raise ApiError("Obligation not found", 404)
        return obligation

    def create_obligation(self, data):
        teacher = self._get_teacher(data["teacher_id"])
        concept = self._get_concept(data["concept_id"])

        obligation = TeacherObligation(
            teacher_id=teacher.id,
            concept_id=concept.id,
            reference_label=data.get("reference_label"),
            total_amount=data["total_amount"],
            due_date=data.get("due_date"),
            observation=data.get("observation"),
            status="pending",
        )
        db.session.add(obligation)
        db.session.commit()
        db.session.refresh(obligation)
        return self.get_obligation(obligation.id)

    def add_payment(self, obligation_id, data):
        obligation = self.get_obligation(obligation_id)

        if obligation.status == "cancelled":
            raise ApiError("Cancelled obligations cannot receive payments", 400)

        balance = self._calculate_balance(obligation)
        if data["amount"] > balance:
            raise ApiError("Payment amount cannot exceed the pending balance", 400)

        payment = TeacherPayment(
            obligation_id=obligation.id,
            amount=data["amount"],
            payment_date=data["payment_date"],
            reference=data.get("reference"),
            observation=data.get("observation"),
        )
        obligation.payments.append(payment)
        db.session.flush()
        self._refresh_obligation_status(obligation)
        db.session.commit()
        return self.get_obligation(obligation.id)

    def get_teacher_statement(self, teacher_id):
        teacher = self._get_teacher(teacher_id)
        obligations = (
            TeacherObligation.query.filter_by(teacher_id=teacher.id)
            .order_by(TeacherObligation.created_at.desc())
            .all()
        )

        total_obligated = sum((obligation.total_amount for obligation in obligations if obligation.status != "cancelled"), Decimal("0"))
        total_paid = sum((self._calculate_paid_amount(obligation) for obligation in obligations if obligation.status != "cancelled"), Decimal("0"))
        pending_amount = max(Decimal("0"), total_obligated - total_paid)
        pending_obligations_count = sum(1 for obligation in obligations if obligation.status in {"pending", "partial"})
        eligible = pending_amount == Decimal("0") and pending_obligations_count == 0

        return {
            "teacher_id": teacher.id,
            "teacher_name": f"{teacher.first_names} {teacher.last_names}",
            "obligations": obligations,
            "total_obligated": float(total_obligated),
            "total_paid": float(total_paid),
            "pending_amount": float(pending_amount),
            "pending_obligations_count": pending_obligations_count,
            "eligible_for_no_debt": eligible,
            "message": "Teacher is eligible for a no debt certificate" if eligible else "Teacher has pending obligations",
        }

    def get_teacher_clearance(self, teacher_id):
        statement = self.get_teacher_statement(teacher_id)
        return {
            "teacher_id": statement["teacher_id"],
            "teacher_name": statement["teacher_name"],
            "eligible": statement["eligible_for_no_debt"],
            "pending_amount": statement["pending_amount"],
            "pending_obligations_count": statement["pending_obligations_count"],
            "message": statement["message"],
        }

    def get_dashboard_summary(self):
        pending_obligations = TeacherObligation.query.filter(TeacherObligation.status.in_(["pending", "partial"])).count()
        pending_teachers = (
            db.session.query(TeacherObligation.teacher_id)
            .filter(TeacherObligation.status.in_(["pending", "partial"]))
            .distinct()
            .count()
        )
        clear_teachers = (
            db.session.query(Teacher.id)
            .outerjoin(TeacherObligation, TeacherObligation.teacher_id == Teacher.id)
            .group_by(Teacher.id)
            .having(
                db.func.coalesce(
                    db.func.sum(
                        db.case(
                            (TeacherObligation.status.in_(["pending", "partial"]), 1),
                            else_=0,
                        )
                    ),
                    0,
                )
                == 0
            )
            .count()
        )

        return {
            "pending_obligations": pending_obligations,
            "teachers_with_pending_balance": pending_teachers,
            "teachers_clear_for_no_debt": clear_teachers,
        }

    def _get_teacher(self, teacher_id):
        teacher = db.session.get(Teacher, teacher_id)
        if not teacher:
            raise ApiError("Teacher not found", 404)
        return teacher

    def _get_concept(self, concept_id):
        concept = db.session.get(ObligationConcept, concept_id)
        if not concept:
            raise ApiError("Obligation concept not found", 404)
        return concept

    def _calculate_paid_amount(self, obligation):
        return sum((payment.amount for payment in obligation.payments), Decimal("0"))

    def _calculate_balance(self, obligation):
        return max(Decimal("0"), obligation.total_amount - self._calculate_paid_amount(obligation))

    def _refresh_obligation_status(self, obligation):
        if obligation.status == "cancelled":
            return

        paid_amount = self._calculate_paid_amount(obligation)

        if paid_amount <= Decimal("0"):
            obligation.status = "pending"
            return

        if paid_amount >= obligation.total_amount:
            obligation.status = "paid"
            return

        obligation.status = "partial"
