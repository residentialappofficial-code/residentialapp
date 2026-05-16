import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';

// Lazy Loaded Pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const DataWarga = lazy(() => import('@/pages/DataWarga'));
const DataPengurus = lazy(() => import('@/pages/DataPengurus'));
const PembayaranIuran = lazy(() => import('@/pages/PembayaranIuran'));
const ArusKas = lazy(() => import('@/pages/ArusKas'));
const Penggajian = lazy(() => import('@/pages/Penggajian'));
const ForumWarga = lazy(() => import('@/pages/ForumWarga'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ActivateAccount = lazy(() => import('@/pages/ActivateAccount'));
const Profile = lazy(() => import('@/pages/Profile'));
const ManageComplexes = lazy(() => import('@/pages/ManageComplexes'));
const MyComplex = lazy(() => import('@/pages/MyComplex'));
const MyBills = lazy(() => import('@/pages/warga/MyBills'));
const IuranConfig = lazy(() => import('@/pages/Billing/IuranConfig'));
const ManageBills = lazy(() => import('@/pages/Billing/ManageBills'));
const VerifyPayments = lazy(() => import('@/pages/Billing/VerifyPayments'));
const Announcements = lazy(() => import('@/pages/Communication/ManageAnnouncements'));
const Complaints = lazy(() => import('@/pages/Communication/Complaints'));
const AssetTracking = lazy(() => import('@/pages/Assets/AssetTracking'));
const AssetBorrow = lazy(() => import('@/pages/warga/AssetBorrow'));
const ResidentFees = lazy(() => import('@/pages/Billing/ResidentFees'));
const ManageBlocks = lazy(() => import('@/pages/ManageBlocks'));
const ManageRoles = lazy(() => import('@/pages/ManageRoles'));
const Changelog = lazy(() => import('@/pages/Changelog'));

// Guard: redirect ke /login kalau belum login & cek role
function PrivateRoute({ children, allowedRoles = [] }) {
  const { user, profile, loading, signOut } = useAuth();
  
  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  if (!profile && !loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-sm w-full">
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Profil Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
            Akun Anda terdaftar namun data profil Anda tidak ditemukan di sistem.
          </p>
          <button 
            onClick={signOut}
            className="w-full bg-slate-950 text-white border border-slate-900 px-5 py-2.5 rounded-2xl font-bold hover:bg-black transition-all"
          >
            Keluar & Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (allowedRoles.length > 0 && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto pt-20 md:pt-24 p-6">
          <div className="w-full max-w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-5 h-5 border-3 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-bold text-slate-400">Loading...</p>
    </div>
  );
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 border-4 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-slate-950 text-xs">Preparing Experience...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/activate" element={<ActivateAccount />} />

          <Route path="/dashboard" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
          <Route path="/warga" element={<PrivateRoute allowedRoles={['admin', 'super_admin']}><AppLayout><DataWarga /></AppLayout></PrivateRoute>} />
          <Route path="/blok" element={<PrivateRoute allowedRoles={['admin', 'super_admin']}><AppLayout><ManageBlocks /></AppLayout></PrivateRoute>} />
          <Route path="/pengurus" element={<PrivateRoute allowedRoles={['admin', 'super_admin']}><AppLayout><DataPengurus /></AppLayout></PrivateRoute>} />
          <Route path="/iuran" element={<PrivateRoute allowedRoles={['admin', 'super_admin']}><AppLayout><PembayaranIuran /></AppLayout></PrivateRoute>} />
          <Route path="/kas" element={<PrivateRoute allowedRoles={['admin', 'super_admin', 'warga']}><AppLayout><ArusKas /></AppLayout></PrivateRoute>} />
          <Route path="/community-billing" element={<PrivateRoute allowedRoles={['admin', 'super_admin', 'warga']}><AppLayout><ResidentFees /></AppLayout></PrivateRoute>} />
          <Route path="/penggajian" element={<PrivateRoute allowedRoles={['admin', 'super_admin']}><AppLayout><Penggajian /></AppLayout></PrivateRoute>} />
          <Route path="/forum" element={<PrivateRoute><AppLayout><ForumWarga /></AppLayout></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><AppLayout><Profile /></AppLayout></PrivateRoute>} />
          <Route path="/manage-complexes" element={<PrivateRoute allowedRoles={['super_admin']}><AppLayout><ManageComplexes /></AppLayout></PrivateRoute>} />
          <Route path="/my-complex" element={<PrivateRoute allowedRoles={['admin']}><AppLayout><MyComplex /></AppLayout></PrivateRoute>} />
          <Route path="/my-bills" element={<PrivateRoute allowedRoles={['warga', 'admin', 'super_admin']}><AppLayout><MyBills /></AppLayout></PrivateRoute>} />
          <Route path="/iuran-config" element={<PrivateRoute allowedRoles={['admin']}><AppLayout><IuranConfig /></AppLayout></PrivateRoute>} />
          <Route path="/manage-bills" element={<PrivateRoute allowedRoles={['admin']}><AppLayout><ManageBills /></AppLayout></PrivateRoute>} />
          <Route path="/verify-payments" element={<PrivateRoute allowedRoles={['admin']}><AppLayout><VerifyPayments /></AppLayout></PrivateRoute>} />
          <Route path="/announcements" element={<PrivateRoute><AppLayout><Announcements /></AppLayout></PrivateRoute>} />
          <Route path="/complaints" element={<PrivateRoute><AppLayout><Complaints /></AppLayout></PrivateRoute>} />
          <Route path="/assets" element={<PrivateRoute><AppLayout><AssetTracking /></AppLayout></PrivateRoute>} />
          <Route path="/borrow-assets" element={<PrivateRoute allowedRoles={['warga', 'admin', 'super_admin']}><AppLayout><AssetBorrow /></AppLayout></PrivateRoute>} />
          <Route path="/roles" element={<PrivateRoute allowedRoles={['admin', 'super_admin']}><AppLayout><ManageRoles /></AppLayout></PrivateRoute>} />
          <Route path="/changelog" element={<PrivateRoute><AppLayout><Changelog /></AppLayout></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
