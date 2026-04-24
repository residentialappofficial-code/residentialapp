import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Flex, Box, Spinner, Center, Text, VStack } from '@chakra-ui/react';
import { Toaster } from '@/components/ui/chakra/toaster';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';

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
const Profile = lazy(() => import('@/pages/Profile'));

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
    <Flex height="100vh" width="100vw" overflow="hidden" bg="gray.50">
      <AppSidebar role={profile?.role} />
      <Flex direction="column" flex="1" minWidth="0" height="100vh" overflow="hidden">
        <Header />
        <Box 
          as="main" 
          flex="1" 
          overflowY="auto" 
          p={{ base: 4, md: 10 }}
          css={{
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: '#e5e7eb', borderRadius: '10px' },
          }}
        >
          <Box maxWidth="1600px" marginX="auto" className="slide-up-fade-in">
            {children}
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
}

function PageLoader() {
  return (
    <Center height="60vh" width="full">
      <VStack spacing={4}>
        <Spinner size="lg" color="emerald.500" thickness="3px" />
        <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="widest">
          Loading Content...
        </Text>
      </VStack>
    </Center>
  );
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Center height="100vh" width="100vw" bg="#f9fafb">
        <VStack spacing={6}>
          <Box p={6} borderRadius="24px" bg="emerald.50" boxShadow="0 10px 15px -3px rgba(16, 185, 129, 0.1)">
            <Spinner size="xl" color="emerald.500" thickness="4px" />
          </Box>
          <Text fontWeight="800" color="emerald.600" textTransform="uppercase" letterSpacing="widest" fontSize="xs">
            Preparing your experience...
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
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
          <Route path="/profile" element={<PrivateRoute><AppLayout><Profile /></AppLayout></PrivateRoute>} />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
