import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <header className="header">
      <nav>
        <ul className="nav-links">
          <li><Link to="/">Главная</Link></li>
          <li><Link to="/albums">Альбомы</Link></li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar; 