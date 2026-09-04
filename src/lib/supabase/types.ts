export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      business_hours: {
        Row: {
          closes_at: string | null;
          day_of_week: number;
          id: string;
          is_closed: boolean;
          opens_at: string | null;
          position: number;
          restaurant_id: string;
        };
        Insert: {
          closes_at?: string | null;
          day_of_week: number;
          id?: string;
          is_closed?: boolean;
          opens_at?: string | null;
          position?: number;
          restaurant_id: string;
        };
        Update: {
          closes_at?: string | null;
          day_of_week?: number;
          id?: string;
          is_closed?: boolean;
          opens_at?: string | null;
          position?: number;
          restaurant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_hours_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          display_style: string;
          icon_key: string;
          id: string;
          is_active: boolean;
          is_visible: boolean;
          name: string;
          position: number;
          restaurant_id: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          display_style?: string;
          icon_key?: string;
          id?: string;
          is_active?: boolean;
          is_visible?: boolean;
          name: string;
          position?: number;
          restaurant_id: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          display_style?: string;
          icon_key?: string;
          id?: string;
          is_active?: boolean;
          is_visible?: boolean;
          name?: string;
          position?: number;
          restaurant_id?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: {
          code: string;
          created_at: string;
          features: Json;
          id: string;
          name: string;
          price_cents: number;
          sort_order: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          features?: Json;
          id?: string;
          name: string;
          price_cents?: number;
          sort_order?: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          features?: Json;
          id?: string;
          name?: string;
          price_cents?: number;
          sort_order?: number;
        };
        Relationships: [];
      };
      product_option_groups: {
        Row: {
          id: string;
          is_required: boolean;
          max_select: number;
          min_select: number;
          name: string;
          product_id: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          is_required?: boolean;
          max_select?: number;
          min_select?: number;
          name: string;
          product_id: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          is_required?: boolean;
          max_select?: number;
          min_select?: number;
          name?: string;
          product_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_option_groups_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_options: {
        Row: {
          group_id: string;
          id: string;
          is_available: boolean;
          name: string;
          price_cents: number;
          sort_order: number;
        };
        Insert: {
          group_id: string;
          id?: string;
          is_available?: boolean;
          name: string;
          price_cents?: number;
          sort_order?: number;
        };
        Update: {
          group_id?: string;
          id?: string;
          is_available?: boolean;
          name?: string;
          price_cents?: number;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_options_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "product_option_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category_id: string;
          compare_at_price_cents: number | null;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_available: boolean;
          is_featured: boolean;
          name: string;
          price_cents: number;
          restaurant_id: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          category_id: string;
          compare_at_price_cents?: number | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean;
          is_featured?: boolean;
          name: string;
          price_cents: number;
          restaurant_id: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          compare_at_price_cents?: number | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean;
          is_featured?: boolean;
          name?: string;
          price_cents?: number;
          restaurant_id?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      promotions: {
        Row: {
          badge_text: string;
          created_at: string;
          daily_end: string | null;
          daily_start: string | null;
          discount_type: string;
          discount_value: number | null;
          ends_at: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          position: number;
          product_id: string | null;
          restaurant_id: string;
          starts_at: string | null;
          stock_limit: number | null;
          stock_used: number;
          subtitle: string | null;
          title: string;
          weekdays: number[];
        };
        Insert: {
          badge_text?: string;
          created_at?: string;
          daily_end?: string | null;
          daily_start?: string | null;
          discount_type?: string;
          discount_value?: number | null;
          ends_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          position?: number;
          product_id?: string | null;
          restaurant_id: string;
          starts_at?: string | null;
          stock_limit?: number | null;
          stock_used?: number;
          subtitle?: string | null;
          title: string;
          weekdays?: number[];
        };
        Update: {
          badge_text?: string;
          created_at?: string;
          daily_end?: string | null;
          daily_start?: string | null;
          discount_type?: string;
          discount_value?: number | null;
          ends_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          position?: number;
          product_id?: string | null;
          restaurant_id?: string;
          starts_at?: string | null;
          stock_limit?: number | null;
          stock_used?: number;
          subtitle?: string | null;
          title?: string;
          weekdays?: number[];
        };
        Relationships: [
          {
            foreignKeyName: "promotions_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promotions_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      restaurant_settings: {
        Row: {
          accepts_delivery: boolean;
          accepts_dinein: boolean;
          accepts_pickup: boolean;
          created_at: string;
          delivery_time_max: number | null;
          delivery_time_min: number | null;
          has_change: boolean;
          instagram: string | null;
          min_order_cents: number;
          order_notice: string | null;
          ordering_enabled: boolean;
          payment_methods: Json;
          pix_key: string | null;
          restaurant_id: string;
          updated_at: string;
        };
        Insert: {
          accepts_delivery?: boolean;
          accepts_dinein?: boolean;
          accepts_pickup?: boolean;
          created_at?: string;
          delivery_time_max?: number | null;
          delivery_time_min?: number | null;
          has_change?: boolean;
          instagram?: string | null;
          min_order_cents?: number;
          order_notice?: string | null;
          ordering_enabled?: boolean;
          payment_methods?: Json;
          pix_key?: string | null;
          restaurant_id: string;
          updated_at?: string;
        };
        Update: {
          accepts_delivery?: boolean;
          accepts_dinein?: boolean;
          accepts_pickup?: boolean;
          created_at?: string;
          delivery_time_max?: number | null;
          delivery_time_min?: number | null;
          has_change?: boolean;
          instagram?: string | null;
          min_order_cents?: number;
          order_notice?: string | null;
          ordering_enabled?: boolean;
          payment_methods?: Json;
          pix_key?: string | null;
          restaurant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "restaurant_settings_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: true;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      restaurant_users: {
        Row: {
          created_at: string;
          id: string;
          restaurant_id: string;
          role: Database["public"]["Enums"]["restaurant_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          restaurant_id: string;
          role?: Database["public"]["Enums"]["restaurant_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          restaurant_id?: string;
          role?: Database["public"]["Enums"]["restaurant_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "restaurant_users_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      restaurants: {
        Row: {
          address: string | null;
          address_city: string | null;
          address_district: string | null;
          address_note: string | null;
          address_number: string | null;
          address_state: string | null;
          address_street: string | null;
          address_zip: string | null;
          category: string | null;
          city: string | null;
          closing_soon_threshold_min: number;
          closing_time: string | null;
          cnpj: string | null;
          cover_poster_url: string | null;
          cover_type: string;
          cover_url: string | null;
          cover_video_url: string | null;
          created_at: string;
          delivery_time_min: number;
          free_shipping_min: number | null;
          id: string;
          last_order_offset_min: number;
          latitude: number | null;
          legal_name: string | null;
          logo_url: string | null;
          longitude: number | null;
          name: string;
          phone: string | null;
          prep_time_min: number;
          segment: string;
          slug: string;
          status: string;
          theme_bg: string;
          theme_muted: string;
          theme_primary: string;
          theme_primary_soft: string;
          theme_success: string;
          theme_surface: string;
          theme_text: string;
          updated_at: string;
          urgency_panel_enabled: boolean;
          whatsapp: string | null;
        };
        Insert: {
          address?: string | null;
          address_city?: string | null;
          address_district?: string | null;
          address_note?: string | null;
          address_number?: string | null;
          address_state?: string | null;
          address_street?: string | null;
          address_zip?: string | null;
          category?: string | null;
          city?: string | null;
          closing_soon_threshold_min?: number;
          closing_time?: string | null;
          cnpj?: string | null;
          cover_poster_url?: string | null;
          cover_type?: string;
          cover_url?: string | null;
          cover_video_url?: string | null;
          created_at?: string;
          delivery_time_min?: number;
          free_shipping_min?: number | null;
          id?: string;
          last_order_offset_min?: number;
          latitude?: number | null;
          legal_name?: string | null;
          logo_url?: string | null;
          longitude?: number | null;
          name: string;
          phone?: string | null;
          prep_time_min?: number;
          segment?: string;
          slug: string;
          status?: string;
          theme_bg?: string;
          theme_muted?: string;
          theme_primary?: string;
          theme_primary_soft?: string;
          theme_success?: string;
          theme_surface?: string;
          theme_text?: string;
          updated_at?: string;
          urgency_panel_enabled?: boolean;
          whatsapp?: string | null;
        };
        Update: {
          address?: string | null;
          address_city?: string | null;
          address_district?: string | null;
          address_note?: string | null;
          address_number?: string | null;
          address_state?: string | null;
          address_street?: string | null;
          address_zip?: string | null;
          category?: string | null;
          city?: string | null;
          closing_soon_threshold_min?: number;
          closing_time?: string | null;
          cnpj?: string | null;
          cover_poster_url?: string | null;
          cover_type?: string;
          cover_url?: string | null;
          cover_video_url?: string | null;
          created_at?: string;
          delivery_time_min?: number;
          free_shipping_min?: number | null;
          id?: string;
          last_order_offset_min?: number;
          latitude?: number | null;
          legal_name?: string | null;
          logo_url?: string | null;
          longitude?: number | null;
          name?: string;
          phone?: string | null;
          prep_time_min?: number;
          segment?: string;
          slug?: string;
          status?: string;
          theme_bg?: string;
          theme_muted?: string;
          theme_primary?: string;
          theme_primary_soft?: string;
          theme_success?: string;
          theme_surface?: string;
          theme_text?: string;
          updated_at?: string;
          urgency_panel_enabled?: boolean;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          created_at: string;
          current_period_end: string | null;
          id: string;
          plan_id: string;
          restaurant_id: string;
          started_at: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          plan_id: string;
          restaurant_id: string;
          started_at?: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          plan_id?: string;
          restaurant_id?: string;
          started_at?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: true;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_restaurant: {
        Args: {
          p_address: string;
          p_business_hours?: Json;
          p_category: string;
          p_city: string;
          p_name: string;
          p_phone: string;
          p_slug: string;
          p_whatsapp: string;
        };
        Returns: {
          address: string | null;
          address_city: string | null;
          address_district: string | null;
          address_note: string | null;
          address_number: string | null;
          address_state: string | null;
          address_street: string | null;
          address_zip: string | null;
          category: string | null;
          city: string | null;
          closing_soon_threshold_min: number;
          closing_time: string | null;
          cnpj: string | null;
          cover_poster_url: string | null;
          cover_type: string;
          cover_url: string | null;
          cover_video_url: string | null;
          created_at: string;
          delivery_time_min: number;
          free_shipping_min: number | null;
          id: string;
          last_order_offset_min: number;
          latitude: number | null;
          legal_name: string | null;
          logo_url: string | null;
          longitude: number | null;
          name: string;
          phone: string | null;
          prep_time_min: number;
          segment: string;
          slug: string;
          status: string;
          theme_bg: string;
          theme_muted: string;
          theme_primary: string;
          theme_primary_soft: string;
          theme_success: string;
          theme_surface: string;
          theme_text: string;
          updated_at: string;
          urgency_panel_enabled: boolean;
          whatsapp: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "restaurants";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      is_category_publicly_visible: {
        Args: { p_category_id: string };
        Returns: boolean;
      };
      is_member_of_restaurant: {
        Args: { p_restaurant_id: string };
        Returns: boolean;
      };
      is_option_group_publicly_visible: {
        Args: { p_group_id: string };
        Returns: boolean;
      };
      is_owner_of_restaurant: {
        Args: { p_restaurant_id: string };
        Returns: boolean;
      };
      is_product_publicly_visible: {
        Args: { p_product_id: string };
        Returns: boolean;
      };
      is_restaurant_publicly_visible: {
        Args: { p_restaurant_id: string };
        Returns: boolean;
      };
      is_slug_available: { Args: { p_slug: string }; Returns: boolean };
      option_group_restaurant_id: {
        Args: { p_group_id: string };
        Returns: string;
      };
      product_restaurant_id: { Args: { p_product_id: string }; Returns: string };
    };
    Enums: {
      restaurant_role: "owner" | "staff";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      restaurant_role: ["owner", "staff"],
    },
  },
} as const;
