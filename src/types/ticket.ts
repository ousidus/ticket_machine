export type TicketStatus = 'open' | 'in_progress' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high'
export type UserRole = 'user' | 'reviewer' | 'admin'

export interface Ticket {
  id: string
  title: string
  description: string | null
  status: TicketStatus
  priority: TicketPriority
  created_at: string
  updated_at: string
  user_id: string
  assigned_to: string | null
  attachments: string[] | null
  tags: string[] | null
}

export interface CreateTicketData {
  title: string
  description?: string
  priority?: TicketPriority
  attachments?: string[]
  tags?: string[]
}

export interface UpdateTicketData {
  title?: string
  description?: string
  status?: TicketStatus
  priority?: TicketPriority
  assigned_to?: string | null
  attachments?: string[]
  tags?: string[]
}

export interface TicketComment {
  id: string
  ticket_id: string
  user_id: string
  comment: string
  created_at: string
}

export interface UserRoleRecord {
  id: string
  user_id: string
  role: UserRole
  created_at: string
}

export interface User {
  id: string
  email: string
  role?: UserRole
}
