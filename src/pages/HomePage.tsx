import { useEffect, useState } from 'react';
import { supabase, type Post } from '@/lib/supabase';
import { formatDate, readingTime } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, PenSquare, MessageCircle, Clock, ArrowRight } from 'lucide-react';

type Props = {
  onNavigate: (page: string, postId?: string) => void;
};

export default function HomePage({ onNavigate }: Props) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, title, content, excerpt, author_id, created_at, updated_at,
          author:profiles!posts_author_id_fkey(id, username, bio, created_at)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        const postIds = (data as unknown as Post[]).map((p) => p.id);
        if (postIds.length > 0) {
          const { data: counts } = await supabase
            .from('comments')
            .select('post_id')
            .in('post_id', postIds);

          const countMap: Record<string, number> = {};
          (counts || []).forEach((c: { post_id: string }) => {
            countMap[c.post_id] = (countMap[c.post_id] || 0) + 1;
          });

          const postsWithCounts = (data as unknown as Post[]).map((p) => ({
            ...p,
            comment_count: countMap[p.id] || 0,
          }));
          setPosts(postsWithCounts);
        } else {
          setPosts(data as unknown as Post[]);
        }
      }
      setLoading(false);
    }
    fetchPosts();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
          Stories, ideas, and conversations
        </h1>
        <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
          A place to share your thoughts, read what others are writing about, and join the discussion.
        </p>
      </section>

      {/* Posts */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Latest posts</h2>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-sky-100 p-6 animate-pulse">
                <div className="h-4 w-32 bg-sky-100 rounded mb-4" />
                <div className="h-6 w-3/4 bg-sky-100 rounded mb-3" />
                <div className="h-4 w-full bg-sky-50 rounded mb-2" />
                <div className="h-4 w-2/3 bg-sky-50 rounded" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-sky-100">
            <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-sky-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No posts yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Be the first to share something with the community.
            </p>
            {user ? (
              <button
                onClick={() => onNavigate('editor')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-colors"
              >
                <PenSquare className="w-4 h-4" />
                Write the first post
              </button>
            ) : (
              <button
                onClick={() => onNavigate('auth')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-colors"
              >
                Sign in to start writing
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.id}
                onClick={() => onNavigate('post', post.id)}
                className="group bg-white rounded-2xl border border-sky-100 p-6 hover:border-sky-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                  <span className="font-medium text-sky-700">
                    {post.author?.username ?? 'Unknown'}
                  </span>
                  <span>·</span>
                  <span>{formatDate(post.created_at)}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {readingTime(post.content)}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 group-hover:text-sky-700 transition-colors mb-2">
                  {post.title}
                </h3>

                <p className="text-slate-600 leading-relaxed line-clamp-3">
                  {post.excerpt || post.content.slice(0, 200) + (post.content.length > 200 ? '…' : '')}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4" />
                      {post.comment_count ?? 0} {(post.comment_count ?? 0) === 1 ? 'comment' : 'comments'}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium text-sky-600 group-hover:gap-2 transition-all">
                    Read more
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
