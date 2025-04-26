import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

/**
 * Компонент для защиты маршрутов, требующих авторизации
 * 
 * @param children - Дочерние компоненты, которые будут отображены, если пользователь авторизован
 * @param requireAdmin - Требуется ли доступ администратора
 */
const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Показываем загрузку, пока проверяем авторизацию
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  // Если требуется роль администратора, проверяем её
  if (requireAdmin && (!user || !user.isAdmin)) {
    return <Navigate to="/landing" state={{ from: location }} replace />;
  }

  // Если пользователь не авторизован, перенаправляем на лендинговую страницу
  if (!isAuthenticated) {
    return <Navigate to="/landing" state={{ from: location }} replace />;
  }

  // Если пользователь авторизован, отображаем защищенный контент
  return <>{children}</>;
};

export default ProtectedRoute; 