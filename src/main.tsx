import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from "next-themes"
import { AdminProvider } from "@/contexts/AdminContext"
import { GoogleAuthProvider } from "@/contexts/GoogleAuthContext"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/toaster"

const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <GoogleAuthProvider>
      <AdminProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <App />
          <Toaster />
        </ThemeProvider>
      </AdminProvider>
    </GoogleAuthProvider>
  </QueryClientProvider>
);
