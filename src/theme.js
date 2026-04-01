const F = "'Inter',system-ui,sans-serif";
const FM = "'JetBrains Mono',monospace";
const FN = "'Nunito',sans-serif";
const DARK = { bg:"#0A0A0B", surface:"#111113", card:"#17171A", card2:"#1F1F23", border:"#27272A", border2:"#3F3F46", text:"#F4F4F5", text2:"#A1A1AA", text3:"#8C8C96", blue:"#60A5FA", purple:"#A78BFA", teal:"#2DD4BF", green:"#22C55E", yellow:"#F59E0B", red:"#F87171", pink:"#F472B6" };
const LIGHT = { bg:"#FAFAFA", surface:"#F5F5F5", card:"#FFFFFF", card2:"#F0F0F2", border:"#EAEAED", border2:"#D4D4D8", text:"#0A0A0B", text2:"#5C5C66", text3:"#8C8C96", blue:"#3B6EE8", purple:"#7B5ADE", teal:"#0E9384", green:"#1A9A4A", yellow:"#C08B20", red:"#E04040", pink:"#D63384" };
let C = DARK, SH, card;
function isLightColor(hex) { const h = (hex||"").replace("#",""); if(h.length<6) return false; const r=parseInt(h.substr(0,2),16), g=parseInt(h.substr(2,2),16), b=parseInt(h.substr(4,2),16); return (r*299+g*587+b*114)/1000>130; }
const R = { sm:8, md:12, lg:14, xl:14, pill:999 };
const S = { xs:4, sm:8, md:12, lg:16, xl:20 };
const H = { sm:44, md:48, lg:52 };
function applyTheme(dark) {
  C = dark ? DARK : LIGHT;
  SH = dark
    ? { sm:"0 1px 3px rgba(0,0,0,.4)", md:"0 4px 12px rgba(0,0,0,.5)", lg:"0 8px 30px rgba(0,0,0,.6)", glow:c=>`0 0 20px ${c}22, 0 0 40px ${c}11` }
    : { sm:"0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)", md:"0 2px 8px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06)", lg:"0 8px 32px rgba(0,0,0,.12)", glow:c=>`0 1px 8px ${c}18, 0 2px 16px ${c}10` };
  card = dark
    ? { background:C.card, border:`1px solid ${C.border}`, borderRadius:R.xl, padding:"20px", boxShadow:SH.md }
    : { background:C.card, border:"none", borderRadius:R.xl, padding:"20px", boxShadow:SH.md };
  if (typeof document !== "undefined") {
    document.body.style.background = C.bg;
    document.documentElement.classList.toggle("light-mode", !dark);
  }
}
applyTheme(true);
const inp = (extra={}) => ({ background:C.surface, border:`1px solid ${C.border2}`, borderRadius:R.md, padding:"10px 14px", color:C.text, fontSize:14, fontFamily:F, width:"100%", outline:"none", transition:"border-color 0.15s, box-shadow 0.15s", ...extra });
const btn = (bg, extra={}) => ({ background:bg, border:"none", borderRadius:R.md, padding:"10px 18px", color:isLightColor(bg) ? "#1a1a1a" : "#fff", cursor:"pointer", fontSize:13, fontWeight:500, fontFamily:F, transition:"opacity 0.15s, transform 0.1s", ...extra });
const tag = (color) => ({ display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:R.pill, fontSize:10, fontWeight:600, fontFamily:FM, color, background:color+"20", border:C === DARK ? `1px solid ${color}44` : "none", lineHeight:1.4 });
const NUM = { fontFamily:FN, fontVariantNumeric:"tabular-nums" };
const numUnit = (v, u) => [v, u];

// Typography scale
const TY = {
  h1: { fontSize:24, fontWeight:800, letterSpacing:-0.5, lineHeight:1.2, fontFamily:F },
  h2: { fontSize:20, fontWeight:700, letterSpacing:-0.3, lineHeight:1.25, fontFamily:F },
  h3: { fontSize:16, fontWeight:700, letterSpacing:-0.2, lineHeight:1.3, fontFamily:F },
  body: { fontSize:14, fontWeight:400, lineHeight:1.5, fontFamily:F },
  caption: { fontSize:12, fontWeight:500, lineHeight:1.4, fontFamily:F },
  overline: { fontSize:10, fontWeight:600, letterSpacing:1, textTransform:"uppercase", fontFamily:F },
};

// Performance helpers
const perfIcon = (pct) => pct >= 85 ? "✓" : pct >= 60 ? "⚠" : "✗";
const perfIconColor = (pct) => pct >= 85 ? "#22C55E" : pct >= 60 ? "#EAB308" : "#EF4444";

// CSS keyframes (call once)
let _injected = false;
function injectKeyframes() {
  if (_injected) return;
  _injected = true;
  const s = document.createElement("style");
  s.textContent = `
    @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
    @keyframes pulseCheck { 0% { transform:scale(1) } 50% { transform:scale(1.3) } 100% { transform:scale(1) } }
    @keyframes skeletonShimmer { 0% { background-position:-200% 0 } 100% { background-position:200% 0 } }
    @keyframes celebratePulse { 0% { box-shadow:0 0 0 0 rgba(34,197,94,0.4) } 70% { box-shadow:0 0 0 10px rgba(34,197,94,0) } 100% { box-shadow:0 0 0 0 rgba(34,197,94,0) } }
    .fade-in { animation:fadeSlideIn .25s ease-out }
    .pulse-check { animation:pulseCheck .3s ease-out }
    .celebrate-pulse { animation:celebratePulse 1.5s ease-out }
    .skeleton { background:linear-gradient(90deg,transparent 25%,rgba(255,255,255,.06) 50%,transparent 75%); background-size:200% 100%; animation:skeletonShimmer 1.5s infinite }
    @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
    *:focus-visible { outline:2px solid #A78BFA; outline-offset:2px; border-radius:8px }
    button:focus-visible { box-shadow:0 0 0 3px rgba(167,139,250,0.3) }
    input:focus-visible, select:focus-visible { outline:2px solid #A78BFA; outline-offset:0; border-color:#A78BFA !important }
    .light-mode *:focus-visible { outline-color:#7B5ADE }
    .light-mode button:focus-visible { box-shadow:0 0 0 3px rgba(123,90,222,0.15) }
    .light-mode input:focus-visible, .light-mode select:focus-visible { border-color:#7B5ADE !important; outline-color:#7B5ADE }
    button:active { transform:scale(0.97) }
    .card-interactive { transition:transform 0.15s ease, box-shadow 0.15s ease }
    .card-interactive:hover { transform:translateY(-2px) }
    @media(max-width:768px){ .logo-img{width:52px!important;height:52px!important} .logo-text{font-size:24px!important} .card-interactive:hover{transform:none} }
    @media(max-width:640px){ .bottom-nav{display:block!important} .desktop-tabs{display:none!important} }
  `;
  document.head.appendChild(s);
}

const modalBg = () => C === DARK ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.35)";

export { C, DARK, LIGHT, F, FM, FN, R, S, H, SH, card, inp, btn, tag, NUM, numUnit, applyTheme, TY, perfIcon, perfIconColor, injectKeyframes, isLightColor, modalBg };
