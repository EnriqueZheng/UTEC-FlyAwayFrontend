import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <NavLink to="/">Fly Away ✈️</NavLink>
      </div>
      <div className="navbar-links">
        <NavLink to="/search">Buscar vuelos</NavLink>
        {isAuthenticated && <NavLink to="/my-bookings">Mis reservas</NavLink>}
        {!isAuthenticated && <NavLink to="/login">Iniciar sesión</NavLink>}
        {!isAuthenticated && <NavLink to="/register">Registrarse</NavLink>}
        {isAuthenticated && (
          <>
            <span className="navbar-user">
              Hola, {user ? user.username : '...'}
            </span>
            <button className="link-button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
