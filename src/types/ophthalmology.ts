export interface OphthalmologyExam {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;

  // Refraction
  od_sphere: number | null;
  od_cylinder: number | null;
  od_axis: number | null;
  os_sphere: number | null;
  os_cylinder: number | null;
  os_axis: number | null;

  // Visual acuity
  va_od: string | null;
  va_os: string | null;
  va_ou: string | null;

  // Tonometry
  intraocular_pressure_od: number | null;
  intraocular_pressure_os: number | null;
  tonometry_method: string | null;

  // Findings
  anterior_segment: string | null;
  posterior_segment: string | null;
  pupil_reaction: string | null;
  color_blindness_test: string | null;
  other_findings: string | null;

  exam_date: string;
  created_at: string;
  updated_at: string;
}

export interface OphthalmologyPrescription {
  id: string;
  exam_id: string;
  patient_id: string;
  doctor_id: string;

  prescription_type: "glasses" | "contact_lens" | "both";

  // OD (Right eye)
  od_sphere: number | null;
  od_cylinder: number | null;
  od_axis: number | null;
  od_add: number | null;
  od_prism: number | null;
  od_base: string | null;

  // OS (Left eye)
  os_sphere: number | null;
  os_cylinder: number | null;
  os_axis: number | null;
  os_add: number | null;
  os_prism: number | null;
  os_base: string | null;

  // Contact lens info
  contact_lens_type: string | null;
  contact_lens_brand: string | null;
  contact_lens_base_curve: number | null;
  contact_lens_diameter: number | null;

  // General
  pupillary_distance: number | null;
  recommended_use: string;
  expiry_date: string | null;
  observations: string | null;

  prescribed_at: string;
  created_at: string;
  updated_at: string;
}

export interface OphthalmologyPrescriptionDocument {
  id: string;
  prescription_id: string;
  document_url: string;
  document_type: string | null;
  created_at: string;
}
