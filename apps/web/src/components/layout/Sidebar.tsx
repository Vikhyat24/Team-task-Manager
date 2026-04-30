import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Settings } from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-black/40 backdrop-blur-md border-r border-white/10 flex flex-col h-full z-20 relative">
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">TaskMaster</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 relative z-10">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`h-5 w-5 mr-3 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-400' : ''}`} />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
