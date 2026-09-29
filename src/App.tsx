import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import AuthPage from '@/pages/AuthPage';
import HomePage from '@/pages/HomePage';
import PostPage from '@/pages/PostPage';
import EditorPage from '@/pages/EditorPage';
import SettingsPage from '@/pages/SettingsPage';

type Page =
  | { name: 'home' }
  | { name: 'auth' }
  | { name: 'post'; postId: string }
  | { name: 'editor'; postId?: string }
  | { name: 'settings' };

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [page, setPage] = useState<Page>({ name: 'home' });

  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'auth') {
        setPage({ name: 'auth' });
      } else if (hash === 'settings') {
        setPage({ name: 'settings' });
      } else if (hash === 'editor') {
        setPage({ name: 'editor' });
      } else if (hash.startsWith('editor/')) {
        const postId = hash.slice('editor/'.length);
        setPage({ name: 'editor', postId });
      } else if (hash.startsWith('post/')) {
        const postId = hash.slice('post/'.length);
        if (postId) setPage({ name: 'post', postId });
      } else {
        setPage({ name: 'home' });
      }
    };

    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const navigate = (target: string, postId?: string) => {
    if (target === 'home') {
      window.location.hash = '';
    } else if (target === 'auth') {
      window.location.hash = 'auth';
    } else if (target === 'settings') {
      window.location.hash = 'settings';
    } else if (target === 'editor') {
      if (!user) {
        window.location.hash = 'auth';
        return;
      }
      window.location.hash = postId ? `editor/${postId}` : 'editor';
    } else if (target === 'post' && postId) {
      window.location.hash = `post/${postId}`;
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('home');
  };

  // Safety net: redirect to home if user becomes authenticated while on auth page
  useEffect(() => {
    if (user && page.name === 'auth') {
      navigate('home');
    }
  }, [user, page]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-950">
        <div className="animate-pulse text-sky-300">Loading…</div>
      </div>
    );
  }

  // Auth page: standalone, no navbar
  if (page.name === 'auth') {
    return <AuthPage onNavigate={navigate} />;
  }

  // Settings: requires auth
  if (page.name === 'settings') {
    if (!user) {
      return <AuthPage onNavigate={navigate} />;
    }
    return (
      <div className="min-h-screen bg-sky-50">
        <Navbar
          onNavigate={navigate}
          onSignOut={handleSignOut}
          showBack
          onBack={() => navigate('home')}
        />
        <SettingsPage onNavigate={navigate} onSignOut={handleSignOut} />
      </div>
    );
  }

  // Editor: navbar with cancel/back
  if (page.name === 'editor') {
    if (!user) {
      return <AuthPage onNavigate={navigate} />;
    }
    return (
      <div className="min-h-screen bg-sky-50">
        <Navbar
          onNavigate={navigate}
          onSignOut={handleSignOut}
          showBack
          onBack={() => navigate(page.postId ? 'post' : 'home', page.postId)}
          backLabel="Cancel"
        />
        <EditorPage postId={page.postId} onNavigate={navigate} />
      </div>
    );
  }

  // Post detail: navbar with back to home
  if (page.name === 'post') {
    return (
      <div className="min-h-screen bg-sky-50">
        <Navbar
          onNavigate={navigate}
          onSignOut={handleSignOut}
          showBack
          onBack={() => navigate('home')}
        />
        <PostPage postId={page.postId} onNavigate={navigate} />
      </div>
    );
  }

  // Home: navbar, no back button
  return (
    <div className="min-h-screen bg-sky-50">
      <Navbar onNavigate={navigate} onSignOut={handleSignOut} />
      <HomePage onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
