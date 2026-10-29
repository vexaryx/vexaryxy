import React, { useState, useEffect } from 'react';
import { AuthProvider } from './auth';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { PublicationDetailPage } from './pages/PublicationDetailPage';
import { parseCurrentRoute, ParsedRoute } from './utils/routes';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<ParsedRoute>(parseCurrentRoute());

  useEffect(() => {
    const handleRoute = () => {
      setCurrentRoute(parseCurrentRoute());
    };
    window.addEventListener('popstate', handleRoute);
    window.addEventListener('hashchange', handleRoute);
    return () => {
      window.removeEventListener('popstate', handleRoute);
      window.removeEventListener('hashchange', handleRoute);
    };
  }, []);

  const navigateTo = (pageOrPath: string) => {
    let url = '/web/dash.html';

    if (pageOrPath === 'login' || pageOrPath.includes('login')) {
      url = '/login.html';
    } else if (pageOrPath === 'admin' || pageOrPath.includes('admin')) {
      url = '/admin.html';
    } else if (pageOrPath === 'dash' || pageOrPath === '/') {
      url = '/web/dash.html';
    } else if (pageOrPath.startsWith('/')) {
      // Direct path like /p/ID, /n/ID, /s/ID
      url = pageOrPath;
    }

    window.history.pushState({}, '', url);
    setCurrentRoute(parseCurrentRoute());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AuthProvider>
      {currentRoute.page === 'dash' && <DashboardPage onNavigate={navigateTo} />}
      {currentRoute.page === 'login' && <LoginPage onNavigate={navigateTo} />}
      {currentRoute.page === 'admin' && <AdminPage onNavigate={navigateTo} />}
      {currentRoute.page === 'publication' && currentRoute.pubType && currentRoute.pubId && (
        <PublicationDetailPage
          pubType={currentRoute.pubType}
          pubId={currentRoute.pubId}
          onNavigate={navigateTo}
        />
      )}
    </AuthProvider>
  );
}
