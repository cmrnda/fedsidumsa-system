export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

const dateFormatter = new Intl.DateTimeFormat('es-BO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const teacherStatusMap: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  retired: 'Jubilado',
  leave: 'Licencia',
};

const periodStatusMap: Record<string, string> = {
  active: 'Activo',
  closed: 'Cerrado',
  cancelled: 'Cancelado',
};

const appointmentStatusMap: Record<string, string> = {
  active: 'Vigente',
  finished: 'Finalizada',
  revoked: 'Revocada',
  cancelled: 'Cancelada',
};

const instanceLevelMap: Record<string, string> = {
  university: 'Universidad',
  faculty: 'Facultad',
  career: 'Carrera',
  federation: 'Federación',
  association: 'Asociación',
  other: 'Otro',
};

const instanceTypeMap: Record<string, string> = {
  teacher_representation: 'Representación docente',
  academic_authority: 'Autoridad académica',
  union_organization: 'Organización sindical',
  committee: 'Comité',
  other: 'Otro',
};

const documentTypeMap: Record<string, string> = {
  resolution: 'Resolución',
  minutes: 'Acta',
  note: 'Nota',
  memorandum: 'Memorándum',
  call: 'Convocatoria',
  certificate: 'Certificado',
  other: 'Otro',
};

const certificateStatusMap: Record<string, string> = {
  draft: 'Borrador',
  requested: 'Solicitado',
  under_review: 'En revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  issued: 'Emitido',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const eventStatusMap: Record<string, string> = {
  planned: 'Planificado',
  active: 'Activo',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
};

const participationStatusMap: Record<string, string> = {
  registered: 'Registrado',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
};

export const teacherStatusOptions: SelectOption[] = [
  { value: 'active', label: teacherStatusMap['active'] },
  { value: 'inactive', label: teacherStatusMap['inactive'] },
  { value: 'retired', label: teacherStatusMap['retired'] },
  { value: 'leave', label: teacherStatusMap['leave'] },
];

export const periodStatusOptions: SelectOption[] = [
  { value: 'active', label: periodStatusMap['active'] },
  { value: 'closed', label: periodStatusMap['closed'] },
  { value: 'cancelled', label: periodStatusMap['cancelled'] },
];

export const appointmentStatusOptions: SelectOption[] = [
  { value: 'active', label: appointmentStatusMap['active'] },
  { value: 'finished', label: appointmentStatusMap['finished'] },
  { value: 'revoked', label: appointmentStatusMap['revoked'] },
  { value: 'cancelled', label: appointmentStatusMap['cancelled'] },
];

export const instanceLevelOptions: SelectOption[] = [
  { value: 'university', label: instanceLevelMap['university'] },
  { value: 'faculty', label: instanceLevelMap['faculty'] },
  { value: 'career', label: instanceLevelMap['career'] },
  { value: 'federation', label: instanceLevelMap['federation'] },
  { value: 'association', label: instanceLevelMap['association'] },
  { value: 'other', label: instanceLevelMap['other'] },
];

export const instanceTypeOptions: SelectOption[] = [
  { value: 'teacher_representation', label: instanceTypeMap['teacher_representation'] },
  { value: 'academic_authority', label: instanceTypeMap['academic_authority'] },
  { value: 'union_organization', label: instanceTypeMap['union_organization'] },
  { value: 'committee', label: instanceTypeMap['committee'] },
  { value: 'other', label: instanceTypeMap['other'] },
];

export const documentTypeOptions: SelectOption[] = [
  { value: 'resolution', label: documentTypeMap['resolution'] },
  { value: 'minutes', label: documentTypeMap['minutes'] },
  { value: 'note', label: documentTypeMap['note'] },
  { value: 'memorandum', label: documentTypeMap['memorandum'] },
  { value: 'call', label: documentTypeMap['call'] },
  { value: 'certificate', label: documentTypeMap['certificate'] },
  { value: 'other', label: documentTypeMap['other'] },
];

export const certificateStatusOptions: SelectOption[] = [
  { value: 'draft', label: certificateStatusMap['draft'] },
  { value: 'requested', label: certificateStatusMap['requested'] },
  { value: 'under_review', label: certificateStatusMap['under_review'] },
  { value: 'approved', label: certificateStatusMap['approved'] },
  { value: 'rejected', label: certificateStatusMap['rejected'] },
  { value: 'issued', label: certificateStatusMap['issued'] },
  { value: 'delivered', label: certificateStatusMap['delivered'] },
  { value: 'cancelled', label: certificateStatusMap['cancelled'] },
];

export const eventStatusOptions: SelectOption[] = [
  { value: 'planned', label: eventStatusMap['planned'] },
  { value: 'active', label: eventStatusMap['active'] },
  { value: 'completed', label: eventStatusMap['completed'] },
  { value: 'cancelled', label: eventStatusMap['cancelled'] },
];

export const participationStatusOptions: SelectOption[] = [
  { value: 'registered', label: participationStatusMap['registered'] },
  { value: 'confirmed', label: participationStatusMap['confirmed'] },
  { value: 'cancelled', label: participationStatusMap['cancelled'] },
];

export function formatApiError(errorResponse: unknown, fallback = 'No se pudo completar la solicitud'): string {
  const error = errorResponse as {
    error?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
  };

  const firstValidationError = error?.error?.errors
    ? Object.values(error.error.errors).flat().find(Boolean)
    : undefined;

  return firstValidationError || error?.error?.message || fallback;
}

export function formatDate(value?: string | null): string {
  if (!value) {
    return 'Sin fecha';
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return dateFormatter.format(parsed);
}

export function formatTeacherStatus(value: string): string {
  return teacherStatusMap[value] || value;
}

export function formatPeriodStatus(value: string): string {
  return periodStatusMap[value] || value;
}

export function formatAppointmentStatus(value: string): string {
  return appointmentStatusMap[value] || value;
}

export function formatInstanceLevel(value: string): string {
  return instanceLevelMap[value] || value;
}

export function formatInstanceType(value: string): string {
  return instanceTypeMap[value] || value;
}

export function formatDocumentType(value: string): string {
  return documentTypeMap[value] || value;
}

export function formatCertificateStatus(value: string): string {
  return certificateStatusMap[value] || value;
}

export function formatEventStatus(value: string): string {
  return eventStatusMap[value] || value;
}

export function formatParticipationStatus(value: string): string {
  return participationStatusMap[value] || value;
}

export function formatFullName(firstNames?: string | null, lastNames?: string | null): string {
  return [firstNames, lastNames].filter(Boolean).join(' ').trim();
}
