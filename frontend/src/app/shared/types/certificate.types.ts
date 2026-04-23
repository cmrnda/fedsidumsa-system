export interface CertificateType {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  requires_event: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CertificateTemplate {
  id: number;
  certificate_type_id: number;
  name: string;
  header_text?: string | null;
  body_template: string;
  footer_text?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CertifiableEvent {
  id: number;
  name: string;
  description?: string | null;
  location?: string | null;
  start_date: string;
  end_date?: string | null;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  supporting_document_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface EventParticipation {
  id: number;
  teacher_id: number;
  event_id: number;
  role_name?: string | null;
  participation_type: string;
  status: 'registered' | 'confirmed' | 'cancelled';
  observation?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvailableSigner {
  appointment_id: number;
  teacher_id: number;
  teacher_name: string;
  position_name: string;
  instance_name: string;
  period_name: string;
  start_date: string;
  end_date?: string | null;
}

export interface CertificateSigner {
  id: number;
  appointment_id: number;
  order_index: number;
  label_override?: string | null;
  teacher_name: string;
  position_name: string;
  instance_name: string;
}

export interface CertificateHistoryItem {
  id: number;
  from_status?: string | null;
  to_status: string;
  changed_by_user_id?: number | null;
  changed_by_name?: string | null;
  reason?: string | null;
  created_at: string;
}

export interface Certificate {
  id: number;
  teacher_id: number;
  certificate_type_id: number;
  template_id: number;
  event_id?: number | null;
  participation_id?: number | null;
  request_number: string;
  requested_by_user_id?: number | null;
  status: 'draft' | 'requested' | 'under_review' | 'approved' | 'rejected' | 'issued' | 'delivered' | 'cancelled';
  purpose?: string | null;
  observation?: string | null;
  rejection_reason?: string | null;
  cancel_reason?: string | null;
  issued_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
  updated_at: string;
  teacher_name: string;
  certificate_type_name: string;
  certificate_type_code: string;
  template_name: string;
  event_name?: string | null;
  signers: CertificateSigner[];
  history: CertificateHistoryItem[];
}
