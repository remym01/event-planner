# RSVP & Event Management Application

## Overview

This is a full-stack event management application designed for hosting dinner parties and gatherings. It allows hosts to create customizable event pages where guests can RSVP, sign up for potluck items, and participate in Secret Santa gift exchanges. The application features a modern, elegant UI with a sage and cream color theme.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state, React Context for local state
- **Styling**: Tailwind CSS v4 with custom theme variables, shadcn/ui component library
- **Build Tool**: Vite with HMR support
- **Form Handling**: React Hook Form with Zod validation

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/`
- Reusable UI components in `client/src/components/ui/` (shadcn/ui)
- Feature components in `client/src/components/` (forms, admin controls)
- Custom hooks in `client/src/hooks/`
- Shared context and utilities in `client/src/lib/`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Style**: RESTful JSON API
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod with drizzle-zod integration

The backend serves both the API and static files:
- API routes defined in `server/routes.ts`
- Database connection in `server/db.ts`
- Storage layer abstraction in `server/storage.ts`
- Development uses Vite middleware, production serves built static files

### Data Storage
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema sync

Database tables:
- `event_config`: Event details, theming, Secret Santa settings
- `items`: Potluck items with assignee tracking
- `rsvps`: Guest responses with plus-one and notes
- `secret_santa_participants`: Gift exchange participants and matches

### Shared Code
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts`: Drizzle table definitions and Zod insert schemas
- Type exports used for end-to-end type safety

## External Dependencies

### Database
- PostgreSQL database (required, connection via DATABASE_URL)
- Drizzle ORM for queries and migrations
- connect-pg-simple for session storage (if sessions are added)

### UI Libraries
- shadcn/ui components (Radix UI primitives)
- Tailwind CSS v4 with tw-animate-css
- Framer Motion for animations
- Lucide React for icons

### Key NPM Packages
- `@tanstack/react-query`: Server state management
- `react-hook-form` + `@hookform/resolvers`: Form handling
- `zod`: Runtime validation
- `drizzle-orm` + `drizzle-zod`: Database ORM and validation
- `wouter`: Client-side routing
- `date-fns`: Date formatting

### Development Tools
- Vite with React plugin
- TypeScript with strict mode
- Replit-specific plugins for dev experience (error overlay, cartographer)