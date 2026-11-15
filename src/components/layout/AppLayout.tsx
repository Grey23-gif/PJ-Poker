import React, { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="app-shell min-h-screen text-content flex flex-col antialiased">
      <a className="skip-link" href="#main-content">Đến nội dung chính</a>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main wrapper shifted on desktop for fixed sidebar */}
      <div className="lg:pl-[var(--sidebar-width)] flex flex-col flex-1 min-w-0">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <Breadcrumbs />
        <main id="main-content" tabIndex={-1} className="app-content flex-1 min-w-0 p-[var(--page-padding)] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

