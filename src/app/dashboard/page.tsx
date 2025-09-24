'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { RealTimeTicketList } from '@/components/tickets/real-time-ticket-list'
import { TicketDetailsModal } from '@/components/tickets/ticket-details-modal'
import type { Ticket } from '@/types/ticket'

export default function DashboardPage() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setShowDetailsModal(true)
  }

  const handleCloseModal = () => {
    setShowDetailsModal(false)
    setSelectedTicket(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your support tickets and track their progress in real-time</p>
        </div>

        <div className="space-y-6">
          <RealTimeTicketList onTicketClick={handleTicketClick} />
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
