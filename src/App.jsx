import React, { useState, useEffect, useRef } from 'react';

// --- STYLING CONSTANTS ---
const textShadowStyle = { 
  textShadow: '0px 2px 10px rgba(0,0,0,0.9), 0px 0px 20px rgba(0,0,0,0.5)' 
};

// --- RESPONSIVE HELPER ---
// Matches Tailwind's `md:` breakpoint (768px) so "large screen" here means the same
// thing it means everywhere else in the app's className strings.
const useIsLargeScreen = () => {
  const [isLarge, setIsLarge] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e) => setIsLarge(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isLarge;
};


// --- COLOR PICKER COMPONENT ---
const ColorPicker = ({ selected = [], onToggle }) => {
  const colors = [
    { id: 'W', bg: '#fffbeb', text: 'text-gray-800' },
    { id: 'U', bg: '#3b82f6', text: 'text-white' },
    { id: 'B', bg: '#1f2937', text: 'text-white' },
    { id: 'R', bg: '#ef4444', text: 'text-white' },
    { id: 'G', bg: '#22c55e', text: 'text-white' }
  ];
  
  return (
    <div className="flex gap-3 md:gap-5 justify-center items-center"> 
      {colors.map(c => {
        const isSelected = selected.includes(c.id);
        return (
          <button
            key={c.id}
            onClick={(e) => { e.stopPropagation(); onToggle(c.id); }}
            style={{ 
              backgroundColor: c.bg,
              width: 'clamp(40px, 8vw, 70px)', 
              height: 'clamp(40px, 8vw, 70px)',
              minWidth: 'clamp(40px, 8vw, 70px)'
            }}
            className={`rounded-full transition-all duration-300 flex items-center justify-center font-black text-xl md:text-3xl
              ${c.text} 
              ${isSelected 
                ? 'scale-110 border-[3px] border-white shadow-[0_0_25px_rgba(255,255,255,0.4)] opacity-100' 
                : 'opacity-50 scale-95 border border-white/10 hover:opacity-100 hover:scale-100'}`}
          >
            {c.id}
          </button>
        );
      })}
    </div>
  );
};

// --- SELECTION CAROUSEL ---
const SelectionCarousel = ({ options = [], onSelect, onBack, title, showBack = true, isFlipped, buttonColor, twoRows = false, extraButton = null, axisSwapped = false }) => {
  const scrollRef = useRef(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const didScroll = useRef(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const mountTime = useRef(Date.now());
  const handledTouch = useRef(false);
  const [fadeMask, setFadeMask] = useState('none');
  const fadeRaf = useRef(null);

  const FADE_START = 'linear-gradient(to right, transparent, black 10%, black)';
  const FADE_END = 'linear-gradient(to right, black, black 90%, transparent)';
  const FADE_BOTH = 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)';

  const updateFadeMask = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 2;
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
    let next = 'none';
    if (!atStart && !atEnd) next = FADE_BOTH;
    else if (!atStart && atEnd) next = FADE_START;
    else if (atStart && !atEnd) next = FADE_END;
    setFadeMask(next);
  };

  const scheduleFadeUpdate = () => {
    if (fadeRaf.current) cancelAnimationFrame(fadeRaf.current);
    fadeRaf.current = requestAnimationFrame(updateFadeMask);
  };

  useEffect(() => {
    mountTime.current = Date.now();
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
    scheduleFadeUpdate();
  }, [options]);

  const mouseStartX = useRef(0);

  const handleMouseDown = (e) => {
    setIsDown(true);
    setStartX(e.pageX - e.currentTarget.offsetLeft);
    setScrollLeft(e.currentTarget.scrollLeft);
    mouseStartX.current = e.pageX;
    didScroll.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - e.currentTarget.offsetLeft;
    const walk = (x - startX) * (isFlipped ? -2 : 2);
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollLeft - walk;
    if (Math.abs(e.pageX - mouseStartX.current) > 5) didScroll.current = true;
    scheduleFadeUpdate();
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    didScroll.current = false;
    handledTouch.current = false;
  };

  const handleTouchMove = (e) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > 5 || dy > 5) didScroll.current = true;
    scheduleFadeUpdate();
  };

  const handleTouchEnd = (e) => {
    if (didScroll.current) return;
    if (Date.now() - mountTime.current < 300) return;
    e.preventDefault();
    e.stopPropagation();
    if (handledTouch.current) return;
    handledTouch.current = true;
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const button = el?.closest('[data-option-index]');
    if (!button) return;
    const index = parseInt(button.dataset.optionIndex);
    if (!isNaN(index) && options[index] !== undefined) onSelect(options[index]);
  };

  return (
    <div className="w-full max-w-[90%] md:max-w-[450px] flex flex-col items-center animate-in fade-in zoom-in duration-500 z-10 mx-auto" style={{ paddingTop: 6, paddingBottom: 6 }}>
      {title && (
        <p className="font-black text-[10px] md:text-[14px] uppercase tracking-[0.4em] md:tracking-[0.6em] mb-0.5 md:mb-2 text-white/60 drop-shadow-md">
          {title}
        </p>
      )}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDown(false)}
        onMouseLeave={() => setIsDown(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onScroll={scheduleFadeUpdate}
        className={`overflow-x-auto no-scrollbar px-5 md:px-8 w-full cursor-grab ${twoRows ? 'flex flex-col gap-1' : 'flex flex-nowrap gap-4 md:gap-6 py-4'}`}
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: axisSwapped ? 'pan-x' : 'pan-y',
          WebkitMaskImage: fadeMask,
          maskImage: fadeMask,
        }}
      >
        {twoRows ? (() => {
          const row1 = options.filter((_, i) => i % 2 === 0);
          const row2 = options.filter((_, i) => i % 2 === 1);
          return [row1, row2].map((row, ri) => (
            <div key={ri} className="flex flex-nowrap gap-3">
              {row.map((opt, i) => {
                const globalIdx = i * 2 + ri;
                const isObj = typeof opt === 'object' && opt !== null;
                const hasArt = isObj && opt.artUrl;
                const label = isObj ? (opt.name || opt.deck || "Unnamed") : opt;
                return (
                  <button
                    key={`${title}-${globalIdx}`}
                    data-option-index={globalIdx}
                    onClick={(e) => { if (handledTouch.current) return; if (!didScroll.current) onSelect(opt); }}
                    className={`relative shrink-0 w-[100px] md:w-[130px] h-[54px] md:h-[70px] border border-white/10 rounded-[1rem] md:rounded-[1.5rem] flex items-center justify-center px-2 snap-center transition-all overflow-hidden active:scale-90 active:opacity-70 ${buttonColor ? '' : 'bg-white/[0.06] backdrop-blur-md'}`}
                    style={buttonColor ? { backgroundColor: buttonColor } : {}}
                  >
                    {hasArt && (<><img src={opt.artUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-85" /><div className="absolute inset-0 bg-black/15" /></>)}
                    <span className="relative z-10 text-sm font-semibold uppercase tracking-tight text-white text-center drop-shadow-md line-clamp-2 leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          ));
        })() : options.map((opt, i) => {
          const isObj = typeof opt === 'object' && opt !== null;
          const hasArt = isObj && opt.artUrl;
          const label = isObj ? (opt.name || opt.deck || "Unnamed") : opt;
          return (
            <button
  key={`${title}-${i}`}
  data-option-index={i}
  onClick={(e) => {
    if (handledTouch.current) return;
    if (!didScroll.current) onSelect(opt);
  }}
  className={`relative shrink-0 w-[110px] md:w-[140px] h-[68px] md:h-[90px] border border-white/10 rounded-[1.2rem] md:rounded-[2rem] flex items-center justify-center px-3 snap-center transition-all overflow-hidden active:scale-90 active:opacity-70 ${buttonColor ? '' : 'bg-white/[0.05] backdrop-blur-md'}`}
  style={buttonColor ? { backgroundColor: buttonColor } : {}}
>
              {hasArt && (
                <>
                  <img src={opt.artUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-85" />
                  <div className="absolute inset-0 bg-black/15" />
                </>
              )}
              <span className="relative z-10 text-base md:text-xl font-semibold uppercase tracking-tight text-white text-center drop-shadow-md line-clamp-2 leading-tight">
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="shrink-0 flex items-center gap-3 mt-0.5 md:mt-2">
        {showBack && (
          <button onClick={onBack} className="px-6 md:px-8 py-1 md:py-2 bg-white/10 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-colors backdrop-blur-sm whitespace-nowrap">
            - Back
          </button>
        )}
        {extraButton}
      </div>
    </div>
  );
};

// --- QUADRANT WRAPPER ---
const QuadrantWrapper = ({ children, isFlipped, isOut, artUrl, artUrlPartner, isWinner }) => {
  const hasArt = !!artUrl && typeof artUrl === 'string' && artUrl.startsWith('http');
  const hasPartner = !!artUrlPartner && (artUrlPartner === 'partner' || artUrlPartner.startsWith('http'));
  
  const bgStyle = hasArt && !isOut ? {
    backgroundImage: `url(${artUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};
  
  return (
    <div 
      className={`
        relative h-[calc(100%-8px)] md:h-[calc(100%-20px)] w-[calc(100%-8px)] md:w-[calc(100%-20px)] 
        rounded-[1.5rem] md:rounded-[3.5rem] transition-all duration-700
        flex flex-col items-center justify-center overflow-hidden
        ${isFlipped ? 'rotate-180' : ''}
        ${isOut ? (isWinner ? 'bg-[#0a0a0a]' : 'bg-[#050505]') : (!hasArt ? 'bg-gradient-to-br from-[#b8cedc] via-[#a3b8c9] to-[#8da3b5]' : '')}
      `}
      style={bgStyle}
    >
      {/* Partner commander - left/right split, each half independently centered/covered */}
      {hasArt && hasPartner && !isOut && (
        <>
          <div className="absolute inset-y-0" style={{
            left: isFlipped ? '50%' : 0, width: '50%',
            backgroundImage: `url(${artUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} />
          <div className="absolute inset-y-0" style={{
            left: isFlipped ? 0 : '50%', width: '50%',
            backgroundImage: `url(${artUrlPartner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} />
        </>
      )}
      {hasArt && !isOut && (
        <div className="absolute inset-0 bg-black/55" />
      )}
      <div className="relative z-10 w-full h-full flex flex-col items-stretch justify-center p-1">
        {children}
      </div>
    </div>
  );
};

// --- GRID PICKER ---
// Two-row grid replacing carousel for players/decks
const GridPicker = ({ title, options, onSelect, onBack }) => {
  const mid = Math.ceil(options.length / 2);
  const row1 = options.slice(0, mid);
  const row2 = options.slice(mid);

  const btnStyle = (hasArt) => ({
    flex: 1, minWidth: 0, height: 52, borderRadius: 12, fontWeight: 900, fontSize: 11,
    color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em',
    backgroundColor: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.35)',
    position: 'relative', overflow: 'hidden', whiteSpace: 'nowrap',
  });

  const renderBtn = (opt, i) => {
    const isObj = typeof opt === 'object' && opt !== null;
    const label = isObj ? (opt.name || opt.deck || 'Unnamed') : String(opt);
    const art = isObj ? opt.artUrl : null;
    return (
      <button key={i} onClick={() => onSelect(opt)} style={btnStyle(!!art)}>
        {art && <img src={art} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />}
        <span style={{ position: 'relative', zIndex: 1, textShadow: art ? '0 1px 4px rgba(0,0,0,0.9)' : 'none', padding: '0 6px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center w-full animate-in fade-in zoom-in duration-500" style={{ gap: 8, padding: '0 10px' }}>
      {title && <p className="text-white/60 font-black text-[10px] uppercase tracking-[0.4em]">{title}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}>
        <div style={{ display: 'flex', gap: 7 }}>{row1.map((opt, i) => renderBtn(opt, i))}</div>
        {row2.length > 0 && <div style={{ display: 'flex', gap: 7 }}>{row2.map((opt, i) => renderBtn(opt, mid + i))}</div>}
      </div>
      <button onClick={onBack} className="mt-4 md:mt-8 px-6 md:px-8 py-3 md:py-4 bg-white/10 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-colors backdrop-blur-sm whitespace-nowrap">- Back</button>
    </div>
  );
};


const SetupQuadrantInner = ({ id, seat, isFlipped, axisSwapped = false, playerDataMap, onUpdate, onSetFirst, firstSeatIndex, onResetAll, mulliganType, onSetMulligan }) => {
  const [step, setStep] = useState(0); 
  const [tempColors, setTempColors] = useState([]);
  
  const playerOptions = playerDataMap.filter(p => p.player_name !== 'Precons').map(p => ({
    name: p.player_name,
    artUrl: p.pfp
  }));
  const players = playerOptions;

  const playerEntry = playerDataMap.find(p => p.player_name === seat.name) || { decks: [], pfp: '' };
  const rawDecks = (playerEntry.decks || []).filter(d => !d.exclude);
  const decks = rawDecks;
  const mulliganOptions = ["London", "Vegas", "3 Piles of 4", "10 Put Back 3", "Other"];

  useEffect(() => {
    if (firstSeatIndex !== null && seat.order !== '' && step === 0) {
      setStep(1);
    } else if (firstSeatIndex === null) {
      setStep(0);
    }
  }, [firstSeatIndex, seat.order]);

  const handleBack = () => {
    if (step === 1) {
      onResetAll();
    } else if (step === 2) {
      onUpdate(id, 'name', '');
      setStep(1);
    } else if (step === 3 || step === 4 || step === 5 || step === 6 || step === 8) {
      onUpdate(id, 'artUrl', '');
      onUpdate(id, 'colors', '');
      if (step === 6) {
        onUpdate(id, 'deckOwner', '');
        setStep(1);
      } else if (step === 5) {
        onUpdate(id, 'deckOwner', '');
        setStep(2);
      } else if (step === 4 && seat.deckOwner) {
        setStep(5);
      } else {
        setStep(2);
      }
    } else {
      setStep(Math.max(0, step - 1));
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <QuadrantWrapper isFlipped={isFlipped} artUrl={seat.artUrl} artUrlPartner={seat.artUrlPartner}>
        {step === 0 && firstSeatIndex === null && (
          <div className="w-full h-full flex items-center justify-center">
            <button 
              onClick={() => onSetFirst(id)}
              className="w-[85%] h-[40%] bg-white/90 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center shadow-2xl active:scale-95 transition-transform cursor-pointer pointer-events-auto"
            >
              <span className="text-white font-black text-sm md:text-xl uppercase text-center leading-tight px-2">Goes First</span>
            </button>
          </div>
        )}

        {step >= 1 && !mulliganType && (
          seat.order === 4 ? (
            <SelectionCarousel axisSwapped={axisSwapped}
              title="Select Mulligan (Last Player)" 
              isFlipped={isFlipped} 
              options={mulliganOptions} 
              onBack={onResetAll} 
              onSelect={(val) => {
                const finalVal = val === "Other" ? (prompt("Mulligan Type:") || "Other") : val;
                onSetMulligan(finalVal);
              }} 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center animate-pulse">
                <p className="text-white/20 font-black text-[10px] md:text-xs uppercase tracking-[0.4em]">Waiting for Seat 4</p>
                <p className="text-white/40 font-black text-lg md:text-2xl uppercase">Choosing Mulligan...</p>
              </div>
            </div>
          )
        )}

        {step === 1 && mulliganType && (
          <SelectionCarousel axisSwapped={axisSwapped}
            title={`Seat ${seat.order}`} 
            isFlipped={isFlipped} 
            options={players}
            twoRows
            onBack={handleBack} 
            extraButton={
              <button onClick={() => { onUpdate(id, 'name', 'Guest'); onUpdate(id, 'pfpUrl', ''); setStep(2); }}
                className="px-6 md:px-8 py-1 md:py-2 bg-white/10 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-colors backdrop-blur-sm whitespace-nowrap">
                + Guest
              </button>
            }
            onSelect={(val) => { 
              onUpdate(id, 'name', val.name); 
              onUpdate(id, 'pfpUrl', val.artUrl); 
              setStep(2); 
            }} 
          />
        )}
        
        {step === 2 && (
          <SelectionCarousel axisSwapped={axisSwapped}
            title="Deck" 
            isFlipped={isFlipped} 
            options={decks}
            twoRows
            onBack={handleBack} 
            extraButton={
              <>
                <button onClick={() => setStep(5)}
                  className="px-6 md:px-8 py-1 md:py-2 bg-white/10 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-colors backdrop-blur-sm whitespace-nowrap">
                  Borrowed
                </button>
                <button onClick={() => {
                  if (seat.name === 'Guest') {
                    onUpdate(id, 'deck', '');
                    setStep(4);
                  } else {
                    const deckName = prompt("Deck Name:");
                    if (deckName === null) return;
                    onUpdate(id, 'deck', deckName || "Other"); setStep(4);
                  }
                }}
                  className="px-6 md:px-8 py-1 md:py-2 bg-white/10 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-colors backdrop-blur-sm whitespace-nowrap">
                  + Other
                </button>
              </>
            }
            onSelect={(val) => { 
              onUpdate(id, 'deck', val.deck); 
              onUpdate(id, 'artUrl', val.artUrl); 
              onUpdate(id, 'artUrlPartner', val.artUrlPartner || '');
              onUpdate(id, 'colors', val.colors || ''); 
              setStep(3); 
            }}
          />
        )}

        {step === 4 && (
          <div className="flex flex-col items-center justify-between h-full w-full px-6 py-8 md:py-12 animate-in zoom-in duration-300">
            <p className="text-white/40 font-black text-[10px] md:text-sm uppercase tracking-[0.6em]">Select Colors</p>
            <div className="flex-1 flex items-center justify-center w-full">
              <ColorPicker selected={tempColors} onToggle={(c) => setTempColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])} />
            </div>
            <div className="flex gap-4 w-full max-w-[420px]">
              <button onClick={handleBack} className="px-6 md:px-8 py-3 md:py-4 bg-white/10 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-colors backdrop-blur-sm whitespace-nowrap">
                - Back
              </button>
              <button onClick={() => {
                const colorStr = tempColors.join('');
                onUpdate(id, 'colors', colorStr);
                // For guests, use colors as deck name
                if (seat.name === 'Guest') onUpdate(id, 'deck', colorStr || 'Guest');
                setStep(8); // partner toggle
              }} className="flex-1 px-6 md:px-8 py-3 md:py-4 bg-white text-black rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-widest hover:bg-white/90 transition-colors shadow-2xl whitespace-nowrap">
                Confirm
              </button>
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="flex flex-col items-center justify-center h-full w-full px-6 animate-in zoom-in duration-300">
            <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.6em] mb-6">Partner Commanders?</p>
            <div style={{ display: 'flex', gap: 24, width: '100%', maxWidth: 280 }}>
              <button onClick={() => { onUpdate(id, 'artUrlPartner', ''); setStep(3); }}
                style={{ flex: 1, height: 56, borderRadius: 14, fontWeight: 900, fontSize: 16, color: '#000', backgroundColor: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.7)' }}>
                No
              </button>
              <button onClick={() => { onUpdate(id, 'artUrlPartner', 'partner'); setStep(3); }}
                style={{ flex: 1, height: 56, borderRadius: 14, fontWeight: 900, fontSize: 16, color: '#000', backgroundColor: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.7)' }}>
                Yes
              </button>
            </div>
            <button onClick={handleBack} className="mt-4 md:mt-8 px-6 md:px-8 py-3 md:py-4 bg-white/10 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-colors backdrop-blur-sm whitespace-nowrap">
              - Back
            </button>
          </div>
        )}

        {step === 5 && (
          <SelectionCarousel axisSwapped={axisSwapped}
            title="Borrow From?" 
            isFlipped={isFlipped} 
            options={playerDataMap.filter(p => p.player_name !== seat.name).map(p => ({ name: p.player_name, artUrl: p.pfp }))}
            twoRows
            onBack={handleBack} 
            extraButton={
              <button onClick={() => {
                const strangerName = prompt("Borrowing from (name):");
                if (!strangerName) return;
                const deckName = prompt("Deck Name:");
                if (deckName === null) return;
                onUpdate(id, 'deckOwner', strangerName);
                onUpdate(id, 'deck', deckName || 'Borrowed Deck');
                onUpdate(id, 'artUrl', '');
                onUpdate(id, 'artUrlPartner', '');
                setStep(4);
              }}
                className="px-6 md:px-8 py-1 md:py-2 bg-white/10 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-colors backdrop-blur-sm whitespace-nowrap">
                + Stranger
              </button>
            }
            onSelect={(val) => { 
              onUpdate(id, 'deckOwner', typeof val === 'object' ? val.name : val); 
              setStep(6); 
            }} 
          />
        )}
        {step === 6 && (
          <SelectionCarousel axisSwapped={axisSwapped}
            title={`${seat.deckOwner}'s Decks`} 
            isFlipped={isFlipped} 
            options={(playerDataMap.find(p => p.player_name === seat.deckOwner)?.decks || []).filter(d => !d.exclude)}
            twoRows
            onBack={handleBack} 
            onSelect={(val) => { 
              onUpdate(id, 'deck', val.deck); 
              onUpdate(id, 'artUrl', val.artUrl); 
              onUpdate(id, 'artUrlPartner', val.artUrlPartner || '');
              onUpdate(id, 'colors', val.colors || ''); 
              setStep(3); 
            }} 
          />
        )}
        {step === 3 && (
          <div className="flex flex-col items-center w-full max-w-[90%] md:max-w-[450px] mx-auto animate-in fade-in zoom-in duration-500" style={{ gap: 4, paddingTop: 6, paddingBottom: 6 }}>
            <p className="text-white/60 font-black text-[10px] uppercase tracking-[0.4em] text-center">Starting Lands</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', maxWidth: 280 }}>
              {[[0,1,2,3],[4,5,6,7]].map((row, ri) => (
                <div key={ri} style={{ display: 'flex', gap: 6 }}>
                  {row.map(n => (
                    <button key={n} onClick={() => { onUpdate(id, 'startLands', n); setStep(7); }}
                      style={{
                        flex: 1, height: 52, borderRadius: 12,
                        fontSize: 20, fontWeight: 900, color: '#fff',
                        backgroundColor: 'rgba(255,255,255,0.55)',
                        border: '1px solid rgba(255,255,255,0.7)',
                        color: '#000',
                      }}
                    >{n}</button>
                  ))}
                </div>
              ))}
            </div>
            <button onClick={handleBack} className="px-6 md:px-8 py-1 md:py-2 bg-white/10 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-colors backdrop-blur-sm whitespace-nowrap">
              - Back
            </button>
          </div>
        )}
        
        {step === 7 && (
          <div className="text-center animate-in fade-in zoom-in duration-500 px-2">
            <p style={seat.artUrl ? textShadowStyle : {}} className="text-white/70 font-black text-[8px] md:text-[16px] uppercase tracking-[0.4em] mb-1 truncate max-w-[200px] mx-auto">
              {seat.deck}
            </p>
            {seat.deckOwner && seat.deckOwner !== seat.name && (
              <p style={seat.artUrl ? textShadowStyle : {}} className="text-white/40 font-black text-[7px] md:text-[12px] uppercase tracking-[0.3em] mb-1">
                borrowed from {seat.deckOwner}
              </p>
            )}
            <h2 style={seat.artUrl ? textShadowStyle : {}} className="text-white text-2xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4">
              {seat.name}
            </h2>
            <button onClick={() => { setStep(1); onUpdate(id, 'artUrl', ''); }} className="text-white/40 font-black text-[9px] uppercase tracking-[0.2em]">Edit</button>
          </div>
        )}
      </QuadrantWrapper>
    </div>
  );
};

// Only re-render a seat's setup screen when its OWN data actually changes -
// prevents unrelated seats from re-rendering (and their scroll position
// resetting) whenever any other seat updates.
const SetupQuadrant = React.memo(SetupQuadrantInner, (prev, next) => (
  prev.seat === next.seat &&
  prev.isFlipped === next.isFlipped &&
  prev.axisSwapped === next.axisSwapped &&
  prev.playerDataMap === next.playerDataMap &&
  prev.firstSeatIndex === next.firstSeatIndex &&
  prev.mulliganType === next.mulliganType
));

// --- CMD DAMAGE CELL ---
const CmdCell = ({ value, value2, hasPartner, danger, danger2, isSelf, artUrl, artUrlPartner, onChange, onChange2, held, onHold }) => {
  const [activeHalfA, setActiveHalfA] = useState(null);
  const [activeHalfB, setActiveHalfB] = useState(null);
  const holdTimer = useRef(null);
  const tapRepeat = useRef(null);
  const tapTimer = useRef(null);

  const startHold = () => {
    holdTimer.current = setTimeout(() => {
      onHold(true);
      holdTimer.current = null;
    }, 400);
  };
  const cancelHold = () => {
    clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  const startTap = (fn, delta) => {
    fn(delta);
    tapTimer.current = setTimeout(() => {
      tapRepeat.current = setInterval(() => fn(delta * 10), 300);
      tapTimer.current = null;
    }, 400);
  };
  const stopTap = (setHalf) => {
    clearTimeout(tapTimer.current);
    clearInterval(tapRepeat.current);
    tapTimer.current = null;
    tapRepeat.current = null;
    setHalf(null);
  };

  const tapZones = (fn, activeHalf, setHalf) => (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 10 }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: 8, backgroundColor: activeHalf === 'left' ? 'rgba(220,50,50,0.3)' : 'transparent', transition: 'background-color 0.08s' }}
        onPointerDown={(e) => { e.stopPropagation(); setHalf('left'); startTap(fn, -1); }}
        onPointerUp={(e) => { e.stopPropagation(); stopTap(setHalf); }}
        onPointerLeave={() => stopTap(setHalf)} onPointerCancel={() => stopTap(setHalf)}
      >
        <span style={{ fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,0.8)', userSelect: 'none', pointerEvents: 'none', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>-</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, backgroundColor: activeHalf === 'right' ? 'rgba(50,200,100,0.3)' : 'transparent', transition: 'background-color 0.08s' }}
        onPointerDown={(e) => { e.stopPropagation(); setHalf('right'); startTap(fn, 1); }}
        onPointerUp={(e) => { e.stopPropagation(); stopTap(setHalf); }}
        onPointerLeave={() => stopTap(setHalf)} onPointerCancel={() => stopTap(setHalf)}
      >
        <span style={{ fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,0.8)', userSelect: 'none', pointerEvents: 'none', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>+</span>
      </div>
    </div>
  );

  const subCell = (art, val, isDanger, isSelfCell, onTap, activeHalf, setHalf) => (
    <div
      style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        backgroundImage: art && art !== 'partner' ? `url(${art})` : 'none',
        backgroundSize: 'cover', backgroundPosition: 'center',
        backgroundColor: art && art !== 'partner' ? 'transparent' : (isDanger ? 'rgba(180,20,20,0.9)' : 'rgba(255,255,255,0.10)'),
        WebkitTapHighlightColor: held ? 'transparent' : undefined,
      }}
      onPointerDown={(e) => { e.stopPropagation(); startHold(); }}
      onPointerUp={(e) => {
        e.stopPropagation();
        if (holdTimer.current) { cancelHold(); if (!held) onTap(1); }
      }}
      onPointerLeave={cancelHold} onPointerCancel={cancelHold}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundColor: isDanger ? 'rgba(180,20,20,0.55)' : 'rgba(0,0,0,0.45)' }} />
      {held && tapZones(onTap, activeHalf, setHalf)}
      {isSelfCell && val === 0
        ? <span style={{ position: 'relative', zIndex: 1, fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', textShadow: '0 1px 4px rgba(0,0,0,0.9)', userSelect: 'none' }}>me</span>
        : <span style={{ position: 'relative', zIndex: 1, fontSize: 'clamp(14px, 4vw, 24px)', fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: '0 1px 6px rgba(0,0,0,0.9)', userSelect: 'none' }}>{val}</span>
      }
    </div>
  );

  if (hasPartner) {
    return (
      <div style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'row', border: '1px solid rgba(255,255,255,0.2)' }}>
        {subCell(artUrl, value, danger, isSelf, onChange, activeHalfA, setActiveHalfA)}
        {subCell(artUrlPartner, value2, danger2, isSelf, onChange2, activeHalfB, setActiveHalfB)}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden', display: 'flex', border: '1px solid rgba(255,255,255,0.2)' }}>
      {subCell(artUrl, value, danger, isSelf, onChange, activeHalfA, setActiveHalfA)}
    </div>
  );
};

// --- STAT PICKER ---
const StatPicker = ({ label, color, onConfirm, onBack }) => {
  const [value, setValue] = useState(0);
  const [activeHalf, setActiveHalf] = useState(null);
  const timerRef = useRef(null);
  const repeatRef = useRef(null);

  const change = (delta) => setValue(prev => Math.max(0, prev + delta));

  const startRepeat = (delta) => {
    change(delta);
    timerRef.current = setTimeout(() => {
      repeatRef.current = setInterval(() => change(delta), 80);
      timerRef.current = null;
    }, 350);
  };
  const stopRepeat = () => {
    clearTimeout(timerRef.current);
    clearInterval(repeatRef.current);
    timerRef.current = null;
    repeatRef.current = null;
    setActiveHalf(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', touchAction: 'none', position: 'relative' }}>

      {/* Full-quadrant tap zones at z-index 0 */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', touchAction: 'none', zIndex: 0,
          backgroundColor: activeHalf === 'left' ? 'rgba(220,50,50,0.22)' : 'transparent', transition: 'background-color 0.08s' }}
        onPointerDown={(e) => { e.preventDefault(); setActiveHalf('left'); startRepeat(-1); }}
        onPointerUp={(e) => { e.preventDefault(); stopRepeat(); }}
        onPointerLeave={stopRepeat} onPointerCancel={stopRepeat}
      />
      <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', touchAction: 'none', zIndex: 0,
          backgroundColor: activeHalf === 'right' ? 'rgba(50,200,100,0.22)' : 'transparent', transition: 'background-color 0.08s' }}
        onPointerDown={(e) => { e.preventDefault(); setActiveHalf('right'); startRepeat(1); }}
        onPointerUp={(e) => { e.preventDefault(); stopRepeat(); }}
        onPointerLeave={stopRepeat} onPointerCancel={stopRepeat}
      />

      {/* Number + edge hints, pointerEvents none */}
      <div style={{ flex: '1 1 0', position: 'relative', zIndex: 1, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 'clamp(52px, 18vw, 100px)', fontWeight: 900, lineHeight: 1, color: '#fff', userSelect: 'none', textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>{value}</span>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: 'rgba(255,255,255,0.75)', userSelect: 'none', textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>-</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: 'rgba(255,255,255,0.75)', userSelect: 'none', textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>+</span>
        </div>
      </div>

      {/* Big colored label, pointerEvents none */}
      <div style={{ flex: '0 0 auto', position: 'relative', zIndex: 1, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px' }}>
        <span style={{ fontSize: 'clamp(28px, 9vw, 52px)', fontWeight: 900, color: color, textTransform: 'uppercase', letterSpacing: '0.25em', userSelect: 'none', textShadow: `0 0 30px ${color}, 0 2px 8px rgba(0,0,0,0.8)` }}>
          {label.replace('Final ', '')}
        </span>
      </div>

      {/* Buttons at z-index 10 - pointerEvents:none on wrapper so its padding can't swallow taps meant for the tap-zones underneath */}
      <div style={{ flex: '0 0 auto', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 8px 10px', pointerEvents: 'none' }}>
        <button onClick={onBack}
          style={{ flex: 1, height: 34, borderRadius: 999, fontWeight: 900, fontSize: 9, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', pointerEvents: 'auto' }}
        >Back</button>
        <button onClick={() => onConfirm(null)}
          style={{ flex: 1, height: 34, borderRadius: 999, fontWeight: 900, fontSize: 9, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', pointerEvents: 'auto' }}
        >Skip</button>
        <button onClick={() => onConfirm(value)}
          style={{ flex: 1, height: 34, borderRadius: 999, fontWeight: 900, fontSize: 10, color: '#fff', textTransform: 'uppercase', backgroundColor: color, border: 'none', pointerEvents: 'auto' }}
        >Next</button>
      </div>

    </div>
  );
};

// Matches the seatIndex -> area mapping used at the top level for cross layout, so the
// commander damage grid mirrors the actual seating arrangement. Shared (not a hook) so both
// Quadrant and the top-level small-screen commander damage modal can compute it identically.
const CROSS_AREA_BY_SEAT = { 0: 'top', 1: 'midl', 2: 'midr', 3: 'bot' };
const CMD_AREA_MAP_BY_SEAT = {
  0: { 0: 'bot', 1: 'midl', 2: 'midr', 3: 'top' },
  1: { 0: 'bot', 1: 'midr', 2: 'midl', 3: 'top' },
  2: { 0: 'top', 1: 'midl', 2: 'midr', 3: 'bot' },
  3: { 0: 'top', 1: 'midr', 2: 'midl', 3: 'bot' },
};
const getSeatCmdInfo = (seatIndex, tableLayout) => {
  const cmdAreaFor = (opSeatIndex) => CMD_AREA_MAP_BY_SEAT[seatIndex]?.[opSeatIndex] ?? CROSS_AREA_BY_SEAT[opSeatIndex];
  const myArea = tableLayout === 'cross' ? CROSS_AREA_BY_SEAT[seatIndex] : null;
  const isTopBot = myArea === 'top' || myArea === 'bot';
  const isMidLR = myArea === 'midl' || myArea === 'midr';
  return { cmdAreaFor, myArea, isTopBot, isMidLR };
};

// Shared commander-damage cell renderer, usable both by Quadrant's in-quadrant modal (large
// screens) and the top-level full-screen modal (small screens) so they can't drift apart.
const renderCmdCells = ({ id, player, opponents, isFlipped, tableLayout, cmdAreaFor, onCmdDamage, onLifeChange, cmdHeld, setCmdHeld }) => {
  return (tableLayout === 'cross' ? opponents : (isFlipped ? [...opponents].reverse() : opponents)).map((op) => {
    const hasPartner = !!(op.artUrlPartner && (op.artUrlPartner === 'partner' || op.artUrlPartner.startsWith('http')));
    const val0 = (player.stats.cmdDamage || {})[`${op.id}_0`] ?? (player.stats.cmdDamage || {})[op.id] ?? 0;
    const val1 = hasPartner ? ((player.stats.cmdDamage || {})[`${op.id}_1`] ?? 0) : 0;
    const isSelf = op.id === id;
    return (
      <div key={op.id} style={{ width: '100%', height: '100%', gridArea: tableLayout === 'cross' ? cmdAreaFor(op.id) : undefined }}>
        <CmdCell
          value={val0}
          value2={val1}
          hasPartner={hasPartner}
          danger={val0 >= 21}
          danger2={val1 >= 21}
          isSelf={isSelf}
          artUrl={op.artUrl}
          artUrlPartner={op.artUrlPartner}
          onChange={(delta) => {
            const key = hasPartner ? `${op.id}_0` : op.id;
            const current = (player.stats.cmdDamage || {})[key] ?? 0;
            const actual = delta > 0 ? delta : Math.max(-current, delta);
            if (actual === 0) return;
            onCmdDamage(id, key, actual);
            onLifeChange(id, -actual);
          }}
          onChange2={(delta) => {
            const key2 = `${op.id}_1`;
            const current2 = (player.stats.cmdDamage || {})[key2] ?? 0;
            const actual2 = delta > 0 ? delta : Math.max(-current2, delta);
            if (actual2 === 0) return;
            onCmdDamage(id, key2, actual2);
            onLifeChange(id, -actual2);
          }}
          held={cmdHeld}
          onHold={setCmdHeld}
        />
      </div>
    );
  });
};

// Grid-area layout and sizing for a seat's commander-damage grid, shared between the in-quadrant
// (large screen) and full-screen (small screen) modal variants.
const getCmdGridLayout = (isMidLR, tableLayout) => {
  const gridAreaStyle = isMidLR
    ? { gridTemplateColumns: '0.8fr 1.4fr 0.8fr', gridTemplateRows: '1fr 1fr', gridTemplateAreas: '"top midl bot" "top midr bot"' }
    : tableLayout === 'cross'
    ? { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '0.8fr 1.4fr 0.8fr', gridTemplateAreas: '"top top" "midl midr" "bot bot"' }
    : { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
  const largeScreenSize = isMidLR
    ? { width: 'clamp(240px, 58vw, 320px)', height: 'clamp(200px, 52vw, 280px)' }
    : tableLayout === 'cross'
    ? { width: 'clamp(200px, 52vw, 280px)', height: 'clamp(240px, 58vw, 320px)' }
    : { width: 'clamp(200px, 52vw, 280px)', height: 'clamp(200px, 52vw, 280px)' };
  const smallScreenSize = isMidLR
    ? { width: 'clamp(300px, 88vw, 480px)', height: 'clamp(240px, 72vw, 380px)' }
    : tableLayout === 'cross'
    ? { width: 'clamp(240px, 72vw, 380px)', height: 'clamp(300px, 88vw, 480px)' }
    : { width: 'clamp(260px, 82vw, 460px)', height: 'clamp(260px, 82vw, 460px)' };
  return { gridAreaStyle, largeScreenSize, smallScreenSize };
};

// Mirrors App's own layoutConfig/crossRotationFix (kept in sync manually - see those definitions
// in App) so a seat's total on-screen rotation can be computed from just its seatIndex, without
// needing to be inside that seat's own per-seat wrapper. Used to orient the top-level small-screen
// modal to face whichever player's commander damage is being viewed, the same way their own
// quadrant already faces them.
const SEAT_LAYOUT_BY_MODE = {
  cross: [
    { seatIndex: 0, area: 'top', flipped: true },
    { seatIndex: 1, area: 'midl', flipped: false },
    { seatIndex: 2, area: 'midr', flipped: false },
    { seatIndex: 3, area: 'bot', flipped: false },
  ],
  grid: [
    { seatIndex: 0, area: 'tl', flipped: true },
    { seatIndex: 1, area: 'tr', flipped: true },
    { seatIndex: 2, area: 'bl', flipped: false },
    { seatIndex: 3, area: 'br', flipped: false },
  ],
};
const CROSS_FIX_DEG_BY_AREA = { top: -90, bot: -90, midl: 180 }; // midr: no extra rotation

const getSeatOrientation = (seatIndex, tableLayout) => {
  const cfg = SEAT_LAYOUT_BY_MODE[tableLayout === 'cross' ? 'cross' : 'grid'].find(c => c.seatIndex === seatIndex);
  if (!cfg) return { deg: 0, flipped: false, swapped: false };
  const fixDeg = tableLayout === 'cross' ? (CROSS_FIX_DEG_BY_AREA[cfg.area] || 0) : 0;
  const deg = fixDeg + (cfg.flipped ? 180 : 0);
  return { deg, flipped: cfg.flipped, swapped: Math.abs(deg % 180) === 90 };
};

// Top-level full-screen commander damage modal for small screens (phones). Rendered directly by
// App as a sibling of the seat grid - i.e. inside the single base 90deg rotation only, never
// nested inside cross-layout's extra per-seat counter-rotation wrapper - so there's no nested
// transform ancestor to fight with; it just naturally covers the whole rotated app area. Its
// content is then rotated to match that seat's own orientation via getSeatOrientation, so it
// still reads correctly from that specific player's side of the table.
const SmallScreenCmdModal = ({ seatId, seats, tableLayout, onCmdDamage, onLifeChange, onClose }) => {
  const [cmdHeld, setCmdHeld] = useState(false);
  const player = seats[seatId];
  if (!player) return null;
  const opponents = seats.map((seat, idx) => ({ id: idx, name: seat.name, artUrl: seat.artUrl, artUrlPartner: seat.artUrlPartner }));
  const { cmdAreaFor, isMidLR } = getSeatCmdInfo(seatId, tableLayout);
  const { gridAreaStyle, smallScreenSize } = getCmdGridLayout(isMidLR, tableLayout);
  const { deg, flipped, swapped } = getSeatOrientation(seatId, tableLayout);
  const cells = renderCmdCells({ id: seatId, player, opponents, isFlipped: flipped, tableLayout, cmdAreaFor, onCmdDamage, onLifeChange, cmdHeld, setCmdHeld });
  const closeModal = () => { onClose(); setCmdHeld(false); };

  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 400000, pointerEvents: 'auto', backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(14px)' }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={closeModal}
    >
      <div
        style={{
          position: 'absolute', top: '50%', left: '50%',
          width: swapped ? '100svw' : '100%', height: swapped ? '100svh' : '100%',
          transform: `translate(-50%, -50%) rotate(${deg}deg)`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); closeModal(); }}
          style={{ position: 'absolute', top: 18, right: 18, width: 36, height: 36, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 16, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >×</button>
        <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: 20, userSelect: 'none' }}>Commander Damage</span>
        <div
          style={{ display: 'grid', gap: 12, ...smallScreenSize, ...gridAreaStyle }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          {cells}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 20, userSelect: 'none' }}>Tap to increment · Hold for +10</span>
      </div>
    </div>
  );
};

// --- GAMEPLAY QUADRANT ---
const Quadrant = ({ id, seatIndex, player, isFlipped, tableLayout = 'grid', onLose, onBackStep, onLifeChange, onCmdDamage, onOpenCmdModal, opponents }) => {
  const { cmdAreaFor, myArea, isTopBot, isMidLR } = getSeatCmdInfo(seatIndex, tableLayout);
  const isOut = player.status === 'done' || player.status === 'out';
  const isWinner = isOut && player.stats.turnDied === 'win';
  const hasArt = !!player.artUrl && typeof player.artUrl === 'string' && player.artUrl.startsWith('http');

  // Life tap-and-hold: tap=+/-1, hold 400ms=+/-10, with highlight and delta display
  const lifeTimerRef = useRef(null);
  const lifeRepeatRef = useRef(null);
  const deltaFadeRef = useRef(null);
  const [activeHalf, setActiveHalf] = useState(null); // 'left' | 'right' | null
  const [lifeDelta, setLifeDelta] = useState(0);
  const [showDelta, setShowDelta] = useState(false);

  const applyLifeChange = (delta) => {
    onLifeChange(id, delta);
    setLifeDelta(prev => prev + delta);
    setShowDelta(true);
    clearTimeout(deltaFadeRef.current);
    deltaFadeRef.current = setTimeout(() => {
      setShowDelta(false);
      setLifeDelta(0);
    }, 2000);
  };

  const startLifeRepeat = (delta) => {
    lifeTimerRef.current = setTimeout(() => {
      // hold triggered - do +/-10 once, then keep repeating +/-10
      applyLifeChange(delta * 9); // already did +/-1 on pointerdown, so add 9 more = 10 total
      lifeRepeatRef.current = setInterval(() => applyLifeChange(delta * 10), 400);
      lifeTimerRef.current = null;
    }, 400);
  };
  const stopLifeRepeat = (delta) => {
    clearTimeout(lifeTimerRef.current);
    clearInterval(lifeRepeatRef.current);
    lifeTimerRef.current = null;
    lifeRepeatRef.current = null;
    setActiveHalf(null);
  };
  const cancelLifeRepeat = () => {
    clearTimeout(lifeTimerRef.current);
    clearInterval(lifeRepeatRef.current);
    lifeTimerRef.current = null;
    lifeRepeatRef.current = null;
    setActiveHalf(null);
  };

  const [cmdModal, setCmdModal] = useState(null);
  const isLargeScreen = useIsLargeScreen();
  const [cmdHeld, setCmdHeld] = useState(false); // when true, all cells show +/- zones

  const statColors = ['#1a4a1a', '#5c3d1e', '#4a7a2a'];

  const life = player.stats.life ?? 40;
  const isLow = life <= 10;
  const isDead = life <= 0;
  const lifeColor = isDead ? '#ef4444' : isLow ? '#f97316' : (hasArt ? '#ffffff' : '#111111');
  const allOpponents = opponents || [];

  return (
    <div className="w-full h-full flex items-center justify-center">
      <QuadrantWrapper isFlipped={isFlipped} isOut={isOut} artUrl={player.artUrl} artUrlPartner={player.artUrlPartner} isWinner={isWinner}>
        {player.status === 'active' && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', touchAction: 'none', position: 'relative' }}>

            {/* FULL-QUADRANT TAP ZONES - z-index 0, behind everything */}
            {/* Left half = subtract */}
            <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', zIndex: 0, touchAction: 'none',
                backgroundColor: activeHalf === 'left' ? 'rgba(220,50,50,0.22)' : 'transparent',
                transition: 'background-color 0.08s',
              }}
              onPointerDown={(e) => { e.preventDefault(); setActiveHalf('left'); applyLifeChange(-1); startLifeRepeat(-1); }}
              onPointerUp={(e) => { e.preventDefault(); stopLifeRepeat(-1); }}
              onPointerLeave={cancelLifeRepeat} onPointerCancel={cancelLifeRepeat}
            />
            {/* Right half = add */}
            <div style={{
                position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', zIndex: 0, touchAction: 'none',
                backgroundColor: activeHalf === 'right' ? 'rgba(50,200,100,0.22)' : 'transparent',
                transition: 'background-color 0.08s',
              }}
              onPointerDown={(e) => { e.preventDefault(); setActiveHalf('right'); applyLifeChange(1); startLifeRepeat(1); }}
              onPointerUp={(e) => { e.preventDefault(); stopLifeRepeat(1); }}
              onPointerLeave={cancelLifeRepeat} onPointerCancel={cancelLifeRepeat}
            />

            {/* ROW 1 - [Lose] [Name] [Win] - z-index 10, but pointerEvents:none on the wrapper so its padding doesn't swallow taps meant for the life tap-zones underneath; only the actual buttons/pill opt back in with pointerEvents:auto */}
            <div style={{
                flex: '0 0 auto', position: 'relative', zIndex: 10,
                display: 'flex', flexDirection: 'row', alignItems: 'center',
                gap: 6,
                paddingTop: 10, paddingBottom: 40,
                paddingLeft: isTopBot ? 10 : myArea === 'midl' ? 82 : myArea === 'midr' ? 10 : (seatIndex === 0 || seatIndex === 3) ? 95 : 10,
                paddingRight: isTopBot ? 10 : myArea === 'midr' ? 82 : myArea === 'midl' ? 10 : (seatIndex === 1 || seatIndex === 2) ? 95 : 10,
                pointerEvents: 'none',
              }}
            >
              <button onClick={(e) => { e.stopPropagation(); onLose(id); }} style={{
                flexShrink: 0, fontSize: 11, fontWeight: 900,
                padding: '6px 14px', borderRadius: 999, textTransform: 'uppercase',
                backgroundColor: hasArt ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.10)',
                color: hasArt ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.65)',
                border: hasArt ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
                pointerEvents: 'auto',
              }}>Lose</button>
              <div style={{
                flex: 1, minWidth: 0,
                backgroundColor: hasArt ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.10)',
                border: hasArt ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
                borderRadius: 999, padding: '5px 14px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: hasArt ? '#fff' : '#111', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center', userSelect: 'none' }}>{player.name}</span>
                {player.deck && <span style={{ fontSize: 8, fontWeight: 700, color: hasArt ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center', userSelect: 'none' }}>{player.deck}</span>}
              </div>
              <button onClick={(e) => { e.stopPropagation(); onLose(id, null, true); }} style={{
                flexShrink: 0, fontSize: 11, fontWeight: 900,
                padding: '6px 14px', borderRadius: 999, textTransform: 'uppercase',
                backgroundColor: 'rgba(180,148,40,0.6)', color: '#fff',
                pointerEvents: 'auto',
              }}>Win</button>
            </div>
            {/* ROW 2 - Life number + delta indicator (tap zones are full-quadrant overlays above) */}
            <div style={{ flex: '1 1 0', position: 'relative', minHeight: 0, zIndex: 5, pointerEvents: 'none' }}>
              {/* Life number */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 'clamp(56px, 21vw, 115px)', fontWeight: 900, lineHeight: 1, color: lifeColor, textShadow: hasArt ? '0px 2px 20px rgba(0,0,0,0.95)' : 'none', transition: 'color 0.2s', userSelect: 'none' }}>{life}</span>
              </div>
              {/* Delta - negative shown on left half, positive on right half */}
              {showDelta && lifeDelta < 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '50%' }}>
                  <span style={{ fontSize: 'clamp(18px, 7vw, 38px)', fontWeight: 900, userSelect: 'none', color: 'rgba(255,70,70,0.95)', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{lifeDelta}</span>
                </div>
              )}
              {showDelta && lifeDelta > 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '50%' }}>
                  <span style={{ fontSize: 'clamp(18px, 7vw, 38px)', fontWeight: 900, userSelect: 'none', color: 'rgba(60,220,110,0.95)', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>+{lifeDelta}</span>
                </div>
              )}
              {/* -/+ edge hints */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: hasArt ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.55)', userSelect: 'none', textShadow: hasArt ? '0 1px 6px rgba(0,0,0,0.9)' : 'none' }}>-</span>
                <span style={{ fontSize: 28, fontWeight: 900, color: hasArt ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.55)', userSelect: 'none', textShadow: hasArt ? '0 1px 6px rgba(0,0,0,0.9)' : 'none' }}>+</span>
              </div>
            </div>

            {/* ROW 3 - CMD damage 2x2 grid button */}
            <div style={{ flex: '0 0 auto', minHeight: 66, paddingTop: 32, position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              {(() => {
                const isCross = tableLayout === 'cross';
                const orderedOpponents = (!isCross && isFlipped) ? [...opponents].reverse() : opponents;
                const gridStyle = isMidLR
                  ? { display: 'grid', gridTemplateColumns: '1fr 1.6fr 1fr', gridTemplateRows: '1fr 1fr', gridTemplateAreas: '"top midl bot" "top midr bot"', gap: 2, width: 62, height: 46, cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 8, padding: 2, border: '2px solid rgba(255,255,255,0.12)', pointerEvents: 'auto', WebkitTapHighlightColor: 'transparent' }
                  : isCross
                  ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1.6fr 1fr', gridTemplateAreas: '"top top" "midl midr" "bot bot"', gap: 2, width: 46, height: 62, cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 8, padding: 2, border: '2px solid rgba(255,255,255,0.12)', pointerEvents: 'auto', WebkitTapHighlightColor: 'transparent' }
                  : { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 2, width: 64, height: 44, cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 8, padding: 2, border: '2px solid rgba(255,255,255,0.12)', pointerEvents: 'auto', WebkitTapHighlightColor: 'transparent' };
                return (
                  <div
                    onClick={(e) => { e.stopPropagation(); if (isLargeScreen) { setCmdModal('grid'); } else { onOpenCmdModal(id); } }}
                    style={gridStyle}
                  >
                    {orderedOpponents.map((op) => {
                  const hasPartner = !!(op.artUrlPartner && (op.artUrlPartner === 'partner' || op.artUrlPartner.startsWith('http')));
                  const val0 = (player.stats.cmdDamage || {})[`${op.id}_0`] ?? (player.stats.cmdDamage || {})[op.id] ?? 0;
                  const val1 = hasPartner ? ((player.stats.cmdDamage || {})[`${op.id}_1`] ?? 0) : 0;
                  const isSelf = op.id === id;
                  const danger0 = val0 >= 21;
                  const danger1 = val1 >= 21;

                  const miniCell = (art, val, isDanger, isSelfCell) => (
                    <div style={{
                      flex: 1, position: 'relative', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundImage: art ? `url(${art})` : 'none',
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      backgroundColor: art ? 'transparent' : (isDanger ? 'rgba(180,20,20,0.85)' : 'rgba(80,80,80,0.5)'),
                    }}>
                      <div style={{ position: 'absolute', inset: 0, backgroundColor: isDanger ? 'rgba(180,20,20,0.65)' : 'rgba(0,0,0,0.55)' }} />
                      {isSelfCell && val === 0
                        ? <span style={{ position: 'relative', zIndex: 1, fontSize: 5, fontWeight: 900, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', userSelect: 'none' }}>me</span>
                        : <span style={{ position: 'relative', zIndex: 1, fontSize: 9, fontWeight: 900, color: '#fff', userSelect: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>{val}</span>
                      }
                    </div>
                  );

                  if (hasPartner) {
                    return (
                      <div key={op.id} style={{ borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'row', gridArea: isCross ? cmdAreaFor(op.id) : undefined }}>
                        {miniCell(op.artUrl, val0, danger0, isSelf)}
                        {miniCell(op.artUrlPartner, val1, danger1, isSelf)}
                      </div>
                    );
                  }

                  return (
                    <div key={op.id} style={{ borderRadius: 4, overflow: 'hidden', display: 'flex', gridArea: isCross ? cmdAreaFor(op.id) : undefined }}>
                      {miniCell(op.artUrl, val0, danger0, isSelf)}
                    </div>
                  );
                })}
                  </div>
                );
              })()}
            </div>

            {/* CMD DAMAGE MODAL - large screens only; small screens use App-level SmallScreenCmdModal */}
            {cmdModal === 'grid' && isLargeScreen && (() => {
              const { gridAreaStyle, largeScreenSize } = getCmdGridLayout(isMidLR, tableLayout);
              const cells = renderCmdCells({ id, player, opponents, isFlipped, tableLayout, cmdAreaFor, onCmdDamage, onLifeChange, cmdHeld, setCmdHeld });
              const closeModal = () => { setCmdModal(null); setCmdHeld(false); };
              return (
                <div
                  style={{ position: 'absolute', top: -4, right: -4, bottom: -4, left: -4, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)' }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onClick={closeModal}
                >
                  <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: 12, userSelect: 'none' }}>Commander Damage</span>
                  <div
                    style={{ display: 'grid', gap: 8, ...largeScreenSize, ...gridAreaStyle }}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                  >
                    {cells}
                  </div>
                </div>
              );
            })()}

          </div>
        )}
        
        {player.status === 'questionnaire' && (
          <div className="w-full h-full" style={{ position: 'relative' }}>
            {/* Dim the background art */}
            <div style={{ position: 'absolute', top: -4, right: -4, bottom: -4, left: -4, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 0 }} />
            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <StatPicker
                key={player.step}
                label={['Final Lands', 'Final Rocks', 'Final Dorks'][player.step]}
                color={statColors[player.step]}
                onConfirm={(val) => onLose(id, val)}
                onBack={() => onBackStep(id)}
              />
            </div>
          </div>
        )}

        {isOut && (
          <div className="relative flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700">
            <div className="opacity-10 scale-75 md:scale-150">
              <h1 className="text-[5rem] md:text-[11rem] font-black italic uppercase tracking-tighter -rotate-12" style={{ color: isWinner ? '#D4AF37' : '#FFFFFF' }}>
                {isWinner ? 'WINNER' : 'OUT'}
              </h1>
            </div>
            {!isWinner && (
              <p className="absolute inset-0 flex items-center justify-center text-white/40 font-black text-[12px] md:text-[20px] uppercase tracking-[0.4em]">
                Eliminated Turn {player.stats.turnDied}
              </p>
            )}
          </div>
        )}
      </QuadrantWrapper>
    </div>
  );
};

// --- MAIN APP ---
const IS_REAL = new URLSearchParams(window.location.search).get('key') === 'toski';
const submitUrl = IS_REAL 
  ? 'https://edh-backend.onrender.com/submit'
  : 'https://edh-backend.onrender.com/submit-demo';

// --- SETTINGS ROW ---
const SettingsRow = ({ icon, label, value, onClick, disabled, destructive, last }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-4 px-5 py-5 transition-colors ${disabled ? 'opacity-40' : 'active:bg-white/10'} ${!last ? 'mb-3' : ''}`}
    style={{
      background: destructive ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.06)',
      border: destructive ? '1px solid rgba(248,113,113,0.2)' : '1px solid rgba(255,255,255,0.1)',
      borderRadius: 18,
    }}
  >
    <span style={{ width: 26, height: 26, flexShrink: 0, color: destructive ? 'rgba(248,113,113,0.9)' : 'rgba(255,255,255,0.65)' }}>{icon}</span>
    <span className={`flex-1 text-left font-bold text-[16px] ${destructive ? 'text-red-400' : 'text-white'}`}>{label}</span>
    {value && <span className="text-[13px] font-bold text-white/40 uppercase tracking-wide">{value}</span>}
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2.5">
      <path d="M9 6l6 6-6 6" />
    </svg>
  </button>
);

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [turn, setTurn] = useState(1);
  const [playerDataMap, setPlayerDataMap] = useState([]);
  const [pendingGames, setPendingGames] = useState(() => JSON.parse(localStorage.getItem('pending_mtg_games') || '[]'));
  const [pendingEdits, setPendingEdits] = useState(() => JSON.parse(localStorage.getItem('pending_mtg_edits') || '[]'));
  const [isSyncingEdits, setIsSyncingEdits] = useState(false);
  const syncPendingRef = useRef(() => {});
  const syncPendingEditsRef = useRef(() => {});
  const [firstSeatIndex, setFirstSeatIndex] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [mulliganType, setMulliganType] = useState('');
  
  const clockwiseOrder = [0, 1, 3, 2];

  const initialSeats = Array(4).fill(null).map((_, i) => ({ 
    id: i, name: '', deck: '', artUrl: '', artUrlPartner: '', colors: '', deckOwner: '', status: 'active', step: 0, order: '',
    stats: { startLands: 3, lands: 0, rocks: 0, dorks: 0, turnDied: 0, life: 40, cmdDamage: {} } 
  }));
  const [seats, setSeats] = useState(initialSeats);
  const timerRef = useRef(null);

  useEffect(() => {
    const CACHE_VERSION = 'v2_artUrlPartner';
    const cachedVersion = localStorage.getItem('mtg_cache_version');
    
    // Clear stale cache if version doesn't match
    if (cachedVersion !== CACHE_VERSION) {
      localStorage.removeItem('mtg_player_cache');
      localStorage.setItem('mtg_cache_version', CACHE_VERSION);
    }
    
    const cachedData = localStorage.getItem('mtg_player_cache');
    if (cachedData) {
      try {
        setPlayerDataMap(JSON.parse(cachedData));
      } catch (e) {
        console.error("Cache corrupted:", e);
      }
    }

    fetch('https://edh-backend.onrender.com/players')
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d)) return; // backend returned an error object, don't corrupt state
        setPlayerDataMap(d);
        localStorage.setItem('mtg_player_cache', JSON.stringify(d));
      })
      .catch(() => console.log("Offline: Using cached player data"));

    if (pendingGames.length > 0) syncPending();
    if (pendingEdits.length > 0) syncPendingEdits();

    const handleOnline = () => { syncPendingRef.current(); syncPendingEditsRef.current(); };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  useEffect(() => {
    let wakeLock = null;
    let audioContext = null;
    let silentSource = null;

    const startSilentAudio = () => {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
        silentSource = audioContext.createBufferSource();
        silentSource.buffer = buffer;
        silentSource.loop = true;
        silentSource.connect(audioContext.destination);
        silentSource.start();
      } catch (err) {
        console.log('Silent audio failed:', err);
      }
    };

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake lock acquired');
          return;
        } catch (err) {
          console.log('Wake lock failed, using audio fallback');
        }
      }
      startSilentAudio();
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await requestWakeLock();
        if (audioContext?.state === 'suspended') audioContext.resume();
      }
    };

    const handleFirstInteraction = () => {
      requestWakeLock();
      document.removeEventListener('pointerdown', handleFirstInteraction);
    };

    document.addEventListener('pointerdown', handleFirstInteraction);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('pointerdown', handleFirstInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) wakeLock.release();
      if (silentSource) silentSource.stop();
      if (audioContext) audioContext.close();
    };
  }, []);

  const [isSpinning, setIsSpinning] = useState(false);
  const [spinHighlight, setSpinHighlight] = useState(null);
  const [cmdModalSeatId, setCmdModalSeatId] = useState(null);
  const [winnerHighlight, setWinnerHighlight] = useState(null);

  const handleRandom = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    const winner = Math.floor(Math.random() * 4);
    // Spin: start fast, slow down, land on winner
    let step = 0;
    const totalSteps = 16;
    const delays = Array.from({length: totalSteps}, (_, i) => {
      // Start at 60ms, slow to 300ms
      return Math.floor(60 + (240 * (i / totalSteps) ** 2));
    });
    let current = Math.floor(Math.random() * 4);
    const spin = () => {
      setSpinHighlight(current);
      step++;
      if (step < totalSteps) {
        // Last few steps: guide toward winner
        if (step >= totalSteps - 4) {
          current = (winner + (totalSteps - step)) % 4;
        } else {
          current = (current + 1) % 4;
        }
        setTimeout(spin, delays[step]);
      } else {
        // Land on winner - show gold flash
        setSpinHighlight(null);
        setWinnerHighlight(winner);
        setTimeout(() => {
          setIsSpinning(false);
          setWinnerHighlight(null);
          handleSetFirst(winner);
        }, 1500);
      }
    };
    setTimeout(spin, delays[0]);
  };

  const handleResetAll = () => {
    setFirstSeatIndex(null);
    setMulliganType('');
    setSeats(initialSeats);
  };

  const handleSetFirst = (idx) => {
    if (idx === null) { handleResetAll(); return; }
    setFirstSeatIndex(idx);
    setSeats(prev => {
      const ns = [...prev];
      const startPos = clockwiseOrder.indexOf(idx);
      clockwiseOrder.forEach((seatId, i) => { ns[seatId].order = ((i - startPos + 4) % 4) + 1; });
      return ns;
    });
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tableLayout, setTableLayout] = useState(() => localStorage.getItem('mtg_table_layout') || 'grid');
  const [showPlayerEditor, setShowPlayerEditor] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [editingDeck, setEditingDeck] = useState(null); // { isNew, originalDeck, deck, artUrl, artUrlPartner, hasPartner, colors[] }
  const [editorBusy, setEditorBusy] = useState(false);

  const toggleTableLayout = () => {
    setTableLayout(prev => {
      const next = prev === 'grid' ? 'cross' : 'grid';
      localStorage.setItem('mtg_table_layout', next);
      return next;
    });
  };
  const selectTableLayout = (mode) => {
    setTableLayout(mode);
    localStorage.setItem('mtg_table_layout', mode);
  };

  const refetchPlayers = () => {
    fetch('https://edh-backend.onrender.com/players')
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d)) return; // backend returned an error object, don't corrupt state
        setPlayerDataMap(d);
        localStorage.setItem('mtg_player_cache', JSON.stringify(d));
      })
      .catch(() => {});
  };

  // Mirrors what each editor endpoint does server-side, so the UI reflects the
  // change immediately instead of waiting on a round-trip (or being stuck until
  // the connection comes back).
  const applyEditOptimistically = (path, body) => {
    setPlayerDataMap(prev => {
      let next = prev;
      if (path === '/players/add_player') {
        next = [...prev, { player_name: body.player_name, decks: [], pfp: '' }];
      } else if (path === '/players/delete_player') {
        next = prev.filter(p => p.player_name !== body.player_name);
      } else if (path === '/players/add_deck') {
        next = prev.map(p => p.player_name === body.player_name
          ? { ...p, decks: [...(p.decks || []), { deck: body.deck, artUrl: body.art_url, artUrlPartner: body.art_url_partner, colors: body.colors, exclude: !!body.exclude, archidekt: body.archidekt || '' }] }
          : p);
      } else if (path === '/players/update_deck') {
        next = prev.map(p => p.player_name === body.player_name
          ? { ...p, decks: (p.decks || []).map(d => d.deck === body.original_deck
              ? { deck: body.deck, artUrl: body.art_url, artUrlPartner: body.art_url_partner, colors: body.colors, exclude: !!body.exclude, archidekt: body.archidekt || '' }
              : d) }
          : p);
      } else if (path === '/players/delete_deck') {
        next = prev.map(p => p.player_name === body.player_name
          ? { ...p, decks: (p.decks || []).filter(d => d.deck !== body.deck) }
          : p);
      } else if (path === '/players/update_pfp') {
        next = prev.map(p => p.player_name === body.player_name ? { ...p, pfp: body.art_url } : p);
      }
      localStorage.setItem('mtg_player_cache', JSON.stringify(next));
      return next;
    });
  };

  const editorCall = async (path, body) => {
    setEditorBusy(true);
    // Apply locally right away - the UI never waits on the network for this.
    applyEditOptimistically(path, body);
    try {
      const r = await fetch(`https://edh-backend.onrender.com${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error('Request failed');
      refetchPlayers(); // reconcile with the server's canonical state
    } catch (e) {
      // Offline (or the backend is unreachable/cold-starting) - queue it and
      // retry automatically once we're back online, same pattern as game submission.
      setPendingEdits(prev => {
        const next = [...prev, { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, path, body }];
        localStorage.setItem('pending_mtg_edits', JSON.stringify(next));
        return next;
      });
    } finally {
      setEditorBusy(false);
    }
  };

  const syncPendingEdits = async () => {
    if (isSyncingEdits || pendingEdits.length === 0) return;
    setIsSyncingEdits(true);
    const edits = [...pendingEdits];
    let remaining = [...pendingEdits];
    for (const edit of edits) {
      try {
        const r = await fetch(`https://edh-backend.onrender.com${edit.path}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(edit.body)
        });
        if (r.ok) {
          remaining = remaining.filter(e => e.id !== edit.id);
          setPendingEdits([...remaining]);
          localStorage.setItem('pending_mtg_edits', JSON.stringify(remaining));
        } else { break; }
      } catch (e) { break; }
    }
    setIsSyncingEdits(false);
    refetchPlayers(); // pick up the server's canonical state after syncing
  };
  syncPendingEditsRef.current = syncPendingEdits;

  // Layout config: maps visual grid position -> seat index + flip + grid-area name
  const layoutConfig = tableLayout === 'cross'
    ? [
        { seatIndex: 0, area: 'top', flipped: true },
        { seatIndex: 1, area: 'midl', flipped: false },
        { seatIndex: 2, area: 'midr', flipped: false },
        { seatIndex: 3, area: 'bot', flipped: false },
      ]
    : [
        { seatIndex: 0, area: 'tl', flipped: true },
        { seatIndex: 1, area: 'tr', flipped: true },
        { seatIndex: 2, area: 'bl', flipped: false },
        { seatIndex: 3, area: 'br', flipped: false },
      ];
  const gridTemplate = tableLayout === 'cross'
    ? { gridTemplateColumns: '0.85fr 1.3fr 0.85fr', gridTemplateRows: '1fr 1fr', gridTemplateAreas: '"top midl bot" "top midr bot"' }
    : { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gridTemplateAreas: '"tl tr" "bl br"' };

  // Cross layout: outer 90deg app rotation turns a horizontal top/bottom strip into a vertical
  // one, so we counter-rotate the content of those cells back. top/bot need a 90deg swap (so
  // their pre-rotation box is sized using the outer container's vh/vw units, matching the actual
  // fraction of the grid they occupy), midr just needs a straight 180 flip.
  const topBotWidthPct = (0.85 / 3) * 100;
  const crossRotationFix = {
    top: { deg: -90, width: '100svw', height: `${topBotWidthPct}svh` },
    bot: { deg: -90, width: '100svw', height: `${topBotWidthPct}svh` },
    midl: { deg: 180, width: '100%', height: '100%' },
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    // Hold (400ms) = decrement turn
    timerRef.current = setTimeout(() => { 
      setTurn(prev => Math.max(1, prev - 1)); 
      timerRef.current = null; 
    }, 400);
  };

  const handlePointerUp = (e) => {
    e.preventDefault();
    if (timerRef.current) { 
      clearTimeout(timerRef.current); 
      if (gameStarted) setTurn(prev => prev + 1); 
      else if (allFilled) setGameStarted(true);
      timerRef.current = null; 
    }
  };

  const updateSeat = (id, field, value) => {
    setSeats(prev => prev.map((s, idx) => {
      if (idx !== id) return s; // unrelated seats keep the exact same reference
      if (field === 'startLands') return { ...s, stats: { ...s.stats, startLands: value } };
      return { ...s, [field]: value };
    }));
  };

  const handleLifeChange = (id, delta) => {
    setSeats(prev => {
      const ns = [...prev];
      ns[id] = { ...ns[id], stats: { ...ns[id].stats, life: (ns[id].stats.life ?? 40) + delta } };
      return ns;
    });
  };

  const handleCmdDamage = (targetId, sourceId, deltaOrReset) => {
    setSeats(prev => {
      const ns = [...prev];
      const current = ns[targetId].stats.cmdDamage || {};
      const newVal = deltaOrReset === 'reset' ? 0 : Math.max(0, (current[sourceId] || 0) + deltaOrReset);
      ns[targetId] = { ...ns[targetId], stats: { ...ns[targetId].stats, cmdDamage: { ...current, [sourceId]: newVal } } };
      return ns;
    });
  };

  const handleLose = (id, val = null, isWin = false) => {
    const ns = [...seats];
    if (isWin) { 
      ns.forEach((p, idx) => { 
        if (p.status === 'active') { 
          p.status = 'questionnaire'; 
          p.stats.turnDied = (idx === id) ? 'win' : turn; 
        } 
      }); 
    } else {
      const p = ns[id];
      if (p.status === 'active') { p.status = 'questionnaire'; p.stats.turnDied = turn; }
      else { p.stats[['lands', 'rocks', 'dorks'][p.step]] = val; p.step += 1; if (p.step > 2) p.status = 'done'; }
    }
    setSeats(ns);
  };

  const handleBackStep = (id) => {
    const ns = [...seats];
    const p = ns[id];
    if (p.step === 0) { p.status = 'active'; p.stats.turnDied = 0; } else p.step -= 1;
    setSeats(ns);
  };

  const syncPending = async () => {
    if (isSyncing || pendingGames.length === 0) return;
    setIsSyncing(true);
    const games = [...pendingGames];
    let remaining = [...pendingGames];
    for (const g of games) {
      try {
        const r = await fetch(submitUrl, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(g) 
        });
        let body = null;
        try { body = await r.json(); } catch (e) { body = null; }
        // Trust the response body, not just r.ok - a 2xx status alone doesn't prove this
        // reached our Flask app (e.g. Render's cold-start loading page, or a flaky network
        // intermediary, can return 2xx without the game ever being written to the sheet).
        if (r.ok && body && body.status === 'success' && body.game_id) {
          remaining = remaining.filter(pg => pg.timestamp !== g.timestamp);
          setPendingGames([...remaining]);
          localStorage.setItem('pending_mtg_games', JSON.stringify(remaining));
        } else { break; }
      } catch (e) { break; }
    }
    setIsSyncing(false);
  };
  syncPendingRef.current = syncPending;

  const submitGame = () => {
    const gameData = {
      timestamp: new Date().toISOString(),
      turn,
      mulligan_type: mulliganType,
      players: seats.map(s => ({ 
        player: s.name, 
        deck: s.deck, 
        turn_died: s.stats.turnDied, 
        stats: s.stats, 
        colors: s.colors, 
        deck_owner: s.deckOwner || s.name, 
        seat_position: s.order,
        art_url: s.artUrl || ''
      }))
    };

    // Always save locally first
    const updated = [...pendingGames, gameData];
    setPendingGames(updated);
    localStorage.setItem('pending_mtg_games', JSON.stringify(updated));

    // Move on immediately - no waiting
    setGameStarted(false); 
    setTurn(1); 
    setSeats(initialSeats); 
    setFirstSeatIndex(null); 
    setMulliganType('');

    // Try to sync in the background
    setTimeout(() => syncPending(), 500);
  };
  
  const allFilled = seats.every(s => s.name !== '' && s.deck !== '') && mulliganType !== '';
  const allFinished = seats.every(s => s.status === 'done');
  const hasPending = pendingGames.length > 0;

  return (
    <div className="min-h-screen w-screen bg-black overflow-hidden">
      <div
        style={{
          width: '100vh',
          height: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'rotate(90deg)',
          transformOrigin: 'center center',
          position: 'fixed',
          top: '50%',
          left: '50%',
          translate: '-50% -50%',
          touchAction: 'pan-y',
        }}
      >
        {/* Top-level small-screen commander damage modal - rendered here as a sibling of the seat
            grid, i.e. inside the single base 90deg rotation only, never nested inside cross-layout's
            extra per-seat counter-rotation wrapper - so it naturally covers the whole rotated app
            area without fighting a nested transform's containing block. */}
        {cmdModalSeatId !== null && (
          <SmallScreenCmdModal
            seatId={cmdModalSeatId}
            seats={seats}
            tableLayout={tableLayout}
            onCmdDamage={handleCmdDamage}
            onLifeChange={handleLifeChange}
            onClose={() => setCmdModalSeatId(null)}
          />
        )}
        <div
          className="grid gap-0"
          style={{ width: '100%', height: '100%', ...gridTemplate }}
        >
          {layoutConfig.map((cfg) => {
            const i = cfg.seatIndex;
            const s = seats[i];
            const fix = tableLayout === 'cross' ? crossRotationFix[cfg.area] : null;
            const content = !gameStarted ?
              <SetupQuadrant
                id={i} seat={s} isFlipped={cfg.flipped}
                axisSwapped={!!(fix && fix.deg !== 180)}
                playerDataMap={playerDataMap} onUpdate={updateSeat}
                onSetFirst={handleSetFirst} firstSeatIndex={firstSeatIndex}
                onResetAll={handleResetAll}
                mulliganType={mulliganType} onSetMulligan={setMulliganType}
              /> :
              <Quadrant id={i} seatIndex={i} player={s} isFlipped={cfg.flipped} tableLayout={tableLayout} onLose={handleLose} onBackStep={handleBackStep} onLifeChange={handleLifeChange} onCmdDamage={handleCmdDamage} onOpenCmdModal={setCmdModalSeatId} opponents={seats.map((seat, idx) => ({ id: idx, name: seat.name, artUrl: seat.artUrl, artUrlPartner: seat.artUrlPartner }))} />;
            return (
              <div key={i} className="w-full h-full flex items-center justify-center overflow-hidden" style={{ gridArea: cfg.area, position: 'relative' }}>
                {fix ? (
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: fix.width, height: fix.height,
                    transform: `translate(-50%, -50%) rotate(${fix.deg}deg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {content}
                  </div>
                ) : content}
              </div>
            );
          })}
        </div>

        {/* Spin highlight grid - matches active layout via shared grid template */}
        {spinHighlight !== null && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', pointerEvents: 'none', zIndex: 9999, ...gridTemplate }}>
            {layoutConfig.map(cfg => (
              <div key={cfg.seatIndex} style={{
                gridArea: cfg.area,
                margin: '10px',
                borderRadius: '1.5rem',
                border: spinHighlight === cfg.seatIndex ? '4px solid rgba(255,255,255,0.95)' : '4px solid transparent',
                backgroundColor: spinHighlight === cfg.seatIndex ? 'rgba(255,255,255,0.18)' : 'transparent',
                boxShadow: spinHighlight === cfg.seatIndex ? '0 0 60px rgba(255,255,255,0.6)' : 'none',
                transition: 'border-color 0.04s, background-color 0.04s, box-shadow 0.04s',
              }} />
            ))}
          </div>
        )}

        {/* Gold winner flash grid */}
        {winnerHighlight !== null && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', pointerEvents: 'none', zIndex: 9999, ...gridTemplate }}>
            {layoutConfig.map(cfg => (
              <div key={cfg.seatIndex} style={{
                gridArea: cfg.area,
                margin: '10px',
                borderRadius: '1.5rem',
                border: winnerHighlight === cfg.seatIndex ? '5px solid rgba(212,175,55,1)' : '4px solid transparent',
                backgroundColor: winnerHighlight === cfg.seatIndex ? 'rgba(212,175,55,0.25)' : 'transparent',
                boxShadow: winnerHighlight === cfg.seatIndex ? '0 0 80px rgba(212,175,55,0.8)' : 'none',
              }} />
            ))}
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[10000]">
          {/* Settings gear icon - always visible, offset near center */}
          {!showResetConfirm && !showSettings && (
            <button
              onClick={() => setShowSettings(true)}
              className="pointer-events-auto flex items-center justify-center rounded-full"
              style={{
                position: 'absolute', width: 34, height: 34,
                top: 'calc(50% - 17px)', left: tableLayout === 'cross' ? 'calc(50% + 30px)' : 'calc(50% + 95px)',
                backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                zIndex: 15000,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}

          {!gameStarted && !showSettings && !showResetConfirm && (
            <>
              {/* RANDOM button - always available before goes-first is picked, regardless of pending syncs */}
              {firstSeatIndex === null && !allFilled && (
                <button
                  onClick={handleRandom}
                  disabled={isSpinning}
                  className="pointer-events-auto font-black rounded-full flex items-center justify-center text-center bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                  style={{ width: tableLayout === 'cross' ? '90px' : '120px', height: tableLayout === 'cross' ? '90px' : '120px', transform: tableLayout === 'cross' ? 'translateX(128px)' : 'none' }}
                >
                  <span className="text-xs font-bold">{isSpinning ? '...' : 'RANDOM'}</span>
                </button>
              )}
              {/* START button */}
              {allFilled && (
                <button
                  onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}
                  className="pointer-events-auto font-black rounded-full transition-all flex items-center justify-center text-center p-4 bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                  style={{ width: tableLayout === 'cross' ? '90px' : '120px', height: tableLayout === 'cross' ? '90px' : '120px', transform: tableLayout === 'cross' ? 'translateX(128px)' : 'none' }}
                >
                  <span className="text-xs font-bold">START</span>
                </button>
              )}
            </>
          )}
          {gameStarted && !allFinished && !showSettings && !showResetConfirm && (
            <button
              onPointerDown={handlePointerDown} 
              onPointerUp={handlePointerUp}
              className="pointer-events-auto rounded-full flex flex-col items-center justify-center border-none outline-none select-none"
              style={{ 
                width: tableLayout === 'cross' ? '130px' : '180px', 
                height: tableLayout === 'cross' ? '130px' : '180px', 
                backgroundColor: '#000000',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none',
                transform: tableLayout === 'cross' ? 'translateX(128px)' : 'none',
              }}
            >
              <span className="font-black text-white/50 uppercase tracking-[0.3em] select-none" style={{ fontSize: tableLayout === 'cross' ? '8px' : '12px' }}>Turn</span>
              <span 
                className="font-black tabular-nums text-white select-none" 
                style={{ fontSize: tableLayout === 'cross' ? '70px' : '100px', lineHeight: 0.9, userSelect: 'none', WebkitUserSelect: 'none' }}
              >
                {turn}
              </span>
            </button>
          )}
          {gameStarted && allFinished && !showSettings && !showResetConfirm && (
            <button
              onClick={submitGame}
              className="pointer-events-auto font-black rounded-full bg-[#D4AF37] text-black shadow-[0_0_40px_rgba(212,175,55,0.5)] p-4"
              style={{ width: tableLayout === 'cross' ? '90px' : '150px', height: tableLayout === 'cross' ? '90px' : '150px', transform: tableLayout === 'cross' ? 'translateX(128px)' : 'none' }}
            >
              SUBMIT
            </button>
          )}
        </div>

        {/* Giant invisible full-screen close catcher - sits above everything else in the app,
            definitively topmost regardless of any nested stacking-context ambiguity. Only active
            (and only visible as a dim/blur backdrop) while a modal is open. The modals themselves
            are rendered right after it so they draw on top and remain fully interactive. */}
        {(showSettings || showPlayerEditor || showResetConfirm) && (
          <div
            style={{ position: 'absolute', inset: 0, zIndex: 600000, pointerEvents: 'auto' }}
            onPointerDown={(e) => {
              if (showResetConfirm) { setShowResetConfirm(false); return; }
              if (showSettings || showPlayerEditor) { setShowSettings(false); setShowPlayerEditor(false); setExpandedPlayer(null); }
            }}
          >
            {showResetConfirm && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
            )}
            {(showSettings || showPlayerEditor) && !showResetConfirm && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} />
            )}
          </div>
        )}

          {/* Reset confirm modal */}
          {showResetConfirm && (
            <div className="pointer-events-auto flex flex-col items-center gap-4" style={{ backgroundColor: 'rgba(18,18,20,0.98)', borderRadius: 28, border: '1px solid rgba(255,255,255,0.1)', padding: '32px 28px', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-90deg)', zIndex: 621000, boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }} onPointerDown={(e) => e.stopPropagation()}>
              <span className="text-white font-black text-sm uppercase tracking-widest">Reset Game?</span>
              <span className="text-white/50 font-bold text-xs uppercase tracking-wider text-center">Returns to "Who Goes First?"</span>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="font-black uppercase text-xs text-white/60 px-6 py-3 rounded-full border border-white/15 bg-white/5"
                >Cancel</button>
                <button
                  onClick={() => { setShowResetConfirm(false); setShowSettings(false); setGameStarted(false); setTurn(1); setSeats(initialSeats); setFirstSeatIndex(null); setMulliganType(''); }}
                  className="font-black uppercase text-xs text-black px-6 py-3 rounded-full bg-white"
                >Reset</button>
              </div>
            </div>
          )}

          {/* Settings modal - large, Lifetap-style panel, always upright regardless of table layout */}
          {showSettings && !showResetConfirm && !showPlayerEditor && (
            <div
              className="pointer-events-auto flex flex-col overflow-hidden"
              style={{ backgroundColor: 'rgba(10,10,12,0.98)', borderRadius: 28, border: '1px solid rgba(255,255,255,0.1)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-90deg)', zIndex: 620000, width: '82vw', height: '68vh', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 pt-7 pb-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.08)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <span className="text-white font-black text-base uppercase tracking-[0.15em]">Settings</span>
                <div style={{ width: 34 }} />
              </div>

              <div className="overflow-y-auto flex flex-col items-center" style={{ flex: 1 }}>
                <div style={{ width: '100%', maxWidth: 420 }}>
                <div className="pt-6">
                  <SettingsRow
                    label={(isSyncing || isSyncingEdits) ? 'Syncing...' : (hasPending || pendingEdits.length > 0) ? 'Sync Pending Changes' : 'All Changes Synced'}
                    value={(hasPending || pendingEdits.length > 0) ? String(pendingGames.length + pendingEdits.length) : null}
                    disabled={(!hasPending && pendingEdits.length === 0) || isSyncing || isSyncingEdits}
                    onClick={() => { syncPending(); syncPendingEdits(); }}
                    icon={
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 2v6h-6M3 22v-6h6M3.51 9a9 9 0 0114.85-3.36L21 8M3 16l2.64 2.36A9 9 0 0020.49 15" />
                      </svg>
                    }
                  />
                  <div className="w-full flex items-center gap-4 px-5 py-5 mb-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18 }}>
                    <span style={{ width: 26, height: 26, flexShrink: 0, color: 'rgba(255,255,255,0.65)' }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                      </svg>
                    </span>
                    <span className="flex-1 text-left font-bold text-[16px] text-white" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Table Layout</span>
                    <div className="flex gap-2" style={{ flexShrink: 0 }}>
                      <button
                        onClick={() => selectTableLayout('grid')}
                        style={{
                          width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: tableLayout === 'grid' ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.06)',
                          border: tableLayout === 'grid' ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.15)',
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tableLayout === 'grid' ? '#38bdf8' : 'rgba(255,255,255,0.6)'} strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                      </button>
                      <button
                        onClick={() => selectTableLayout('cross')}
                        style={{
                          width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: tableLayout === 'cross' ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.06)',
                          border: tableLayout === 'cross' ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.15)',
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={tableLayout === 'cross' ? '#38bdf8' : 'rgba(255,255,255,0.6)'} stroke="none">
                          <rect x="2" y="1" width="20" height="6" rx="1.5" />
                          <rect x="2" y="9" width="9" height="9" rx="1.5" />
                          <rect x="13" y="9" width="9" height="9" rx="1.5" />
                          <rect x="2" y="19" width="20" height="4" rx="1.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {!gameStarted && (
                    <SettingsRow
                      label="Manage Players"
                      onClick={() => setShowPlayerEditor(true)}
                      icon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                        </svg>
                      }
                      last
                    />
                  )}
                </div>

                <div>
                  <SettingsRow
                    label="Reset Game"
                    destructive
                    onClick={() => setShowResetConfirm(true)}
                    icon={
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                      </svg>
                    }
                    last
                  />
                </div>

                <div className="pb-6">
                  <SettingsRow
                    label="Table Stats"
                    onClick={() => window.open('/stats/index.html', '_blank', 'noopener,noreferrer')}
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
                      </svg>
                    }
                    last
                  />
                </div>
                </div>
              </div>
            </div>
          )}

          {/* Player / Deck editor - drill-down: list view -> player detail view */}
          {showPlayerEditor && (() => {
            const detailPlayer = playerDataMap.find(p => p.player_name === expandedPlayer);
            return (
              <div
                className="pointer-events-auto flex flex-col items-stretch overflow-hidden"
                style={{ backgroundColor: 'rgba(10,10,12,0.98)', borderRadius: 28, border: '1px solid rgba(255,255,255,0.1)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-90deg)', zIndex: 620000, width: '82vw', height: '68vh', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {/* Header - swaps between "Players" list header and player-name detail header */}
                <div className="flex items-center justify-between px-8 pt-7 pb-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    onClick={() => editingDeck ? setEditingDeck(null) : detailPlayer ? setExpandedPlayer(null) : setShowPlayerEditor(false)}
                    className="flex items-center justify-center rounded-full"
                    style={{ width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                  <span className="text-white font-black text-base uppercase tracking-[0.15em]">{detailPlayer ? detailPlayer.player_name : 'Players'}</span>
                  <button
                    onClick={() => { setShowPlayerEditor(false); setExpandedPlayer(null); setShowSettings(false); }}
                    className="flex items-center justify-center rounded-full"
                    style={{ width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="overflow-y-auto flex flex-col items-center" style={{ flex: 1 }}>
                  <div className="px-6 py-6 flex flex-col" style={{ width: '100%', maxWidth: 420 }}>

                    {editingDeck ? (
                      <>
                        {/* DECK EDIT FORM */}
                        <div className="flex items-center gap-3 mb-5">
                          <button
                            onClick={() => setEditingDeck(null)}
                            style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                          </button>
                          <span className="text-white font-black text-sm uppercase tracking-wide">{editingDeck.isNew ? 'New Deck' : 'Edit Deck'}</span>
                        </div>

                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide mb-1">Deck Name</span>
                        <input
                          type="text"
                          value={editingDeck.deck}
                          onChange={(e) => setEditingDeck(prev => ({ ...prev, deck: e.target.value }))}
                          placeholder="e.g. Aragorn, Uniter"
                          className="w-full text-white font-bold text-sm rounded-xl px-4 py-3 mb-4"
                          style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', outline: 'none' }}
                        />

                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide mb-1">Art URL</span>
                        <input
                          type="text"
                          value={editingDeck.artUrl}
                          onChange={(e) => setEditingDeck(prev => ({ ...prev, artUrl: e.target.value }))}
                          placeholder="https://..."
                          className="w-full text-white font-bold text-sm rounded-xl px-4 py-3 mb-1"
                          style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', outline: 'none' }}
                        />
                        <span className="text-[9px] font-semibold text-white/30 mb-4">Tip: use Scryfall's "Download Art Crop" link</span>

                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide mb-1">Archidekt Link</span>
                        <input
                          type="text"
                          value={editingDeck.archidekt || ''}
                          onChange={(e) => setEditingDeck(prev => ({ ...prev, archidekt: e.target.value }))}
                          placeholder="https://archidekt.com/decks/..."
                          className="w-full text-white font-bold text-sm rounded-xl px-4 py-3 mb-4"
                          style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', outline: 'none' }}
                        />

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide">Exclude from Setup</span>
                            <span className="text-[9px] font-semibold text-white/25">Hides this deck from the game setup screen</span>
                          </div>
                          <button
                            onClick={() => setEditingDeck(prev => ({ ...prev, exclude: !prev.exclude }))}
                            style={{
                              flexShrink: 0, width: 46, height: 26, borderRadius: 999, position: 'relative',
                              backgroundColor: editingDeck.exclude ? '#ef4444' : 'rgba(255,255,255,0.12)',
                              transition: 'background-color 0.15s',
                            }}
                          >
                            <div style={{
                              position: 'absolute', top: 3, left: editingDeck.exclude ? 23 : 3,
                              width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff',
                              transition: 'left 0.15s',
                            }} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide">Partner Commander</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingDeck(prev => ({ ...prev, hasPartner: false, artUrlPartner: '' }))}
                              style={{
                                padding: '4px 14px', borderRadius: 999, fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                                backgroundColor: !editingDeck.hasPartner ? '#fff' : 'rgba(255,255,255,0.08)',
                                color: !editingDeck.hasPartner ? '#000' : 'rgba(255,255,255,0.5)',
                              }}
                            >No</button>
                            <button
                              onClick={() => setEditingDeck(prev => ({ ...prev, hasPartner: true }))}
                              style={{
                                padding: '4px 14px', borderRadius: 999, fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                                backgroundColor: editingDeck.hasPartner ? '#fff' : 'rgba(255,255,255,0.08)',
                                color: editingDeck.hasPartner ? '#000' : 'rgba(255,255,255,0.5)',
                              }}
                            >Yes</button>
                          </div>
                        </div>
                        {editingDeck.hasPartner && (
                          <input
                            type="text"
                            value={editingDeck.artUrlPartner}
                            onChange={(e) => setEditingDeck(prev => ({ ...prev, artUrlPartner: e.target.value }))}
                            placeholder="Partner art URL..."
                            className="w-full text-white font-bold text-sm rounded-xl px-4 py-3 mb-4 mt-2"
                            style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', outline: 'none' }}
                          />
                        )}
                        {!editingDeck.hasPartner && <div className="mb-4" />}

                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide mb-3 self-center">Colors</span>
                        <div className="mb-6 self-center">
                          <ColorPicker
                            selected={editingDeck.colors}
                            onToggle={(c) => setEditingDeck(prev => ({
                              ...prev,
                              colors: prev.colors.includes(c) ? prev.colors.filter(x => x !== c) : [...prev.colors, c],
                            }))}
                          />
                        </div>

                        <button
                          disabled={editorBusy || !editingDeck.deck.trim()}
                          onClick={() => {
                            const payload = {
                              player_name: detailPlayer.player_name,
                              deck: editingDeck.deck.trim(),
                              art_url: editingDeck.artUrl.trim(),
                              art_url_partner: editingDeck.hasPartner ? (editingDeck.artUrlPartner.trim() || 'partner') : '',
                              colors: editingDeck.colors.join(''),
                              exclude: !!editingDeck.exclude,
                              archidekt: (editingDeck.archidekt || '').trim(),
                            };
                            if (editingDeck.isNew) {
                              editorCall('/players/add_deck', payload);
                            } else {
                              editorCall('/players/update_deck', { ...payload, original_deck: editingDeck.originalDeck });
                            }
                            setEditingDeck(null);
                          }}
                          className="font-black uppercase text-sm text-black px-6 py-3.5 rounded-full bg-white self-center"
                          style={{ opacity: (!editingDeck.deck.trim()) ? 0.4 : 1 }}
                        >Save Deck</button>
                      </>
                    ) : !detailPlayer ? (
                      <>
                        {/* LIST VIEW */}
                        <button
                          disabled={editorBusy}
                          onClick={() => {
                            const name = prompt("New Player Name:");
                            if (!name) return;
                            editorCall('/players/add_player', { player_name: name });
                          }}
                          className="font-black uppercase text-[13px] text-black px-6 py-3 rounded-full bg-white self-start mb-4"
                        >+ Add Player</button>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                          {playerDataMap.map((p) => (
                            <button
                              key={p.player_name}
                              onClick={() => setExpandedPlayer(p.player_name)}
                              className="flex flex-col items-center gap-2"
                              style={{ background: 'transparent', border: 'none' }}
                            >
                              <div style={{
                                width: '100%', aspectRatio: '1 / 1', borderRadius: 18, flexShrink: 0, overflow: 'hidden',
                                backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                                backgroundImage: p.pfp ? `url(${p.pfp})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                {!p.pfp && <span className="text-white/30 text-xl font-black">{p.player_name?.[0]?.toUpperCase()}</span>}
                              </div>
                              <span className="text-white font-black text-[12px] uppercase text-center leading-tight">{p.player_name}</span>
                              <span className="text-white/30 text-[10px] font-bold">{(p.decks || []).length} deck{(p.decks || []).length === 1 ? '' : 's'}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* DETAIL VIEW */}
                        <button
                          disabled={editorBusy}
                          onClick={() => {
                            const url = prompt("Profile Picture URL (tip: use Scryfall's Download Art Crop link):", detailPlayer.pfp || '');
                            if (url === null) return;
                            editorCall('/players/update_pfp', { player_name: detailPlayer.player_name, art_url: url });
                          }}
                          className="flex flex-col items-center gap-2 self-center mb-6"
                          style={{ background: 'transparent', border: 'none' }}
                        >
                          <div style={{
                            width: 84, height: 84, borderRadius: '50%', overflow: 'hidden',
                            backgroundColor: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)',
                            backgroundImage: detailPlayer.pfp ? `url(${detailPlayer.pfp})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {!detailPlayer.pfp && <span className="text-white/30 text-2xl font-black">{detailPlayer.player_name?.[0]?.toUpperCase()}</span>}
                          </div>
                          <span className="text-[11px] font-bold text-white/40 uppercase tracking-wide">Edit Photo</span>
                        </button>

                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-white/35 font-black text-[11px] uppercase tracking-[0.25em] whitespace-nowrap">
                            Decks ({(detailPlayer.decks || []).length})
                          </span>
                          <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                          {(detailPlayer.decks || []).map(d => (
                            <div
                              key={d.deck}
                              onClick={() => { if (d.archidekt) window.open(d.archidekt, '_blank', 'noopener,noreferrer'); }}
                              style={{
                                position: 'relative', borderRadius: 16, overflow: 'hidden', aspectRatio: '1 / 0.85',
                                border: '1px solid rgba(255,255,255,0.12)',
                                cursor: d.archidekt ? 'pointer' : 'default',
                              }}>
                              {/* Art layer - only this gets dimmed/grayscaled, so buttons below stay full brightness */}
                              <div style={{
                                position: 'absolute', inset: 0,
                                backgroundImage: d.artUrl ? `url(${d.artUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
                                backgroundColor: d.artUrl ? 'transparent' : 'rgba(255,255,255,0.06)',
                                filter: d.exclude ? 'grayscale(1) brightness(0.45)' : 'none',
                              }} />
                              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }} />
                              {d.exclude && (
                                <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                  </svg>
                                </div>
                              )}
                              <span style={{ position: 'absolute', top: 8, left: 10, right: d.exclude ? 34 : 10, color: '#fff', fontSize: 12, fontWeight: 900, textShadow: '0 1px 4px rgba(0,0,0,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.deck}</span>
                              <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, display: 'flex', gap: 6 }}>
                                <button
                                  disabled={editorBusy}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingDeck({
                                      isNew: false, originalDeck: d.deck, deck: d.deck,
                                      artUrl: d.artUrl || '',
                                      hasPartner: !!(d.artUrlPartner && d.artUrlPartner !== ''),
                                      artUrlPartner: (d.artUrlPartner && d.artUrlPartner !== 'partner') ? d.artUrlPartner : '',
                                      colors: (d.colors || '').split('').filter(Boolean),
                                      exclude: !!d.exclude,
                                      archidekt: d.archidekt || '',
                                    });
                                  }}
                                  style={{ flex: 1, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff', padding: '5px 0', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(4px)' }}
                                >Edit</button>
                                <button
                                  disabled={editorBusy}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!confirm(`Delete deck "${d.deck}"?`)) return;
                                    editorCall('/players/delete_deck', { player_name: detailPlayer.player_name, deck: d.deck });
                                  }}
                                  style={{ flex: 1, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fca5a5', padding: '5px 0', borderRadius: 999, backgroundColor: 'rgba(220,38,38,0.35)', backdropFilter: 'blur(4px)' }}
                                >Del</button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          disabled={editorBusy}
                          onClick={() => setEditingDeck({ isNew: true, deck: '', artUrl: '', hasPartner: false, artUrlPartner: '', colors: [], exclude: false, archidekt: '' })}
                          className="text-[13px] font-black uppercase text-white px-6 py-3 rounded-full bg-white/10 border border-white/15 self-center mt-5"
                        >+ Add Deck</button>

                        <button
                          disabled={editorBusy}
                          onClick={() => {
                            if (!confirm(`Delete player "${detailPlayer.player_name}" and all their decks?`)) return;
                            editorCall('/players/delete_player', { player_name: detailPlayer.player_name });
                            setExpandedPlayer(null);
                          }}
                          className="text-[13px] font-black uppercase text-red-400 px-6 py-3 rounded-full bg-red-500/10 self-center mt-3 mb-2"
                        >Delete Player</button>
                      </>
                    )}

                  </div>
                </div>
              </div>
            );
          })()}

      </div>
    </div>
  );
}
