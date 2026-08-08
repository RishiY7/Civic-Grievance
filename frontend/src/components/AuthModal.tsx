import React, { useState } from 'react';
import { X, UserCircle, ShieldCheck } from 'lucide-react';
import { BilingualText } from './BilingualText';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (token: string, role: string, dept: string | null, email: string) => void;
}

export function AuthModal({ onClose, onLoginSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isLogin) {
      try {
        const formData = new URLSearchParams();
        formData.append('username', email); // OAuth2 expects 'username' field, we send the email in it
        formData.append('password', password);

        // Fetching from python backend
        const res = await fetch('http://localhost:8000/token', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          onLoginSuccess(data.access_token, data.role, data.department, data.email);
        } else {
          setError('Incorrect email or password');
        }
      } catch (err) {
        setError('Connection error. Is the server running?');
      }
    } else {
      try {
        const res = await fetch('http://localhost:8000/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            password, 
            full_name: fullName,
            role: "citizen" // Default signup is citizen
          })
        });
        if (res.ok) {
          setSuccess('Signup successful! Please log in.');
          setIsLogin(true);
        } else {
          setError('Signup failed. Email may already exist or format is invalid.');
        }
      } catch (err) {
        setError('Connection error.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-[2rem] p-8 relative overflow-hidden shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-on-surface-variant hover:text-error transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            {isLogin ? <ShieldCheck size={32} /> : <UserCircle size={32} />}
          </div>
          <h2 className="text-2xl font-bold text-on-surface">
            {isLogin ? <BilingualText text="Welcome Back" /> : <BilingualText text="Create Account" />}
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            {isLogin ? <BilingualText text="Login to access the dashboard" /> : <BilingualText text="Join Civic Grievance to report issues" />}
          </p>
        </div>

        <div className="flex border-b border-outline-variant/30 mb-6">
          <button
            className={`flex-1 py-2 font-bold text-sm transition-colors ${isLogin ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant'}`}
            onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
          >
            <BilingualText text="Login" />
          </button>
          <button
            className={`flex-1 py-2 font-bold text-sm transition-colors ${!isLogin ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant'}`}
            onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
          >
            <BilingualText text="Sign Up" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1"><BilingualText text="Full Name" /></label>
              <input 
                type="text" 
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface"
                placeholder="Enter full name"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-on-surface mb-1">
              <BilingualText text={isLogin ? "Email or Username" : "Email"} />
            </label>
            <input 
              type={isLogin ? "text" : "email"} 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface"
              placeholder={isLogin ? "Enter email or username (e.g. roads, admin)" : "Enter email address"}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface mb-1"><BilingualText text="Password" /></label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-error text-sm font-bold text-center bg-error/10 py-2 rounded-lg">{error}</div>}
          {success && <div className="text-primary text-sm font-bold text-center bg-primary/10 py-2 rounded-lg">{success}</div>}

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all mt-4"
          >
            {isLogin ? <BilingualText text="Login" /> : <BilingualText text="Sign Up" />}
          </button>
        </form>
      </div>
    </div>
  );
}
