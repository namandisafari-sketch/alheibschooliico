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
      appointments: {
        Row: {
          created_at: string
          created_by: string | null
          duration_minutes: number
          host_name: string | null
          host_staff_id: string | null
          id: string
          learner_id: string | null
          location: string | null
          notes: string | null
          purpose: string
          reminder_enabled: boolean
          scheduled_for: string
          status: string
          updated_at: string
          visitor_id: string | null
          visitor_name: string
          visitor_phone: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          host_name?: string | null
          host_staff_id?: string | null
          id?: string
          learner_id?: string | null
          location?: string | null
          notes?: string | null
          purpose: string
          reminder_enabled?: boolean
          scheduled_for: string
          status?: string
          updated_at?: string
          visitor_id?: string | null
          visitor_name: string
          visitor_phone?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          host_name?: string | null
          host_staff_id?: string | null
          id?: string
          learner_id?: string | null
          location?: string | null
          notes?: string | null
          purpose?: string
          reminder_enabled?: boolean
          scheduled_for?: string
          status?: string
          updated_at?: string
          visitor_id?: string | null
          visitor_name?: string
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_steps: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          id: string
          notes: string | null
          po_id: string | null
          step: Database["public"]["Enums"]["approval_step_type"]
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          notes?: string | null
          po_id?: string | null
          step: Database["public"]["Enums"]["approval_step_type"]
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          notes?: string | null
          po_id?: string | null
          step?: Database["public"]["Enums"]["approval_step_type"]
        }
        Relationships: [
          {
            foreignKeyName: "approval_steps_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_custodians: {
        Row: {
          asset_id: string | null
          assigned_date: string
          employee_id: string | null
          id: string
          notes: string | null
          returned_date: string | null
          signed_form_url: string | null
        }
        Insert: {
          asset_id?: string | null
          assigned_date?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          returned_date?: string | null
          signed_form_url?: string | null
        }
        Update: {
          asset_id?: string | null
          assigned_date?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          returned_date?: string | null
          signed_form_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_custodians_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_custodian_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_tag_id: string | null
          assigned_to_staff: string | null
          category_id: string | null
          condition: string | null
          created_at: string | null
          current_value: number | null
          depreciation_rate: number | null
          id: string
          image_url: string | null
          last_maintenance_date: string | null
          location: string | null
          manufacturer: string | null
          name: string
          next_maintenance_date: string | null
          notes: string | null
          purchase_cost: number | null
          purchase_date: string | null
          serial_number: string | null
          status: string | null
          technical_details: Json | null
          updated_at: string | null
          useful_life_years: number | null
          warranty_expiry: string | null
        }
        Insert: {
          asset_tag_id?: string | null
          assigned_to_staff?: string | null
          category_id?: string | null
          condition?: string | null
          created_at?: string | null
          current_value?: number | null
          depreciation_rate?: number | null
          id?: string
          image_url?: string | null
          last_maintenance_date?: string | null
          location?: string | null
          manufacturer?: string | null
          name: string
          next_maintenance_date?: string | null
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: string | null
          technical_details?: Json | null
          updated_at?: string | null
          useful_life_years?: number | null
          warranty_expiry?: string | null
        }
        Update: {
          asset_tag_id?: string | null
          assigned_to_staff?: string | null
          category_id?: string | null
          condition?: string | null
          created_at?: string | null
          current_value?: number | null
          depreciation_rate?: number | null
          id?: string
          image_url?: string | null
          last_maintenance_date?: string | null
          location?: string | null
          manufacturer?: string | null
          name?: string
          next_maintenance_date?: string | null
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: string | null
          technical_details?: Json | null
          updated_at?: string | null
          useful_life_years?: number | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_assigned_to_staff_fkey"
            columns: ["assigned_to_staff"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          check_in_time: string | null
          class_id: string
          created_at: string | null
          date: string
          id: string
          learner_id: string
          notes: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          check_in_time?: string | null
          class_id: string
          created_at?: string | null
          date?: string
          id?: string
          learner_id: string
          notes?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          check_in_time?: string | null
          class_id?: string
          created_at?: string | null
          date?: string
          id?: string
          learner_id?: string
          notes?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bursar_override_requests: {
        Row: {
          created_at: string | null
          id: string
          learner_id: string
          outstanding_balance: number | null
          reason: string | null
          requested_by: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rule_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          learner_id: string
          outstanding_balance?: number | null
          reason?: string | null
          requested_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rule_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          learner_id?: string
          outstanding_balance?: number | null
          reason?: string | null
          requested_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rule_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bursar_override_requests_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bursar_override_requests_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "bursar_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      bursar_rules: {
        Row: {
          applies_to_all_classes: boolean
          balance_threshold: number
          class_id: string | null
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          rule_type: string
          updated_at: string | null
        }
        Insert: {
          applies_to_all_classes?: boolean
          balance_threshold?: number
          class_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          rule_type?: string
          updated_at?: string | null
        }
        Update: {
          applies_to_all_classes?: boolean
          balance_threshold?: number
          class_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          rule_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bursar_rules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: number | null
          capacity: number | null
          created_at: string | null
          id: string
          level: number
          name: string
          room: string | null
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year?: number | null
          capacity?: number | null
          created_at?: string | null
          id?: string
          level: number
          name: string
          room?: string | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: number | null
          capacity?: number | null
          created_at?: string | null
          id?: string
          level?: number
          name?: string
          room?: string | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_cases: {
        Row: {
          action_taken: string | null
          case_number: string | null
          created_at: string | null
          description: string | null
          evidence_photos: string[] | null
          id: string
          incident_date: string | null
          incident_type: string
          learner_id: string | null
          parent_notified: boolean | null
          reported_by: string | null
          severity: Database["public"]["Enums"]["discipline_severity"] | null
          status: string | null
          updated_at: string | null
          victims: string | null
          witnesses: string | null
        }
        Insert: {
          action_taken?: string | null
          case_number?: string | null
          created_at?: string | null
          description?: string | null
          evidence_photos?: string[] | null
          id?: string
          incident_date?: string | null
          incident_type: string
          learner_id?: string | null
          parent_notified?: boolean | null
          reported_by?: string | null
          severity?: Database["public"]["Enums"]["discipline_severity"] | null
          status?: string | null
          updated_at?: string | null
          victims?: string | null
          witnesses?: string | null
        }
        Update: {
          action_taken?: string | null
          case_number?: string | null
          created_at?: string | null
          description?: string | null
          evidence_photos?: string[] | null
          id?: string
          incident_date?: string | null
          incident_type?: string
          learner_id?: string | null
          parent_notified?: boolean | null
          reported_by?: string | null
          severity?: Database["public"]["Enums"]["discipline_severity"] | null
          status?: string | null
          updated_at?: string | null
          victims?: string | null
          witnesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discipline_cases_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_cases_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          date: string
          donor_id: string | null
          id: string
          notes: string | null
          project_id: string | null
          receipt_image_url: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          date?: string
          donor_id?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          receipt_image_url?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          date?: string
          donor_id?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          receipt_image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
      }
      donors: {
        Row: {
          contact: string | null
          created_at: string | null
          currency: string | null
          id: string
          name: string
          notes: string | null
          type: Database["public"]["Enums"]["donor_type"]
        }
        Insert: {
          contact?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          name: string
          notes?: string | null
          type: Database["public"]["Enums"]["donor_type"]
        }
        Update: {
          contact?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          name?: string
          notes?: string | null
          type?: Database["public"]["Enums"]["donor_type"]
        }
        Relationships: []
      }
      dormitories: {
        Row: {
          capacity: number
          created_at: string
          gender: string
          id: string
          location: string | null
          matron_staff_id: string | null
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          gender: string
          id?: string
          location?: string | null
          matron_staff_id?: string | null
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          gender?: string
          id?: string
          location?: string | null
          matron_staff_id?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dormitory_residents: {
        Row: {
          assigned_date: string
          bed_number: string | null
          created_at: string
          dormitory_id: string
          id: string
          is_active: boolean
          learner_id: string
          notes: string | null
          released_date: string | null
        }
        Insert: {
          assigned_date?: string
          bed_number?: string | null
          created_at?: string
          dormitory_id: string
          id?: string
          is_active?: boolean
          learner_id: string
          notes?: string | null
          released_date?: string | null
        }
        Update: {
          assigned_date?: string
          bed_number?: string | null
          created_at?: string
          dormitory_id?: string
          id?: string
          is_active?: boolean
          learner_id?: string
          notes?: string | null
          released_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dormitory_residents_dormitory_id_fkey"
            columns: ["dormitory_id"]
            isOneToOne: false
            referencedRelation: "dormitories"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_reentry_slips: {
        Row: {
          badge_number: string
          created_at: string
          duration_minutes: number
          expires_at: string
          host_name: string | null
          id: string
          id_number: string | null
          issued_at: string
          issued_by: string | null
          notes: string | null
          original_visit_id: string | null
          print_width: number
          purpose: string | null
          serial: string
          visitor_id: string | null
          visitor_name: string
          visitor_phone: string | null
          voided: boolean
          voided_at: string | null
        }
        Insert: {
          badge_number: string
          created_at?: string
          duration_minutes?: number
          expires_at: string
          host_name?: string | null
          id?: string
          id_number?: string | null
          issued_at?: string
          issued_by?: string | null
          notes?: string | null
          original_visit_id?: string | null
          print_width?: number
          purpose?: string | null
          serial: string
          visitor_id?: string | null
          visitor_name: string
          visitor_phone?: string | null
          voided?: boolean
          voided_at?: string | null
        }
        Update: {
          badge_number?: string
          created_at?: string
          duration_minutes?: number
          expires_at?: string
          host_name?: string | null
          id?: string
          id_number?: string | null
          issued_at?: string
          issued_by?: string | null
          notes?: string | null
          original_visit_id?: string | null
          print_width?: number
          purpose?: string | null
          serial?: string
          visitor_id?: string | null
          visitor_name?: string
          visitor_phone?: string | null
          voided?: boolean
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_reentry_slips_original_visit_id_fkey"
            columns: ["original_visit_id"]
            isOneToOne: false
            referencedRelation: "visitor_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_reentry_slips_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_advances: {
        Row: {
          amount: number
          currency: string | null
          disbursed_date: string
          employee_id: string | null
          id: string
          notes: string | null
          outstanding_balance: number
          repayment_schedule:
            | Database["public"]["Enums"]["repayment_plan"]
            | null
        }
        Insert: {
          amount: number
          currency?: string | null
          disbursed_date?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          outstanding_balance: number
          repayment_schedule?:
            | Database["public"]["Enums"]["repayment_plan"]
            | null
        }
        Update: {
          amount?: number
          currency?: string | null
          disbursed_date?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          outstanding_balance?: number
          repayment_schedule?:
            | Database["public"]["Enums"]["repayment_plan"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_advances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          assigned_class: string | null
          base_salary: number | null
          created_at: string | null
          currency: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          nssf_number: string | null
          phone: string | null
          profile_id: string | null
          qualification: string | null
          role: string | null
          subjects: string | null
          tin_number: string | null
        }
        Insert: {
          assigned_class?: string | null
          base_salary?: number | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          nssf_number?: string | null
          phone?: string | null
          profile_id?: string | null
          qualification?: string | null
          role?: string | null
          subjects?: string | null
          tin_number?: string | null
        }
        Update: {
          assigned_class?: string | null
          base_salary?: number | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          nssf_number?: string | null
          phone?: string | null
          profile_id?: string | null
          qualification?: string | null
          role?: string | null
          subjects?: string | null
          tin_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          created_at: string | null
          effective_date: string
          from_currency: string
          id: string
          rate: number
          to_currency: string
        }
        Insert: {
          created_at?: string | null
          effective_date?: string
          from_currency: string
          id?: string
          rate: number
          to_currency: string
        }
        Update: {
          created_at?: string | null
          effective_date?: string
          from_currency?: string
          id?: string
          rate?: number
          to_currency?: string
        }
        Relationships: []
      }
      fee_assignments: {
        Row: {
          created_at: string | null
          custom_amount: number | null
          fee_structure_id: string
          id: string
          is_exempted: boolean
          learner_id: string
          notes: string | null
        }
        Insert: {
          created_at?: string | null
          custom_amount?: number | null
          fee_structure_id: string
          id?: string
          is_exempted?: boolean
          learner_id: string
          notes?: string | null
        }
        Update: {
          created_at?: string | null
          custom_amount?: number | null
          fee_structure_id?: string
          id?: string
          is_exempted?: boolean
          learner_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_assignments_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_assignments_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_payments: {
        Row: {
          academic_year: number
          amount: number
          collected_by: string | null
          created_at: string | null
          currency: string
          fee_structure_id: string | null
          id: string
          learner_id: string
          notes: string | null
          payment_date: string
          payment_method: string
          receipt_number: string
          reference_number: string | null
          term: string | null
        }
        Insert: {
          academic_year?: number
          amount: number
          collected_by?: string | null
          created_at?: string | null
          currency?: string
          fee_structure_id?: string | null
          id?: string
          learner_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          receipt_number: string
          reference_number?: string | null
          term?: string | null
        }
        Update: {
          academic_year?: number
          amount?: number
          collected_by?: string | null
          created_at?: string | null
          currency?: string
          fee_structure_id?: string | null
          id?: string
          learner_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          receipt_number?: string
          reference_number?: string | null
          term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year: number
          amount: number
          applies_to: string
          category: string
          class_level: number | null
          created_at: string | null
          currency: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          term: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year?: number
          amount?: number
          applies_to?: string
          category?: string
          class_level?: number | null
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          term?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: number
          amount?: number
          applies_to?: string
          category?: string
          class_level?: number | null
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          term?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      finance_accounts: {
        Row: {
          code: string
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          type: Database["public"]["Enums"]["account_type"]
        }
        Insert: {
          code: string
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          type: Database["public"]["Enums"]["account_type"]
        }
        Update: {
          code?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          type?: Database["public"]["Enums"]["account_type"]
        }
        Relationships: [
          {
            foreignKeyName: "finance_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          address: string | null
          created_at: string | null
          district: string | null
          email: string | null
          full_name: string
          id: string
          phone: string
          relationship: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          full_name: string
          id?: string
          phone: string
          relationship?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string
          relationship?: string | null
        }
        Relationships: []
      }
      health_visits: {
        Row: {
          action_taken: string | null
          created_at: string | null
          diagnosis: string | null
          id: string
          learner_id: string | null
          priority: Database["public"]["Enums"]["health_priority"] | null
          recorded_by: string | null
          staff_id: string | null
          status: string | null
          symptoms: string | null
          temperature: number | null
          treatment_plan: string | null
          updated_at: string | null
          visit_date: string | null
          visit_type: Database["public"]["Enums"]["health_visit_type"] | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string | null
          diagnosis?: string | null
          id?: string
          learner_id?: string | null
          priority?: Database["public"]["Enums"]["health_priority"] | null
          recorded_by?: string | null
          staff_id?: string | null
          status?: string | null
          symptoms?: string | null
          temperature?: number | null
          treatment_plan?: string | null
          updated_at?: string | null
          visit_date?: string | null
          visit_type?: Database["public"]["Enums"]["health_visit_type"] | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string | null
          diagnosis?: string | null
          id?: string
          learner_id?: string | null
          priority?: Database["public"]["Enums"]["health_priority"] | null
          recorded_by?: string | null
          staff_id?: string | null
          status?: string | null
          symptoms?: string | null
          temperature?: number | null
          treatment_plan?: string | null
          updated_at?: string | null
          visit_date?: string | null
          visit_type?: Database["public"]["Enums"]["health_visit_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "health_visits_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_visits_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_visits_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      in_app_notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_read: boolean
          link: string | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      inventory_gate_passes: {
        Row: {
          checked_at: string | null
          created_at: string | null
          id: string
          pass_number: string
          security_checked_by: string | null
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          checked_at?: string | null
          created_at?: string | null
          id?: string
          pass_number: string
          security_checked_by?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          checked_at?: string | null
          created_at?: string | null
          id?: string
          pass_number?: string
          security_checked_by?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_gate_passes_security_checked_by_fkey"
            columns: ["security_checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_gate_passes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "active_gate_passes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_gate_passes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "inventory_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          brand: string | null
          category_id: string | null
          created_at: string | null
          current_condition: string | null
          custodian_id: string | null
          date_of_purchase: string | null
          description: string | null
          expiry_date: string | null
          id: string
          min_stock_level: number | null
          model: string | null
          name: string
          purchase_value: number | null
          storage_location: string | null
          supplier_contact: string | null
          supplier_name: string | null
          technical_specs: Json | null
          tracking_number: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          current_condition?: string | null
          custodian_id?: string | null
          date_of_purchase?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          min_stock_level?: number | null
          model?: string | null
          name: string
          purchase_value?: number | null
          storage_location?: string | null
          supplier_contact?: string | null
          supplier_name?: string | null
          technical_specs?: Json | null
          tracking_number?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          current_condition?: string | null
          custodian_id?: string | null
          date_of_purchase?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          min_stock_level?: number | null
          model?: string | null
          name?: string
          purchase_value?: number | null
          storage_location?: string | null
          supplier_contact?: string | null
          supplier_name?: string | null
          technical_specs?: Json | null
          tracking_number?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_custodian_id_fkey"
            columns: ["custodian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_stock: {
        Row: {
          id: string
          item_id: string | null
          last_updated: string | null
          quantity: number
        }
        Insert: {
          id?: string
          item_id?: string | null
          last_updated?: string | null
          quantity?: number
        }
        Update: {
          id?: string
          item_id?: string | null
          last_updated?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "inventory_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          director_approval_date: string | null
          director_id: string | null
          gate_notes: string | null
          gate_pass_id: string | null
          gate_verified_at: string | null
          gateman_id: string | null
          id: string
          issued_by: string | null
          item_id: string | null
          learner_id: string | null
          manager_approval_date: string | null
          manager_id: string | null
          notes: string | null
          qr_verification_code: string | null
          quantity: number
          staff_id: string | null
          status: string | null
          tracking_number: string | null
          transaction_date: string | null
          type: Database["public"]["Enums"]["inventory_transaction_type"]
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          director_approval_date?: string | null
          director_id?: string | null
          gate_notes?: string | null
          gate_pass_id?: string | null
          gate_verified_at?: string | null
          gateman_id?: string | null
          id?: string
          issued_by?: string | null
          item_id?: string | null
          learner_id?: string | null
          manager_approval_date?: string | null
          manager_id?: string | null
          notes?: string | null
          qr_verification_code?: string | null
          quantity: number
          staff_id?: string | null
          status?: string | null
          tracking_number?: string | null
          transaction_date?: string | null
          type: Database["public"]["Enums"]["inventory_transaction_type"]
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          director_approval_date?: string | null
          director_id?: string | null
          gate_notes?: string | null
          gate_pass_id?: string | null
          gate_verified_at?: string | null
          gateman_id?: string | null
          id?: string
          issued_by?: string | null
          item_id?: string | null
          learner_id?: string | null
          manager_approval_date?: string | null
          manager_id?: string | null
          notes?: string | null
          qr_verification_code?: string | null
          quantity?: number
          staff_id?: string | null
          status?: string | null
          tracking_number?: string | null
          transaction_date?: string | null
          type?: Database["public"]["Enums"]["inventory_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_director_id_fkey"
            columns: ["director_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_gateman_id_fkey"
            columns: ["gateman_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_documents: {
        Row: {
          created_at: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          learner_id: string
          mime_type: string | null
          ocr_extracted_data: Json | null
          ocr_status: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          learner_id: string
          mime_type?: string | null
          ocr_extracted_data?: Json | null
          ocr_status?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          learner_id?: string
          mime_type?: string | null
          ocr_extracted_data?: Json | null
          ocr_status?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learner_documents_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_essentials: {
        Row: {
          condition: string
          created_at: string
          id: string
          issued_by: string | null
          issued_date: string
          item_id: string
          learner_id: string
          notes: string | null
          quantity: number
          replacement_for: string | null
          returned_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          condition?: string
          created_at?: string
          id?: string
          issued_by?: string | null
          issued_date?: string
          item_id: string
          learner_id: string
          notes?: string | null
          quantity?: number
          replacement_for?: string | null
          returned_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          condition?: string
          created_at?: string
          id?: string
          issued_by?: string | null
          issued_date?: string
          item_id?: string
          learner_id?: string
          notes?: string | null
          quantity?: number
          replacement_for?: string | null
          returned_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_essentials_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_essentials_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_essentials_replacement_for_fkey"
            columns: ["replacement_for"]
            isOneToOne: false
            referencedRelation: "learner_essentials"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_medical: {
        Row: {
          allergies: string | null
          asthma: string | null
          congenital_heart: string | null
          created_at: string
          current_medication: string | null
          diabetes: string | null
          doctor_contact: string | null
          doctor_name: string | null
          doctor_stamp_url: string | null
          epilepsy: string | null
          examined_at: string | null
          hearing_impairment: string | null
          heart_condition: string | null
          hospital_admission_history: string | null
          hospital_name: string | null
          id: string
          learner_id: string
          medication_dosage: string | null
          other_chronic: string | null
          other_conditions: string | null
          requires_treatment: boolean | null
          sickle_cell: string | null
          treatment_details: string | null
          updated_at: string
          visual_impairment: string | null
        }
        Insert: {
          allergies?: string | null
          asthma?: string | null
          congenital_heart?: string | null
          created_at?: string
          current_medication?: string | null
          diabetes?: string | null
          doctor_contact?: string | null
          doctor_name?: string | null
          doctor_stamp_url?: string | null
          epilepsy?: string | null
          examined_at?: string | null
          hearing_impairment?: string | null
          heart_condition?: string | null
          hospital_admission_history?: string | null
          hospital_name?: string | null
          id?: string
          learner_id: string
          medication_dosage?: string | null
          other_chronic?: string | null
          other_conditions?: string | null
          requires_treatment?: boolean | null
          sickle_cell?: string | null
          treatment_details?: string | null
          updated_at?: string
          visual_impairment?: string | null
        }
        Update: {
          allergies?: string | null
          asthma?: string | null
          congenital_heart?: string | null
          created_at?: string
          current_medication?: string | null
          diabetes?: string | null
          doctor_contact?: string | null
          doctor_name?: string | null
          doctor_stamp_url?: string | null
          epilepsy?: string | null
          examined_at?: string | null
          hearing_impairment?: string | null
          heart_condition?: string | null
          hospital_admission_history?: string | null
          hospital_name?: string | null
          id?: string
          learner_id?: string
          medication_dosage?: string | null
          other_chronic?: string | null
          other_conditions?: string | null
          requires_treatment?: boolean | null
          sickle_cell?: string | null
          treatment_details?: string | null
          updated_at?: string
          visual_impairment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learner_medical_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: true
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_parents: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_primary_contact: boolean
          learner_id: string
          phone: string | null
          place_of_work: string | null
          relationship: Database["public"]["Enums"]["parent_relationship"]
          street_road: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_primary_contact?: boolean
          learner_id: string
          phone?: string | null
          place_of_work?: string | null
          relationship: Database["public"]["Enums"]["parent_relationship"]
          street_road?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_primary_contact?: boolean
          learner_id?: string
          phone?: string | null
          place_of_work?: string | null
          relationship?: Database["public"]["Enums"]["parent_relationship"]
          street_road?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_parents_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_siblings: {
        Row: {
          created_at: string
          id: string
          learner_id: string
          sibling_class: string | null
          sibling_learner_id: string | null
          sibling_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          learner_id: string
          sibling_class?: string | null
          sibling_learner_id?: string | null
          sibling_name: string
        }
        Update: {
          created_at?: string
          id?: string
          learner_id?: string
          sibling_class?: string | null
          sibling_learner_id?: string | null
          sibling_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_siblings_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_siblings_sibling_learner_id_fkey"
            columns: ["sibling_learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      learners: {
        Row: {
          admission_number: string | null
          application_date: string | null
          arabic_name: string | null
          authorized_pickup_contact: string | null
          authorized_pickup_name: string | null
          class_id: string | null
          created_at: string | null
          current_residence: string | null
          date_of_birth: string | null
          district: string | null
          dormitory: string | null
          enrollment_date: string | null
          former_class: string | null
          former_school: string | null
          former_year: number | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          guardian_id: string | null
          home_county: string | null
          home_district: string | null
          home_parish: string | null
          home_region: string | null
          home_sub_county: string | null
          home_village: string | null
          house: Database["public"]["Enums"]["school_house"] | null
          id: string
          lin_number: string | null
          nationality: string | null
          nira_certificate_status: string | null
          parish: string | null
          photo_url: string | null
          pupil_status: Database["public"]["Enums"]["pupil_status"] | null
          religion: string | null
          reporting_date: string | null
          status: string | null
          street_road: string | null
          subcounty: string | null
          town_city: string | null
          updated_at: string | null
          village: string | null
        }
        Insert: {
          admission_number?: string | null
          application_date?: string | null
          arabic_name?: string | null
          authorized_pickup_contact?: string | null
          authorized_pickup_name?: string | null
          class_id?: string | null
          created_at?: string | null
          current_residence?: string | null
          date_of_birth?: string | null
          district?: string | null
          dormitory?: string | null
          enrollment_date?: string | null
          former_class?: string | null
          former_school?: string | null
          former_year?: number | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          guardian_id?: string | null
          home_county?: string | null
          home_district?: string | null
          home_parish?: string | null
          home_region?: string | null
          home_sub_county?: string | null
          home_village?: string | null
          house?: Database["public"]["Enums"]["school_house"] | null
          id?: string
          lin_number?: string | null
          nationality?: string | null
          nira_certificate_status?: string | null
          parish?: string | null
          photo_url?: string | null
          pupil_status?: Database["public"]["Enums"]["pupil_status"] | null
          religion?: string | null
          reporting_date?: string | null
          status?: string | null
          street_road?: string | null
          subcounty?: string | null
          town_city?: string | null
          updated_at?: string | null
          village?: string | null
        }
        Update: {
          admission_number?: string | null
          application_date?: string | null
          arabic_name?: string | null
          authorized_pickup_contact?: string | null
          authorized_pickup_name?: string | null
          class_id?: string | null
          created_at?: string | null
          current_residence?: string | null
          date_of_birth?: string | null
          district?: string | null
          dormitory?: string | null
          enrollment_date?: string | null
          former_class?: string | null
          former_school?: string | null
          former_year?: number | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          guardian_id?: string | null
          home_county?: string | null
          home_district?: string | null
          home_parish?: string | null
          home_region?: string | null
          home_sub_county?: string | null
          home_village?: string | null
          house?: Database["public"]["Enums"]["school_house"] | null
          id?: string
          lin_number?: string | null
          nationality?: string | null
          nira_certificate_status?: string | null
          parish?: string | null
          photo_url?: string | null
          pupil_status?: Database["public"]["Enums"]["pupil_status"] | null
          religion?: string | null
          reporting_date?: string | null
          status?: string | null
          street_road?: string | null
          subcounty?: string | null
          town_city?: string | null
          updated_at?: string | null
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learners_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learners_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_logs: {
        Row: {
          dispensed_at: string | null
          dispensed_by: string | null
          dosage_instructions: string | null
          id: string
          item_id: string | null
          quantity: number
          visit_id: string | null
        }
        Insert: {
          dispensed_at?: string | null
          dispensed_by?: string | null
          dosage_instructions?: string | null
          id?: string
          item_id?: string | null
          quantity: number
          visit_id?: string | null
        }
        Update: {
          dispensed_at?: string | null
          dispensed_by?: string | null
          dosage_instructions?: string | null
          id?: string
          item_id?: string | null
          quantity?: number
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_dispensed_by_fkey"
            columns: ["dispensed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_logs_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "health_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          channel: string
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          guardian_id: string | null
          id: string
          learner_id: string | null
          message_content: string
          recipient_name: string | null
          recipient_phone: string
          sent_at: string | null
          status: string | null
          template_id: string | null
        }
        Insert: {
          channel: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          guardian_id?: string | null
          id?: string
          learner_id?: string | null
          message_content: string
          recipient_name?: string | null
          recipient_phone: string
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          guardian_id?: string | null
          id?: string
          learner_id?: string | null
          message_content?: string
          recipient_name?: string | null
          recipient_phone?: string
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          channel: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          message_body: string
          name: string
          subject: string | null
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          channel?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          message_body: string
          name: string
          subject?: string | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          message_body?: string
          name?: string
          subject?: string | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          user_id?: string | null
        }
        Relationships: []
      }
      parent_learner_links: {
        Row: {
          created_at: string | null
          id: string
          learner_id: string
          parent_user_id: string
          relationship: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          learner_id: string
          parent_user_id: string
          relationship?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          learner_id?: string
          parent_user_id?: string
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_learner_links_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_lines: {
        Row: {
          advances_deducted: number | null
          base_salary: number
          employee_id: string | null
          id: string
          net_pay: number
          notes: string | null
          nssf_deduction: number | null
          other_deductions: number | null
          overtime_amount: number | null
          run_id: string | null
        }
        Insert: {
          advances_deducted?: number | null
          base_salary: number
          employee_id?: string | null
          id?: string
          net_pay: number
          notes?: string | null
          nssf_deduction?: number | null
          other_deductions?: number | null
          overtime_amount?: number | null
          run_id?: string | null
        }
        Update: {
          advances_deducted?: number | null
          base_salary?: number
          employee_id?: string | null
          id?: string
          net_pay?: number
          notes?: string | null
          nssf_deduction?: number | null
          other_deductions?: number | null
          overtime_amount?: number | null
          run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_lines_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_lines_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          created_at: string | null
          id: string
          month: number
          run_by: string | null
          status: Database["public"]["Enums"]["payroll_status"] | null
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          month: number
          run_by?: string | null
          status?: Database["public"]["Enums"]["payroll_status"] | null
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: number
          run_by?: string | null
          status?: Database["public"]["Enums"]["payroll_status"] | null
          year?: number
        }
        Relationships: []
      }
      personnel_attendance: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          created_at: string | null
          date: string
          employee_id: string | null
          id: string
          is_finalized: boolean | null
          notes: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["attendance_status"] | null
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string | null
          id?: string
          is_finalized?: boolean | null
          notes?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"] | null
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string | null
          id?: string
          is_finalized?: boolean | null
          notes?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "personnel_attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personnel_attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      petty_cash_invoices: {
        Row: {
          amount: number
          currency: string | null
          entered_at: string | null
          entered_by: string | null
          id: string
          invoice_image_url: string | null
          invoice_number: string | null
          item_description: string
          product_category: string | null
          run_id: string | null
        }
        Insert: {
          amount: number
          currency?: string | null
          entered_at?: string | null
          entered_by?: string | null
          id?: string
          invoice_image_url?: string | null
          invoice_number?: string | null
          item_description: string
          product_category?: string | null
          run_id?: string | null
        }
        Update: {
          amount?: number
          currency?: string | null
          entered_at?: string | null
          entered_by?: string | null
          id?: string
          invoice_image_url?: string | null
          invoice_number?: string | null
          item_description?: string
          product_category?: string | null
          run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "petty_cash_invoices_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "petty_cash_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      petty_cash_runs: {
        Row: {
          closed_at: string | null
          id: string
          opened_at: string | null
          opened_by: string | null
          project_id: string | null
          report_url: string | null
          signed_image_url: string | null
          status: Database["public"]["Enums"]["petty_cash_status"] | null
          total_float: number
        }
        Insert: {
          closed_at?: string | null
          id?: string
          opened_at?: string | null
          opened_by?: string | null
          project_id?: string | null
          report_url?: string | null
          signed_image_url?: string | null
          status?: Database["public"]["Enums"]["petty_cash_status"] | null
          total_float: number
        }
        Update: {
          closed_at?: string | null
          id?: string
          opened_at?: string | null
          opened_by?: string | null
          project_id?: string | null
          report_url?: string | null
          signed_image_url?: string | null
          status?: Database["public"]["Enums"]["petty_cash_status"] | null
          total_float?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_petty_cash_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_items: {
        Row: {
          batch_number: string | null
          category: string | null
          created_at: string | null
          description: string | null
          expiry_date: string | null
          id: string
          min_stock_level: number | null
          name: string
          quantity: number | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          batch_number?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          min_stock_level?: number | null
          name: string
          quantity?: number | null
          unit: string
          updated_at?: string | null
        }
        Update: {
          batch_number?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          min_stock_level?: number | null
          name?: string
          quantity?: number | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ple_mock_tests: {
        Row: {
          created_at: string | null
          created_by: string | null
          duration_minutes: number | null
          id: string
          is_past_paper: boolean | null
          subject: string
          title: string
          total_marks: number | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          id?: string
          is_past_paper?: boolean | null
          subject: string
          title: string
          total_marks?: number | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          id?: string
          is_past_paper?: boolean | null
          subject?: string
          title?: string
          total_marks?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ple_mock_tests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ple_results: {
        Row: {
          attempted_at: string | null
          grade: string | null
          id: string
          learner_id: string
          mock_test_id: string
          remarks: string | null
          score: number
          time_taken_minutes: number | null
        }
        Insert: {
          attempted_at?: string | null
          grade?: string | null
          id?: string
          learner_id: string
          mock_test_id: string
          remarks?: string | null
          score: number
          time_taken_minutes?: number | null
        }
        Update: {
          attempted_at?: string | null
          grade?: string | null
          id?: string
          learner_id?: string
          mock_test_id?: string
          remarks?: string | null
          score?: number
          time_taken_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ple_results_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ple_results_mock_test_id_fkey"
            columns: ["mock_test_id"]
            isOneToOne: false
            referencedRelation: "ple_mock_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          county: string | null
          created_at: string | null
          designation: string | null
          district_id: string | null
          email: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          parish: string | null
          phone: string | null
          qualification: string | null
          region: string | null
          role: string | null
          school_id: string | null
          scope: string | null
          sub_county: string | null
          updated_at: string | null
          village: string | null
        }
        Insert: {
          avatar_url?: string | null
          county?: string | null
          created_at?: string | null
          designation?: string | null
          district_id?: string | null
          email?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          parish?: string | null
          phone?: string | null
          qualification?: string | null
          region?: string | null
          role?: string | null
          school_id?: string | null
          scope?: string | null
          sub_county?: string | null
          updated_at?: string | null
          village?: string | null
        }
        Update: {
          avatar_url?: string | null
          county?: string | null
          created_at?: string | null
          designation?: string | null
          district_id?: string | null
          email?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          parish?: string | null
          phone?: string | null
          qualification?: string | null
          region?: string | null
          role?: string | null
          school_id?: string | null
          scope?: string | null
          sub_county?: string | null
          updated_at?: string | null
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      purchase_documents: {
        Row: {
          file_url: string
          id: string
          po_id: string | null
          type: Database["public"]["Enums"]["doc_type"]
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          file_url: string
          id?: string
          po_id?: string | null
          type: Database["public"]["Enums"]["doc_type"]
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          file_url?: string
          id?: string
          po_id?: string | null
          type?: Database["public"]["Enums"]["doc_type"]
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_documents_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          project_id: string | null
          requested_by: string | null
          status: Database["public"]["Enums"]["po_status"] | null
          title: string
          total_amount: number | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          project_id?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["po_status"] | null
          title: string
          total_amount?: number | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          project_id?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["po_status"] | null
          title?: string
          total_amount?: number | null
        }
        Relationships: []
      }
      report_cards: {
        Row: {
          academic_average: number | null
          academic_position: number | null
          academic_total: number | null
          academic_year: number
          attendance_percentage: number | null
          class_id: string
          class_size: number | null
          class_teacher_remarks: string | null
          cleanliness_rating: string | null
          conduct_rating: Database["public"]["Enums"]["competency_level"] | null
          days_absent: number | null
          days_present: number | null
          discipline_rating: string | null
          generated_at: string | null
          head_teacher_remarks: string | null
          id: string
          islamic_position: number | null
          islamic_teacher_remarks: string | null
          learner_id: string
          overall_competency:
            | Database["public"]["Enums"]["competency_level"]
            | null
          participation_rating: string | null
          published_at: string | null
          published_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          term: Database["public"]["Enums"]["term_type"]
        }
        Insert: {
          academic_average?: number | null
          academic_position?: number | null
          academic_total?: number | null
          academic_year?: number
          attendance_percentage?: number | null
          class_id: string
          class_size?: number | null
          class_teacher_remarks?: string | null
          cleanliness_rating?: string | null
          conduct_rating?:
            | Database["public"]["Enums"]["competency_level"]
            | null
          days_absent?: number | null
          days_present?: number | null
          discipline_rating?: string | null
          generated_at?: string | null
          head_teacher_remarks?: string | null
          id?: string
          islamic_position?: number | null
          islamic_teacher_remarks?: string | null
          learner_id: string
          overall_competency?:
            | Database["public"]["Enums"]["competency_level"]
            | null
          participation_rating?: string | null
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          term: Database["public"]["Enums"]["term_type"]
        }
        Update: {
          academic_average?: number | null
          academic_position?: number | null
          academic_total?: number | null
          academic_year?: number
          attendance_percentage?: number | null
          class_id?: string
          class_size?: number | null
          class_teacher_remarks?: string | null
          cleanliness_rating?: string | null
          conduct_rating?:
            | Database["public"]["Enums"]["competency_level"]
            | null
          days_absent?: number | null
          days_present?: number | null
          discipline_rating?: string | null
          generated_at?: string | null
          head_teacher_remarks?: string | null
          id?: string
          islamic_position?: number | null
          islamic_teacher_remarks?: string | null
          learner_id?: string
          overall_competency?:
            | Database["public"]["Enums"]["competency_level"]
            | null
          participation_rating?: string | null
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          term?: Database["public"]["Enums"]["term_type"]
        }
        Relationships: [
          {
            foreignKeyName: "report_cards_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          paid_by: string | null
          payment_date: string
          payment_method: string | null
          reference_number: string | null
          salary_record_id: string
          staff_id: string
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_by?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
          salary_record_id: string
          staff_id: string
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_by?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
          salary_record_id?: string
          staff_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_payments_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_payments_salary_record_id_fkey"
            columns: ["salary_record_id"]
            isOneToOne: false
            referencedRelation: "salary_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_payments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_records: {
        Row: {
          allowances: number | null
          basic_salary: number
          created_at: string | null
          currency: string | null
          deductions: number | null
          effective_from: string
          effective_to: string | null
          id: string
          net_salary: number | null
          notes: string | null
          staff_id: string
          updated_at: string | null
        }
        Insert: {
          allowances?: number | null
          basic_salary?: number
          created_at?: string | null
          currency?: string | null
          deductions?: number | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          net_salary?: number | null
          notes?: string | null
          staff_id: string
          updated_at?: string | null
        }
        Update: {
          allowances?: number | null
          basic_salary?: number
          created_at?: string | null
          currency?: string | null
          deductions?: number | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          net_salary?: number | null
          notes?: string | null
          staff_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_notifications: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          scheduled_for: string
          status: string | null
          target_audience: string
          target_class_id: string | null
          target_learner_ids: string[] | null
          template_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          scheduled_for: string
          status?: string | null
          target_audience: string
          target_class_id?: string | null
          target_learner_ids?: string[] | null
          template_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          scheduled_for?: string
          status?: string | null
          target_audience?: string
          target_class_id?: string | null
          target_learner_ids?: string[] | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_notifications_target_class_id_fkey"
            columns: ["target_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_notifications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      school_calendar: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          end_date: string
          event_type: string
          id: string
          is_public: boolean | null
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_date: string
          event_type: string
          id?: string
          is_public?: boolean | null
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          event_type?: string
          id?: string
          is_public?: boolean | null
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      school_infrastructure: {
        Row: {
          asset_type: string
          construction_year: number | null
          created_at: string | null
          id: string
          name: string | null
          school_id: string | null
          sitting_capacity: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          asset_type: string
          construction_year?: number | null
          created_at?: string | null
          id?: string
          name?: string | null
          school_id?: string | null
          sitting_capacity?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          asset_type?: string
          construction_year?: number | null
          created_at?: string | null
          id?: string
          name?: string | null
          school_id?: string | null
          sitting_capacity?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_infrastructure_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_sanitation: {
        Row: {
          created_at: string | null
          facility_type: string
          garbage_disposal_method: string | null
          has_handwashing_with_soap: boolean | null
          has_mhm_changing_room: boolean | null
          id: string
          is_accessible_to_pwd: boolean | null
          primary_water_source: string | null
          school_id: string | null
          status: string | null
          target_user: string
          units_count: number | null
        }
        Insert: {
          created_at?: string | null
          facility_type: string
          garbage_disposal_method?: string | null
          has_handwashing_with_soap?: boolean | null
          has_mhm_changing_room?: boolean | null
          id?: string
          is_accessible_to_pwd?: boolean | null
          primary_water_source?: string | null
          school_id?: string | null
          status?: string | null
          target_user: string
          units_count?: number | null
        }
        Update: {
          created_at?: string | null
          facility_type?: string
          garbage_disposal_method?: string | null
          has_handwashing_with_soap?: boolean | null
          has_mhm_changing_room?: boolean | null
          id?: string
          is_accessible_to_pwd?: boolean | null
          primary_water_source?: string | null
          school_id?: string | null
          status?: string | null
          target_user?: string
          units_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "school_sanitation_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          academic_level: string | null
          address: string | null
          boarding_status: string | null
          center_number: string | null
          county: string | null
          created_at: string | null
          distance_to_bank: number | null
          distance_to_district_hq: number | null
          distance_to_health_facility: number | null
          district_id: string | null
          gender_status: string | null
          id: string
          license_number: string | null
          name: string
          ownership_type: string | null
          parish: string | null
          region: string | null
          registration_status: string | null
          sub_county: string | null
          updated_at: string | null
          urban_rural: string | null
          village: string | null
          year_founded: number | null
        }
        Insert: {
          academic_level?: string | null
          address?: string | null
          boarding_status?: string | null
          center_number?: string | null
          county?: string | null
          created_at?: string | null
          distance_to_bank?: number | null
          distance_to_district_hq?: number | null
          distance_to_health_facility?: number | null
          district_id?: string | null
          gender_status?: string | null
          id?: string
          license_number?: string | null
          name: string
          ownership_type?: string | null
          parish?: string | null
          region?: string | null
          registration_status?: string | null
          sub_county?: string | null
          updated_at?: string | null
          urban_rural?: string | null
          village?: string | null
          year_founded?: number | null
        }
        Update: {
          academic_level?: string | null
          address?: string | null
          boarding_status?: string | null
          center_number?: string | null
          county?: string | null
          created_at?: string | null
          distance_to_bank?: number | null
          distance_to_district_hq?: number | null
          distance_to_health_facility?: number | null
          district_id?: string | null
          gender_status?: string | null
          id?: string
          license_number?: string | null
          name?: string
          ownership_type?: string | null
          parish?: string | null
          region?: string | null
          registration_status?: string | null
          sub_county?: string | null
          updated_at?: string | null
          urban_rural?: string | null
          village?: string | null
          year_founded?: number | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      store_orders: {
        Row: {
          category: Database["public"]["Enums"]["store_order_category"]
          created_at: string | null
          description: string
          id: string
          project_id: string | null
          quantity: number
          requested_by: string | null
          status: Database["public"]["Enums"]["store_order_status"] | null
          unit: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["store_order_category"]
          created_at?: string | null
          description: string
          id?: string
          project_id?: string | null
          quantity: number
          requested_by?: string | null
          status?: Database["public"]["Enums"]["store_order_status"] | null
          unit?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["store_order_category"]
          created_at?: string | null
          description?: string
          id?: string
          project_id?: string | null
          quantity?: number
          requested_by?: string | null
          status?: Database["public"]["Enums"]["store_order_status"] | null
          unit?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          category: Database["public"]["Enums"]["subject_category"]
          code: string | null
          created_at: string | null
          display_order: number
          grading_type: Database["public"]["Enums"]["grading_type"]
          id: string
          is_core: boolean | null
          max_class_level: number | null
          min_class_level: number | null
          name: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["subject_category"]
          code?: string | null
          created_at?: string | null
          display_order?: number
          grading_type?: Database["public"]["Enums"]["grading_type"]
          id?: string
          is_core?: boolean | null
          max_class_level?: number | null
          min_class_level?: number | null
          name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["subject_category"]
          code?: string | null
          created_at?: string | null
          display_order?: number
          grading_type?: Database["public"]["Enums"]["grading_type"]
          id?: string
          is_core?: boolean | null
          max_class_level?: number | null
          min_class_level?: number | null
          name?: string
        }
        Relationships: []
      }
      term_results: {
        Row: {
          academic_year: number
          class_id: string
          competency_rating: Database["public"]["Enums"]["competency_level"]
          created_at: string | null
          id: string
          juz_completed: number | null
          learner_id: string
          letter_grade: string | null
          recorded_by: string | null
          score: number | null
          subject_id: string
          teacher_remarks: string | null
          term: Database["public"]["Enums"]["term_type"]
          updated_at: string | null
        }
        Insert: {
          academic_year?: number
          class_id: string
          competency_rating: Database["public"]["Enums"]["competency_level"]
          created_at?: string | null
          id?: string
          juz_completed?: number | null
          learner_id: string
          letter_grade?: string | null
          recorded_by?: string | null
          score?: number | null
          subject_id: string
          teacher_remarks?: string | null
          term: Database["public"]["Enums"]["term_type"]
          updated_at?: string | null
        }
        Update: {
          academic_year?: number
          class_id?: string
          competency_rating?: Database["public"]["Enums"]["competency_level"]
          created_at?: string | null
          id?: string
          juz_completed?: number | null
          learner_id?: string
          letter_grade?: string | null
          recorded_by?: string | null
          score?: number | null
          subject_id?: string
          teacher_remarks?: string | null
          term?: Database["public"]["Enums"]["term_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "term_results_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_results_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_results_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_results_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_visits: {
        Row: {
          appointment_id: string | null
          badge_number: string | null
          check_in_at: string
          check_out_at: string | null
          created_at: string
          host_name: string | null
          host_staff_id: string | null
          id: string
          learner_id: string | null
          notes: string | null
          purpose: string | null
          recorded_by: string | null
          status: string
          visitor_id: string | null
          visitor_name: string
          visitor_phone: string | null
          visitor_photo_url: string | null
        }
        Insert: {
          appointment_id?: string | null
          badge_number?: string | null
          check_in_at?: string
          check_out_at?: string | null
          created_at?: string
          host_name?: string | null
          host_staff_id?: string | null
          id?: string
          learner_id?: string | null
          notes?: string | null
          purpose?: string | null
          recorded_by?: string | null
          status?: string
          visitor_id?: string | null
          visitor_name: string
          visitor_phone?: string | null
          visitor_photo_url?: string | null
        }
        Update: {
          appointment_id?: string | null
          badge_number?: string | null
          check_in_at?: string
          check_out_at?: string | null
          created_at?: string
          host_name?: string | null
          host_staff_id?: string | null
          id?: string
          learner_id?: string | null
          notes?: string | null
          purpose?: string | null
          recorded_by?: string | null
          status?: string
          visitor_id?: string | null
          visitor_name?: string
          visitor_phone?: string | null
          visitor_photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitor_visits_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_visits_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_visits_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          id_number: string | null
          is_recurring: boolean
          notes: string | null
          phone: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          id_number?: string | null
          is_recurring?: boolean
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          id_number?: string | null
          is_recurring?: boolean
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_gate_passes: {
        Row: {
          director_approval_date: string | null
          id: string | null
          item_name: string | null
          qr_verification_code: string | null
          quantity: number | null
          requester_name: string | null
          status: string | null
          tracking_number: string | null
        }
        Relationships: []
      }
      inventory_details: {
        Row: {
          brand: string | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          current_stock: number | null
          custodian_id: string | null
          description: string | null
          expiry_date: string | null
          id: string | null
          min_stock_level: number | null
          model: string | null
          name: string | null
          storage_location: string | null
          supplier_contact: string | null
          supplier_name: string | null
          technical_specs: Json | null
          unit: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_custodian_id_fkey"
            columns: ["custodian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      sync_inventory_stock: { Args: never; Returns: undefined }
    }
    Enums: {
      account_type: "asset" | "liability" | "equity" | "income" | "expense"
      app_role:
        | "admin"
        | "teacher"
        | "parent"
        | "staff"
        | "head_teacher"
        | "accountant"
        | "security"
      approval_step_type: "committee" | "head_office" | "kuwait"
      asset_category_type: "furniture" | "equipment" | "other"
      attendance_status: "present" | "absent" | "late" | "excused"
      competency_level: "exceeding" | "meeting" | "approaching" | "beginning"
      discipline_severity: "minor" | "moderate" | "major" | "critical"
      doc_type: "invoice" | "delivery_note" | "receipt" | "quotation"
      donor_type: "individual" | "organization" | "grant"
      gender_type: "male" | "female"
      grading_type: "numeric" | "letter" | "descriptive"
      health_priority: "low" | "medium" | "high" | "critical"
      health_visit_type: "illness" | "injury" | "routine_checkup" | "emergency"
      inventory_transaction_type:
        | "restock"
        | "issuance"
        | "return"
        | "adjustment"
        | "damage"
      parent_relationship:
        | "father"
        | "mother"
        | "guardian"
        | "next_of_kin"
        | "authorized_pickup"
        | "other"
      payroll_status: "draft" | "approved" | "paid"
      petty_cash_status: "open" | "closed" | "archived"
      po_status:
        | "draft"
        | "committee"
        | "head_office"
        | "kuwait"
        | "approved"
        | "rejected"
        | "archived"
      pupil_status: "bait_zakat" | "iico" | "paying" | "community"
      repayment_plan: "single" | "installment"
      report_status: "draft" | "published" | "locked"
      school_house: "lion" | "tiger" | "elephant" | "cheetah"
      store_order_category: "food" | "stationery"
      store_order_status:
        | "pending_director"
        | "pending_accountant"
        | "pending_storekeeper"
        | "completed"
      subject_category: "academic" | "islamic" | "behavior"
      term_type: "term_1" | "term_2" | "term_3"
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
      account_type: ["asset", "liability", "equity", "income", "expense"],
      app_role: [
        "admin",
        "teacher",
        "parent",
        "staff",
        "head_teacher",
        "accountant",
        "security",
      ],
      approval_step_type: ["committee", "head_office", "kuwait"],
      asset_category_type: ["furniture", "equipment", "other"],
      attendance_status: ["present", "absent", "late", "excused"],
      competency_level: ["exceeding", "meeting", "approaching", "beginning"],
      discipline_severity: ["minor", "moderate", "major", "critical"],
      doc_type: ["invoice", "delivery_note", "receipt", "quotation"],
      donor_type: ["individual", "organization", "grant"],
      gender_type: ["male", "female"],
      grading_type: ["numeric", "letter", "descriptive"],
      health_priority: ["low", "medium", "high", "critical"],
      health_visit_type: ["illness", "injury", "routine_checkup", "emergency"],
      inventory_transaction_type: [
        "restock",
        "issuance",
        "return",
        "adjustment",
        "damage",
      ],
      parent_relationship: [
        "father",
        "mother",
        "guardian",
        "next_of_kin",
        "authorized_pickup",
        "other",
      ],
      payroll_status: ["draft", "approved", "paid"],
      petty_cash_status: ["open", "closed", "archived"],
      po_status: [
        "draft",
        "committee",
        "head_office",
        "kuwait",
        "approved",
        "rejected",
        "archived",
      ],
      pupil_status: ["bait_zakat", "iico", "paying", "community"],
      repayment_plan: ["single", "installment"],
      report_status: ["draft", "published", "locked"],
      school_house: ["lion", "tiger", "elephant", "cheetah"],
      store_order_category: ["food", "stationery"],
      store_order_status: [
        "pending_director",
        "pending_accountant",
        "pending_storekeeper",
        "completed",
      ],
      subject_category: ["academic", "islamic", "behavior"],
      term_type: ["term_1", "term_2", "term_3"],
    },
  },
} as const
