'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Clock, AlertCircle, CheckCircle, User, Paperclip, Tag } from 'lucide-react'
import type { Ticket, TicketStatus, User as UserType } from '@/types/ticket'

const statusConfig = {
  open: {
    title: 'Open',
    icon: Clock,
    color: 'bg-blue-50 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  in_progress: {
    title: 'In Progress', 
    icon: AlertCircle,
    color: 'bg-yellow-50 border-yellow-200',
    badgeColor: 'bg-yellow-100 text-yellow-800'
  },
  closed: {
    title: 'Closed',
    icon: CheckCircle,
    color: 'bg-green-50 border-green-200',
    badgeColor: 'bg-green-100 text-green-800'
  }
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800',
}

interface KanbanBoardProps {
  onTicketClick?: (ticket: Ticket) => void
}

export function KanbanBoard({ onTicketClick }: KanbanBoardProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const fetchData = async () => {
    try {
      // Fetch all tickets (for admin/reviewer view)
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (ticketsError) throw ticketsError

      // Fetch users for assignment
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
      
      if (usersError) {
        console.warn('Could not fetch users:', usersError)
        // Continue without user data
      }

      setTickets(ticketsData || [])
      setUsers(usersData?.users?.map(user => ({ id: user.id, email: user.email || 'Unknown' })) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', ticketId)

      if (error) throw error

      setTickets(tickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status, updated_at: new Date().toISOString() }
          : ticket
      ))
    } catch (err) {
      console.error('Failed to update ticket status:', err)
    }
  }

  const assignTicket = async (ticketId: string, userId: string | null) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          assigned_to: userId,
          updated_at: new Date().toISOString() 
        })
        .eq('id', ticketId)

      if (error) throw error

      setTickets(tickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, assigned_to: userId, updated_at: new Date().toISOString() }
          : ticket
      ))
    } catch (err) {
      console.error('Failed to assign ticket:', err)
    }
  }

  useEffect(() => {
    fetchData()

    // Set up real-time subscription
    const subscription = supabase
      .channel('kanban-tickets')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tickets' 
        }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTickets(prev => [payload.new as Ticket, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setTickets(prev => prev.map(ticket => 
              ticket.id === payload.new.id ? payload.new as Ticket : ticket
            ))
          } else if (payload.eventType === 'DELETE') {
            setTickets(prev => prev.filter(ticket => ticket.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase]) // eslint-disable-line react-hooks/exhaustive-deps

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTicketsByStatus = (status: TicketStatus) => {
    return tickets.filter(ticket => ticket.status === status)
  }

  const getUserEmail = (userId: string | null) => {
    if (!userId) return 'Unassigned'
    const user = users.find(u => u.id === userId)
    return user?.email || 'Unknown User'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading kanban board...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>{error}</p>
        <Button onClick={fetchData} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Object.entries(statusConfig).map(([status, config]) => {
        const statusTickets = getTicketsByStatus(status as TicketStatus)
        const StatusIcon = config.icon

        return (
          <div key={status} className={`rounded-lg border-2 ${config.color} p-4`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <StatusIcon className="h-5 w-5" />
                <h3 className="font-semibold">{config.title}</h3>
              </div>
              <Badge variant="secondary">
                {statusTickets.length}
              </Badge>
            </div>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {statusTickets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <StatusIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tickets</p>
                </div>
              ) : (
                statusTickets.map((ticket) => (
                  <Card 
                    key={ticket.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onTicketClick?.(ticket)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium leading-tight">
                          {ticket.title}
                        </CardTitle>
                        <Badge 
                          variant="outline" 
                          className={`ml-2 ${priorityColors[ticket.priority]} text-xs`}
                        >
                          {ticket.priority}
                        </Badge>
                      </div>
                      {ticket.description && (
                        <CardDescription className="text-xs line-clamp-2">
                          {ticket.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {ticket.tags && ticket.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <Tag className="h-3 w-3 text-gray-400" />
                          {ticket.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {ticket.tags.length > 2 && (
                            <span className="text-xs text-gray-500">+{ticket.tags.length - 2}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">
                            {ticket.user_id.slice(0, 8)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {ticket.attachments && ticket.attachments.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              <span>{ticket.attachments.length}</span>
                            </div>
                          )}
                          <span>{formatDate(ticket.created_at)}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Select
                          value={ticket.status}
                          onValueChange={(value) => updateTicketStatus(ticket.id, value as TicketStatus)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={ticket.assigned_to || 'unassigned'}
                          onValueChange={(value) => assignTicket(ticket.id, value === 'unassigned' ? null : value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Assign to..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {users.map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
