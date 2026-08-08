import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Tag, AlertTriangle, Calendar, Building, CheckCircle, Wrench, Clock, Camera, X } from 'lucide-react';
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
                {/* Proof photo from backend if available */}
                {grievance.proof_image_path ? (
                  <img src={`http://localhost:8000${grievance.proof_image_path}`} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-secondary/10 to-primary/10 mix-blend-multiply"></div>
                )}
                <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-lg z-10">
                  <p className="text-secondary font-bold flex items-center gap-2 text-sm">
                    <CheckCircle size={16} /> <BilingualText text="Verified by Department" />
                  </p>
                </div>
              </div>
            </div>
          )}

          {grievance.status === 'Resolved' && (
            <div className="glass-panel p-8 rounded-[2.5rem] border border-primary/20 relative overflow-hidden mt-6">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-primary">
                <CheckCircle size={20} /> <BilingualText text="Citizen Verification" />
              </h2>
              <p className="text-on-surface-variant mb-6 text-sm">
                <BilingualText text="The department marked this as resolved. Is the issue actually fixed?" />
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={async () => {
                    if(!confirm("Are you sure you want to verify this fix? The issue will be permanently closed.")) return;
                    const fd = new FormData(); fd.append("action", "verify");
                    const res = await fetch(`http://localhost:8000/grievances/${grievance.id}/citizen-feedback`, {
                      method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, body: fd
                    });
                    if (res.ok) window.location.reload(); else alert("Error verifying issue");
                  }}
                  className="flex-1 bg-secondary/10 text-secondary border border-secondary/30 py-3 rounded-xl font-bold hover:bg-secondary/20 transition-all flex justify-center items-center gap-2"
                >
                  <CheckCircle size={18} /> <BilingualText text="Verify Fix" />
                </button>
                <button 
                  onClick={async () => {
                    if(!confirm("Are you sure you want to re-open this issue?")) return;
                    const fd = new FormData(); fd.append("action", "reopen");
                    const res = await fetch(`http://localhost:8000/grievances/${grievance.id}/citizen-feedback`, {
                      method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, body: fd
                    });
                    if (res.ok) window.location.reload(); else alert("Error re-opening issue");
                  }}
                  className="flex-1 bg-error/10 text-error border border-error/30 py-3 rounded-xl font-bold hover:bg-error/20 transition-all flex justify-center items-center gap-2"
                >
                  <X size={18} /> <BilingualText text="Re-open Issue" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-[2rem]">
            <h3 className="font-bold mb-4 flex items-center gap-2"><MapPin size={18} className="text-primary"/> <BilingualText text="Location Details" /></h3>
            <div className="aspect-square bg-surface-container rounded-xl border border-outline-variant/30 flex items-center justify-center overflow-hidden relative mb-4">
              {/* Mini map preview */}
              <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(#0058bc 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              <div className="relative text-center">
                <MapPin size={32} className="text-error mx-auto mb-2 drop-shadow-md" />
                <p className="text-xs font-mono text-on-surface-variant font-bold">
                  {grievance.latitude != null && grievance.longitude != null 
                    ? `${Number(grievance.latitude).toFixed(4)}, ${Number(grievance.longitude).toFixed(4)}`
                    : 'Location N/A'}
                </p>
              </div>
            </div>
            
            {grievance.latitude != null && grievance.longitude != null && (
              <a
                href={`https://maps.google.com/?q=${grievance.latitude},${grievance.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 px-4 rounded-xl shadow hover:bg-primary/90 transition-all text-sm"
              >
                <MapPin size={16} />
                <BilingualText text="Navigate in Google Maps" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
