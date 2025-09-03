import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../assets/logo.png";
import "../styles/Navbar.css";
import { useAuth } from "../auth";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthorized, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-inner">
        {/* Left: Logo only */}
        <Link to="/" className="navbar-logo-link" aria-label="Home">
          <img src={logo} alt="Resumely logo" className="navbar-logo" />
        </Link>

        {/* Right: About, Dashboard, Auth buttons */}
        <div className="nav-right">
          <ul className="nav-primary">
            <li>
              <Link to="/about" className={`nav-link ${isActive("/about") ? "active" : ""}`}>About</Link>
            </li>
            <li>
              <Link to="/dashboard" className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}>Dashboard</Link>
            </li>
          </ul>

          <ul className="nav-cta">
            {isAuthorized ? (
              <>
                <li className="dashboard-icon">
                  <Link to="/dashboard" aria-label="Open Dashboard">DB</Link>
                </li>
                <li>
                  <button onClick={handleLogout} className="button-link">Logout</button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className="button-link-login nav-link">Log In</Link>
                </li>
                <li>
                  <Link to="/register" className="button-link">Register</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Navbar;