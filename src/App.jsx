import React, { useState, useEffect, useRef } from 'react';

// --- STYLING CONSTANTS ---
const textShadowStyle = { 
  textShadow: '0px 2px 10px rgba(0,0,0,0.9), 0px 0px 20px rgba(0,0,0,0.5)' 
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
const SelectionCarousel = ({ options = [], onSelect, onBack, title, showBack = true, isFlipped, buttonColor }) => {
  const scrollRef = useRef(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const didScroll = useRef(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const mountTime = useRef(Date.now());
  const handledTouch = useRef(false);

  useEffect(() => {
    mountTime.current = Date.now();
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [options]);

  const handleMouseDown = (e) => {
    setIsDown(true);
    setStartX(e.pageX - e.currentTarget.offsetLeft);
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - e.currentTarget.offsetLeft;
    const walk = (x - startX) * (isFlipped ? -2 : 2);
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollLeft - walk;
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
    <div className="w-full max-w-[90%] md:max-w-[450px] flex flex-col items-center animate-in fade-in zoom-in duration-500 z-10 mx-auto">
      {title && (
        <p className="font-black text-[10px] md:text-[14px] uppercase tracking-[0.4em] md:tracking-[0.6em] mb-4 md:mb-8 text-white/60 drop-shadow-md">
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
        className="flex overflow-x-auto flex-nowrap gap-4 md:gap-6 py-4 no-scrollbar px-6 md:px-12 snap-x snap-mandatory w-full cursor-grab"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
      >
        {options.map((opt, i) => {
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
  className={`relative shrink-0 w-[140px] md:w-[180px] h-[80px] md:h-[100px] border border-white/20 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center px-4 snap-center transition-all shadow-xl overflow-hidden active:scale-90 active:opacity-70 ${buttonColor ? '' : 'bg-white/10 backdrop-blur-md'}`}
  style={buttonColor ? { backgroundColor: buttonColor } : {}}
>
              {hasArt && (
                <>
                  <img src={opt.artUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-black/30" />
                </>
              )}
              <span className="relative z-10 text-lg md:text-2xl font-black uppercase tracking-tight text-white text-center drop-shadow-lg line-clamp-2 leading-tight">
                {label}
              </span>
            </button>
          );
        })}
      </div>
      {showBack && (
        <button onClick={onBack} className="mt-4 md:mt-8 px-6 md:px-8 py-2 md:py-3 bg-white/10 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-colors backdrop-blur-sm">
          ← Back
        </button>
      )}
    </div>
  );
};

// --- QUADRANT WRAPPER ---
const QuadrantWrapper = ({ children, isFlipped, isOut, artUrl, artUrlPartner, isWinner }) => {
  const hasArt = !!artUrl && typeof artUrl === 'string' && artUrl.startsWith('http');
  const hasPartner = !!artUrlPartner && typeof artUrlPartner === 'string' && artUrlPartner.startsWith('http');
  
  const bgStyle = hasArt && !isOut ? {
    backgroundImage: `url(${artUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};
  
  return (
    <div 
      className={`
        relative h-[calc(100%-20px)] md:h-[calc(100%-50px)] w-[calc(100%-20px)] md:w-[calc(100%-50px)] 
        rounded-[1.5rem] md:rounded-[3.5rem] transition-all duration-700
        flex flex-col items-center justify-center overflow-hidden
        ${isFlipped ? 'rotate-180' : ''}
        ${isOut ? (isWinner ? 'bg-[#0a0a0a]' : 'bg-[#050505]') : (!hasArt ? 'bg-gradient-to-br from-[#b8cedc] via-[#a3b8c9] to-[#8da3b5]' : '')}
      `}
      style={bgStyle}
    >
      {/* Partner commander — clips to show on correct visual side accounting for isFlipped */}
      {hasArt && hasPartner && !isOut && (
        <div className="absolute inset-0" style={{
          backgroundImage: `url(${artUrlPartner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          clipPath: isFlipped ? 'inset(0 0 50% 0)' : 'inset(50% 0 0 0)',
        }} />
      )}
      {hasArt && !isOut && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[0.5px] bg-[radial-gradient(circle,_transparent_20%,_rgba(0,0,0,0.5)_100%)]" />
      )}
      <div className="relative z-10 w-full h-full flex flex-col items-stretch justify-center p-2">
        {children}
      </div>
    </div>
  );
};

// --- SETUP QUADRANT ---
const SetupQuadrant = ({ id, seat, isFlipped, playerDataMap, onUpdate, onSetFirst, firstSeatIndex, onResetAll, mulliganType, onSetMulligan }) => {
  const [step, setStep] = useState(0); 
  const [tempColors, setTempColors] = useState([]);
  
  const playerOptions = playerDataMap.map(p => ({
    name: p.player_name,
    artUrl: p.pfp
  }));
  const players = [...playerOptions, "+ GUEST"];

  const playerEntry = playerDataMap.find(p => p.player_name === seat.name) || { decks: [], pfp: '' };
  const rawDecks = playerEntry.decks || [];
  const decks = [...rawDecks, { deck: "+ OTHER" }, { deck: "* BORROWED" }];
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
    } else if (step === 3 || step === 4 || step === 5 || step === 6) {
      onUpdate(id, 'artUrl', '');
      onUpdate(id, 'colors', '');
      if (step === 6) {
        onUpdate(id, 'deckOwner', '');
        setStep(1);
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
              <div className="w-16 h-16 md:w-24 md:h-24 bg-black rounded-full flex items-center justify-center shadow-lg px-2">
                <span className="text-white font-black text-[10px] md:text-sm uppercase text-center leading-tight">Goes First</span>
              </div>
            </button>
          </div>
        )}

        {step >= 1 && !mulliganType && (
          seat.order === 4 ? (
            <SelectionCarousel 
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
          <SelectionCarousel 
            title={`Seat ${seat.order}`} 
            isFlipped={isFlipped} 
            options={players} 
            onBack={handleBack} 
            onSelect={(val) => { 
              if (typeof val === 'object' && val !== null) {
                onUpdate(id, 'name', val.name); 
                onUpdate(id, 'pfpUrl', val.artUrl); 
              } else {
                onUpdate(id, 'name', prompt("Enter Guest Name:") || "Guest");
                onUpdate(id, 'pfpUrl', '');
              }
              setStep(2); 
            }} 
          />
        )}
        
        {step === 2 && (
          <SelectionCarousel 
            title="Deck" 
            isFlipped={isFlipped} 
            options={decks} 
            onBack={handleBack} 
            onSelect={(val) => { 
              if (val.deck === "+ OTHER") { 
                onUpdate(id, 'deck', prompt("Deck Name:") || "Other"); setStep(4); 
              } else if (val.deck === "* BORROWED") { 
                setStep(5); 
              } else { 
                onUpdate(id, 'deck', val.deck); 
                onUpdate(id, 'artUrl', val.artUrl); 
                onUpdate(id, 'artUrlPartner', val.artUrlPartner || '');
                onUpdate(id, 'colors', val.colors || ''); 
                setStep(3); 
              }
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
              <button onClick={handleBack} className="flex-1 py-4 bg-white/5 text-white/40 rounded-full font-black uppercase tracking-widest text-[9px] border border-white/10 active:scale-95 transition-all">← Back</button>
              <button onClick={() => { onUpdate(id, 'colors', tempColors.join('')); setStep(3); }} className="flex-[2] py-4 bg-white text-black rounded-full font-black uppercase tracking-widest text-[10px] md:text-xs active:scale-95 transition-all shadow-2xl">Confirm</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <SelectionCarousel 
            title="Borrow From?" 
            isFlipped={isFlipped} 
            options={playerDataMap
              .filter(p => p.player_name !== seat.name)
              .map(p => ({ name: p.player_name, artUrl: p.pfp }))
            }
            onBack={handleBack} 
            onSelect={(val) => { 
              onUpdate(id, 'deckOwner', typeof val === 'object' ? val.name : val); 
              setStep(6); 
            }} 
          />
        )}
        {step === 6 && (
          <SelectionCarousel 
            title={`${seat.deckOwner}'s Decks`} 
            isFlipped={isFlipped} 
            options={(playerDataMap.find(p => p.player_name === seat.deckOwner)?.decks) || []}
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
          <SelectionCarousel 
            title="Starting Lands" 
            isFlipped={isFlipped} 
            options={[0, 1, 2, 3, 4, 5, 6, 7]} 
            onBack={handleBack} 
            onSelect={(val) => { onUpdate(id, 'startLands', val); setStep(7); }} 
          />
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

// --- CMD DAMAGE CELL ---
const CmdCell = ({ value, value2, hasPartner, danger, danger2, isSelf, artUrl, artUrlPartner, onChange, onChange2, held, onHold }) => {
  const [activeHalf, setActiveHalf] = useState(null);
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
  const stopTap = () => {
    clearTimeout(tapTimer.current);
    clearInterval(tapRepeat.current);
    tapTimer.current = null;
    tapRepeat.current = null;
    setActiveHalf(null);
  };

  const tapZones = (fn) => (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 10 }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: 8, backgroundColor: activeHalf === 'left' ? 'rgba(220,50,50,0.3)' : 'transparent', transition: 'background-color 0.08s' }}
        onPointerDown={(e) => { e.stopPropagation(); setActiveHalf('left'); startTap(fn, -1); }}
        onPointerUp={(e) => { e.stopPropagation(); stopTap(); }}
        onPointerLeave={stopTap} onPointerCancel={stopTap}
      >
        <span style={{ fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,0.8)', userSelect: 'none', pointerEvents: 'none', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>-</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, backgroundColor: activeHalf === 'right' ? 'rgba(50,200,100,0.3)' : 'transparent', transition: 'background-color 0.08s' }}
        onPointerDown={(e) => { e.stopPropagation(); setActiveHalf('right'); startTap(fn, 1); }}
        onPointerUp={(e) => { e.stopPropagation(); stopTap(); }}
        onPointerLeave={stopTap} onPointerCancel={stopTap}
      >
        <span style={{ fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,0.8)', userSelect: 'none', pointerEvents: 'none', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>+</span>
      </div>
    </div>
  );

  const subCell = (art, val, isDanger, isSelfCell, onTap) => (
    <div
      style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        backgroundImage: art ? `url(${art})` : 'none',
        backgroundSize: 'cover', backgroundPosition: 'center',
        backgroundColor: art ? 'transparent' : (isDanger ? 'rgba(180,20,20,0.9)' : 'rgba(255,255,255,0.10)'),
      }}
      onPointerDown={(e) => { e.stopPropagation(); startHold(); }}
      onPointerUp={(e) => {
        e.stopPropagation();
        if (holdTimer.current) { cancelHold(); if (!held) onTap(1); }
      }}
      onPointerLeave={cancelHold} onPointerCancel={cancelHold}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundColor: isDanger ? 'rgba(180,20,20,0.55)' : 'rgba(0,0,0,0.45)' }} />
      {held && tapZones(onTap)}
      {isSelfCell && val === 0
        ? <span style={{ position: 'relative', zIndex: 1, fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', textShadow: '0 1px 4px rgba(0,0,0,0.9)', userSelect: 'none' }}>me</span>
        : <span style={{ position: 'relative', zIndex: 1, fontSize: 'clamp(14px, 4vw, 24px)', fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: '0 1px 6px rgba(0,0,0,0.9)', userSelect: 'none' }}>{val}</span>
      }
    </div>
  );

  if (hasPartner) {
    return (
      <div style={{ borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'row', border: '1px solid rgba(255,255,255,0.2)' }}>
        {subCell(artUrl, value, danger, isSelf, onChange)}
        {subCell(artUrlPartner, value2, danger2, isSelf, onChange2)}
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', display: 'flex', border: '1px solid rgba(255,255,255,0.2)' }}>
      {subCell(artUrl, value, danger, isSelf, onChange)}
    </div>
  );
};

// --- GAMEPLAY QUADRANT ---
const Quadrant = ({ id, seatIndex, player, isFlipped, onLose, onBackStep, onLifeChange, onCmdDamage, opponents }) => {
  const isOut = player.status === 'done' || player.status === 'out';
  const isWinner = isOut && player.stats.turnDied === 0;
  const hasArt = !!player.artUrl && typeof player.artUrl === 'string' && player.artUrl.startsWith('http');

  // Life tap-and-hold: tap=±1, hold 400ms=±10, with highlight and delta display
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
      // hold triggered — do ±10 once, then keep repeating ±10
      applyLifeChange(delta * 9); // already did ±1 on pointerdown, so add 9 more = 10 total
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
  const [cmdHeld, setCmdHeld] = useState(false); // when true, all cells show +/- zones

  const statOptions = (step) => {
    if (step === 0) return ['Skip', ...Array.from({length: 31}, (_, i) => i), '30+'];
    return ['Skip', ...Array.from({length: 11}, (_, i) => i), '10+'];
  };
  const statColors = ['#1a4a1a', '#5c3d1e', '#4a7a2a'];

  const handleStatSelect = (val) => {
    if (val === 'Skip') { onLose(id, null); return; }
    if (typeof val === 'string' && val.endsWith('+')) {
      const min = parseInt(val) + 1;
      const entered = prompt(`Enter exact count (${min}+):`);
      const num = parseInt(entered);
      if (!isNaN(num) && num >= min) onLose(id, num);
      return;
    }
    onLose(id, val);
  };

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

            {/* FULL-QUADRANT TAP ZONES — z-index 0, behind everything */}
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

            {/* ROW 1 - [Lose] [Name] [Win] — z-index 10 so it sits above the full-quadrant tap zones */}
            <div style={{
                flex: '0 0 auto', position: 'relative', zIndex: 10,
                display: 'flex', flexDirection: 'row', alignItems: 'center',
                gap: 6,
                paddingTop: 8, paddingBottom: 8,
                paddingLeft: (seatIndex === 0 || seatIndex === 3) ? 95 : 10,
                paddingRight: (seatIndex === 1 || seatIndex === 2) ? 95 : 10,
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <button onClick={(e) => { e.stopPropagation(); onLose(id); }} style={{
                flexShrink: 0, fontSize: 11, fontWeight: 900,
                padding: '6px 14px', borderRadius: 999, textTransform: 'uppercase',
                backgroundColor: hasArt ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.10)',
                color: hasArt ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.65)',
                border: hasArt ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
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
              }}>Win</button>
            </div>
            {/* ROW 2 - Life number + delta indicator (tap zones are full-quadrant overlays above) */}
            <div style={{ flex: '1 1 0', position: 'relative', minHeight: 0, zIndex: 5, pointerEvents: 'none' }}>
              {/* Life number */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 'clamp(56px, 21vw, 115px)', fontWeight: 900, lineHeight: 1, color: lifeColor, textShadow: hasArt ? '0px 2px 20px rgba(0,0,0,0.95)' : 'none', transition: 'color 0.2s', userSelect: 'none' }}>{life}</span>
              </div>
              {/* Delta — negative shown on left half, positive on right half */}
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
            <div style={{ flex: '0 0 auto', minHeight: 58, position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              {(() => {
                const orderedOpponents = isFlipped ? [...opponents].reverse() : opponents;
                return (
                  <div
                    onClick={(e) => { e.stopPropagation(); setCmdModal('grid'); }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 2, width: 64, height: 44, cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 8, padding: 2, border: '2px solid rgba(255,255,255,0.12)', pointerEvents: 'auto', WebkitTapHighlightColor: 'transparent' }}
                  >
                    {orderedOpponents.map((op) => {
                  const hasPartner = !!(op.artUrlPartner && op.artUrlPartner.startsWith('http'));
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
                      <div style={{ position: 'absolute', inset: 0, backgroundColor: isDanger ? 'rgba(180,20,20,0.55)' : 'rgba(0,0,0,0.25)' }} />
                      {isSelfCell && val === 0
                        ? <span style={{ position: 'relative', zIndex: 1, fontSize: 5, fontWeight: 900, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', userSelect: 'none' }}>me</span>
                        : <span style={{ position: 'relative', zIndex: 1, fontSize: 9, fontWeight: 900, color: '#fff', userSelect: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>{val}</span>
                      }
                    </div>
                  );

                  if (hasPartner) {
                    return (
                      <div key={op.id} style={{ borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'row' }}>
                        {miniCell(op.artUrl, val0, danger0, isSelf)}
                        {miniCell(op.artUrlPartner, val1, danger1, isSelf)}
                      </div>
                    );
                  }

                  return (
                    <div key={op.id} style={{ borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                      {miniCell(op.artUrl, val0, danger0, isSelf)}
                    </div>
                  );
                })}
                  </div>
                );
              })()}
            </div>

            {/* CMD DAMAGE MODAL */}
            {cmdModal === 'grid' && (
              <div
                style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={() => { setCmdModal(null); setCmdHeld(false); }}
              >
                <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: 12, userSelect: 'none' }}>Commander Damage</span>
                <div
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 8, width: 'clamp(200px, 52vw, 280px)', height: 'clamp(200px, 52vw, 280px)' }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                >
                  {(isFlipped ? [...opponents].reverse() : opponents).map((op) => {
                    const hasPartner = !!(op.artUrlPartner && op.artUrlPartner.startsWith('http'));
                    const val0 = (player.stats.cmdDamage || {})[`${op.id}_0`] ?? (player.stats.cmdDamage || {})[op.id] ?? 0;
                    const val1 = hasPartner ? ((player.stats.cmdDamage || {})[`${op.id}_1`] ?? 0) : 0;
                    const isSelf = op.id === id;
                    return (
                      <CmdCell
                        key={op.id}
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
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
        
        {player.status === 'questionnaire' && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center w-full">
              <p className="text-white font-black text-[10px] uppercase tracking-[0.4em] mb-3"
                style={{ backgroundColor: 'rgba(0,0,0,0.75)', padding: '5px 20px', borderRadius: '999px' }}
              >
                {['Final Lands', 'Final Rocks', 'Final Dorks'][player.step]}
              </p>
              <SelectionCarousel 
                title=""
                showBack={true}
                isFlipped={isFlipped}
                options={statOptions(player.step)}
                buttonColor={statColors[player.step]}
                onBack={() => onBackStep(id)} 
                onSelect={(val) => handleStatSelect(val)} 
              />
            </div>
          </div>
        )}

        {isOut && (
          <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700">
            <div className="opacity-10 scale-75 md:scale-150">
              <h1 className="text-[5rem] md:text-[11rem] font-black italic uppercase tracking-tighter -rotate-12" style={{ color: isWinner ? '#D4AF37' : '#FFFFFF' }}>
                {isWinner ? 'WINNER' : 'OUT'}
              </h1>
            </div>
            {!isWinner && <p className="absolute mt-12 md:mt-24 text-white/40 font-black text-[12px] md:text-[20px] uppercase tracking-[0.4em]">Eliminated Turn {player.stats.turnDied}</p>}
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

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [turn, setTurn] = useState(1);
  const [playerDataMap, setPlayerDataMap] = useState([]);
  const [pendingGames, setPendingGames] = useState(() => JSON.parse(localStorage.getItem('pending_mtg_games') || '[]'));
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
        setPlayerDataMap(d);
        localStorage.setItem('mtg_player_cache', JSON.stringify(d));
      })
      .catch(() => console.log("Offline: Using cached player data"));

    if (pendingGames.length > 0) syncPending();

    window.addEventListener('online', syncPending);
    return () => window.removeEventListener('online', syncPending);
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
  const [spinHighlight, setSpinHighlight] = useState(null); // seat index being highlighted

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
        // Land on winner
        setSpinHighlight(winner);
        setTimeout(() => {
          setIsSpinning(false);
          setSpinHighlight(null);
          handleSetFirst(winner);
        }, 600);
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
  const resetHoldRef = useRef(null);

  const handlePointerDown = (e) => {
    e.preventDefault();
    // Short hold (400ms) = decrement turn
    timerRef.current = setTimeout(() => { 
      setTurn(prev => Math.max(1, prev - 1)); 
      timerRef.current = null; 
    }, 400);
    // Very long hold (2000ms) = reset confirm
    resetHoldRef.current = setTimeout(() => {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      setShowResetConfirm(true);
      resetHoldRef.current = null;
    }, 2000);
  };

  const handlePointerUp = (e) => {
    e.preventDefault();
    clearTimeout(resetHoldRef.current);
    resetHoldRef.current = null;
    if (timerRef.current) { 
      clearTimeout(timerRef.current); 
      if (gameStarted) setTurn(prev => prev + 1); 
      else if (allFilled) setGameStarted(true);
      else if (hasPending) syncPending();
      timerRef.current = null; 
    }
  };

  const updateSeat = (id, field, value) => {
    setSeats(prev => {
      const ns = [...prev];
      if (field === 'startLands') ns[id].stats.startLands = value; 
      else ns[id][field] = value;
      return ns;
    });
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
          p.stats.turnDied = (idx === id) ? 0 : turn; 
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
        if (r.ok) {
          remaining = remaining.filter(pg => pg.timestamp !== g.timestamp);
          setPendingGames([...remaining]);
          localStorage.setItem('pending_mtg_games', JSON.stringify(remaining));
        } else { break; }
      } catch (e) { break; }
    }
    setIsSyncing(false);
  };

  const submitGame = async () => {
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
        seat_position: s.order
      }))
    };

    try {
      setIsSyncing(true);
      const r = await fetch(submitUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(gameData) 
      });
      if (!r.ok) throw new Error("Server error");
    } catch (e) {
      const updated = [...pendingGames, gameData];
      setPendingGames(updated);
      localStorage.setItem('pending_mtg_games', JSON.stringify(updated));
      alert("Offline: Game saved locally. It will sync when you're back online!");
    } finally {
      setIsSyncing(false);
      setGameStarted(false); 
      setTurn(1); 
      setSeats(initialSeats); 
      setFirstSeatIndex(null); 
      setMulliganType('');
    }
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
        <div
          className="grid grid-cols-2 grid-rows-2 gap-0"
          style={{ width: '100%', height: '100%' }}
        >
          {seats.map((s, i) => (
            <div key={i} className="w-full h-full flex items-center justify-center overflow-hidden" style={{ position: 'relative' }}>
              {/* Spin highlight overlay */}
              {!gameStarted && spinHighlight === i && (
                <div className="absolute inset-0 z-50 pointer-events-none" style={{ backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: '1.5rem' }} />
              )}
              {!gameStarted ?
                <SetupQuadrant
                  id={i} seat={s} isFlipped={i < 2}
                  playerDataMap={playerDataMap} onUpdate={updateSeat}
                  onSetFirst={handleSetFirst} firstSeatIndex={firstSeatIndex}
                  onResetAll={handleResetAll}
                  mulliganType={mulliganType} onSetMulligan={setMulliganType}
                /> :
                <Quadrant id={i} seatIndex={i} player={s} isFlipped={i < 2} onLose={handleLose} onBackStep={handleBackStep} onLifeChange={handleLifeChange} onCmdDamage={handleCmdDamage} opponents={seats.map((seat, idx) => ({ id: idx, name: seat.name, artUrl: seat.artUrl, artUrlPartner: seat.artUrlPartner }))} />
              }
            </div>
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[10000]">
          {/* Reset confirm modal */}
          {showResetConfirm && (
            <div className="pointer-events-auto flex flex-col items-center gap-4 bg-black/90 rounded-3xl p-8 border border-white/20" style={{ backdropFilter: 'blur(16px)' }}>
              <span className="text-white font-black text-sm uppercase tracking-widest">Reset Game?</span>
              <span className="text-white/50 font-bold text-xs uppercase tracking-wider">Returns to "Who Goes First?"</span>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="font-black uppercase text-xs text-white/60 px-6 py-3 rounded-full border border-white/15 bg-white/5"
                >Cancel</button>
                <button
                  onClick={() => { setShowResetConfirm(false); setGameStarted(false); setTurn(1); setSeats(initialSeats); setFirstSeatIndex(null); setMulliganType(''); }}
                  className="font-black uppercase text-xs text-black px-6 py-3 rounded-full bg-white"
                >Reset</button>
              </div>
            </div>
          )}
          {!gameStarted && (
            <>
              {/* RANDOM button — only visible when no one has gone first yet */}
              {firstSeatIndex === null && !allFilled && !hasPending && (
                <button
                  onClick={handleRandom}
                  disabled={isSpinning}
                  className="pointer-events-auto font-black rounded-full flex items-center justify-center text-center"
                  style={{ width: '120px', height: '120px', backgroundColor: isSpinning ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.25)' }}
                >
                  <span className="text-xs font-bold">{isSpinning ? '...' : 'RANDOM'}</span>
                </button>
              )}
              {/* START / SYNC button — normal behavior */}
              {(allFilled || hasPending) && (
                <button
                  onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}
                  disabled={isSyncing}
                  className={`pointer-events-auto font-black rounded-full transition-all flex items-center justify-center text-center p-4
                    ${allFilled ? 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.3)]' :
                      'bg-amber-500 text-black shadow-[0_0_40px_rgba(245,158,11,0.4)]'}
                  `}
                  style={{ width: '120px', height: '120px' }}
                >
                  <span className="text-xs font-bold">{isSyncing ? '...' : (allFilled ? 'START' : 'SYNC')}</span>
                </button>
              )}
            </>
          )}
          {gameStarted && !allFinished && (
            <button
              onPointerDown={handlePointerDown} 
              onPointerUp={handlePointerUp}
              className="pointer-events-auto rounded-full flex flex-col items-center justify-center border-none outline-none select-none"
              style={{ 
                width: '180px', 
                height: '180px', 
                backgroundColor: '#000000',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none'
              }}
            >
              <span className="font-black text-white/50 uppercase tracking-[0.3em] select-none" style={{ fontSize: '12px' }}>Turn</span>
              <span 
                className="font-black tabular-nums text-white select-none" 
                style={{ fontSize: '100px', lineHeight: 0.9, userSelect: 'none', WebkitUserSelect: 'none' }}
              >
                {turn}
              </span>
            </button>
          )}
          {gameStarted && allFinished && (
            <button
              onClick={submitGame}
              className="pointer-events-auto font-black rounded-full bg-[#D4AF37] text-black shadow-[0_0_40px_rgba(212,175,55,0.5)] p-4"
              style={{ width: '150px', height: '150px' }}
            >
              SUBMIT
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
