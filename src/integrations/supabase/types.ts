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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          consent_reference: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          performed_by: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          consent_reference?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          performed_by?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          consent_reference?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          performed_by?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          role_context: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          role_context?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          role_context?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aloc_exames: {
        Row: {
          created_at: string
          id: string
          laudista_id: string | null
          medico_solicitante_id: string | null
          orthanc_study_uid: string | null
          orthanc_study_url: string | null
          paciente_id: string | null
          status: string
          tipo_exame: string
        }
        Insert: {
          created_at?: string
          id?: string
          laudista_id?: string | null
          medico_solicitante_id?: string | null
          orthanc_study_uid?: string | null
          orthanc_study_url?: string | null
          paciente_id?: string | null
          status?: string
          tipo_exame?: string
        }
        Update: {
          created_at?: string
          id?: string
          laudista_id?: string | null
          medico_solicitante_id?: string | null
          orthanc_study_uid?: string | null
          orthanc_study_url?: string | null
          paciente_id?: string | null
          status?: string
          tipo_exame?: string
        }
        Relationships: []
      }
      aloc_laudos: {
        Row: {
          assinado_em: string | null
          conteudo_html: string
          conteudo_ia: string | null
          created_at: string
          exame_id: string
          id: string
          medico_id: string
          pdf_url: string | null
          qr_token: string | null
          status: string
        }
        Insert: {
          assinado_em?: string | null
          conteudo_html?: string
          conteudo_ia?: string | null
          created_at?: string
          exame_id: string
          id?: string
          medico_id: string
          pdf_url?: string | null
          qr_token?: string | null
          status?: string
        }
        Update: {
          assinado_em?: string | null
          conteudo_html?: string
          conteudo_ia?: string | null
          created_at?: string
          exame_id?: string
          id?: string
          medico_id?: string
          pdf_url?: string | null
          qr_token?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "aloc_laudos_exame_id_fkey"
            columns: ["exame_id"]
            isOneToOne: false
            referencedRelation: "aloc_exames"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      appointment_waitlist: {
        Row: {
          created_at: string
          desired_date: string
          desired_time: string | null
          doctor_id: string
          id: string
          notified: boolean
          patient_id: string
        }
        Insert: {
          created_at?: string
          desired_date: string
          desired_time?: string | null
          doctor_id: string
          id?: string
          notified?: boolean
          patient_id: string
        }
        Update: {
          created_at?: string
          desired_date?: string
          desired_time?: string | null
          doctor_id?: string
          id?: string
          notified?: boolean
          patient_id?: string
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
            foreignKeyName: "appointment_waitlist_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          access_token: string | null
          appointment_type: string | null
          cancel_reason: string | null
          cancelled_by: string | null
          created_at: string
          doctor_id: string
          duration_minutes: number | null
          guest_patient_id: string | null
          id: string
          jitsi_link: string | null
          jitsi_room_id: string | null
          lembrete_enviado: boolean | null
          notes: string | null
          original_appointment_id: string | null
          patient_id: string | null
          payment_confirmed_at: string | null
          payment_confirmed_by: string | null
          payment_status: string | null
          price_at_booking: number | null
          return_deadline: string | null
          scheduled_at: string
          status: string
          updated_at: string
          video_room_url: string | null
        }
        Insert: {
          access_token?: string | null
          appointment_type?: string | null
          cancel_reason?: string | null
          cancelled_by?: string | null
          created_at?: string
          doctor_id: string
          duration_minutes?: number | null
          guest_patient_id?: string | null
          id?: string
          jitsi_link?: string | null
          jitsi_room_id?: string | null
          lembrete_enviado?: boolean | null
          notes?: string | null
          original_appointment_id?: string | null
          patient_id?: string | null
          payment_confirmed_at?: string | null
          payment_confirmed_by?: string | null
          payment_status?: string | null
          price_at_booking?: number | null
          return_deadline?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
          video_room_url?: string | null
        }
        Update: {
          access_token?: string | null
          appointment_type?: string | null
          cancel_reason?: string | null
          cancelled_by?: string | null
          created_at?: string
          doctor_id?: string
          duration_minutes?: number | null
          guest_patient_id?: string | null
          id?: string
          jitsi_link?: string | null
          jitsi_room_id?: string | null
          lembrete_enviado?: boolean | null
          notes?: string | null
          original_appointment_id?: string | null
          patient_id?: string | null
          payment_confirmed_at?: string | null
          payment_confirmed_by?: string | null
          payment_status?: string | null
          price_at_booking?: number | null
          return_deadline?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
          video_room_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_guest_patient_id_fkey"
            columns: ["guest_patient_id"]
            isOneToOne: false
            referencedRelation: "guest_patients"
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
          {
            foreignKeyName: "availability_slots_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_leads: {
        Row: {
          cnpj: string | null
          company_name: string
          company_type: string
          contact_name: string
          created_at: string
          email: string
          id: string
          message: string | null
          notes: string | null
          phone: string | null
          services_interested: Json
          status: string
        }
        Insert: {
          cnpj?: string | null
          company_name: string
          company_type?: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          services_interested?: Json
          status?: string
        }
        Update: {
          cnpj?: string | null
          company_name?: string
          company_type?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          services_interested?: Json
          status?: string
        }
        Relationships: []
      }
      care_plans: {
        Row: {
          appointment_id: string | null
          created_at: string
          description: string | null
          doctor_id: string
          follow_up_date: string | null
          follow_up_notes: string | null
          id: string
          lifestyle: Json | null
          medications: Json | null
          objectives: Json | null
          patient_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          description?: string | null
          doctor_id: string
          follow_up_date?: string | null
          follow_up_notes?: string | null
          id?: string
          lifestyle?: Json | null
          medications?: Json | null
          objectives?: Json | null
          patient_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          description?: string | null
          doctor_id?: string
          follow_up_date?: string | null
          follow_up_notes?: string | null
          id?: string
          lifestyle?: Json | null
          medications?: Json | null
          objectives?: Json | null
          patient_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_plans_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plans_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plans_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_affiliations: {
        Row: {
          clinic_id: string
          commission_percent: number
          created_at: string
          doctor_id: string
          id: string
          status: string
        }
        Insert: {
          clinic_id: string
          commission_percent?: number
          created_at?: string
          doctor_id: string
          id?: string
          status?: string
        }
        Update: {
          clinic_id?: string
          commission_percent?: number
          created_at?: string
          doctor_id?: string
          id?: string
          status?: string
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
          {
            foreignKeyName: "clinic_affiliations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_profiles: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clinical_anamnesis: {
        Row: {
          appointment_id: string
          blood_pressure_dia: number | null
          blood_pressure_sys: number | null
          chief_complaint: string
          cid_codes: string[] | null
          created_at: string
          diagnostic_hypothesis: string | null
          doctor_id: string
          family_history: string | null
          gender: string | null
          heart_rate: number | null
          height: number | null
          history_present_illness: string | null
          id: string
          lifestyle_habits: string | null
          past_medical_history: string | null
          patient_id: string
          physical_exam_notes: string | null
          respiratory_rate: number | null
          review_of_systems: string | null
          social_name: string | null
          spo2: number | null
          temperature: number | null
          treatment_plan: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          appointment_id: string
          blood_pressure_dia?: number | null
          blood_pressure_sys?: number | null
          chief_complaint?: string
          cid_codes?: string[] | null
          created_at?: string
          diagnostic_hypothesis?: string | null
          doctor_id: string
          family_history?: string | null
          gender?: string | null
          heart_rate?: number | null
          height?: number | null
          history_present_illness?: string | null
          id?: string
          lifestyle_habits?: string | null
          past_medical_history?: string | null
          patient_id: string
          physical_exam_notes?: string | null
          respiratory_rate?: number | null
          review_of_systems?: string | null
          social_name?: string | null
          spo2?: number | null
          temperature?: number | null
          treatment_plan?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          appointment_id?: string
          blood_pressure_dia?: number | null
          blood_pressure_sys?: number | null
          chief_complaint?: string
          cid_codes?: string[] | null
          created_at?: string
          diagnostic_hypothesis?: string | null
          doctor_id?: string
          family_history?: string | null
          gender?: string | null
          heart_rate?: number | null
          height?: number | null
          history_present_illness?: string | null
          id?: string
          lifestyle_habits?: string | null
          past_medical_history?: string | null
          patient_id?: string
          physical_exam_notes?: string | null
          respiratory_rate?: number | null
          review_of_systems?: string | null
          social_name?: string | null
          spo2?: number | null
          temperature?: number | null
          treatment_plan?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_anamnesis_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_anamnesis_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_anamnesis_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_evolution_audit: {
        Row: {
          changed_at: string
          changed_by: string
          field_name: string
          id: string
          ip_address: string | null
          new_value: string | null
          old_value: string | null
          record_id: string
          record_table: string
          user_agent: string | null
        }
        Insert: {
          changed_at?: string
          changed_by: string
          field_name: string
          id?: string
          ip_address?: string | null
          new_value?: string | null
          old_value?: string | null
          record_id: string
          record_table?: string
          user_agent?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string
          field_name?: string
          id?: string
          ip_address?: string | null
          new_value?: string | null
          old_value?: string | null
          record_id?: string
          record_table?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      consultation_notes: {
        Row: {
          appointment_id: string
          content: string
          created_at: string
          doctor_id: string
          id: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          content?: string
          created_at?: string
          doctor_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          content?: string
          created_at?: string
          doctor_id?: string
          id?: string
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
          {
            foreignKeyName: "consultation_notes_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_recordings: {
        Row: {
          appointment_id: string
          consent_at: string | null
          consent_given: boolean
          created_at: string
          doctor_id: string
          duration_seconds: number | null
          expires_at: string | null
          file_size_bytes: number | null
          id: string
          patient_id: string
          status: string
          storage_path: string | null
        }
        Insert: {
          appointment_id: string
          consent_at?: string | null
          consent_given?: boolean
          created_at?: string
          doctor_id: string
          duration_seconds?: number | null
          expires_at?: string | null
          file_size_bytes?: number | null
          id?: string
          patient_id: string
          status?: string
          storage_path?: string | null
        }
        Update: {
          appointment_id?: string
          consent_at?: string | null
          consent_given?: boolean
          created_at?: string
          doctor_id?: string
          duration_seconds?: number | null
          expires_at?: string | null
          file_size_bytes?: number | null
          id?: string
          patient_id?: string
          status?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_recordings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_recordings_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_recordings_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_percentage: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          times_used: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_percentage?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          times_used?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_percentage?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          times_used?: number
        }
        Relationships: []
      }
      dependents: {
        Row: {
          cpf: string | null
          created_at: string
          date_of_birth: string | null
          id: string
          name: string
          relationship: string
          user_id: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          name: string
          relationship: string
          user_id: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          name?: string
          relationship?: string
          user_id?: string
        }
        Relationships: []
      }
      discount_cards: {
        Row: {
          cancelled_at: string | null
          created_at: string
          discount_percent: number
          id: string
          payment_id: string | null
          plan_type: string
          price_monthly: number
          status: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          discount_percent?: number
          id?: string
          payment_id?: string | null
          plan_type?: string
          price_monthly?: number
          status?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          discount_percent?: number
          id?: string
          payment_id?: string | null
          plan_type?: string
          price_monthly?: number
          status?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      doctor_absences: {
        Row: {
          absence_date: string
          created_at: string
          doctor_id: string
          id: string
          reason: string | null
        }
        Insert: {
          absence_date: string
          created_at?: string
          doctor_id: string
          id?: string
          reason?: string | null
        }
        Update: {
          absence_date?: string
          created_at?: string
          doctor_id?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_absences_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_absences_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_applications: {
        Row: {
          admin_notes: string | null
          bio: string | null
          created_at: string
          crm: string
          crm_state: string
          email: string
          full_name: string
          id: string
          invite_code_id: string | null
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          specialty: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          bio?: string | null
          created_at?: string
          crm: string
          crm_state?: string
          email: string
          full_name: string
          id?: string
          invite_code_id?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialty?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          bio?: string | null
          created_at?: string
          crm?: string
          crm_state?: string
          email?: string
          full_name?: string
          id?: string
          invite_code_id?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialty?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_applications_invite_code_id_fkey"
            columns: ["invite_code_id"]
            isOneToOne: false
            referencedRelation: "doctor_invite_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_care_areas: {
        Row: {
          area_name: string
          created_at: string
          doctor_id: string
          id: string
        }
        Insert: {
          area_name: string
          created_at?: string
          doctor_id: string
          id?: string
        }
        Update: {
          area_name?: string
          created_at?: string
          doctor_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_care_areas_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_care_areas_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_financial: {
        Row: {
          created_at: string | null
          doctor_id: string
          id: string
          pix_key: string | null
          pix_key_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          doctor_id: string
          id?: string
          pix_key?: string | null
          pix_key_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          doctor_id?: string
          id?: string
          pix_key?: string | null
          pix_key_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_financial_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: true
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_financial_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: true
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_used: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      doctor_profiles: {
        Row: {
          accepts_insurance: boolean | null
          address_city: string | null
          address_complement: string | null
          address_country: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          auto_confirm_bookings: boolean | null
          available_for_in_person: boolean | null
          available_for_telemedicine: boolean | null
          available_now: boolean
          available_now_since: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          certifications: Json | null
          consultation_duration_min: number | null
          consultation_price: number | null
          cover_url: string | null
          cpf: string | null
          created_at: string
          crm: string
          crm_state: string
          crm_verified: boolean
          crm_verified_at: string | null
          crm_verified_by: string | null
          display_name: string | null
          doctor_type: Database["public"]["Enums"]["doctor_type"]
          education: string | null
          education_list: Json | null
          experience_years: number | null
          full_name: string | null
          gender: string | null
          id: string
          insurance_plans: string[] | null
          is_approved: boolean | null
          kyc_face_match_score: number | null
          kyc_status: string
          kyc_verified_at: string | null
          languages: string[] | null
          phone: string | null
          rating: number | null
          rejection_reason: string | null
          rqe: string | null
          short_description: string | null
          show_in_directory: boolean | null
          specialty_id: string | null
          sub_specialties: string[] | null
          timezone: string | null
          total_reviews: number | null
          updated_at: string
          user_id: string
          video_intro_url: string | null
          whatsapp: string | null
        }
        Insert: {
          accepts_insurance?: boolean | null
          address_city?: string | null
          address_complement?: string | null
          address_country?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          auto_confirm_bookings?: boolean | null
          available_for_in_person?: boolean | null
          available_for_telemedicine?: boolean | null
          available_now?: boolean
          available_now_since?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          certifications?: Json | null
          consultation_duration_min?: number | null
          consultation_price?: number | null
          cover_url?: string | null
          cpf?: string | null
          created_at?: string
          crm: string
          crm_state?: string
          crm_verified?: boolean
          crm_verified_at?: string | null
          crm_verified_by?: string | null
          display_name?: string | null
          doctor_type?: Database["public"]["Enums"]["doctor_type"]
          education?: string | null
          education_list?: Json | null
          experience_years?: number | null
          full_name?: string | null
          gender?: string | null
          id?: string
          insurance_plans?: string[] | null
          is_approved?: boolean | null
          kyc_face_match_score?: number | null
          kyc_status?: string
          kyc_verified_at?: string | null
          languages?: string[] | null
          phone?: string | null
          rating?: number | null
          rejection_reason?: string | null
          rqe?: string | null
          short_description?: string | null
          show_in_directory?: boolean | null
          specialty_id?: string | null
          sub_specialties?: string[] | null
          timezone?: string | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
          video_intro_url?: string | null
          whatsapp?: string | null
        }
        Update: {
          accepts_insurance?: boolean | null
          address_city?: string | null
          address_complement?: string | null
          address_country?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          auto_confirm_bookings?: boolean | null
          available_for_in_person?: boolean | null
          available_for_telemedicine?: boolean | null
          available_now?: boolean
          available_now_since?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          certifications?: Json | null
          consultation_duration_min?: number | null
          consultation_price?: number | null
          cover_url?: string | null
          cpf?: string | null
          created_at?: string
          crm?: string
          crm_state?: string
          crm_verified?: boolean
          crm_verified_at?: string | null
          crm_verified_by?: string | null
          display_name?: string | null
          doctor_type?: Database["public"]["Enums"]["doctor_type"]
          education?: string | null
          education_list?: Json | null
          experience_years?: number | null
          full_name?: string | null
          gender?: string | null
          id?: string
          insurance_plans?: string[] | null
          is_approved?: boolean | null
          kyc_face_match_score?: number | null
          kyc_status?: string
          kyc_verified_at?: string | null
          languages?: string[] | null
          phone?: string | null
          rating?: number | null
          rejection_reason?: string | null
          rqe?: string | null
          short_description?: string | null
          show_in_directory?: boolean | null
          specialty_id?: string | null
          sub_specialties?: string[] | null
          timezone?: string | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
          video_intro_url?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_profiles_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_specialties: {
        Row: {
          doctor_id: string
          id: string
          specialty_id: string
        }
        Insert: {
          doctor_id: string
          id?: string
          specialty_id: string
        }
        Update: {
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
            foreignKeyName: "doctor_specialties_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
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
          doctor_name: string
          document_hash: string | null
          document_type: string
          id: string
          issued_at: string
          patient_cpf: string | null
          patient_name: string
          verification_code: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          doctor_crm?: string | null
          doctor_name: string
          document_hash?: string | null
          document_type?: string
          id?: string
          issued_at?: string
          patient_cpf?: string | null
          patient_name: string
          verification_code: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          doctor_crm?: string | null
          doctor_name?: string
          document_hash?: string | null
          document_type?: string
          id?: string
          issued_at?: string
          patient_cpf?: string | null
          patient_name?: string
          verification_code?: string
        }
        Relationships: []
      }
      exam_reports: {
        Row: {
          content_text: string
          created_at: string
          document_hash: string | null
          exam_request_id: string
          id: string
          pdf_url: string | null
          reporter_id: string
          signed_at: string | null
          template_id: string | null
          updated_at: string
          verification_code: string | null
        }
        Insert: {
          content_text?: string
          created_at?: string
          document_hash?: string | null
          exam_request_id: string
          id?: string
          pdf_url?: string | null
          reporter_id: string
          signed_at?: string | null
          template_id?: string | null
          updated_at?: string
          verification_code?: string | null
        }
        Update: {
          content_text?: string
          created_at?: string
          document_hash?: string | null
          exam_request_id?: string
          id?: string
          pdf_url?: string | null
          reporter_id?: string
          signed_at?: string | null
          template_id?: string | null
          updated_at?: string
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_reports_exam_request_id_fkey"
            columns: ["exam_request_id"]
            isOneToOne: false
            referencedRelation: "exam_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_requests: {
        Row: {
          assigned_to: string | null
          clinical_info: string | null
          completed_at: string | null
          created_at: string
          exam_date: string | null
          exam_type: string
          file_urls: Json
          id: string
          orthanc_study_uid: string | null
          patient_birth_date: string | null
          patient_id: string | null
          patient_name: string | null
          patient_sex: string | null
          priority: string
          requesting_clinic_id: string | null
          requesting_doctor_id: string | null
          sla_deadline: string | null
          sla_hours: number | null
          source: string | null
          specialty_required: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          clinical_info?: string | null
          completed_at?: string | null
          created_at?: string
          exam_date?: string | null
          exam_type: string
          file_urls?: Json
          id?: string
          orthanc_study_uid?: string | null
          patient_birth_date?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_sex?: string | null
          priority?: string
          requesting_clinic_id?: string | null
          requesting_doctor_id?: string | null
          sla_deadline?: string | null
          sla_hours?: number | null
          source?: string | null
          specialty_required?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          clinical_info?: string | null
          completed_at?: string | null
          created_at?: string
          exam_date?: string | null
          exam_type?: string
          file_urls?: Json
          id?: string
          orthanc_study_uid?: string | null
          patient_birth_date?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_sex?: string | null
          priority?: string
          requesting_clinic_id?: string | null
          requesting_doctor_id?: string | null
          sla_deadline?: string | null
          sla_hours?: number | null
          source?: string | null
          specialty_required?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_requests_requesting_clinic_id_fkey"
            columns: ["requesting_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_requests_requesting_doctor_id_fkey"
            columns: ["requesting_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_requests_requesting_doctor_id_fkey"
            columns: ["requesting_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      exames: {
        Row: {
          arquivo_url: string | null
          assinado_em: string | null
          clinica_id: string | null
          created_at: string
          id: string
          laudista_id: string | null
          laudo_texto: string | null
          lembrete_enviado: boolean | null
          observacoes: string | null
          origem: string
          orthanc_study_uid: string | null
          paciente_id: string | null
          paciente_nome: string
          pdf_url: string | null
          status: string
          study_uid: string | null
          tipo_exame: string
          updated_at: string
        }
        Insert: {
          arquivo_url?: string | null
          assinado_em?: string | null
          clinica_id?: string | null
          created_at?: string
          id?: string
          laudista_id?: string | null
          laudo_texto?: string | null
          lembrete_enviado?: boolean | null
          observacoes?: string | null
          origem?: string
          orthanc_study_uid?: string | null
          paciente_id?: string | null
          paciente_nome: string
          pdf_url?: string | null
          status?: string
          study_uid?: string | null
          tipo_exame?: string
          updated_at?: string
        }
        Update: {
          arquivo_url?: string | null
          assinado_em?: string | null
          clinica_id?: string | null
          created_at?: string
          id?: string
          laudista_id?: string | null
          laudo_texto?: string | null
          lembrete_enviado?: boolean | null
          observacoes?: string | null
          origem?: string
          orthanc_study_uid?: string | null
          paciente_id?: string | null
          paciente_nome?: string
          pdf_url?: string | null
          status?: string
          study_uid?: string | null
          tipo_exame?: string
          updated_at?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          order_index: number
          question: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          question: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
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
          {
            foreignKeyName: "favorite_doctors_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_patients: {
        Row: {
          cpf: string
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string
          id: string
          phone: string
        }
        Insert: {
          cpf: string
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name: string
          id?: string
          phone: string
        }
        Update: {
          cpf?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      health_cards: {
        Row: {
          allergies: string[] | null
          blood_type: string | null
          card_number: string | null
          chronic_conditions: string[] | null
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          health_plan_name: string | null
          health_plan_number: string | null
          health_plan_valid_until: string | null
          id: string
          notes: string | null
          organ_donor: boolean | null
          qr_token: string | null
          sus_card_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string[] | null
          blood_type?: string | null
          card_number?: string | null
          chronic_conditions?: string[] | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          health_plan_name?: string | null
          health_plan_number?: string | null
          health_plan_valid_until?: string | null
          id?: string
          notes?: string | null
          organ_donor?: boolean | null
          qr_token?: string | null
          sus_card_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string[] | null
          blood_type?: string | null
          card_number?: string | null
          chronic_conditions?: string[] | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          health_plan_name?: string | null
          health_plan_number?: string | null
          health_plan_valid_until?: string | null
          id?: string
          notes?: string | null
          organ_donor?: boolean | null
          qr_token?: string | null
          sus_card_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_metrics: {
        Row: {
          created_at: string | null
          id: string
          measured_at: string | null
          notes: string | null
          patient_id: string
          type: string
          unit: string
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          measured_at?: string | null
          notes?: string | null
          patient_id: string
          type: string
          unit: string
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          measured_at?: string | null
          notes?: string | null
          patient_id?: string
          type?: string
          unit?: string
          value?: number
        }
        Relationships: []
      }
      health_tips: {
        Row: {
          category: string
          content: string
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      kyc_verificacoes: {
        Row: {
          created_at: string
          id: string
          similarity: number | null
          status: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          similarity?: number | null
          status?: string
          tipo?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          similarity?: number | null
          status?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      lgpd_access_log: {
        Row: {
          accessor_id: string | null
          accessor_role: string | null
          action: string
          created_at: string
          data_owner_id: string
          id: string
          ip_address: string | null
          resource: string
          resource_id: string | null
          user_agent: string | null
        }
        Insert: {
          accessor_id?: string | null
          accessor_role?: string | null
          action: string
          created_at?: string
          data_owner_id: string
          id?: string
          ip_address?: string | null
          resource: string
          resource_id?: string | null
          user_agent?: string | null
        }
        Update: {
          accessor_id?: string | null
          accessor_role?: string | null
          action?: string
          created_at?: string
          data_owner_id?: string
          id?: string
          ip_address?: string | null
          resource?: string
          resource_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      lgpd_deletion_requests: {
        Row: {
          admin_notes: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          requested_at: string
          scheduled_deletion_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string
          scheduled_deletion_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string
          scheduled_deletion_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      medical_record_access_logs: {
        Row: {
          access_type: string
          accessed_by: string
          created_at: string
          id: string
          ip_address: string | null
          patient_id: string
          record_id: string | null
          user_agent: string | null
        }
        Insert: {
          access_type?: string
          accessed_by: string
          created_at?: string
          id?: string
          ip_address?: string | null
          patient_id: string
          record_id?: string | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_by?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          patient_id?: string
          record_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_access_logs_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          appointment_id: string | null
          cid_code: string | null
          created_at: string
          description: string | null
          doctor_id: string | null
          end_date: string | null
          id: string
          is_active: boolean
          patient_id: string
          record_type: string
          severity: string | null
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          cid_code?: string | null
          created_at?: string
          description?: string | null
          doctor_id?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          patient_id: string
          record_type: string
          severity?: string | null
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          cid_code?: string | null
          created_at?: string
          description?: string | null
          doctor_id?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          patient_id?: string
          record_type?: string
          severity?: string | null
          start_date?: string | null
          title?: string
          updated_at?: string
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
          {
            foreignKeyName: "medical_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          appointment_id: string
          content: string
          created_at: string
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          appointment_id: string
          content?: string
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          appointment_id?: string
          content?: string
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
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
          email: string
          id: string
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          canal: string | null
          created_at: string | null
          id: string
          mensagem: string | null
          status: string
          tipo: string
          user_id: string | null
        }
        Insert: {
          canal?: string | null
          created_at?: string | null
          id?: string
          mensagem?: string | null
          status: string
          tipo: string
          user_id?: string | null
        }
        Update: {
          canal?: string | null
          created_at?: string | null
          id?: string
          mensagem?: string | null
          status?: string
          tipo?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      on_demand_queue: {
        Row: {
          appointment_id: string | null
          assigned_at: string | null
          assigned_doctor_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          patient_id: string
          payment_id: string | null
          position: number | null
          price: number
          shift: string
          started_at: string | null
          status: string
        }
        Insert: {
          appointment_id?: string | null
          assigned_at?: string | null
          assigned_doctor_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          patient_id: string
          payment_id?: string | null
          position?: number | null
          price?: number
          shift?: string
          started_at?: string | null
          status?: string
        }
        Update: {
          appointment_id?: string | null
          assigned_at?: string | null
          assigned_doctor_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          patient_id?: string
          payment_id?: string | null
          position?: number | null
          price?: number
          shift?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "on_demand_queue_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "on_demand_queue_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "on_demand_queue_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ophthalmology_exams: {
        Row: {
          assigned_doctor_id: string | null
          clinic_id: string | null
          created_at: string | null
          exam_type: string
          file_urls: Json | null
          id: string
          intraocular_pressure_od: number | null
          intraocular_pressure_oe: number | null
          notes: string | null
          od_acuity: string | null
          od_axis: number | null
          od_cylindrical: number | null
          od_spherical: number | null
          oe_acuity: string | null
          oe_axis: number | null
          oe_cylindrical: number | null
          oe_spherical: number | null
          patient_birth_date: string | null
          patient_cpf: string | null
          patient_name: string
          status: string
          technician_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_doctor_id?: string | null
          clinic_id?: string | null
          created_at?: string | null
          exam_type?: string
          file_urls?: Json | null
          id?: string
          intraocular_pressure_od?: number | null
          intraocular_pressure_oe?: number | null
          notes?: string | null
          od_acuity?: string | null
          od_axis?: number | null
          od_cylindrical?: number | null
          od_spherical?: number | null
          oe_acuity?: string | null
          oe_axis?: number | null
          oe_cylindrical?: number | null
          oe_spherical?: number | null
          patient_birth_date?: string | null
          patient_cpf?: string | null
          patient_name: string
          status?: string
          technician_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_doctor_id?: string | null
          clinic_id?: string | null
          created_at?: string | null
          exam_type?: string
          file_urls?: Json | null
          id?: string
          intraocular_pressure_od?: number | null
          intraocular_pressure_oe?: number | null
          notes?: string | null
          od_acuity?: string | null
          od_axis?: number | null
          od_cylindrical?: number | null
          od_spherical?: number | null
          oe_acuity?: string | null
          oe_axis?: number | null
          oe_cylindrical?: number | null
          oe_spherical?: number | null
          patient_birth_date?: string | null
          patient_cpf?: string | null
          patient_name?: string
          status?: string
          technician_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ophthalmology_exams_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ophthalmology_exams_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ophthalmology_exams_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ophthalmology_prescriptions: {
        Row: {
          created_at: string | null
          doctor_id: string
          exam_id: string
          id: string
          interpupillary_distance: number | null
          lens_material: string | null
          lens_treatment: string | null
          lens_type: string | null
          observations: string | null
          od_addition: number | null
          od_axis: number | null
          od_cylindrical: number | null
          od_prism: number | null
          od_prism_base: string | null
          od_spherical: number | null
          oe_addition: number | null
          oe_axis: number | null
          oe_cylindrical: number | null
          oe_prism: number | null
          oe_prism_base: string | null
          oe_spherical: number | null
          patient_cpf: string | null
          patient_name: string
          pdf_url: string | null
          signed_at: string | null
          updated_at: string | null
          verification_code: string | null
        }
        Insert: {
          created_at?: string | null
          doctor_id: string
          exam_id: string
          id?: string
          interpupillary_distance?: number | null
          lens_material?: string | null
          lens_treatment?: string | null
          lens_type?: string | null
          observations?: string | null
          od_addition?: number | null
          od_axis?: number | null
          od_cylindrical?: number | null
          od_prism?: number | null
          od_prism_base?: string | null
          od_spherical?: number | null
          oe_addition?: number | null
          oe_axis?: number | null
          oe_cylindrical?: number | null
          oe_prism?: number | null
          oe_prism_base?: string | null
          oe_spherical?: number | null
          patient_cpf?: string | null
          patient_name: string
          pdf_url?: string | null
          signed_at?: string | null
          updated_at?: string | null
          verification_code?: string | null
        }
        Update: {
          created_at?: string | null
          doctor_id?: string
          exam_id?: string
          id?: string
          interpupillary_distance?: number | null
          lens_material?: string | null
          lens_treatment?: string | null
          lens_type?: string | null
          observations?: string | null
          od_addition?: number | null
          od_axis?: number | null
          od_cylindrical?: number | null
          od_prism?: number | null
          od_prism_base?: string | null
          od_spherical?: number | null
          oe_addition?: number | null
          oe_axis?: number | null
          oe_cylindrical?: number | null
          oe_prism?: number | null
          oe_prism_base?: string | null
          oe_spherical?: number | null
          patient_cpf?: string | null
          patient_name?: string
          pdf_url?: string | null
          signed_at?: string | null
          updated_at?: string | null
          verification_code?: string | null
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
            foreignKeyName: "ophthalmology_prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
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
      optical_frames: {
        Row: {
          brand: string
          bridge_size: number | null
          color: string
          created_at: string
          discount_price: number | null
          gender: string
          id: string
          image_urls: Json
          is_active: boolean
          lens_width: number | null
          material: string
          model: string
          name: string
          price: number
          shape: string
          stock_qty: number
          temple_length: number | null
          updated_at: string
        }
        Insert: {
          brand?: string
          bridge_size?: number | null
          color?: string
          created_at?: string
          discount_price?: number | null
          gender?: string
          id?: string
          image_urls?: Json
          is_active?: boolean
          lens_width?: number | null
          material?: string
          model?: string
          name: string
          price?: number
          shape?: string
          stock_qty?: number
          temple_length?: number | null
          updated_at?: string
        }
        Update: {
          brand?: string
          bridge_size?: number | null
          color?: string
          created_at?: string
          discount_price?: number | null
          gender?: string
          id?: string
          image_urls?: Json
          is_active?: boolean
          lens_width?: number | null
          material?: string
          model?: string
          name?: string
          price?: number
          shape?: string
          stock_qty?: number
          temple_length?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      optical_lens_types: {
        Row: {
          coatings: string[]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          lens_type: string
          material: string
          name: string
          price: number
        }
        Insert: {
          coatings?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          lens_type?: string
          material?: string
          name: string
          price?: number
        }
        Update: {
          coatings?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          lens_type?: string
          material?: string
          name?: string
          price?: number
        }
        Relationships: []
      }
      optical_orders: {
        Row: {
          cancelled_at: string | null
          created_at: string
          delivered_at: string | null
          discount_amount: number
          frame_id: string | null
          frame_price: number
          id: string
          internal_notes: string | null
          interpupillary_distance: number | null
          lens_price: number
          lens_type_id: string | null
          notes: string | null
          od_addition: number | null
          od_axis: number | null
          od_cylindrical: number | null
          od_spherical: number | null
          oe_addition: number | null
          oe_axis: number | null
          oe_cylindrical: number | null
          oe_spherical: number | null
          order_number: string
          paid_at: string | null
          patient_id: string
          payment_id: string | null
          payment_status: string
          prescription_id: string | null
          shipped_at: string | null
          shipping_address: Json | null
          status: string
          total_price: number
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          delivered_at?: string | null
          discount_amount?: number
          frame_id?: string | null
          frame_price?: number
          id?: string
          internal_notes?: string | null
          interpupillary_distance?: number | null
          lens_price?: number
          lens_type_id?: string | null
          notes?: string | null
          od_addition?: number | null
          od_axis?: number | null
          od_cylindrical?: number | null
          od_spherical?: number | null
          oe_addition?: number | null
          oe_axis?: number | null
          oe_cylindrical?: number | null
          oe_spherical?: number | null
          order_number?: string
          paid_at?: string | null
          patient_id: string
          payment_id?: string | null
          payment_status?: string
          prescription_id?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          status?: string
          total_price?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          delivered_at?: string | null
          discount_amount?: number
          frame_id?: string | null
          frame_price?: number
          id?: string
          internal_notes?: string | null
          interpupillary_distance?: number | null
          lens_price?: number
          lens_type_id?: string | null
          notes?: string | null
          od_addition?: number | null
          od_axis?: number | null
          od_cylindrical?: number | null
          od_spherical?: number | null
          oe_addition?: number | null
          oe_axis?: number | null
          oe_cylindrical?: number | null
          oe_spherical?: number | null
          order_number?: string
          paid_at?: string | null
          patient_id?: string
          payment_id?: string | null
          payment_status?: string
          prescription_id?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          status?: string
          total_price?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "optical_orders_frame_id_fkey"
            columns: ["frame_id"]
            isOneToOne: false
            referencedRelation: "optical_frames"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optical_orders_lens_type_id_fkey"
            columns: ["lens_type_id"]
            isOneToOne: false
            referencedRelation: "optical_lens_types"
            referencedColumns: ["id"]
          },
        ]
      }
      optical_production: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          order_id: string
          stage: string
          started_at: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          stage?: string
          started_at?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          stage?: string
          started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "optical_production_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "optical_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      optical_stock_movements: {
        Row: {
          created_at: string
          frame_id: string
          id: string
          movement_type: string
          order_id: string | null
          performed_by: string | null
          quantity: number
          reason: string | null
        }
        Insert: {
          created_at?: string
          frame_id: string
          id?: string
          movement_type?: string
          order_id?: string | null
          performed_by?: string | null
          quantity: number
          reason?: string | null
        }
        Update: {
          created_at?: string
          frame_id?: string
          id?: string
          movement_type?: string
          order_id?: string | null
          performed_by?: string | null
          quantity?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "optical_stock_movements_frame_id_fkey"
            columns: ["frame_id"]
            isOneToOne: false
            referencedRelation: "optical_frames"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optical_stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "optical_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      optical_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          payment_method: string | null
          type: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string | null
          type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "optical_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "optical_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profiles: {
        Row: {
          address: string | null
          business_name: string
          cnpj: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          partner_type: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          business_name: string
          cnpj?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          partner_type?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          business_name?: string
          cnpj?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          partner_type?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_consents: {
        Row: {
          accepted_at: string
          appointment_id: string
          consent_text: string
          consent_type: string
          created_at: string
          id: string
          ip_address: string | null
          patient_id: string
          revoked_at: string | null
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string
          appointment_id: string
          consent_text: string
          consent_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          patient_id: string
          revoked_at?: string | null
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string
          appointment_id?: string
          consent_text?: string
          consent_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          patient_id?: string
          revoked_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_consents_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_documents: {
        Row: {
          appointment_id: string | null
          category: string
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          patient_id: string
          uploaded_by: string
        }
        Insert: {
          appointment_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          patient_id: string
          uploaded_by: string
        }
        Update: {
          appointment_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          patient_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json
          id: string
          interval: string
          is_active: boolean
          max_appointments: number | null
          name: string
          price: number
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          max_appointments?: number | null
          name: string
          price?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          max_appointments?: number | null
          name?: string
          price?: number
          stripe_price_id?: string | null
          updated_at?: string
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
          main_complaint: string
          patient_id: string
          severity: string | null
          symptoms: string[] | null
        }
        Insert: {
          additional_notes?: string | null
          appointment_id: string
          created_at?: string
          duration?: string | null
          id?: string
          main_complaint: string
          patient_id: string
          severity?: string | null
          symptoms?: string[] | null
        }
        Update: {
          additional_notes?: string | null
          appointment_id?: string
          created_at?: string
          duration?: string | null
          id?: string
          main_complaint?: string
          patient_id?: string
          severity?: string | null
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
          assigned_doctor_id: string | null
          created_at: string
          health_questionnaire: Json
          id: string
          new_prescription_id: string | null
          original_prescription_url: string | null
          paid_at: string | null
          patient_id: string
          payment_id: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_doctor_id?: string | null
          created_at?: string
          health_questionnaire?: Json
          id?: string
          new_prescription_id?: string | null
          original_prescription_url?: string | null
          paid_at?: string | null
          patient_id: string
          payment_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_doctor_id?: string | null
          created_at?: string
          health_questionnaire?: Json
          id?: string
          new_prescription_id?: string | null
          original_prescription_url?: string | null
          paid_at?: string | null
          patient_id?: string
          payment_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_renewals_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_renewals_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_renewals_new_prescription_id_fkey"
            columns: ["new_prescription_id"]
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
          notes: string | null
          partner_id: string | null
          prescription_id: string
          status: string
          validated_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          partner_id?: string | null
          prescription_id: string
          status?: string
          validated_by: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          partner_id?: string | null
          prescription_id?: string
          status?: string
          validated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_validations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_validations_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: true
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          appointment_id: string
          created_at: string
          diagnosis: string | null
          doctor_id: string
          document_hash: string | null
          id: string
          medications: Json
          observations: string | null
          patient_id: string
          pdf_url: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string
          diagnosis?: string | null
          doctor_id: string
          document_hash?: string | null
          id?: string
          medications?: Json
          observations?: string | null
          patient_id: string
          pdf_url?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string
          document_hash?: string | null
          id?: string
          medications?: Json
          observations?: string | null
          patient_id?: string
          pdf_url?: string | null
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
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allergies: string[] | null
          avatar_url: string | null
          blood_type: string | null
          chronic_conditions: string[] | null
          cpf: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string[] | null
          avatar_url?: string | null
          blood_type?: string | null
          chronic_conditions?: string[] | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string[] | null
          avatar_url?: string | null
          blood_type?: string | null
          chronic_conditions?: string[] | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          commission_paid: boolean | null
          commission_percent: number | null
          converted_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string | null
          referrer_id: string
          source: string | null
          status: string
        }
        Insert: {
          commission_paid?: boolean | null
          commission_percent?: number | null
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id?: string | null
          referrer_id: string
          source?: string | null
          status?: string
        }
        Update: {
          commission_paid?: boolean | null
          commission_percent?: number | null
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string | null
          referrer_id?: string
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          appointment_id: string
          created_at: string
          id: string
          patient_id: string
          payment_id: string | null
          processed_at: string | null
          reason: string
          refund_external_id: string | null
          requested_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          appointment_id: string
          created_at?: string
          id?: string
          patient_id: string
          payment_id?: string | null
          processed_at?: string | null
          reason?: string
          refund_external_id?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string
          created_at?: string
          id?: string
          patient_id?: string
          payment_id?: string | null
          processed_at?: string | null
          reason?: string
          refund_external_id?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          body_text: string
          created_at: string
          created_by: string
          exam_type: string
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          body_text?: string
          created_at?: string
          created_by: string
          exam_type: string
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          body_text?: string
          created_at?: string
          created_by?: string
          exam_type?: string
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      satisfaction_surveys: {
        Row: {
          appointment_id: string
          comment: string | null
          created_at: string
          doctor_id: string
          ease_score: number | null
          id: string
          nps_score: number
          patient_id: string
          quality_score: number | null
          would_recommend: boolean | null
        }
        Insert: {
          appointment_id: string
          comment?: string | null
          created_at?: string
          doctor_id: string
          ease_score?: number | null
          id?: string
          nps_score: number
          patient_id: string
          quality_score?: number | null
          would_recommend?: boolean | null
        }
        Update: {
          appointment_id?: string
          comment?: string | null
          created_at?: string
          doctor_id?: string
          ease_score?: number | null
          id?: string
          nps_score?: number
          patient_id?: string
          quality_score?: number | null
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
          {
            foreignKeyName: "satisfaction_surveys_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      second_opinion_requests: {
        Row: {
          accepted_at: string | null
          assigned_laudista_id: string | null
          completed_at: string | null
          consensus_notes: string | null
          created_at: string
          deadline: string | null
          exam_request_id: string | null
          id: string
          original_laudo_id: string | null
          original_report: string | null
          priority: string
          reason: string | null
          requesting_user_id: string
          second_report: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_laudista_id?: string | null
          completed_at?: string | null
          consensus_notes?: string | null
          created_at?: string
          deadline?: string | null
          exam_request_id?: string | null
          id?: string
          original_laudo_id?: string | null
          original_report?: string | null
          priority?: string
          reason?: string | null
          requesting_user_id: string
          second_report?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          assigned_laudista_id?: string | null
          completed_at?: string | null
          consensus_notes?: string | null
          created_at?: string
          deadline?: string | null
          exam_request_id?: string | null
          id?: string
          original_laudo_id?: string | null
          original_report?: string | null
          priority?: string
          reason?: string | null
          requesting_user_id?: string
          second_report?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "second_opinion_requests_exam_request_id_fkey"
            columns: ["exam_request_id"]
            isOneToOne: false
            referencedRelation: "exam_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      site_config: {
        Row: {
          category: string
          id: string
          input_type: string
          key: string
          label: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          category?: string
          id?: string
          input_type?: string
          key: string
          label: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          category?: string
          id?: string
          input_type?: string
          key?: string
          label?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      site_media: {
        Row: {
          created_at: string
          height: number | null
          id: string
          mime_type: string | null
          name: string
          path: string
          size_bytes: number | null
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          name: string
          path: string
          size_bytes?: number | null
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          path?: string
          size_bytes?: number | null
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      site_sections: {
        Row: {
          config: Json
          display_name: string
          display_order: number
          id: string
          is_enabled: boolean
          key: string
          schema: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          display_name: string
          display_order?: number
          id?: string
          is_enabled?: boolean
          key: string
          schema?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          display_name?: string
          display_order?: number
          id?: string
          is_enabled?: boolean
          key?: string
          schema?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_sections_history: {
        Row: {
          config: Json
          id: string
          saved_at: string
          saved_by: string | null
          section_key: string
        }
        Insert: {
          config: Json
          id?: string
          saved_at?: string
          saved_by?: string | null
          section_key: string
        }
        Update: {
          config?: Json
          id?: string
          saved_at?: string
          saved_by?: string | null
          section_key?: string
        }
        Relationships: []
      }
      specialties: {
        Row: {
          consultation_price: number | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          price_max: number | null
          price_min: number | null
        }
        Insert: {
          consultation_price?: number | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          price_max?: number | null
          price_min?: number | null
        }
        Update: {
          consultation_price?: number | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          price_max?: number | null
          price_min?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          expires_at: string | null
          id: string
          notes: string | null
          payment_method: string | null
          plan_id: string
          starts_at: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          plan_id: string
          starts_at?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          plan_id?: string
          starts_at?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
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
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          sender_role: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          sender_role?: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          sender_role?: string
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
          closed_at: string | null
          created_at: string
          id: string
          patient_id: string
          priority: string
          related_entity_id: string | null
          related_entity_type: string | null
          resolution_notes: string | null
          resolved_at: string | null
          sla_deadline: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          patient_id: string
          priority?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          patient_id?: string
          priority?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      symptom_diary: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          mood: string
          notes: string | null
          patient_id: string
          symptoms: string[] | null
        }
        Insert: {
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string
          notes?: string | null
          patient_id: string
          symptoms?: string[] | null
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string
          notes?: string | null
          patient_id?: string
          symptoms?: string[] | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          order_index: number
          rating: number
          role: string | null
          text: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          rating?: number
          role?: string | null
          text: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          rating?: number
          role?: string | null
          text?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          accepted_at: string
          consent_type: string
          created_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          consent_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
          version?: string
        }
        Update: {
          accepted_at?: string
          consent_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          reference_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          reason: string
          reference_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          reference_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          current_page: string | null
          id: string
          is_online: boolean
          last_seen_at: string
          user_id: string
        }
        Insert: {
          current_page?: string | null
          id?: string
          is_online?: boolean
          last_seen_at?: string
          user_id: string
        }
        Update: {
          current_page?: string | null
          id?: string
          is_online?: boolean
          last_seen_at?: string
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
      vaccination_records: {
        Row: {
          created_at: string
          date_given: string
          doctor_id: string | null
          document_url: string | null
          dose: string | null
          id: string
          location: string | null
          lot_number: string | null
          next_dose_date: string | null
          patient_id: string
          vaccine_name: string
        }
        Insert: {
          created_at?: string
          date_given: string
          doctor_id?: string | null
          document_url?: string | null
          dose?: string | null
          id?: string
          location?: string | null
          lot_number?: string | null
          next_dose_date?: string | null
          patient_id: string
          vaccine_name: string
        }
        Update: {
          created_at?: string
          date_given?: string
          doctor_id?: string | null
          document_url?: string | null
          dose?: string | null
          id?: string
          location?: string | null
          lot_number?: string | null
          next_dose_date?: string | null
          patient_id?: string
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      video_presence_logs: {
        Row: {
          appointment_id: string
          duration_seconds: number | null
          id: string
          joined_at: string
          left_at: string | null
          user_id: string
          user_role: string
        }
        Insert: {
          appointment_id: string
          duration_seconds?: number | null
          id?: string
          joined_at?: string
          left_at?: string | null
          user_id: string
          user_role?: string
        }
        Update: {
          appointment_id?: string
          duration_seconds?: number | null
          id?: string
          joined_at?: string
          left_at?: string | null
          user_id?: string
          user_role?: string
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
      visual_acuity_results: {
        Row: {
          amsler_grid_result: string | null
          appointment_id: string | null
          color_blind_test: string | null
          created_at: string
          doctor_id: string | null
          id: string
          iop_left: number | null
          iop_right: number | null
          left_add: number | null
          left_axis: number | null
          left_cylinder: number | null
          left_eye_distance: string | null
          left_eye_near: string | null
          left_sphere: number | null
          notes: string | null
          patient_id: string
          pd_binocular: number | null
          pd_left: number | null
          pd_right: number | null
          right_add: number | null
          right_axis: number | null
          right_cylinder: number | null
          right_eye_distance: string | null
          right_eye_near: string | null
          right_sphere: number | null
          tested_by_patient: boolean | null
        }
        Insert: {
          amsler_grid_result?: string | null
          appointment_id?: string | null
          color_blind_test?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          iop_left?: number | null
          iop_right?: number | null
          left_add?: number | null
          left_axis?: number | null
          left_cylinder?: number | null
          left_eye_distance?: string | null
          left_eye_near?: string | null
          left_sphere?: number | null
          notes?: string | null
          patient_id: string
          pd_binocular?: number | null
          pd_left?: number | null
          pd_right?: number | null
          right_add?: number | null
          right_axis?: number | null
          right_cylinder?: number | null
          right_eye_distance?: string | null
          right_eye_near?: string | null
          right_sphere?: number | null
          tested_by_patient?: boolean | null
        }
        Update: {
          amsler_grid_result?: string | null
          appointment_id?: string | null
          color_blind_test?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          iop_left?: number | null
          iop_right?: number | null
          left_add?: number | null
          left_axis?: number | null
          left_cylinder?: number | null
          left_eye_distance?: string | null
          left_eye_near?: string | null
          left_sphere?: number | null
          notes?: string | null
          patient_id?: string
          pd_binocular?: number | null
          pd_left?: number | null
          pd_right?: number | null
          right_add?: number | null
          right_axis?: number | null
          right_cylinder?: number | null
          right_eye_distance?: string | null
          right_eye_near?: string | null
          right_sphere?: number | null
          tested_by_patient?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "visual_acuity_results_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_acuity_results_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_acuity_results_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          description: string
          id: string
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          description?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          description?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
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
          min_amount_validated: boolean | null
          notes: string | null
          pix_key: string | null
          pix_key_type: string | null
          processed_at: string | null
          processed_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          min_amount_validated?: boolean | null
          notes?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          min_amount_validated?: boolean | null
          notes?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      doctor_profiles_public: {
        Row: {
          available_now: boolean | null
          available_now_since: string | null
          bio: string | null
          consultation_price: number | null
          created_at: string | null
          crm: string | null
          crm_state: string | null
          crm_verified: boolean | null
          education: string | null
          experience_years: number | null
          id: string | null
          is_approved: boolean | null
          rating: number | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          available_now?: boolean | null
          available_now_since?: string | null
          bio?: string | null
          consultation_price?: number | null
          created_at?: string | null
          crm?: string | null
          crm_state?: string | null
          crm_verified?: boolean | null
          education?: string | null
          experience_years?: number | null
          id?: string | null
          is_approved?: boolean | null
          rating?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          available_now?: boolean | null
          available_now_since?: string | null
          bio?: string | null
          consultation_price?: number | null
          created_at?: string | null
          crm?: string | null
          crm_state?: string | null
          crm_verified?: boolean | null
          education?: string | null
          experience_years?: number | null
          id?: string | null
          is_approved?: boolean | null
          rating?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      wallet_balances: {
        Row: {
          available_balance: number | null
          total_earned: number | null
          total_transactions: number | null
          total_withdrawn: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_rate_limits: { Args: never; Returns: undefined }
      expire_subscriptions_and_cards: { Args: never; Returns: undefined }
      fn_admin_doctor_kyc_list: {
        Args: never
        Returns: {
          doctor_id: string
          kyc_face_match_score: number
          kyc_status: string
          kyc_verified_at: string
          user_id: string
        }[]
      }
      fn_admin_set_doctor_kyc: {
        Args: { p_doctor_id: string; p_status: string }
        Returns: undefined
      }
      fn_alert_sla_breach: { Args: never; Returns: undefined }
      fn_archive_completed_queue: { Args: never; Returns: undefined }
      fn_auto_cancel_expired_renewals: { Args: never; Returns: undefined }
      fn_auto_cancel_unpaid: { Args: never; Returns: undefined }
      fn_auto_close_resolved_tickets: { Args: never; Returns: undefined }
      fn_auto_close_stale_tickets: { Args: never; Returns: undefined }
      fn_auto_complete_stale_consultations: { Args: never; Returns: undefined }
      fn_auto_expire_coupons: { Args: never; Returns: undefined }
      fn_auto_expire_subscriptions: { Args: never; Returns: undefined }
      fn_auto_no_show: { Args: never; Returns: undefined }
      fn_cleanup_old_activity_logs: { Args: never; Returns: undefined }
      fn_cleanup_old_notifications: { Args: never; Returns: undefined }
      fn_cleanup_past_waitlist: { Args: never; Returns: undefined }
      fn_expire_available_now: { Args: never; Returns: undefined }
      fn_expire_discount_cards: { Args: never; Returns: undefined }
      fn_expire_invite_codes: { Args: never; Returns: undefined }
      fn_expire_queue_entries: { Args: never; Returns: undefined }
      fn_handle_doctor_no_show: { Args: never; Returns: undefined }
      fn_increment_coupon_usage_atomic: {
        Args: { p_code: string }
        Returns: boolean
      }
      fn_notify_expiring_invites: { Args: never; Returns: undefined }
      fn_notify_low_rating_doctors: { Args: never; Returns: undefined }
      fn_notify_overdue_exams: { Args: never; Returns: undefined }
      fn_notify_return_deadline: { Args: never; Returns: undefined }
      fn_notify_stale_b2b_leads: { Args: never; Returns: undefined }
      fn_notify_subscription_expiry: { Args: never; Returns: undefined }
      fn_reengage_inactive_patients: { Args: never; Returns: undefined }
      fn_reset_available_now_midnight: { Args: never; Returns: undefined }
      fn_trigger_edge_email: {
        Args: { p_data: Json; p_to: string; p_type: string }
        Returns: undefined
      }
      get_clinic_profile_id: { Args: { _user_id: string }; Returns: string }
      get_doctor_profile_id: { Args: { _user_id: string }; Returns: string }
      get_my_clinic_id: { Args: never; Returns: string }
      get_my_doctor_id: { Args: never; Returns: string }
      get_public_doctor_profile: {
        Args: { p_doctor_id: string }
        Returns: {
          available_now: boolean
          avatar_url: string
          bio: string
          consultation_price: number
          crm: string
          crm_state: string
          education: string
          experience_years: number
          first_name: string
          id: string
          last_name: string
          rating: number
          specialties: string[]
          total_reviews: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_partner: { Args: never; Returns: boolean }
      is_receptionist: { Args: never; Returns: boolean }
      is_support: { Args: never; Returns: boolean }
      mark_no_shows: { Args: never; Returns: undefined }
      resolve_doctor_slug: {
        Args: { p_crm: string; p_state: string }
        Returns: string
      }
      search_doctor_by_name: { Args: { p_name: string }; Returns: string }
      validar_laudo_publico: {
        Args: { p_token: string }
        Returns: {
          assinado_em: string
          medico_nome: string
          paciente_nome: string
          qr_token: string
          status: string
          tipo_exame: string
        }[]
      }
      verify_document_public: {
        Args: { p_code: string }
        Returns: {
          details: Json
          doctor_crm: string
          doctor_name: string
          document_type: string
          issued_at: string
          patient_name: string
          verification_code: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "patient"
        | "doctor"
        | "clinic"
        | "admin"
        | "receptionist"
        | "support"
        | "partner"
        | "affiliate"
        | "optician"
        | "laudista"
        | "ophthalmologist"
      doctor_type: "telemedicina" | "laudista" | "oftalmologia"
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
        "patient",
        "doctor",
        "clinic",
        "admin",
        "receptionist",
        "support",
        "partner",
        "affiliate",
        "optician",
        "laudista",
        "ophthalmologist",
      ],
      doctor_type: ["telemedicina", "laudista", "oftalmologia"],
    },
  },
} as const
