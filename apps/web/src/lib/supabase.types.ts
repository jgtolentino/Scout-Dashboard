// TypeScript types for Supabase database
// Generated from Scout Dashboard database schema

export interface Database {
  public: {
    Tables: {};
    Views: {};
    Functions: {};
    Enums: {};
  };
  scout: {
    Tables: {
      file_uploads: {
        Row: {
          id: string;
          user_id: string;
          filename: string;
          file_path: string;
          file_size: number;
          file_hash: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          uploaded_at: string;
          processed_at: string | null;
          error_message: string | null;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          filename: string;
          file_path: string;
          file_size: number;
          file_hash: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          uploaded_at?: string;
          processed_at?: string | null;
          error_message?: string | null;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          filename?: string;
          file_path?: string;
          file_size?: number;
          file_hash?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          uploaded_at?: string;
          processed_at?: string | null;
          error_message?: string | null;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      file_processing_logs: {
        Row: {
          id: string;
          upload_id: string;
          filename: string;
          file_type: string;
          records_found: number;
          records_imported: number;
          records_failed: number;
          processing_time_ms: number | null;
          error_details: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          upload_id: string;
          filename: string;
          file_type: string;
          records_found?: number;
          records_imported?: number;
          records_failed?: number;
          processing_time_ms?: number | null;
          error_details?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          upload_id?: string;
          filename?: string;
          file_type?: string;
          records_found?: number;
          records_imported?: number;
          records_failed?: number;
          processing_time_ms?: number | null;
          error_details?: Record<string, any> | null;
          created_at?: string;
        };
      };
    };
    Views: {
      import_statistics: {
        Row: {
          user_id: string;
          total_uploads: number;
          successful_uploads: number;
          failed_uploads: number;
          processing_uploads: number;
          total_size_bytes: number;
          total_records_imported: number;
          total_records_failed: number;
          last_upload_date: string;
          avg_processing_time_ms: number;
        };
      };
    };
    Functions: {
      check_duplicate_file: {
        Args: { p_user_id: string; p_file_hash: string };
        Returns: boolean;
      };
      update_upload_status: {
        Args: { p_upload_id: string; p_status: string; p_error_message?: string };
        Returns: void;
      };
      get_upload_history: {
        Args: { p_user_id: string; p_limit?: number };
        Returns: Array<{
          id: string;
          filename: string;
          file_size: number;
          status: string;
          uploaded_at: string;
          processed_at: string | null;
          error_message: string | null;
          records_imported: number;
          processing_time_ms: number | null;
        }>;
      };
    };
    Enums: {};
  };
}