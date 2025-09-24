'use client'

import { useState } from 'react'
import { UserNav } from '@/components/auth/user-nav'
import { EnhancedTicketForm } from '@/components/tickets/enhanced-ticket-form'
import { Button } from '@/components/ui/button'
import { Ticket, Plus } from 'lucide-react'

export function Header() {
  const [showTicketModal, setShowTicketModal] = useState(false)

  const handleTicketCreated = () => {
    setShowTicketModal(false)
    // Refresh the page to show new ticket
    window.location.reload()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center space-x-2">
          <Ticket className="h-6 w-6" />
          <span className="font-bold text-lg">Ticket Manager</span>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="hidden md:flex items-center space-x-4 text-sm">
            <a href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
              Dashboard
            </a>
            <a href="/admin" className="text-gray-600 hover:text-gray-900 transition-colors">
              Admin
            </a>
          </nav>
          
          <EnhancedTicketForm
            onSuccess={handleTicketCreated}
            open={showTicketModal}
            onOpenChange={setShowTicketModal}
            trigger={
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Ticket
              </Button>
            }
          />
          <UserNav />
        </div>
      </div>
    </header>
  )
}
