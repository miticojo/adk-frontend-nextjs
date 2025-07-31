# Gemini Code-Gen Agent Instructions

This document provides instructions for the Gemini code-generation agent to follow when working on this project.

## Project Overview

This is a Next.js application using TypeScript, Tailwind CSS, and shadcn/ui. The application is a chat interface that communicates with a backend API.

## Frameworks and Libraries

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** Tailwind CSS with PostCSS
- **UI Components:** shadcn/ui, Radix UI
- **Linting:** ESLint with `eslint-config-next`
- **Package Manager:** npm

## Project Structure

- **`src/app`**: Main application directory.
  - **`src/app/api`**: API routes.
  - **`src/app/page.tsx`**: The main page of the application.
  - **`src/app/layout.tsx`**: The main layout of the application.
  - **`src/app/globals.css`**: Global CSS styles.
- **`src/components`**: Reusable components.
  - **`src/components/ui`**: Components from shadcn/ui.
  - **`src/components/Chat.tsx`**: The main chat component.
- **`src/lib`**: Utility functions and libraries.
  - **`src/lib/api.ts`**: Functions for interacting with the backend API.
  - **`src/lib/utils.ts`**: General utility functions.
- **`public`**: Static assets.
- **`next.config.mjs`**: Next.js configuration.
- **`tailwind.config.mjs`**: Tailwind CSS configuration.
- **`tsconfig.json`**: TypeScript configuration.

## Coding Rules and Conventions

1.  **Follow Existing Style:** Adhere to the existing coding style, formatting, and naming conventions.
2.  **TypeScript:** Use TypeScript for all new code.
3.  **Components:**
    - Create new components in the `src/components` directory.
    - Use shadcn/ui components from `src/components/ui` when possible.
    - For new components, follow the structure of existing components.
4.  **Styling:**
    - Use Tailwind CSS for styling.
    - Use `tailwind-merge` and `clsx` (or a similar utility) to merge classes.
    - Define new colors and themes in `tailwind.config.mjs`.
5.  **State Management:** For now, use React's built-in state management (useState, useReducer, useContext). If more complex state management is needed, discuss with the team.
6.  **API Interaction:**
    - All API calls should be made in `src/lib/api.ts`.
    - Use the `fetch` API for making HTTP requests.
7.  **Linting:** Ensure all code passes the linting checks (`npm run lint`).
8.  **Dependencies:**
    - Do not add new dependencies without approval.
    - Use `npm` to install and manage dependencies.
9.  **Comments:** Add comments only when necessary to explain complex logic.
10. **Git:** Follow standard Git practices. Create a new branch for each feature or bug fix. Write clear and concise commit messages.
