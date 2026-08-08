import { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Camera, AlertTriangle, Send, MapPin, ExternalLink } from 'lucide-react';
import { BilingualText } from '../../components/BilingualText';

interface DeptContext {
  grievances: any[];
  onUpdateStatus: (id: number, status: string, proofUrl?: string) => void;
}

export function ResolveIssue() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { grievances, onUpdateStatus } = useOutletContext<DeptContext>();
  
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const grievanceId = parseInt(id || '0');
  const grievance = grievances.find(g => g.id === grievanceId) || {
    id: grievanceId,
    status: 'Pending',
    original_text: 'There is a massive pothole causing traffic.',
    visual_issue: 'Pothole',
    department: 'Roads',
    severity: 'High',
  };

  const handleResolve = async () => {
    if (!proofFile && grievance.status !== 'Resolved') {
      alert("Please upload a proof of work photo before marking as resolved.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('status', 'Resolved');
      if (proofFile) {
        formData.append('proof_file', proofFile);
      }

      const res = await fetch(`http://localhost:8000/grievances/${grievanceId}/status`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        onUpdateStatus(grievanceId, 'Resolved', data.proof_image_path || (proofFile ? URL.createObjectURL(proofFile) : undefined));
        navigate('/department/dashboard');
      } else {
        alert("Failed to update status on server.");
      }
    } catch (err) {
      console.error(err);
      // Fallback local update if offline
      onUpdateStatus(grievanceId, 'Resolved', proofFile ? URL.createObjectURL(proofFile) : undefined);
      navigate('/department/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartWork = async () => {
    try {
      const formData = new FormData();
      formData.append('status', 'In-Progress');
      await fetch(`http://localhost:8000/grievances/${grievanceId}/status`, {
        method: 'POST',
        body: formData
      });
    } catch (err) {
      console.error("Failed to sync In-Progress to server", err);
    }
    onUpdateStatus(grievanceId, 'In-Progress');
    navigate('/department/dashboard');
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        {/* Issue Info */}
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-[2.5rem]">
            <h1 className="text-2xl font-headline-md font-bold mb-6 text-on-surface">Issue #{grievance.id}</h1>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase mb-1"><BilingualText text="Description" /></p>
                <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-on-surface">
                  {grievance.original_text || grievance.translated_text || grievance.visual_issue}
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1 p-4 bg-error/5 rounded-2xl border border-error/10">
                  <p className="text-xs font-bold text-on-surface-variant uppercase mb-1 flex items-center gap-1"><AlertTriangle size={14} className="text-error" /> <BilingualText text="Severity" /></p>
                  <p className="font-bold text-error">{grievance.severity}</p>
                </div>
                <div className="flex-1 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-xs font-bold text-on-surface-variant uppercase mb-1"><BilingualText text="AI Tag" /></p>
                  <p className="font-bold text-primary">{grievance.visual_issue}</p>
                </div>
              </div>

              {grievance.image_path && (
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase mb-1"><BilingualText text="Citizen Uploaded Photo" /></p>
                  <img 
                    src={grievance.image_path.startsWith('http') ? grievance.image_path : `http://localhost:8000${grievance.image_path}`} 
                    alt="Grievance evidence" 
                    className="w-full h-48 object-cover rounded-2xl border border-outline-variant/30"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Location & Navigation Card */}
          <div className="glass-panel p-6 rounded-[2rem]">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-on-surface">
              <MapPin size={18} className="text-primary" /> <BilingualText text="Location & Navigation" />
            </h3>
            <p className="text-xs text-on-surface-variant mb-4 font-mono">
              <BilingualText text="Coordinates:" /> {grievance.latitude != null && grievance.longitude != null 
                ? `${Number(grievance.latitude).toFixed(5)}, ${Number(grievance.longitude).toFixed(5)}`
                : 'Location not provided'}
            </p>
            {grievance.latitude != null && grievance.longitude != null && (
              <a
                href={`https://maps.google.com/?q=${grievance.latitude},${grievance.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 px-4 rounded-xl shadow hover:bg-primary/90 transition-all text-sm group"
              >
                <MapPin size={16} />
                <BilingualText text="Navigate in Google Maps" />
                <ExternalLink size={14} className="opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            )}
          </div>
        </div>

        {/* Action Center */}
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-[2.5rem] border-2 border-primary/20">
            <h2 className="text-xl font-bold mb-6 text-on-surface flex items-center gap-2">
              <CheckCircle className="text-primary" /> <BilingualText text="Action Center" />
            </h2>

            {grievance.status === 'Resolved' ? (
              <div className="text-center p-8 bg-secondary/10 border border-secondary/20 rounded-2xl">
                <CheckCircle size={48} className="text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-secondary mb-2"><BilingualText text="Issue Resolved" /></h3>
                <p className="text-on-surface-variant mb-4"><BilingualText text="Citizen has been notified of the resolution." /></p>
                {(grievance.proof_image_path || (proofFile ? URL.createObjectURL(proofFile) : null)) && (
                  <div className="mt-4 pt-4 border-t border-secondary/20">
                    <p className="text-xs font-bold text-secondary uppercase mb-2"><BilingualText text="Proof of Work" /></p>
                    <img 
                      src={
                        (grievance.proof_image_path && (grievance.proof_image_path.startsWith('http') || grievance.proof_image_path.startsWith('blob:'))) 
                          ? grievance.proof_image_path 
                          : grievance.proof_image_path 
                            ? `http://localhost:8000${grievance.proof_image_path}`
                            : proofFile ? URL.createObjectURL(proofFile) : ''
                      } 
                      alt="Proof of Work" 
                      className="w-full h-48 object-cover rounded-xl border border-secondary/30 mx-auto"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2"><BilingualText text="Upload Proof of Work (Required)" /></label>
                  <div className="relative border-2 border-dashed border-outline-variant/50 rounded-2xl p-6 hover:bg-surface-container-low transition-colors text-center cursor-pointer group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setProofFile(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="flex flex-col items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                      {proofFile ? (
                        <>
                          <CheckCircle size={32} className="mb-2 text-secondary" />
                          <span className="font-bold text-secondary">{proofFile.name}</span>
                        </>
                      ) : (
                        <>
                          <Camera size={32} className="mb-2" />
                          <span className="text-sm font-medium"><BilingualText text="Click to take photo or upload" /></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleResolve}
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-secondary to-[#10b981] text-white px-6 py-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? <BilingualText text="Sending Notification..." /> : <><Send size={18} /> <BilingualText text="Mark as Resolved & Notify Citizen" /></>}
                  </motion.button>
                  
                  {(grievance.status === 'Pending' || grievance.status === 'Open' || !grievance.status) && (
                    <button 
                      onClick={handleStartWork}
                      className="w-full bg-surface-container-high text-on-surface px-6 py-4 rounded-xl font-bold hover:bg-surface-container transition-all"
                    >
                      <BilingualText text="Start Work (Mark In-Progress)" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
