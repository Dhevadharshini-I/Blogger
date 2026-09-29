import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';

type Props = {
  onNavigate: (page: string, postId?: string) => void;
  onSignOut: () => void;
};

export default function SettingsPage({ onNavigate, onSignOut }: Props) {
  const { profile } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setError('No active session. Please sign in again.');
        setDeleting(false);
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Request failed (${res.status})`);
        setDeleting(false);
        return;
      }

      await supabase.auth.signOut();
      onSignOut();
    } catch {
      setError('Something went wrong. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-12 pb-20">
      <button
        onClick={() => onNavigate('home')}
        className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-800 transition-colors text-sm font-medium mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to blog
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Settings</h1>
      <p className="text-slate-500 text-sm mb-8">
        Manage your account and personal data.
      </p>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Profile</h2>
        <p className="text-slate-500 text-sm mb-4">Your public identity on Inkwell.</p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 font-semibold">
            {(profile?.username ?? '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{profile?.username}</p>
            <p className="text-slate-400 text-sm">Member</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-red-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Delete Account</h2>
            <p className="text-slate-500 text-sm mt-1">
              Permanently delete your account, all your posts, and all your comments.
              This action cannot be undone.
            </p>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-red-600 border border-red-300 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete my account
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700 font-medium mb-2">
                To confirm, type "delete my account" below:
              </p>
              <input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="delete my account"
                className="w-full px-4 py-2.5 rounded-xl border border-red-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setConfirming(false); setDeleteText(''); setError(null); }}
                className="px-4 py-2.5 text-slate-700 text-sm font-medium rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteText !== 'delete my account' || deleting}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Deleting…' : 'Permanently delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
