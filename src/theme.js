const F = "'Inter',system-ui,sans-serif";
const FM = "'JetBrains Mono',monospace";
const FN = "'Nunito',sans-serif";
const DARK = { bg:"#0A0A0B", surface:"#111113", card:"#17171A", card2:"#1F1F23", border:"#27272A", border2:"#3F3F46", text:"#F4F4F5", text2:"#A1A1AA", text3:"#8C8C96", blue:"#60A5FA", purple:"#A78BFA", teal:"#2DD4BF", green:"#22C55E", yellow:"#F59E0B", red:"#F87171", pink:"#F472B6" };
const LIGHT = { bg:"#F4F4F5", surface:"#EBEBEF", card:"#FFFFFF", card2:"#EDEDF0", border:"#D4D4D8", border2:"#A1A1AA", text:"#09090B", text2:"#3F3F46", text3:"#52525B", blue:"#2563EB", purple:"#7C3AED", teal:"#0D9488", green:"#15803D", yellow:"#B45309", red:"#DC2626", pink:"#DB2777" };
let C = DARK, SH, card;
function isLightColor(hex) { const h = (hex||"").replace("#",""); if(h.length<6) return false; const r=parseInt(h.substr(0,2),16), g=parseInt(h.substr(2,2),16), b=parseInt(h.substr(4,2),16); return (r*299+g*587+b*114)/1000>130; }
const R = { sm:8, md:12, lg:16, xl:20, pill:999 };
const S = { xs:2, sm:4, md:8, lg:12, xl:16 };
const H = { sm:36, md:44, lg:52 };
function applyTheme(dark) {
  C = dark ? DARK : LIGHT;
  SH = dark ? { sm:"0 1px 3px rgba(0,0,0,.4)", md:"0 4px 12px rgba(0,0,0,.5)", lg:"0 8px 30px rgba(0,0,0,.6)", glow:c=>`0 0 20px ${c}22, 0 0 40px ${c}11` } : { sm:"0 1px 3px rgba(0,0,0,.08)", md:"0 4px 12px rgba(0,0,0,.1)", lg:"0 8px 30px rgba(0,0,0,.12)", glow:c=>`0 0 20px ${c}15, 0 0 40px ${c}08` };
  card = { background:C.card, border:`1px solid ${C.border}`, borderRadius:R.xl, padding:`${S.xl}px`, boxShadow:SH.md };
}
applyTheme(true);
const inp = (extra={}) => ({ background:C.surface, border:`1px solid ${C.border2}`, borderRadius:R.md, padding:"10px 14px", color:C.text, fontSize:14, fontFamily:F, width:"100%", outline:"none", transition:"border-color 0.15s, box-shadow 0.15s", ...extra });
const btn = (bg, extra={}) => ({ background:bg, border:"none", borderRadius:R.md, padding:"10px 18px", color:isLightColor(bg) ? "#1a1a1a" : "#fff", cursor:"pointer", fontSize:13, fontWeight:500, fontFamily:F, transition:"opacity 0.15s, transform 0.1s", ...extra });
const tag = (color) => ({ display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:R.pill, fontSize:10, fontWeight:600, fontFamily:FM, color, background:color+"20", border:`1px solid ${color}44`, lineHeight:1.4 });
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
    .fade-in { animation:fadeSlideIn .25s ease-out }
    .pulse-check { animation:pulseCheck .3s ease-out }
    .skeleton { background:linear-gradient(90deg,transparent 25%,rgba(255,255,255,.06) 50%,transparent 75%); background-size:200% 100%; animation:skeletonShimmer 1.5s infinite }
    @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
    @media(max-width:768px){ .logo-img{width:52px!important;height:52px!important} .logo-text{font-size:24px!important} }
    @media(max-width:640px){ .bottom-nav{display:block!important} .desktop-tabs{display:none!important} }
  `;
  document.head.appendChild(s);
}

export { C, DARK, LIGHT, F, FM, FN, R, S, H, SH, card, inp, btn, tag, NUM, numUnit, applyTheme, TY, perfIcon, perfIconColor, injectKeyframes, isLightColor };
