import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store';
import { setUser } from './store/authSlice';
import { api } from './lib/api';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { Settings } from './pages/Settings';
import { ParticleNetwork } from './components/ui/ParticleNetwork';

export const App = () => {
  const dispatch = useAppDispatch();
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const initAuth = async () => {
      if (token && !isAuthenticated) {
        try {
          const response = await api.get('/auth/me');
          dispatch(setUser(response.data.user));
        } catch (error) {
          // Error is handled by api interceptor (which dispatches logout)
          console.error('Failed to restore session:', error);
        }
      }
    };

    initAuth();
  }, [token, isAuthenticated, dispatch]);

  return (
    <BrowserRouter>
      <div className="relative min-h-screen">
        <ParticleNetwork />
        <div className="relative z-10 h-screen flex flex-col">
          <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
