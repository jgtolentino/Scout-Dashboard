export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_sql: {
        Args: {
          query_text: string
          params: any[]
        }
        Returns: any
      }
      get_ai_context: {
        Args: Record<string, any>
        Returns: any
      }
      get_recommendation_context: {
        Args: Record<string, any>
        Returns: any
      }
      semantic_search: {
        Args: Record<string, any>
        Returns: any
      }
      detect_anomalies: {
        Args: Record<string, any>
        Returns: any
      }
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  platinum: {
    Tables: {
      chat_messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          timestamp: string
          context: Json | null
        }
        Insert: {
          id?: string
          conversation_id: string
          role: string
          content: string
          timestamp?: string
          context?: Json | null
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          content?: string
          timestamp?: string
          context?: Json | null
        }
      }
      ai_insights: {
        Row: {
          id: string
          type: string
          title: string
          description: string
          confidence: number
          priority: string
          category: string
          recommendations: string[]
          created_at: string
          analysis_params: Json | null
        }
        Insert: {
          id?: string
          type: string
          title: string
          description: string
          confidence: number
          priority: string
          category: string
          recommendations: string[]
          created_at?: string
          analysis_params?: Json | null
        }
        Update: {
          id?: string
          type?: string
          title?: string
          description?: string
          confidence?: number
          priority?: string
          category?: string
          recommendations?: string[]
          created_at?: string
          analysis_params?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}