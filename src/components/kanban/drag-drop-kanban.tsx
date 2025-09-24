'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
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
import { Clock, AlertCircle, CheckCircle, User, Paperclip, Tag, Eye } from 'lucide-react'
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

interface DragDropKanbanProps {
  onTicketClick?: (ticket: Ticket) => void
}

export function DragDropKanban({ onTicketClick }: DragDropKanbanProps) {
  const [tickets, setTickets] = useState<Record<TicketStatus, Ticket[]>>({
    open: [],
    in_progress: [],
    closed: []
  })
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

      // Organize tickets by status
      const organizedTickets: Record<TicketStatus, Ticket[]> = {
        open: [],
        in_progress: [],
        closed: []
      }

      ticketsData?.forEach(ticket => {
        if (ticket.status in organizedTickets) {
          organizedTickets[ticket.status as TicketStatus].push(ticket)
        }
      })

      setTickets(organizedTickets)

      // Fetch users for assignment
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
      
      if (usersError) {
        console.warn('Could not fetch users:', usersError)
      }

      setUsers(usersData?.users?.map(user => ({ id: user.id, email: user.email || 'Unknown' })) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const updateTicketStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', ticketId)

      if (error) throw error

      // Update local state
      setTickets(prevTickets => {
        const newTickets = { ...prevTickets }
        
        // Find and remove ticket from old status
        let movedTicket: Ticket | null = null
        Object.keys(newTickets).forEach(statusKey => {
          const status = statusKey as TicketStatus
          const ticketIndex = newTickets[status].findIndex(t => t.id === ticketId)
          if (ticketIndex >= 0) {
            movedTicket = { ...newTickets[status][ticketIndex], status: newStatus }
            newTickets[status].splice(ticketIndex, 1)
          }
        })
        
        // Add ticket to new status
        if (movedTicket) {
          newTickets[newStatus].push(movedTicket)
        }
        
        return newTickets
      })
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

      // Update local state
      setTickets(prevTickets => {
        const newTickets = { ...prevTickets }
        Object.keys(newTickets).forEach(statusKey => {
          const status = statusKey as TicketStatus
          const ticketIndex = newTickets[status].findIndex(t => t.id === ticketId)
          if (ticketIndex >= 0) {
            newTickets[status][ticketIndex] = {
              ...newTickets[status][ticketIndex],
              assigned_to: userId
            }
          }
        })
        return newTickets
      })
    } catch (err) {
      console.error('Failed to assign ticket:', err)
    }
  }

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result

    // If no destination, do nothing
    if (!destination) return

    // If dropped in the same position, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const sourceStatus = source.droppableId as TicketStatus
    const destStatus = destination.droppableId as TicketStatus

    // Update ticket status in database
    updateTicketStatus(draggableId, destStatus)
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
            const newTicket = payload.new as Ticket
            setTickets(prev => ({
              ...prev,
              [newTicket.status]: [newTicket, ...prev[newTicket.status]]
            }))
          } else if (payload.eventType === 'UPDATE') {
            const updatedTicket = payload.new as Ticket
            setTickets(prevTickets => {
              const newTickets = { ...prevTickets }
              
              // Remove from old position
              Object.keys(newTickets).forEach(statusKey => {
                const status = statusKey as TicketStatus
                newTickets[status] = newTickets[status].filter(t => t.id !== updatedTicket.id)
              })
              
              // Add to new position
              newTickets[updatedTicket.status].push(updatedTicket)
              
              return newTickets
            })
          } else if (payload.eventType === 'DELETE') {
            const deletedTicket = payload.old as Ticket
            setTickets(prevTickets => {
              const newTickets = { ...prevTickets }
              Object.keys(newTickets).forEach(statusKey => {
                const status = statusKey as TicketStatus
                newTickets[status] = newTickets[status].filter(t => t.id !== deletedTicket.id)
              })
              return newTickets
            })
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
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(statusConfig).map(([status, config]) => {
          const statusTickets = tickets[status as TicketStatus]
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

              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[400px] ${
                      snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg' : ''
                    }`}
                  >
                    {statusTickets.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <StatusIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tickets</p>
                      </div>
                    ) : (
                      statusTickets.map((ticket, index) => (
                        <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`${
                                snapshot.isDragging ? 'rotate-3 scale-105' : ''
                              } transition-transform`}
                            >
                              <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between">
                                    <CardTitle className="text-sm font-medium leading-tight">
                                      {ticket.title}
                                    </CardTitle>
                                    <div className="flex items-center gap-1">
                                      <Badge 
                                        variant="outline" 
                                        className={`${priorityColors[ticket.priority]} text-xs`}
                                      >
                                        {ticket.priority}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onTicketClick?.(ticket)
                                        }}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                    </div>
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
                                      value={ticket.assigned_to || 'unassigned'}
                                      onValueChange={(value) => {
                                        assignTicket(ticket.id, value === 'unassigned' ? null : value)
                                      }}
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
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
