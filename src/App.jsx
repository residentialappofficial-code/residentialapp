import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { Loader2 } from "lucide-react";
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';

// Pages
import Dashboard from '@/pages/Dashboard';
import DataWarga from '@/pages/DataWarga';
import DataPengurus from '@/pages/DataPengurus';
import PembayaranIuran from '@/pages/PembayaranIuran';
import ArusKas from '@/pages/ArusKas';
import Penggajian from '@/pages/Penggajian';
import ForumWarga from '@/pages/ForumWarga';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

import { useAuth } from '@/contexts/AuthContext';

// Guard: redirect ke /login kalau belum login
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Guard: redirect ke /dashboard kalau sudah login
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppLayout({ children }) {
  const { profile } = useAuth();
  return (
    <SidebarProvider>
      <div className="flex bg-neutral-50 h-screen w-full overflow-hidden text-neutral-900 font-sans">
        <AppSidebar role={profile?.role} />
        <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-neutral-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Redirect root ke dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
        <Route path="/warga" element={<PrivateRoute><AppLayout><DataWarga /></AppLayout></PrivateRoute>} />
        <Route path="/pengurus" element={<PrivateRoute><AppLayout><DataPengurus /></AppLayout></PrivateRoute>} />
        <Route path="/iuran" element={<PrivateRoute><AppLayout><PembayaranIuran /></AppLayout></PrivateRoute>} />
        <Route path="/kas" element={<PrivateRoute><AppLayout><ArusKas /></AppLayout></PrivateRoute>} />
        <Route path="/penggajian" element={<PrivateRoute><AppLayout><Penggajian /></AppLayout></PrivateRoute>} />
        <Route path="/forum" element={<PrivateRoute><AppLayout><ForumWarga /></AppLayout></PrivateRoute>} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;
