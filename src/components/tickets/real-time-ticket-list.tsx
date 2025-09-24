'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Ticket as TicketIcon, Clock, CheckCircle, AlertCircle, Eye, Paperclip } from 'lucide-react'
import type { Ticket, TicketStatus } from '@/types/ticket'

const statusIcons = {
  open: Clock,
  in_progress: AlertCircle,
  closed: CheckCircle,
}

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-green-100 text-green-800',
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800',
}

interface RealTimeTicketListProps {
  onTicketClick?: (ticket: Ticket) => void
}

export function RealTimeTicketList({ onTicketClick }: RealTimeTicketListProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const fetchTickets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setTickets(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets')
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

      if (error) {
        throw error
      }

      // Update local state
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status, updated_at: new Date().toISOString() }
          : ticket
      ))
    } catch (err) {
      console.error('Failed to update ticket status:', err)
    }
  }

  useEffect(() => {
    fetchTickets()

    // Set up real-time subscription
    const subscription = supabase
      .channel('tickets')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tickets' 
        }, 
        (payload) => {
          console.log('Real-time update:', payload)
          
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <TicketIcon className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading tickets...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
            <Button onClick={fetchTickets} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TicketIcon className="h-5 w-5" />
          Your Tickets ({tickets.length})
        </CardTitle>
        <CardDescription>
          Manage and track your support tickets (updates in real-time)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="text-center py-8">
            <TicketIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-2">No tickets yet</p>
            <p className="text-sm text-gray-400">Create your first ticket using the "New Ticket" button</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => {
                  const StatusIcon = statusIcons[ticket.status]
                  return (
                    <TableRow key={ticket.id} className="group hover:bg-gray-50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium flex items-center gap-2">
                            {ticket.title}
                            {ticket.attachments && ticket.attachments.length > 0 && (
                              <Paperclip className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                          {ticket.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {ticket.description}
                            </div>
                          )}
                          {ticket.tags && ticket.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {ticket.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {ticket.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{ticket.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[ticket.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={priorityColors[ticket.priority]}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(ticket.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onTicketClick?.(ticket)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Select
                            value={ticket.status}
                            onValueChange={(value) => updateTicketStatus(ticket.id, value as TicketStatus)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
