
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from './api';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        await apiRequest('/api/users/forgot-password', 'POST', {
          email: email.trim().toLowerCase(),
        });

        setSuccess(
          'If an account exists with that email, you will receive a password reset link.'
        );
      } else if (isRegistering) {
        await apiRequest('/api/users', 'POST', {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
        });

        setIsRegistering(false);
        setPassword('');
        setSuccess(
          'Account created! Check your email and click the verification link before logging in.'
        );
      } else {
        const data = await apiRequest('/api/auth/login', 'POST', {
          email: email.trim().toLowerCase(),
          password,
        });

        localStorage.setItem('token', data.token);

        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const resetView = () => {
    setIsForgotPassword(false);
    setIsRegistering(false);
    setError('');
    setSuccess('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex flex-col justify-center items-center p-4 font-sans text-stone-800">

      {/* Brand Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#8b3d4b] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
          C
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
          Calendar
        </h1>
      </div>

      {/* Login Card */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 w-full max-w-[420px]">

        <h3 className="text-xl font-semibold mb-2 text-center text-stone-800">
          {isForgotPassword
            ? 'Forgot Password?'
            : isRegistering
              ? 'Create an Account'
              : 'Welcome Back'}
        </h3>

        {isForgotPassword && (
          <p className="text-sm text-stone-500 text-center mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        )}

        {!isForgotPassword && <div className="mb-4" />}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg text-sm font-medium mb-6 text-center bg-red-50 text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="p-3 rounded-lg text-sm font-medium mb-6 text-center bg-green-50 text-green-700 border border-green-200">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Registration Fields */}
          {isRegistering && !isForgotPassword && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-[#8b3d4b]"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-[#8b3d4b]"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-[#8b3d4b]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          {/* Password */}
          {!isForgotPassword && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Password
                </label>

                {!isRegistering && (
                  <button
                    type="button"
                    className="text-xs font-medium text-[#8b3d4b] hover:underline"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError('');
                      setSuccess('');
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>

              <input
                type="password"
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-[#8b3d4b]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-[#8b3d4b] hover:bg-[#72323e] text-white font-medium py-3 px-4 rounded-lg transition-colors mt-6 shadow-sm disabled:opacity-60"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : isForgotPassword
                ? 'Send Reset Link'
                : isRegistering
                  ? 'Create Account'
                  : 'Log In'}
          </button>
        </form>

        {/* Navigation */}
        <div className="text-center mt-6 pt-6 border-t border-stone-100">
          {isForgotPassword ? (
            <button
              type="button"
              className="text-sm font-medium text-stone-500 hover:text-stone-800"
              onClick={resetView}
            >
              Back to Log In
            </button>
          ) : (
            <button
              type="button"
              className="text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setSuccess('');
                setPassword('');
              }}
            >
              {isRegistering
                ? 'Already have an account? Log In'
                : 'Need an account? Register here'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
