# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ATPizza is an Angular 18 tennis tournament management application with Firebase backend. The app uses SSR/hydration and is configured as a PWA with service worker support. Despite the project name "tennis-app", it appears to be themed around a "Pizza" tournament system.

## Common Development Commands

### Development Server
- `npm start` or `ng serve` - Start development server at http://localhost:4200
- `npm run dev` - Run concurrent development setup (Angular dev server + mock JSON server)
- `npm run server` - Start JSON mock server with src/mocks/db.json

### Build & Test
- `npm run build` or `ng build` - Build the application
- `npm run watch` - Build with watch mode for development  
- `npm test` or `ng test` - Run unit tests via Karma
- `npm run serve:ssr:tennis-app` - Serve the SSR build

### Angular CLI
- `ng generate component component-name` - Generate new component
- `ng generate service service-name` - Generate new service
- Other generators: `directive|pipe|service|class|guard|interface|enum|module`

## Architecture

### Technology Stack
- **Framework**: Angular 18 with standalone components and SSR
- **Backend**: Firebase (Firestore, Authentication, Storage)  
- **State Management**: RxJS observables with BehaviorSubject patterns
- **Styling**: SCSS with Angular Material theming
- **Validation**: Zod schemas for type-safe data validation
- **Icons**: ng-icons with Heroicons and Material Icons
- **Charts**: Chart.js with ng2-charts
- **PWA**: Angular Service Worker enabled

### Project Structure

#### Core App Structure
- `src/app/app.config.ts` - Main application configuration with Firebase setup
- `src/app/app.routes.ts` - Route definitions with lazy loading for home and scores modules
- `src/environment.ts` & `src/environment.development.ts` - Environment configurations

#### Feature Organization
- **Pages** (`src/app/pages/`) - Route-level components organized by feature:
  - `home/` - Home module with lazy loading
  - `scores/` - Scores module with lazy loading, contains completed/pending subcomponents
  - `calendar/` - Calendar view with selection-bar subcomponent
  - `player/` - Player profile with autocomplete subcomponent
  - `leaderboard/`, `rankings/`, `rules/`, `about/`, `pizza/`, `login/`

- **Components** (`src/app/components/`) - Reusable UI components:
  - `avatar-cropper/` - Image cropping functionality
  - `confirmation-modal/` - Modal dialogs
  - `menu/`, `side-menu/` - Navigation components
  - `toast/` - Notification system
  - `select/`, `country-flag/`, `floating-circle/`, `position-arrow/`

- **Services** (`src/app/services/`) - Business logic and Firebase integration:
  - `auth.service.ts` - Google OAuth authentication
  - `player.service.ts` - Player CRUD operations
  - `match.service.ts`, `round.service.ts` - Tournament data
  - `leaderboard.service.ts`, `rankings.service.ts` - Scoring systems
  - `toast.service.ts`, `avatar.service.ts`

#### Data Layer Architecture

- **Models** (`src/app/models/`) - Organized by domain with comprehensive typing:
  - `player/` - Complete player data architecture:
    - `player.dto.ts` - Zod-inferred types for API contracts
    - `player.schema.ts` - Zod validation schemas
    - `player.repository.ts` - Data access patterns  
    - `player.mapper.ts` - Data transformation utilities
    - `player.view.ts` - UI-specific data shapes
    - `player.enum.ts` - Player-related enumerations
  - `match/`, `round/`, `calendar/`, `leaderboard/`, `rankings/` - Similar domain modeling
  - `select/` - Reusable select component data models

### Firebase Integration

The app uses both AngularFire compatibility and v9+ modular SDK:
- Authentication via Google OAuth with `AngularFireAuth`
- Firestore for data persistence with new modular SDK
- Cloud Storage for file uploads
- Firebase configuration in `environment.ts` (currently empty)

### Key Design Patterns

- **Repository Pattern**: Data access abstracted through repository classes
- **DTO/Schema Pattern**: Zod schemas ensure type safety between client/server
- **Mapper Pattern**: Clean data transformation between layers
- **Observer Pattern**: RxJS for reactive state management
- **Lazy Loading**: Feature modules loaded on demand

### Development Guidelines

- Components follow Angular standalone architecture  
- SCSS styling with component-scoped styles
- TypeScript strict mode enabled
- Zod schemas for all external data validation
- BehaviorSubject pattern for shared state
- Firebase security rules defined in `firestore.rules`

### Mock Data
- JSON Server configuration for local development (`src/mocks/db.json`)
- Allows development without Firebase connection