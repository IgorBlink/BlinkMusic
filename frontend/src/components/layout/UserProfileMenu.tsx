import { useState, useRef, useEffect } from 'react';
import { FaUserCircle, FaSignOutAlt, FaCog, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './UserProfileMenu.css';

const UserProfileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Закрытие меню при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Ошибка при выходе из системы:', error);
    }
  };

  const handleProfile = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  const handleSettings = () => {
    navigate('/settings');
    setIsOpen(false);
  };

  return (
    <div className="user-profile-menu" ref={menuRef}>
      <button className="profile-button" onClick={toggleMenu}>
        <FaUserCircle className="profile-icon" />
        <span className="username">{user?.username || 'Пользователь'}</span>
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          <div className="dropdown-header">
            <FaUserCircle className="dropdown-profile-icon" />
            <div className="user-info">
              <span className="dropdown-username">{user?.username || 'Пользователь'}</span>
              <span className="dropdown-email">{user?.email || 'email@example.com'}</span>
            </div>
          </div>
          
          <div className="dropdown-divider"></div>
          
          <ul className="dropdown-menu">
            <li>
              <button onClick={handleProfile}>
                <FaUser className="menu-icon" />
                <span>Мой профиль</span>
              </button>
            </li>
            <li>
              <button onClick={handleSettings}>
                <FaCog className="menu-icon" />
                <span>Настройки</span>
              </button>
            </li>
            <li>
              <button onClick={handleLogout} className="logout-button">
                <FaSignOutAlt className="menu-icon" />
                <span>Выйти</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserProfileMenu; 