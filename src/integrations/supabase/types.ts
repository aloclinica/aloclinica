export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      aloc_exames: {
        Row: {
          clinic_id: string | null
          created_at: string
          doctor_id: string | null
          exam_type: string | null
          file_url: string | null
          id: string
          notes: string | null
          orthanc_study_id: string | null
          patient_id: string | null
          priority: string | null
          status: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          doctor_id?: string | null
          exam_type?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          orthanc_study_id?: string | null
          patient_id?: string | null
          priority?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          doctor_id?: string | null
          exam_type?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          orthanc_study_id?: string | null
          patient_id?: string | null
          priority?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aloc_exames_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aloc_exames_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aloc_laudos: {
        Row: {
          content: string | null
          created_at: string
          doctor_id: string | null
          exam_id: string | null
          html_content: string | null
          id: string
          laudista_id: string | null
          pdf_url: string | null
          priority: string | null
          signature_hash: string | null
          signed_at: string | null
          sla_deadline: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          doctor_id?: string | null
          exam_id?: string | null
          html_content?: string | null
          id?: string
          laudista_id?: string | null
          pdf_url?: string | null
          priority?: string | null
          signature_hash?: string | null
          signed_at?: string | null
          sla_deadline?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          doctor_id?: string | null
          exam_id?: string | null
          html_content?: string | null
          id?: string
          laudista_id?: string | null
          pdf_url?: string | null
          priority?: string | null
          signature_hash?: string | null
          signed_at?: string | null
          sla_deadline?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aloc_laudos_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aloc_laudos_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "aloc_exames"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      appointment_waitlist: {
        Row: {
          created_at: string
          doctor_id: string | null
          id: string
          is_notified: boolean | null
          notes: string | null
          patient_id: string
          preferred_date: string | null
          specialty_id: string | null
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          id?: string
          is_notified?: boolean | null
          notes?: string | null
          patient_id: string
          preferred_date?: string | null
          specialty_id?: string | null
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          id?: string
          is_notified?: boolean | null
          notes?: string | null
          patient_id?: string
          preferred_date?: string | null
          specialty_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_waitlist_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_waitlist_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_type:
            | Database["public"]["Enums"]["appointment_type"]
            | null
          cancellation_reason: string | null
          cancelled_by: string | null
          clinic_id: string | null
          created_at: string
          doctor_id: string
          duration_minutes: number | null
          ended_at: string | null
          id: string
          jitsi_room_id: string | null
          notes: string | null
          patient_id: string | null
          payment_id: string | null
          payment_status: string | null
          price: number | null
          scheduled_at: string
          started_at: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          appointment_type?:
            | Database["public"]["Enums"]["appointment_type"]
            | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          clinic_id?: string | null
          created_at?: string
          doctor_id: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          jitsi_room_id?: string | null
          notes?: string | null
          patient_id?: string | null
          payment_id?: string | null
          payment_status?: string | null
          price?: number | null
          scheduled_at: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          appointment_type?:
            | Database["public"]["Enums"]["appointment_type"]
            | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          clinic_id?: string | null
          created_at?: string
          doctor_id?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          jitsi_room_id?: string | null
          notes?: string | null
          patient_id?: string | null
          payment_id?: string | null
          payment_status?: string | null
          price?: number | null
          scheduled_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_slots: {
        Row: {
          created_at: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_leads: {
        Row: {
          company_name: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          message: string | null
          phone: string | null
          status: string | null
        }
        Insert: {
          company_name: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          status?: string | null
        }
        Update: {
          company_name?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          status?: string | null
        }
        Relationships: []
      }
      clinic_affiliations: {
        Row: {
          clinic_id: string
          created_at: string
          doctor_id: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          doctor_id: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          doctor_id?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_affiliations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_affiliations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_profiles: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          logo_url: string | null
          name: string | null
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          logo_url?: string | null
          name?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          logo_url?: string | null
          name?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      consultation_notes: {
        Row: {
          appointment_id: string
          content: string | null
          created_at: string
          doctor_id: string
          id: string
          note_type: string | null
          patient_id: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          content?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          note_type?: string | null
          patient_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          content?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          note_type?: string | null
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          current_uses: number | null
          discount_type: string | null
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number | null
          discount_type?: string | null
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number | null
          discount_type?: string | null
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      dependents: {
        Row: {
          cpf: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string
          guardian_id: string
          id: string
          last_name: string | null
          relationship: string | null
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name: string
          guardian_id: string
          id?: string
          last_name?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          guardian_id?: string
          id?: string
          last_name?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      doctor_absences: {
        Row: {
          created_at: string
          doctor_id: string
          end_date: string
          id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_absences_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_invite_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number | null
          doctor_id: string
          id: string
          is_active: boolean | null
          max_uses: number | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number | null
          doctor_id: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number | null
          doctor_id?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_invite_codes_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_profiles: {
        Row: {
          areas_of_expertise: string[] | null
          bio: string | null
          consultation_duration: number | null
          created_at: string
          crm: string | null
          crm_state: string | null
          crm_verified: boolean | null
          crm_verified_at: string | null
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          is_on_duty: boolean | null
          kyc_face_match_score: number | null
          kyc_status: string | null
          kyc_verified_at: string | null
          pix_key: string | null
          pix_key_type: string | null
          price: number | null
          professional_photo_url: string | null
          rating_avg: number | null
          rating_count: number | null
          return_price: number | null
          slug: string | null
          social_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          areas_of_expertise?: string[] | null
          bio?: string | null
          consultation_duration?: number | null
          created_at?: string
          crm?: string | null
          crm_state?: string | null
          crm_verified?: boolean | null
          crm_verified_at?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          is_on_duty?: boolean | null
          kyc_face_match_score?: number | null
          kyc_status?: string | null
          kyc_verified_at?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          price?: number | null
          professional_photo_url?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          return_price?: number | null
          slug?: string | null
          social_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          areas_of_expertise?: string[] | null
          bio?: string | null
          consultation_duration?: number | null
          created_at?: string
          crm?: string | null
          crm_state?: string | null
          crm_verified?: boolean | null
          crm_verified_at?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          is_on_duty?: boolean | null
          kyc_face_match_score?: number | null
          kyc_status?: string | null
          kyc_verified_at?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          price?: number | null
          professional_photo_url?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          return_price?: number | null
          slug?: string | null
          social_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      doctor_specialties: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          specialty_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          specialty_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          specialty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_specialties_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      document_verifications: {
        Row: {
          created_at: string
          details: Json | null
          doctor_crm: string | null
          doctor_name: string | null
          document_hash: string
          document_type: string | null
          id: string
          is_valid: boolean | null
          patient_cpf: string | null
          patient_name: string | null
          signer_id: string | null
          verification_code: string | null
          verification_method: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          doctor_crm?: string | null
          doctor_name?: string | null
          document_hash: string
          document_type?: string | null
          id?: string
          is_valid?: boolean | null
          patient_cpf?: string | null
          patient_name?: string | null
          signer_id?: string | null
          verification_code?: string | null
          verification_method?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          doctor_crm?: string | null
          doctor_name?: string | null
          document_hash?: string
          document_type?: string | null
          id?: string
          is_valid?: boolean | null
          patient_cpf?: string | null
          patient_name?: string | null
          signer_id?: string | null
          verification_code?: string | null
          verification_method?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      exam_reports: {
        Row: {
          created_at: string
          doctor_id: string | null
          exam_id: string | null
          id: string
          report_content: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          exam_id?: string | null
          id?: string
          report_content?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          exam_id?: string | null
          id?: string
          report_content?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_reports_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_reports_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "aloc_exames"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_requests: {
        Row: {
          appointment_id: string | null
          clinical_indication: string | null
          created_at: string
          doctor_id: string
          exam_types: string[] | null
          id: string
          notes: string | null
          patient_id: string
          status: string | null
        }
        Insert: {
          appointment_id?: string | null
          clinical_indication?: string | null
          created_at?: string
          doctor_id: string
          exam_types?: string[] | null
          id?: string
          notes?: string | null
          patient_id: string
          status?: string | null
        }
        Update: {
          appointment_id?: string | null
          clinical_indication?: string | null
          created_at?: string
          doctor_id?: string
          exam_types?: string[] | null
          id?: string
          notes?: string | null
          patient_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_requests_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_requests_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_items: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          question: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question?: string
        }
        Relationships: []
      }
      favorite_doctors: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          patient_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_doctors_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_patients: {
        Row: {
          cpf: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      health_metrics: {
        Row: {
          created_at: string
          id: string
          measured_at: string | null
          metric_type: string
          notes: string | null
          patient_id: string
          unit: string | null
          value: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          measured_at?: string | null
          metric_type: string
          notes?: string | null
          patient_id: string
          unit?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          measured_at?: string | null
          metric_type?: string
          notes?: string | null
          patient_id?: string
          unit?: string | null
          value?: number | null
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          appointment_id: string | null
          assessment: string | null
          chief_complaint: string | null
          created_at: string
          doctor_id: string | null
          history_present_illness: string | null
          icd_codes: string[] | null
          id: string
          is_draft: boolean | null
          patient_id: string
          physical_exam: string | null
          plan: string | null
          record_type: string | null
          soap_assessment: string | null
          soap_objective: string | null
          soap_plan: string | null
          soap_subjective: string | null
          updated_at: string
          vitals: Json | null
        }
        Insert: {
          appointment_id?: string | null
          assessment?: string | null
          chief_complaint?: string | null
          created_at?: string
          doctor_id?: string | null
          history_present_illness?: string | null
          icd_codes?: string[] | null
          id?: string
          is_draft?: boolean | null
          patient_id: string
          physical_exam?: string | null
          plan?: string | null
          record_type?: string | null
          soap_assessment?: string | null
          soap_objective?: string | null
          soap_plan?: string | null
          soap_subjective?: string | null
          updated_at?: string
          vitals?: Json | null
        }
        Update: {
          appointment_id?: string | null
          assessment?: string | null
          chief_complaint?: string | null
          created_at?: string
          doctor_id?: string | null
          history_present_illness?: string | null
          icd_codes?: string[] | null
          id?: string
          is_draft?: boolean | null
          patient_id?: string
          physical_exam?: string | null
          plan?: string | null
          record_type?: string | null
          soap_assessment?: string | null
          soap_objective?: string | null
          soap_plan?: string | null
          soap_subjective?: string | null
          updated_at?: string
          vitals?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          appointment_id: string | null
          content: string | null
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean | null
          message_type: string | null
          receiver_id: string | null
          sender_id: string
        }
        Insert: {
          appointment_id?: string | null
          content?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          receiver_id?: string | null
          sender_id: string
        }
        Update: {
          appointment_id?: string | null
          content?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          receiver_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean | null
          metadata: Json | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      on_demand_queue: {
        Row: {
          assigned_doctor_id: string | null
          created_at: string
          id: string
          patient_id: string
          priority: number | null
          specialty_id: string | null
          status: string | null
          symptoms: string | null
          updated_at: string
        }
        Insert: {
          assigned_doctor_id?: string | null
          created_at?: string
          id?: string
          patient_id: string
          priority?: number | null
          specialty_id?: string | null
          status?: string | null
          symptoms?: string | null
          updated_at?: string
        }
        Update: {
          assigned_doctor_id?: string | null
          created_at?: string
          id?: string
          patient_id?: string
          priority?: number | null
          specialty_id?: string | null
          status?: string | null
          symptoms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "on_demand_queue_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "on_demand_queue_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      ophthalmology_exams: {
        Row: {
          anterior_segment: string | null
          created_at: string
          doctor_id: string | null
          exam_type: string | null
          eye: string | null
          id: string
          intraocular_pressure_od: number | null
          intraocular_pressure_os: number | null
          notes: string | null
          od_axis: number | null
          od_cylinder: number | null
          od_sphere: number | null
          os_axis: number | null
          os_cylinder: number | null
          os_sphere: number | null
          other_findings: string | null
          patient_id: string
          posterior_segment: string | null
          pupil_reaction: string | null
          results: Json | null
          status: string | null
          tonometry_method: string | null
          updated_at: string
          va_od: string | null
          va_os: string | null
          va_ou: string | null
          visual_acuity_od: string | null
          visual_acuity_os: string | null
        }
        Insert: {
          anterior_segment?: string | null
          created_at?: string
          doctor_id?: string | null
          exam_type?: string | null
          eye?: string | null
          id?: string
          intraocular_pressure_od?: number | null
          intraocular_pressure_os?: number | null
          notes?: string | null
          od_axis?: number | null
          od_cylinder?: number | null
          od_sphere?: number | null
          os_axis?: number | null
          os_cylinder?: number | null
          os_sphere?: number | null
          other_findings?: string | null
          patient_id: string
          posterior_segment?: string | null
          pupil_reaction?: string | null
          results?: Json | null
          status?: string | null
          tonometry_method?: string | null
          updated_at?: string
          va_od?: string | null
          va_os?: string | null
          va_ou?: string | null
          visual_acuity_od?: string | null
          visual_acuity_os?: string | null
        }
        Update: {
          anterior_segment?: string | null
          created_at?: string
          doctor_id?: string | null
          exam_type?: string | null
          eye?: string | null
          id?: string
          intraocular_pressure_od?: number | null
          intraocular_pressure_os?: number | null
          notes?: string | null
          od_axis?: number | null
          od_cylinder?: number | null
          od_sphere?: number | null
          os_axis?: number | null
          os_cylinder?: number | null
          os_sphere?: number | null
          other_findings?: string | null
          patient_id?: string
          posterior_segment?: string | null
          pupil_reaction?: string | null
          results?: Json | null
          status?: string | null
          tonometry_method?: string | null
          updated_at?: string
          va_od?: string | null
          va_os?: string | null
          va_ou?: string | null
          visual_acuity_od?: string | null
          visual_acuity_os?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ophthalmology_exams_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ophthalmology_prescriptions: {
        Row: {
          created_at: string
          doctor_id: string
          exam_id: string | null
          expiry_date: string | null
          id: string
          notes: string | null
          od_add: number | null
          od_axis: number | null
          od_cylinder: number | null
          od_sphere: number | null
          os_add: number | null
          os_axis: number | null
          os_cylinder: number | null
          os_sphere: number | null
          patient_id: string
          pdf_url: string | null
          prescribed_at: string | null
          prescription_data: Json | null
          prescription_type: string | null
          pupillary_distance: number | null
          recommended_use: string | null
        }
        Insert: {
          created_at?: string
          doctor_id: string
          exam_id?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          od_add?: number | null
          od_axis?: number | null
          od_cylinder?: number | null
          od_sphere?: number | null
          os_add?: number | null
          os_axis?: number | null
          os_cylinder?: number | null
          os_sphere?: number | null
          patient_id: string
          pdf_url?: string | null
          prescribed_at?: string | null
          prescription_data?: Json | null
          prescription_type?: string | null
          pupillary_distance?: number | null
          recommended_use?: string | null
        }
        Update: {
          created_at?: string
          doctor_id?: string
          exam_id?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          od_add?: number | null
          od_axis?: number | null
          od_cylinder?: number | null
          od_sphere?: number | null
          os_add?: number | null
          os_axis?: number | null
          os_cylinder?: number | null
          os_sphere?: number | null
          patient_id?: string
          pdf_url?: string | null
          prescribed_at?: string | null
          prescription_data?: Json | null
          prescription_type?: string | null
          pupillary_distance?: number | null
          recommended_use?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ophthalmology_prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ophthalmology_prescriptions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "ophthalmology_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profiles: {
        Row: {
          commission_rate: number | null
          company_name: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_rate?: number | null
          company_name?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_rate?: number | null
          company_name?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_consents: {
        Row: {
          accepted: boolean | null
          accepted_at: string | null
          consent_type: string
          created_at: string
          id: string
          ip_address: string | null
          patient_id: string
          user_agent: string | null
          version: string | null
        }
        Insert: {
          accepted?: boolean | null
          accepted_at?: string | null
          consent_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          patient_id: string
          user_agent?: string | null
          version?: string | null
        }
        Update: {
          accepted?: boolean | null
          accepted_at?: string | null
          consent_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          patient_id?: string
          user_agent?: string | null
          version?: string | null
        }
        Relationships: []
      }
      patient_documents: {
        Row: {
          created_at: string
          doctor_id: string | null
          document_type: string
          file_name: string | null
          file_url: string | null
          id: string
          mime_type: string | null
          notes: string | null
          patient_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          document_type: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          patient_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          document_type?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          patient_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          features: Json | null
          id: string
          interval: string | null
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          interval?: string | null
          is_active?: boolean | null
          name: string
          price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          interval?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      pre_consultation_symptoms: {
        Row: {
          additional_notes: string | null
          appointment_id: string
          created_at: string
          duration: string | null
          id: string
          patient_id: string
          severity: number | null
          symptoms: string[] | null
        }
        Insert: {
          additional_notes?: string | null
          appointment_id: string
          created_at?: string
          duration?: string | null
          id?: string
          patient_id: string
          severity?: number | null
          symptoms?: string[] | null
        }
        Update: {
          additional_notes?: string | null
          appointment_id?: string
          created_at?: string
          duration?: string | null
          id?: string
          patient_id?: string
          severity?: number | null
          symptoms?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_consultation_symptoms_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_renewals: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          notes: string | null
          patient_id: string
          prescription_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          notes?: string | null
          patient_id: string
          prescription_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          prescription_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_renewals_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_renewals_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_signatures: {
        Row: {
          certificate_chain: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          prescription_id: string | null
          signature_algorithm: string | null
          signed_at: string | null
          signed_by: string
          soluti_request_id: string | null
          status: string | null
          storage_path: string
        }
        Insert: {
          certificate_chain?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          prescription_id?: string | null
          signature_algorithm?: string | null
          signed_at?: string | null
          signed_by: string
          soluti_request_id?: string | null
          status?: string | null
          storage_path: string
        }
        Update: {
          certificate_chain?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          prescription_id?: string | null
          signature_algorithm?: string | null
          signed_at?: string | null
          signed_by?: string
          soluti_request_id?: string | null
          status?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_signatures_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_validations: {
        Row: {
          created_at: string
          id: string
          is_valid: boolean | null
          prescription_id: string | null
          validated_at: string | null
          validator_ip: string | null
          validator_user_agent: string | null
          verification_code: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_valid?: boolean | null
          prescription_id?: string | null
          validated_at?: string | null
          validator_ip?: string | null
          validator_user_agent?: string | null
          verification_code?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_valid?: boolean | null
          prescription_id?: string | null
          validated_at?: string | null
          validator_ip?: string | null
          validator_user_agent?: string | null
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_validations_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          appointment_id: string | null
          created_at: string
          diagnosis: string | null
          doctor_id: string
          id: string
          instructions: string | null
          is_signed: boolean | null
          medications: Json | null
          observations: string | null
          patient_id: string
          pdf_url: string | null
          prescription_type: string | null
          signature_hash: string | null
          signed_at: string | null
          status: string | null
          updated_at: string
          valid_until: string | null
          verification_code: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id: string
          id?: string
          instructions?: string | null
          is_signed?: boolean | null
          medications?: Json | null
          observations?: string | null
          patient_id: string
          pdf_url?: string | null
          prescription_type?: string | null
          signature_hash?: string | null
          signed_at?: string | null
          status?: string | null
          updated_at?: string
          valid_until?: string | null
          verification_code?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string
          id?: string
          instructions?: string | null
          is_signed?: boolean | null
          medications?: Json | null
          observations?: string | null
          patient_id?: string
          pdf_url?: string | null
          prescription_type?: string | null
          signature_hash?: string | null
          signed_at?: string | null
          status?: string | null
          updated_at?: string
          valid_until?: string | null
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_city: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          allergies: string[] | null
          avatar_url: string | null
          blood_type: string | null
          chronic_conditions: string[] | null
          cpf: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          phone: string | null
          social_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          allergies?: string[] | null
          avatar_url?: string | null
          blood_type?: string | null
          chronic_conditions?: string[] | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          social_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          allergies?: string[] | null
          avatar_url?: string | null
          blood_type?: string | null
          chronic_conditions?: string[] | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          social_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string | null
          created_at: string
          endpoint: string
          id: string
          p256dh: string | null
          user_id: string
        }
        Insert: {
          auth_key?: string | null
          created_at?: string
          endpoint: string
          id?: string
          p256dh?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string | null
          user_id?: string
        }
        Relationships: []
      }
      satisfaction_surveys: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string
          doctor_id: string | null
          id: string
          nps_score: number | null
          patient_id: string
          rating: number
          would_recommend: boolean | null
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          nps_score?: number | null
          patient_id: string
          rating: number
          would_recommend?: boolean | null
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          nps_score?: number | null
          patient_id?: string
          rating?: number
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "satisfaction_surveys_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satisfaction_surveys_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_config: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      site_media: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          mime_type: string | null
          name: string | null
          path: string | null
          size_bytes: number | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          mime_type?: string | null
          name?: string | null
          path?: string | null
          size_bytes?: number | null
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          mime_type?: string | null
          name?: string | null
          path?: string | null
          size_bytes?: number | null
          url?: string
        }
        Relationships: []
      }
      site_sections: {
        Row: {
          config: Json | null
          created_at: string
          display_name: string | null
          display_order: number | null
          id: string
          is_enabled: boolean | null
          key: string
          schema: Json
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          display_name?: string | null
          display_order?: number | null
          id?: string
          is_enabled?: boolean | null
          key: string
          schema?: Json
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          display_name?: string | null
          display_order?: number | null
          id?: string
          is_enabled?: boolean | null
          key?: string
          schema?: Json
          updated_at?: string
        }
        Relationships: []
      }
      specialties: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          max_price: number | null
          min_price: number | null
          name: string
          slug: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_price?: number | null
          min_price?: number | null
          name: string
          slug?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_price?: number | null
          min_price?: number | null
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          payment_id: string | null
          plan_id: string | null
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          plan_id?: string | null
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          plan_id?: string | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      support_chat_messages: {
        Row: {
          agent_id: string | null
          content: string
          created_at: string
          id: string
          is_from_agent: boolean | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_from_agent?: boolean | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_from_agent?: boolean | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          sender_id: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          sender_id: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      symptom_diary: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          recorded_at: string | null
          severity: number | null
          symptom: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          recorded_at?: string | null
          severity?: number | null
          symptom: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          recorded_at?: string | null
          severity?: number | null
          symptom?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          content: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          rating: number | null
          role: string | null
        }
        Insert: {
          avatar_url?: string | null
          content: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          rating?: number | null
          role?: string | null
        }
        Update: {
          avatar_url?: string | null
          content?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          rating?: number | null
          role?: string | null
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          accepted: boolean | null
          accepted_at: string | null
          consent_type: string
          created_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
          version: string | null
        }
        Insert: {
          accepted?: boolean | null
          accepted_at?: string | null
          consent_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
          version?: string | null
        }
        Update: {
          accepted?: boolean | null
          accepted_at?: string | null
          consent_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string | null
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          current_page: string | null
          id: string
          last_seen_at: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          current_page?: string | null
          id?: string
          last_seen_at?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          current_page?: string | null
          id?: string
          last_seen_at?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_presence_logs: {
        Row: {
          appointment_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_presence_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          pix_key: string | null
          pix_key_type: string | null
          processed_at: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          pix_key?: string | null
          pix_key_type?: string | null
          processed_at?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          pix_key?: string | null
          pix_key_type?: string | null
          processed_at?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_admin_doctor_kyc_list: { Args: never; Returns: Json[] }
      fn_admin_set_doctor_kyc: {
        Args: { p_doctor_id: string; p_status: string }
        Returns: undefined
      }
      get_public_doctor_profile: {
        Args: { p_doctor_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      resolve_doctor_slug: { Args: { p_slug: string }; Returns: string }
      search_doctor_by_name: { Args: { p_query: string }; Returns: Json[] }
    }
    Enums: {
      app_role:
        | "admin"
        | "doctor"
        | "patient"
        | "clinic"
        | "reception"
        | "support"
        | "partner"
        | "laudista"
        | "ophthalmologist"
      appointment_status:
        | "scheduled"
        | "waiting"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
        | "payment_pending"
      appointment_type: "first_visit" | "return" | "urgency"
      approval_status: "pending" | "approved" | "rejected"
      ticket_priority: "low" | "medium" | "high" | "critical"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "doctor",
        "patient",
        "clinic",
        "reception",
        "support",
        "partner",
        "laudista",
        "ophthalmologist",
      ],
      appointment_status: [
        "scheduled",
        "waiting",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
        "payment_pending",
      ],
      appointment_type: ["first_visit", "return", "urgency"],
      approval_status: ["pending", "approved", "rejected"],
      ticket_priority: ["low", "medium", "high", "critical"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
