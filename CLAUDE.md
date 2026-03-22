# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GitHub template repository for a modern web application stack combining:
- **Vite** - Build tool and dev server
- **React** - Frontend framework with TypeScript
- **Firebase** - Backend services (Authentication, Firestore, Hosting)
- **Playwright** - End-to-end testing framework

## Common Development Commands

Since this is a template repository, the actual project structure and scripts will depend on how it's initialized. When the project is set up, typical commands will include:

```bash
# Development
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests
npm run test:e2e     # Run Playwright tests
npm run test:ui      # Run Playwright tests with UI

# Linting and Type Checking
npm run lint         # ESLint
npm run typecheck    # TypeScript type checking

# Firebase
npm run deploy       # Deploy to Firebase
```

## Architecture Notes

This template is designed for:

1. **Frontend**: React SPA with TypeScript, built with Vite
2. **Backend**: Firebase services (Auth, Firestore, Functions if needed)
3. **Testing**: Playwright for E2E tests, likely Jest/Vitest for unit tests
4. **Build**: Vite for fast development and optimized production builds

## Firebase Integration

Based on the .gitignore, this project uses Firebase with:
- Firebase Hosting for deployment
- Firebase Functions (optional)
- Firebase Emulators for local development
- Environment-based configuration

Key Firebase files to expect:
- `firebase.json` - Firebase project configuration
- `.firebaserc` - Firebase project aliases
- `src/lib/firebase.ts` - Firebase SDK initialization

## Development Environment

- Use Node.js with npm for package management
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Playwright for comprehensive E2E testing

## Testing Strategy

- Unit tests for components and utilities
- E2E tests with Playwright covering user workflows
- Firebase emulators for testing backend integration locally