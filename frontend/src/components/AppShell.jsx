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
      }}>
        {showHeader && <Header title={title} scrolled={scrolled} />}
        
        <div style={{
          flex: 1,
          padding: '32px 40px 80px',
          maxWidth: '960px',
          width: '100%',
          margin: '0 auto',
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}
