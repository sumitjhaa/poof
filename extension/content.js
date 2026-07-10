// Content script - injects UI on Poof secret pages

(function() {
  'use strict';

  // Only run on Poof secret pages
  if (!window.location.pathname.startsWith('/s/')) return;

  // Create floating button
  const button = document.createElement('button');
  button.id = 'poof-read-btn';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
    </svg>
  `;
  button.title = 'Read with Poof Extension';

  // Style the button
  Object.assign(button.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: '#818cf8',
    color: '#0f172a',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    zIndex: '999999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s, background 0.2s'
  });

  // Hover effects
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
    button.style.background = '#6366f1';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.background = '#818cf8';
  });

  // Click handler
  button.addEventListener('click', () => {
    const url = window.location.href;
    chrome.runtime.sendMessage({ action: 'read', url });
  });

  // Add to page
  document.body.appendChild(button);

  // Show tooltip on load
  const tooltip = document.createElement('div');
  tooltip.textContent = 'Click to read with Poof';
  Object.assign(tooltip.style, {
    position: 'fixed',
    bottom: '80px',
    right: '20px',
    background: '#1e293b',
    color: '#e2e8f0',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    zIndex: '999998',
    opacity: '0',
    transition: 'opacity 0.3s'
  });

  document.body.appendChild(tooltip);

  // Show tooltip briefly
  setTimeout(() => {
    tooltip.style.opacity = '1';
    setTimeout(() => {
      tooltip.style.opacity = '0';
      setTimeout(() => tooltip.remove(), 300);
    }, 2000);
  }, 1000);
})();
