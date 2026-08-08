import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  userRole: string | null;
  userDept: string | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onNewDirectiveClick?: () => void;
  notifications?: any[];
}

export function Layout({ 
  children, 
  userRole, 
  userDept, 
  onLoginClick, 
  onLogout,
  onNewDirectiveClick,
  notifications
}: LayoutProps) {
  return (
    <div className="bg-background font-body-md text-on-background min-h-screen overflow-x-hidden">
      <Header 
        userRole={userRole} 
        onLoginClick={onLoginClick} 
        onLogout={onLogout} 
        notifications={notifications}
      />
      
      <div className="flex pt-16 h-screen">
        <Sidebar 
          userRole={userRole} 
          userDept={userDept} 
          onNewDirectiveClick={onNewDirectiveClick}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {/* Atmospheric Gradient Orbs */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 blur-[100px] pointer-events-none rounded-full z-0"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute top-1/2 -left-24 w-64 h-64 bg-secondary/10 blur-[80px] pointer-events-none rounded-full z-0"
          />
          
          <div className="relative z-10 max-w-7xl mx-auto space-y-8">
            {children}
          </div>
          
          <div className="h-12"></div> {/* Bottom Padding */}
        </main>
      </div>
    </div>
  );
}
