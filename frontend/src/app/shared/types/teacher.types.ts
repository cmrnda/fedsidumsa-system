export interface Teacher {
  id: number;
  teacher_code?: string | null;
  ci: string;
  ci_extension?: string | null;
  first_names: string;
  last_names: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  faculty_id?: number | null;
  association_id?: number | null;
  base_position?: string | null;
  teacher_type?: string | null;
  teacher_category?: string | null;
  status: 'active' | 'inactive' | 'retired' | 'leave';
  created_at: string;
  updated_at: string;
}

export interface TeacherPayload {
  teacher_code?: string | null;
  ci: string;
  ci_extension?: string | null;
  first_names: string;
  last_names: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  faculty_id?: number | null;
  association_id?: number | null;
  base_position?: string | null;
  teacher_type?: string | null;
  teacher_category?: string | null;
  status: 'active' | 'inactive' | 'retired' | 'leave';
}