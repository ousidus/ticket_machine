import { createBrowserClient, createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const createClientComponentClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (for server components)
export const createServerComponentClient = (cookieStore: { get: (name: string) => { value?: string } | undefined }) =>
  createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

// Route handler Supabase client
export const createRouteHandlerClient = (cookieStore: { get: (name: string) => { value?: string } | undefined; set: (name: string, value: string, options: Record<string, unknown>) => void; remove?: (name: string, options: Record<string, unknown>) => void }) =>
  createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        cookieStore.set(name, value, options)
      },
      remove(name: string, options: Record<string, unknown>) {
        cookieStore.set(name, '', { ...options, maxAge: 0 })
      },
    },
  })

export type Database = {
  public: {
    Tables: {
      tickets: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'open' | 'in_progress' | 'closed'
          priority: 'low' | 'medium' | 'high'
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: 'open' | 'in_progress' | 'closed'
          priority?: 'low' | 'medium' | 'high'
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: 'open' | 'in_progress' | 'closed'
          priority?: 'low' | 'medium' | 'high'
          created_at?: string
          updated_at?: string
          user_id?: string
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
  }
}
