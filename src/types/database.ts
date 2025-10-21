export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          credits: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          credits?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      videos: {
        Row: {
          id: string;
          user_id: string;
          prompt: string;
          enhanced_prompt: string | null;
          model: string;
          duration: number;
          size: string;
          category: string;
          style: string | null;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          openai_task_id: string | null;
          video_url: string | null;
          thumbnail_url: string | null;
          cost: number;
          metadata: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          prompt: string;
          enhanced_prompt?: string | null;
          model: string;
          duration: number;
          size: string;
          category: string;
          style?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          openai_task_id?: string | null;
          video_url?: string | null;
          thumbnail_url?: string | null;
          cost: number;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          prompt?: string;
          enhanced_prompt?: string | null;
          model?: string;
          duration?: number;
          size?: string;
          category?: string;
          style?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          openai_task_id?: string | null;
          video_url?: string | null;
          thumbnail_url?: string | null;
          cost?: number;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      usage_logs: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          action: string;
          cost: number;
          duration: number;
          metadata: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          action: string;
          cost: number;
          duration: number;
          metadata?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          action?: string;
          cost?: number;
          duration?: number;
          metadata?: Record<string, any> | null;
          created_at?: string;
        };
      };
    };
  };
}

export type Video = Database['public']['Tables']['videos']['Row'];
export type VideoInsert = Database['public']['Tables']['videos']['Insert'];
export type VideoUpdate = Database['public']['Tables']['videos']['Update'];

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type UsageLog = Database['public']['Tables']['usage_logs']['Row'];
export type UsageLogInsert = Database['public']['Tables']['usage_logs']['Insert'];

export interface VideoGenerationRequest {
  prompt: string;
  model: 'sora-2' | 'sora-2-pro';
  duration: number;
  size: string;
  category: string;
  style?: string;
}

export interface VideoGenerationResponse {
  id: string;
  status: 'pending' | 'processing';
  estimated_cost: number;
  video_id?: string;
}

export interface VideoStatusResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
  progress?: number;
}