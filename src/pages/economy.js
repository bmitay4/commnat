import i18n from '../i18n.js';
const t = (k, p) => i18n.t(k, p);
const localName = (item) => i18n.language === 'he' && item.name_he ? item.name_he : item.name;
const localDesc = (item) => {
  const key = `economy.facilityDesc_${item.id}`;
  const tr = i18n.t(key, { defaultValue: '' });
  if (tr) return tr;
  return item.description || '';
};
import { renderPageTopbar, bindPageNav } from '../nav.js';
import { sb } from '../supabase.js';
import { formatTimeLeft } from '../utils.js';

const FACILITY_SVGS = {
  farm: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fm-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5a9a30"/><stop offset="100%" stop-color="#2e5a14"/>
    </linearGradient>
    <linearGradient id="fm-b" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#c03020"/><stop offset="100%" stop-color="#7a1610"/>
    </linearGradient>
  </defs>
  <!-- Field -->
  <rect x="0" y="46" width="64" height="18" fill="url(#fm-g)"/>
  <!-- Crop rows -->
  <line x1="4"  y1="50" x2="12" y2="58" stroke="#78c030" stroke-width="1.5" opacity="0.45"/>
  <line x1="10" y1="50" x2="18" y2="58" stroke="#78c030" stroke-width="1.5" opacity="0.45"/>
  <line x1="16" y1="50" x2="24" y2="58" stroke="#78c030" stroke-width="1.5" opacity="0.4"/>
  <!-- Silo -->
  <rect x="46" y="24" width="12" height="26" rx="6" fill="#c8c0a0"/>
  <rect x="46" y="24" width="12" height="4"  rx="2" fill="white" opacity="0.1"/>
  <ellipse cx="52" cy="24" rx="6" ry="3.5" fill="#b0a878"/>
  <!-- Barn body -->
  <rect x="10" y="32" width="36" height="24" rx="1" fill="url(#fm-b)"/>
  <!-- Barn roof (gable) -->
  <polygon points="28,10 6,32 56,32" fill="#8a1a10"/>
  <polygon points="28,10 6,32 18,32" fill="#a02010" opacity="0.5"/>
  <!-- Roof highlight -->
  <line x1="28" y1="10" x2="56" y2="32" stroke="white" stroke-width="0.5" opacity="0.1"/>
  <!-- Ridge -->
  <line x1="28" y1="10" x2="28" y2="6" stroke="#7a1808" stroke-width="2"/>
  <!-- Barn doors -->
  <rect x="21" y="40" width="14" height="16" rx="1" fill="#5a1008"/>
  <line x1="28" y1="40" x2="28" y2="56" stroke="#3a0808" stroke-width="1"/>
  <line x1="21" y1="48" x2="35" y2="48" stroke="#3a0808" stroke-width="1"/>
  <!-- Barn windows -->
  <rect x="12" y="34" width="6" height="5" rx="1" fill="#e8d880" opacity="0.65"/>
  <rect x="38" y="34" width="6" height="5" rx="1" fill="#e8d880" opacity="0.65"/>
  <!-- Weather vane -->
  <line x1="28" y1="5"  x2="28" y2="2"  stroke="#9a9a6a" stroke-width="1"/>
  <polygon points="28,2 25,4 31,4" fill="#e8c040" opacity="0.85"/>
</svg>`,

  mine: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mn-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6a5a3a"/><stop offset="100%" stop-color="#3a3020"/>
    </linearGradient>
    <linearGradient id="mn-b" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6a6a7a"/><stop offset="100%" stop-color="#3a3a48"/>
    </linearGradient>
  </defs>
  <!-- Rocky ground -->
  <rect x="0" y="50" width="64" height="14" fill="url(#mn-g)"/>
  <ellipse cx="10" cy="52" rx="4" ry="2" fill="#5a4a2a" opacity="0.5"/>
  <ellipse cx="52" cy="53" rx="3" ry="1.5" fill="#5a4a2a" opacity="0.4"/>
  <!-- Building -->
  <rect x="18" y="34" width="28" height="18" rx="2" fill="url(#mn-b)"/>
  <polygon points="32,16 14,34 50,34" fill="#5a5a6a"/>
  <!-- Headframe A-frame -->
  <line x1="32" y1="4"  x2="14" y2="34" stroke="#3a3a4a" stroke-width="3" stroke-linecap="round"/>
  <line x1="32" y1="4"  x2="50" y2="34" stroke="#3a3a4a" stroke-width="3" stroke-linecap="round"/>
  <line x1="18" y1="22" x2="46" y2="22" stroke="#3a3a4a" stroke-width="2"/>
  <line x1="22" y1="28" x2="42" y2="28" stroke="#3a3a4a" stroke-width="1.5" opacity="0.7"/>
  <!-- Pulley wheel -->
  <circle cx="32" cy="4" r="4" fill="#1e1e2a" stroke="#5a5a6a" stroke-width="1.5"/>
  <circle cx="32" cy="4" r="2" fill="#3a3a4a"/>
  <!-- Shaft entrance -->
  <rect x="26" y="40" width="12" height="12" rx="1" fill="#1a1a28"/>
  <!-- Building windows -->
  <rect x="20" y="36" width="5" height="5" rx="1" fill="#e8c840" opacity="0.5"/>
  <rect x="39" y="36" width="5" height="5" rx="1" fill="#e8c840" opacity="0.5"/>
  <!-- Ore cart + track -->
  <line x1="4"  y1="52" x2="20" y2="52" stroke="#5a5a5a" stroke-width="1.5"/>
  <rect x="5"  y="46" width="10" height="6" rx="1" fill="#5a4a2a"/>
  <circle cx="7"  cy="52" r="1.5" fill="#2a2a2a"/>
  <circle cx="13" cy="52" r="1.5" fill="#2a2a2a"/>
</svg>`,

  oil_rig: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="or-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5a4a28"/><stop offset="100%" stop-color="#2a2010"/>
    </linearGradient>
    <linearGradient id="or-t" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8a7060"/><stop offset="100%" stop-color="#5a4030"/>
    </linearGradient>
  </defs>
  <!-- Ground -->
  <rect x="0" y="52" width="64" height="12" fill="url(#or-g)"/>
  <!-- Storage tank -->
  <rect x="46" y="40" width="16" height="14" fill="#8a7860"/>
  <ellipse cx="54" cy="40" rx="8" ry="4" fill="#a89070"/>
  <ellipse cx="54" cy="40" rx="6" ry="2.5" fill="#c0a888" opacity="0.5"/>
  <!-- Pump house -->
  <rect x="26" y="42" width="18" height="12" rx="2" fill="url(#or-t)"/>
  <!-- Walking beam (pump jack arm) -->
  <rect x="16" y="26" width="38" height="4" rx="2" fill="#5a4828"/>
  <!-- Horse head -->
  <path d="M16 26 Q10 28 8 34 L14 34 Q14 30 16 28 Z" fill="#4a3820"/>
  <!-- Samson post -->
  <rect x="32" y="20" width="4" height="24" fill="#4a3820"/>
  <!-- Pitman arm -->
  <line x1="48" y1="28" x2="46" y2="40" stroke="#3a2818" stroke-width="3" stroke-linecap="round"/>
  <!-- Crank wheel -->
  <circle cx="46" cy="40" r="4" fill="#2a1e10" stroke="#4a3020" stroke-width="1.5"/>
  <!-- Polished rod / wellhead -->
  <rect x="9" y="34" width="4" height="18" rx="1" fill="#7a7a8a"/>
  <!-- Derrick lattice tower -->
  <line x1="20" y1="6"  x2="14" y2="42" stroke="#6a6a7a" stroke-width="2"/>
  <line x1="20" y1="6"  x2="26" y2="42" stroke="#6a6a7a" stroke-width="2"/>
  <line x1="14" y1="18" x2="26" y2="18" stroke="#6a6a7a" stroke-width="1.5"/>
  <line x1="14" y1="30" x2="26" y2="30" stroke="#6a6a7a" stroke-width="1.5"/>
  <line x1="14" y1="18" x2="26" y2="30" stroke="#6a6a7a" stroke-width="1" opacity="0.5"/>
  <line x1="26" y1="18" x2="14" y2="30" stroke="#6a6a7a" stroke-width="1" opacity="0.5"/>
  <!-- Warning beacon -->
  <circle cx="20" cy="6" r="2" fill="#ff4040" opacity="0.85"/>
</svg>`,

  factory: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fc-w" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5a5a6a"/><stop offset="100%" stop-color="#3a3a48"/>
    </linearGradient>
    <linearGradient id="fc-r" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#484858"/><stop offset="100%" stop-color="#2e2e3a"/>
    </linearGradient>
  </defs>
  <!-- Main building -->
  <rect x="4" y="32" width="56" height="26" rx="2" fill="url(#fc-w)"/>
  <!-- Sawtooth roof (factory skylights) -->
  <polygon points="4,32 4,42 14,32" fill="#6a6a7a"/>
  <polygon points="14,32 14,42 24,32" fill="#6a6a7a"/>
  <polygon points="24,32 24,42 34,32" fill="#6a6a7a"/>
  <polygon points="34,32 34,42 44,32" fill="#6a6a7a"/>
  <polygon points="44,32 44,42 54,32" fill="#6a6a7a"/>
  <!-- Skylight glass panels -->
  <polygon points="4,32 14,32 14,42" fill="#4a8aaa" opacity="0.35"/>
  <polygon points="14,32 24,32 24,42" fill="#4a8aaa" opacity="0.35"/>
  <polygon points="24,32 34,32 34,42" fill="#4a8aaa" opacity="0.35"/>
  <!-- Chimneys -->
  <rect x="10" y="10" width="8" height="24" rx="2" fill="url(#fc-r)"/>
  <rect x="24" y="16" width="7" height="18" rx="2" fill="url(#fc-r)"/>
  <rect x="38" y="12" width="7" height="22" rx="2" fill="url(#fc-r)"/>
  <!-- Chimney tops -->
  <rect x="9"  y="9"  width="10" height="3" rx="1" fill="#5a5a6a"/>
  <rect x="23" y="15" width="9"  height="3" rx="1" fill="#5a5a6a"/>
  <rect x="37" y="11" width="9"  height="3" rx="1" fill="#5a5a6a"/>
  <!-- Smoke puffs -->
  <ellipse cx="14" cy="8"  rx="5" ry="3" fill="#aaaaaa" opacity="0.35"/>
  <ellipse cx="27" cy="13" rx="4" ry="2.5" fill="#aaaaaa" opacity="0.3"/>
  <ellipse cx="41" cy="9"  rx="4" ry="2.5" fill="#aaaaaa" opacity="0.28"/>
  <!-- Windows -->
  <rect x="8"  y="40" width="8" height="7" rx="1" fill="#3a8aaa" opacity="0.65"/>
  <rect x="20" y="40" width="8" height="7" rx="1" fill="#3a8aaa" opacity="0.65"/>
  <rect x="36" y="40" width="8" height="7" rx="1" fill="#3a8aaa" opacity="0.65"/>
  <rect x="48" y="40" width="8" height="7" rx="1" fill="#3a8aaa" opacity="0.65"/>
  <!-- Loading dock -->
  <rect x="24" y="50" width="16" height="8" rx="1" fill="#2a2a38"/>
  <line x1="32" y1="50" x2="32" y2="58" stroke="#1a1a28" stroke-width="1"/>
</svg>`,

  power_plant: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pp-c" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8a9a8a"/><stop offset="100%" stop-color="#4a5a4a"/>
    </linearGradient>
    <linearGradient id="pp-b" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a5a4a"/><stop offset="100%" stop-color="#2a3a2a"/>
    </linearGradient>
  </defs>
  <!-- Main building -->
  <rect x="8" y="34" width="48" height="24" rx="2" fill="url(#pp-b)"/>
  <!-- Left cooling tower (hyperbolic) -->
  <path d="M8 14 Q12 28 10 42 Q14 46 20 46 Q26 46 28 42 Q28 28 24 14 Q20 10 16 10 Q12 10 8 14 Z" fill="url(#pp-c)"/>
  <!-- Right cooling tower -->
  <path d="M36 18 Q40 30 38 44 Q42 48 48 48 Q54 48 56 44 Q56 30 52 18 Q48 14 44 14 Q40 14 36 18 Z" fill="url(#pp-c)"/>
  <!-- Tower top openings -->
  <ellipse cx="18" cy="13" rx="8" ry="3" fill="#6a7a6a"/>
  <ellipse cx="46" cy="17" rx="8" ry="3" fill="#6a7a6a"/>
  <!-- Steam from towers -->
  <ellipse cx="14" cy="10" rx="6" ry="3.5" fill="white" opacity="0.3"/>
  <ellipse cx="18" cy="7"  rx="5" ry="3"   fill="white" opacity="0.2"/>
  <ellipse cx="44" cy="14" rx="6" ry="3.5" fill="white" opacity="0.28"/>
  <!-- Lightning bolt -->
  <polygon points="34,36 28,46 32,46 30,56 40,44 36,44" fill="#f0d030"/>
  <!-- Building windows -->
  <rect x="12" y="38" width="8" height="6" rx="1" fill="#3a6a3a" opacity="0.7"/>
  <rect x="44" y="38" width="8" height="6" rx="1" fill="#3a6a3a" opacity="0.7"/>
</svg>`,

  port: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pt-w" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a6aaa"/><stop offset="100%" stop-color="#0e3060"/>
    </linearGradient>
    <linearGradient id="pt-d" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#706050"/><stop offset="100%" stop-color="#3a3028"/>
    </linearGradient>
  </defs>
  <!-- Water -->
  <rect x="0" y="44" width="64" height="20" fill="url(#pt-w)"/>
  <path d="M0 48 Q16 44 32 48 Q48 52 64 48" fill="none" stroke="#1a5090" stroke-width="1.5" opacity="0.5"/>
  <!-- Pier/dock -->
  <rect x="4" y="42" width="56" height="5" rx="1" fill="url(#pt-d)"/>
  <!-- Pier planks -->
  <line x1="10" y1="42" x2="10" y2="47" stroke="#2e2820" stroke-width="0.8" opacity="0.5"/>
  <line x1="20" y1="42" x2="20" y2="47" stroke="#2e2820" stroke-width="0.8" opacity="0.5"/>
  <line x1="30" y1="42" x2="30" y2="47" stroke="#2e2820" stroke-width="0.8" opacity="0.5"/>
  <line x1="40" y1="42" x2="40" y2="47" stroke="#2e2820" stroke-width="0.8" opacity="0.5"/>
  <line x1="50" y1="42" x2="50" y2="47" stroke="#2e2820" stroke-width="0.8" opacity="0.5"/>
  <!-- Warehouse -->
  <rect x="4" y="28" width="26" height="16" rx="1" fill="#5a5a6a"/>
  <polygon points="4,28 17,20 30,28" fill="#4a4a5a"/>
  <rect x="10" y="32" width="6" height="6" rx="1" fill="#3a8aaa" opacity="0.6"/>
  <!-- Ship in harbor -->
  <path d="M32 50 Q34 46 40 44 L58 44 Q60 46 60 50 L56 54 Q44 56 36 54 Z" fill="#3a4858"/>
  <rect x="40" y="38" width="10" height="8" rx="1" fill="#2e3848"/>
  <rect x="42" y="34" width="6" height="6" rx="1" fill="#263040"/>
  <!-- Porthole -->
  <circle cx="36" cy="50" r="1.5" fill="#4a8aaa" opacity="0.7"/>
  <circle cx="42" cy="50" r="1.5" fill="#4a8aaa" opacity="0.7"/>
  <!-- Crane -->
  <rect x="28" y="10" width="4" height="34" fill="#6a6a7a"/>
  <rect x="28" y="10" width="28" height="3" rx="1" fill="#6a6a7a"/>
  <line x1="56" y1="13" x2="56" y2="42" stroke="#5a5a6a" stroke-width="1.5" stroke-dasharray="2,2"/>
  <!-- Crane support cable -->
  <line x1="28" y1="10" x2="40" y2="10" stroke="#8a8a9a" stroke-width="1"/>
</svg>`,

  tech_lab: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tl-b" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a2a4a"/><stop offset="100%" stop-color="#14142e"/>
    </linearGradient>
    <linearGradient id="tl-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e3a5a"/><stop offset="100%" stop-color="#0a1e38"/>
    </linearGradient>
  </defs>
  <!-- Main building -->
  <rect x="8" y="26" width="48" height="32" rx="3" fill="url(#tl-b)"/>
  <!-- Glass facade panels -->
  <rect x="10" y="28" width="14" height="20" rx="1" fill="url(#tl-g)"/>
  <rect x="26" y="28" width="14" height="20" rx="1" fill="url(#tl-g)"/>
  <rect x="42" y="28" width="12" height="20" rx="1" fill="url(#tl-g)"/>
  <!-- Glowing window tints -->
  <rect x="10" y="28" width="14" height="20" rx="1" fill="#4a7aff" opacity="0.18"/>
  <rect x="26" y="28" width="14" height="20" rx="1" fill="#7a4aff" opacity="0.15"/>
  <rect x="42" y="28" width="12" height="20" rx="1" fill="#4affaa" opacity="0.13"/>
  <!-- Window reflections -->
  <line x1="11" y1="28" x2="11" y2="48" stroke="white" stroke-width="0.8" opacity="0.1"/>
  <line x1="27" y1="28" x2="27" y2="48" stroke="white" stroke-width="0.8" opacity="0.1"/>
  <!-- Roof equipment -->
  <rect x="10" y="20" width="44" height="8" rx="2" fill="#1e1e38"/>
  <!-- Satellite dish -->
  <rect x="14" y="12" width="2" height="10" fill="#3a3a58"/>
  <path d="M8 12 Q15 6 22 12" fill="none" stroke="#4a6aaa" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Antenna array -->
  <line x1="36" y1="8"  x2="36" y2="20" stroke="#3a3a58" stroke-width="1.5"/>
  <line x1="32" y1="12" x2="40" y2="12" stroke="#3a3a58" stroke-width="1"/>
  <line x1="44" y1="10" x2="44" y2="20" stroke="#3a3a58" stroke-width="1.5"/>
  <!-- Glow dots (active status) -->
  <circle cx="20" cy="22" r="1.5" fill="#4a7aff" opacity="0.9"/>
  <circle cx="32" cy="22" r="1.5" fill="#7a4aff" opacity="0.9"/>
  <circle cx="44" cy="22" r="1.5" fill="#4affaa" opacity="0.9"/>
  <!-- Floor line -->
  <rect x="8" y="56" width="48" height="4" rx="1" fill="#1a1a30"/>
</svg>`,

  bank: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bk-f" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d4b040"/><stop offset="100%" stop-color="#8a7020"/>
    </linearGradient>
    <linearGradient id="bk-r" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#c8a030"/><stop offset="100%" stop-color="#806010"/>
    </linearGradient>
    <linearGradient id="bk-w" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e8e0c0"/><stop offset="100%" stop-color="#c8b888"/>
    </linearGradient>
  </defs>
  <!-- Base steps -->
  <rect x="6"  y="54" width="52" height="5" rx="1" fill="#7a6018"/>
  <rect x="8"  y="50" width="48" height="5" rx="1" fill="#8a7020"/>
  <rect x="10" y="46" width="44" height="5" rx="1" fill="#9a8030"/>
  <!-- Main facade -->
  <rect x="12" y="28" width="40" height="20" rx="1" fill="url(#bk-w)"/>
  <!-- Entablature (frieze above columns) -->
  <rect x="8"  y="24" width="48" height="6" rx="1" fill="url(#bk-f)"/>
  <!-- Columns -->
  <rect x="14" y="28" width="4" height="18" rx="2" fill="#d0c898"/>
  <rect x="22" y="28" width="4" height="18" rx="2" fill="#d0c898"/>
  <rect x="30" y="28" width="4" height="18" rx="2" fill="#d0c898"/>
  <rect x="38" y="28" width="4" height="18" rx="2" fill="#d0c898"/>
  <rect x="46" y="28" width="4" height="18" rx="2" fill="#d0c898"/>
  <!-- Column capitals (tops) -->
  <rect x="13" y="28" width="6" height="2" rx="1" fill="#c8c090"/>
  <rect x="21" y="28" width="6" height="2" rx="1" fill="#c8c090"/>
  <rect x="29" y="28" width="6" height="2" rx="1" fill="#c8c090"/>
  <rect x="37" y="28" width="6" height="2" rx="1" fill="#c8c090"/>
  <rect x="45" y="28" width="6" height="2" rx="1" fill="#c8c090"/>
  <!-- Pediment (triangular roof) -->
  <polygon points="32,8 6,24 58,24" fill="url(#bk-r)"/>
  <!-- Pediment highlight -->
  <line x1="32" y1="8" x2="6"  y2="24" stroke="white" stroke-width="0.5" opacity="0.15"/>
  <line x1="32" y1="8" x2="58" y2="24" stroke="white" stroke-width="0.5" opacity="0.15"/>
  <!-- Door -->
  <rect x="28" y="36" width="8" height="12" rx="1" fill="#8a6818"/>
  <rect x="30" y="38" width="4" height="5"  rx="0.5" fill="#e8c040" opacity="0.4"/>
  <!-- Dollar sign emblem -->
  <text x="32" y="20" text-anchor="middle" font-size="7" fill="#e8d060" opacity="0.7" font-family="serif">$</text>
</svg>`,

  market: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mk-f" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a3040"/><stop offset="100%" stop-color="#1e1828"/>
    </linearGradient>
  </defs>
  <!-- Building base -->
  <rect x="4" y="32" width="56" height="26" rx="2" fill="url(#mk-f)"/>
  <!-- Left stall awning (red) -->
  <polygon points="4,32 4,22 22,22 22,32" fill="#c03020"/>
  <line x1="4"  y1="26" x2="22" y2="26" stroke="#a02010" stroke-width="1.5" opacity="0.6"/>
  <line x1="4"  y1="29" x2="22" y2="29" stroke="#a02010" stroke-width="1"   opacity="0.4"/>
  <!-- Middle stall awning (gold) -->
  <polygon points="22,32 22,20 42,20 42,32" fill="#c89020"/>
  <line x1="22" y1="24" x2="42" y2="24" stroke="#a07010" stroke-width="1.5" opacity="0.6"/>
  <line x1="22" y1="28" x2="42" y2="28" stroke="#a07010" stroke-width="1"   opacity="0.4"/>
  <!-- Right stall awning (blue) -->
  <polygon points="42,32 42,22 60,22 60,32" fill="#2050a0"/>
  <line x1="42" y1="26" x2="60" y2="26" stroke="#1840808" stroke-width="1.5" opacity="0.6"/>
  <line x1="42" y1="29" x2="60" y2="29" stroke="#183080" stroke-width="1"   opacity="0.4"/>
  <!-- Stall poles -->
  <rect x="4"  y="22" width="2" height="36" fill="#2a2030"/>
  <rect x="22" y="20" width="2" height="38" fill="#2a2030"/>
  <rect x="42" y="20" width="2" height="38" fill="#2a2030"/>
  <rect x="60" y="22" width="2" height="36" fill="#2a2030"/>
  <!-- Goods on display -->
  <circle cx="12" cy="38" r="3"   fill="#e84040" opacity="0.8"/>
  <circle cx="19" cy="40" r="2.5" fill="#e8c040" opacity="0.8"/>
  <rect x="26" y="35" width="5" height="5" rx="1" fill="#4a8a4a" opacity="0.7"/>
  <rect x="33" y="36" width="5" height="4" rx="1" fill="#8a4a2a" opacity="0.7"/>
  <circle cx="50" cy="38" r="3"   fill="#4a6ae8" opacity="0.7"/>
  <!-- Floor line -->
  <line x1="4" y1="32" x2="60" y2="32" stroke="#1a1420" stroke-width="1.5"/>
</svg>`,

  solar: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sl-p" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2060a8"/><stop offset="100%" stop-color="#0e3870"/>
    </linearGradient>
    <linearGradient id="sl-p2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2878c0"/><stop offset="100%" stop-color="#124080"/>
    </linearGradient>
  </defs>
  <!-- Sun -->
  <circle cx="32" cy="14" r="8" fill="#f0d030"/>
  <circle cx="32" cy="14" r="5" fill="#f8e060"/>
  <!-- Sun rays -->
  <line x1="32" y1="4"  x2="32" y2="1"  stroke="#f0d030" stroke-width="2" stroke-linecap="round"/>
  <line x1="42" y1="7"  x2="44" y2="5"  stroke="#f0d030" stroke-width="2" stroke-linecap="round"/>
  <line x1="46" y1="14" x2="49" y2="14" stroke="#f0d030" stroke-width="2" stroke-linecap="round"/>
  <line x1="42" y1="21" x2="44" y2="23" stroke="#f0d030" stroke-width="2" stroke-linecap="round"/>
  <line x1="22" y1="7"  x2="20" y2="5"  stroke="#f0d030" stroke-width="2" stroke-linecap="round"/>
  <line x1="18" y1="14" x2="15" y2="14" stroke="#f0d030" stroke-width="2" stroke-linecap="round"/>
  <line x1="22" y1="21" x2="20" y2="23" stroke="#f0d030" stroke-width="2" stroke-linecap="round"/>
  <!-- Solar panel array (two rows, angled) -->
  <!-- Row 1 -->
  <polygon points="6,44 16,30 26,30 16,44" fill="url(#sl-p)"/>
  <polygon points="16,44 26,30 36,30 26,44" fill="url(#sl-p2)"/>
  <polygon points="26,44 36,30 46,30 36,44" fill="url(#sl-p)"/>
  <polygon points="36,44 46,30 56,30 46,44" fill="url(#sl-p2)"/>
  <!-- Panel grid lines -->
  <line x1="11" y1="37" x2="21" y2="37" stroke="#1a4888" stroke-width="0.8" opacity="0.7"/>
  <line x1="21" y1="37" x2="31" y2="37" stroke="#1a4888" stroke-width="0.8" opacity="0.7"/>
  <line x1="31" y1="37" x2="41" y2="37" stroke="#1a4888" stroke-width="0.8" opacity="0.7"/>
  <line x1="41" y1="37" x2="51" y2="37" stroke="#1a4888" stroke-width="0.8" opacity="0.7"/>
  <!-- Panel vertical dividers -->
  <line x1="16" y1="30" x2="16" y2="44" stroke="#1a4888" stroke-width="0.8" opacity="0.6"/>
  <line x1="26" y1="30" x2="26" y2="44" stroke="#1a4888" stroke-width="0.8" opacity="0.6"/>
  <line x1="36" y1="30" x2="36" y2="44" stroke="#1a4888" stroke-width="0.8" opacity="0.6"/>
  <line x1="46" y1="30" x2="46" y2="44" stroke="#1a4888" stroke-width="0.8" opacity="0.6"/>
  <!-- Support legs -->
  <line x1="11" y1="44" x2="11" y2="52" stroke="#3a5a3a" stroke-width="2"/>
  <line x1="31" y1="44" x2="31" y2="52" stroke="#3a5a3a" stroke-width="2"/>
  <line x1="51" y1="44" x2="51" y2="52" stroke="#3a5a3a" stroke-width="2"/>
  <rect x="4" y="52" width="56" height="3" rx="1" fill="#2a4a2a"/>
</svg>`,

  airport: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ap2-r" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#505060"/><stop offset="100%" stop-color="#303038"/>
    </linearGradient>
    <linearGradient id="ap2-t" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#405068"/><stop offset="100%" stop-color="#203040"/>
    </linearGradient>
  </defs>
  <!-- Runway -->
  <rect x="0" y="48" width="64" height="14" rx="2" fill="url(#ap2-r)"/>
  <!-- Runway center line -->
  <line x1="4"  y1="55" x2="14" y2="55" stroke="white" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.5"/>
  <line x1="20" y1="55" x2="30" y2="55" stroke="white" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.5"/>
  <line x1="36" y1="55" x2="46" y2="55" stroke="white" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.5"/>
  <line x1="52" y1="55" x2="62" y2="55" stroke="white" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.5"/>
  <!-- Terminal building -->
  <rect x="4" y="34" width="38" height="16" rx="2" fill="#4a5a6a"/>
  <!-- Terminal roof -->
  <rect x="4" y="30" width="38" height="6" rx="1" fill="#3a4858"/>
  <!-- Terminal windows -->
  <rect x="8"  y="36" width="6" height="6" rx="1" fill="#4a8aaa" opacity="0.7"/>
  <rect x="17" y="36" width="6" height="6" rx="1" fill="#4a8aaa" opacity="0.7"/>
  <rect x="26" y="36" width="6" height="6" rx="1" fill="#4a8aaa" opacity="0.7"/>
  <rect x="35" y="36" width="5" height="6" rx="1" fill="#4a8aaa" opacity="0.7"/>
  <!-- Jet bridge / gate -->
  <rect x="38" y="40" width="8" height="4" rx="1" fill="#3a4858"/>
  <!-- Control tower -->
  <rect x="48" y="20" width="12" height="30" rx="2" fill="url(#ap2-t)"/>
  <rect x="44" y="16" width="20" height="8"  rx="3" fill="#3060a0"/>
  <!-- Tower windows (cab) -->
  <rect x="46" y="18" width="5" height="4" rx="0.5" fill="#80c0e8" opacity="0.85"/>
  <rect x="53" y="18" width="5" height="4" rx="0.5" fill="#80c0e8" opacity="0.85"/>
  <!-- Beacon light -->
  <circle cx="54" cy="14" r="2.5" fill="#ff4040" opacity="0.9"/>
  <!-- Aircraft on runway -->
  <polygon points="30,50 18,52 18,54 30,52 42,54 42,52" fill="#8a8a9a"/>
  <polygon points="30,50 30,46 26,50" fill="#7a7a8a"/>
  <polygon points="30,50 30,46 34,50" fill="#7a7a8a"/>
</svg>`,
};

export async function renderEconomy(user, profile, nation) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="page"><div style="font-family:var(--font-mono);font-size:13px;color:var(--text-muted);letter-spacing:2px;">${t('economy.loading')}</div></div>`;

  const [
    { data: facilityTypes },
    { data: facilities },
    { data: incomeLogs },
  ] = await Promise.all([
    sb.from('facility_types').select('*').order('sort_order'),
    sb.from('facilities').select('*').eq('nation_id', nation.id),
    sb.from('income_logs').select('*').eq('nation_id', nation.id)
      .order('logged_at', { ascending: false }).limit(6),
  ]);

  const facMap = Object.fromEntries((facilities || []).map(f => [f.facility_type_id, f.quantity]));

  // Compute totals
  let totalIncome = 0, totalUpkeep = 0, landUsed = 0;
  (facilityTypes || []).forEach(ft => {
    const qty = facMap[ft.id] || 0;
    totalIncome += qty * ft.income_per_hour;
    totalUpkeep += qty * ft.maintenance_per_hour;
    landUsed    += qty * ft.land_required;
  });
  
  // Apply security penalty to income
  // Income is reduced based on security, but cannot drop below 40%
  // Formula: income * (0.4 + (security / 100) * 0.6)
  const securityMultiplier = 0.4 + (nation.security_index / 100) * 0.6;
  const baseIncome = totalIncome;
  totalIncome = Math.floor(totalIncome * securityMultiplier);
  
  const netIncome = totalIncome - totalUpkeep;
  const landFree = nation.land - landUsed;

  // Next income countdown
  const nextIncomeMs = new Date(nation.last_income_at).getTime() + 3600000 - Date.now();

  app.innerHTML = `
    ${renderPageTopbar(user, profile, nation, 'economy')}
    <div class="inner-page-wide">

      <!-- Page title -->
      <div class="inner-topbar">
        <div class="inner-title-wrap">
          <span style="font-size:24px;">🏭</span>
          <div>
            <div class="inner-title">${t('economy.title')}</div>
            <div class="inner-sub">${nation.name}</div>
          </div>
        </div>
      </div>

      <!-- Stats bar -->
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:1.2rem;">
        ${eStat('💰', t('economy.treasury'),    '$' + nation.money.toLocaleString(),   'var(--accent)')}
        ${eStat('📈', t('economy.incomeHr'),   '+$' + totalIncome.toLocaleString(),   '#16a34a')}
        ${eStat('🔧', t('economy.upkeepHr'),   '-$' + totalUpkeep.toLocaleString(),  '#e05252')}
        ${eStat('💵', t('economy.netHr'),      (netIncome >= 0 ? '+' : '') + '$' + netIncome.toLocaleString(), netIncome >= 0 ? '#16a34a' : '#e05252')}
        ${eStat('🗺️', t('economy.land'),        t('economy.landUsed', { used: landUsed, total: nation.land }),    landFree <= 5 ? '#e05252' : 'var(--text-muted)')}
      </div>

      <!-- Income countdown -->
      <div style="background:var(--surface);border:1.5px solid var(--border);
        border-inline-start:3px solid #16a34a;border-radius:0 8px 8px 0;padding:10px 1.5rem;
        margin-bottom:1.2rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);">
          ${t('economy.nextIncome')} <strong id="income-countdown" style="color:#16a34a;font-size:15px;">--:--</strong>
        </div>
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">
          ${t('economy.projected')} <strong style="color:#16a34a;">${netIncome >= 0 ? '+' : ''}${netIncome.toLocaleString()}</strong> ${t('economy.net')}
          &nbsp;·&nbsp;
          ${t('economy.securityBonus')} <strong style="color:var(--accent);">${getSecurityLabel(nation.security_index)}</strong>
        </div>
      </div>

      <!-- Order bar -->
      <div id="order-bar" style="display:none;width:100%;max-width:1000px;background:rgba(22,163,74,0.06);
        border:1.5px solid rgba(22,163,74,0.3);border-radius:8px;padding:10px 1.5rem;
        margin-bottom:1rem;display:none;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);">
          ${t('economy.buildCost')}: <strong id="order-total" style="color:#16a34a;font-size:15px;">$0</strong>
          &nbsp;·&nbsp; ${t('economy.orderLand')}: <strong id="order-land" style="color:var(--accent);">0</strong>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn-logout" id="btn-clear-order" style="font-size:11px;padding:6px 12px;">${t('economy.clearBtn')}</button>
          <button class="btn-submit" id="btn-build-all"
            style="width:auto;padding:8px 20px;font-size:14px;letter-spacing:1px;border-radius:6px;background:#16a34a;">
            ${t('economy.buildAllBtn')}
          </button>
        </div>
      </div>

      <!-- Facilities table -->
      <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:1rem;">
        <table style="width:100%;border-collapse:collapse;">
          <colgroup>
            <col style="width:56px">
            <col style="min-width:140px">
            <col style="width:80px">
            <col style="width:90px">
            <col style="width:90px">
            <col style="width:70px">
            <col style="width:80px">
            <col style="width:90px">
            <col style="width:60px">
          </colgroup>
          <thead>
            <tr style="background:var(--surface2);border-bottom:1.5px solid var(--border);">
              <th style="${thStyle()}"></th>
              <th style="${thStyle()}text-align:start;">${t('economy.facility')}</th>
              <th style="${thStyle()}">${t('economy.incomeCol')}</th>
              <th style="${thStyle()}">${t('economy.upkeepCol')}</th>
              <th style="${thStyle()}">${t('economy.buildCostCol')}</th>
              <th style="${thStyle()}">${t('economy.landCol')}</th>
              <th style="${thStyle()}">${t('economy.ownedCol')}</th>
              <th style="${thStyle()}">${t('economy.buildQtyCol')}</th>
              <th style="${thStyle()}"></th>
            </tr>
          </thead>
          <tbody>
            ${(facilityTypes || []).map(ft => facilityRow(ft, facMap[ft.id] || 0)).join('')}
          </tbody>
        </table>
      </div>

      <!-- Build result -->
      <div class="msg" id="build-msg" style="margin-bottom:1rem;"></div>

      <!-- Demolish section -->
      <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:8px;padding:1.2rem 1.5rem;margin-bottom:1rem;">
        <div style="font-family:var(--font-title);font-size:16px;letter-spacing:2px;color:var(--text-muted);margin-bottom:0.8rem;">${t('economy.demolishTitle')}</div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <select id="demo-type" style="background:var(--surface2);border:1.5px solid var(--border);border-radius:6px;
            color:var(--text);font-family:var(--font-mono);font-size:13px;padding:8px 10px;outline:none;flex:1;min-width:160px;">
            <option value="">${t('economy.selectFacility')}</option>
            ${(facilityTypes||[]).filter(ft=>(facMap[ft.id]||0)>0).map(ft=>
              `<option value="${ft.id}">${localName(ft)} ${t('economy.ownedSuffix', { count: facMap[ft.id]||0 })}</option>`
            ).join('')}
          </select>
          <input type="number" id="demo-amount" placeholder="${t('economy.qtyPlaceholder')}" min="1"
            style="width:90px;background:var(--surface2);border:1.5px solid var(--border);border-radius:6px;
            color:var(--text);font-family:var(--font-mono);font-size:13px;padding:8px 10px;outline:none;"/>
          <button class="btn-logout" id="btn-demolish" style="padding:8px 16px;font-size:12px;">${t('economy.demolishBtn')}</button>
        </div>
        <div class="msg" id="demo-msg" style="margin-top:8px;"></div>
      </div>

      <!-- Income history -->
      ${incomeLogs?.length ? `
        <div style="background:var(--surface);border:1.5px solid var(--border);
          border-radius:8px;padding:1.2rem 1.5rem;margin-bottom:1rem;">
          <div style="font-family:var(--font-title);font-size:15px;letter-spacing:2px;color:var(--text-muted);margin-bottom:0.8rem;">${t('economy.recentIncome')}</div>
          <table style="width:100%;border-collapse:collapse;font-family:var(--font-mono);font-size:11px;">
            <thead><tr style="border-bottom:1px solid var(--border);">
              <th style="padding:5px 8px;color:var(--text-muted);text-align:start;font-weight:400;">${t('economy.time')}</th>
              <th style="padding:5px 8px;color:#16a34a;text-align:center;">${t('economy.income')}</th>
              <th style="padding:5px 8px;color:#e05252;text-align:center;">${t('economy.upkeep')}</th>
              <th style="padding:5px 8px;color:var(--accent);text-align:center;">${t('economy.net')}</th>
              <th style="padding:5px 8px;color:var(--text-muted);text-align:end;">${t('economy.balance')}</th>
            </tr></thead>
            <tbody>
              ${incomeLogs.map(l=>`
                <tr style="border-bottom:1px solid var(--border-dim);">
                  <td style="padding:5px 8px;color:var(--text-muted);">${new Date(l.logged_at).toLocaleString()}</td>
                  <td style="padding:5px 8px;color:#16a34a;text-align:center;">+$${l.total_income.toLocaleString()}</td>
                  <td style="padding:5px 8px;color:#e05252;text-align:center;">-$${l.total_upkeep.toLocaleString()}</td>
                  <td style="padding:5px 8px;text-align:center;color:${l.net_income>=0?'#16a34a':'#e05252'};">
                    ${l.net_income>=0?'+':''}$${l.net_income.toLocaleString()}
                  </td>
                  <td style="padding:5px 8px;color:var(--accent);text-align:end;">$${l.money_after.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

    </div>
  `;

  startIncomeCountdown(nation.last_income_at, user, profile, nation);
  bindEconomyEvents(user, profile, nation, facMap, facilityTypes, landFree);
}

// ─── Facility row ─────────────────────────────────────────────────────────────

function facilityRow(ft, owned) {
  const svg = FACILITY_SVGS[ft.id] || '';
  const net = ft.income_per_hour - ft.maintenance_per_hour;
  return `
    <tr class="fac-row" data-id="${ft.id}"
      style="border-bottom:1px solid var(--border-dim);transition:background 0.15s;"
      onmouseenter="this.style.background='var(--surface2)'"
      onmouseleave="this.style.background=''">
      <td style="padding:8px;text-align:center;">
        <div style="width:44px;height:44px;margin:0 auto;background:var(--surface2);border-radius:6px;
          overflow:hidden;padding:4px;border:1px solid var(--border);">${svg}</div>
      </td>
      <td style="padding:8px;">
        <div style="font-family:var(--font-title);font-size:14px;letter-spacing:1px;color:var(--text);">${localName(ft).toUpperCase()}</div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:1px;">${localDesc(ft)}</div>
      </td>
      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#16a34a;font-weight:700;">
        +$${ft.income_per_hour.toLocaleString()}
      </td>
      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#e05252;">
        -$${ft.maintenance_per_hour.toLocaleString()}
      </td>
      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:12px;color:var(--accent);">
        $${ft.build_cost.toLocaleString()}
      </td>
      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:12px;color:var(--text-muted);">
        ${ft.land_required} 🗺️
      </td>
      <td style="padding:8px;text-align:center;font-family:var(--font-title);font-size:16px;
        color:${owned > 0 ? '#16a34a' : 'var(--text-muted)'};">
        ${owned}
      </td>
      <td style="padding:8px;text-align:center;">
        <input type="number" class="fac-qty" data-id="${ft.id}"
          data-cost="${ft.build_cost}" data-land="${ft.land_required}" data-name="${ft.name}"
          placeholder="0" min="0"
          style="width:65px;background:var(--surface2);border:1.5px solid var(--border);border-radius:5px;
          color:var(--text);font-family:var(--font-mono);font-size:12px;padding:5px 6px;outline:none;text-align:center;"
          oninput="updateEconOrder()" />
      </td>
      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:11px;color:#16a34a;"
        id="fac-row-total-${ft.id}"></td>
    </tr>
  `;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function eStat(icon, label, value, color) {
  return `
    <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:8px;padding:0.8rem;text-align:center;">
      <div style="font-size:16px;margin-bottom:2px;">${icon}</div>
      <div style="font-family:var(--font-title);font-size:18px;letter-spacing:1px;color:${color};">${value}</div>
      <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:1px;text-transform:uppercase;">${label}</div>
    </div>
  `;
}

function thStyle() {
  return 'padding:8px;font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:1.5px;text-transform:uppercase;text-align:center;';
}

function getSecurityLabel(idx) {
  if (idx >= 80) return t('economy.securityFullIncome');
  if (idx >= 50) return t('economy.securityReduced', { pct: idx });
  return t('economy.securityCritical');
}

function showMsg(id, type, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'msg ' + type + ' show';
  if (type === 'success') setTimeout(() => el.className = 'msg', 4000);
}

function startIncomeCountdown(lastIncomeAt, user, profile, nation) {
  const el = document.getElementById('income-countdown');
  if (!el) return;
  let wasOverdue = false;
  function update() {
    if (!document.getElementById('income-countdown')) return;
    const diff = new Date(lastIncomeAt).getTime() + 3600000 - Date.now();
    if (diff <= 0) {
      el.textContent = t('economy.collecting');
      el.style.color = '#16a34a';
      // Poll DB every 5s until last_income_at changes (collection happened)
      if (!wasOverdue) wasOverdue = true;
      setTimeout(async () => {
        if (!document.getElementById('income-countdown')) return;
        const { data } = await sb.from('nations').select('last_income_at').eq('id', nation.id).single();
        if (data && data.last_income_at !== lastIncomeAt) {
          // Income collected — reload the economy page
          const { renderEconomy } = await import('./economy.js');
          renderEconomy(user, profile, { ...nation, last_income_at: data.last_income_at });
        } else {
          update();
        }
      }, 5000);
      return;
    }
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    setTimeout(update, 1000);
  }
  update();
}

// Global order updater
window.updateEconOrder = function() {
  let total = 0, land = 0, count = 0;
  document.querySelectorAll('.fac-qty').forEach(input => {
    const qty = parseInt(input.value) || 0;
    const cost = parseInt(input.getAttribute('data-cost')) || 0;
    const landReq = parseInt(input.getAttribute('data-land')) || 0;
    const lineCost = qty * cost;
    const lineLand = qty * landReq;
    total += lineCost;
    land  += lineLand;
    if (qty > 0) count++;
    const rowTotal = document.getElementById('fac-row-total-' + input.getAttribute('data-id'));
    if (rowTotal) {
      rowTotal.textContent = qty > 0 ? '$' + lineCost.toLocaleString() : '';
    }
  });

  const bar = document.getElementById('order-bar');
  const totalEl = document.getElementById('order-total');
  const landEl  = document.getElementById('order-land');
  if (bar) bar.style.display = total > 0 ? 'flex' : 'none';
  if (totalEl) totalEl.textContent = '$' + total.toLocaleString();
  if (landEl)  landEl.textContent  = land;
};

// ─── Events ───────────────────────────────────────────────────────────────────

function bindEconomyEvents(user, profile, nation, facMap, facilityTypes, landFree) {
  bindPageNav(user, profile, nation);

  // Clear order
  document.getElementById('btn-clear-order')?.addEventListener('click', () => {
    document.querySelectorAll('.fac-qty').forEach(i => i.value = '');
    document.querySelectorAll('[id^="fac-row-total-"]').forEach(el => el.textContent = '');
    window.updateEconOrder();
  });

  // Build All
  document.getElementById('btn-build-all')?.addEventListener('click', async () => {
    const orders = [];
    let grandCost = 0, grandLand = 0;

    document.querySelectorAll('.fac-qty').forEach(input => {
      const qty = parseInt(input.value) || 0;
      if (qty <= 0) return;
      const id   = input.getAttribute('data-id');
      const cost = parseInt(input.getAttribute('data-cost'));
      const land = parseInt(input.getAttribute('data-land'));
      const name = input.getAttribute('data-name');
      orders.push({ id, qty, cost, land, name, lineCost: qty * cost, lineLand: qty * land });
      grandCost += qty * cost;
      grandLand += qty * land;
    });

    if (!orders.length) return;

    if (grandCost > nation.money) {
      showMsg('build-msg', 'error', `${t('economy.errExceedsTreasury',{total:grandCost.toLocaleString(),balance:nation.money.toLocaleString()})}`);
      return;
    }
    if (grandLand > landFree) {
      showMsg('build-msg', 'error', t('economy.errNotEnoughLand',{need:grandLand,have:landFree}));
      return;
    }

    const btn = document.getElementById('btn-build-all');
    btn.disabled = true; btn.textContent = t('economy.building');

    let failed = false;
    for (const order of orders) {
      const current = facMap[order.id] || 0;
      const { error } = await sb.from('facilities').upsert({
        nation_id: nation.id,
        facility_type_id: order.id,
        quantity: current + order.qty,
      }, { onConflict: 'nation_id,facility_type_id' });
      if (error) { showMsg('build-msg', 'error', error.message); failed = true; break; }
      facMap[order.id] = current + order.qty;
    }

    if (!failed) {
      await sb.from('nations').update({ money: nation.money - grandCost }).eq('id', nation.id);
      try {
        await sb.from('activity_logs').insert({
          user_id: user.id, nation_id: nation.id, action: 'build_facilities',
          details: { orders: orders.map(o => ({ id: o.id, qty: o.qty })), total: grandCost },
        });
      } catch (_) {}
      const summary = orders.map(o => `${o.qty}× ${o.name}`).join(', ');
      showMsg('build-msg', 'success', t('economy.buildSuccess',{summary,cost:grandCost.toLocaleString()}));
      nation.money -= grandCost;
      // Security gain: +1% per facility built, capped at 100
      const totalBuilt = orders.reduce((s, o) => s + o.qty, 0);
      const secGain = totalBuilt;
      const newSec = Math.min(100, (nation.security_index || 0) + secGain);
      if (secGain > 0) await sb.from('nations').update({ security_index: newSec }).eq('id', nation.id);
      nation.security_index = newSec;
      setTimeout(() => renderEconomy(user, profile, { ...nation }), 1500);
    }

    btn.disabled = false; btn.textContent = t('economy.buildAllBtn');
  });

  // Demolish
  document.getElementById('btn-demolish')?.addEventListener('click', async () => {
    const typeId = document.getElementById('demo-type').value;
    const qty    = parseInt(document.getElementById('demo-amount').value);
    if (!typeId) { showMsg('demo-msg', 'error', t('economy.selectFacility')); return; }
    if (!qty || qty < 1) { showMsg('demo-msg', 'error', t('military.errEnterQty')); return; }
    const owned = facMap[typeId] || 0;
    if (qty > owned) { showMsg('demo-msg', 'error', t('economy.errOnlyOwned',{count:owned})); return; }
    const ft = facilityTypes.find(f => f.id === typeId);
    const refund = Math.floor(qty * ft.build_cost * 0.3);
    if (!confirm(t('economy.demolishConfirm', { qty, name: localName(ft), refund: refund.toLocaleString() }))) return;

    const newQty = owned - qty;
    const { error } = newQty > 0
      ? await sb.from('facilities').update({ quantity: newQty })
          .eq('nation_id', nation.id).eq('facility_type_id', typeId)
      : await sb.from('facilities').delete()
          .eq('nation_id', nation.id).eq('facility_type_id', typeId);

    if (!error) {
      await sb.from('nations').update({ money: nation.money + refund }).eq('id', nation.id);
      showMsg('demo-msg', 'success', t('economy.demolishSuccess',{qty,name:localName(ft),refund:refund.toLocaleString()}));
      setTimeout(() => renderEconomy(user, profile, { ...nation, money: nation.money + refund }), 1500);
    } else {
      showMsg('demo-msg', 'error', error.message);
    }
  });
}
