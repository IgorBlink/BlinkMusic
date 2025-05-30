import { Link, useLocation } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { AiOutlineHome } from 'react-icons/ai';
import { FaHeart } from 'react-icons/fa';
import { FiLogIn } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import UserProfileMenu from './UserProfileMenu';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const { pathname } = location;
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="sidebar">
      <div className="logo-container">
        <Link to="/" className="logo-link">
          <div className="logo">
            <div className="logo-icon"></div>
            <span className="logo-text">BlinkMusic</span>
          </div>
        </Link>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li>
            <Link to="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
              <AiOutlineHome className="nav-icon" />
              <span>Главная</span>
            </Link>
          </li>
          <li>
            <Link to="/search" className={`nav-item ${pathname === '/search' ? 'active' : ''}`}>
              <FiSearch className="nav-icon" />
              <span>Поиск</span>
            </Link>
          </li>
          <li>
            <Link to="/favorites" className={`nav-item ${pathname === '/favorites' ? 'active' : ''}`}>
              <FaHeart className="nav-icon" />
              <span>Избранное</span>
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        {isAuthenticated ? (
          <UserProfileMenu />
        ) : (
          <Link to="/login" className="login-button">
            <FiLogIn className="login-icon" />
            <span>Войти</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 