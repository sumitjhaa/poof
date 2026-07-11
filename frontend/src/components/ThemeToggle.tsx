'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme, THEMES } from './ThemeProvider';

const darkThemes = THEMES.filter((t) => t.mode === 'dark');
const lightThemes = THEMES.filter((t) => t.mode === 'light');

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="nav-link theme-trigger" onClick={() => setOpen(true)}>
        Theme
      </button>

      {open && createPortal(
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal theme-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Theme</h3>
              <button className="modal-close" onClick={() => setOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="theme-section">
              <span className="theme-section-label">Dark</span>
              <div className="theme-grid">
                {darkThemes.map((t) => (
                  <button
                    key={t.id}
                    className={`theme-card ${theme === t.id ? 'theme-card-active' : ''}`}
                    style={{ background: t.vars['--bg'] } as React.CSSProperties}
                    onClick={() => { setTheme(t.id); setOpen(false); }}
                  >
                    <span className="theme-card-colors">
                      <span style={{ background: t.colors[0] }} />
                      <span style={{ background: t.colors[1] }} />
                      <span style={{ background: t.colors[2] }} />
                    </span>
                    <span className="theme-card-name" style={{ color: t.vars['--text-muted'] }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="theme-section">
              <span className="theme-section-label">Light</span>
              <div className="theme-grid">
                {lightThemes.map((t) => (
                  <button
                    key={t.id}
                    className={`theme-card ${theme === t.id ? 'theme-card-active' : ''}`}
                    style={{ background: t.vars['--bg'] } as React.CSSProperties}
                    onClick={() => { setTheme(t.id); setOpen(false); }}
                  >
                    <span className="theme-card-colors">
                      <span style={{ background: t.colors[0] }} />
                      <span style={{ background: t.colors[1] }} />
                      <span style={{ background: t.colors[2] }} />
                    </span>
                    <span className="theme-card-name" style={{ color: t.vars['--text-muted'] }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
