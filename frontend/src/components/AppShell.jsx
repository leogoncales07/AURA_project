'use client';

import AuraSidebar from './Sidebar';
import Header from './Header';
import { useState, useEffect } from 'react';

export default function AppShell({ children, title, showSidebar = true, showHeader = true }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-background)',
      color: 'var(--fg-foreground)',
      transition: 'background 0.5s ease, color 0.5s ease',
      overflow: 'hidden',
    }}>
      {showSidebar && <AuraSidebar />}
      
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: '100vh',
        overflowY: 'auto',
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16,185,129,0.05) 0%, transparent 70%)',
      }}>
        {showHeader && <Header title={title} scrolled={scrolled} />}
        
        <div style={{
          flex: 1,
          padding: '32px 48px 80px',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}
