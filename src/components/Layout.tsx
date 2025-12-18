import React from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      {/* Main Content */}
      <main className="pt-4">
        {children}
      </main>
    </div>
  );
};

export default Layout; 