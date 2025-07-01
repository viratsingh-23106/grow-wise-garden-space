export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          session_token: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          session_token: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          session_token?: string
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          last_activity: string
          session_token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          last_activity?: string
          session_token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          last_activity?: string
          session_token?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          category_id: string | null
          content: string
          created_at: string
          featured_image: string | null
          id: string
          published_at: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category_id?: string | null
          content: string
          created_at?: string
          featured_image?: string | null
          id?: string
          published_at?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category_id?: string | null
          content?: string
          created_at?: string
          featured_image?: string | null
          id?: string
          published_at?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      community_discussions: {
        Row: {
          author_id: string
          category_id: string | null
          content: string
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category_id?: string | null
          content: string
          created_at?: string
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category_id?: string | null
          content?: string
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_discussions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "discussion_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      community_participants: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          experience_level: string
          id: string
          interests: string[] | null
          location: string | null
          name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          experience_level: string
          id?: string
          interests?: string[] | null
          location?: string | null
          name: string
          phone?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          experience_level?: string
          id?: string
          interests?: string[] | null
          location?: string | null
          name?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      discussion_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      discussion_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          discussion_id: string
          id: string
          parent_reply_id: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          discussion_id: string
          id?: string
          parent_reply_id?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          discussion_id?: string
          id?: string
          parent_reply_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_replies_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "community_discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "discussion_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_guides: {
        Row: {
          created_at: string
          description: string | null
          id: string
          product_id: string
          title: string
          total_steps: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          product_id: string
          title: string
          total_steps?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          product_id?: string
          title?: string
          total_steps?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_guides_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      guidance_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      guide_steps: {
        Row: {
          created_at: string
          description: string | null
          document_url: string | null
          estimated_duration: string | null
          guide_id: string
          id: string
          step_number: number
          title: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_url?: string | null
          estimated_duration?: string | null
          guide_id: string
          id?: string
          step_number: number
          title: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          document_url?: string | null
          estimated_duration?: string | null
          guide_id?: string
          id?: string
          step_number?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_steps_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "growth_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          shipping_address: Json | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          shipping_address?: Json | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          shipping_address?: Json | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          created_at: string
          id: string
          product_id: string
          rating: number
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          rating: number
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          guidance_steps: number | null
          id: string
          image_url: string | null
          name: string
          price: number
          sensors: string[] | null
          stock_quantity: number | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          guidance_steps?: number | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          sensors?: string[] | null
          stock_quantity?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          guidance_steps?: number | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          sensors?: string[] | null
          stock_quantity?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      sensor_data: {
        Row: {
          humidity: number | null
          id: string
          light_level: number | null
          nutrients: number | null
          ph_level: number | null
          recorded_at: string
          sensor_id: string | null
          soil_moisture: number | null
          temperature: number | null
          user_id: string | null
        }
        Insert: {
          humidity?: number | null
          id?: string
          light_level?: number | null
          nutrients?: number | null
          ph_level?: number | null
          recorded_at?: string
          sensor_id?: string | null
          soil_moisture?: number | null
          temperature?: number | null
          user_id?: string | null
        }
        Update: {
          humidity?: number | null
          id?: string
          light_level?: number | null
          nutrients?: number | null
          ph_level?: number | null
          recorded_at?: string
          sensor_id?: string | null
          soil_moisture?: number | null
          temperature?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sensor_data_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "user_sensors"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          trial_end: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed_steps: number | null
          created_at: string
          guide_id: string
          id: string
          is_completed: boolean | null
          last_accessed: string | null
          user_id: string
        }
        Insert: {
          completed_steps?: number | null
          created_at?: string
          guide_id: string
          id?: string
          is_completed?: boolean | null
          last_accessed?: string | null
          user_id: string
        }
        Update: {
          completed_steps?: number | null
          created_at?: string
          guide_id?: string
          id?: string
          is_completed?: boolean | null
          last_accessed?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "growth_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sensors: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          location: string | null
          sensor_name: string
          sensor_type: string
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          location?: string | null
          sensor_name: string
          sensor_type: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          location?: string | null
          sensor_name?: string
          sensor_type?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      webinar_registrations: {
        Row: {
          attendance_status: string | null
          id: string
          participant_email: string
          participant_name: string
          participant_phone: string | null
          registration_date: string
          user_id: string | null
          webinar_id: string
        }
        Insert: {
          attendance_status?: string | null
          id?: string
          participant_email: string
          participant_name: string
          participant_phone?: string | null
          registration_date?: string
          user_id?: string | null
          webinar_id: string
        }
        Update: {
          attendance_status?: string | null
          id?: string
          participant_email?: string
          participant_name?: string
          participant_phone?: string | null
          registration_date?: string
          user_id?: string | null
          webinar_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webinar_registrations_webinar_id_fkey"
            columns: ["webinar_id"]
            isOneToOne: false
            referencedRelation: "webinars"
            referencedColumns: ["id"]
          },
        ]
      }
      webinars: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          host_name: string
          id: string
          max_participants: number | null
          recording_url: string | null
          scheduled_date: string
          status: string
          title: string
          updated_at: string
          zoom_meeting_link: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          host_name: string
          id?: string
          max_participants?: number | null
          recording_url?: string | null
          scheduled_date: string
          status?: string
          title: string
          updated_at?: string
          zoom_meeting_link?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          host_name?: string
          id?: string
          max_participants?: number | null
          recording_url?: string | null
          scheduled_date?: string
          status?: string
          title?: string
          updated_at?: string
          zoom_meeting_link?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_admin_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_product_average_rating: {
        Args: { product_uuid: string }
        Returns: number
      }
      get_product_review_count: {
        Args: { product_uuid: string }
        Returns: number
      }
      log_admin_activity: {
        Args: {
          token: string
          action_name: string
          entity_type_name: string
          entity_id_val?: string
          details_json?: Json
        }
        Returns: undefined
      }
      validate_admin_secret: {
        Args: { secret_input: string }
        Returns: Json
      }
      validate_admin_session: {
        Args: { token: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
