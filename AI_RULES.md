# AI Rules for Advanx Academy

## Tech Stack

- **Frontend Framework**: React with TypeScript for type-safe component development
- **Routing**: React Router for client-side navigation and route management
- **Styling**: Tailwind CSS for utility-first CSS styling with custom design tokens
- **UI Components**: shadcn/ui library for pre-built, accessible, and customizable components
- **Icons**: Lucide React for consistent and scalable iconography
- **Animations**: Framer Motion for smooth, performant animations and transitions
- **Forms**: React Hook Form with Zod for form handling and validation
- **Notifications**: Sonner for toast notifications and user feedback
- **Drag and Drop**: @dnd-kit for sortable lists and interactive drag-and-drop functionality
- **Video Playback**: React YouTube for embedding and controlling YouTube videos
- **Backend/Database**: Supabase for authentication, database operations, and server-side functions
- **State Management**: React Context for global state (e.g., authentication)

## Library Usage Rules

- **Always use shadcn/ui components** for any UI elements like buttons, inputs, modals, etc. Do not create custom components unless they are not available in shadcn/ui.
- **Use Tailwind CSS exclusively** for all styling. Avoid inline styles or other CSS frameworks.
- **Use Lucide React icons** for all icons in the application. Do not import icons from other libraries.
- **Use Framer Motion** for any animations or transitions. Keep animations subtle and performance-focused.
- **Use Sonner** for all toast notifications. Avoid other toast libraries.
- **Use React Hook Form with Zod** for all forms. Ensure proper validation and error handling.
- **Use @dnd-kit** for any drag-and-drop or sortable functionality.
- **Use React YouTube** for video embedding. Customize the VideoPlayer component as needed.
- **Use Supabase** for all database interactions, authentication, and RPC functions. Do not use other backend services.
- **Use React Context** for global state management like authentication. Avoid external state libraries unless necessary.
- **Keep components small and focused**: Aim for components under 100 lines. Refactor large components into smaller ones.
- **Prioritize accessibility**: Ensure all components are keyboard navigable and screen-reader friendly.
- **Follow TypeScript best practices**: Use strict typing, avoid `any`, and leverage the Database types from Supabase.
- **Responsive design**: Always make components responsive using Tailwind's responsive utilities.
- **Error handling**: Use try/catch in async functions, but let errors bubble up to the UI for user feedback via toasts.
- **No over-engineering**: Keep code simple and elegant. Only add complexity when absolutely necessary.