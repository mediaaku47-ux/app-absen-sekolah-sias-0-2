import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { MobileNav } from './components/MobileNav.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Attendance } from './pages/Attendance.tsx';
import { AttendanceHistory } from './pages/AttendanceHistory.tsx';
import { Reports } from './pages/Reports.tsx';
import { Students } from './pages/Students.tsx';
import { Classes } from './pages/Classes.tsx';
import { Prayers } from './pages/Prayers.tsx';
import { AcademicYears } from './pages/AcademicYears.tsx';
import { Settings } from './pages/Settings.tsx';
import { Notifications } from './pages/Notifications.tsx';
import { Profile } from './pages/Profile.tsx';
import { AuthFlow } from './pages/AuthFlow.tsx';
import { PageLoader } from './components/PageLoader.tsx';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>('/dashboard');
  const [navParams, setNavParams] = useState<any>(null);

  const handleNavigate = (path: string, params?: any) => {
    setCurrentPath(path);
    setNavParams(params || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  React.useEffect(() => {
    const handleCustomNav = (e: any) => {
      if (e.detail?.path) {
        handleNavigate(e.detail.path, e.detail.params);
      }
    };
    window.addEventListener('app-navigate', handleCustomNav as EventListener);
    return () => window.removeEventListener('app-navigate', handleCustomNav as EventListener);
  }, []);

  if (isLoading) {
    return <PageLoader fullScreen message="memuat halaman" size="lg" />;
  }

  // Jika belum login atau rute aktif adalah /welcome atau /login
  if (!user || currentPath === '/welcome' || currentPath === '/login') {
    return (
      <AuthFlow
        initialScreen={currentPath === '/login' ? 'login' : 'welcome'}
        onSuccess={() => handleNavigate('/dashboard')}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Desktop Sidebar */}
      <Sidebar currentPath={currentPath} onNavigate={handleNavigate} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1">
          {currentPath === '/dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {currentPath === '/attendance' && (
            <Attendance initialParams={navParams} onNavigate={handleNavigate} />
          )}
          {currentPath === '/attendance/history' && (
            <AttendanceHistory initialParams={navParams} />
          )}
          {currentPath === '/reports' && <Reports onNavigate={handleNavigate} />}
          {currentPath === '/students' && (
            <Students initialParams={navParams} />
          )}
          {currentPath === '/classes' && <Classes />}
          {currentPath === '/prayers' && <Prayers />}
          {currentPath === '/academic-years' && <AcademicYears />}
          {currentPath === '/settings' && <Settings />}
          {currentPath === '/notifications' && <Notifications onNavigate={handleNavigate} />}
          {currentPath === '/profile' && <Profile onNavigate={handleNavigate} />}
        </main>

        {/* Mobile Navigation */}
        <MobileNav currentPath={currentPath} onNavigate={handleNavigate} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
