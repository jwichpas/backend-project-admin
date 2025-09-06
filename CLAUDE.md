# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 + TypeScript frontend application built with Vite, TailwindCSS v4, and shadcn/ui components. The project includes Supabase integration for backend services and follows modern Vue.js development patterns with Composition API and `<script setup>` syntax.

## Development Commands

```bash
# Development
pnpm dev                    # Start development server with hot reload
pnpm build                  # Type-check and build for production
pnpm preview                # Preview production build locally

# Code Quality
pnpm lint                   # Lint and fix code with ESLint
pnpm format                 # Format code with Prettier
pnpm type-check             # Run TypeScript type checking

# Testing
pnpm test:unit              # Run unit tests with Vitest

# Supabase (if using local development)
npx supabase start          # Start local Supabase stack
npx supabase stop           # Stop local Supabase stack
npx supabase status         # Check local services status
```

## Architecture Overview

### Frontend Architecture
- **Framework**: Vue 3 with Composition API and `<script setup>` syntax
- **Build Tool**: Vite with TypeScript support and Rolldown bundler
- **Styling**: TailwindCSS v4 with shadcn/ui component system
- **State Management**: Pinia stores for reactive state management
- **Routing**: Vue Router with dynamic layout system
- **Backend**: Supabase integration for database, auth, and real-time features

### Key Architectural Patterns

#### Dynamic Layout System
The app uses a computed layout system in `App.vue` that switches between:
- `AuthLayout` for authentication pages (route meta: `layout: 'auth'`)
- `DefaultLayout` for main application pages (default)

#### Store Structure
Pinia stores are organized by domain:
- `auth.ts` - Authentication state and actions
- `company.ts` - Company/organization data
- `theme.ts` - UI theme and preferences
- `counter.ts` - Example/demo store

#### Path Aliases
Configured in `vite.config.ts` and `components.json`:
- `@/` → `src/`
- `@/components` → `src/components`
- `@/composables` → `src/composables`
- `@/lib` → `src/lib`
- `@/lib/utils` → utility functions

### Project Structure
- `src/components/ui/` - shadcn/ui components (configured via components.json)
- `src/layouts/` - Application layout components
- `src/stores/` - Pinia state management stores  
- `src/views/` - Page components organized by feature
- `src/views/Auth/` - Authentication-related pages
- `supabase/` - Local Supabase configuration and migrations

## Development Configuration

### Code Style
- **Prettier**: Semi-colons disabled, single quotes, 100 char line width
- **ESLint**: Vue 3 + TypeScript configuration with Vitest plugin for tests
- **TypeScript**: Strict mode enabled with Vue SFC support via vue-tsc

### shadcn/ui Configuration
- Style: "new-york" variant
- Base color: neutral
- CSS variables enabled for theming
- Lucide icons as the icon library
- Global styles in `src/styles/globals.css`

### Testing Setup
- **Framework**: Vitest with jsdom environment
- **Test Utils**: Vue Test Utils for component testing
- **Config**: Tests run in `src/**/__tests__/*` pattern

## Supabase Integration

Local development stack configured in `supabase/config.toml`:
- **Database**: PostgreSQL on port 54322
- **API**: REST API on port 54321  
- **Studio**: Management UI on port 54323
- **Auth**: JWT-based authentication with 1-hour expiry
- **Storage**: File uploads up to 50MiB
- **Realtime**: WebSocket connections for live updates

### Key Supabase Features
- User authentication and management
- Database migrations in `supabase/migrations/`
- Seed data in `supabase/seed.sql`
- Edge functions support with Deno runtime
- Email testing via Inbucket (port 54324)

## Environment Setup

The application expects environment variables prefixed with `VITE_` for client-side access. Supabase configuration can use environment variable substitution for secrets (e.g., `env(OPENAI_API_KEY)`).

## Key Dependencies

### Core
- **Vue 3**: Modern reactive framework with Composition API
- **TypeScript**: Full type safety with Vue SFC support
- **Vite**: Fast build tool using Rolldown bundler
- **Pinia**: Intuitive state management for Vue

### UI & Styling  
- **TailwindCSS v4**: Latest utility-first CSS framework
- **shadcn/ui**: Pre-built accessible component library
- **class-variance-authority**: Component variant management
- **Lucide Vue**: Modern icon library

### Development Tools
- **ESLint**: Code linting with Vue and TypeScript support
- **Prettier**: Code formatting
- **Vitest**: Unit testing framework
- **Vue DevTools**: Development debugging tools