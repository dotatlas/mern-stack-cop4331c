
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from './api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!token) {
      setError('Invalid or missing reset link.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await apiRequest('/api/users/reset-password', 'POST', {
        token,
        password,
      });

      setSuccess('Password successfully reset! You can now log in.');

      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center p-4 text-stone-800">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 w-full max-w-[420px]">

        <h2 className="text-xl font-semibold text-center mb-2">
          Reset Password
        </h2>

        <p className="text-sm text-stone-500 text-center mb-6">
          Choose a new password for your account.
        </p>

        {error && (
          <div className="p-3 mb-4 rounded-lg text-sm text-center bg-red-50 text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded-lg text-sm text-center bg-green-50 text-green-700 border border-green-200">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm outline-none focus:border-[#8b3d4b]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm new password"
            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm outline-none focus:border-[#8b3d4b]"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-[#8b3d4b] hover:bg-[#72323e] text-white font-medium py-3 rounded-lg disabled:opacity-60"
          >
            {loading ? 'Please wait...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
