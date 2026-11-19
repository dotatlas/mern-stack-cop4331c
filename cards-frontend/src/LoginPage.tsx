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
        await apiRequest('/api/auth/forgot-password', 'POST', {
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
    <div className="min-h-screen bg-[#F4EDE4] text-[#2C211B] flex flex-col justify-center items-center p-6 font-sans antialiased selection:bg-[#355E48]/20 selection:text-[#2C211B]">
      {/* Brand Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-[#4E2E1E] text-[#FAF5EE] rounded-2xl flex items-center justify-center font-serif font-black text-2xl shadow-sm ring-4 ring-[#4E2E1E]/10">
          C
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-serif font-black tracking-tight text-[#2C211B] leading-none">
              Calendar
            </h1>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#355E48]"></span>
          </div>
          <span className="text-xs font-sans font-bold uppercase tracking-widest text-[#7B6A5E] mt-1 block">
            Workspace & Schedule
          </span>
        </div>
      </div>

      {/* Auth Card */}
      <div className="bg-[#FAF5EE] p-8 rounded-3xl shadow-md border-2 border-[#D5C6B3] w-full max-w-[440px]">
        <h3 className="text-2xl font-serif font-black mb-2 text-center text-[#2C211B]">
          {isForgotPassword
            ? 'Forgot Password?'
            : isRegistering
              ? 'Create an Account'
              : 'Welcome Back'}
        </h3>

        {isForgotPassword ? (
          <p className="text-sm font-medium text-[#7B6A5E] text-center mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        ) : (
          <p className="text-xs font-sans font-bold uppercase tracking-wider text-[#7B6A5E] text-center mb-6">
            {isRegistering ? 'Set up your calendar workspace' : 'Sign in to your schedule'}
          </p>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-2xl text-sm font-semibold mb-6 text-center bg-[#A85368]/12 text-[#632736] border-2 border-[#A85368]/30">
            {error}
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="p-3.5 rounded-2xl text-sm font-semibold mb-6 text-center bg-[#355E48]/12 text-[#1E3E2D] border-2 border-[#355E48]/30">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Registration Fields */}
          {isRegistering && !isForgotPassword && (
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-[#6C5B4F] mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  className="w-full bg-[#FFFFFF] border-2 border-[#CFBEAA] rounded-2xl p-3 text-sm font-semibold text-[#2C211B] placeholder-[#AFA193] focus:border-[#4E2E1E] focus:ring-0 outline-none transition"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-[#6C5B4F] mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  className="w-full bg-[#FFFFFF] border-2 border-[#CFBEAA] rounded-2xl p-3 text-sm font-semibold text-[#2C211B] placeholder-[#AFA193] focus:border-[#4E2E1E] focus:ring-0 outline-none transition"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-sans font-bold uppercase tracking-wider text-[#6C5B4F] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              className="w-full bg-[#FFFFFF] border-2 border-[#CFBEAA] rounded-2xl p-3 text-sm font-semibold text-[#2C211B] placeholder-[#AFA193] focus:border-[#4E2E1E] focus:ring-0 outline-none transition"
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
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-[#6C5B4F]">
                  Password
                </label>

                {!isRegistering && (
                  <button
                    type="button"
                    className="text-xs font-sans font-bold text-[#4E2E1E] hover:underline cursor-pointer"
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
                className="w-full bg-[#FFFFFF] border-2 border-[#CFBEAA] rounded-2xl p-3 text-sm font-semibold text-[#2C211B] placeholder-[#AFA193] focus:border-[#4E2E1E] focus:ring-0 outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#4E2E1E] hover:bg-[#3D2214] text-[#FAF5EE] font-sans font-bold py-3.5 px-4 rounded-2xl text-sm uppercase tracking-wider shadow-sm transition active:scale-[0.98] mt-6 cursor-pointer disabled:opacity-60"
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

        {/* Bottom Navigation */}
        <div className="text-center mt-6 pt-6 border-t-2 border-[#DFD3C3]">
          {isForgotPassword ? (
            <button
              type="button"
              className="text-xs font-sans font-bold uppercase tracking-wider text-[#6C5B4F] hover:text-[#2C211B] transition cursor-pointer"
              onClick={resetView}
            >
              Back to Log In
            </button>
          ) : (
            <button
              type="button"
              className="text-xs font-sans font-bold uppercase tracking-wider text-[#6C5B4F] hover:text-[#2C211B] transition cursor-pointer"
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