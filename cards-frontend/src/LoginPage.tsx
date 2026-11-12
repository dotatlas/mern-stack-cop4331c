import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from './api';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        const data = await apiRequest('/api/users', 'POST', {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          email: email.trim().toLowerCase(),
          login: login.trim(),
          password,
        });

        if (data?.token) {
          localStorage.setItem('token', data.token);
          if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
          navigate('/dashboard');
        } else {
          setIsRegistering(false);
          setError('Registration successful! Please log in with your email.');
        }
      } else {
        const data = await apiRequest('/api/auth/login', 'POST', {
          email: email.trim().toLowerCase(),
          password,
        });

        localStorage.setItem('token', data.token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(
        isRegistering
          ? (err.message || 'Registration failed')
          : 'Invalid login or password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex flex-col justify-center items-center p-4 font-sans text-stone-800">
      
      {/* Brand Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#8b3d4b] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
          C
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Calendar</h1>
      </div>

      {/* Login Card */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 w-full max-w-[420px]">
        <h3 className="text-xl font-semibold mb-6 text-center text-stone-800">
          {isRegistering ? 'Create an Account' : 'Welcome Back'}
        </h3>

        {error && (
          <div className={`p-3 rounded-lg text-sm font-medium mb-6 text-center ${error.includes('successful') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">First Name</label>
                  <input
                    type="text"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:border-[#8b3d4b] focus:ring-1 focus:ring-[#8b3d4b] outline-none transition-all"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input
                    type="text"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:border-[#8b3d4b] focus:ring-1 focus:ring-[#8b3d4b] outline-none transition-all"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:border-[#8b3d4b] focus:ring-1 focus:ring-[#8b3d4b] outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Username</label>
                <input
                  type="text"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:border-[#8b3d4b] focus:ring-1 focus:ring-[#8b3d4b] outline-none transition-all"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:border-[#8b3d4b] focus:ring-1 focus:ring-[#8b3d4b] outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:border-[#8b3d4b] focus:ring-1 focus:ring-[#8b3d4b] outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-[#8b3d4b] hover:bg-[#72323e] text-white font-medium py-3 px-4 rounded-lg transition-colors mt-6 shadow-sm"
            disabled={loading}
          >
            {loading ? 'Please wait...' : isRegistering ? 'Register' : 'Log In'}
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-stone-100">
          <button
            type="button"
            className="text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
          >
            {isRegistering ? 'Already have an account? Log In' : 'Need an account? Register here'}
          </button>
        </div>
      </div>
    </div>
  );
}