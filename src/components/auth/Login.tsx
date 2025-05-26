import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService, { type LoginData } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginData>({
    identifier: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  // Get the redirect path from location state or default to home
  const from = location.state?.from || '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Form validation
    if (!formData.identifier || !formData.password) {
      setError('All fields are required');
      return;
    }
    
    try {
      setLoading(true);
      const response = await authService.login(formData);
      
      // Update auth context with the user data
      if (response && response.user) {
        // Ensure the user data matches our User type
        const userData = response.user;
        if (userData && userData.id && userData.email) {
          login(userData);
          
          // Redirect to the original page or home
          navigate(from);
        } else {
          throw new Error('Invalid user data received from server');
        }
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err.message || 
        'Invalid credentials or server error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src="favicon.svg" alt="Nomadic logo" className="auth-logo" />
          <h2>Welcome back</h2>
          <p>Log in to your Nomadic account</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="identifier">Email or Username</label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="Enter your email or username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
          </div>
          
          <div className="form-options">
            <Link to="/forgot-password" className="forgot-password">Forgot password?</Link>
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
