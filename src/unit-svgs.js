// Hand-crafted SVG icons for each military unit — original artwork, no copyright

export const UNIT_SVGS = {

tank: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="32" width="44" height="16" rx="3" fill="#4a5a2a"/>
  <rect x="14" y="24" width="34" height="12" rx="3" fill="#5a6e30"/>
  <rect x="34" y="20" width="22" height="8" rx="3" fill="#4a5a2a"/>
  <rect x="54" y="22" width="8" height="4" rx="2" fill="#3a4820"/>
  <rect x="8" y="44" width="48" height="8" rx="4" fill="#3a4820"/>
  <circle cx="16" cy="48" r="5" fill="#2a3418"/><circle cx="16" cy="48" r="2.5" fill="#1a2010"/>
  <circle cx="28" cy="48" r="5" fill="#2a3418"/><circle cx="28" cy="48" r="2.5" fill="#1a2010"/>
  <circle cx="40" cy="48" r="5" fill="#2a3418"/><circle cx="40" cy="48" r="2.5" fill="#1a2010"/>
  <circle cx="52" cy="48" r="5" fill="#2a3418"/><circle cx="52" cy="48" r="2.5" fill="#1a2010"/>
  <rect x="18" y="26" width="8" height="5" rx="1" fill="#3a4820" opacity="0.6"/>
</svg>`,

artillery: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="36" width="40" height="14" rx="3" fill="#5a4a2a"/>
  <rect x="12" y="28" width="28" height="12" rx="2" fill="#6a5a30"/>
  <rect x="28" y="18" width="30" height="6" rx="3" fill="#4a3a20"/>
  <rect x="56" y="19" width="6" height="4" rx="2" fill="#3a2a10"/>
  <circle cx="12" cy="48" r="5" fill="#3a2a18"/><circle cx="12" cy="48" r="2" fill="#2a1a08"/>
  <circle cx="24" cy="48" r="5" fill="#3a2a18"/><circle cx="24" cy="48" r="2" fill="#2a1a08"/>
  <circle cx="36" cy="48" r="5" fill="#3a2a18"/><circle cx="36" cy="48" r="2" fill="#2a1a08"/>
  <circle cx="48" cy="48" r="5" fill="#3a2a18"/><circle cx="48" cy="48" r="2" fill="#2a1a08"/>
  <line x1="8" y1="50" x2="56" y2="50" stroke="#2a1a08" stroke-width="2"/>
</svg>`,

apc: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="30" width="52" height="18" rx="4" fill="#4a5a2a"/>
  <rect x="10" y="22" width="44" height="12" rx="3" fill="#5a6e30"/>
  <rect x="14" y="24" width="8" height="6" rx="1" fill="#3a8a9a" opacity="0.7"/>
  <rect x="26" y="24" width="8" height="6" rx="1" fill="#3a8a9a" opacity="0.7"/>
  <rect x="38" y="24" width="8" height="6" rx="1" fill="#3a8a9a" opacity="0.7"/>
  <circle cx="16" cy="48" r="6" fill="#2a3418"/><circle cx="16" cy="48" r="3" fill="#1a2010"/>
  <circle cx="32" cy="48" r="6" fill="#2a3418"/><circle cx="32" cy="48" r="3" fill="#1a2010"/>
  <circle cx="48" cy="48" r="6" fill="#2a3418"/><circle cx="48" cy="48" r="3" fill="#1a2010"/>
  <rect x="52" y="32" width="6" height="4" rx="2" fill="#3a4820"/>
</svg>`,

fighter_jet: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <polygon points="32,8 12,40 18,38 32,14 46,38 52,40" fill="#3a4a6a"/>
  <rect x="24" y="30" width="16" height="10" rx="2" fill="#4a5a7a"/>
  <polygon points="18,38 6,52 20,44" fill="#3a4a6a"/>
  <polygon points="46,38 58,52 44,44" fill="#3a4a6a"/>
  <polygon points="26,44 22,54 32,48 42,54 38,44" fill="#2a3a5a"/>
  <ellipse cx="32" cy="24" rx="5" ry="7" fill="#5a8aaa" opacity="0.6"/>
  <circle cx="20" cy="50" r="2" fill="#e05050" opacity="0.8"/>
  <circle cx="44" cy="50" r="2" fill="#50e090" opacity="0.8"/>
  <ellipse cx="32" cy="56" rx="4" ry="3" fill="#e08030" opacity="0.4"/>
</svg>`,

bomber: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <polygon points="32,12 8,38 14,36 32,18 50,36 56,38" fill="#2a3050"/>
  <rect x="22" y="32" width="20" height="12" rx="3" fill="#343860"/>
  <polygon points="8,38 2,50 16,44" fill="#2a3050"/>
  <polygon points="56,38 62,50 48,44" fill="#2a3050"/>
  <polygon points="24,44 20,56 32,50 44,56 40,44" fill="#1e2840"/>
  <ellipse cx="32" cy="28" rx="6" ry="8" fill="#4a6080" opacity="0.5"/>
  <circle cx="26" cy="46" r="2" fill="#888" opacity="0.7"/>
  <circle cx="32" cy="47" r="2" fill="#888" opacity="0.7"/>
  <circle cx="38" cy="46" r="2" fill="#888" opacity="0.7"/>
  <ellipse cx="32" cy="58" rx="5" ry="3" fill="#e06020" opacity="0.5"/>
</svg>`,

helicopter: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="28" cy="36" rx="18" ry="10" fill="#4a5a3a"/>
  <ellipse cx="28" cy="34" rx="14" ry="8" fill="#5a6a48"/>
  <ellipse cx="32" cy="30" rx="8" ry="5" fill="#6a8aaa" opacity="0.5"/>
  <rect x="4" y="34" width="60" height="4" rx="2" fill="#3a4a2a"/>
  <line x1="34" y1="26" x2="34" y2="18" stroke="#3a4a2a" stroke-width="2"/>
  <ellipse cx="34" cy="16" rx="14" ry="3" fill="#3a4a2a" opacity="0.7"/>
  <rect x="40" y="40" width="14" height="4" rx="2" fill="#3a4a2a"/>
  <ellipse cx="54" cy="40" rx="4" ry="6" fill="#3a4a2a" opacity="0.6"/>
  <circle cx="18" cy="40" r="3" fill="#2a3a1a"/>
  <line x1="18" y1="43" x2="18" y2="52" stroke="#2a3a1a" stroke-width="2"/>
</svg>`,

destroyer: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <polygon points="4,44 8,36 56,36 60,44 56,52 8,52" fill="#2a3a50"/>
  <rect x="16" y="28" width="28" height="12" rx="2" fill="#303d5a"/>
  <rect x="24" y="20" width="14" height="10" rx="2" fill="#263248"/>
  <rect x="28" y="14" width="4" height="8" fill="#1e2838"/>
  <rect x="10" y="36" width="12" height="6" rx="1" fill="#1e2c40"/>
  <rect x="44" y="36" width="10" height="6" rx="1" fill="#1e2c40"/>
  <rect x="30" y="30" width="8" height="4" rx="2" fill="#1e2838"/>
  <line x1="30" y1="28" x2="30" y2="20" stroke="#1e2838" stroke-width="1.5"/>
  <rect x="14" y="38" width="6" height="3" rx="1" fill="#4a7a9a" opacity="0.7"/>
  <rect x="46" y="38" width="6" height="3" rx="1" fill="#4a7a9a" opacity="0.7"/>
</svg>`,

submarine: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="32" cy="40" rx="26" ry="10" fill="#2a3a4a"/>
  <ellipse cx="32" cy="38" rx="24" ry="8" fill="#303d52"/>
  <rect x="26" y="26" width="10" height="14" rx="2" fill="#263248"/>
  <rect x="28" y="20" width="3" height="8" fill="#1e2838"/>
  <rect x="32" y="22" width="3" height="6" fill="#1e2838"/>
  <ellipse cx="10" cy="40" rx="5" ry="8" fill="#2a3a4a"/>
  <ellipse cx="54" cy="40" rx="5" ry="8" fill="#2a3a4a"/>
  <circle cx="20" cy="38" r="3" fill="#4a8aaa" opacity="0.6"/>
  <circle cx="32" cy="38" r="3" fill="#4a8aaa" opacity="0.6"/>
  <circle cx="44" cy="38" r="3" fill="#4a8aaa" opacity="0.6"/>
  <path d="M6 44 Q32 54 58 44" stroke="#1a2a3a" stroke-width="1.5" fill="none" opacity="0.5"/>
</svg>`,

carrier: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <polygon points="2,46 6,36 58,36 62,46 58,54 6,54" fill="#2a3a52"/>
  <rect x="8" y="28" width="48" height="10" rx="1" fill="#1e2c40"/>
  <rect x="10" y="26" width="44" height="4" fill="#263248"/>
  <rect x="42" y="18" width="12" height="12" rx="2" fill="#303d5a"/>
  <rect x="46" y="12" width="4" height="8" fill="#1e2838"/>
  <line x1="8" y1="28" x2="54" y2="28" stroke="#4a6a8a" stroke-width="1" opacity="0.5"/>
  <rect x="12" y="30" width="8" height="3" rx="1" fill="#3a6a8a" opacity="0.6"/>
  <rect x="22" y="30" width="8" height="3" rx="1" fill="#3a6a8a" opacity="0.6"/>
  <polygon points="14,28 18,20 22,28" fill="#2a3a50" opacity="0.7"/>
  <polygon points="24,28 28,22 32,28" fill="#2a3a50" opacity="0.7"/>
</svg>`,

ballistic: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <polygon points="32,6 26,20 26,50 38,50 38,20" fill="#4a3a5a"/>
  <polygon points="32,6 26,20 38,20" fill="#6a4a7a"/>
  <rect x="24" y="50" width="16" height="6" rx="2" fill="#3a2a4a"/>
  <rect x="22" y="42" width="4" height="10" rx="1" fill="#5a4a6a"/>
  <rect x="38" y="42" width="4" height="10" rx="1" fill="#5a4a6a"/>
  <ellipse cx="32" cy="56" rx="10" ry="4" fill="#e06020" opacity="0.4"/>
  <line x1="28" y1="14" x2="26" y2="20" stroke="#8a6a9a" stroke-width="1"/>
  <line x1="36" y1="14" x2="38" y2="20" stroke="#8a6a9a" stroke-width="1"/>
</svg>`,

cruise: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <polygon points="56,32 44,26 10,30 10,34 44,38" fill="#3a4a6a"/>
  <polygon points="56,32 44,26 44,38" fill="#5a6a8a"/>
  <rect x="10" y="29" width="34" height="6" rx="2" fill="#4a5a7a"/>
  <polygon points="18,30 10,26 10,34" fill="#2a3a5a"/>
  <rect x="22" y="24" width="12" height="6" rx="1" fill="#2a3a5a"/>
  <ellipse cx="12" cy="32" rx="4" ry="3" fill="#e06020" opacity="0.5"/>
  <line x1="20" y1="23" x2="26" y2="18" stroke="#4a5a7a" stroke-width="1.5"/>
</svg>`,

sam: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="16" y="44" width="32" height="8" rx="3" fill="#4a5a2a"/>
  <rect x="24" y="36" width="16" height="12" rx="2" fill="#5a6e30"/>
  <line x1="20" y1="36" x2="14" y2="16" stroke="#3a4820" stroke-width="3"/>
  <line x1="32" y1="34" x2="32" y2="10" stroke="#3a4820" stroke-width="3"/>
  <line x1="44" y1="36" x2="50" y2="16" stroke="#3a4820" stroke-width="3"/>
  <polygon points="14,16 10,10 18,14" fill="#6a8a2a"/>
  <polygon points="32,10 28,4 36,8" fill="#6a8a2a"/>
  <polygon points="50,16 46,10 54,14" fill="#6a8a2a"/>
  <circle cx="28" cy="40" r="3" fill="#3a4820" opacity="0.7"/>
  <rect x="20" y="50" width="24" height="4" rx="2" fill="#2a3818"/>
</svg>`,

iron_dome: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="12" y="46" width="40" height="8" rx="3" fill="#3a4a6a"/>
  <rect x="20" y="36" width="24" height="14" rx="3" fill="#404e78"/>
  <line x1="14" y1="36" x2="8" y2="18" stroke="#2a3a5a" stroke-width="3"/>
  <line x1="32" y1="34" x2="32" y2="12" stroke="#2a3a5a" stroke-width="3"/>
  <line x1="50" y1="36" x2="56" y2="18" stroke="#2a3a5a" stroke-width="3"/>
  <rect x="4" y="14" width="8" height="6" rx="2" fill="#4a6a9a"/>
  <rect x="28" y="8" width="8" height="6" rx="2" fill="#4a6a9a"/>
  <rect x="52" y="14" width="8" height="6" rx="2" fill="#4a6a9a"/>
  <path d="M8 16 Q32 4 56 16" stroke="#5a8abb" stroke-width="1.5" fill="none" opacity="0.5" stroke-dasharray="3,3"/>
  <circle cx="32" cy="40" r="4" fill="#2a3a5a"/>
  <circle cx="32" cy="40" r="2" fill="#4a7aaa" opacity="0.8"/>
</svg>`,

};
