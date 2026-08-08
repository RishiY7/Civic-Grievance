import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertTriangle, Building, MapPin, Sparkles, Loader2, Compass } from 'lucide-react';
import { BilingualText } from './BilingualText';

interface NewDirectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  userDept: string | null;
  userRole: string | null;
  onSuccess: (directive: any) => void;
}

export function NewDirectiveModal({
  isOpen,
  onClose,
  userDept,
  userRole,
  onSuccess
}: NewDirectiveModalProps) {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState(userDept && userDept !== 'All' ? userDept : 'Roads');
  const [severity, setSeverity] = useState('High');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState('12.9716');
  const [lng, setLng] = useState('77.5946');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGetLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toFixed(5));
          setLng(position.coords.longitude.toFixed(5));
          setIsLocating(false);
        },
        (error) => {
          console.error("Location error:", error);
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('adminToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:8000/directives', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: title.trim(),
          department: userRole === 'department' && userDept ? userDept : department,
          severity,
          description: description.trim(),
          latitude: parseFloat(lat) || 12.9716,
          longitude: parseFloat(lng) || 77.5946
        })
      });

      if (!response.ok) {
        throw new Error('Failed to issue directive');
      }

      const created = await response.json();
      onSuccess(created);
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while creating the directive.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-panel w-full max-w-xl p-6 md:p-8 rounded-[2.5rem] bg-surface border border-outline-variant/30 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-primary to-secondary text-white rounded-2xl shadow-md">
                <Sparkles size={22} />
              </div>
              <div>
                <h2 className="text-xl font-headline-md font-bold text-on-surface">
                  <BilingualText text="Issue New Directive / Work Order" />
                </h2>
                <p className="text-xs text-on-surface-variant">
                  <BilingualText text="Broadcast a priority instruction to department field teams" />
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 mb-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">
                <BilingualText text="Directive Title *" />
              </label>
              <input 
                type="text" 
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Emergency Monsoon Inspection / Road Resurfacing"
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface font-medium"
              />
            </div>

            {/* Department & Severity Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1 flex items-center gap-1">
                  <Building size={14} /> <BilingualText text="Target Department" />
                </label>
                {userRole === 'department' && userDept ? (
                  <input 
                    type="text" 
                    disabled 
                    value={userDept}
                    className="w-full px-4 py-3 bg-surface-container-high/60 border border-outline-variant/30 rounded-xl text-on-surface font-bold cursor-not-allowed"
                  />
                ) : (
                  <select 
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface font-medium"
                  >
                    <option value="Roads">Roads Department</option>
                    <option value="Water">Water Supply & Sewage</option>
                    <option value="Sanitation">Sanitation & Waste</option>
                    <option value="Electricity">Electricity & Streetlights</option>
                    <option value="Health">Health & Public Safety</option>
                    <option value="Traffic">Traffic Management</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1 flex items-center gap-1">
                  <AlertTriangle size={14} /> <BilingualText text="Priority / Severity" />
                </label>
                <select 
                  value={severity}
                  onChange={e => setSeverity(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface font-medium"
                >
                  <option value="Critical">Critical (Immediate Action)</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low / Routine</option>
                </select>
              </div>
            </div>

            {/* Coordinates / Location */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase flex items-center gap-1">
                  <MapPin size={14} /> <BilingualText text="Target Location Coordinates" />
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
                >
                  {isLocating ? <Loader2 size={12} className="animate-spin" /> : <Compass size={12} />}
                  <BilingualText text="Use Current Location" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  value={lat}
                  onChange={e => setLat(e.target.value)}
                  placeholder="Latitude"
                  className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface text-sm font-mono"
                />
                <input 
                  type="text" 
                  value={lng}
                  onChange={e => setLng(e.target.value)}
                  placeholder="Longitude"
                  className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface text-sm font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">
                <BilingualText text="Instructions & Details *" />
              </label>
              <textarea 
                rows={3}
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Specify requirements, target completion timeline, or field guidelines..."
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface font-medium resize-none"
              />
            </div>

            {/* Submit Actions */}
            <div className="pt-3 flex gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container font-bold text-on-surface transition-colors"
              >
                <BilingualText text="Cancel" />
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <BilingualText text="Issuing..." />
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <BilingualText text="Issue Directive" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
