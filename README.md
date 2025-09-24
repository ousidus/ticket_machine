# Ticket Manager

A simple Next.js application with Supabase authentication and Shadcn/UI for managing support tickets.

## Features

- 🔐 **Authentication**: Secure login and registration with Supabase Auth
- 🎫 **Advanced Ticket Management**: Create, view, and update tickets with attachments and tags
- 📊 **Real-time Dashboard**: Live updates with automatic refresh when tickets change
- 🖼️ **File Attachments**: Upload images, documents, and files to tickets (up to 10MB each)
- 🏷️ **Tags & Categories**: Organize tickets with custom tags
- 📋 **Kanban Board**: Admin view with drag-and-drop ticket management
- 👥 **User Assignment**: Assign tickets to team members and reviewers
- 💬 **Comments System**: Add comments and track ticket discussions
- 🔍 **Detailed Ticket View**: Full-screen modal with all ticket information
- ⚡ **Real-time Updates**: Instant updates across all users
- 🎨 **Modern UI**: Beautiful interface built with Shadcn/UI and Tailwind CSS
- 📱 **Responsive**: Works great on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Shadcn/UI
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase account and project

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ticket_machine
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set Up the Database

Run the SQL from `database_updates.sql` in your Supabase SQL editor to create all necessary tables and policies:

```bash
# Copy and run the contents of database_updates.sql in your Supabase SQL editor
cat database_updates.sql
```

This will create:
- Enhanced `tickets` table with attachments, tags, and assignment features
- `user_roles` table for role-based access control
- `ticket_comments` table for ticket discussions
- Storage bucket for file attachments
- Proper Row Level Security policies
- Performance indexes

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### For Users:
1. **Create Account**: Visit the signup page to create a new account (no email verification required)
2. **Login**: Use the login page to access your existing account
3. **Create Tickets**: Click "New Ticket" in the navbar to open the fullscreen ticket creation modal
4. **Add Attachments**: Upload images, documents, or files to your tickets
5. **Add Tags**: Organize tickets with custom tags for better categorization
6. **View Tickets**: See all your tickets in real-time on the dashboard
7. **Ticket Details**: Click the eye icon to view full ticket details, add comments, and see attachments
8. **Update Status**: Change ticket status from the dropdown (Open → In Progress → Closed)

### For Admins/Reviewers:
1. **Admin Dashboard**: Access `/admin` for the kanban board view of all tickets
2. **Assign Tickets**: Assign tickets to team members from the kanban board
3. **Manage All Tickets**: View and update tickets from all users
4. **Real-time Updates**: See changes instantly across all connected users
5. **Comments**: Add internal comments and track ticket discussions

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Main dashboard
│   ├── login/             # Login page  
│   ├── signup/            # Account creation page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/             # Login, signup, and user navigation
│   ├── layout/           # Layout components
│   ├── tickets/          # Ticket-related components
│   └── ui/              # Shadcn/UI components
├── lib/                  # Utility libraries
│   ├── supabase.ts      # Supabase client configuration
│   └── utils.ts         # General utilities
├── types/               # TypeScript type definitions
│   └── ticket.ts       # Ticket-related types
└── middleware.ts       # Next.js middleware for auth
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

This app can be deployed to any platform that supports Next.js:

- **Vercel**: Easiest deployment with automatic builds
- **Netlify**: Great alternative with similar features  
- **Railway**: Simple deployment with built-in database options

Make sure to add your environment variables to your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).