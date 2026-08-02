import { Search, Bell, LogOut, LogIn } from 'lucide-react';
import { BilingualText } from './BilingualText';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  userRole: string | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

export function Header({ userRole, onLoginClick, onLogout }: HeaderProps) {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleHomeClick = () => {
    if (userRole === 'admin') navigate('/admin');
    else if (userRole === 'department') navigate('/department');
    else if (userRole === 'citizen') navigate('/citizen');
    else navigate('/');
  };

  const handleMapClick = () => {
    if (userRole === 'department') {
      navigate('/department/map');
    } else {
      if (location.pathname === '/') {
        document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/');
        setTimeout(() => {
          document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-[0_4px_30px_rgba(0,88,188,0.05)]">
      <div className="flex items-center gap-8">
        <span className="text-headline-lg font-headline-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Civic Grievance
        </span>
        <nav className="hidden lg:flex items-center gap-6">
          <button 
            onClick={handleHomeClick}
            className="text-primary font-bold border-b-2 border-primary py-5 font-body-lg text-body-lg"
          >
            {userRole === 'admin' || userRole === 'department' ? <BilingualText text="Dashboard" /> : <BilingualText text="Home" />}
          </button>
          <button 
            onClick={handleMapClick}
            className="text-on-surface-variant opacity-80 hover:text-primary transition-colors duration-200 font-body-lg text-body-lg"
          >
            <BilingualText text="Map" />
          </button>
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value as any)}
          className="text-sm p-1 border border-outline-variant bg-transparent rounded text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="English">English</option>
          <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
          <option value="Hindi">हिंदी (Hindi)</option>
        </select>

        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant">
          <Search size={20} />
        </button>
        
        <div className="relative">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant">
            <Bell size={20} />
          </button>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
        </div>

        {userRole ? (
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full border border-error/50 hover:bg-error/10 text-error transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm font-bold"><BilingualText text="Logout" /></span>
          </button>
        ) : (
          <button 
            onClick={onLoginClick}
            className="flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors"
          >
            <LogIn size={18} />
            <span className="text-sm font-bold"><BilingualText text="Login" /></span>
          </button>
        )}
      </div>
    </header>
  );
}
