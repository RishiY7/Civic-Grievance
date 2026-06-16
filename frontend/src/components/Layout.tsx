import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  userRole: string | null;
  userDept: string | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

export function Layout({ 
  children, 
  userRole, 
  userDept, 
  onLoginClick, 
  onLogout
}: LayoutProps) {
  return (
    <div className="bg-background font-body-md text-on-background min-h-screen overflow-x-hidden">
      <Header 
        userRole={userRole} 
        onLoginClick={onLoginClick} 
        onLogout={onLogout} 
      />
      
      <div className="flex pt-16 h-screen">
        <Sidebar userRole={userRole} userDept={userDept} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {/* Atmospheric Gradient Orbs */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 blur-[100px] pointer-events-none rounded-full z-0"></div>
          <div className="absolute top-1/2 -left-24 w-64 h-64 bg-secondary/10 blur-[80px] pointer-events-none rounded-full z-0"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto space-y-8">
            {children}
          </div>
          
          <div className="h-12"></div> {/* Bottom Padding */}
        </main>
      </div>
    </div>
  );
}
