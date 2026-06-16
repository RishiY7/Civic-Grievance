import { Activity, FileText, Users, Settings, Plus, LayoutDashboard, Map as MapIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  userRole: string | null;
  userDept: string | null;
}

export function Sidebar({ userRole, userDept }: SidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  if (userRole !== 'admin' && userRole !== 'department') {
    return null; // Don't show sidebar for normal users to give them a wider view
  }

  const getLinkClass = (path: string) => {
    const isActive = currentPath.includes(path);
    if (isActive) {
      return "flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/10 to-secondary/10 text-primary rounded-xl font-label-lg transition-all duration-300";
    }
    return "flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low rounded-xl font-label-lg transition-all duration-300";
  };

  return (
    <aside className="hidden lg:flex flex-col p-4 gap-2 w-64 bg-white/40 backdrop-blur-2xl border-r border-white/30 sticky top-16 h-[calc(100vh-64px)] z-40">
      <div className="flex items-center gap-3 px-3 py-4 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
          <Activity size={24} />
        </div>
        <div>
          <p className="font-headline-md text-primary text-label-lg leading-tight">
            {userDept ? `${userDept} Dept` : 'Department Dashboard'}
          </p>
          <p className="text-label-sm text-on-surface-variant opacity-70">Active Session</p>
        </div>
      </div>
      
      <nav className="space-y-1">
        {userRole === 'admin' && (
          <>
            <div className="pt-4 pb-2 px-4">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Admin Controls</p>
            </div>
            <Link className={getLinkClass('dashboard')} to="/admin/dashboard">
              <LayoutDashboard size={20} />
              Analytics
            </Link>
            <Link className={getLinkClass('grievances')} to="/admin/grievances">
              <FileText size={20} />
              All Grievances
            </Link>
            <Link className={getLinkClass('users')} to="/admin/users">
              <Users size={20} />
              Department Users
            </Link>
            <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low rounded-xl font-label-lg transition-all duration-300" href="#">
              <Settings size={20} />
              Global Settings
            </a>
          </>
        )}
        
        {userRole === 'department' && (
          <>
            <Link className={getLinkClass('dashboard')} to={`/${userRole}/dashboard`}>
              <LayoutDashboard size={20} />
              Workflow Board
            </Link>
            <Link className={getLinkClass('map')} to={`/${userRole}/map`}>
              <MapIcon size={20} />
              Route Planning
            </Link>
          </>
        )}
      </nav>
      
      <div className="mt-auto p-4">
        <button className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
          <Plus size={18} />
          New Directive
        </button>
      </div>
    </aside>
  );
}
