import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
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

function AppLayout({ children }) {
  return (
    <SidebarProvider>
      <div className="flex bg-neutral-50 h-screen w-full overflow-hidden text-neutral-900 font-sans">
        <AppSidebar />
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
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/warga" element={<DataWarga />} />
          <Route path="/pengurus" element={<DataPengurus />} />
          <Route path="/iuran" element={<PembayaranIuran />} />
          <Route path="/kas" element={<ArusKas />} />
          <Route path="/penggajian" element={<Penggajian />} />
          <Route path="/forum" element={<ForumWarga />} />
        </Routes>
      </AppLayout>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;
