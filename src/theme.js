const F = "'Inter',system-ui,sans-serif";
const FM = "'JetBrains Mono',monospace";
const FN = "'Nunito',sans-serif";
const DARK = { bg:"#0A0A0B", surface:"#111113", card:"#17171A", card2:"#1F1F23", border:"#27272A", border2:"#3F3F46", text:"#F4F4F5", text2:"#A1A1AA", text3:"#71717A", blue:"#60A5FA", purple:"#A78BFA", teal:"#2DD4BF", green:"#22C55E", yellow:"#F59E0B", red:"#F87171", pink:"#F472B6" };
const LIGHT = { bg:"#F8FAFC", surface:"#F1F5F9", card:"#FFFFFF", card2:"#F8FAFC", border:"#E2E8F0", border2:"#CBD5E1", text:"#0F172A", text2:"#475569", text3:"#94A3B8", blue:"#3B82F6", purple:"#8B5CF6", teal:"#14B8A6", green:"#16A34A", yellow:"#D97706", red:"#EF4444", pink:"#EC4899" };
let C = DARK, SH, card;
const R = { sm:8, md:12, lg:16, xl:20, pill:999 };
const S = { xs:2, sm:4, md:8, lg:12, xl:16 };
const H = { sm:36, md:44, lg:52 };
function applyTheme(dark) {
  C = dark ? DARK : LIGHT;
  SH = dark ? { sm:"0 1px 3px rgba(0,0,0,.4)", md:"0 4px 12px rgba(0,0,0,.5)", lg:"0 8px 30px rgba(0,0,0,.6)", glow:c=>`0 0 20px ${c}22, 0 0 40px ${c}11` } : { sm:"0 1px 3px rgba(0,0,0,.08)", md:"0 4px 12px rgba(0,0,0,.1)", lg:"0 8px 30px rgba(0,0,0,.12)", glow:c=>`0 0 20px ${c}15, 0 0 40px ${c}08` };
  card = { background:C.card, border:`1px solid ${C.border}`, borderRadius:R.xl, padding:`${S.xl}px`, boxShadow:SH.md };
}
applyTheme(true);
const inp = (extra={}) => ({ background:C.surface, border:`1px solid ${C.border2}`, borderRadius:R.md, padding:"10px 14px", color:C.text, fontSize:14, fontFamily:F, width:"100%", outline:"none", ...extra });
const btn = (bg, extra={}) => ({ background:bg, border:"none", borderRadius:R.md, padding:"10px 18px", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:500, fontFamily:F, ...extra });
const tag = (color) => ({ display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:R.pill, fontSize:10, fontWeight:600, fontFamily:FM, color, background:color+"18", border:`1px solid ${color}33`, lineHeight:1.4 });
const NUM = { fontFamily:FN, fontVariantNumeric:"tabular-nums" };
const numUnit = (v, u) => [v, u];
export { C, DARK, LIGHT, F, FM, FN, R, S, H, SH, card, inp, btn, tag, NUM, numUnit, applyTheme };
