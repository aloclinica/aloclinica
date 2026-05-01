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
          consent_reference: string | null
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
          consent_reference?: string | null
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
          consent_reference?: string | null
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
          jitsi_link: string | null
          jitsi_room_id: string | null
          lembrete_enviado: boolean | null
          notes: string | null
          patient_id: string | null
          payment_confirmed_at: string | null
          payment_confirmed_by: string | null
          payment_id: string | null
          payment_status: string | null
          price: number | null
          price_at_booking: number | null
          scheduled_at: string
          started_at: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
          video_room_url: string | null
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
          jitsi_link?: string | null
          jitsi_room_id?: string | null
          lembrete_enviado?: boolean | null
          notes?: string | null
          patient_id?: string | null
          payment_confirmed_at?: string | null
          payment_confirmed_by?: string | null
          payment_id?: string | null
          payment_status?: string | null
          price?: number | null
          price_at_booking?: number | null
          scheduled_at: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          video_room_url?: string | null
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
          jitsi_link?: string | null
          jitsi_room_id?: string | null
          lembrete_enviado?: boolean | null
          notes?: string | null
          patient_id?: string | null
          payment_confirmed_at?: string | null
          payment_confirmed_by?: string | null
          payment_id?: string | null
          payment_status?: string | null
          price?: number | null
          price_at_booking?: number | null
          scheduled_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          video_room_url?: string | null
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
      companies: {
        Row: {
          address: Json | null
          cnpj: string
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string | null
          id: string
          legal_name: string
          managed_by_user_id: string | null
          status: string | null
          trade_name: string | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          cnpj: string
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          legal_name: string
          managed_by_user_id?: string | null
          status?: string | null
          trade_name?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          cnpj?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          legal_name?: string
          managed_by_user_id?: string | null
          status?: string | null
          trade_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_card_orders: {
        Row: {
          asaas_subscription_id: string | null
          billing_cycle: string | null
          company_id: string
          created_at: string | null
          id: string
          next_billing_date: string | null
          num_seats: number
          pingo_card_plan_id: string
          price_per_seat: number
          status: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          asaas_subscription_id?: string | null
          billing_cycle?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          next_billing_date?: string | null
          num_seats: number
          pingo_card_plan_id: string
          price_per_seat: number
          status?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          asaas_subscription_id?: string | null
          billing_cycle?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          next_billing_date?: string | null
          num_seats?: number
          pingo_card_plan_id?: string
          price_per_seat?: number
          status?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_card_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_card_orders_pingo_card_plan_id_fkey"
            columns: ["pingo_card_plan_id"]
            isOneToOne: false
            referencedRelation: "pingo_card_plans"
            referencedColumns: ["id"]
          },
        ]
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
          crm_verified_by: string | null
          display_name: string | null
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          is_on_duty: boolean | null
          kyc_face_match_score: number | null
          kyc_status: string | null
          kyc_verified_at: string | null
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
          crm_verified_by?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          is_on_duty?: boolean | null
          kyc_face_match_score?: number | null
          kyc_status?: string | null
          kyc_verified_at?: string | null
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
          crm_verified_by?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          is_on_duty?: boolean | null
          kyc_face_match_score?: number | null
          kyc_status?: string | null
          kyc_verified_at?: string | null
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
      employee_invites: {
        Row: {
          accepted_at: string | null
          company_card_order_id: string
          created_at: string | null
          employee_cpf: string | null
          employee_email: string
          employee_name: string | null
          expires_at: string | null
          id: string
          invite_token: string
          pingo_card_subscription_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          company_card_order_id: string
          created_at?: string | null
          employee_cpf?: string | null
          employee_email: string
          employee_name?: string | null
          expires_at?: string | null
          id?: string
          invite_token: string
          pingo_card_subscription_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          company_card_order_id?: string
          created_at?: string | null
          employee_cpf?: string | null
          employee_email?: string
          employee_name?: string | null
          expires_at?: string | null
          id?: string
          invite_token?: string
          pingo_card_subscription_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_invites_company_card_order_id_fkey"
            columns: ["company_card_order_id"]
            isOneToOne: false
            referencedRelation: "company_card_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_invites_pingo_card_subscription_id_fkey"
            columns: ["pingo_card_subscription_id"]
            isOneToOne: false
            referencedRelation: "pingo_card_subscriptions"
            referencedColumns: ["id"]
          },
        ]
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
          completed_at: string | null
          created_at: string
          doctor_id: string
          exam_types: string[] | null
          id: string
          notes: string | null
          orthanc_study_uid: string | null
          patient_id: string
          sla_deadline: string | null
          sla_hours: number | null
          source: string | null
          specialty_required: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          appointment_id?: string | null
          clinical_indication?: string | null
          completed_at?: string | null
          created_at?: string
          doctor_id: string
          exam_types?: string[] | null
          id?: string
          notes?: string | null
          orthanc_study_uid?: string | null
          patient_id: string
          sla_deadline?: string | null
          sla_hours?: number | null
          source?: string | null
          specialty_required?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          appointment_id?: string | null
          clinical_indication?: string | null
          completed_at?: string | null
          created_at?: string
          doctor_id?: string
          exam_types?: string[] | null
          id?: string
          notes?: string | null
          orthanc_study_uid?: string | null
          patient_id?: string
          sla_deadline?: string | null
          sla_hours?: number | null
          source?: string | null
          specialty_required?: string | null
          started_at?: string | null
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
      funeral_assistance_requests: {
        Row: {
          assigned_provider_id: string | null
          city: string
          contact_phone: string
          coverage_amount: number | null
          created_at: string | null
          death_certificate_url: string | null
          death_date: string
          deceased_cpf: string | null
          deceased_name: string
          id: string
          notes: string | null
          preferred_provider_id: string | null
          rejection_reason: string | null
          relationship: string
          state: string
          status: string | null
          subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_provider_id?: string | null
          city: string
          contact_phone: string
          coverage_amount?: number | null
          created_at?: string | null
          death_certificate_url?: string | null
          death_date: string
          deceased_cpf?: string | null
          deceased_name: string
          id?: string
          notes?: string | null
          preferred_provider_id?: string | null
          rejection_reason?: string | null
          relationship: string
          state: string
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_provider_id?: string | null
          city?: string
          contact_phone?: string
          coverage_amount?: number | null
          created_at?: string | null
          death_certificate_url?: string | null
          death_date?: string
          deceased_cpf?: string | null
          deceased_name?: string
          id?: string
          notes?: string | null
          preferred_provider_id?: string | null
          rejection_reason?: string | null
          relationship?: string
          state?: string
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funeral_assistance_requests_assigned_provider_id_fkey"
            columns: ["assigned_provider_id"]
            isOneToOne: false
            referencedRelation: "funeral_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funeral_assistance_requests_preferred_provider_id_fkey"
            columns: ["preferred_provider_id"]
            isOneToOne: false
            referencedRelation: "funeral_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funeral_assistance_requests_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "pingo_card_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      funeral_providers: {
        Row: {
          cnpj: string | null
          contact_email: string | null
          contact_phone: string | null
          coverage_areas: string[] | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          cnpj?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          coverage_areas?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          cnpj?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          coverage_areas?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      kyc_sessions: {
        Row: {
          created_at: string
          device_info: Json | null
          expires_at: string
          failure_reason: string | null
          id: string
          match_score: number | null
          role: string
          status: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          expires_at?: string
          failure_reason?: string | null
          id?: string
          match_score?: number | null
          role?: string
          status?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          expires_at?: string
          failure_reason?: string | null
          id?: string
          match_score?: number | null
          role?: string
          status?: string
          token?: string
          updated_at?: string
          user_id?: string
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
      pingo_card_partners: {
        Row: {
          address: string | null
          category: string
          city: string | null
          created_at: string
          description: string | null
          discount_description: string | null
          discount_percent: number
          display_order: number
          id: string
          is_active: boolean
          is_featured: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          phone: string | null
          state: string | null
          updated_at: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          category?: string
          city?: string | null
          created_at?: string
          description?: string | null
          discount_description?: string | null
          discount_percent?: number
          display_order?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          city?: string | null
          created_at?: string
          description?: string | null
          discount_description?: string | null
          discount_percent?: number
          display_order?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      pingo_card_plans: {
        Row: {
          benefits: Json
          color: string | null
          consultation_discount_percent: number
          created_at: string
          description: string | null
          display_order: number
          exam_discount_percent: number
          id: string
          is_active: boolean
          is_highlighted: boolean
          max_dependents: number
          name: string
          partner_discount_percent: number
          price_monthly: number
          price_yearly: number
          slug: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          benefits?: Json
          color?: string | null
          consultation_discount_percent?: number
          created_at?: string
          description?: string | null
          display_order?: number
          exam_discount_percent?: number
          id?: string
          is_active?: boolean
          is_highlighted?: boolean
          max_dependents?: number
          name: string
          partner_discount_percent?: number
          price_monthly?: number
          price_yearly?: number
          slug: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          benefits?: Json
          color?: string | null
          consultation_discount_percent?: number
          created_at?: string
          description?: string | null
          display_order?: number
          exam_discount_percent?: number
          id?: string
          is_active?: boolean
          is_highlighted?: boolean
          max_dependents?: number
          name?: string
          partner_discount_percent?: number
          price_monthly?: number
          price_yearly?: number
          slug?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pingo_card_subscriptions: {
        Row: {
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          billing_cycle: string
          canceled_at: string | null
          cancellation_reason: string | null
          card_number: string
          created_at: string
          current_period_end: string | null
          id: string
          plan_id: string
          started_at: string
          status: string
          total_savings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          billing_cycle?: string
          canceled_at?: string | null
          cancellation_reason?: string | null
          card_number: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_id: string
          started_at?: string
          status?: string
          total_savings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          billing_cycle?: string
          canceled_at?: string | null
          cancellation_reason?: string | null
          card_number?: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_id?: string
          started_at?: string
          status?: string
          total_savings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pingo_card_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pingo_card_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pingo_card_transactions: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          discount_amount: number
          final_amount: number
          id: string
          original_amount: number
          partner_id: string | null
          subscription_id: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          discount_amount?: number
          final_amount?: number
          id?: string
          original_amount?: number
          partner_id?: string | null
          subscription_id: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          discount_amount?: number
          final_amount?: number
          id?: string
          original_amount?: number
          partner_id?: string | null
          subscription_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pingo_card_transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "pingo_card_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pingo_card_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "pingo_card_subscriptions"
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
            isOneToOne: true
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
          settings: Json | null
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
          settings?: Json | null
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
          settings?: Json | null
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
          consultation_price: number | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          max_price: number | null
          min_price: number | null
          name: string
          price_max: number | null
          price_min: number | null
          slug: string | null
        }
        Insert: {
          consultation_price?: number | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_price?: number | null
          min_price?: number | null
          name: string
          price_max?: number | null
          price_min?: number | null
          slug?: string | null
        }
        Update: {
          consultation_price?: number | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_price?: number | null
          min_price?: number | null
          name?: string
          price_max?: number | null
          price_min?: number | null
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
      sweepstake_tickets: {
        Row: {
          created_at: string | null
          id: string
          is_winner: boolean | null
          source: string | null
          subscription_id: string | null
          sweepstake_id: string
          ticket_number: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_winner?: boolean | null
          source?: string | null
          subscription_id?: string | null
          sweepstake_id: string
          ticket_number: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_winner?: boolean | null
          source?: string | null
          subscription_id?: string | null
          sweepstake_id?: string
          ticket_number?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sweepstake_tickets_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "pingo_card_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sweepstake_tickets_sweepstake_id_fkey"
            columns: ["sweepstake_id"]
            isOneToOne: false
            referencedRelation: "sweepstakes"
            referencedColumns: ["id"]
          },
        ]
      }
      sweepstake_winners: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payment_status: string | null
          prize_value: number
          sweepstake_id: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_status?: string | null
          prize_value: number
          sweepstake_id: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_status?: string | null
          prize_value?: number
          sweepstake_id?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sweepstake_winners_sweepstake_id_fkey"
            columns: ["sweepstake_id"]
            isOneToOne: false
            referencedRelation: "sweepstakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sweepstake_winners_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "sweepstake_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      sweepstakes: {
        Row: {
          authorization_code: string | null
          created_at: string | null
          description: string | null
          draw_date: string
          drawn_at: string | null
          drawn_ticket_number: string | null
          id: string
          prize_description: string | null
          prize_value: number
          regulation_url: string | null
          status: string | null
          ticket_generation_end: string
          ticket_generation_start: string
          title: string
          updated_at: string | null
        }
        Insert: {
          authorization_code?: string | null
          created_at?: string | null
          description?: string | null
          draw_date: string
          drawn_at?: string | null
          drawn_ticket_number?: string | null
          id?: string
          prize_description?: string | null
          prize_value: number
          regulation_url?: string | null
          status?: string | null
          ticket_generation_end: string
          ticket_generation_start: string
          title: string
          updated_at?: string | null
        }
        Update: {
          authorization_code?: string | null
          created_at?: string | null
          description?: string | null
          draw_date?: string
          drawn_at?: string | null
          drawn_ticket_number?: string | null
          id?: string
          prize_description?: string | null
          prize_value?: number
          regulation_url?: string | null
          status?: string | null
          ticket_generation_end?: string
          ticket_generation_start?: string
          title?: string
          updated_at?: string | null
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
      fn_admin_doctor_kyc_list: { Args: never; Returns: Json[] }
      fn_admin_set_doctor_kyc: {
        Args: { p_doctor_id: string; p_status: string }
        Returns: undefined
      }
      fn_alert_sla_breach: { Args: never; Returns: undefined }
      fn_auto_cancel_unpaid: { Args: never; Returns: undefined }
      fn_auto_close_resolved_tickets: { Args: never; Returns: undefined }
      fn_auto_complete_stale_consultations: { Args: never; Returns: undefined }
      fn_auto_no_show: { Args: never; Returns: undefined }
      fn_expire_available_now: { Args: never; Returns: undefined }
      fn_expire_discount_cards: { Args: never; Returns: undefined }
      fn_expire_invite_codes: { Args: never; Returns: undefined }
      fn_expire_queue_entries: { Args: never; Returns: undefined }
      fn_handle_doctor_no_show: { Args: never; Returns: undefined }
      fn_increment_coupon_usage_atomic: {
        Args: { p_code: string }
        Returns: boolean
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
      invoke_edge_function: {
        Args: { fn_name: string; payload?: Json }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      mark_no_shows: { Args: never; Returns: undefined }
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
        | "receptionist"
        | "affiliate"
        | "optician"
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
        "receptionist",
        "affiliate",
        "optician",
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
