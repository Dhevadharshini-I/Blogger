import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Save } from 'lucide-react';

type Props = {
  postId?: string;
  onNavigate: (page: string, postId?: string) => void;
};

export default function EditorPage({ postId, onNavigate }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!postId);

  const isEditing = !!postId;

  useEffect(() => {
    if (!postId) return;
    async function fetchPost() {
      const { data, error: err } = await supabase
        .from('posts')
        .select('id, title, content, excerpt, author_id')
        .eq('id', postId)
        .maybeSingle();

      if (err || !data) {
        setError('Post not found.');
        setLoading(false);
        return;
      }

      if (data.author_id !== user?.id) {
        setError('You can only edit your own posts.');
        setLoading(false);
        return;
      }

      setTitle(data.title || '');
      setContent(data.content || '');
      setExcerpt(data.excerpt || '');
      setLoading(false);
    }
    fetchPost();
  }, [postId, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    setError(null);

    const payload = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim() || null,
    };

    try {
      if (isEditing && postId) {
        const { data, error: updateErr } = await supabase
          .from('posts')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', postId)
          .select('id')
          .maybeSingle();

        if (updateErr) {
          setError(updateErr.message);
          setSaving(false);
          return;
        }
        if (data) {
          onNavigate('post', data.id);
        }
      } else {
        const { data, error: insertErr } = await supabase
          .from('posts')
          .insert(payload)
          .select('id')
          .maybeSingle();

        if (insertErr) {
          setError(insertErr.message);
          setSaving(false);
          return;
        }
        if (data) {
          onNavigate('post', data.id);
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-slate-600 mb-4">You need to be signed in to write posts.</p>
        <button
          onClick={() => onNavigate('auth')}
          className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="animate-pulse text-sky-400">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-slate-600 mb-4">{error}</p>
        <button
          onClick={() => onNavigate('home')}
          className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-colors"
        >
          Back to blog
        </button>
      </div>
    );
  }

  return (
    <div>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-20">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          {isEditing ? 'Edit post' : 'Write a new post'}
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          {isEditing ? 'Update your post below.' : 'Share your thoughts with the community.'}
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your post a title…"
              required
              maxLength={200}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Excerpt <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A short summary shown in the post list…"
              maxLength={300}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post here…"
              required
              rows={16}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all resize-y leading-relaxed"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              {content.trim() ? `${content.trim().split(/\s+/).length} words` : '0 words'}
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate(postId ? 'post' : 'home', postId)}
              className="px-5 py-2.5 text-slate-700 text-sm font-medium rounded-xl border border-slate-300 hover:bg-sky-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim() || !content.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : isEditing ? 'Update post' : 'Publish post'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
