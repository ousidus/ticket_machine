# Ticket Manager

A simple Next.js application with Supabase authentication and Shadcn/UI for managing support tickets.

## Features

- 🔐 **Authentication**: Secure login and registration with Supabase Auth
- 🎫 **Ticket Management**: Create, view, and update support tickets
- 📊 **Dashboard**: Clean interface to manage all your tickets
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

Run the following SQL in your Supabase SQL editor to create the tickets table:

```sql
-- Create tickets table
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable Row Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create policy so users can only see their own tickets
CREATE POLICY "Users can view their own tickets" ON tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tickets" ON tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets" ON tickets
  FOR UPDATE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX tickets_user_id_idx ON tickets(user_id);
CREATE INDEX tickets_created_at_idx ON tickets(created_at);
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign Up/Login**: Create a new account or login with existing credentials
2. **Create Tickets**: Click "New Ticket" to create a support ticket
3. **Manage Tickets**: View all your tickets in the dashboard
4. **Update Status**: Change ticket status from the dropdown (Open → In Progress → Closed)
5. **Logout**: Use the user menu in the top-right corner

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Dashboard page
│   ├── login/             # Login page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/             # Authentication components
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