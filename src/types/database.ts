export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_metrics: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kra_metrics: Json | null
          metadata: Json | null
          rgqs_metrics: Json | null
          score: number
          ticket_id: string | null
          tool_metrics: Json | null
          trace_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kra_metrics?: Json | null
          metadata?: Json | null
          rgqs_metrics?: Json | null
          score: number
          ticket_id?: string | null
          tool_metrics?: Json | null
          trace_id: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kra_metrics?: Json | null
          metadata?: Json | null
          rgqs_metrics?: Json | null
          score?: number
          ticket_id?: string | null
          tool_metrics?: Json | null
          trace_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_metrics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_metrics_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          metadata: Json | null
          name: string
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      interactions: {
        Row: {
          content: string
          created_at: string
          customer_id: string
          id: string
          metadata: Json | null
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          customer_id: string
          id?: string
          metadata?: Json | null
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          customer_id?: string
          id?: string
          metadata?: Json | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_articles: {
        Row: {
          approved_by: string | null
          category_id: string | null
          content: string
          content_format: string | null
          created_at: string
          created_by: string | null
          has_embeddings: boolean | null
          id: string
          metadata: Json | null
          search_vector: unknown | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          updated_by: string | null
          version: number | null
        }
        Insert: {
          approved_by?: string | null
          category_id?: string | null
          content: string
          content_format?: string | null
          created_at?: string
          created_by?: string | null
          has_embeddings?: boolean | null
          id?: string
          metadata?: Json | null
          search_vector?: unknown | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number | null
        }
        Update: {
          approved_by?: string | null
          category_id?: string | null
          content?: string
          content_format?: string | null
          created_at?: string
          created_by?: string | null
          has_embeddings?: boolean | null
          id?: string
          metadata?: Json | null
          search_vector?: unknown | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_articles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "kb_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_articles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_articles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "kb_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_embeddings: {
        Row: {
          article_id: string | null
          content: string
          created_at: string
          embedding: string
          id: number
          metadata: Json | null
        }
        Insert: {
          article_id?: string | null
          content: string
          created_at?: string
          embedding: string
          id?: never
          metadata?: Json | null
        }
        Update: {
          article_id?: string | null
          content?: string
          created_at?: string
          embedding?: string
          id?: never
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_embeddings_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "kb_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_retrieval_metrics: {
        Row: {
          accuracy: number | null
          context_match: number | null
          created_at: string
          id: string
          metadata: Json | null
          metric_id: string | null
          query_text: string
          relevance_score: number | null
          relevant_chunks: Json | null
          retrieved_chunks: Json | null
          updated_at: string
        }
        Insert: {
          accuracy?: number | null
          context_match?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_id?: string | null
          query_text: string
          relevance_score?: number | null
          relevant_chunks?: Json | null
          retrieved_chunks?: Json | null
          updated_at?: string
        }
        Update: {
          accuracy?: number | null
          context_match?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_id?: string | null
          query_text?: string
          relevance_score?: number | null
          relevant_chunks?: Json | null
          retrieved_chunks?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_retrieval_metrics_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "ai_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_sign_in_at: string | null
          role: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_sign_in_at?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_sign_in_at?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      response_quality_metrics: {
        Row: {
          accuracy: number | null
          clarity_score: number | null
          created_at: string
          helpfulness_score: number | null
          human_rating: number | null
          id: string
          message_id: string | null
          metadata: Json | null
          metric_id: string | null
          overall_quality: number | null
          relevance: number | null
          response_length: number | null
          response_text: string | null
          response_time: unknown | null
          sentiment_score: number | null
          ticket_id: string | null
          tone: number | null
          updated_at: string
        }
        Insert: {
          accuracy?: number | null
          clarity_score?: number | null
          created_at?: string
          helpfulness_score?: number | null
          human_rating?: number | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          metric_id?: string | null
          overall_quality?: number | null
          relevance?: number | null
          response_length?: number | null
          response_text?: string | null
          response_time?: unknown | null
          sentiment_score?: number | null
          ticket_id?: string | null
          tone?: number | null
          updated_at?: string
        }
        Update: {
          accuracy?: number | null
          clarity_score?: number | null
          created_at?: string
          helpfulness_score?: number | null
          human_rating?: number | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          metric_id?: string | null
          overall_quality?: number | null
          relevance?: number | null
          response_length?: number | null
          response_text?: string | null
          response_time?: unknown | null
          sentiment_score?: number | null
          ticket_id?: string | null
          tone?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "response_quality_metrics_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ticket_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_quality_metrics_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "ai_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_quality_metrics_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          ticket_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          ticket_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_feedback_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          content: string
          context_used: Json | null
          created_at: string
          id: string
          is_ai: boolean | null
          metadata: Json | null
          metrics: Json | null
          sender_id: string | null
          ticket_id: string
          tool_calls: Json[] | null
        }
        Insert: {
          content: string
          context_used?: Json | null
          created_at?: string
          id?: string
          is_ai?: boolean | null
          metadata?: Json | null
          metrics?: Json | null
          sender_id?: string | null
          ticket_id: string
          tool_calls?: Json[] | null
        }
        Update: {
          content?: string
          context_used?: Json | null
          created_at?: string
          id?: string
          is_ai?: boolean | null
          metadata?: Json | null
          metrics?: Json | null
          sender_id?: string | null
          ticket_id?: string
          tool_calls?: Json[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_tools: {
        Row: {
          created_at: string
          description: string
          enabled: boolean | null
          id: string
          metadata: Json | null
          name: string
          parameters: Json
          required_role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          enabled?: boolean | null
          id?: string
          metadata?: Json | null
          name: string
          parameters: Json
          required_role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          enabled?: boolean | null
          id?: string
          metadata?: Json | null
          name?: string
          parameters?: Json
          required_role?: string
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          ai_handled: boolean | null
          ai_metadata: Json | null
          assigned_to: string | null
          context_used: Json | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          description: string
          id: string
          metadata: Json | null
          priority: string
          status: string
          title: string
          tool_calls: Json[] | null
          updated_at: string
        }
        Insert: {
          ai_handled?: boolean | null
          ai_metadata?: Json | null
          assigned_to?: string | null
          context_used?: Json | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description: string
          id?: string
          metadata?: Json | null
          priority?: string
          status?: string
          title: string
          tool_calls?: Json[] | null
          updated_at?: string
        }
        Update: {
          ai_handled?: boolean | null
          ai_metadata?: Json | null
          assigned_to?: string | null
          context_used?: Json | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          priority?: string
          status?: string
          title?: string
          tool_calls?: Json[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      begin_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      commit_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_policies: {
        Args: {
          table_name: string
        }
        Returns: {
          policyname: unknown
          permissive: string
          roles: unknown[]
          cmd: string
          qual: string
          with_check: string
        }[]
      }
      get_user_role: {
        Args: {
          user_id: string
        }
        Returns: string
      }
      gtrgm_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_kb_embeddings: {
        Args: {
          query_embedding: number[]
          similarity_threshold?: number
          match_count?: number
        }
        Returns: {
          content: string
          article_id: string
          article_title: string
          article_url: string
          similarity: number
        }[]
      }
      rollback_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: {
          "": string
        }
        Returns: string[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      sync_user_roles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

