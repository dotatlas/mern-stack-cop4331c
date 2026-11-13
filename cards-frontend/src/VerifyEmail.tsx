
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiRequest } from './api';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [message, setMessage] = useState('Verifying your email...');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        await apiRequest(`/api/auth/verify/${token}`);
        setMessage('Your email has been verified! You can now log in.');
        setSuccess(true);
      } catch (err: any) {
        setMessage(err.message || 'This verification link is invalid or expired.');
      }
    };

    if (token) verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 w-full max-w-[420px] text-center">
        <h1 className="text-2xl font-semibold text-stone-900 mb-4">
          Calendar
        </h1>

        <p className="text-sm text-stone-600 mb-6">{message}</p>

        {success && (
          <Link
            to="/"
            className="inline-block bg-[#8b3d4b] hover:bg-[#72323e] text-white font-medium py-3 px-6 rounded-lg"
          >
            Go to Login
          </Link>
        )}

        {!success && message !== 'Verifying your email...' && (
          <Link to="/" className="text-sm text-[#8b3d4b]">
            Return to Login
          </Link>
        )}
      </div>
    </div>
  );
}
