<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MANUFACTOR</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="MANUFACTOR">
<meta name="theme-color" content="#0c0e11">
<link rel="manifest" href="manifest.json">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Oswald:wght@300;400;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
html,body{height:100%;overflow:hidden;touch-action:manipulation;user-select:none;}
body{
  font-family:'Oswald',sans-serif;
  background:#0a0c0f;color:#e8e4dc;
  height:100dvh;display:flex;flex-direction:column;
}

/* ── TOP BAR ── */
.topbar{
  display:flex;align-items:center;flex-wrap:wrap;
  padding:0 8px;min-height:44px;
  border-bottom:1px solid rgba(255,255,255,0.07);
  flex-shrink:0;gap:4px;
}
.topbar-title{
  font-family:'Cinzel',serif;font-size:0.85rem;
  letter-spacing:0.25em;font-weight:900;white-space:nowrap;
  flex-shrink:0;
}
.topbar-center{
  flex:1;display:flex;align-items:center;justify-content:center;gap:4px;
  min-width:0;
}
.topbar-right{display:flex;gap:4px;align-items:center;flex-shrink:0;}

/* Portrait: 3 rows — title / create / untap+mods */
@media(max-aspect-ratio:1/1){
  .topbar{padding:5px 8px;flex-wrap:wrap;}
  .topbar-title{width:100%;text-align:center;order:1;}
  .topbar-center{order:2;width:100%;justify-content:center;}
  .topbar-right{order:3;width:100%;justify-content:center;padding-bottom:3px;}
}

/* Narrow: shrink everything */
@media(max-width:500px){
  .topbar-title{font-size:0.7rem;letter-spacing:0.15em;}
  .tbar-btn{padding:0 8px;font-size:0.52rem;}
  .tbar-select{width:80px;font-size:0.52rem;}
  .tbar-input{width:36px;font-size:0.52rem;}
}
.tbar-btn{
  height:34px;padding:0 12px;border-radius:8px;
  border:1px solid rgba(255,255,255,0.15);
  background:rgba(255,255,255,0.05);
  color:#e8e4dc;font-family:'Cinzel',serif;font-size:0.58rem;
  letter-spacing:0.1em;cursor:pointer;white-space:nowrap;
  display:flex;align-items:center;gap:6px;
}
.tbar-btn:active{background:rgba(255,255,255,0.12);}
.tbar-btn.create{
  background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.25);
}
.tbar-btn.untap{
  background:rgba(96,180,232,0.1);border-color:rgba(96,180,232,0.4);color:#60b4e8;
}
.tbar-btn.untap:active{background:rgba(96,180,232,0.22);}
.tbar-btn.undo{
  background:rgba(232,200,75,0.1);border-color:rgba(232,200,75,0.4);color:#e8c84b;
}
.tbar-btn.undo:active{background:rgba(232,200,75,0.22);}
.tbar-btn.undo:disabled{
  opacity:0.3;cursor:not-allowed;
  background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.3);
}
.tbar-btn.gear{
  font-size:1rem;padding:0 10px;
}
.tbar-select,.tbar-input{
  height:34px;border-radius:8px;
  border:1px solid rgba(255,255,255,0.15);
  background:#1a1e26;
  color:#e8e4dc;font-family:'Cinzel',serif;font-size:0.58rem;
  letter-spacing:0.07em;outline:none;-webkit-appearance:none;
  padding:0 8px;cursor:pointer;
}
.tbar-select option{
  background:#1a1e26;color:#e8e4dc;
}
.tbar-select{width:100px;}
.tbar-input{width:42px;text-align:center;}
.tbar-input::-webkit-inner-spin-button{-webkit-appearance:none;}
.mod-pips{display:flex;gap:2px;align-items:center;max-width:60px;flex-wrap:nowrap;}
.mod-pip{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.1);flex-shrink:0;}
.mod-pip.on{background:#e8c84b;}
.mod-pip-overflow{
  font-family:'Cinzel',serif;font-size:0.45rem;letter-spacing:0.05em;
  color:rgba(232,200,75,0.7);flex-shrink:0;margin-left:1px;
}

/* ── GENERIC ARTIFACT/CREATURE FLAG CHIPS ── */
.generic-flags-row{
  display:none; /* toggled on via JS when relevant */
  align-items:center;gap:6px;
  padding:3px 8px;flex-shrink:0;
}
.generic-flags-row.show{display:flex;}
.generic-flags-label{
  font-family:'Cinzel',serif;font-size:0.52rem;letter-spacing:0.06em;
  color:rgba(255,255,255,0.3);text-transform:uppercase;
}
.generic-flag-chip{
  height:22px;padding:0 10px;border-radius:11px;cursor:pointer;
  border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.04);
  color:rgba(255,255,255,0.45);font-family:'Cinzel',serif;font-size:0.56rem;letter-spacing:0.05em;
}
.generic-flag-chip.on{
  background:rgba(96,180,232,0.18);border-color:rgba(96,180,232,0.5);color:#60b4e8;
}
.generic-flag-chip:active{opacity:0.7;}

/* ── GRID ── */
.grid{
  flex:1;display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:5px;padding:5px;min-height:0;
}
@media(max-aspect-ratio:1/1){
  .grid{grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(2,1fr);}
}

/* ── TOKEN CARD ── */
.tok-card{
  background:#0f1218;
  border:1.5px solid rgba(255,255,255,0.07);
  border-radius:13px;
  display:flex;flex-direction:column;
  overflow:hidden;position:relative;
}
.tok-card.lit{border-color:var(--c);}

/* Container anchors the stack of transient +X/-X popups for one token type */
.tok-delta-container{
  position:absolute;top:6px;right:8px;left:8px;
  height:1px;
  z-index:5;
  pointer-events:none;
  display:flex;justify-content:flex-end;
}
/* Each tap/sacrifice spawns one of these. They start low/transparent,
   then rise + fade on the next frame, and stack upward if several land
   in quick succession (via the inline `bottom` offset set in JS). */
.tok-delta-popup{
  position:absolute;right:0;top:0;
  font-family:'Cinzel',serif;font-weight:900;
  font-size:clamp(1rem,2.4vw,1.5rem);
  white-space:nowrap;
  opacity:0;transform:translateY(10px) scale(0.8);
  transition:opacity 0.9s ease-out,transform 0.9s ease-out;
  text-shadow:0 1px 5px rgba(0,0,0,0.95),0 0 8px rgba(0,0,0,0.6);
}
.tok-delta-popup.rise{
  opacity:1;transform:translateY(-26px) scale(1);
  transition:opacity 0.9s ease-out 0.05s,transform 0.9s ease-out 0.05s;
}
.tok-delta-popup.positive{color:#5fd97a;}
.tok-delta-popup.negative{color:#e86060;}

/* Art fills the full card behind everything */
.tok-art{
  position:absolute;inset:0;
  width:100%;height:100%;
  object-fit:cover;object-position:center;
  opacity:0;
  transition:opacity 0.3s;
  pointer-events:none;
  z-index:0;
}
.tok-card.lit .tok-art{opacity:0.38;}

/* Dark scrim so numbers stay readable over art */
.tok-scrim{
  position:absolute;inset:0;
  background:rgba(8,10,14,0.55);
  pointer-events:none;
  z-index:0;
  opacity:0;
  transition:opacity 0.3s;
}
.tok-card.lit .tok-scrim{opacity:1;}

/* Everything inside the card needs to sit above the art */
.tok-name,.tok-half,.tok-mid{position:relative;z-index:1;}

/* Token name */
.tok-name{
  font-family:'Cinzel',serif;
  font-size:clamp(0.75rem,1.8vw,1.1rem);
  letter-spacing:0.18em;
  color:rgba(255,255,255,0.2);
  text-align:center;
  padding:6px 4px 2px;
  flex-shrink:0;
  line-height:1;
}
.tok-card.lit .tok-name{color:var(--c);}

/* ── HALF: untapped on top, tapped on bottom ── */
.tok-half{
  flex:1;position:relative;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:0;overflow:hidden;
  cursor:pointer;
}
.tok-half.untapped{border-bottom:1px solid rgba(255,255,255,0.06);}

/* full-width left/right tap zones, z:0 */
.tap-zone{
  position:absolute;top:0;bottom:0;width:50%;
  z-index:0;touch-action:none;
  transition:background-color 0.06s;
}
.tap-zone.left{left:0;}
.tap-zone.right{right:0;}
.tap-zone.left.active{background:rgba(220,70,60,0.22);}
.tap-zone.right.active{background:rgba(60,200,110,0.2);}

/* Big number, pointer-events none so zones receive touch */
.tok-num{
  position:relative;z-index:1;pointer-events:none;
  font-size:clamp(2.2rem,7vw,6rem);
  font-weight:700;line-height:1;
  color:rgba(255,255,255,0.08);
  transition:color 0.15s;
  text-align:center;
}
.tok-card.lit .tok-num{color:var(--c);}

/* −  + edge hints */
.tok-hints{
  position:absolute;inset:0;z-index:1;pointer-events:none;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 8px;
}
.tok-hint{
  font-size:clamp(0.9rem,2.5vw,1.8rem);
  font-weight:900;
  color:rgba(255,255,255,0.2);
  line-height:1;
}

/* State label — flows in normal document order directly below the number */
.tok-state-lbl{
  position:relative;z-index:1;pointer-events:none;
  text-align:center;
  font-family:'Cinzel',serif;
  font-size:clamp(0.5rem,1.1vw,0.7rem);
  letter-spacing:0.15em;
  color:rgba(255,255,255,0.35);
  margin-top:3px;
}
.tok-card.lit .tok-state-lbl{color:rgba(255,255,255,0.6);}

/* ── MIDDLE ROW: tap / untap buttons ── */
.tok-mid{
  flex-shrink:0;
  display:flex;gap:4px;padding:4px 5px;
  background:rgba(0,0,0,0.35);
  border-top:1px solid rgba(255,255,255,0.07);
  border-bottom:1px solid rgba(255,255,255,0.07);
}
.mid-btn{
  flex:1;height:40px;border-radius:6px;
  border:1px solid rgba(255,255,255,0.18);
  background:rgba(255,255,255,0.07);
  color:rgba(255,255,255,0.7);
  font-family:'Cinzel',serif;
  font-size:clamp(0.42rem,0.95vw,0.6rem);
  letter-spacing:0.08em;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:4px;
}
.mid-btn:active{background:rgba(255,255,255,0.18);}
.mtg-sym{
  display:inline-block;width:32px;height:32px;flex-shrink:0;vertical-align:middle;
}

/* no flash animation */

/* ── SHARED MODAL PATTERN ──
   Used by: reset confirm, qty popover, profile name prompt,
   delete/switch profile confirm, and (with .fullscreen) the
   first-launch and settings screens. One backdrop+box system
   instead of several near-duplicate ones. */
.modal-backdrop{
  position:fixed;inset:0;background:rgba(0,0,0,0.75);
  z-index:80;display:flex;align-items:center;justify-content:center;
  opacity:0;pointer-events:none;transition:opacity 0.15s;
}
.modal-backdrop.open{opacity:1;pointer-events:auto;}
/* Modals that must render above the settings screen (z-index 90) */
.modal-backdrop.above-settings{z-index:96;}
/* Full-screen variant (settings panel, first-launch) instead of a centered box */
.modal-backdrop.fullscreen{background:#0a0c0f;}

.modal-box{
  background:#181c26;border:1px solid rgba(255,255,255,0.12);
  border-radius:16px;padding:22px 20px 16px;
  display:flex;flex-direction:column;align-items:center;gap:14px;
  min-width:220px;
}
.modal-title{
  font-family:'Cinzel',serif;font-size:0.8rem;
  letter-spacing:0.15em;color:rgba(255,255,255,0.7);text-align:center;
}
.modal-title strong{color:var(--mc,#fff);}
.modal-sub{
  font-size:0.68rem;color:rgba(255,255,255,0.3);
  font-family:'Cinzel',serif;letter-spacing:0.08em;
  text-align:center;margin-top:-8px;
}
.modal-btns{display:flex;gap:8px;width:100%;}
.modal-btn{
  flex:1;height:42px;border-radius:10px;cursor:pointer;
  font-family:'Cinzel',serif;font-size:0.6rem;letter-spacing:0.1em;
  border:1px solid rgba(255,255,255,0.12);
  background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.5);
}
.modal-btn:active{opacity:0.7;}
.modal-btn.danger{
  background:rgba(220,70,60,0.2);border-color:rgba(220,70,60,0.5);
  color:rgba(255,120,110,0.9);
}
.modal-btn.accent{
  background:rgba(96,180,232,0.18);border-color:rgba(96,180,232,0.5);
  color:#60b4e8;
}

/* Quantity stepper, used inside .modal-box for the mod-quantity popover */
.qty-row{display:flex;align-items:center;gap:16px;}
.qty-btn{
  width:44px;height:44px;border-radius:10px;cursor:pointer;
  border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.07);
  color:#e8e4dc;font-size:1.4rem;font-weight:700;
  display:flex;align-items:center;justify-content:center;
}
.qty-btn:active{background:rgba(255,255,255,0.18);}
.qty-val{
  font-size:2.5rem;font-weight:700;color:#fff;
  min-width:40px;text-align:center;font-family:'Oswald',sans-serif;
}
.mod-qty-badge{
  position:absolute;top:4px;right:4px;
  background:rgba(0,0,0,0.7);border-radius:4px;
  padding:1px 4px;font-family:'Cinzel',serif;
  font-size:0.5rem;letter-spacing:0.05em;color:#fff;
  z-index:2;pointer-events:none;
}

/* Plain text input shared by name prompts (profile name, etc) */
.modal-text-input{
  width:100%;height:44px;border-radius:10px;
  border:1px solid rgba(255,255,255,0.15);background:#1a1e26;
  color:#e8e4dc;font-family:'Oswald',sans-serif;font-size:0.85rem;
  padding:0 14px;outline:none;text-align:center;
}
.modal-text-input::placeholder{color:rgba(255,255,255,0.25);}

/* ── FLITWING POPUPS ── */
.flitwing-box{max-width:340px;width:92%;}
.flitwing-options{display:flex;flex-direction:column;gap:8px;width:100%;}
.flitwing-option{
  border:1px solid rgba(255,255,255,0.12);border-radius:10px;
  padding:10px 12px;cursor:pointer;background:rgba(255,255,255,0.03);
  text-align:left;
}
.flitwing-option:active{background:rgba(255,255,255,0.08);}
.flitwing-option-label{
  font-family:'Cinzel',serif;font-size:0.66rem;letter-spacing:0.08em;
  color:#e8e4dc;margin-bottom:5px;
}
.flitwing-option-breakdown{
  display:flex;flex-wrap:wrap;gap:5px;
}
.flitwing-chip{
  font-family:'Oswald',sans-serif;font-size:0.62rem;
  padding:2px 7px;border-radius:5px;
  background:rgba(96,180,232,0.15);color:#60b4e8;
  border:1px solid rgba(96,180,232,0.3);
}
.flitwing-chip.untracked{
  background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);
  border:1px dashed rgba(255,255,255,0.2);
}
.flitwing-option-breakdown:empty::after{
  content:'nothing created';
  font-size:0.6rem;color:rgba(255,255,255,0.25);font-style:italic;
}
.flitwing-lock-row{
  display:flex;align-items:center;gap:8px;
  font-size:0.66rem;color:rgba(255,255,255,0.5);
  font-family:'Cinzel',serif;letter-spacing:0.04em;
  margin-top:2px;cursor:pointer;
}
.flitwing-lock-row input{width:15px;height:15px;flex-shrink:0;}

.flitwing-lock-options{display:flex;flex-direction:column;gap:8px;width:100%;}
.flitwing-lock-option{
  border:1px solid rgba(255,255,255,0.12);border-radius:10px;
  padding:11px 12px;cursor:pointer;background:rgba(255,255,255,0.03);
  font-family:'Cinzel',serif;font-size:0.66rem;letter-spacing:0.06em;
  color:rgba(255,255,255,0.6);text-align:left;
}
.flitwing-lock-option.active{
  border-color:#60b4e8;background:rgba(96,180,232,0.12);color:#60b4e8;
}
.flitwing-lock-option:active{background:rgba(255,255,255,0.08);}

/* ── DRAWER ── */
.backdrop{
  position:fixed;inset:0;background:rgba(0,0,0,0.75);
  z-index:50;opacity:0;pointer-events:none;transition:opacity 0.2s;
}
.backdrop.open{opacity:1;pointer-events:auto;}
.drawer{
  position:fixed;bottom:0;left:0;right:0;
  background:#111520;border-top:1px solid rgba(255,255,255,0.09);
  border-radius:18px 18px 0 0;z-index:51;
  padding:10px 10px 32px;
  transform:translateY(100%);
  transition:transform 0.24s cubic-bezier(0.32,0.72,0,1);
  max-height:85dvh;overflow-y:auto;
}
.drawer.open{transform:translateY(0);}
.drawer-handle{width:36px;height:4px;background:rgba(255,255,255,0.15);border-radius:2px;margin:0 auto 10px;}
.mods-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;}
.mod-tile{
  border:2px solid rgba(255,255,255,0.07);
  border-radius:9px;cursor:pointer;overflow:hidden;position:relative;
  -webkit-touch-callout:none;
  touch-action:pan-y;
}
.mod-tile.on{border-color:var(--mc);}
.mod-tile.on::after{
  content:'';position:absolute;inset:0;
  background:var(--mc);opacity:0.13;pointer-events:none;
}
.mod-art{
  width:100%;aspect-ratio:3/4;object-fit:cover;object-position:center top;
  display:block;background:#1e2330;opacity:0.4;transition:opacity 0.15s;
}
.mod-tile.on .mod-art{opacity:1;}
.mod-art-wrap{position:relative;}
.mod-art-label{
  position:absolute;bottom:0;left:0;right:0;
  padding:12px 4px 4px;
  background:linear-gradient(transparent,rgba(8,10,14,0.9));
  font-family:'Cinzel',serif;font-size:0.46rem;letter-spacing:0.05em;
  color:rgba(255,255,255,0.4);line-height:1.2;text-align:center;
}
.mod-tile.on .mod-art-label{color:#e8e4dc;}
.mod-action-tile{
  aspect-ratio:3/4;border-radius:9px;cursor:pointer;
  border:1.5px solid rgba(255,255,255,0.09);
  background:rgba(255,255,255,0.03);
  color:rgba(255,255,255,0.35);
  font-family:'Cinzel',serif;font-size:0.62rem;letter-spacing:0.1em;
  display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.5;
}
.mod-action-tile:active{background:rgba(255,255,255,0.09);}

/* (qty stepper styles consolidated into the shared modal pattern above) */

/* ── SETTINGS SCREEN ── (uses .modal-backdrop.fullscreen, z-index raised so qty/confirm modals can sit above it via .above-settings) */
.settings-backdrop{z-index:90;}
.settings-panel{
  width:100%;height:100%;display:flex;flex-direction:column;
  max-width:600px;margin:0 auto;
}
.settings-header{
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.08);
  flex-shrink:0;
}
.settings-title{
  font-family:'Cinzel',serif;font-size:0.85rem;letter-spacing:0.25em;font-weight:900;
}
.settings-close{
  width:32px;height:32px;border-radius:8px;
  border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);
  color:#e8e4dc;font-size:0.9rem;cursor:pointer;
}
.settings-close:active{background:rgba(255,255,255,0.12);}
.settings-body{
  flex:1;overflow-y:auto;padding:14px 16px;
}
.settings-section-label{
  font-family:'Cinzel',serif;font-size:0.62rem;letter-spacing:0.15em;
  color:rgba(255,255,255,0.4);text-transform:uppercase;
  margin:18px 0 8px;
}
.settings-section-label:first-child{margin-top:0;}
.settings-section-label span{color:rgba(255,255,255,0.25);font-style:italic;letter-spacing:0.05em;}

.settings-token-grid{
  display:grid;grid-template-columns:repeat(3,1fr);gap:8px;
}
.settings-token-tile{
  border:2px solid rgba(255,255,255,0.08);border-radius:10px;
  cursor:pointer;overflow:hidden;position:relative;
  aspect-ratio:1;
}
.settings-token-tile.on{border-color:var(--tc);}
.settings-token-tile.on::after{
  content:'';position:absolute;inset:0;background:var(--tc);opacity:0.15;pointer-events:none;
}
.settings-token-tile.disabled{opacity:0.3;cursor:not-allowed;}
.settings-token-art{
  width:100%;height:100%;object-fit:cover;opacity:0.45;
}
.settings-token-tile.on .settings-token-art{opacity:0.9;}
.settings-token-label{
  position:absolute;bottom:0;left:0;right:0;
  padding:8px 4px 4px;
  background:linear-gradient(transparent,rgba(8,10,14,0.92));
  font-family:'Cinzel',serif;font-size:0.6rem;letter-spacing:0.06em;
  color:rgba(255,255,255,0.5);text-align:center;
}
.settings-token-tile.on .settings-token-label{color:#e8e4dc;}
.settings-token-check{
  position:absolute;top:5px;right:5px;
  width:18px;height:18px;border-radius:50%;
  background:rgba(0,0,0,0.5);border:1.5px solid rgba(255,255,255,0.3);
  display:flex;align-items:center;justify-content:center;
  font-size:0.6rem;color:transparent;
}
.settings-token-tile.on .settings-token-check{
  background:var(--tc);border-color:var(--tc);color:#0a0c0f;
}

.settings-mod-list{
  display:flex;flex-direction:column;gap:6px;
}
.settings-mod-row{
  display:flex;align-items:center;gap:10px;
  padding:8px 10px;border-radius:8px;
  border:1px solid rgba(255,255,255,0.08);
  background:rgba(255,255,255,0.02);
  cursor:pointer;
}
.settings-mod-row.on{border-color:var(--mc);background:rgba(255,255,255,0.04);}
.settings-mod-thumb{
  width:36px;height:36px;border-radius:6px;object-fit:cover;flex-shrink:0;
  opacity:0.5;
}
.settings-mod-row.on .settings-mod-thumb{opacity:1;}
.settings-mod-info{flex:1;min-width:0;}
.settings-mod-name{
  font-family:'Cinzel',serif;font-size:0.68rem;letter-spacing:0.05em;
  color:rgba(255,255,255,0.5);
}
.settings-mod-row.on .settings-mod-name{color:#e8e4dc;}
.settings-mod-tag{
  font-size:0.56rem;color:rgba(255,255,255,0.22);
  letter-spacing:0.05em;margin-top:2px;
}
.settings-mod-toggle{
  width:38px;height:22px;border-radius:11px;flex-shrink:0;
  background:rgba(255,255,255,0.1);position:relative;
  transition:background 0.15s;
}
.settings-mod-row.on .settings-mod-toggle{background:var(--mc);}
.settings-mod-toggle::after{
  content:'';position:absolute;top:2px;left:2px;
  width:18px;height:18px;border-radius:50%;background:#fff;
  transition:transform 0.15s;
}
.settings-mod-row.on .settings-mod-toggle::after{transform:translateX(16px);}

/* Alt-art star button — only rendered when a -alt.jpg variant exists */
.alt-art-btn{
  width:28px;height:28px;border-radius:50%;flex-shrink:0;
  border:1px solid rgba(255,255,255,0.15);
  background:rgba(255,255,255,0.05);
  color:rgba(255,255,255,0.3);
  font-size:0.85rem;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;
}
.alt-art-btn.active{
  background:rgba(232,200,75,0.18);border-color:rgba(232,200,75,0.6);
  color:#e8c84b;
}
.alt-art-btn:active{opacity:0.7;}

/* Token settings tile star button, positioned top-left so it doesn't clash with the check mark */
.settings-token-altbtn{
  position:absolute;top:5px;left:5px;z-index:3;
  width:22px;height:22px;border-radius:50%;
  border:1px solid rgba(255,255,255,0.2);
  background:rgba(0,0,0,0.5);color:rgba(255,255,255,0.4);
  font-size:0.7rem;display:flex;align-items:center;justify-content:center;
  cursor:pointer;
}
.settings-token-altbtn.active{
  background:rgba(232,200,75,0.3);border-color:#e8c84b;color:#e8c84b;
}

.settings-footer{
  flex-shrink:0;padding:12px 16px;border-top:1px solid rgba(255,255,255,0.08);
}
.settings-save{
  width:100%;height:46px;border-radius:10px;cursor:pointer;
  background:rgba(96,180,232,0.18);border:1px solid rgba(96,180,232,0.5);
  color:#60b4e8;font-family:'Cinzel',serif;font-size:0.7rem;letter-spacing:0.15em;
}
.settings-save:active{background:rgba(96,180,232,0.3);}
.settings-refresh{
  width:100%;height:36px;border-radius:10px;cursor:pointer;margin-top:8px;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);
  color:rgba(255,255,255,0.35);font-family:'Cinzel',serif;font-size:0.58rem;letter-spacing:0.12em;
}
.settings-refresh:active{background:rgba(255,255,255,0.09);color:rgba(255,255,255,0.6);}

/* ── PROFILE BAR (inside settings) ── */
.profile-bar{display:flex;gap:8px;}
.profile-select{
  flex:1;height:40px;border-radius:8px;
  border:1px solid rgba(255,255,255,0.15);background:#1a1e26;
  color:#e8e4dc;font-family:'Cinzel',serif;font-size:0.65rem;
  letter-spacing:0.05em;padding:0 10px;outline:none;-webkit-appearance:none;
}
.profile-select option{background:#1a1e26;color:#e8e4dc;}
.profile-btn{
  height:40px;padding:0 14px;border-radius:8px;cursor:pointer;
  border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);
  color:#e8e4dc;font-family:'Cinzel',serif;font-size:0.6rem;letter-spacing:0.08em;
  white-space:nowrap;
}
.profile-btn:active{background:rgba(255,255,255,0.12);}
.profile-actions{display:flex;gap:8px;margin-top:8px;}
.profile-btn.small{flex:1;height:32px;font-size:0.56rem;}
.profile-btn.danger{
  background:rgba(220,70,60,0.12);border-color:rgba(220,70,60,0.4);
  color:rgba(255,120,110,0.85);
}
.profile-btn.danger:active{background:rgba(220,70,60,0.25);}


/* ── FIRST LAUNCH SCREEN ── (uses .modal-backdrop.fullscreen) */
.firstlaunch-box{
  display:flex;flex-direction:column;align-items:center;gap:18px;
  padding:32px 28px;max-width:380px;width:90%;
}
.firstlaunch-title{
  font-family:'Cinzel',serif;font-size:1rem;letter-spacing:0.2em;
  font-weight:900;text-align:center;color:#e8e4dc;
}
.firstlaunch-sub{
  font-size:0.78rem;color:rgba(255,255,255,0.4);text-align:center;
  line-height:1.6;
}
</style>
</head>
<body>

<div class="topbar">
  <div class="topbar-title">MANUFACTOR</div>
  <div class="topbar-center">
    <select id="createType" class="tbar-select" onchange="updateGenericFlagsVisibility()">
      <option value="generic" selected>Generic</option>
    </select>
    <input type="number" id="createAmt" class="tbar-input" value="1" min="1" max="99">
    <button class="tbar-btn create" onclick="bulkCreate()">CREATE</button>
  </div>
  <div class="topbar-right">
    <button class="tbar-btn undo" id="undoBtn" onclick="undo()" title="Undo last action">↺ UNDO</button>
    <button class="tbar-btn untap" onclick="untapAll()"><svg style="width:14px;height:14px;display:inline-block;vertical-align:middle;transform:rotate(180deg);flex-shrink:0" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg"><path d="m512 353.5-216 0 79.1-56.3c-29.4-23.3-63.4-35-101.9-35-19.3 0-32.5 3.7-39.5 11-7.1 7.4-10.7 20.7-10.7 39.9 0 53.2 27.4 110 82.2 170.4l-62.3 63.1c-72.5-88.2-108.8-167.1-108.8-236.5 0-41.6 12.5-74.7 37.6-99.3 25.1-24.6 58.5-36.9 100-36.9 50.7 0 106 19.3 165.9 57.8l46.4-79.1 28.2 200.8" fill="currentColor"/></svg> ALL</button>
    <button class="tbar-btn" onclick="openDrawer()">
      MODS <div class="mod-pips" id="modPips"></div>
    </button>
    <button class="tbar-btn gear" onclick="openSettings()" title="Settings">⚙</button>
  </div>
</div>

<div class="generic-flags-row" id="genericFlagsRow">
  <span class="generic-flags-label">this token is:</span>
  <button class="generic-flag-chip" id="genericArtifactChip" onclick="toggleGenericFlag('artifact')">Artifact</button>
  <button class="generic-flag-chip" id="genericCreatureChip" onclick="toggleGenericFlag('creature')">Creature</button>
</div>

<div class="grid" id="tokenGrid"></div>

<div class="backdrop" id="backdrop" onclick="closeDrawer()"></div>
<div class="drawer" id="drawer">
  <div class="drawer-handle"></div>
  <div class="mods-grid" id="modsGrid"></div>
</div>

<div class="modal-backdrop" id="qtyBackdrop" data-modal="qtyBackdrop">
  <div class="modal-box" onclick="event.stopPropagation()">
    <div class="modal-title">Copies of <strong id="qtyName"></strong></div>
    <div class="qty-row">
      <button class="qty-btn" onclick="adjustQty(-1)">−</button>
      <div class="qty-val" id="qtyVal">1</div>
      <button class="qty-btn" onclick="adjustQty(1)">+</button>
    </div>
    <button class="modal-btn accent" style="width:100%;" onclick="closeQty()">DONE</button>
  </div>
</div>

<div class="modal-backdrop" id="confirmBackdrop" data-modal="confirmBackdrop">
  <div class="modal-box">
    <div class="modal-title">RESET ALL?</div>
    <div class="modal-sub">Clears all tokens &amp; modifiers</div>
    <div class="modal-btns">
      <button class="modal-btn" onclick="closeConfirm()">CANCEL</button>
      <button class="modal-btn danger" onclick="confirmReset()">RESET</button>
    </div>
  </div>
</div>

<div class="modal-backdrop fullscreen" id="settingsBackdrop" data-modal="settingsBackdrop">
  <div class="settings-panel">
    <div class="settings-header">
      <div class="settings-title">SETTINGS</div>
      <button class="settings-close" onclick="closeSettings()">✕</button>
    </div>
    <div class="settings-body">
      <div class="settings-section-label">Deck Profile</div>
      <div class="profile-bar">
        <select id="profileSelect" class="profile-select"></select>
        <button class="profile-btn" onclick="openNewProfilePrompt()">+ NEW</button>
      </div>
      <div class="profile-actions">
        <button class="profile-btn small" onclick="openRenamePrompt()">RENAME</button>
        <button class="profile-btn small danger" onclick="openDeleteProfileConfirm()">DELETE</button>
      </div>

      <div class="settings-section-label">Token Types <span id="tokenPickCount">(0/4)</span></div>
      <div class="settings-token-grid" id="settingsTokenGrid"></div>

      <div class="settings-section-label">Available Modifiers</div>
      <div class="settings-mod-list" id="settingsModList"></div>
    </div>
    <div class="settings-footer">
      <button class="settings-save" onclick="saveSettings()">SAVE</button>
      <button class="settings-refresh" onclick="forceRefresh()" title="Force the app to fetch the latest version">↻ REFRESH APP</button>
    </div>
  </div>
</div>

<!-- First-launch: forces creating a profile before the app is usable -->
<div class="modal-backdrop fullscreen" id="firstLaunchBackdrop" data-modal="firstLaunchBackdrop">
  <div class="firstlaunch-box">
    <div class="firstlaunch-title">WELCOME TO MANUFACTOR</div>
    <div class="firstlaunch-sub">Create a deck profile to get started.<br>Each profile remembers which 4 token types and which modifiers your deck uses.</div>
    <input type="text" id="firstLaunchName" class="modal-text-input" placeholder="Deck name" maxlength="40">
    <button class="modal-btn accent" style="width:100%;height:48px;" onclick="createFirstProfile()">CREATE PROFILE</button>
  </div>
</div>

<!-- New / Rename profile name prompt -->
<div class="modal-backdrop above-settings" id="profileNameBackdrop" data-modal="profileNameBackdrop">
  <div class="modal-box">
    <div class="modal-title" id="profileNamePromptTitle">New Profile</div>
    <input type="text" id="profileNameInput" class="modal-text-input" placeholder="Deck name" maxlength="40">
    <div class="modal-btns">
      <button class="modal-btn" onclick="closeProfileNamePrompt()">CANCEL</button>
      <button class="modal-btn danger" id="profileNameConfirmBtn" onclick="confirmProfileName()">CREATE</button>
    </div>
  </div>
</div>

<!-- Delete profile confirm -->
<div class="modal-backdrop above-settings" id="deleteProfileBackdrop" data-modal="deleteProfileBackdrop">
  <div class="modal-box">
    <div class="modal-title">DELETE PROFILE?</div>
    <div class="modal-sub" id="deleteProfileSub">This cannot be undone.</div>
    <div class="modal-btns">
      <button class="modal-btn" onclick="closeDeleteProfileConfirm()">CANCEL</button>
      <button class="modal-btn danger" onclick="confirmDeleteProfile()">DELETE</button>
    </div>
  </div>
</div>

<!-- Switch profile confirm (board reset warning) -->
<div class="modal-backdrop above-settings" id="switchProfileBackdrop" data-modal="switchProfileBackdrop">
  <div class="modal-box">
    <div class="modal-title">SWITCH PROFILE?</div>
    <div class="modal-sub">This clears the current board &amp; modifiers.</div>
    <div class="modal-btns">
      <button class="modal-btn" onclick="closeSwitchProfileConfirm()">CANCEL</button>
      <button class="modal-btn danger" onclick="confirmSwitchProfile()">SWITCH</button>
    </div>
  </div>
</div>

<!-- Flitwing: per-event choice popup (shown when active & unlocked) -->
<div class="modal-backdrop above-settings" id="flitwingChoiceBackdrop" data-modal="flitwingChoiceBackdrop">
  <div class="modal-box flitwing-box">
    <div class="modal-title">Flitwing, Lyev Detective</div>
    <div class="modal-sub">Convert to Clues?</div>
    <div class="flitwing-options" id="flitwingOptions"></div>
    <label class="flitwing-lock-row">
      <input type="checkbox" id="flitwingLockCheckbox">
      <span>Always do this for this deck</span>
    </label>
  </div>
</div>

<!-- Flitwing: lock configuration popup (hold the tile in the MODS drawer) -->
<div class="modal-backdrop above-settings" id="flitwingLockBackdrop" data-modal="flitwingLockBackdrop">
  <div class="modal-box flitwing-box">
    <div class="modal-title">Flitwing Lock</div>
    <div class="modal-sub">Choose what happens every time, or ask each time</div>
    <div class="flitwing-lock-options" id="flitwingLockOptions"></div>
    <button class="modal-btn accent" style="width:100%;" onclick="closeModal('flitwingLockBackdrop')">DONE</button>
  </div>
</div>


<script>
// ── Full known libraries (append-only as new cards get added) ──────
var TOKEN_LIBRARY = {
  clue:     { label:'Clue',     c:'#60b4e8', img:'img/clue-token.jpg'     },
  food:     { label:'Food',     c:'#e8a87c', img:'img/food-token.jpg'     },
  treasure: { label:'Treasure', c:'#4ecba8', img:'img/treasure-token.jpg' },
  mutagen:  { label:'Mutagen',  c:'#b87ee8', img:'img/mutagen-token.jpg'  },
  map:      { label:'Map',      c:'#e8c84b', img:'img/map-token.jpg'      },
};
// All 5 tracked types are artifacts (established earlier); none are creatures.

// "Phantom" tokens: creature/artifact types some mods create that the app
// doesn't track by name on the board (Squirrel, Frog, Soldier, Thopter).
// They still flow through the pipeline with real flags so other predicate
// mods (Allenal, Ojer Taq, Stridehangar) can react to them — they just get
// silently discarded at the final apply-to-state step, same as Generic.
var PHANTOM_TOKENS = {
  squirrel: { label:'Squirrel', isArtifact:false, isCreature:true },
  frog:     { label:'Frog',     isArtifact:false, isCreature:true },
  soldier:  { label:'Soldier',  isArtifact:false, isCreature:true },
  thopter:  { label:'Thopter',  isArtifact:true,  isCreature:true },
};

// Looks up the correct isArtifact/isCreature flags for a token type.
function getTokenFlags(type) {
  if (TOKEN_LIBRARY[type]) return { isArtifact:true, isCreature:false };
  if (PHANTOM_TOKENS[type]) return { isArtifact:PHANTOM_TOKENS[type].isArtifact, isCreature:PHANTOM_TOKENS[type].isCreature };
  return { isArtifact:false, isCreature:false }; // generic, unflagged
}
function getTokenDisplayLabel(type) {
  if (TOKEN_LIBRARY[type]) return TOKEN_LIBRARY[type].label;
  if (PHANTOM_TOKENS[type]) return PHANTOM_TOKENS[type].label;
  return 'Token';
}

// Returns token IDs sorted in TOKEN_LIBRARY's canonical display order
function canonicalTokenOrder(ids) {
  var order = Object.keys(TOKEN_LIBRARY);
  return ids.slice().sort(function(a,b){ return order.indexOf(a) - order.indexOf(b); });
}

var MOD_LIBRARY = [
  // ── Doublers (alphabetical) ──
  { id:'adrix',       name:'Adrix & Nev',                  mc:'#7ec8e8', img:'img/adrix-and-nev-twincasters.jpg',     mechanic:'double' },
  { id:'procession',  name:'Anointed Procession',          mc:'#e8d8a0', img:'img/anointed-procession.jpg',           mechanic:'double' },
  { id:'bard',        name:'Bard, King of Dale',            mc:'#e8d060', img:'img/bard-king-of-dale.jpg',             mechanic:'double' },
  { id:'doubling',    name:'Doubling Season',               mc:'#7ecb6f', img:'img/doubling-season.jpg',               mechanic:'double' },
  { id:'elspeth',     name:'Elspeth',                       mc:'#e8d060', img:'img/elspeth.jpg',                       mechanic:'double' },
  { id:'exalted',     name:'Exalted Sunborn',               mc:'#e8c060', img:'img/exalted-sunborn.jpg',               mechanic:'double' },
  { id:'mondrak',     name:'Mondrak',                       mc:'#e8a0c0', img:'img/mondrak-glory-dominus.jpg',         mechanic:'double' },
  { id:'parallel',    name:'Parallel Lives',                mc:'#7ecb6f', img:'img/parallel-lives.jpg',                mechanic:'double' },
  { id:'primal',      name:'Primal Vigor',                  mc:'#e87860', img:'img/primal-vigor.jpg',                  mechanic:'double' },

  // ── Replacement (triples Clue/Food/Treasure) ──
  { id:'manufactor',  name:'Academy Manufactor',           mc:'#e8d060', img:'img/academy-manufactor.jpg',            mechanic:'manufactor' },

  // ── Adds a specific token every time, no condition (alphabetical) ──
  { id:'pilfered',    name:'Case of the Pilfered Proof',   mc:'#60b4e8', img:'img/case-of-the-pilfered-proof.jpg',    mechanic:'addToken', addsTokenType:'clue' },
  { id:'donatello',   name:'Donatello',                     mc:'#b87ee8', img:'img/donatello-the-brains.jpg',          mechanic:'addToken', addsTokenType:'mutagen' },
  { id:'peregrin',    name:'Peregrin Took',                mc:'#7ecb6f', img:'img/peregrin-took.jpg',                 mechanic:'addToken', addsTokenType:'food' },
  { id:'quina',       name:'Quina, Qu Gourmet',             mc:'#7ecb6f', img:'img/quina-qu-gourmet.jpg',              mechanic:'addToken', addsTokenType:'frog' },
  { id:'tippy',       name:'Tippy-Toe',                     mc:'#7ecb6f', img:'img/tippy-toe.jpg',                     mechanic:'addToken', addsTokenType:'food' },

  // ── Adds extra only when a specific token type is already being made (alphabetical) ──
  { id:'bilbo',       name:'Bilbo',                         mc:'#7ecb6f', img:'img/bilbo.jpg',                         mechanic:'replaceToken', triggersOnType:'food', addsTokenType:'treasure' },
  { id:'jolene',      name:'Jolene',                        mc:'#4ecba8', img:'img/jolene-the-plunder-queen.jpg',      mechanic:'addTokenIfPresent', addsTokenType:'treasure', triggerTokenType:'treasure' },
  { id:'xorn',        name:'Xorn',                          mc:'#4ecba8', img:'img/xorn.jpg',                          mechanic:'addTokenIfPresent', addsTokenType:'treasure', triggerTokenType:'treasure' },

  // ── Predicate-conditional adds: fire if the batch contains any token
  //    matching a property (artifact / creature), not a specific named type.
  //    These join a late-stage permutation search (after Manufactor) since
  //    they can enable each other and want to see the largest batch.
  { id:'helm',        name:'Worldwalker Helm',             mc:'#e87860', img:'img/worldwalker-helm.jpg',              mechanic:'predicateAdd', conditionPredicate:'isArtifact', addsTokenType:'map' },
  { id:'stridehangar',name:'Stridehangar Automaton',        mc:'#a0b8c8', img:'img/stridehangar-automaton.jpg',        mechanic:'predicateAdd', conditionPredicate:'isArtifact', addsTokenType:'thopter' },
  { id:'allenal',     name:'Queen Allenal of Ruadach',       mc:'#7ecb6f', img:'img/queen-allenal-of-ruadach.jpg',      mechanic:'predicateAdd', conditionPredicate:'isCreature', addsTokenType:'soldier' },

  // ── Wildcard replacement: adds one of a fixed token for EVERY token in
  //    the batch, regardless of type. Also joins the late-stage search,
  //    since it wants to see the largest possible batch before it fires.
  { id:'chatterfang', name:'Chatterfang',                   mc:'#e8a05c', img:'img/chatterfang.jpg',                   mechanic:'wildcardReplace', addsTokenType:'squirrel' },

  // ── Predicate multiply: triples ONLY tokens matching a property,
  //    leaving the rest of the batch untouched. Also joins the late-stage search.
  { id:'ojertaq',     name:'Ojer Taq',                       mc:'#c86050', img:'img/ojer-taq.jpg',                      mechanic:'predicateMultiply', conditionPredicate:'isCreature', multiplyBy:3 },

  // ── Sacrifice trigger ──
  { id:'vending',     name:'Nuke-Cola',                     mc:'#e8b84b', img:'img/nuka-cola-vending-machine.jpg',     mechanic:'vending' },

  // ── May-convert (player choice per event) ──
  { id:'flitwing',    name:'Flitwing',                      mc:'#60b4e8', img:'img/flitwing-lyev-detective.jpg',       mechanic:'flitwing', addsTokenType:'clue' },
];

// ── Generic modal helpers ────────────────────────────────────────
// Every modal in this app is a backdrop div toggled via the 'open' class.
// These two functions replace what used to be ~14 near-identical
// open/close function bodies scattered through the file.
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── Profiles (each profile = one deck's setup) ─────────────────────
var STORAGE_KEY = 'manufactor_profiles_v1';

function loadProfileData() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { profiles: [], activeId: null };
    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.profiles)) return { profiles: [], activeId: null };
    return parsed;
  } catch(e) { return { profiles: [], activeId: null }; }
}
function persistProfileData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      profiles: profiles,
      activeId: activeProfileId
    }));
  } catch(e) { /* localStorage unavailable, ignore */ }
}
function makeProfileId() {
  return 'p' + Date.now() + Math.floor(Math.random()*10000);
}
function getActiveProfile() {
  return profiles.find(function(p){ return p.id === activeProfileId; }) || null;
}

var profileData = loadProfileData();
var profiles = profileData.profiles;
var activeProfileId = profileData.activeId;

// Pull TT/MODS from the active profile, or fall back to empty until one exists
var activeProfile = getActiveProfile();
var TT = activeProfile ? canonicalTokenOrder(activeProfile.activeTokens) : [];
var META = TOKEN_LIBRARY; // alias for existing code that reads META
var MODS = activeProfile
  ? MOD_LIBRARY.filter(function(m){ return activeProfile.enabledMods.indexOf(m.id) !== -1; })
  : [];

var modOn = {};
MODS.forEach(function(m){ modOn[m.id] = 0; });
var state = {};
TT.forEach(function(t){ state[t] = { u:0, ta:0 }; });

// If this profile has a saved in-progress board (from a previous session
// that didn't end in Reset All), restore it now instead of starting empty.
if (activeProfileId) {
  var savedBoard = loadBoardState(activeProfileId);
  if (savedBoard) {
    TT.forEach(function(t){ if (savedBoard.state && savedBoard.state[t]) state[t] = savedBoard.state[t]; });
    MODS.forEach(function(m){ if (savedBoard.modOn && typeof savedBoard.modOn[m.id] === 'number') modOn[m.id] = savedBoard.modOn[m.id]; });
  }
}

function persistCurrentBoardToProfile() {
  // Saves TT/MODS (NOT live counts/quantities) back into the active profile record
  var p = getActiveProfile();
  if (!p) return;
  p.activeTokens = TT.slice();
  p.enabledMods = MODS.map(function(m){ return m.id; });
  persistProfileData();
}

// Flitwing's lock setting: 'ask' (default, prompts every event) | 'off' | 'tokens' | 'clues'
function getFlitwingLock() {
  var p = getActiveProfile();
  return (p && p.flitwingLock) ? p.flitwingLock : 'ask';
}
function setFlitwingLock(mode) {
  var p = getActiveProfile();
  if (!p) return;
  p.flitwingLock = mode;
  persistProfileData();
}

// ── Repeat-press helpers ──────────────────────────────────────────
// Each half gets a timer + interval for hold-to-repeat
var halfTimers  = {};  // type+'_u' or type+'_ta'
var halfIntervals = {};

function startRepeat(type, sk, delta) {
  var isFirst = true;
  function act() {
    doAction(type, sk, delta, isFirst);
    isFirst = false;
  }
  act();
  var key = type + '_' + sk;
  halfTimers[key] = setTimeout(function(){
    halfIntervals[key] = setInterval(act, 120);
    halfTimers[key] = null;
  }, 400);
}
function stopRepeat(type, sk) {
  var key = type + '_' + sk;
  clearTimeout(halfTimers[key]);
  clearInterval(halfIntervals[key]);
  halfTimers[key] = null;
  halfIntervals[key] = null;
}

// ── Creation engine ───────────────────────────────────────────────
// ── Pure pipeline computation ────────────────────────────────────────
// flitwingMode: 'off' (ignore Flitwing) | 'tokens' (convert right before
// Manufactor, maximizing total token count) | 'clues' (convert at the very
// end, after everything, maximizing Clue count). See the Flitwing analysis:
// converting immediately before Manufactor never produces fewer tokens than
// converting later, so 'tokens' mode doesn't need to compare candidates live.
// Computes the batch for one deterministic Flitwing conversion POSITION:
// 'off' (never converts), 'manufactor' (converts immediately before
// Manufactor — maximizes what Manufactor has to work with), or 'clues'
// (converts dead last, after everything — maximizes Clue count specifically).
// computeBatchForMode (below) is the public entry point; 'tokens' mode calls
// this twice and picks the winner, since neither fixed position is always
// the true maximum anymore (see the comment above the 'tokens' dispatch).
function computeBatchForPosition(tokens, flitwingMode) {
  flitwingMode = flitwingMode || 'off';
  var tapped = tokens.every(function(t){ return t.tapped; });

  // Every token in the batch carries isArtifact/isCreature so predicate-based
  // mods (Helm, Stridehangar, Allenal, Ojer Taq) can react to it, whether it's
  // one of the 5 tracked types, a phantom creature (Squirrel/Frog/etc), or a
  // player-flagged Generic token. Explicit flags on the input are respected
  // (used for Generic's Artifact/Creature toggles); otherwise looked up.
  function makeToken(type, tok_tapped, explicitFlags) {
    var flags = explicitFlags || getTokenFlags(type);
    return { type:type, tapped:tok_tapped, isArtifact:!!flags.isArtifact, isCreature:!!flags.isCreature };
  }

  var batch = tokens.map(function(t){
    var hasExplicit = t.hasOwnProperty('isArtifact') || t.hasOwnProperty('isCreature');
    return makeToken(t.type, t.tapped, hasExplicit ? { isArtifact:t.isArtifact, isCreature:t.isCreature } : null);
  });

  // ── addTokenIfPresent (Jolene, Xorn) ────────────────────────────
  // These are replacement effects where the player chooses the order they apply.
  // Since you always choose the order that benefits you most, we try every
  // permutation of active mods and pick whichever produces the most tokens.
  // Applied twice: once pre-Manufactor (triggers already present), once
  // post-Manufactor (triggers that only appeared via Manufactor's expansion).
  // Kept as its own system (rather than folded into the late-stage predicate
  // search below) because Treasure — both their trigger and their output —
  // IS Manufactor-eligible, so timing relative to Manufactor genuinely matters
  // for them specifically, unlike the predicate/phantom-token mods.
  function permutations(arr) {
    if (arr.length <= 1) return [arr.slice()];
    var result = [];
    arr.forEach(function(item, i) {
      var rest = arr.slice(0,i).concat(arr.slice(i+1));
      permutations(rest).forEach(function(p){ result.push([item].concat(p)); });
    });
    return result;
  }
  function applyPermutation(startBatch, orderedMods, tapped) {
    var b = startBatch.slice();
    orderedMods.forEach(function(mod) {
      var n = modOn[mod.id] || 0;
      if (n > 0 && b.some(function(t){ return t.type === mod.triggerTokenType; })) {
        for (var i = 0; i < n; i++) b.push(makeToken(mod.addsTokenType, tapped));
      }
    });
    return b;
  }
  function bestPermutation(startBatch, candidateMods, tapped) {
    if (candidateMods.length === 0) return startBatch;
    var best = startBatch;
    permutations(candidateMods).forEach(function(perm) {
      var result = applyPermutation(startBatch, perm, tapped);
      if (result.length > best.length) best = result;
    });
    return best;
  }

  var ifPresentMods = MODS.filter(function(m){
    return m.mechanic === 'addTokenIfPresent' && (modOn[m.id] || 0) > 0;
  });

  // Pre-Manufactor pass: only consider mods whose trigger is already in the batch
  var preCandiates = ifPresentMods.filter(function(mod) {
    return batch.some(function(t){ return t.type === mod.triggerTokenType; });
  });
  batch = bestPermutation(batch, preCandiates, tapped);
  var firedPreManufactor = preCandiates.map(function(m){ return m.id; });

  // Step 1: addToken — unconditional per-event adders (Peregrin, Tippy-Toe, etc)
  MODS.forEach(function(mod) {
    if (mod.mechanic === 'addToken') {
      var n = modOn[mod.id] || 0;
      for (var i = 0; i < n; i++) batch.push(makeToken(mod.addsTokenType, tapped));
    }
  });

  // Step 1c: replaceToken — e.g. Bilbo: for each Food in the batch, also add a Treasure.
  // Each copy of the mod adds one extra token per matching token in the batch.
  // Runs before Manufactor so the extras also get tripled.
  MODS.forEach(function(mod) {
    if (mod.mechanic === 'replaceToken') {
      var n = modOn[mod.id] || 0;
      if (n > 0) {
        var toAdd = [];
        batch.forEach(function(tok) {
          if (tok.type === mod.triggersOnType) {
            for (var i = 0; i < n; i++) toAdd.push(makeToken(mod.addsTokenType, tok.tapped));
          }
        });
        batch = batch.concat(toAdd);
      }
    }
  });

  // Flitwing "Optimize for Manufactor" position: convert here, immediately
  // before Manufactor, so Manufactor-immune types (Mutagen, Map, and any
  // creature-flagged phantom token) become Clue-eligible and get tripled too.
  // NOTE: this is no longer provably the global maximum on its own — it can
  // lose to the 'clues' position when a creature-predicate mod (Allenal,
  // Ojer Taq, Chatterfang) would have produced more value from an
  // untouched creature flag than Manufactor's triple does. That's exactly
  // why 'tokens' mode (below) compares both positions instead of assuming
  // this one always wins.
  if (flitwingMode === 'manufactor') {
    batch = batch.map(function(t){ return makeToken('clue', t.tapped); });
  }

  // Step 2: manufactor — apply N times in sequence (each pass triples Clue/Food/Treasure)
  MODS.forEach(function(mod) {
    if (mod.mechanic === 'manufactor') {
      var n = modOn[mod.id] || 0;
      for (var pass = 0; pass < n; pass++) {
        var ex = [];
        batch.forEach(function(tok) {
          if (tok.type==='clue'||tok.type==='food'||tok.type==='treasure') {
            ex.push(makeToken('clue',     tok.tapped));
            ex.push(makeToken('food',     tok.tapped));
            ex.push(makeToken('treasure', tok.tapped));
          } else { ex.push(tok); }
        });
        batch = ex;
      }
    }
  });

  // Post-Manufactor pass: mods that didn't fire pre-Manufactor, but whose
  // trigger now appears in the batch thanks to Manufactor's expansion
  var postCandidates = ifPresentMods.filter(function(mod) {
    return firedPreManufactor.indexOf(mod.id) === -1 &&
           batch.some(function(t){ return t.type === mod.triggerTokenType; });
  });
  batch = bestPermutation(batch, postCandidates, tapped);

  // ── Late-stage predicate search (Helm, Stridehangar, Allenal, Chatterfang,
  // Ojer Taq) ──────────────────────────────────────────────────────
  // None of these deal in Manufactor-eligible types (Clue/Food/Treasure), so
  // there's no benefit to running them earlier — they only ever gain value
  // from seeing a LARGER batch, so they run here, after Manufactor and after
  // Jolene/Xorn have had their say, when the batch is as big as it'll get pre-
  // doublers. They CAN enable each other (e.g. Chatterfang's Squirrel can
  // satisfy Allenal's creature-condition), so — same principle as above — we
  // try every firing order and keep whichever produces the most tokens.
  function applyLateStagePermutation(startBatch, orderedMods, tapped) {
    var b = startBatch.slice();
    orderedMods.forEach(function(mod) {
      var n = modOn[mod.id] || 0;
      if (n <= 0) return;
      if (mod.mechanic === 'predicateAdd') {
        if (b.some(function(t){ return t[mod.conditionPredicate]; })) {
          for (var i = 0; i < n; i++) b.push(makeToken(mod.addsTokenType, tapped));
        }
      } else if (mod.mechanic === 'wildcardReplace') {
        var toAdd = [];
        b.forEach(function(tok) {
          for (var i = 0; i < n; i++) toAdd.push(makeToken(mod.addsTokenType, tok.tapped));
        });
        b = b.concat(toAdd);
      } else if (mod.mechanic === 'predicateMultiply') {
        var factor = Math.pow(mod.multiplyBy || 1, n); // n copies stack multiplicatively, same as doublers
        var ex = [];
        b.forEach(function(tok) {
          if (tok[mod.conditionPredicate]) {
            for (var i = 0; i < factor; i++) ex.push(makeToken(tok.type, tok.tapped));
          } else {
            ex.push(tok);
          }
        });
        b = ex;
      }
    });
    return b;
  }
  function bestLateStagePermutation(startBatch, candidateMods, tapped) {
    if (candidateMods.length === 0) return startBatch;
    var best = startBatch;
    permutations(candidateMods).forEach(function(perm) {
      var result = applyLateStagePermutation(startBatch, perm, tapped);
      if (result.length > best.length) best = result;
    });
    return best;
  }
  var lateStageMods = MODS.filter(function(m){
    return (m.mechanic === 'predicateAdd' || m.mechanic === 'wildcardReplace' || m.mechanic === 'predicateMultiply')
      && (modOn[m.id] || 0) > 0;
  });
  batch = bestLateStagePermutation(batch, lateStageMods, tapped);

  // Step 3: double — every enabled doubler (any quantity) multiplies the batch by 2^n
  var mul = 1;
  MODS.forEach(function(mod) {
    if (mod.mechanic === 'double') {
      var n = modOn[mod.id] || 0;
      for (var i = 0; i < n; i++) mul *= 2;
    }
  });
  if (mul > 1) {
    var copies = [];
    for (var i2 = 1; i2 < mul; i2++)
      batch.forEach(function(tok){ copies.push(makeToken(tok.type, tok.tapped)); });
    batch = batch.concat(copies);
  }

  // Flitwing "Optimize for Clues": convert dead last, after everything else,
  // so the entire final (largest possible) batch becomes Clues.
  if (flitwingMode === 'clues') {
    batch = batch.map(function(t){ return makeToken('clue', t.tapped); });
  }

  // Step 4: vending — handled in doAction (triggered by sacrifice, not creation)

  return batch;
}

// Public entry point. 'off' | 'manufactor' | 'clues' delegate straight to a
// single deterministic position. 'tokens' computes BOTH candidate positions
// (feed Manufactor, vs. wait for the late-stage predicate mods) and returns
// whichever produces more total tokens — this is the true maximum, and isn't
// reducible to a single fixed position now that predicate mods exist.
function computeBatchForMode(tokens, flitwingMode) {
  flitwingMode = flitwingMode || 'off';
  if (flitwingMode !== 'tokens') {
    return computeBatchForPosition(tokens, flitwingMode);
  }
  var viaManufactor = computeBatchForPosition(tokens, 'manufactor');
  var viaClues      = computeBatchForPosition(tokens, 'clues');
  return viaManufactor.length >= viaClues.length ? viaManufactor : viaClues;
}

function applyBatchToState(batch) {
  batch.forEach(function(tok){
    if (tok.type !== 'generic' && state[tok.type]) {
      state[tok.type][tok.tapped?'ta':'u']++;
    }
  });
}

// Direct/synchronous creation with an explicit, already-known Flitwing mode.
// Used once we know what mode applies (Flitwing inactive, or locked).
function runCreate(tokens, flitwingMode) {
  var batch = computeBatchForMode(tokens, flitwingMode || 'off');
  applyBatchToState(batch);
}

// Tallies a batch into per-token-type counts, in TT's canonical order —
// used to build the Flitwing choice preview.
function tallyBatch(batch) {
  var counts = {};
  TT.forEach(function(t){ counts[t] = 0; });
  batch.forEach(function(tok){
    if (tok.type !== 'generic' && counts.hasOwnProperty(tok.type)) counts[tok.type]++;
  });
  return counts;
}

// Tallies EVERY token type in a batch, including untracked ones (phantom
// creature tokens like Squirrel/Frog/Soldier/Thopter, and plain 'generic').
// Used so the Flitwing preview's total actually adds up to something visible,
// instead of leaving untracked tokens as an unexplained gap between the
// shown chips and the total count.
function tallyBatchAll(batch) {
  var counts = {};
  batch.forEach(function(tok){
    counts[tok.type] = (counts[tok.type] || 0) + 1;
  });
  return counts;
}

// ── Flitwing dispatch: the entry point everything else should call ─────
// Decides whether Flitwing needs to ask the player (opens a popup) or can
// proceed immediately (Flitwing inactive, or a choice is locked), then calls
// onDone() once the batch has been applied to state. Multiple calls queue
// and resolve one at a time, so e.g. 2x Nuke-Cola (two separate creation
// events) doesn't try to show two popups at once.
var flitwingQueue = [];
var flitwingBusy = false;
var pendingFlitwingJob = null;

function getFlitwingMod() {
  return MODS.find ? MODS.find(function(m){ return m.mechanic === 'flitwing'; })
                    : MODS.filter(function(m){ return m.mechanic === 'flitwing'; })[0];
}

function createTokens(tokens, onDone) {
  flitwingQueue.push({ tokens: tokens, onDone: onDone || function(){} });
  processFlitwingQueue();
}

function processFlitwingQueue() {
  if (flitwingBusy || flitwingQueue.length === 0) return;
  var job = flitwingQueue.shift();
  var flitwingMod = getFlitwingMod();
  var active = flitwingMod && (modOn[flitwingMod.id] || 0) > 0;

  if (!active) {
    runCreate(job.tokens, 'off');
    job.onDone();
    processFlitwingQueue();
    return;
  }

  var lock = getFlitwingLock();
  if (lock !== 'ask') {
    runCreate(job.tokens, lock);
    job.onDone();
    processFlitwingQueue();
    return;
  }

  flitwingBusy = true;
  pendingFlitwingJob = job;
  openFlitwingChoicePopup(job.tokens);
}

function resolveFlitwingChoice(mode, lockIt) {
  var job = pendingFlitwingJob;
  if (!job) return;
  pendingFlitwingJob = null;
  if (lockIt) setFlitwingLock(mode);
  runCreate(job.tokens, mode);
  closeModal('flitwingChoiceBackdrop');
  flitwingBusy = false;
  job.onDone();
  processFlitwingQueue();
}

// Renders the per-event choice popup: for each of the 4 modes, shows the
// total token count and a full per-token-type breakdown of what that choice
// would actually create.
var FLITWING_MODE_LABELS = {
  off:        "Don't Apply",
  manufactor: 'Optimize for Manufactor',
  tokens:     'Optimize for Tokens',
  clues:      'Optimize for Clues'
};
function openFlitwingChoicePopup(tokens) {
  var box = document.getElementById('flitwingOptions');
  box.innerHTML = '';
  ['off','manufactor','tokens','clues'].forEach(function(mode){
    var batch = computeBatchForMode(tokens, mode);
    var allCounts = tallyBatchAll(batch);
    var row = document.createElement('div');
    row.className = 'flitwing-option';
    var breakdownHtml = '';
    // Tracked types first, in canonical order
    TT.forEach(function(t){
      if (allCounts[t] > 0) {
        breakdownHtml += '<span class="flitwing-chip">' + TOKEN_LIBRARY[t].label + ' +' + allCounts[t] + '</span>';
      }
    });
    // Then anything untracked (phantom creature tokens, plain generic) —
    // dimmed/muted styling to signal these won't show up as a board counter,
    // so the total on the label always fully accounts for itself.
    Object.keys(allCounts).forEach(function(type){
      if (TT.indexOf(type) !== -1 || allCounts[type] <= 0) return; // already shown above
      var label = type === 'generic' ? 'Untracked' : getTokenDisplayLabel(type);
      breakdownHtml += '<span class="flitwing-chip untracked">' + label + ' +' + allCounts[type] + '</span>';
    });
    row.innerHTML =
      '<div class="flitwing-option-label">' + FLITWING_MODE_LABELS[mode] + ': ' + batch.length + '</div>' +
      '<div class="flitwing-option-breakdown">' + breakdownHtml + '</div>';
    row.onclick = function() {
      var lockIt = document.getElementById('flitwingLockCheckbox').checked;
      resolveFlitwingChoice(mode, lockIt);
    };
    box.appendChild(row);
  });
  document.getElementById('flitwingLockCheckbox').checked = false;
  openModal('flitwingChoiceBackdrop');
}

// Renders the lock-configuration popup (opened by holding the Flitwing tile
// in the in-game MODS drawer). Lets the player permanently pin a choice for
// this deck, or set it back to "ask every time".
var FLITWING_LOCK_LABELS = {
  ask:        'Ask every time',
  off:        "Always: Don't Apply",
  manufactor: 'Always: Optimize Manufactor',
  tokens:     'Always: Optimize Tokens',
  clues:      'Always: Optimize Clues'
};
function openFlitwingLockPopup() {
  var box = document.getElementById('flitwingLockOptions');
  box.innerHTML = '';
  var current = getFlitwingLock();
  ['ask','off','manufactor','tokens','clues'].forEach(function(mode){
    var btn = document.createElement('div');
    btn.className = 'flitwing-lock-option' + (mode === current ? ' active' : '');
    btn.textContent = FLITWING_LOCK_LABELS[mode];
    btn.onclick = function() {
      setFlitwingLock(mode);
      openFlitwingLockPopup(); // re-render to show the new active state
    };
    box.appendChild(btn);
  });
  openModal('flitwingLockBackdrop');
}

function snapshot() { return TT.map(function(t){ return state[t].u+state[t].ta; }); }

// ── Action history (for the +X badges and Undo button) ──────────────
// Every user-facing action wraps itself with beginAction()/endAction(),
// which diffs `state` before vs after and pushes one history entry
// capturing the full per-type {u,ta} deltas. The +X badge reads the
// most recent entry's deltas; Undo pops it and reverses them exactly.
var actionHistory = [];
var MAX_HISTORY = 20; // how many undo steps to keep
function cloneState() {
  var c = {};
  TT.forEach(function(t){ c[t] = { u: state[t].u, ta: state[t].ta }; });
  return c;
}
function beginAction() { return cloneState(); }
function endAction(before) {
  var after = cloneState();
  var deltas = {};
  var changed = false;
  TT.forEach(function(t){
    var du = after[t].u  - before[t].u;
    var dta = after[t].ta - before[t].ta;
    if (du !== 0 || dta !== 0) { deltas[t] = { u: du, ta: dta }; changed = true; }
  });
  if (changed) {
    actionHistory.push(deltas);
    if (actionHistory.length > MAX_HISTORY) actionHistory.shift();
    showDeltaBadges(deltas);
  }
}
function undo() {
  var deltas = actionHistory.pop();
  if (!deltas) return;
  Object.keys(deltas).forEach(function(t){
    if (!state[t]) return; // token type no longer active, nothing to reverse visually
    state[t].u  -= deltas[t].u;
    state[t].ta -= deltas[t].ta;
    // clamp defensively so a partial/edge-case undo never goes negative
    if (state[t].u  < 0) state[t].u  = 0;
    if (state[t].ta < 0) state[t].ta = 0;
  });
  render();
}

var deltaStackCount = {}; // type -> how many popups currently stacked, so new ones spawn above
function showDeltaBadges(deltas) {
  Object.keys(deltas).forEach(function(t){
    var net = deltas[t].u + deltas[t].ta;
    if (net === 0) return;
    var container = document.getElementById('delta-'+t);
    if (!container) return; // token type not currently on the grid

    var stackIndex = deltaStackCount[t] || 0;
    deltaStackCount[t] = stackIndex + 1;

    var sign = net > 0 ? '+' : '−';
    var popup = document.createElement('div');
    popup.className = 'tok-delta-popup' + (net > 0 ? ' positive' : ' negative');
    popup.textContent = sign + Math.abs(net);
    // each new popup starts a bit further down than the last still-visible
    // one, so rapid taps cascade upward past each other instead of overlapping
    popup.style.top = (stackIndex * 26) + 'px';
    container.appendChild(popup);

    // trigger the rise+fade animation on the next frame (so the initial
    // state actually paints before the transition starts)
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        popup.classList.add('rise');
      });
    });

    setTimeout(function(){
      if (popup.parentNode) popup.parentNode.removeChild(popup);
      deltaStackCount[t] = Math.max(0, (deltaStackCount[t]||1) - 1);
    }, 1100);
  });
}

// ── Core action ───────────────────────────────────────────────────
function doAction(type, sk, delta, doFlash) {
  var before = beginAction();
  if (delta > 0) {
    createTokens([{ type:type, tapped:(sk==='ta') }], function(){
      endAction(before);
      render();
    });
  } else {
    if (state[type][sk] > 0) {
      state[type][sk]--;
      if (type === 'food') {
        var totalVending = 0;
        MODS.forEach(function(mod) {
          if (mod.mechanic === 'vending') totalVending += (modOn[mod.id] || 0);
        });
        if (totalVending === 0) {
          endAction(before);
          render();
        } else {
          var completed = 0;
          for (var v = 0; v < totalVending; v++) {
            createTokens([{ type:'treasure', tapped:true }], function(){
              completed++;
              if (completed === totalVending) { endAction(before); render(); }
            });
          }
        }
      } else {
        endAction(before);
        render();
      }
    } else {
      endAction(before);
      render();
    }
  }
}

function tapTokens(type) {
  // move one untapped → tapped
  if (state[type].u > 0) { state[type].u--; state[type].ta++; render(); }
}
function untapTokens(type) {
  if (state[type].ta > 0) { state[type].ta--; state[type].u++; render(); }
}
function untapAll() {
  TT.forEach(function(t){ state[t].u += state[t].ta; state[t].ta = 0; });
  render();
}
function openConfirm()  { openModal('confirmBackdrop'); }
function closeConfirm() { closeModal('confirmBackdrop'); }
function confirmReset() { closeConfirm(); closeDrawer(); resetAll(); }

function rebuildCreateDropdown() {
  var sel = document.getElementById('createType');
  var prevVal = sel.value;
  sel.innerHTML = '<option value="generic">Generic</option>';
  TT.forEach(function(t){
    var opt = document.createElement('option');
    opt.value = t;
    opt.textContent = META[t].label;
    sel.appendChild(opt);
  });
  // restore selection if still valid, else default to generic
  var stillValid = Array.prototype.some.call(sel.options, function(o){ return o.value === prevVal; });
  sel.value = stillValid ? prevVal : 'generic';
}

// ── Generic token Artifact/Creature flags ───────────────────────────
var genericFlags = { artifact:false, creature:false };
function toggleGenericFlag(kind) {
  genericFlags[kind] = !genericFlags[kind];
  document.getElementById('genericArtifactChip').classList.toggle('on', genericFlags.artifact);
  document.getElementById('genericCreatureChip').classList.toggle('on', genericFlags.creature);
}
// Only show the toggle row when Generic is selected AND this deck actually
// has a predicate-based mod enabled (Helm/Stridehangar/Allenal/Chatterfang/
// Ojer Taq) — otherwise the flags would have nothing to matter to, so keep
// the UI clean and hide them.
function updateGenericFlagsVisibility() {
  var type = document.getElementById('createType').value;
  var hasPredicateMod = MODS.some(function(m){
    return m.mechanic === 'predicateAdd' || m.mechanic === 'wildcardReplace' || m.mechanic === 'predicateMultiply';
  });
  var row = document.getElementById('genericFlagsRow');
  row.classList.toggle('show', type === 'generic' && hasPredicateMod);
}

function bulkCreate() {
  var type = document.getElementById('createType').value;
  var amt  = Math.max(1, parseInt(document.getElementById('createAmt').value) || 1);
  var tokens = [];
  for (var i = 0; i < amt; i++) {
    var tok = { type:type, tapped:false };
    if (type === 'generic') {
      tok.isArtifact = genericFlags.artifact;
      tok.isCreature = genericFlags.creature;
    }
    tokens.push(tok);
  }
  var before = beginAction();
  createTokens(tokens, function(){
    endAction(before);
    render();
  });
}

function resetAll() {
  TT.forEach(function(t){ state[t].u = 0; state[t].ta = 0; });
  MODS.forEach(function(m){ modOn[m.id] = 0; });
  actionHistory = []; // undo shouldn't reach back past a full reset
  renderMods(); render();
}

// ── Render ────────────────────────────────────────────────────────
var BOARD_STORAGE_PREFIX = 'manufactor_board_';

function persistBoardState() {
  if (!activeProfileId) return;
  try {
    localStorage.setItem(BOARD_STORAGE_PREFIX + activeProfileId, JSON.stringify({ state: state, modOn: modOn }));
  } catch(e) { /* localStorage unavailable or full, ignore */ }
}
function loadBoardState(profileId) {
  try {
    var raw = localStorage.getItem(BOARD_STORAGE_PREFIX + profileId);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) { return null; }
}
function clearBoardState(profileId) {
  try { localStorage.removeItem(BOARD_STORAGE_PREFIX + profileId); } catch(e) {}
}

function render() {
  TT.forEach(function(type) {
    var s = state[type];
    var total = s.u + s.ta;
    var card = document.getElementById('tc-'+type);
    if (!card) return;
    card.className = 'tok-card' + (total > 0 ? ' lit' : '');
    card.querySelector('.num-u').textContent  = s.u;
    card.querySelector('.num-ta').textContent = s.ta;
  });
  var pips = document.getElementById('modPips'); pips.innerHTML = '';
  var MAX_PIPS = 5;
  var activeMods = MODS.filter(function(m){ return modOn[m.id] > 0; });
  var shown = MODS.slice(0, MAX_PIPS);
  shown.forEach(function(m){
    var d = document.createElement('div');
    d.className = 'mod-pip' + (modOn[m.id] > 0 ? ' on' : '');
    pips.appendChild(d);
  });
  if (MODS.length > MAX_PIPS) {
    var overflow = document.createElement('div');
    overflow.className = 'mod-pip-overflow';
    var extraOn = activeMods.length - shown.filter(function(m){ return modOn[m.id] > 0; }).length;
    overflow.textContent = '+' + (MODS.length - MAX_PIPS);
    pips.appendChild(overflow);
  }
  var undoBtn = document.getElementById('undoBtn');
  if (undoBtn) undoBtn.disabled = actionHistory.length === 0;
  persistBoardState();
}

// ── Build DOM ─────────────────────────────────────────────────────
function makeHalf(type, sk) {
  // sk = 'u' or 'ta'
  var isUntapped = (sk === 'u');
  var half = document.createElement('div');
  half.className = 'tok-half ' + (isUntapped ? 'untapped' : 'tapped');

  // Left zone (sacrifice / decrement)
  var zoneL = document.createElement('div');
  zoneL.className = 'tap-zone left';
  (function(t,s){
    zoneL.addEventListener('pointerdown', function(e){
      e.preventDefault(); e.stopPropagation();
      zoneL.classList.add('active');
      startRepeat(t, s, -1);
    });
    var stop = function(){ zoneL.classList.remove('active'); stopRepeat(t,s); };
    zoneL.addEventListener('pointerup',     stop);
    zoneL.addEventListener('pointerleave',  stop);
    zoneL.addEventListener('pointercancel', stop);
  })(type, sk);
  half.appendChild(zoneL);

  // Right zone (create / increment)
  var zoneR = document.createElement('div');
  zoneR.className = 'tap-zone right';
  (function(t,s){
    zoneR.addEventListener('pointerdown', function(e){
      e.preventDefault(); e.stopPropagation();
      zoneR.classList.add('active');
      startRepeat(t, s, +1);
    });
    var stop = function(){ zoneR.classList.remove('active'); stopRepeat(t,s); };
    zoneR.addEventListener('pointerup',     stop);
    zoneR.addEventListener('pointerleave',  stop);
    zoneR.addEventListener('pointercancel', stop);
  })(type, sk);
  half.appendChild(zoneR);

  // Big number
  var num = document.createElement('div');
  num.className = 'tok-num num-' + sk;
  num.textContent = '0';
  half.appendChild(num);

  // Edge hints
  var hints = document.createElement('div');
  hints.className = 'tok-hints';
  hints.innerHTML = '<span class="tok-hint">−</span><span class="tok-hint">+</span>';
  half.appendChild(hints);

  // State label
  var lbl = document.createElement('div');
  lbl.className = 'tok-state-lbl';
  lbl.textContent = isUntapped ? 'UNTAPPED' : 'TAPPED';
  half.appendChild(lbl);

  return half;
}

function buildGrid() {
  var grid = document.getElementById('tokenGrid'); grid.innerHTML = '';
  TT.forEach(function(type) {
    var m = META[type];
    var card = document.createElement('div');
    card.className = 'tok-card'; card.id = 'tc-'+type;
    card.style.setProperty('--c', m.c);

    // Art background
    var art = document.createElement('img');
    art.className = 'tok-art';
    art.src = resolveArtPath(m.img, type);
    art.alt = '';
    card.appendChild(art);

    // Scrim
    var scrim = document.createElement('div');
    scrim.className = 'tok-scrim';
    card.appendChild(scrim);

    // Delta popup container ("+3" etc spawn inside here, transiently)
    var deltaContainer = document.createElement('div');
    deltaContainer.className = 'tok-delta-container';
    deltaContainer.id = 'delta-'+type;
    card.appendChild(deltaContainer);

    // Name
    var name = document.createElement('div');
    name.className = 'tok-name';
    name.textContent = m.label.toUpperCase();
    card.appendChild(name);

    // Untapped half
    card.appendChild(makeHalf(type, 'u'));

    // Middle: TAP / UNTAP
    var mid = document.createElement('div');
    mid.className = 'tok-mid';
    var tapBtn = document.createElement('button');
    tapBtn.className = 'mid-btn';
    tapBtn.innerHTML = '<svg class="mtg-sym" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg"><path d="m512 353.5-216 0 79.1-56.3c-29.4-23.3-63.4-35-101.9-35-19.3 0-32.5 3.7-39.5 11-7.1 7.4-10.7 20.7-10.7 39.9 0 53.2 27.4 110 82.2 170.4l-62.3 63.1c-72.5-88.2-108.8-167.1-108.8-236.5 0-41.6 12.5-74.7 37.6-99.3 25.1-24.6 58.5-36.9 100-36.9 50.7 0 106 19.3 165.9 57.8l46.4-79.1 28.2 200.8" fill="currentColor"/></svg>';
    (function(t){ tapBtn.onclick = function(e){ e.stopPropagation(); tapTokens(t); }; })(type);
    var untapBtn = document.createElement('button');
    untapBtn.className = 'mid-btn';
    untapBtn.innerHTML = '<svg class="mtg-sym" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" style="transform:rotate(180deg)"><path d="m512 353.5-216 0 79.1-56.3c-29.4-23.3-63.4-35-101.9-35-19.3 0-32.5 3.7-39.5 11-7.1 7.4-10.7 20.7-10.7 39.9 0 53.2 27.4 110 82.2 170.4l-62.3 63.1c-72.5-88.2-108.8-167.1-108.8-236.5 0-41.6 12.5-74.7 37.6-99.3 25.1-24.6 58.5-36.9 100-36.9 50.7 0 106 19.3 165.9 57.8l46.4-79.1 28.2 200.8" fill="currentColor"/></svg>';;
    (function(t){ untapBtn.onclick = function(e){ e.stopPropagation(); untapTokens(t); }; })(type);
    mid.appendChild(untapBtn);
    mid.appendChild(tapBtn);
    card.appendChild(mid);

    // Tapped half
    card.appendChild(makeHalf(type, 'ta'));

    grid.appendChild(card);
  });
}

var qtyCurrentId = null;
function openQty(mod) {
  qtyCurrentId = mod.id;
  document.getElementById('qtyName').textContent = mod.name;
  document.getElementById('qtyName').style.color = mod.mc;
  document.getElementById('qtyVal').textContent = modOn[mod.id] || 1;
  openModal('qtyBackdrop');
}
function closeQty() {
  if (qtyCurrentId) {
    modOn[qtyCurrentId] = parseInt(document.getElementById('qtyVal').textContent);
  }
  closeModal('qtyBackdrop');
  qtyCurrentId = null;
  renderMods(); render();
}
function adjustQty(d) {
  var cur = parseInt(document.getElementById('qtyVal').textContent);
  document.getElementById('qtyVal').textContent = Math.max(1, cur + d);
}

function renderMods() {
  var grid = document.getElementById('modsGrid'); grid.innerHTML = '';
  MODS.forEach(function(mod) {
    var qty = modOn[mod.id];
    var on = qty > 0;
    var tile = document.createElement('div');
    tile.className = 'mod-tile' + (on ? ' on' : '');
    tile.style.setProperty('--mc', mod.mc);
    var badgeHtml = '';
    if (mod.mechanic === 'flitwing') {
      var lock = getFlitwingLock();
      if (lock !== 'ask') {
        badgeHtml = '<div class="mod-qty-badge">🔒</div>';
      }
    } else if (qty > 1) {
      badgeHtml = '<div class="mod-qty-badge">×' + qty + '</div>';
    }
    tile.innerHTML =
      '<div class="mod-art-wrap">' +
        '<img class="mod-art" src="' + resolveArtPath(mod.img, mod.id) + '" alt="' + mod.name + '" onerror="this.style.background=\'#1e2330\'">' +
        '<div class="mod-art-label">' + mod.name + '</div>' +
      '</div>' +
      badgeHtml;

    // tap = toggle on/off, hold = open qty picker
    var holdTimer = null;
    var holdFired = false;
    (function(m) {
      tile.addEventListener('contextmenu', function(e){ e.preventDefault(); });
      var startX, startY;
      tile.addEventListener('pointerdown', function(e) {
        holdFired = false;
        startX = e.clientX; startY = e.clientY;
        holdTimer = setTimeout(function() {
          holdFired = true;
          if (modOn[m.id] === 0) modOn[m.id] = 1;
          if (m.mechanic === 'flitwing') {
            openFlitwingLockPopup();
          } else {
            openQty(m);
          }
          renderMods(); render();
        }, 500);
      });
      tile.addEventListener('pointermove', function(e) {
        if (holdTimer && (Math.abs(e.clientX - startX) > 8 || Math.abs(e.clientY - startY) > 8)) {
          clearTimeout(holdTimer);
          holdTimer = null;
          holdFired = true; // treat as scroll, not a tap
        }
      });
      tile.addEventListener('pointerup', function() {
        clearTimeout(holdTimer);
        if (!holdFired) {
          modOn[m.id] = modOn[m.id] > 0 ? 0 : 1;
          renderMods(); render();
        }
      });
      tile.addEventListener('pointerleave',  function() { clearTimeout(holdTimer); });
      tile.addEventListener('pointercancel', function() { clearTimeout(holdTimer); });
    })(mod);

    grid.appendChild(tile);
  });

  var actionsDiv = document.createElement('div');
  actionsDiv.style.cssText = 'display:flex;flex-direction:column;gap:5px;aspect-ratio:3/4;';
  var reset = document.createElement('button');
  reset.className = 'mod-action-tile';
  reset.style.cssText = 'aspect-ratio:unset;flex:1;background:rgba(232,200,75,0.15);border-color:rgba(232,200,75,0.5);color:rgba(232,200,75,0.9);';
  reset.innerHTML = 'RESET<br>ALL';
  reset.onclick = function(){ openConfirm(); };
  var closeBtn = document.createElement('button');
  closeBtn.className = 'mod-action-tile';
  closeBtn.style.cssText = 'aspect-ratio:unset;flex:1;background:rgba(220,70,60,0.15);border-color:rgba(220,70,60,0.5);color:rgba(255,100,90,0.9);';
  closeBtn.innerHTML = 'CLOSE';
  closeBtn.onclick = function(){ closeDrawer(); };
  actionsDiv.appendChild(reset);
  actionsDiv.appendChild(closeBtn);
  grid.appendChild(actionsDiv);
}

function openDrawer()  { openModal('backdrop');  openModal('drawer'); }
function closeDrawer() { closeModal('backdrop'); closeModal('drawer'); }

// ── Settings screen ───────────────────────────────────────────────
var pendingTokens = [];   // working copy while settings is open
var pendingMods = [];

function forceRefresh() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    // Tell the SW to check for an update, then reload once it activates
    navigator.serviceWorker.getRegistration().then(function(reg) {
      if (reg) {
        reg.update().then(function() {
          // If a new SW is waiting, skip waiting and reload
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          window.location.reload(true);
        });
      } else {
        window.location.reload(true);
      }
    });
  } else {
    window.location.reload(true);
  }
}

function openSettings() {
  pendingTokens = TT.slice();
  pendingMods = MODS.map(function(m){ return m.id; });
  renderProfileSelect();
  renderSettingsTokens();
  renderSettingsMods();
  openModal('settingsBackdrop');
}
function closeSettings() {
  closeModal('settingsBackdrop');
}

function renderProfileSelect() {
  var sel = document.getElementById('profileSelect');
  sel.innerHTML = '';
  profiles.forEach(function(p) {
    var opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
  sel.value = activeProfileId;
  sel.onchange = function() {
    if (sel.value === activeProfileId) return;
    pendingSwitchProfileId = sel.value;
    openSwitchProfileConfirm();
  };
}

// ── Alt art support ──────────────────────────────────────────────
// For any token/mod image "name.jpg", if "name-alt.jpg" also exists in the
// img/ folder, a star button appears letting the user switch to it.
// Choice is stored per-profile under profile.artVariants = { tokenId/modId: 'default'|'alt' }
function altPathFor(basePath) {
  return basePath.replace(/\.jpg$/i, '-alt.jpg');
}

var altArtAvailable = {}; // cache of probed results: { basePath: true|false }
function probeAltArt(basePath, callback) {
  if (altArtAvailable.hasOwnProperty(basePath)) {
    callback(altArtAvailable[basePath]);
    return;
  }
  var img = new Image();
  var altPath = altPathFor(basePath);
  img.onload = function() { altArtAvailable[basePath] = true;  callback(true); };
  img.onerror = function() { altArtAvailable[basePath] = false; callback(false); };
  img.src = altPath;
}

function getArtVariant(key) {
  var p = getActiveProfile();
  if (!p || !p.artVariants) return 'default';
  return p.artVariants[key] || 'default';
}
function setArtVariant(key, variant) {
  var p = getActiveProfile();
  if (!p) return;
  if (!p.artVariants) p.artVariants = {};
  p.artVariants[key] = variant;
  persistProfileData();
}
function resolveArtPath(basePath, key) {
  return getArtVariant(key) === 'alt' ? altPathFor(basePath) : basePath;
}

function renderSettingsTokens() {
  var grid = document.getElementById('settingsTokenGrid');
  grid.innerHTML = '';
  Object.keys(TOKEN_LIBRARY).forEach(function(tokenId) {
    var t = TOKEN_LIBRARY[tokenId];
    var isOn = pendingTokens.indexOf(tokenId) !== -1;
    var atCap = pendingTokens.length >= 4 && !isOn;
    var tile = document.createElement('div');
    tile.className = 'settings-token-tile' + (isOn ? ' on' : '') + (atCap ? ' disabled' : '');
    tile.style.setProperty('--tc', t.c);
    var artImg = document.createElement('img');
    artImg.className = 'settings-token-art';
    artImg.alt = '';
    artImg.src = resolveArtPath(t.img, tokenId);
    var checkDiv = document.createElement('div');
    checkDiv.className = 'settings-token-check';
    checkDiv.textContent = '✓';
    var labelDiv = document.createElement('div');
    labelDiv.className = 'settings-token-label';
    labelDiv.textContent = t.label;
    tile.appendChild(artImg);
    tile.appendChild(checkDiv);
    tile.appendChild(labelDiv);
    tile.onclick = function() {
      var idx = pendingTokens.indexOf(tokenId);
      if (idx !== -1) {
        pendingTokens.splice(idx, 1);
      } else if (pendingTokens.length < 4) {
        pendingTokens.push(tokenId);
      }
      renderSettingsTokens();
      updateTokenPickCount();
    };
    grid.appendChild(tile);

    // Probe for alt art; if found, add the star button
    probeAltArt(t.img, function(tokenIdClosure, tileClosure, artImgClosure, exists) {
      if (!exists) return;
      var starBtn = document.createElement('div');
      starBtn.className = 'settings-token-altbtn' + (getArtVariant(tokenIdClosure) === 'alt' ? ' active' : '');
      starBtn.textContent = '★';
      starBtn.onclick = function(e) {
        e.stopPropagation();
        var current = getArtVariant(tokenIdClosure);
        var next = current === 'alt' ? 'default' : 'alt';
        setArtVariant(tokenIdClosure, next);
        artImgClosure.src = resolveArtPath(t.img, tokenIdClosure);
        starBtn.className = 'settings-token-altbtn' + (next === 'alt' ? ' active' : '');
        // also refresh the main grid art if this token is active
        if (TT.indexOf(tokenIdClosure) !== -1) buildGrid();
      };
      tileClosure.appendChild(starBtn);
    }.bind(null, tokenId, tile, artImg));
  });
  updateTokenPickCount();
}
function updateTokenPickCount() {
  document.getElementById('tokenPickCount').textContent = '(' + pendingTokens.length + '/4)';
}

function renderSettingsMods() {
  var list = document.getElementById('settingsModList');
  list.innerHTML = '';
  MOD_LIBRARY.forEach(function(mod) {
    var isOn = pendingMods.indexOf(mod.id) !== -1;
    var row = document.createElement('div');
    row.className = 'settings-mod-row' + (isOn ? ' on' : '');
    row.style.setProperty('--mc', mod.mc);
    var tl = TOKEN_LIBRARY;
    var tagText = 'tokens → 2× tokens';
    if (mod.mechanic === 'manufactor') tagText = 'clue, food, & treasure → clue, food, & treasure × 3';
    if (mod.mechanic === 'addToken')          tagText = 'tokens → tokens + ' + getTokenDisplayLabel(mod.addsTokenType).toLowerCase();
    if (mod.mechanic === 'addTokenIfPresent')  tagText = tl[mod.triggerTokenType].label.toLowerCase() + 's → ' + tl[mod.triggerTokenType].label.toLowerCase() + 's + 1';
    if (mod.mechanic === 'replaceToken')      tagText = tl[mod.triggersOnType].label.toLowerCase() + ' → ' + tl[mod.triggersOnType].label.toLowerCase() + ' + ' + getTokenDisplayLabel(mod.addsTokenType).toLowerCase();
    if (mod.mechanic === 'vending')           tagText = 'sac a food: tapped treasure';
    if (mod.mechanic === 'flitwing')          tagText = 'tokens → may become all clues';
    if (mod.mechanic === 'predicateAdd')      tagText = (mod.conditionPredicate === 'isArtifact' ? 'artifact' : 'creature') + ' tokens → also + ' + getTokenDisplayLabel(mod.addsTokenType).toLowerCase();
    if (mod.mechanic === 'wildcardReplace')   tagText = 'X tokens → X tokens + X ' + getTokenDisplayLabel(mod.addsTokenType).toLowerCase() + 's';
    if (mod.mechanic === 'predicateMultiply') tagText = 'creature tokens → creature tokens × ' + mod.multiplyBy;

    var thumbImg = document.createElement('img');
    thumbImg.className = 'settings-mod-thumb';
    thumbImg.alt = '';
    thumbImg.onerror = function(){ thumbImg.style.background = '#1e2330'; };
    thumbImg.src = resolveArtPath(mod.img, mod.id);

    var infoDiv = document.createElement('div');
    infoDiv.className = 'settings-mod-info';
    infoDiv.innerHTML =
      '<div class="settings-mod-name">' + mod.name + '</div>' +
      '<div class="settings-mod-tag">' + tagText + '</div>';

    var toggleDiv = document.createElement('div');
    toggleDiv.className = 'settings-mod-toggle';

    row.appendChild(thumbImg);
    row.appendChild(infoDiv);
    row.appendChild(toggleDiv);

    row.onclick = function() {
      var idx = pendingMods.indexOf(mod.id);
      if (idx !== -1) pendingMods.splice(idx, 1);
      else pendingMods.push(mod.id);
      renderSettingsMods();
    };
    list.appendChild(row);

    // Probe for alt art; if found, insert the star button before the toggle
    probeAltArt(mod.img, function(modClosure, thumbImgClosure, toggleDivClosure, rowClosure, exists) {
      if (!exists) return;
      var starBtn = document.createElement('div');
      starBtn.className = 'alt-art-btn' + (getArtVariant(modClosure.id) === 'alt' ? ' active' : '');
      starBtn.textContent = '★';
      starBtn.onclick = function(e) {
        e.stopPropagation();
        var current = getArtVariant(modClosure.id);
        var next = current === 'alt' ? 'default' : 'alt';
        setArtVariant(modClosure.id, next);
        thumbImgClosure.src = resolveArtPath(modClosure.img, modClosure.id);
        starBtn.className = 'alt-art-btn' + (next === 'alt' ? ' active' : '');
        // refresh the in-game mods drawer if this mod is currently enabled
        if (MODS.some(function(m){ return m.id === modClosure.id; })) renderMods();
      };
      rowClosure.insertBefore(starBtn, toggleDivClosure);
    }.bind(null, mod, thumbImg, toggleDiv, row));
  });
}

function saveSettings() {
  if (pendingTokens.length === 0) {
    alert('Select at least 1 token type.');
    return;
  }
  TT = canonicalTokenOrder(pendingTokens);
  MODS = MOD_LIBRARY.filter(function(m){ return pendingMods.indexOf(m.id) !== -1; });

  // Rebuild state for new token set, preserving counts for tokens that survived
  var newState = {};
  TT.forEach(function(t){ newState[t] = state[t] || { u:0, ta:0 }; });
  state = newState;

  // Rebuild modOn for new mod set, preserving quantities for mods that survived
  var newModOn = {};
  MODS.forEach(function(m){ newModOn[m.id] = modOn[m.id] || 0; });
  modOn = newModOn;

  persistCurrentBoardToProfile();
  rebuildCreateDropdown();
  updateGenericFlagsVisibility();
  buildGrid();
  renderMods();
  render();
  closeSettings();
}

// ── Profile management ───────────────────────────────────────────
function openNewProfilePrompt() {
  document.getElementById('profileNamePromptTitle').textContent = 'New Profile';
  document.getElementById('profileNameInput').value = '';
  document.getElementById('profileNameConfirmBtn').textContent = 'CREATE';
  profileNamePromptMode = 'create';
  openModal('profileNameBackdrop');
}
function openRenamePrompt() {
  var p = getActiveProfile();
  if (!p) return;
  document.getElementById('profileNamePromptTitle').textContent = 'Rename Profile';
  document.getElementById('profileNameInput').value = p.name;
  document.getElementById('profileNameConfirmBtn').textContent = 'SAVE';
  profileNamePromptMode = 'rename';
  openModal('profileNameBackdrop');
}
function closeProfileNamePrompt() {
  closeModal('profileNameBackdrop');
}
var profileNamePromptMode = 'create';
function confirmProfileName() {
  var name = document.getElementById('profileNameInput').value.trim();
  if (!name) { alert('Please enter a name.'); return; }

  if (profileNamePromptMode === 'rename') {
    var p = getActiveProfile();
    if (p) { p.name = name; persistProfileData(); renderProfileSelect(); }
  } else {
    var newProfile = {
      id: makeProfileId(),
      name: name,
      activeTokens: pendingTokens.length ? pendingTokens.slice() : Object.keys(TOKEN_LIBRARY).slice(0,4),
      enabledMods: [],
      flitwingLock: 'ask',
      artVariants: {}
    };
    profiles.push(newProfile);
    activeProfileId = newProfile.id;
    persistProfileData();
    loadActiveProfileIntoApp();
    renderProfileSelect();
    pendingTokens = TT.slice();
    pendingMods = MODS.map(function(m){ return m.id; });
    renderSettingsTokens();
    renderSettingsMods();
  }
  closeProfileNamePrompt();
}

function openDeleteProfileConfirm() {
  var p = getActiveProfile();
  if (!p) return;
  document.getElementById('deleteProfileSub').textContent = 'Delete "' + p.name + '"? This cannot be undone.';
  openModal('deleteProfileBackdrop');
}
function closeDeleteProfileConfirm() {
  closeModal('deleteProfileBackdrop');
}
function confirmDeleteProfile() {
  var idx = profiles.findIndex(function(p){ return p.id === activeProfileId; });
  var deletedId = activeProfileId;
  if (idx !== -1) profiles.splice(idx, 1);
  if (deletedId) clearBoardState(deletedId); // don't leave an orphaned board save behind

  if (profiles.length === 0) {
    // No profiles left — drop back to first-launch gate
    activeProfileId = null;
    persistProfileData();
    closeDeleteProfileConfirm();
    closeSettings();
    showFirstLaunch();
    return;
  }

  activeProfileId = profiles[0].id;
  persistProfileData();
  loadActiveProfileIntoApp();
  renderProfileSelect();
  pendingTokens = TT.slice();
  pendingMods = MODS.map(function(m){ return m.id; });
  renderSettingsTokens();
  renderSettingsMods();
  closeDeleteProfileConfirm();
}

var pendingSwitchProfileId = null;
function openSwitchProfileConfirm() { openModal('switchProfileBackdrop'); }
function closeSwitchProfileConfirm() {
  closeModal('switchProfileBackdrop');
  renderProfileSelect(); // revert dropdown to actual active profile if cancelled
}
function confirmSwitchProfile() {
  activeProfileId = pendingSwitchProfileId;
  pendingSwitchProfileId = null;
  persistProfileData();
  loadActiveProfileIntoApp();
  renderProfileSelect();
  pendingTokens = TT.slice();
  pendingMods = MODS.map(function(m){ return m.id; });
  renderSettingsTokens();
  renderSettingsMods();
  closeModal('switchProfileBackdrop');
}

function loadActiveProfileIntoApp() {
  var p = getActiveProfile();
  if (!p) return;
  TT = canonicalTokenOrder(p.activeTokens);
  MODS = MOD_LIBRARY.filter(function(m){ return p.enabledMods.indexOf(m.id) !== -1; });
  state = {}; TT.forEach(function(t){ state[t] = { u:0, ta:0 }; });
  modOn = {}; MODS.forEach(function(m){ modOn[m.id] = 0; });
  actionHistory = []; // a different deck's history shouldn't carry over

  // Restore this profile's saved in-progress board, if it has one
  var savedBoard = loadBoardState(p.id);
  if (savedBoard) {
    TT.forEach(function(t){ if (savedBoard.state && savedBoard.state[t]) state[t] = savedBoard.state[t]; });
    MODS.forEach(function(m){ if (savedBoard.modOn && typeof savedBoard.modOn[m.id] === 'number') modOn[m.id] = savedBoard.modOn[m.id]; });
  }

  rebuildCreateDropdown();
  updateGenericFlagsVisibility();
  buildGrid();
  renderMods();
  render();
}

// ── First launch gate ────────────────────────────────────────────
function showFirstLaunch() { openModal('firstLaunchBackdrop'); }
function hideFirstLaunch()  { closeModal('firstLaunchBackdrop'); }
function createFirstProfile() {
  var name = document.getElementById('firstLaunchName').value.trim();
  if (!name) { alert('Please enter a deck name.'); return; }
  var newProfile = {
    id: makeProfileId(),
    name: name,
    activeTokens: ['clue','food','treasure','mutagen'],
    enabledMods: [],
    flitwingLock: 'ask',
    artVariants: {}
  };
  profiles.push(newProfile);
  activeProfileId = newProfile.id;
  persistProfileData();
  loadActiveProfileIntoApp();
  hideFirstLaunch();
}

if (!getActiveProfile()) {
  showFirstLaunch();
}

buildGrid(); renderMods(); render(); rebuildCreateDropdown();
  updateGenericFlagsVisibility();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}
</script>
</body>
</html>
