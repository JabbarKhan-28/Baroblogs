
import { Platform } from 'react-native';

export const COLORS = {
  // Base Backgrounds - Midnight Tech Palette 
  primaryBg: '#050a14',      // Deep Space Navy
  darkBg: '#02040a',         // Blackened Navy
  surface: '#0f172a',        // Slate Dark Surface
  surfaceLight: '#1e293b',   // Slate Light
  cardBg: 'rgba(15, 23, 42, 0.8)', // Glassy Navy
  cardBgHover: 'rgba(30, 41, 59, 0.9)',

  // Text Colors
  textPrim: '#f8fafc',       // High contrast white
  textSec: '#94a3b8',        // Slate Muted
  textHighlight: '#38bdf8',  // Sky Blue Glow
  textMuted: 'rgba(148, 163, 184, 0.6)',

  // Accents
  purple: '#2563eb',         // Royal Blue (Replacing vivid violet)
  purpleLight: '#60a5fa',    // Bright Blue
  accent: '#2dd4bf',         // Teal/Cyan Accent
  border: 'rgba(56, 189, 248, 0.2)', // Subtle blue border
  borderFocus: 'rgba(56, 189, 248, 0.5)',

  // UI Elements
  inputBg: 'rgba(255, 255, 255, 0.03)',
  success: '#10b981',        // Emerald Green
  error: '#ef4444',          // Soft Red
  warning: '#f59e0b',        // Amber
  
  // Tab Bar
  tabBarBg: 'rgba(5, 10, 20, 0.8)',
  tabBarActive: '#38bdf8',
  tabBarInactive: 'rgba(148, 163, 184, 0.5)',

  // Glow Effects
  glowPurple: 'rgba(56, 189, 248, 0.3)', // Now Glow Blue
  glowCyan: 'rgba(45, 212, 191, 0.3)',   // Now Glow Teal
};


export const FONTS = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    mono: 'Courier',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    mono: 'monospace',
  },
});
