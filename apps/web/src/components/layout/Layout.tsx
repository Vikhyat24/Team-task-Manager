import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const Layout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[2px] pointer-events-none -z-10" />
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
