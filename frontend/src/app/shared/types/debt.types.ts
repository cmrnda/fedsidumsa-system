export interface ObligationConcept {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeacherPayment {
  id: number;
  amount: number;
  payment_date: string;
  reference?: string | null;
  observation?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeacherObligation {
  id: number;
  teacher_id: number;
  concept_id: number;
  reference_label?: string | null;
  total_amount: number;
  due_date?: string | null;
  status: 'pending' | 'partial' | 'paid' | 'cancelled';
  observation?: string | null;
  created_at: string;
  updated_at: string;
  concept_name: string;
  teacher_name: string;
  paid_amount: number;
  balance: number;
  payments: TeacherPayment[];
}

export interface TeacherStatement {
  teacher_id: number;
  teacher_name: string;
  obligations: TeacherObligation[];
  total_obligated: number;
  total_paid: number;
  pending_amount: number;
  pending_obligations_count: number;
  eligible_for_no_debt: boolean;
  message: string;
}

export interface TeacherClearance {
  teacher_id: number;
  teacher_name: string;
  eligible: boolean;
  pending_amount: number;
  pending_obligations_count: number;
  message: string;
}

export interface DebtDashboardSummary {
  pending_obligations: number;
  teachers_with_pending_balance: number;
  teachers_clear_for_no_debt: number;
}
