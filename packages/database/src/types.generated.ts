// AUTO-GENERATED — do not edit manually
// Regenerate with: pnpm supabase:types
// Command: supabase gen types typescript --local > packages/database/src/types.generated.ts
//
// This file is tracked in git so CI doesn't need supabase CLI installed.
// Regenerate whenever the database schema changes.
//
// Last manually updated: 2026-06-09 (Phase 5 — feedback_submissions table, feedback_type enum)

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
      brands: {
        Row: {
          id: string
          name: string
          slug: string
          country: string | null
          website: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          country?: string | null
          website?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          country?: string | null
          website?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ball_families: {
        Row: {
          id: string
          brand_id: string
          name: string
          slug: string
          description: string | null
          first_release_year: number | null
          last_release_year: number | null
          status: Database['public']['Enums']['ball_status']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          name: string
          slug: string
          description?: string | null
          first_release_year?: number | null
          last_release_year?: number | null
          status?: Database['public']['Enums']['ball_status']
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          name?: string
          slug?: string
          description?: string | null
          first_release_year?: number | null
          last_release_year?: number | null
          status?: Database['public']['Enums']['ball_status']
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ball_families_brand_id_fkey'
            columns: ['brand_id']
            isOneToOne: false
            referencedRelation: 'brands'
            referencedColumns: ['id']
          },
        ]
      }
      ball_versions: {
        Row: {
          id: string
          family_id: string
          name: string
          slug: string
          release_year: number | null
          release_date: string | null
          msrp_usd: number | null
          msrp_nok: number | null
          status: Database['public']['Enums']['ball_status']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          slug: string
          release_year?: number | null
          release_date?: string | null
          msrp_usd?: number | null
          msrp_nok?: number | null
          status?: Database['public']['Enums']['ball_status']
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          name?: string
          slug?: string
          release_year?: number | null
          release_date?: string | null
          msrp_usd?: number | null
          msrp_nok?: number | null
          status?: Database['public']['Enums']['ball_status']
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ball_versions_family_id_fkey'
            columns: ['family_id']
            isOneToOne: false
            referencedRelation: 'ball_families'
            referencedColumns: ['id']
          },
        ]
      }
      ball_aliases: {
        Row: {
          id: string
          version_id: string
          alias: string
          alias_type: Database['public']['Enums']['alias_type_enum']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          version_id: string
          alias: string
          alias_type?: Database['public']['Enums']['alias_type_enum']
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          version_id?: string
          alias?: string
          alias_type?: Database['public']['Enums']['alias_type_enum']
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ball_aliases_version_id_fkey'
            columns: ['version_id']
            isOneToOne: false
            referencedRelation: 'ball_versions'
            referencedColumns: ['id']
          },
        ]
      }
      condition_multipliers: {
        Row: {
          id: string
          profile_id: string
          condition: string
          multiplier: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          condition: string
          multiplier: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          condition?: string
          multiplier?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'condition_multipliers_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'valuation_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      valuation_profiles: {
        Row: {
          id: string
          segment: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          segment: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          segment?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      valuation_rules: {
        Row: {
          id: string
          profile_id: string
          age_adjustment: number
          demand_adjustment: number
          availability_adjustment: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          age_adjustment?: number
          demand_adjustment?: number
          availability_adjustment?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          age_adjustment?: number
          demand_adjustment?: number
          availability_adjustment?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'valuation_rules_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'valuation_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      technical_specs: {
        Row: {
          id: string
          version_id: string
          construction_layers: number | null
          compression: number | null
          cover_material: string | null
          core_material: string | null
          dimple_count: number | null
          dimple_pattern: string | null
          launch_profile: Database['public']['Enums']['launch_profile'] | null
          spin_profile: Database['public']['Enums']['spin_profile'] | null
          feel_profile: Database['public']['Enums']['feel_profile'] | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          version_id: string
          construction_layers?: number | null
          compression?: number | null
          cover_material?: string | null
          core_material?: string | null
          dimple_count?: number | null
          dimple_pattern?: string | null
          launch_profile?: Database['public']['Enums']['launch_profile'] | null
          spin_profile?: Database['public']['Enums']['spin_profile'] | null
          feel_profile?: Database['public']['Enums']['feel_profile'] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          version_id?: string
          construction_layers?: number | null
          compression?: number | null
          cover_material?: string | null
          core_material?: string | null
          dimple_count?: number | null
          dimple_pattern?: string | null
          launch_profile?: Database['public']['Enums']['launch_profile'] | null
          spin_profile?: Database['public']['Enums']['spin_profile'] | null
          feel_profile?: Database['public']['Enums']['feel_profile'] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'technical_specs_version_id_fkey'
            columns: ['version_id']
            isOneToOne: true
            referencedRelation: 'ball_versions'
            referencedColumns: ['id']
          },
        ]
      }
      visual_signatures: {
        Row: {
          id: string
          version_id: string
          primary_color: string | null
          finish: Database['public']['Enums']['ball_finish'] | null
          logo_style: string | null
          logo_text: string | null
          alignment_marking: string | null
          number_style: string | null
          number_color: string | null
          special_markings: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          version_id: string
          primary_color?: string | null
          finish?: Database['public']['Enums']['ball_finish'] | null
          logo_style?: string | null
          logo_text?: string | null
          alignment_marking?: string | null
          number_style?: string | null
          number_color?: string | null
          special_markings?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          version_id?: string
          primary_color?: string | null
          finish?: Database['public']['Enums']['ball_finish'] | null
          logo_style?: string | null
          logo_text?: string | null
          alignment_marking?: string | null
          number_style?: string | null
          number_color?: string | null
          special_markings?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'visual_signatures_version_id_fkey'
            columns: ['version_id']
            isOneToOne: true
            referencedRelation: 'ball_versions'
            referencedColumns: ['id']
          },
        ]
      }
      identification_features: {
        Row: {
          id: string
          version_id: string
          feature_type: Database['public']['Enums']['identification_feature_type']
          feature_value: string
          importance_score: number
          created_at: string
        }
        Insert: {
          id?: string
          version_id: string
          feature_type: Database['public']['Enums']['identification_feature_type']
          feature_value: string
          importance_score: number
          created_at?: string
        }
        Update: {
          id?: string
          version_id?: string
          feature_type?: Database['public']['Enums']['identification_feature_type']
          feature_value?: string
          importance_score?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'identification_features_version_id_fkey'
            columns: ['version_id']
            isOneToOne: false
            referencedRelation: 'ball_versions'
            referencedColumns: ['id']
          },
        ]
      }
      images: {
        Row: {
          id: string
          version_id: string
          image_type: Database['public']['Enums']['image_type']
          storage_path: string | null
          source_url: string | null
          license: string | null
          width: number | null
          height: number | null
          review_status: Database['public']['Enums']['image_review_status']
          image_quality_score: number | null
          attribution: string | null
          alt_text: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          version_id: string
          image_type: Database['public']['Enums']['image_type']
          storage_path?: string | null
          source_url?: string | null
          license?: string | null
          width?: number | null
          height?: number | null
          review_status?: Database['public']['Enums']['image_review_status']
          image_quality_score?: number | null
          attribution?: string | null
          alt_text?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          version_id?: string
          image_type?: Database['public']['Enums']['image_type']
          storage_path?: string | null
          source_url?: string | null
          license?: string | null
          width?: number | null
          height?: number | null
          review_status?: Database['public']['Enums']['image_review_status']
          image_quality_score?: number | null
          attribution?: string | null
          alt_text?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'images_version_id_fkey'
            columns: ['version_id']
            isOneToOne: false
            referencedRelation: 'ball_versions'
            referencedColumns: ['id']
          },
        ]
      }
      segments: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      version_segments: {
        Row: {
          version_id: string
          segment_id: string
        }
        Insert: {
          version_id: string
          segment_id: string
        }
        Update: {
          version_id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'version_segments_version_id_fkey'
            columns: ['version_id']
            isOneToOne: false
            referencedRelation: 'ball_versions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'version_segments_segment_id_fkey'
            columns: ['segment_id']
            isOneToOne: false
            referencedRelation: 'segments'
            referencedColumns: ['id']
          },
        ]
      }
      sources: {
        Row: {
          id: string
          name: string
          url: string | null
          source_type: Database['public']['Enums']['source_type']
          reliability_score: number
          license_notes: string | null
          market_type: Database['public']['Enums']['market_type'] | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          url?: string | null
          source_type: Database['public']['Enums']['source_type']
          reliability_score?: number
          license_notes?: string | null
          market_type?: Database['public']['Enums']['market_type'] | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          url?: string | null
          source_type?: Database['public']['Enums']['source_type']
          reliability_score?: number
          license_notes?: string | null
          market_type?: Database['public']['Enums']['market_type'] | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      feedback_submissions: {
        Row: {
          id: string
          version_id: string | null
          type: Database['public']['Enums']['feedback_type']
          message: string
          email: string | null
          source_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          version_id?: string | null
          type: Database['public']['Enums']['feedback_type']
          message: string
          email?: string | null
          source_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          version_id?: string | null
          type?: Database['public']['Enums']['feedback_type']
          message?: string
          email?: string | null
          source_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'feedback_submissions_version_id_fkey'
            columns: ['version_id']
            isOneToOne: false
            referencedRelation: 'ball_versions'
            referencedColumns: ['id']
          },
        ]
      }
      price_observations: {
        Row: {
          id: string
          version_id: string
          condition: Database['public']['Enums']['price_condition']
          market: string
          currency: string
          price: number
          observed_at: string
          source_id: string | null
          is_archived: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          version_id: string
          condition: Database['public']['Enums']['price_condition']
          market?: string
          currency?: string
          price: number
          observed_at?: string
          source_id?: string | null
          is_archived?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          version_id?: string
          condition?: Database['public']['Enums']['price_condition']
          market?: string
          currency?: string
          price?: number
          observed_at?: string
          source_id?: string | null
          is_archived?: boolean
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'price_observations_version_id_fkey'
            columns: ['version_id']
            isOneToOne: false
            referencedRelation: 'ball_versions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'price_observations_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'sources'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      alias_type_enum:
        | 'common_name'
        | 'abbreviation'
        | 'misspelling'
        | 'regional_name'
        | 'generation_tag'
      ball_status: 'draft' | 'published' | 'archived' | 'discontinued'
      ball_finish: 'glossy' | 'matte' | 'satin'
      launch_profile: 'low' | 'mid' | 'high'
      spin_profile: 'low' | 'mid' | 'high'
      feel_profile: 'soft' | 'medium' | 'firm'
      image_type: 'hero' | 'logo' | 'alignment' | 'number' | 'side' | 'dimple' | 'packaging'
      image_review_status: 'pending' | 'approved' | 'rejected'
      market_type: 'retail' | 'used' | 'recycled' | 'auction' | 'marketplace' | 'reference'
      price_condition: 'new' | 'mint' | 'near_mint' | 'good' | 'fair' | 'recycled' | 'lake_ball'
      source_type: 'manufacturer' | 'retailer' | 'review' | 'community' | 'auction'
      feedback_type:
        | 'incorrect_info'
        | 'suggest_correction'
        | 'request_ball'
        | 'missing_specs'
      identification_feature_type:
        | 'brand_text'
        | 'model_text'
        | 'logo'
        | 'alignment_marking'
        | 'number_color'
        | 'finish'
        | 'color'
        | 'dimple_pattern'
        | 'special_marking'
    }
    CompositeTypes: Record<string, never>
  }
}

type DefaultSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never
