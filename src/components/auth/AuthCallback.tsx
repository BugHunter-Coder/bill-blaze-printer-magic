import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace('#', '?'));
    if (params.get('type') === 'recovery') {
      setIsRecovery(true);
    } else {
      // Normal magic link/invite flow
      const handleCallback = async () => {
        await supabase.auth.exchangeCodeForSession(window.location.href);
        navigate('/dashboard');
      };
      handleCallback();
    }
  }, [navigate]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate('/dashboard');
    }
  };

  if (isRecovery) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <form onSubmit={handlePasswordReset} className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4">
          <h2 className="text-2xl font-bold mb-2">Set New Password</h2>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            placeholder="Enter new password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded"
            disabled={loading || newPassword.length < 6}
          >
            {loading ? 'Updating...' : 'Set Password & Sign In'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
        <p className="text-lg font-medium">Signing you in...</p>
      </div>
    </div>
  );
} 