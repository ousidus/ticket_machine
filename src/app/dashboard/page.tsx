'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { TicketForm } from '@/components/tickets/ticket-form'
import { TicketList } from '@/components/tickets/ticket-list'
import { Button } from '@/components/ui/button'
import { Plus, List } from 'lucide-react'

export default function DashboardPage() {
  const [showForm, setShowForm] = useState(false)

  const handleTicketCreated = () => {
    setShowForm(false)
    // The TicketList component will refresh automatically
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your support tickets and track their progress</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <TicketList />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowForm(!showForm)}
                className="flex-1"
                variant={showForm ? "outline" : "default"}
              >
                {showForm ? (
                  <>
                    <List className="h-4 w-4 mr-2" />
                    View Tickets
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    New Ticket
                  </>
                )}
              </Button>
            </div>
            
            {showForm && (
              <TicketForm onSuccess={handleTicketCreated} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
