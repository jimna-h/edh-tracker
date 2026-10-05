import { useState, useEffect, useRef, createContext, useContext } from 'react';

// --- IN-APP DIALOGS ---
// Styled replacements for window.alert/confirm/prompt, so every popup matches the app
// instead of the browser's own chrome. The App owns one dialog at a time (others queue)
// and hands this API down via context so deeply nested components (the setup wizard)
// can use it too. Each call returns a Promise:
//   alert   -> resolves when dismissed
//   confirm -> true / false
//   prompt  -> the entered string, or null if cancelled
// Always upright for someone holding the phone in portrait (same as Settings) - the
// on-screen keyboard always appears in portrait, so text entry has to read that way.
// Inline (not Tailwind classes) on purpose: index.css's global, unlayered `button` rule
// beats Tailwind's bg-/text-/border- utilities on every <button> - see the note there.
export const BTN_PRIMARY = { backgroundColor: '#ffffff', color: '#000000', border: 'none' };
export const BTN_SECONDARY = { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)' };
export const BTN_DANGER = { backgroundColor: '#f87171', color: '#000000', border: 'none' };
export const BTN_DANGER_SOFT = { backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none' };

export const DialogContext = createContext(null);
export const useDialog = () => useContext(DialogContext);

export const AppDialog = ({ dialog, onClose }) => {
  const isPrompt = dialog.kind === 'prompt';
  const [text, setText] = useState(dialog.defaultValue || '');
  const inputRef = useRef(null);
  useEffect(() => {
    if (!isPrompt) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isPrompt]);

  const accept = () => onClose(isPrompt ? text : dialog.kind === 'confirm' ? true : undefined);
  const cancel = () => onClose(isPrompt ? null : dialog.kind === 'confirm' ? false : undefined);

  return (
    <>
      {/* Closes on click (end of tap), never pointerdown - see the main backdrop's comment. */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 700000, backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} onClick={cancel} />
      <form
        className="pointer-events-auto flex flex-col items-stretch"
        style={{ backgroundColor: 'rgba(18,18,20,0.98)', borderRadius: 28, border: '1px solid rgba(255,255,255,0.1)', padding: '28px 24px 22px', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-90deg)', zIndex: 710000, width: 'min(86vw, 380px)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}
        onPointerDown={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); accept(); }}
        onKeyDown={(e) => { if (e.key === 'Escape') cancel(); }}
      >
        {dialog.title && (
          <span className="text-white font-black text-sm uppercase tracking-widest text-center">{dialog.title}</span>
        )}
        {dialog.message && (
          <span className="text-white/60 font-bold text-[13px] text-center leading-snug mt-3" style={{ whiteSpace: 'pre-line' }}>{dialog.message}</span>
        )}
        {isPrompt && (
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={dialog.placeholder || ''}
            type={dialog.inputType || 'text'}
            autoComplete="off" autoCorrect="off" autoCapitalize={dialog.autoCapitalize || 'off'} spellCheck={false}
            // 16px+ keeps iOS from auto-zooming the page when the input gets focus.
            className="text-white font-bold mt-4 px-4 py-3 outline-none"
            style={{ fontSize: 16, backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14 }}
            onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; }}
          />
        )}
        <div className="flex gap-3 mt-5 justify-center">
          {dialog.kind !== 'alert' && (
            <button type="button" onClick={cancel}
              className="flex-1 font-black uppercase text-xs px-5 py-3 rounded-full"
              style={BTN_SECONDARY}
            >{dialog.cancelLabel || 'Cancel'}</button>
          )}
          <button type="submit"
            className="flex-1 font-black uppercase text-xs px-5 py-3 rounded-full"
            style={{ ...(dialog.destructive ? BTN_DANGER : BTN_PRIMARY), maxWidth: dialog.kind === 'alert' ? 160 : undefined }}
          >{dialog.confirmLabel || 'OK'}</button>
        </div>
      </form>
    </>
  );
};
