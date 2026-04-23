export interface ManagementPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'closed' | 'cancelled';
  observation?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationalInstance {
  id: number;
  code: string;
  name: string;
  level: 'university' | 'faculty' | 'career' | 'federation' | 'association' | 'other';
  instance_type:
    | 'teacher_representation'
    | 'academic_authority'
    | 'union_organization'
    | 'committee'
    | 'other';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PositionGroup {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: number;
  instance_id: number;
  position_group_id: number;
  name: string;
  is_exclusive: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupportingDocument {
  id: number;
  document_type:
    | 'resolution'
    | 'minutes'
    | 'note'
    | 'memorandum'
    | 'call'
    | 'certificate'
    | 'other';
  document_number?: string | null;
  document_date?: string | null;
  description?: string | null;
  file_path?: string | null;
  file_hash?: string | null;
  observation?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncompatibilityRule {
  id: number;
  origin_group_id: number;
  target_group_id: number;
  reason?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: number;
  teacher_id: number;
  period_id: number;
  position_id: number;
  start_date: string;
  end_date?: string | null;
  status: 'active' | 'finished' | 'revoked' | 'cancelled';
  is_signer: boolean;
  supporting_document_id?: number | null;
  observation?: string | null;
  created_at: string;
  updated_at: string;
}