'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { DragDropKanban } from '@/components/kanban/drag-drop-kanban'
import { TicketDetailsModal } from '@/components/tickets/ticket-details-modal'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, Lock } from 'lucide-react'
import type { Ticket, UserRole } from '@/types/ticket'

export default function AdminPage() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Check user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (roleError) {
        console.warn('No role found for user, defaulting to user role')
        setUserRole('user')
      } else {
        setUserRole(roleData.role)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check user role')
    } finally {
      setLoading(false)
    }
  }

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setShowDetailsModal(true)
  }

  const handleCloseModal = () => {
    setShowDetailsModal(false)
    setSelectedTicket(null)
  }

  useEffect(() => {
    checkUserRole()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Checking permissions...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto py-8 px-4">
          <Card>
            <CardContent className="py-8 text-center text-red-600">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>{error}</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Check if user has admin or reviewer access
  if (userRole !== 'admin' && userRole !== 'reviewer') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto py-8 px-4">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-8 text-center">
              <Lock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
              <p className="text-gray-600 mb-4">
                You need admin or reviewer permissions to access this page.
              </p>
              <p className="text-sm text-gray-500">
                Current role: <Badge variant="outline">{userRole || 'user'}</Badge>
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                Admin Dashboard
                <Badge variant="secondary" className="text-xs">
                  All Tickets
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {userRole}
                </Badge>
              </h1>
              <p className="text-gray-600">
                🎯 Drag and drop tickets between columns to change their status • Assign tickets to team members
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <DragDropKanban onTicketClick={handleTicketClick} />
        </div>

        <TicketDetailsModal
          ticket={selectedTicket}
          open={showDetailsModal}
          onOpenChange={handleCloseModal}
        />
      </main>
    </div>
  )
}
