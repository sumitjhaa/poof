'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = string;

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({ theme: 'catppuccin-dark', setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export const THEMES = [
  // ── Dark ──
  { id: 'catppuccin-dark', label: 'Mocha', mode: 'dark',
    vars: { '--bg': '#1e1e2e', '--surface': '#313244', '--text': '#cdd6f4', '--text-muted': '#a6adc8', '--text-faint': '#6c7086', '--surface-hover': '#45475a', '--primary': '#cba6f7', '--primary-hover': '#b4befe', '--primary-muted': 'rgba(203,166,247,0.15)', '--glow': 'rgba(203,166,247,0.12)', '--success': '#a6e3a1', '--success-muted': 'rgba(166,227,161,0.15)', '--error': '#f38ba8', '--error-muted': 'rgba(243,139,168,0.15)', '--warning': '#f9e2af', '--warning-muted': 'rgba(249,226,175,0.15)', '--info': '#89dceb', '--info-muted': 'rgba(137,220,235,0.15)' },
    colors: ['#cba6f7', '#89dceb', '#f38ba8'] },
  { id: 'catppuccin-frappe', label: 'Frappe', mode: 'dark',
    vars: { '--bg': '#303446', '--surface': '#414559', '--text': '#c6d0f5', '--text-muted': '#a5adce', '--text-faint': '#737994', '--surface-hover': '#51576d', '--primary': '#ca9ee6', '--primary-hover': '#f2d9e2', '--primary-muted': 'rgba(202,158,230,0.12)', '--glow': 'rgba(202,158,230,0.1)', '--success': '#a6d189', '--success-muted': 'rgba(166,209,137,0.12)', '--error': '#e78284', '--error-muted': 'rgba(231,130,132,0.12)', '--warning': '#ef9f76', '--warning-muted': 'rgba(239,159,118,0.12)', '--info': '#85c1dc', '--info-muted': 'rgba(133,193,220,0.12)' },
    colors: ['#ca9ee6', '#85c1dc', '#e78284'] },
  { id: 'catppuccin-macchiato', label: 'Macchiato', mode: 'dark',
    vars: { '--bg': '#24273a', '--surface': '#363a4f', '--text': '#cad3f5', '--text-muted': '#a5adcb', '--text-faint': '#6e738d', '--surface-hover': '#494d64', '--primary': '#c6a0f6', '--primary-hover': '#f4dbd6', '--primary-muted': 'rgba(198,160,246,0.12)', '--glow': 'rgba(198,160,246,0.1)', '--success': '#a6da95', '--success-muted': 'rgba(166,218,149,0.12)', '--error': '#ed8796', '--error-muted': 'rgba(237,135,150,0.12)', '--warning': '#eed49f', '--warning-muted': 'rgba(238,212,159,0.12)', '--info': '#7dc4e4', '--info-muted': 'rgba(125,196,228,0.12)' },
    colors: ['#c6a0f6', '#7dc4e4', '#ed8796'] },
  { id: 'rosepine-dark', label: 'Rosé Pine', mode: 'dark',
    vars: { '--bg': '#191724', '--surface': '#26233a', '--text': '#e0def4', '--text-muted': '#bcc0d0', '--text-faint': '#6e6a86', '--surface-hover': '#393552', '--primary': '#c4a7e7', '--primary-hover': '#ebbcba', '--primary-muted': 'rgba(196,167,231,0.12)', '--glow': 'rgba(196,167,231,0.1)', '--success': '#31748f', '--success-muted': 'rgba(49,116,143,0.15)', '--error': '#eb6f92', '--error-muted': 'rgba(235,111,146,0.15)', '--warning': '#f6c177', '--warning-muted': 'rgba(246,193,119,0.12)', '--info': '#9ccfd8', '--info-muted': 'rgba(156,207,216,0.12)' },
    colors: ['#c4a7e7', '#9ccfd8', '#eb6f92'] },
  { id: 'rosepine-moon', label: 'Pine Moon', mode: 'dark',
    vars: { '--bg': '#232136', '--surface': '#2a273f', '--text': '#e0def4', '--text-muted': '#908caa', '--text-faint': '#6e6a86', '--surface-hover': '#393552', '--primary': '#c4a7e7', '--primary-hover': '#ebbcba', '--primary-muted': 'rgba(196,167,231,0.12)', '--glow': 'rgba(196,167,231,0.1)', '--success': '#31748f', '--success-muted': 'rgba(49,116,143,0.15)', '--error': '#eb6f92', '--error-muted': 'rgba(235,111,146,0.15)', '--warning': '#f6c177', '--warning-muted': 'rgba(246,193,119,0.12)', '--info': '#9ccfd8', '--info-muted': 'rgba(156,207,216,0.12)' },
    colors: ['#c4a7e7', '#9ccfd8', '#ea9a97'] },
  { id: 'tokyo-dark', label: 'Tokyo Night', mode: 'dark',
    vars: { '--bg': '#1a1b26', '--surface': '#24283b', '--text': '#c0caf5', '--text-muted': '#a9b1d6', '--text-faint': '#565f89', '--surface-hover': '#414868', '--primary': '#bb9af7', '--primary-hover': '#c0caf5', '--primary-muted': 'rgba(187,154,247,0.12)', '--glow': 'rgba(187,154,247,0.1)', '--success': '#9ece6a', '--success-muted': 'rgba(158,206,106,0.12)', '--error': '#f7768e', '--error-muted': 'rgba(247,118,142,0.12)', '--warning': '#e0af68', '--warning-muted': 'rgba(224,175,104,0.12)', '--info': '#7dcfff', '--info-muted': 'rgba(125,207,255,0.12)' },
    colors: ['#bb9af7', '#7dcfff', '#f7768e'] },
  { id: 'tokyo-storm', label: 'Tokyo Storm', mode: 'dark',
    vars: { '--bg': '#24283b', '--surface': '#292e42', '--text': '#c0caf5', '--text-muted': '#a9b1d6', '--text-faint': '#565f89', '--surface-hover': '#343a52', '--primary': '#7aa2f7', '--primary-hover': '#7dcfff', '--primary-muted': 'rgba(122,162,247,0.12)', '--glow': 'rgba(122,162,247,0.1)', '--success': '#9ece6a', '--success-muted': 'rgba(158,206,106,0.12)', '--error': '#f7768e', '--error-muted': 'rgba(247,118,142,0.12)', '--warning': '#e0af68', '--warning-muted': 'rgba(224,175,104,0.12)', '--info': '#73daca', '--info-muted': 'rgba(115,218,202,0.12)' },
    colors: ['#7aa2f7', '#73daca', '#f7768e'] },
  { id: 'dracula', label: 'Dracula', mode: 'dark',
    vars: { '--bg': '#282a36', '--surface': '#44475a', '--text': '#f8f8f2', '--text-muted': '#ccc', '--text-faint': '#6272a4', '--surface-hover': '#6272a4', '--primary': '#bd93f9', '--primary-hover': '#ff79c6', '--primary-muted': 'rgba(189,147,249,0.12)', '--glow': 'rgba(189,147,249,0.1)', '--success': '#50fa7b', '--success-muted': 'rgba(80,250,123,0.12)', '--error': '#ff5555', '--error-muted': 'rgba(255,85,85,0.12)', '--warning': '#f1fa8c', '--warning-muted': 'rgba(241,250,140,0.12)', '--info': '#8be9fd', '--info-muted': 'rgba(139,233,253,0.12)' },
    colors: ['#bd93f9', '#8be9fd', '#ff5555'] },
  { id: 'nord', label: 'Nord', mode: 'dark',
    vars: { '--bg': '#2e3440', '--surface': '#3b4252', '--text': '#eceff4', '--text-muted': '#d8dee9', '--text-faint': '#4c566a', '--surface-hover': '#434c5e', '--primary': '#81a1c1', '--primary-hover': '#88c0d0', '--primary-muted': 'rgba(129,161,193,0.12)', '--glow': 'rgba(129,161,193,0.1)', '--success': '#a3be8c', '--success-muted': 'rgba(163,190,140,0.12)', '--error': '#bf616a', '--error-muted': 'rgba(191,97,106,0.12)', '--warning': '#ebcb8b', '--warning-muted': 'rgba(235,203,139,0.12)', '--info': '#88c0d0', '--info-muted': 'rgba(136,192,208,0.12)' },
    colors: ['#81a1c1', '#88c0d0', '#bf616a'] },
  { id: 'gruvbox-dark', label: 'Gruvbox Dark', mode: 'dark',
    vars: { '--bg': '#282828', '--surface': '#3c3836', '--text': '#ebdbb2', '--text-muted': '#d5c4a1', '--text-faint': '#665c54', '--surface-hover': '#504945', '--primary': '#d79921', '--primary-hover': '#fabd2f', '--primary-muted': 'rgba(215,153,33,0.12)', '--glow': 'rgba(215,153,33,0.1)', '--success': '#b8bb26', '--success-muted': 'rgba(184,187,38,0.12)', '--error': '#fb4934', '--error-muted': 'rgba(251,73,52,0.12)', '--warning': '#fabd2f', '--warning-muted': 'rgba(250,189,47,0.12)', '--info': '#83a598', '--info-muted': 'rgba(131,165,152,0.12)' },
    colors: ['#d79921', '#83a598', '#fb4934'] },
  { id: 'everforest-dark', label: 'Everforest Dark', mode: 'dark',
    vars: { '--bg': '#2d353b', '--surface': '#343f44', '--text': '#d3c6aa', '--text-muted': '#b0b7ab', '--text-faint': '#56635f', '--surface-hover': '#425047', '--primary': '#a7c08d', '--primary-hover': '#dbbc7f', '--primary-muted': 'rgba(167,192,141,0.12)', '--glow': 'rgba(167,192,141,0.1)', '--success': '#a7c08d', '--success-muted': 'rgba(167,192,141,0.12)', '--error': '#e67e80', '--error-muted': 'rgba(230,126,128,0.12)', '--warning': '#dbbc7f', '--warning-muted': 'rgba(219,188,127,0.12)', '--info': '#7fbbb3', '--info-muted': 'rgba(127,187,179,0.12)' },
    colors: ['#a7c08d', '#7fbbb3', '#e67e80'] },
  { id: 'onedark', label: 'One Dark', mode: 'dark',
    vars: { '--bg': '#282c34', '--surface': '#31353f', '--text': '#abb2bf', '--text-muted': '#8c8fa1', '--text-faint': '#5c6370', '--surface-hover': '#3e4451', '--primary': '#c678dd', '--primary-hover': '#d19a66', '--primary-muted': 'rgba(198,120,221,0.12)', '--glow': 'rgba(198,120,221,0.1)', '--success': '#98c379', '--success-muted': 'rgba(152,195,121,0.12)', '--error': '#e06c75', '--error-muted': 'rgba(224,108,117,0.12)', '--warning': '#e5c07b', '--warning-muted': 'rgba(229,192,123,0.12)', '--info': '#61afef', '--info-muted': 'rgba(97,175,239,0.12)' },
    colors: ['#c678dd', '#61afef', '#e06c75'] },
  { id: 'monokai', label: 'Monokai', mode: 'dark',
    vars: { '--bg': '#272822', '--surface': '#3e3d32', '--text': '#f8f8f2', '--text-muted': '#cfcfc2', '--text-faint': '#75715e', '--surface-hover': '#49483e', '--primary': '#a6e22e', '--primary-hover': '#e6db74', '--primary-muted': 'rgba(166,226,46,0.12)', '--glow': 'rgba(166,226,46,0.1)', '--success': '#a6e22e', '--success-muted': 'rgba(166,226,46,0.12)', '--error': '#f92672', '--error-muted': 'rgba(249,38,114,0.12)', '--warning': '#e6db74', '--warning-muted': 'rgba(230,219,116,0.12)', '--info': '#66d9ef', '--info-muted': 'rgba(102,217,239,0.12)' },
    colors: ['#a6e22e', '#66d9ef', '#f92672'] },
  { id: 'github-dark', label: 'GitHub Dark', mode: 'dark',
    vars: { '--bg': '#0d1117', '--surface': '#161b22', '--text': '#e6edf3', '--text-muted': '#8b949e', '--text-faint': '#484f58', '--surface-hover': '#21262d', '--primary': '#d2a8ff', '--primary-hover': '#bc8cff', '--primary-muted': 'rgba(210,168,255,0.12)', '--glow': 'rgba(210,168,255,0.1)', '--success': '#3fb950', '--success-muted': 'rgba(63,185,80,0.12)', '--error': '#f85149', '--error-muted': 'rgba(248,81,73,0.12)', '--warning': '#d29922', '--warning-muted': 'rgba(210,153,34,0.12)', '--info': '#79c0ff', '--info-muted': 'rgba(121,192,255,0.12)' },
    colors: ['#d2a8ff', '#79c0ff', '#ff7b72'] },
  { id: 'solarized-dark', label: 'Solarized Dark', mode: 'dark',
    vars: { '--bg': '#002b36', '--surface': '#073642', '--text': '#839496', '--text-muted': '#93a1a1', '--text-faint': '#586e75', '--surface-hover': '#094e5c', '--primary': '#268bd2', '--primary-hover': '#2aa198', '--primary-muted': 'rgba(38,139,210,0.12)', '--glow': 'rgba(38,139,210,0.1)', '--success': '#859900', '--success-muted': 'rgba(133,153,0,0.12)', '--error': '#dc322f', '--error-muted': 'rgba(220,50,47,0.12)', '--warning': '#b58900', '--warning-muted': 'rgba(181,137,0,0.12)', '--info': '#2aa198', '--info-muted': 'rgba(42,161,152,0.12)' },
    colors: ['#268bd2', '#2aa198', '#dc322f'] },
  { id: 'kanagawa', label: 'Kanagawa', mode: 'dark',
    vars: { '--bg': '#1f1f28', '--surface': '#2a2a37', '--text': '#dcd7ba', '--text-muted': '#c8c093', '--text-faint': '#54546d', '--surface-hover': '#393a4d', '--primary': '#c8a2f7', '--primary-hover': '#957fb8', '--primary-muted': 'rgba(200,162,247,0.12)', '--glow': 'rgba(200,162,247,0.1)', '--success': '#98bb6c', '--success-muted': 'rgba(152,187,108,0.12)', '--error': '#e82424', '--error-muted': 'rgba(232,36,36,0.12)', '--warning': '#e0af68', '--warning-muted': 'rgba(224,175,104,0.12)', '--info': '#7fb4ca', '--info-muted': 'rgba(127,180,202,0.12)' },
    colors: ['#c8a2f7', '#7fb4ca', '#e82424'] },
  { id: 'nightfox', label: 'Nightfox', mode: 'dark',
    vars: { '--bg': '#192330', '--surface': '#29394f', '--text': '#cdced3', '--text-muted': '#73becf', '--text-faint': '#708089', '--surface-hover': '#395068', '--primary': '#c59cff', '--primary-hover': '#d6bfff', '--primary-muted': 'rgba(197,156,255,0.12)', '--glow': 'rgba(197,156,255,0.1)', '--success': '#73daca', '--success-muted': 'rgba(115,218,202,0.12)', '--error': '#ff757f', '--error-muted': 'rgba(255,117,127,0.12)', '--warning': '#ffc777', '--warning-muted': 'rgba(255,199,119,0.12)', '--info': '#63cdcf', '--info-muted': 'rgba(99,205,207,0.12)' },
    colors: ['#c59cff', '#73daca', '#ff757f'] },
  { id: 'cyberdyne', label: 'Cyberdyne', mode: 'dark',
    vars: { '--bg': '#0a0e14', '--surface': '#131820', '--text': '#b3b1ad', '--text-muted': '#878580', '--text-faint': '#4d4d4d', '--surface-hover': '#1c2028', '--primary': '#36d399', '--primary-hover': '#2ebd85', '--primary-muted': 'rgba(54,211,153,0.12)', '--glow': 'rgba(54,211,153,0.1)', '--success': '#36d399', '--success-muted': 'rgba(54,211,153,0.12)', '--error': '#f07178', '--error-muted': 'rgba(240,113,120,0.12)', '--warning': '#ffb454', '--warning-muted': 'rgba(255,180,84,0.12)', '--info': '#39bae6', '--info-muted': 'rgba(57,186,230,0.12)' },
    colors: ['#36d399', '#39bae6', '#f07178'] },
  { id: 'midnight', label: 'Midnight', mode: 'dark',
    vars: { '--bg': '#0f111a', '--surface': '#1a1c2a', '--text': '#c0caf5', '--text-muted': '#a9b1d6', '--text-faint': '#565f89', '--surface-hover': '#24283b', '--primary': '#7aa2f7', '--primary-hover': '#89b4fa', '--primary-muted': 'rgba(122,162,247,0.12)', '--glow': 'rgba(122,162,247,0.1)', '--success': '#9ece6a', '--success-muted': 'rgba(158,206,106,0.12)', '--error': '#f7768e', '--error-muted': 'rgba(247,118,142,0.12)', '--warning': '#e0af68', '--warning-muted': 'rgba(224,175,104,0.12)', '--info': '#7dcfff', '--info-muted': 'rgba(125,207,255,0.12)' },
    colors: ['#7aa2f7', '#7dcfff', '#f7768e'] },

  // ── Light ──
  { id: 'catppuccin-light', label: 'Catppuccin Latte', mode: 'light',
    vars: { '--bg': '#eff1f5', '--surface': '#ccd0da', '--text': '#4c4f69', '--text-muted': '#6c6f85', '--text-faint': '#9ca0b0', '--surface-hover': '#bcc0cc', '--primary': '#8839ef', '--primary-hover': '#7287fd', '--primary-muted': 'rgba(136,57,239,0.12)', '--glow': 'rgba(136,57,239,0.1)', '--success': '#40a02b', '--success-muted': 'rgba(64,160,43,0.12)', '--error': '#d20f39', '--error-muted': 'rgba(210,15,57,0.12)', '--warning': '#df8e1d', '--warning-muted': 'rgba(223,142,29,0.12)', '--info': '#04a5e5', '--info-muted': 'rgba(4,165,229,0.12)' },
    colors: ['#8839ef', '#04a5e5', '#d20f39'] },
  { id: 'rosepine-light', label: 'Rosé Pine Dawn', mode: 'light',
    vars: { '--bg': '#faf4ed', '--surface': '#f2e9e1', '--text': '#575279', '--text-muted': '#797593', '--text-faint': '#9893a5', '--surface-hover': '#e8dfd7', '--primary': '#907aa9', '--primary-hover': '#7962a1', '--primary-muted': 'rgba(144,122,169,0.12)', '--glow': 'rgba(144,122,169,0.1)', '--success': '#31748f', '--success-muted': 'rgba(49,116,143,0.12)', '--error': '#b4637a', '--error-muted': 'rgba(180,99,122,0.12)', '--warning': '#ea9d34', '--warning-muted': 'rgba(234,157,52,0.12)', '--info': '#56949f', '--info-muted': 'rgba(86,148,159,0.12)' },
    colors: ['#907aa9', '#56949f', '#b4637a'] },
  { id: 'tokyo-light', label: 'Tokyo Day', mode: 'light',
    vars: { '--bg': '#e1e2e7', '--surface': '#c4c8da', '--text': '#3760bf', '--text-muted': '#6172b0', '--text-faint': '#848cb5', '--surface-hover': '#b4b8cb', '--primary': '#8459de', '--primary-hover': '#5a4fcf', '--primary-muted': 'rgba(132,89,222,0.12)', '--glow': 'rgba(132,89,222,0.1)', '--success': '#33635c', '--success-muted': 'rgba(51,99,92,0.12)', '--error': '#8c4351', '--error-muted': 'rgba(140,67,81,0.12)', '--warning': '#8f5e15', '--warning-muted': 'rgba(143,94,21,0.12)', '--info': '#0f4b6e', '--info-muted': 'rgba(15,75,110,0.12)' },
    colors: ['#8459de', '#0f4b6e', '#8c4351'] },
  { id: 'gruvbox-light', label: 'Gruvbox Light', mode: 'light',
    vars: { '--bg': '#f2e5bc', '--surface': '#d5c4a1', '--text': '#3c3836', '--text-muted': '#504945', '--text-faint': '#a89984', '--surface-hover': '#bdae93', '--primary': '#d65d0e', '--primary-hover': '#b87333', '--primary-muted': 'rgba(214,93,14,0.12)', '--glow': 'rgba(214,93,14,0.1)', '--success': '#79740e', '--success-muted': 'rgba(121,116,14,0.12)', '--error': '#cc241d', '--error-muted': 'rgba(204,36,29,0.12)', '--warning': '#d65d0e', '--warning-muted': 'rgba(214,93,14,0.12)', '--info': '#458588', '--info-muted': 'rgba(69,133,136,0.12)' },
    colors: ['#d65d0e', '#458588', '#cc241d'] },
  { id: 'everforest-light', label: 'Everforest Light', mode: 'light',
    vars: { '--bg': '#fdf6e3', '--surface': '#e8e2cc', '--text': '#535b4e', '--text-muted': '#6b7661', '--text-faint': '#9da09a', '--surface-hover': '#ddd7c1', '--primary': '#7a9d56', '--primary-hover': '#5e8b3e', '--primary-muted': 'rgba(122,157,86,0.12)', '--glow': 'rgba(122,157,86,0.1)', '--success': '#7a9d56', '--success-muted': 'rgba(122,157,86,0.12)', '--error': '#f85552', '--error-muted': 'rgba(248,85,82,0.12)', '--warning': '#c99e42', '--warning-muted': 'rgba(201,158,66,0.12)', '--info': '#3a9b8b', '--info-muted': 'rgba(58,155,139,0.12)' },
    colors: ['#7a9d56', '#3a9b8b', '#f85552'] },
  { id: 'solarized-light', label: 'Solarized Light', mode: 'light',
    vars: { '--bg': '#fdf6e3', '--surface': '#eee8d5', '--text': '#657b83', '--text-muted': '#586e75', '--text-faint': '#93a1a1', '--surface-hover': '#ddd6c1', '--primary': '#268bd2', '--primary-hover': '#2aa198', '--primary-muted': 'rgba(38,139,210,0.12)', '--glow': 'rgba(38,139,210,0.1)', '--success': '#859900', '--success-muted': 'rgba(133,153,0,0.12)', '--error': '#dc322f', '--error-muted': 'rgba(220,50,47,0.12)', '--warning': '#b58900', '--warning-muted': 'rgba(181,137,0,0.12)', '--info': '#2aa198', '--info-muted': 'rgba(42,161,152,0.12)' },
    colors: ['#268bd2', '#2aa198', '#dc322f'] },
  { id: 'github-light', label: 'GitHub Light', mode: 'light',
    vars: { '--bg': '#ffffff', '--surface': '#f6f8fa', '--text': '#1f2328', '--text-muted': '#656d76', '--text-faint': '#8b949e', '--surface-hover': '#eaeef2', '--primary': '#8250df', '--primary-hover': '#6639ba', '--primary-muted': 'rgba(130,80,223,0.1)', '--glow': 'rgba(130,80,223,0.1)', '--success': '#1a7f37', '--success-muted': 'rgba(26,127,55,0.1)', '--error': '#cf222e', '--error-muted': 'rgba(207,34,46,0.1)', '--warning': '#9a6700', '--warning-muted': 'rgba(154,103,0,0.1)', '--info': '#0969da', '--info-muted': 'rgba(9,105,218,0.1)' },
    colors: ['#8250df', '#0969da', '#cf222e'] },
  { id: 'dayfox', label: 'Dayfox', mode: 'light',
    vars: { '--bg': '#f6f2ee', '--surface': '#e6e0d9', '--text': '#3d5b6a', '--text-muted': '#5c7a89', '--text-faint': '#89a3ad', '--surface-hover': '#dbd5cd', '--primary': '#8d69a1', '--primary-hover': '#7a5a8e', '--primary-muted': 'rgba(141,105,161,0.12)', '--glow': 'rgba(141,105,161,0.1)', '--success': '#3e8a8a', '--success-muted': 'rgba(62,138,138,0.12)', '--error': '#bf4e3e', '--error-muted': 'rgba(191,78,62,0.12)', '--warning': '#c47a33', '--warning-muted': 'rgba(196,122,51,0.12)', '--info': '#3e8a8a', '--info-muted': 'rgba(62,138,138,0.12)' },
    colors: ['#8d69a1', '#3e8a8a', '#bf4e3e'] },
];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('catppuccin-dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('poof-theme');
    if (saved) setTheme(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('poof-theme', theme);
    }
  }, [theme, mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
