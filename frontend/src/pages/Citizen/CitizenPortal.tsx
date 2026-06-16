import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BilingualText } from '../../components/BilingualText';

export function CitizenPortal({ grievances }: { grievances: any[] }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentPath = location.pathname;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Sleek top navigation for Citizen */}
      <div className="flex items-center gap-4 bg-white/40 backdrop-blur-md p-2 rounded-2xl border border-white/40 shadow-sm w-fit">
        <button
          onClick={() => navigate('/citizen/dashboard')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${
            currentPath.includes('dashboard') || currentPath === '/citizen'
              ? 'bg-primary text-white shadow-md'
              : 'text-on-surface-variant hover:bg-white/50'
          }`}
        >
          <BilingualText text="My Dashboard" />
        </button>
        <button
          onClick={() => navigate('/citizen/report')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${
            currentPath.includes('report')
              ? 'bg-primary text-white shadow-md'
              : 'text-on-surface-variant hover:bg-white/50'
          }`}
        >
          <BilingualText text="Report Issue" />
        </button>
      </div>

      {/* Renders the nested routes (Dashboard, Report, IssueDetail) */}
      <motion.div
        key={currentPath}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Outlet context={{ grievances }} />
      </motion.div>
    </div>
  );
}
