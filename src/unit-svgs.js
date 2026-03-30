// Hand-crafted SVG icons for each military unit — original artwork, no copyright

export const UNIT_SVGS = {

tank: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tk-h" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6b7c38"/><stop offset="100%" stop-color="#3a4520"/>
    </linearGradient>
    <linearGradient id="tk-t" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7e9040"/><stop offset="100%" stop-color="#4a5628"/>
    </linearGradient>
    <linearGradient id="tk-tr" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#252c14"/><stop offset="100%" stop-color="#111508"/>
    </linearGradient>
  </defs>
  <!-- Tracks -->
  <rect x="3" y="46" width="58" height="13" rx="6" fill="url(#tk-tr)"/>
  <line x1="11" y1="46" x2="11" y2="59" stroke="#0a0d04" stroke-width="1" opacity="0.5"/>
  <line x1="19" y1="46" x2="19" y2="59" stroke="#0a0d04" stroke-width="1" opacity="0.5"/>
  <line x1="27" y1="46" x2="27" y2="59" stroke="#0a0d04" stroke-width="1" opacity="0.5"/>
  <line x1="35" y1="46" x2="35" y2="59" stroke="#0a0d04" stroke-width="1" opacity="0.5"/>
  <line x1="43" y1="46" x2="43" y2="59" stroke="#0a0d04" stroke-width="1" opacity="0.5"/>
  <line x1="51" y1="46" x2="51" y2="59" stroke="#0a0d04" stroke-width="1" opacity="0.5"/>
  <!-- Road wheels -->
  <circle cx="9"  cy="52" r="4.5" fill="#141a09"/><circle cx="9"  cy="52" r="2" fill="#222c10"/>
  <circle cx="20" cy="52" r="4.5" fill="#141a09"/><circle cx="20" cy="52" r="2" fill="#222c10"/>
  <circle cx="32" cy="52" r="4.5" fill="#141a09"/><circle cx="32" cy="52" r="2" fill="#222c10"/>
  <circle cx="44" cy="52" r="4.5" fill="#141a09"/><circle cx="44" cy="52" r="2" fill="#222c10"/>
  <circle cx="55" cy="52" r="4.5" fill="#141a09"/><circle cx="55" cy="52" r="2" fill="#222c10"/>
  <!-- Hull lower -->
  <path d="M7 46 L11 34 L57 34 L61 46 Z" fill="url(#tk-h)"/>
  <!-- Hull upper slope -->
  <path d="M11 34 L16 27 L55 27 L57 34 Z" fill="#5a6a30"/>
  <!-- Turret -->
  <rect x="17" y="16" width="28" height="13" rx="4" fill="url(#tk-t)"/>
  <rect x="17" y="16" width="28" height="3" rx="3" fill="white" opacity="0.07"/>
  <!-- Commander hatch -->
  <circle cx="27" cy="21" r="3.5" fill="#3a4622" stroke="#2d3818" stroke-width="1"/>
  <circle cx="27" cy="21" r="1.5" fill="#1e2610"/>
  <!-- Gun barrel -->
  <rect x="43" y="20" width="20" height="4" rx="2" fill="#2a3418"/>
  <rect x="61" y="19" width="2" height="6" rx="1" fill="#1e2810"/>
  <!-- Smoke dischargers -->
  <rect x="43" y="17" width="3" height="2" rx="0.5" fill="#2a3418"/>
  <rect x="43" y="25" width="3" height="2" rx="0.5" fill="#2a3418"/>
  <!-- Hull stowage box -->
  <rect x="13" y="36" width="9" height="4" rx="1" fill="#4a5628" opacity="0.9"/>
  <rect x="24" y="36" width="6" height="4" rx="1" fill="#4a5628" opacity="0.7"/>
  <!-- Exhaust -->
  <rect x="3" y="34" width="5" height="7" rx="1" fill="#222a12"/>
</svg>`,

artillery: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ar-h" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7a6a38"/><stop offset="100%" stop-color="#4a4020"/>
    </linearGradient>
    <linearGradient id="ar-tr" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#252214"/><stop offset="100%" stop-color="#111008"/>
    </linearGradient>
  </defs>
  <!-- Tracks -->
  <rect x="4" y="46" width="52" height="12" rx="6" fill="url(#ar-tr)"/>
  <line x1="12" y1="46" x2="12" y2="58" stroke="#0a0904" stroke-width="1" opacity="0.5"/>
  <line x1="20" y1="46" x2="20" y2="58" stroke="#0a0904" stroke-width="1" opacity="0.5"/>
  <line x1="28" y1="46" x2="28" y2="58" stroke="#0a0904" stroke-width="1" opacity="0.5"/>
  <line x1="36" y1="46" x2="36" y2="58" stroke="#0a0904" stroke-width="1" opacity="0.5"/>
  <line x1="44" y1="46" x2="44" y2="58" stroke="#0a0904" stroke-width="1" opacity="0.5"/>
  <!-- Wheels -->
  <circle cx="10" cy="52" r="4" fill="#151208"/><circle cx="10" cy="52" r="1.8" fill="#222010"/>
  <circle cx="20" cy="52" r="4" fill="#151208"/><circle cx="20" cy="52" r="1.8" fill="#222010"/>
  <circle cx="30" cy="52" r="4" fill="#151208"/><circle cx="30" cy="52" r="1.8" fill="#222010"/>
  <circle cx="40" cy="52" r="4" fill="#151208"/><circle cx="40" cy="52" r="1.8" fill="#222010"/>
  <circle cx="50" cy="52" r="4" fill="#151208"/><circle cx="50" cy="52" r="1.8" fill="#222010"/>
  <!-- Hull -->
  <path d="M8 46 L12 34 L52 34 L56 46 Z" fill="url(#ar-h)"/>
  <path d="M12 34 L16 28 L50 28 L52 34 Z" fill="#6a5c2e"/>
  <!-- Gun mount base -->
  <rect x="18" y="22" width="22" height="10" rx="3" fill="#5c5028"/>
  <!-- Elevated barrel (angled ~45°) -->
  <polygon points="30,28 32,24 56,8 54,12" fill="#2e2c18"/>
  <!-- Muzzle brake -->
  <rect x="53" y="6" width="3" height="6" rx="1" fill="#1e1c10"/>
  <!-- Gun shield -->
  <rect x="20" y="18" width="4" height="14" rx="1" fill="#4a4220"/>
  <!-- Ammo box -->
  <rect x="8" y="30" width="8" height="6" rx="1" fill="#5a5028"/>
  <line x1="12" y1="30" x2="12" y2="36" stroke="#4a4020" stroke-width="0.8"/>
  <!-- Cab detail -->
  <rect x="40" y="30" width="8" height="4" rx="1" fill="#4a4220" opacity="0.8"/>
</svg>`,

apc: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ap-h" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#607040"/><stop offset="100%" stop-color="#384020"/>
    </linearGradient>
    <linearGradient id="ap-r" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#708048"/><stop offset="100%" stop-color="#485828"/>
    </linearGradient>
  </defs>
  <!-- Large wheels (wheeled APC) -->
  <circle cx="14" cy="50" r="8"  fill="#181e10" stroke="#0e1208" stroke-width="1"/>
  <circle cx="14" cy="50" r="4"  fill="#242c14"/><circle cx="14" cy="50" r="1.8" fill="#1a2010"/>
  <circle cx="50" cy="50" r="8"  fill="#181e10" stroke="#0e1208" stroke-width="1"/>
  <circle cx="50" cy="50" r="4"  fill="#242c14"/><circle cx="50" cy="50" r="1.8" fill="#1a2010"/>
  <circle cx="32" cy="52" r="6"  fill="#181e10" stroke="#0e1208" stroke-width="1"/>
  <circle cx="32" cy="52" r="3"  fill="#242c14"/>
  <!-- Hull lower -->
  <path d="M6 46 L10 30 L58 30 L60 46 Z" fill="url(#ap-h)"/>
  <!-- Hull upper / roof -->
  <path d="M10 30 L14 22 L55 22 L58 30 Z" fill="url(#ap-r)"/>
  <!-- Windshield -->
  <path d="M14 22 L18 17 L42 17 L44 22 Z" fill="#7aaabb" opacity="0.7"/>
  <line x1="31" y1="17" x2="31" y2="22" stroke="#5a8090" stroke-width="0.8" opacity="0.6"/>
  <!-- Side windows -->
  <rect x="14" y="24" width="6" height="4" rx="1" fill="#3a8090" opacity="0.8"/>
  <rect x="23" y="24" width="6" height="4" rx="1" fill="#3a8090" opacity="0.8"/>
  <rect x="32" y="24" width="6" height="4" rx="1" fill="#3a8090" opacity="0.8"/>
  <!-- Gun mount -->
  <rect x="42" y="19" width="10" height="7" rx="2" fill="#485828"/>
  <rect x="50" y="21" width="11" height="3" rx="1.5" fill="#384020"/>
  <!-- Door seam -->
  <line x1="8" y1="34" x2="8" y2="46" stroke="#2a3018" stroke-width="1.5" opacity="0.6"/>
  <!-- Armor ribs -->
  <line x1="10" y1="38" x2="60" y2="38" stroke="#2a3018" stroke-width="0.8" opacity="0.35"/>
  <!-- Rear detail -->
  <rect x="56" y="32" width="4" height="8" rx="1" fill="#506038"/>
</svg>`,

fighter_jet: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fj-f" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a5878"/><stop offset="100%" stop-color="#2e3a52"/>
    </linearGradient>
    <linearGradient id="fj-w" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#556080"/><stop offset="100%" stop-color="#2e3848"/>
    </linearGradient>
  </defs>
  <!-- Engine glow -->
  <ellipse cx="32" cy="58" rx="5" ry="4" fill="#ff6020" opacity="0.5"/>
  <ellipse cx="32" cy="57" rx="3" ry="2.5" fill="#ffaa40" opacity="0.6"/>
  <!-- Delta wings -->
  <polygon points="32,14 4,52 20,46 32,30 44,46 60,52" fill="url(#fj-w)"/>
  <line x1="32" y1="14" x2="4"  y2="52" stroke="white" stroke-width="0.5" opacity="0.12"/>
  <line x1="32" y1="14" x2="60" y2="52" stroke="white" stroke-width="0.5" opacity="0.12"/>
  <!-- Fuselage -->
  <rect x="27" y="8" width="10" height="48" rx="5" fill="url(#fj-f)"/>
  <!-- Nose -->
  <ellipse cx="32" cy="9" rx="4" ry="6" fill="#3a4868"/>
  <ellipse cx="32" cy="7" rx="2" ry="3" fill="#2a3858"/>
  <!-- Cockpit canopy -->
  <ellipse cx="32" cy="22" rx="4" ry="8" fill="#5a9ab5" opacity="0.8"/>
  <ellipse cx="32" cy="21" rx="2.5" ry="5" fill="#7abcd5" opacity="0.5"/>
  <!-- Canard fins -->
  <polygon points="28,34 14,42 24,38" fill="#3a4868"/>
  <polygon points="36,34 50,42 40,38" fill="#3a4868"/>
  <!-- Tail fins -->
  <polygon points="29,52 22,62 29,58" fill="#3a4868"/>
  <polygon points="35,52 42,62 35,58" fill="#3a4868"/>
  <!-- Missiles -->
  <rect x="11" y="46" width="7" height="2" rx="1" fill="#5a6070" opacity="0.9"/>
  <rect x="46" y="46" width="7" height="2" rx="1" fill="#5a6070" opacity="0.9"/>
</svg>`,

bomber: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bm-f" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#384060"/><stop offset="100%" stop-color="#202838"/>
    </linearGradient>
    <linearGradient id="bm-w" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#404d6a"/><stop offset="100%" stop-color="#252e42"/>
    </linearGradient>
  </defs>
  <!-- Engine glows -->
  <ellipse cx="22" cy="57" rx="3" ry="2" fill="#ff8030" opacity="0.5"/>
  <ellipse cx="42" cy="57" rx="3" ry="2" fill="#ff8030" opacity="0.5"/>
  <!-- Wide swept wings -->
  <polygon points="32,18 2,50 14,46 32,28 50,46 62,50" fill="url(#bm-w)"/>
  <line x1="32" y1="18" x2="2"  y2="50" stroke="white" stroke-width="0.5" opacity="0.1"/>
  <line x1="32" y1="18" x2="62" y2="50" stroke="white" stroke-width="0.5" opacity="0.1"/>
  <!-- Fuselage (wider) -->
  <rect x="25" y="10" width="14" height="50" rx="6" fill="url(#bm-f)"/>
  <!-- Nose -->
  <ellipse cx="32" cy="11" rx="6" ry="7" fill="#2e3858"/>
  <!-- Cockpit -->
  <ellipse cx="32" cy="22" rx="5" ry="7" fill="#4a7090" opacity="0.7"/>
  <!-- Bomb bay doors -->
  <rect x="27" y="38" width="10" height="14" rx="1" fill="#1a2030" opacity="0.8"/>
  <line x1="32" y1="38" x2="32" y2="52" stroke="#0e1520" stroke-width="1"/>
  <!-- Engine pods -->
  <rect x="13" y="43" width="8" height="4" rx="2" fill="#303858"/>
  <rect x="43" y="43" width="8" height="4" rx="2" fill="#303858"/>
  <!-- Tail fins -->
  <polygon points="28,56 18,63 28,60" fill="#303858"/>
  <polygon points="36,56 46,63 36,60" fill="#303858"/>
</svg>`,

helicopter: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hc-b" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#506040"/><stop offset="100%" stop-color="#303820"/>
    </linearGradient>
    <linearGradient id="hc-t" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#607050"/><stop offset="100%" stop-color="#404828"/>
    </linearGradient>
  </defs>
  <!-- Main rotor blades -->
  <ellipse cx="26" cy="14" rx="26" ry="3" fill="#2a3218" opacity="0.85"/>
  <ellipse cx="26" cy="14" rx="3" ry="16" fill="#2a3218" opacity="0.75"/>
  <!-- Rotor hub -->
  <circle cx="26" cy="14" r="3" fill="#1e2814"/>
  <circle cx="26" cy="14" r="1.5" fill="#3a4620"/>
  <!-- Mast -->
  <line x1="26" y1="14" x2="26" y2="24" stroke="#2a3218" stroke-width="2"/>
  <!-- Body -->
  <path d="M6 28 Q8 22 26 22 Q40 22 46 28 Q50 34 48 40 Q46 44 38 46 Q26 48 14 44 Q6 40 6 34 Z" fill="url(#hc-b)"/>
  <!-- Cockpit bubble -->
  <path d="M10 30 Q12 24 26 24 Q38 24 40 30 Q42 34 38 38 Q30 42 18 40 Q10 38 10 34 Z" fill="#70a0b8" opacity="0.65"/>
  <path d="M12 30 Q14 26 26 26 Q36 26 38 30" fill="none" stroke="white" stroke-width="0.8" opacity="0.3"/>
  <!-- Gunner window -->
  <rect x="28" y="30" width="8" height="6" rx="2" fill="#5080a0" opacity="0.7"/>
  <!-- Tail boom -->
  <path d="M46 36 Q54 34 60 32 Q62 31 62 33 Q62 35 60 36 Q54 38 46 38 Z" fill="url(#hc-t)"/>
  <!-- Tail rotor -->
  <ellipse cx="61" cy="30" rx="2" ry="6" fill="#2a3218" opacity="0.75"/>
  <circle cx="61" cy="30" r="1.5" fill="#1e2814"/>
  <!-- Skids -->
  <rect x="10" y="46" width="28" height="3" rx="1.5" fill="#1e2414"/>
  <line x1="14" y1="44" x2="14" y2="49" stroke="#1e2414" stroke-width="2"/>
  <line x1="32" y1="44" x2="32" y2="49" stroke="#1e2414" stroke-width="2"/>
  <!-- Chin gun -->
  <rect x="6" y="34" width="10" height="4" rx="2" fill="#303c20"/>
  <rect x="2" y="35" width="6" height="2" rx="1" fill="#222c14"/>
</svg>`,

destroyer: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ds-h" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a5870"/><stop offset="100%" stop-color="#283044"/>
    </linearGradient>
    <linearGradient id="ds-s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a4860"/><stop offset="100%" stop-color="#1e2838"/>
    </linearGradient>
    <linearGradient id="ds-w" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a3050"/><stop offset="100%" stop-color="#0a1828"/>
    </linearGradient>
  </defs>
  <!-- Water / wake -->
  <ellipse cx="32" cy="56" rx="30" ry="5" fill="#1a3050" opacity="0.35"/>
  <!-- Hull waterline -->
  <path d="M4 48 Q8 44 32 42 Q56 44 60 48 L56 56 Q32 58 8 56 Z" fill="url(#ds-w)"/>
  <!-- Main hull -->
  <path d="M6 46 Q8 38 14 36 L54 36 Q58 38 58 46 Z" fill="url(#ds-h)"/>
  <!-- Deck -->
  <rect x="10" y="32" width="44" height="6" rx="1" fill="#384a60"/>
  <!-- Superstructure -->
  <rect x="20" y="22" width="26" height="12" rx="2" fill="url(#ds-s)"/>
  <!-- Bridge -->
  <rect x="24" y="14" width="16" height="10" rx="2" fill="#2e3c52"/>
  <!-- Mast -->
  <rect x="31" y="8" width="2" height="8" fill="#1e2c40"/>
  <line x1="26" y1="8" x2="36" y2="8" stroke="#1e2c40" stroke-width="1.5"/>
  <ellipse cx="31" cy="8" rx="5" ry="2" fill="#2e3c52" opacity="0.8"/>
  <!-- Bridge windows -->
  <rect x="26" y="16" width="4" height="3" rx="0.5" fill="#5a8ab0" opacity="0.8"/>
  <rect x="32" y="16" width="4" height="3" rx="0.5" fill="#5a8ab0" opacity="0.8"/>
  <!-- VLS fore -->
  <rect x="12" y="22" width="7" height="10" rx="1" fill="#283848"/>
  <line x1="14" y1="22" x2="14" y2="32" stroke="#1e2c38" stroke-width="0.8"/>
  <line x1="16" y1="22" x2="16" y2="32" stroke="#1e2c38" stroke-width="0.8"/>
  <!-- Gun fore -->
  <rect x="10" y="30" width="8" height="5" rx="2" fill="#2e3c52"/>
  <rect x="16" y="31" width="10" height="2" rx="1" fill="#1e2c40"/>
  <!-- Gun aft -->
  <rect x="46" y="30" width="8" height="5" rx="2" fill="#2e3c52"/>
  <rect x="46" y="31" width="10" height="2" rx="1" fill="#1e2c40"/>
  <!-- Aft deck -->
  <rect x="48" y="24" width="8" height="8" rx="1" fill="#283848"/>
  <line x1="10" y1="36" x2="54" y2="36" stroke="white" stroke-width="0.5" opacity="0.08"/>
</svg>`,

submarine: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sb-h" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a4a5a"/><stop offset="100%" stop-color="#1e2a38"/>
    </linearGradient>
    <linearGradient id="sb-s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2e3c4c"/><stop offset="100%" stop-color="#18242e"/>
    </linearGradient>
  </defs>
  <!-- Water surface -->
  <path d="M0 38 Q16 34 32 36 Q48 38 64 34" fill="none" stroke="#2a4060" stroke-width="1.5" opacity="0.6"/>
  <!-- Prop wash -->
  <ellipse cx="57" cy="44" rx="5" ry="3" fill="#2a4060" opacity="0.3"/>
  <!-- Main hull (elongated) -->
  <path d="M8 40 Q6 44 8 48 Q20 52 40 52 Q54 50 58 44 Q62 40 58 36 Q54 32 40 32 Q20 32 8 36 Q6 38 8 40 Z" fill="url(#sb-h)"/>
  <!-- Hull highlight -->
  <path d="M10 38 Q24 34 42 34 Q54 36 58 40" fill="none" stroke="white" stroke-width="1" opacity="0.1"/>
  <!-- Conning tower (sail) -->
  <rect x="22" y="26" width="14" height="14" rx="3" fill="url(#sb-s)"/>
  <!-- Sail window -->
  <rect x="24" y="28" width="4" height="3" rx="1" fill="#4a7090" opacity="0.7"/>
  <!-- Periscopes -->
  <rect x="30" y="16" width="2" height="12" fill="#1e2c3c"/>
  <rect x="34" y="20" width="2" height="8"  fill="#1e2c3c"/>
  <rect x="28" y="16" width="6" height="2"  rx="1" fill="#1e2c3c"/>
  <!-- Bow sonar dome -->
  <ellipse cx="9" cy="44" rx="6" ry="8" fill="#2a3848"/>
  <!-- Diving planes -->
  <path d="M16 36 L8 30 L12 36 Z" fill="#283848"/>
  <path d="M16 52 L8 58 L12 52 Z" fill="#283848"/>
  <!-- Propeller -->
  <circle cx="57" cy="44" r="4" fill="#1a2838" stroke="#0e1828" stroke-width="1"/>
  <line x1="57" y1="40" x2="57" y2="48" stroke="#253545" stroke-width="2" opacity="0.8"/>
  <line x1="53" y1="44" x2="61" y2="44" stroke="#253545" stroke-width="2" opacity="0.8"/>
  <!-- Torpedo tubes -->
  <circle cx="10" cy="41" r="1.5" fill="#0e1828"/>
  <circle cx="10" cy="47" r="1.5" fill="#0e1828"/>
</svg>`,

carrier: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cv-d" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a5870"/><stop offset="100%" stop-color="#283040"/>
    </linearGradient>
    <linearGradient id="cv-w" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a2a40"/><stop offset="100%" stop-color="#0a1020"/>
    </linearGradient>
  </defs>
  <!-- Wake -->
  <ellipse cx="32" cy="60" rx="28" ry="4" fill="#1a3050" opacity="0.3"/>
  <!-- Hull -->
  <path d="M4 50 Q6 44 12 42 L56 42 Q60 44 60 50 L56 58 Q32 60 8 58 Z" fill="url(#cv-w)"/>
  <!-- Flight deck -->
  <path d="M6 42 L6 28 L58 28 L58 42 Z" fill="url(#cv-d)"/>
  <!-- Angled landing strip -->
  <path d="M6 42 L22 28 L30 28 L14 42 Z" fill="#3a4858" opacity="0.6"/>
  <line x1="6"  y1="42" x2="22" y2="28" stroke="#ffff80" stroke-width="0.5" opacity="0.4"/>
  <line x1="14" y1="42" x2="30" y2="28" stroke="#ffff80" stroke-width="0.5" opacity="0.4"/>
  <!-- Catapult lines -->
  <line x1="8"  y1="30" x2="50" y2="30" stroke="white" stroke-width="0.5" opacity="0.15"/>
  <line x1="8"  y1="38" x2="50" y2="38" stroke="white" stroke-width="0.5" opacity="0.1"/>
  <!-- Deck aircraft (tiny) -->
  <polygon points="36,32 34,36 38,36" fill="#3a4868" opacity="0.8"/>
  <polygon points="46,31 44,35 48,35" fill="#3a4868" opacity="0.8"/>
  <!-- Island superstructure -->
  <rect x="50" y="18" width="10" height="12" rx="2" fill="#2e3c52"/>
  <rect x="51" y="12" width="6" height="8"  rx="1" fill="#263248"/>
  <!-- Radar -->
  <rect x="53" y="8" width="2" height="6" fill="#1e2c40"/>
  <ellipse cx="54" cy="8" rx="4" ry="1.5" fill="#2e3c52"/>
  <!-- Island windows -->
  <rect x="52" y="20" width="3" height="2" rx="0.5" fill="#5a8ab0" opacity="0.7"/>
  <rect x="52" y="14" width="3" height="2" rx="0.5" fill="#5a8ab0" opacity="0.7"/>
  <!-- Elevators -->
  <rect x="6"  y="38" width="8" height="5" rx="1" fill="#384858" opacity="0.7"/>
  <rect x="44" y="28" width="6" height="5" rx="1" fill="#384858" opacity="0.7"/>
</svg>`,

ballistic: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bl-b" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#6a5878"/><stop offset="100%" stop-color="#3a3048"/>
    </linearGradient>
    <linearGradient id="bl-w" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8a6898"/><stop offset="100%" stop-color="#4a3858"/>
    </linearGradient>
    <linearGradient id="bl-tr" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#252214"/><stop offset="100%" stop-color="#111008"/>
    </linearGradient>
  </defs>
  <!-- Launcher vehicle tracks -->
  <rect x="4" y="50" width="56" height="11" rx="5" fill="url(#bl-tr)"/>
  <circle cx="10" cy="56" r="3.5" fill="#141208"/><circle cx="10" cy="56" r="1.5" fill="#222010"/>
  <circle cx="20" cy="56" r="3.5" fill="#141208"/><circle cx="20" cy="56" r="1.5" fill="#222010"/>
  <circle cx="32" cy="56" r="3.5" fill="#141208"/><circle cx="32" cy="56" r="1.5" fill="#222010"/>
  <circle cx="44" cy="56" r="3.5" fill="#141208"/><circle cx="44" cy="56" r="1.5" fill="#222010"/>
  <circle cx="54" cy="56" r="3.5" fill="#141208"/><circle cx="54" cy="56" r="1.5" fill="#222010"/>
  <!-- Launcher body -->
  <rect x="8"  y="44" width="48" height="8" rx="3" fill="#5a5030"/>
  <rect x="18" y="40" width="10" height="6" rx="2" fill="#4a4428"/>
  <!-- Missile body -->
  <rect x="28" y="8" width="10" height="38" rx="3" fill="url(#bl-b)"/>
  <!-- Warhead cone -->
  <polygon points="33,4 28,14 38,14" fill="url(#bl-w)"/>
  <!-- Stage rings -->
  <rect x="28" y="24" width="10" height="2" rx="0" fill="#2a2038" opacity="0.8"/>
  <rect x="28" y="36" width="10" height="2" rx="0" fill="#2a2038" opacity="0.8"/>
  <!-- Side highlight -->
  <rect x="29" y="8" width="2" height="36" rx="1" fill="white" opacity="0.08"/>
  <!-- Fins -->
  <path d="M28 44 L22 52 L28 48 Z" fill="#4a3858"/>
  <path d="M38 44 L44 52 L38 48 Z" fill="#4a3858"/>
  <!-- Nozzle + glow -->
  <rect x="30" y="44" width="6" height="4" rx="1" fill="#3a2848"/>
  <ellipse cx="33" cy="50" rx="4" ry="3" fill="#ff6020" opacity="0.4"/>
</svg>`,

cruise: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cm-b" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#3a4a6a"/><stop offset="100%" stop-color="#5a6a8a"/>
    </linearGradient>
  </defs>
  <!-- Exhaust flame -->
  <ellipse cx="7"  cy="34" rx="5" ry="3" fill="#ff8030" opacity="0.6"/>
  <ellipse cx="5"  cy="34" rx="3" ry="2" fill="#ffcc40" opacity="0.5"/>
  <!-- Main body -->
  <path d="M58,32 Q54,26 44,28 L12,30 Q8,31 8,34 Q8,37 12,38 L44,40 Q54,42 58,36 Q60,34 58,32 Z" fill="url(#cm-b)"/>
  <!-- Nose -->
  <polygon points="58,32 64,34 58,36" fill="#6a7a9a"/>
  <!-- Intake -->
  <ellipse cx="12" cy="34" rx="3" ry="4" fill="#283858"/>
  <!-- Wings -->
  <path d="M32,30 L28,18 L38,26 Z" fill="#4a5a7a"/>
  <path d="M32,38 L28,50 L38,42 Z" fill="#4a5a7a"/>
  <!-- Tail fins -->
  <path d="M14,30 L8,22 L16,28 Z" fill="#3a4a6a"/>
  <path d="M14,38 L8,46 L16,40 Z" fill="#3a4a6a"/>
  <!-- Seam line -->
  <line x1="12" y1="34" x2="58" y2="34" stroke="white" stroke-width="0.5" opacity="0.12"/>
  <!-- Sensor dome -->
  <ellipse cx="60" cy="34" rx="3" ry="3" fill="#7a90b0" opacity="0.7"/>
</svg>`,

sam: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sm-h" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#607040"/><stop offset="100%" stop-color="#384020"/>
    </linearGradient>
    <linearGradient id="sm-tr" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#252c14"/><stop offset="100%" stop-color="#111408"/>
    </linearGradient>
    <linearGradient id="sm-m" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8a7a50"/><stop offset="100%" stop-color="#5a5030"/>
    </linearGradient>
  </defs>
  <!-- Tracks -->
  <rect x="4" y="50" width="56" height="11" rx="5" fill="url(#sm-tr)"/>
  <circle cx="10" cy="56" r="3.5" fill="#141208"/><circle cx="10" cy="56" r="1.5" fill="#222010"/>
  <circle cx="20" cy="56" r="3.5" fill="#141208"/><circle cx="20" cy="56" r="1.5" fill="#222010"/>
  <circle cx="32" cy="56" r="3.5" fill="#141208"/><circle cx="32" cy="56" r="1.5" fill="#222010"/>
  <circle cx="44" cy="56" r="3.5" fill="#141208"/><circle cx="44" cy="56" r="1.5" fill="#222010"/>
  <circle cx="54" cy="56" r="3.5" fill="#141208"/><circle cx="54" cy="56" r="1.5" fill="#222010"/>
  <!-- Vehicle body -->
  <rect x="8"  y="44" width="48" height="8" rx="3" fill="url(#sm-h)"/>
  <!-- Launcher turntable -->
  <rect x="16" y="40" width="32" height="6" rx="2" fill="#506038"/>
  <!-- 4 missile tubes (fanned) -->
  <polygon points="22,40 24,36 56,12 54,16" fill="url(#sm-m)"/>
  <polygon points="28,40 30,36 58,18 56,22" fill="url(#sm-m)"/>
  <polygon points="34,40 34,36 52,10 52,14" fill="url(#sm-m)"/>
  <polygon points="16,40 18,36 46,10 44,14" fill="url(#sm-m)"/>
  <!-- Nose tips -->
  <circle cx="50" cy="11" r="2" fill="#aaa060"/>
  <circle cx="56" cy="19" r="2" fill="#aaa060"/>
  <circle cx="44" cy="11" r="2" fill="#aaa060"/>
  <circle cx="55" cy="13" r="2" fill="#aaa060"/>
  <!-- Radar dish -->
  <rect x="8"  y="38" width="2" height="8" fill="#3a4828"/>
  <path d="M4 36 Q9 28 14 36" fill="none" stroke="#4a5830" stroke-width="2" stroke-linecap="round"/>
</svg>`,

iron_dome: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="id-h" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#506878"/><stop offset="100%" stop-color="#2c3c4c"/>
    </linearGradient>
    <linearGradient id="id-tr" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#252c2c"/><stop offset="100%" stop-color="#111414"/>
    </linearGradient>
    <linearGradient id="id-m" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#6a7a9a"/><stop offset="100%" stop-color="#3a4a6a"/>
    </linearGradient>
  </defs>
  <!-- Radar truck wheels -->
  <circle cx="10" cy="56" r="5" fill="#181c1c" stroke="#0c1010" stroke-width="1"/>
  <circle cx="10" cy="56" r="2.5" fill="#242828"/>
  <circle cx="22" cy="56" r="5" fill="#181c1c" stroke="#0c1010" stroke-width="1"/>
  <circle cx="22" cy="56" r="2.5" fill="#242828"/>
  <!-- Radar truck body -->
  <rect x="4"  y="44" width="26" height="10" rx="2" fill="#3a4a5a"/>
  <rect x="4"  y="40" width="20" height="6"  rx="2" fill="#3a4858"/>
  <!-- Radar dish assembly -->
  <rect x="12" y="28" width="2" height="14" fill="#2a3848"/>
  <path d="M4 28 Q13 18 22 28" fill="none" stroke="#3a5870" stroke-width="3" stroke-linecap="round"/>
  <path d="M6 26 Q13 20 20 26" fill="none" stroke="#4a6880" stroke-width="1.5" opacity="0.5"/>
  <!-- Radar scan arc -->
  <path d="M13 27 Q22 14 36 16" fill="none" stroke="#60aacc" stroke-width="0.8" stroke-dasharray="2,2" opacity="0.55"/>
  <!-- Status lights -->
  <circle cx="8"  cy="42" r="1.5" fill="#40ff80" opacity="0.85"/>
  <circle cx="12" cy="42" r="1.5" fill="#ff4040" opacity="0.85"/>
  <!-- Launcher tracks -->
  <rect x="32" y="50" width="30" height="11" rx="5" fill="url(#id-tr)"/>
  <circle cx="38" cy="56" r="3.5" fill="#121414"/><circle cx="38" cy="56" r="1.5" fill="#1e2222"/>
  <circle cx="48" cy="56" r="3.5" fill="#121414"/><circle cx="48" cy="56" r="1.5" fill="#1e2222"/>
  <circle cx="58" cy="56" r="3.5" fill="#121414"/><circle cx="58" cy="56" r="1.5" fill="#1e2222"/>
  <!-- Launcher body -->
  <rect x="34" y="42" width="28" height="10" rx="3" fill="url(#id-h)"/>
  <!-- Interceptor missile pods (3 tubes) -->
  <rect x="36" y="20" width="7" height="24" rx="2" fill="url(#id-m)"/>
  <rect x="45" y="20" width="7" height="24" rx="2" fill="url(#id-m)"/>
  <rect x="54" y="20" width="7" height="24" rx="2" fill="url(#id-m)"/>
  <!-- Warhead tips -->
  <polygon points="36,20 39.5,13 43,20" fill="#8090b8"/>
  <polygon points="45,20 48.5,13 52,20" fill="#8090b8"/>
  <polygon points="54,20 57.5,13 61,20" fill="#8090b8"/>
  <!-- Connect cable -->
  <path d="M28 48 Q30 48 32 50" fill="none" stroke="#1e2830" stroke-width="1.5"/>
</svg>`,

};
