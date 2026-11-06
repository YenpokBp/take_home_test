import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

/** Hanya bisa diakses jika sudah login */
function PrivateRoute({ children }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return <div className="center-screen"><p>Memuat...</p></div>;
  return user ? children : <Navigate to="/login" replace />;
}

/** Hanya bisa diakses jika belum login */
function PublicRoute({ children }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return <div className="center-screen"><p>Memuat...</p></div>;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      {/* Redirect semua route lain ke dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
