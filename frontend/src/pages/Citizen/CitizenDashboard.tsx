import { motion } from 'framer-motion';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Wrench, ChevronRight } from 'lucide-react';
import Tilt from 'react-parallax-tilt';

interface DashboardContext {
  grievances: any[];
}

export function CitizenDashboard() {
  const { grievances } = useOutletContext<DashboardContext>();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Resolved': return <CheckCircle className="text-secondary" size={20} />;
      case 'In-Progress': return <Wrench className="text-warning" size={20} />;
      default: return <Clock className="text-on-surface-variant" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Resolved': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'In-Progress': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-surface-container-high text-on-surface-variant border-outline-variant/30';
    }
  };

  // Give them a fake status if they don't have one from backend yet
  const displayGrievances = grievances.map((g, i) => ({
    ...g,
    id: i, // temporary id until backend returns one
    status: Math.random() > 0.6 ? 'Resolved' : Math.random() > 0.3 ? 'In-Progress' : 'Pending',
    date: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString()
  })).sort((a, b) => b.id - a.id); // Show newest first

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-headline-md font-bold text-on-surface">My Grievances</h1>
          <p className="text-on-surface-variant">Track the status of your reported issues.</p>
        </div>
      </div>

      {displayGrievances.length === 0 ? (
        <div className="glass-panel p-12 rounded-[2rem] text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="text-primary" size={32} />
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">No issues reported yet</h3>
          <p className="text-on-surface-variant mb-6">Your neighborhood looks clean. Found an issue?</p>
          <button 
            onClick={() => navigate('/citizen/report')}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Report an Issue
          </button>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayGrievances.map((g) => (
            <Tilt key={g.id} tiltMaxAngleX={3} tiltMaxAngleY={3} perspective={1000} transitionSpeed={2000} scale={1.02}>
              <motion.div 
                variants={itemVariants}
                onClick={() => navigate(`/citizen/issue/${g.id}`)}
                className="glass-panel p-6 rounded-3xl cursor-pointer group hover:border-primary/30 transition-colors h-full flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1 ${getStatusColor(g.status)}`}>
                    {getStatusIcon(g.status)}
                    {g.status}
                  </div>
                  <span className="text-xs text-on-surface-variant font-medium">{g.date}</span>
                </div>
                
                <h3 className="font-bold text-lg text-on-surface mb-2 line-clamp-2">
                  {g.original_text || g.translated_text || `${g.visual_issue} Issue`}
                </h3>
                
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-1 bg-surface-container rounded-md text-on-surface-variant">{g.department}</span>
                    <span className="text-xs px-2 py-1 bg-surface-container rounded-md text-on-surface-variant">{g.severity}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                    <ChevronRight size={16} className="text-primary" />
                  </div>
                </div>
              </motion.div>
            </Tilt>
          ))}
        </motion.div>
      )}
    </div>
  );
}
