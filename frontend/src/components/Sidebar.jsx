'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useI18n } from '@/i18n';
import { 
  LayoutDashboard, 
  BarChart3, 
  Moon, 
  Leaf, 
  Heart, 
  Sparkles, 
  Settings
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AuraSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

  const isActive = (href) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  const mainLinks = [
    { label: t('nav.home'),       href: "/dashboard",   icon: <LayoutDashboard size={18} strokeWidth={1.75} /> },
    { label: t('nav.progress'),   href: "/reports",     icon: <BarChart3 size={18} strokeWidth={1.75} /> },
    { label: t('nav.chat'),       href: "/chat",        icon: <Sparkles size={18} strokeWidth={1.75} /> },
  ];

  const wellnessLinks = [
    { label: t('nav.sleep'),        href: "/sleep",       icon: <Moon size={18} strokeWidth={1.75} /> },
    { label: t('nav.pause'),        href: "/meditations", icon: <Leaf size={18} strokeWidth={1.75} /> },
    { label: t('assessment.title'), href: "/assessment",  icon: <Heart size={18} strokeWidth={1.75} /> },
  ];

  const bottomLinks = [
    { label: t('settings.title'),   href: "/settings",    icon: <Settings size={18} strokeWidth={1.75} /> },
  ];

  const [open, setOpen] = React.useState(false);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('aura_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const userName = user?.display_name || user?.name || user?.user_metadata?.name || t('sidebar.profileName') || 'User';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Sidebar open={open} setOpen={setOpen} animate={true}>
      <SidebarBody 
        className="justify-between"
        style={{
          background: 'var(--bg-sidebar)',
          backdropFilter: 'blur(40px) saturate(160%)',
          WebkitBackdropFilter: 'blur(40px) saturate(160%)',
          borderRight: '1px solid var(--border-primary)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          
          {/* Brand */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: open ? 'flex-start' : 'center',
            padding: open ? '0 12px' : '0',
            marginTop: '8px',
            marginBottom: '40px',
          }}>
            {open ? <Logo /> : <LogoIcon />}
          </div>

          {/* Main */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {mainLinks.map((link, idx) => (
              <SidebarLink key={idx} link={link} active={isActive(link.href)} />
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--border-primary)', margin: open ? '20px 12px' : '20px 8px' }} />
          
          {/* Section Label */}
          {open && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '0 12px',
                marginBottom: '8px',
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--fg-muted)',
                opacity: 0.5,
              }}
            >
              {t('sidebar.wellness')}
            </motion.div>
          )}

          {/* Wellness */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {wellnessLinks.map((link, idx) => (
              <SidebarLink key={idx} link={link} active={isActive(link.href)} />
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--border-primary)', margin: open ? '20px 12px' : '20px 8px' }} />
          
          {/* Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {bottomLinks.map((link, idx) => (
              <SidebarLink key={idx} link={link} active={isActive(link.href)} />
            ))}
          </div>
        </div>

        {/* User Profile & Quick Action */}
        <div style={{ 
          borderTop: '1px solid var(--border-primary)', 
          paddingTop: '16px',
          paddingBottom: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Quick Action Button (Apple Style) */}
          <div style={{ padding: '0 8px', display: 'flex', justifyContent: open ? 'flex-start' : 'center' }}>
            <button 
              onClick={() => router.push('/chat')}
              style={{
                width: open ? '100%' : '32px',
                height: '32px',
                borderRadius: open ? '10px' : '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                padding: open ? '0 12px' : '0',
                color: '#10b981',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <Sparkles size={16} strokeWidth={2} />
              {open && <span style={{ fontSize: '13px', fontWeight: 600 }}>ask aura</span>}
            </button>
          </div>

          <SidebarLink
            link={{
              label: userName,
              href: "/settings",
              icon: (
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'var(--brand-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                  border: '1px solid var(--border-pill)',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                }}>
                   {userInitials || 'A'}
                </div>
              ),
            }}
            active={false}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

const Logo = () => (
  <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', position: 'relative', zIndex: 20 }}>
    <div style={{ 
      width: '28px', 
      height: '28px', 
      borderRadius: '7px', 
      background: 'var(--brand-gradient)', 
      boxShadow: '0 2px 12px rgba(16, 185, 129, 0.35)', 
      flexShrink: 0,
      border: '1px solid var(--border-pill)'
    }} />
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{ fontSize: '16px', fontWeight: 600, color: 'var(--fg-foreground)', letterSpacing: '0.06em', fontFamily: 'var(--aura-font-serif)' }}
    >
      AURA
    </motion.span>
  </Link>
);

const LogoIcon = () => (
  <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', position: 'relative', zIndex: 20 }}>
    <div style={{ 
      width: '28px', 
      height: '28px', 
      borderRadius: '7px', 
      background: 'var(--brand-gradient)', 
      boxShadow: '0 2px 12px rgba(16, 185, 129, 0.35)', 
      flexShrink: 0,
      border: '1px solid var(--border-pill)'
    }} />
  </Link>
);
