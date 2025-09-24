'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Calendar, 
  Tag, 
  Paperclip,
  Send,
  Download,
  Image,
  File
} from 'lucide-react'
import type { Ticket, TicketComment } from '@/types/ticket'

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

interface TicketDetailsModalProps {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TicketDetailsModal({ ticket, open, onOpenChange }: TicketDetailsModalProps) {
  const [comments, setComments] = useState<TicketComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const fetchComments = async () => {
    if (!ticket) return

    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const addComment = async () => {
    if (!ticket || !newComment.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('ticket_comments')
        .insert([{
          ticket_id: ticket.id,
          user_id: user.id,
          comment: newComment.trim()
        }])
        .select()
        .single()

      if (error) throw error

      setComments([...comments, data])
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getFileNameFromUrl = (url: string) => {
    const parts = url.split('/')
    return parts[parts.length - 1]
  }

  const isImage = (url: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    return imageExtensions.some(ext => url.toLowerCase().includes(ext))
  }

  useEffect(() => {
    if (open && ticket) {
      fetchComments()
    }
  }, [open, ticket]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ticket) return null

  const StatusIcon = statusIcons[ticket.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            {ticket.title}
          </DialogTitle>
          <DialogDescription>
            Ticket #{ticket.id.slice(0, 8)} • Created {formatDate(ticket.created_at)}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Status & Priority
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Status:</span>
                    <Badge className={statusColors[ticket.status]}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Priority:</span>
                    <Badge variant="outline" className={priorityColors[ticket.priority]}>
                      {ticket.priority}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Created:</span>
                    <span className="text-sm">{formatDate(ticket.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Updated:</span>
                    <span className="text-sm">{formatDate(ticket.updated_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {ticket.description && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {ticket.tags && ticket.tags.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {ticket.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {ticket.attachments && ticket.attachments.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments ({ticket.attachments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ticket.attachments.map((url, index) => (
                      <div key={index} className="border rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isImage(url) ? (
                            <Image className="h-4 w-4 text-blue-500" />
                          ) : (
                            <File className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="text-sm truncate max-w-[150px]">
                            {getFileNameFromUrl(url)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Add Comment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={addComment} 
                    disabled={loading || !newComment.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {comments.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    No comments yet. Be the first to add one!
                  </CardContent>
                </Card>
              ) : (
                comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {comment.user_id.slice(0, 8)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.comment}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
