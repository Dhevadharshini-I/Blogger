import { useEffect, useState } from 'react';
import { supabase, type Post, type Comment } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatDate, formatRelative } from '@/lib/utils';
import {
  MessageCircle, Send, Trash2, PenSquare,
} from 'lucide-react';

type Props = {
  postId: string;
  onNavigate: (page: string, postId?: string) => void;
};

export default function PostPage({ postId, onNavigate }: Props) {
  const { user, profile } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: postData, error: postErr } = await supabase
        .from('posts')
        .select(`
          id, title, content, excerpt, author_id, created_at, updated_at,
          author:profiles!posts_author_id_fkey(id, username, bio, created_at)
        `)
        .eq('id', postId)
        .maybeSingle();

      if (postErr || !postData) {
        setError('Post not found.');
        setLoading(false);
        return;
      }

      setPost(postData as unknown as Post);

      const { data: commentData } = await supabase
        .from('comments')
        .select(`
          id, post_id, author_id, content, created_at,
          author:profiles!comments_author_id_fkey(id, username, bio, created_at)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      setComments((commentData as unknown as Comment[]) || []);
      setLoading(false);
    }
    fetchData();
  }, [postId]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setSubmitting(true);

    const { data, error: insertErr } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        content: newComment.trim(),
      })
      .select(`
        id, post_id, author_id, content, created_at,
        author:profiles!comments_author_id_fkey(id, username, bio, created_at)
      `)
      .maybeSingle();

    if (!insertErr && data) {
      setComments((prev) => [...prev, data as unknown as Comment]);
      setNewComment('');
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error: delErr } = await supabase.from('comments').delete().eq('id', commentId);
    if (!delErr) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  const handleDeletePost = async () => {
    if (!post || post.author_id !== user?.id) return;
    if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return;

    const { error: delErr } = await supabase.from('posts').delete().eq('id', post.id);
    if (!delErr) {
      onNavigate('home');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-sky-400">Loading…</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-slate-600 mb-4">{error || 'Post not found.'}</p>
        <button
          onClick={() => onNavigate('home')}
          className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-colors"
        >
          Back to blog
        </button>
      </div>
    );
  }

  const isOwner = post.author_id === user?.id;

  return (
    <div>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-20">
        {/* Author meta */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 font-semibold text-sm">
              {(post.author?.username ?? '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">
                {post.author?.username ?? 'Unknown'}
              </p>
              <p className="text-slate-500 text-sm">{formatDate(post.created_at)}</p>
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('editor', post.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-sky-200 rounded-xl hover:bg-sky-50 transition-colors"
              >
                <PenSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={handleDeletePost}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-sky-200 rounded-xl hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Title + content */}
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
          {post.title}
        </h1>

        <div className="max-w-none">
          {post.content.split('\n').map((para, i) => (
            para.trim() ? (
              <p key={i} className="text-slate-700 leading-relaxed text-lg mb-4">
                {para}
              </p>
            ) : null
          ))}
        </div>

        {/* Comments section */}
        <div className="mt-16 pt-8 border-t border-sky-100">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-5 h-5 text-sky-700" />
            <h2 className="text-lg font-semibold text-slate-900">
              Comments ({comments.length})
            </h2>
          </div>

          {/* Comment form */}
          {user ? (
            <form onSubmit={handleComment} className="mb-8">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 font-semibold text-sm shrink-0">
                  {(profile?.username ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts…"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submitting}
                      className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? 'Posting…' : 'Post comment'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8 bg-sky-50 rounded-2xl p-6 text-center">
              <p className="text-slate-600 text-sm mb-3">
                Sign in to join the conversation.
              </p>
              <button
                onClick={() => onNavigate('auth')}
                className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-colors"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Comments list */}
          {comments.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">
              No comments yet. Be the first to share your thoughts.
            </p>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 font-semibold text-sm shrink-0">
                    {(comment.author?.username ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900 text-sm">
                        {comment.author?.username ?? 'Unknown'}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {formatRelative(comment.created_at)}
                      </span>
                      {comment.author_id === user?.id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="ml-auto text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete comment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-700 leading-relaxed text-sm">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
