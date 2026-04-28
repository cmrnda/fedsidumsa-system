export interface SystemRole {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
}

export interface SystemUser {
  id: number;
  username: string;
  full_name: string;
  email?: string | null;
  role_id: number;
  role_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemUserPayload {
  username: string;
  password?: string;
  full_name: string;
  email?: string | null;
  role_id: number;
  is_active: boolean;
}

export interface SystemUserPasswordPayload {
  password: string;
}
