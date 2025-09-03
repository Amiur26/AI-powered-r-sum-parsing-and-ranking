import api from "../api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../token";
import "../styles/About.css";       // gradient + orbs
import "../styles/AuthForm.css";    // refined styles
import google from "../assets/google.png";
import { useAuth } from "../auth"; // (kept as-is even if unused by this file)

const AuthForm = ({ route, method }) => {
  // --- keep variable/state names EXACTLY the same ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (method === "login") {
        const res = await api.post("/api/token/", { username, password });
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        navigate("/");
        window.location.reload();
      } else {
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }
        await api.post("/api/register/", {
          username,
          email,
          first_name: firstName,
          last_name: lastName,
          password,
        });
        setSuccess("Registration successful. Please login.");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error) {
      console.error(error);
      if (error.response) {
        if (error.response.status === 400) {
          let errorMessage = "Registration failed: ";
          for (const key in error.response.data) {
            if (error.response.data.hasOwnProperty(key)) {
              errorMessage += `${key}: ${error.response.data[key].join(", ")} `;
            }
          }
          setError(errorMessage.trim());
        } else if (error.response.status === 401) {
          setError("Invalid credentials");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else if (error.request) {
        setError("Network error. Please check your internet connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/accounts/google/login/";
  };

  const togglePasswordVisibility = (field) => {
    if (field === "password") setShowPassword(!showPassword);
    else if (field === "confirmPassword") setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="auth-page about">
      {/* background orbs for continuity */}
      <div className="orb one" />
      <div className="orb two" />

      <div className="auth-wrap">
        {loading && (
          <div className="loading-overlay"><div className="spinner" /></div>
        )}

        <form onSubmit={handleSubmit} className="form-container glass">
          <h2 className="form-title">{method === "register" ? "Create your account" : "Welcome back"}</h2>
          <p className="form-subtitle">{method === "register" ? "Join Resumely to streamline your hiring" : "Log in to continue"}</p>

          {error && <div className="alert error-message">{error}</div>}
          {success && <div className="alert success-message">{success}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="jane_doe"
              required
            />
          </div>

          {method === "register" && (
            <>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Password */}
          <div className="form-group password-group">
            <label htmlFor="password">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility("password")}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye-off"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.06 18.06 0 0 1 4.72-5.46"/><path d="M1 1l22 22"/><path d="M14.12 1.88A9.78 9.78 0 0 1 12 4c7 0 11 8 11 8a18.06 18.06 0 0 1-4.72 5.46"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

          {/* Confirm Password (register only) */}
          {method === "register" && (
            <div className="form-group password-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility("confirmPassword")}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye-off"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.06 18.06 0 0 1 4.72-5.46"/><path d="M1 1l22 22"/><path d="M14.12 1.88A9.78 9.78 0 0 1 12 4c7 0 11 8 11 8a18.06 18.06 0 0 1-4.72 5.46"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          )}

          <button type="submit" className="form-button" disabled={loading}>
            {loading ? "Processing..." : method === "register" ? "Register" : "Login"}
          </button>

          <button type="button" className="google-button" onClick={handleGoogleLogin} disabled={loading}>
            <img src={google} alt="Google" className="google-icon" />
            {method === "register" ? "Register with Google" : "Login with Google"}
          </button>

          {method === "login" && (
            <p className="toggle-text">
              Don't have an account? <span className="toggle-link" onClick={() => navigate("/register")}>
                Register
              </span>
            </p>
          )}
          {method === "register" && (
            <p className="toggle-text">
              Already have an account? <span className="toggle-link" onClick={() => navigate("/login")}>
                Login
              </span>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthForm;