import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store';
import { Layout } from './layout/Layout';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
};
