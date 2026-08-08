import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Building, Shield, CheckCircle } from 'lucide-react';
import { BilingualText } from '../../components/BilingualText';

const DEPARTMENTS = ['Roads', 'Water', 'Sanitation', 'Electricity'];

export function AdminUsers() {
  const [formData, setFormData] = useState({ name: '', email: '', department: 'Roads', password: '' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.name,
          role: 'department_official',
          department: formData.department
        })
      });

      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setFormData({ name: '', email: '', department: 'Roads', password: '' });
        }, 3000);
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || 'Failed to create department user');
      }
    } catch (err) {
      setErrorMsg('Connection error. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-headline-md font-bold text-on-surface mb-2"><BilingualText text="User Management" /></h1>
        <p className="text-on-surface-variant"><BilingualText text="Create and manage official department accounts." /></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <div className="glass-panel p-6 rounded-3xl text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <Shield size={32} />
            </div>
            <h3 className="font-bold text-lg"><BilingualText text="Role Mapping" /></h3>
            <p className="text-sm text-on-surface-variant mt-2">
              <BilingualText text="Users created here will automatically be assigned the " /> <code className="bg-surface-container px-1 py-0.5 rounded">department</code> role in the database.
            </p>
          </div>
          <div className="glass-panel p-6 rounded-3xl text-center">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary">
              <Building size={32} />
            </div>
            <h3 className="font-bold text-lg"><BilingualText text="Strict Filtering" /></h3>
            <p className="text-sm text-on-surface-variant mt-2">
              <BilingualText text="They will only be able to view and resolve issues assigned to their specific department." />
            </p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="md:col-span-2 glass-panel p-8 rounded-[2.5rem] relative overflow-hidden"
        >
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 bg-white/90 dark:bg-surface-container/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-8"
            >
              <CheckCircle size={64} className="text-secondary mb-4" />
              <h2 className="text-2xl font-bold text-on-surface mb-2"><BilingualText text="Account Created!" /></h2>
              <p className="text-on-surface-variant"><BilingualText text="The department official can now log in using these credentials." /></p>
            </motion.div>
          )}

          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <UserPlus className="text-primary" /> <BilingualText text="Create Official" />
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2"><BilingualText text="Full Name" /></label>
              <input 
                required type="text" 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="e.g. Ramesh Kumar"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2"><BilingualText text="Email Address" /></label>
                <input 
                  required type="email" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="ramesh@waterdept.gov"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2"><BilingualText text="Assigned Department" /></label>
                <select 
                  value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d} Department</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2"><BilingualText text="Temporary Password" /></label>
              <input 
                required type="password" 
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            {errorMsg && (
              <div className="text-error text-sm font-bold text-center bg-error/10 py-2.5 rounded-xl border border-error/20">
                {errorMsg}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-4 bg-primary text-white py-4 rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              <BilingualText text={isLoading ? "Registering..." : "Register Department User"} />
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
