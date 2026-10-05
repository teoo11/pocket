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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: number
          sender_id: string | null
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: never
          sender_id?: string | null
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: never
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_reads: {
        Row: {
          conversation_id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_reads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversation_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          closed_at: string | null
          created_at: string
          helper_id: string | null
          id: string
          job_id: string
          last_message_at: string | null
          poster_id: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          helper_id?: string | null
          id?: string
          job_id: string
          last_message_at?: string | null
          poster_id?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          helper_id?: string | null
          id?: string
          job_id?: string
          last_message_at?: string | null
          poster_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversations_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_poster_id_fkey"
            columns: ["poster_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversations_poster_id_fkey"
            columns: ["poster_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_private: {
        Row: {
          address: string
          exact_loc: unknown
          job_id: string
        }
        Insert: {
          address?: string
          exact_loc: unknown
          job_id: string
        }
        Update: {
          address?: string
          exact_loc?: unknown
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_private_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_private_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          area_label: string
          cancelled_at: string | null
          category: Database["public"]["Enums"]["job_category"]
          category_label: string | null
          confirmed_at: string | null
          created_at: string
          description: string
          dur_min: number
          finished_at: string | null
          half1_paid_at: string | null
          helper_id: string | null
          id: string
          is_example: boolean
          minutes: number | null
          paid_at: string | null
          pay_lei: number
          poster_id: string | null
          public_loc: unknown
          start_min: number
          started_at: string | null
          starts_at: string
          starts_on: string
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
        }
        Insert: {
          area_label: string
          cancelled_at?: string | null
          category: Database["public"]["Enums"]["job_category"]
          category_label?: string | null
          confirmed_at?: string | null
          created_at?: string
          description?: string
          dur_min: number
          finished_at?: string | null
          half1_paid_at?: string | null
          helper_id?: string | null
          id?: string
          is_example?: boolean
          minutes?: number | null
          paid_at?: string | null
          pay_lei: number
          poster_id?: string | null
          public_loc: unknown
          start_min: number
          started_at?: string | null
          starts_at: string
          starts_on: string
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
        }
        Update: {
          area_label?: string
          cancelled_at?: string | null
          category?: Database["public"]["Enums"]["job_category"]
          category_label?: string | null
          confirmed_at?: string | null
          created_at?: string
          description?: string
          dur_min?: number
          finished_at?: string | null
          half1_paid_at?: string | null
          helper_id?: string | null
          id?: string
          is_example?: boolean
          minutes?: number | null
          paid_at?: string | null
          pay_lei?: number
          poster_id?: string | null
          public_loc?: unknown
          start_min?: number
          started_at?: string | null
          starts_at?: string
          starts_on?: string
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "jobs_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_poster_id_fkey"
            columns: ["poster_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "jobs_poster_id_fkey"
            columns: ["poster_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json
          id: number
          link: string | null
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: never
          link?: string | null
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: never
          link?: string | null
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string
          decided_at: string | null
          helper_id: string
          id: string
          job_id: string
          status: Database["public"]["Enums"]["offer_status"]
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          helper_id: string
          id?: string
          job_id: string
          status?: Database["public"]["Enums"]["offer_status"]
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          helper_id?: string
          id?: string
          job_id?: string
          status?: Database["public"]["Enums"]["offer_status"]
        }
        Relationships: [
          {
            foreignKeyName: "offers_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "offers_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_bani: number
          created_at: string
          fee_bani: number
          id: string
          job_id: string
          method: Database["public"]["Enums"]["payment_method"]
          part: number
          payee_id: string | null
          payer_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          succeeded_at: string | null
        }
        Insert: {
          amount_bani: number
          created_at?: string
          fee_bani?: number
          id?: string
          job_id: string
          method: Database["public"]["Enums"]["payment_method"]
          part: number
          payee_id?: string | null
          payer_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          succeeded_at?: string | null
        }
        Update: {
          amount_bani?: number
          created_at?: string
          fee_bani?: number
          id?: string
          job_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          part?: number
          payee_id?: string | null
          payer_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          succeeded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_accounts: {
        Row: {
          created_at: string
          details_submitted: boolean
          payouts_enabled: boolean
          stripe_account_id: string
          transfers_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details_submitted?: boolean
          payouts_enabled?: boolean
          stripe_account_id: string
          transfers_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details_submitted?: boolean
          payouts_enabled?: boolean
          stripe_account_id?: string
          transfers_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payout_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          id: number
          loc: unknown
          name: string
          zone: string
        }
        Insert: {
          id: number
          loc: unknown
          name: string
          zone: string
        }
        Update: {
          id?: number
          loc?: unknown
          name?: string
          zone?: string
        }
        Relationships: []
      }
      profile_private: {
        Row: {
          earnings_seen_at: string
          home: unknown
          home_label: string | null
          last_seen_level: number
          phone: string | null
          savings_goal_lei: number | null
          savings_goal_name: string | null
          user_id: string
        }
        Insert: {
          earnings_seen_at?: string
          home?: unknown
          home_label?: string | null
          last_seen_level?: number
          phone?: string | null
          savings_goal_lei?: number | null
          savings_goal_name?: string | null
          user_id: string
        }
        Update: {
          earnings_seen_at?: string
          home?: unknown
          home_label?: string | null
          last_seen_level?: number
          phone?: string | null
          savings_goal_lei?: number | null
          savings_goal_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_private_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profile_private_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accepts_card: boolean
          area_label: string | null
          avatar_path: string | null
          bio: string
          created_at: string
          display_name: string
          id: string
          is_example: boolean
          locale: string
          max_dist_m: number
          onboarded_at: string | null
          schedule: Json
          skills: Database["public"]["Enums"]["job_category"][]
        }
        Insert: {
          accepts_card?: boolean
          area_label?: string | null
          avatar_path?: string | null
          bio?: string
          created_at?: string
          display_name: string
          id: string
          is_example?: boolean
          locale?: string
          max_dist_m?: number
          onboarded_at?: string | null
          schedule?: Json
          skills?: Database["public"]["Enums"]["job_category"][]
        }
        Update: {
          accepts_card?: boolean
          area_label?: string | null
          avatar_path?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          id?: string
          is_example?: boolean
          locale?: string
          max_dist_m?: number
          onboarded_at?: string | null
          schedule?: Json
          skills?: Database["public"]["Enums"]["job_category"][]
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string
          id: string
          job_id: string | null
          kind: Database["public"]["Enums"]["report_kind"]
          message_id: number | null
          reason: string
          reporter_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: string
          id?: string
          job_id?: string | null
          kind: Database["public"]["Enums"]["report_kind"]
          message_id?: number | null
          reason: string
          reporter_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: string
          id?: string
          job_id?: string | null
          kind?: Database["public"]["Enums"]["report_kind"]
          message_id?: number | null
          reason?: string
          reporter_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_id: string | null
          comment: string
          created_at: string
          id: string
          job_id: string
          stars: number
          subject_id: string | null
          subject_role: Database["public"]["Enums"]["review_role"]
          tags: string[]
        }
        Insert: {
          author_id?: string | null
          comment?: string
          created_at?: string
          id?: string
          job_id: string
          stars: number
          subject_id?: string | null
          subject_role: Database["public"]["Enums"]["review_role"]
          tags?: string[]
        }
        Update: {
          author_id?: string | null
          comment?: string
          created_at?: string
          id?: string
          job_id?: string
          stars?: number
          subject_id?: string | null
          subject_role?: Database["public"]["Enums"]["review_role"]
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          id: string
          received_at: string
          type: string
        }
        Insert: {
          id: string
          received_at?: string
          type: string
        }
        Update: {
          id?: string
          received_at?: string
          type?: string
        }
        Relationships: []
      }
      team_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string | null
          topic: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id?: string | null
          topic: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      job_cards: {
        Row: {
          area_label: string | null
          cancelled_at: string | null
          category: Database["public"]["Enums"]["job_category"] | null
          category_label: string | null
          confirmed_at: string | null
          created_at: string | null
          description: string | null
          dist_m: number | null
          dur_min: number | null
          finished_at: string | null
          fits_me: boolean | null
          half1_paid_at: string | null
          helper_id: string | null
          id: string | null
          is_example: boolean | null
          lat: number | null
          lng: number | null
          minutes: number | null
          paid_at: string | null
          pay_lei: number | null
          poster_avatar: string | null
          poster_id: string | null
          poster_name: string | null
          search_text: string | null
          start_min: number | null
          started_at: string | null
          starts_at: string | null
          starts_on: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "jobs_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_poster_id_fkey"
            columns: ["poster_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "jobs_poster_id_fkey"
            columns: ["poster_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_stats: {
        Row: {
          helper_rating: number | null
          helper_reviews: number | null
          jobs_done: number | null
          jobs_posted: number | null
          minutes: number | null
          points: number | null
          poster_rating: number | null
          poster_reviews: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      attach_checkout_session: {
        Args: { p_payment_id: string; p_session_id: string }
        Returns: undefined
      }
      begin_card_payment: {
        Args: {
          p_fee_percent: number
          p_job_id: string
          p_part: number
          p_user_id: string
        }
        Returns: {
          amount_bani: number
          destination: string
          fee_bani: number
          job_title: string
          payment_id: string
        }[]
      }
      cancel_job: { Args: { p_job_id: string }; Returns: undefined }
      card_payment_closed: {
        Args: {
          p_session_id: string
          p_status: Database["public"]["Enums"]["payment_status"]
        }
        Returns: undefined
      }
      card_payment_refunded: {
        Args: { p_payment_intent: string }
        Returns: undefined
      }
      card_payment_succeeded: {
        Args: { p_payment_intent: string; p_session_id: string }
        Returns: undefined
      }
      complete_onboarding: {
        Args: {
          p_display_name: string
          p_home_label: string
          p_lat: number
          p_lng: number
          p_locale: string
          p_phone: string
        }
        Returns: undefined
      }
      confirm_job: { Args: { p_job_id: string }; Returns: undefined }
      create_job: {
        Args: {
          p_address: string
          p_category: Database["public"]["Enums"]["job_category"]
          p_category_label: string
          p_description: string
          p_dur_min: number
          p_lat: number
          p_lng: number
          p_pay_lei: number
          p_start_min: number
          p_starts_on: string
          p_title: string
        }
        Returns: string
      }
      finish_job: {
        Args: { p_job_id: string; p_minutes: number }
        Returns: undefined
      }
      job_cards_for: {
        Args: { p_ids: string[]; p_lat?: number; p_lng?: number }
        Returns: {
          area_label: string | null
          cancelled_at: string | null
          category: Database["public"]["Enums"]["job_category"] | null
          category_label: string | null
          confirmed_at: string | null
          created_at: string | null
          description: string | null
          dist_m: number | null
          dur_min: number | null
          finished_at: string | null
          fits_me: boolean | null
          half1_paid_at: string | null
          helper_id: string | null
          id: string | null
          is_example: boolean | null
          lat: number | null
          lng: number | null
          minutes: number | null
          paid_at: string | null
          pay_lei: number | null
          poster_avatar: string | null
          poster_id: string | null
          poster_name: string | null
          search_text: string | null
          start_min: number | null
          started_at: string | null
          starts_at: string | null
          starts_on: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          title: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "job_cards"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      job_contact: {
        Args: { p_job_id: string }
        Returns: {
          address: string
          lat: number
          lng: number
          other_avatar: string
          other_id: string
          other_name: string
          phone: string
        }[]
      }
      leaderboard: {
        Args: { p_by?: string; p_limit?: number; p_period?: string }
        Returns: {
          avatar_path: string
          avg_rating: number
          display_name: string
          is_example: boolean
          jobs_done: number
          minutes: number
          points: number
          user_id: string
        }[]
      }
      make_offer: { Args: { p_job_id: string }; Returns: string }
      my_conversations: {
        Args: never
        Returns: {
          closed_at: string
          i_am_poster: boolean
          id: string
          job_id: string
          job_status: Database["public"]["Enums"]["job_status"]
          job_title: string
          last_body: string
          last_message_at: string
          last_sender_id: string
          other_avatar: string
          other_id: string
          other_name: string
          unread: number
        }[]
      }
      offer_candidates: {
        Args: { p_job_id: string }
        Returns: {
          avatar_path: string
          conversation_id: string
          display_name: string
          dist_m: number
          helper_id: string
          helper_rating: number
          helper_reviews: number
          is_example: boolean
          jobs_done: number
          offer_id: string
          offered_at: string
          points: number
        }[]
      }
      payout_account_owner: { Args: { p_account_id: string }; Returns: string }
      pending_card_session: {
        Args: { p_job_id: string; p_part: number; p_user_id: string }
        Returns: string
      }
      pick_helper: { Args: { p_offer_id: string }; Returns: undefined }
      prepare_account_deletion: { Args: never; Returns: undefined }
      record_cash_payment: {
        Args: { p_job_id: string; p_part: number }
        Returns: undefined
      }
      search_job_counts: {
        Args: {
          p_examples?: boolean
          p_lat?: number
          p_lng?: number
          p_max_dist_m?: number
          p_min_pay?: number
          p_q?: string
          p_when?: string
        }
        Returns: {
          category: Database["public"]["Enums"]["job_category"]
          open_count: number
        }[]
      }
      search_jobs: {
        Args: {
          p_category?: Database["public"]["Enums"]["job_category"]
          p_examples?: boolean
          p_lat?: number
          p_limit?: number
          p_lng?: number
          p_max_dist_m?: number
          p_min_pay?: number
          p_offset?: number
          p_q?: string
          p_sort?: string
          p_when?: string
        }
        Returns: {
          area_label: string | null
          cancelled_at: string | null
          category: Database["public"]["Enums"]["job_category"] | null
          category_label: string | null
          confirmed_at: string | null
          created_at: string | null
          description: string | null
          dist_m: number | null
          dur_min: number | null
          finished_at: string | null
          fits_me: boolean | null
          half1_paid_at: string | null
          helper_id: string | null
          id: string | null
          is_example: boolean | null
          lat: number | null
          lng: number | null
          minutes: number | null
          paid_at: string | null
          pay_lei: number | null
          poster_avatar: string | null
          poster_id: string | null
          poster_name: string | null
          search_text: string | null
          start_min: number | null
          started_at: string | null
          starts_at: string | null
          starts_on: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          title: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "job_cards"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      set_home: {
        Args: { p_label: string; p_lat: number; p_lng: number }
        Returns: undefined
      }
      start_job: { Args: { p_job_id: string }; Returns: undefined }
      submit_review: {
        Args: {
          p_comment: string
          p_job_id: string
          p_stars: number
          p_tags: string[]
        }
        Returns: undefined
      }
      sync_payout_account: {
        Args: {
          p_account_id: string
          p_details_submitted: boolean
          p_payouts_enabled: boolean
          p_transfers_active: boolean
          p_user_id: string
        }
        Returns: undefined
      }
      unread_conversations: { Args: never; Returns: number }
      withdraw_offer: { Args: { p_job_id: string }; Returns: undefined }
    }
    Enums: {
      job_category:
        | "pet"
        | "tech"
        | "tutoring"
        | "carrying"
        | "plants"
        | "errands"
        | "household"
        | "creative"
        | "computer"
        | "other"
      job_status:
        | "open"
        | "accepted"
        | "started"
        | "done"
        | "completed"
        | "paid"
        | "cancelled"
      offer_status: "pending" | "accepted" | "declined" | "withdrawn"
      payment_method: "cash" | "card"
      payment_status:
        | "pending"
        | "succeeded"
        | "failed"
        | "canceled"
        | "refunded"
      report_kind: "job" | "user" | "message" | "app"
      review_role: "helper" | "poster"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      job_category: [
        "pet",
        "tech",
        "tutoring",
        "carrying",
        "plants",
        "errands",
        "household",
        "creative",
        "computer",
        "other",
      ],
      job_status: [
        "open",
        "accepted",
        "started",
        "done",
        "completed",
        "paid",
        "cancelled",
      ],
      offer_status: ["pending", "accepted", "declined", "withdrawn"],
      payment_method: ["cash", "card"],
      payment_status: [
        "pending",
        "succeeded",
        "failed",
        "canceled",
        "refunded",
      ],
      report_kind: ["job", "user", "message", "app"],
      review_role: ["helper", "poster"],
    },
  },
} as const
