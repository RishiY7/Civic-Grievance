import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Tag, AlertTriangle, Calendar, Building, CheckCircle, Wrench, Clock, Camera } from 'lucide-react';
import { BilingualText } from '../../components/BilingualText';

interface DashboardContext {
  grievances: any[];
}

export function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { grievances } = useOutletContext<DashboardContext>();

  // In a real app we'd fetch this from backend based on ID. 
  // We'll mock matching it by index for now.
  const grievanceId = parseInt(id || '0');
  const grievance = grievances[grievanceId] || {
    status: 'Resolved',
    original_text: 'There is a massive pothole causing traffic.',
    translated_text: 'There is a massive pothole causing traffic.',
    visual_issue: 'Pothole',
    department: 'Roads',
    severity: 'High',
    latitude: 12.9716,
    longitude: 77.5946,
    date: new Date().toLocaleDateString()
  };

  const getStatusBanner = (status: string) => {
    switch(status) {
      case 'Resolved': return (
        <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-2xl flex items-center gap-3 text-secondary mb-8">
          <CheckCircle size={24} />
          <div>
            <h4 className="font-bold"><BilingualText text="Issue Resolved" /></h4>
            <p className="text-sm opacity-80"><BilingualText text="The responsible department has fixed this issue." /></p>
          </div>
        </div>
      );
      case 'In-Progress': return (
        <div className="bg-warning/10 border border-warning/20 p-4 rounded-2xl flex items-center gap-3 text-warning mb-8">
          <Wrench size={24} />
          <div>
            <h4 className="font-bold"><BilingualText text="Work In Progress" /></h4>
            <p className="text-sm opacity-80"><BilingualText text="A team has been dispatched and is currently working on this." /></p>
          </div>
        </div>
      );
      default: return (
        <div className="bg-surface-container-high border border-outline-variant/30 p-4 rounded-2xl flex items-center gap-3 text-on-surface-variant mb-8">
          <Clock size={24} />
          <div>
            <h4 className="font-bold"><BilingualText text="Pending Assignment" /></h4>
            <p className="text-sm opacity-80"><BilingualText text="This issue has been logged and is awaiting department review." /></p>
          </div>
        </div>
      );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto w-full space-y-6"
    >
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold"
      >
        <ArrowLeft size={20} />
        <BilingualText text="Back to Dashboard" />
      </button>

      {getStatusBanner(grievance.status || 'Resolved')}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-[2.5rem]">
            <h1 className="text-2xl font-headline-md font-bold mb-4 text-on-surface"><BilingualText text="Issue Details" /></h1>
            <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 mb-6">
              <p className="text-body-lg text-on-surface">"{grievance.original_text || grievance.translated_text || grievance.visual_issue}"</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary"><Building size={20} /></div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase"><BilingualText text="Department" /></p>
                  <p className="font-medium text-on-surface">{grievance.department}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-error/10 rounded-lg text-error"><AlertTriangle size={20} /></div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase"><BilingualText text="Severity" /></p>
                  <p className="font-medium text-on-surface">{grievance.severity}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg text-secondary"><Tag size={20} /></div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase"><BilingualText text="AI Visual Tag" /></p>
                  <p className="font-medium text-on-surface">{grievance.visual_issue || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-surface-container rounded-lg text-on-surface-variant"><Calendar size={20} /></div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase"><BilingualText text="Date Reported" /></p>
                  <p className="font-medium text-on-surface">{grievance.date || new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {(grievance.status === 'Resolved' || !grievance.status) && (
            <div className="glass-panel p-8 rounded-[2.5rem] border border-secondary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <CheckCircle size={100} className="text-secondary" />
              </div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-secondary">
                <Camera size={20} /> <BilingualText text="Resolution Proof" />
              </h2>
              <div className="aspect-video bg-surface-container rounded-2xl border border-outline-variant/30 flex items-center justify-center relative overflow-hidden">
                {/* Placeholder for resolution photo */}
                <div className="absolute inset-0 bg-gradient-to-tr from-secondary/10 to-primary/10 mix-blend-multiply"></div>
                <p className="text-on-surface-variant font-bold z-10 flex items-center gap-2">
                  <CheckCircle size={18} /> <BilingualText text="Verified by Department" />
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-[2rem]">
            <h3 className="font-bold mb-4 flex items-center gap-2"><MapPin size={18} className="text-primary"/> <BilingualText text="Location Details" /></h3>
            <div className="aspect-square bg-surface-container rounded-xl border border-outline-variant/30 flex items-center justify-center overflow-hidden relative">
              {/* Fake mini map view for design purposes */}
              <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(#0058bc 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              <div className="relative text-center">
                <MapPin size={32} className="text-error mx-auto mb-2 drop-shadow-md" />
                <p className="text-xs font-mono text-on-surface-variant">{grievance.latitude.toFixed(4)}, {grievance.longitude.toFixed(4)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
