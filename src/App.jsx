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
const QuadrantWrapper = ({ children, isFlipped, isOut, artUrl, isWinner }) => {
  const hasArt = !!artUrl && typeof artUrl === 'string' && artUrl.startsWith('http');
  
  return (
    <div 
      className={`
        relative h-[calc(100%-20px)] md:h-[calc(100%-50px)] w-[calc(100%-20px)] md:w-[calc(100%-50px)] 
        rounded-[1.5rem] md:rounded-[3.5rem] transition-all duration-700
        flex flex-col items-center justify-center overflow-hidden
        ${isFlipped ? 'rotate-180' : ''}
        ${isOut ? (isWinner ? 'bg-[#0a0a0a]' : 'bg-[#050505]') : (!hasArt ? 'bg-gradient-to-br from-[#b8cedc] via-[#a3b8c9] to-[#8da3b5]' : '')}
      `}
      style={hasArt && !isOut ? { 
        backgroundImage: `url(${artUrl})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
      } : {}}
    >
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
      <QuadrantWrapper isFlipped={isFlipped} artUrl={seat.artUrl}>
        {step === 0 && firstSeatIndex === null && (
          <button 
            onClick={() => onSetFirst(id)}
            className="w-[85%] h-[40%] bg-white/90 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center shadow-2xl active:scale-95 transition-transform cursor-pointer pointer-events-auto"
          >
            <div className="w-16 h-16 md:w-24 md:h-24 bg-black rounded-full flex items-center justify-center shadow-lg px-2">
              <span className="text-white font-black text-[10px] md:text-sm uppercase text-center leading-tight">Goes First</span>
            </div>
          </button>
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
            <div className="text-center animate-pulse">
              <p className="text-white/20 font-black text-[10px] md:text-xs uppercase tracking-[0.4em]">Waiting for Seat 4</p>
              <p className="text-white/40 font-black text-lg md:text-2xl uppercase">Choosing Mulligan...</p>
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
              onUpdate(id, 'colors', val.colors || ''); 
              setStep(3); 
            }} 
          />
        )}
        {step === 3 && (
          <SelectionCarousel 
            title="Starting Lands" 
            isFlipped={isFlipped} 
            options={[1, 2, 3, 4, 5, 6, 7]} 
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

// --- GAMEPLAY QUADRANT ---
const Quadrant = ({ id, seatIndex, player, isFlipped, onLose, onBackStep, onLifeChange, onCmdDamage, opponents }) => {
  const isOut = player.status === 'done' || player.status === 'out';
  const isWinner = isOut && player.stats.turnDied === 0;
  const hasArt = !!player.artUrl && typeof player.artUrl === 'string' && player.artUrl.startsWith('http');

  // Life tap-and-hold
  const lifeTimerRef = useRef(null);
  const lifeRepeatRef = useRef(null);
  const startLifeRepeat = (delta) => {
    lifeTimerRef.current = setTimeout(() => {
      lifeRepeatRef.current = setInterval(() => onLifeChange(id, delta), 80);
      lifeTimerRef.current = null;
    }, 350);
  };
  const stopLifeRepeat = (delta) => {
    const wasTap = !!lifeTimerRef.current;
    clearTimeout(lifeTimerRef.current);
    clearInterval(lifeRepeatRef.current);
    lifeTimerRef.current = null;
    lifeRepeatRef.current = null;
    if (wasTap) onLifeChange(id, delta);
  };
  const cancelLifeRepeat = () => {
    clearTimeout(lifeTimerRef.current);
    clearInterval(lifeRepeatRef.current);
    lifeTimerRef.current = null;
    lifeRepeatRef.current = null;
  };

  // Cmd damage tap-and-hold (hold 600ms = reset)
  const cmdTimers = useRef({});
  const startCmd = (opId) => {
    cmdTimers.current[opId] = setTimeout(() => {
      onCmdDamage(id, opId, 'reset');
      cmdTimers.current[opId] = null;
    }, 600);
  };
  const stopCmd = (opId) => {
    if (cmdTimers.current[opId]) {
      clearTimeout(cmdTimers.current[opId]);
      cmdTimers.current[opId] = null;
      onCmdDamage(id, opId, 1);
    }
  };

  const statOptions = (step) => {
    if (step === 0) return ['Skip', ...Array.from({length: 31}, (_, i) => i)];
    return ['Skip', ...Array.from({length: 11}, (_, i) => i)];
  };
  const statColors = ['#1a4a1a', '#5c3d1e', '#4a7a2a'];

  const life = player.stats.life ?? 40;
  const isLow = life <= 10;
  const isDead = life <= 0;
  const lifeColor = isDead ? '#ef4444' : isLow ? '#f97316' : (hasArt ? '#ffffff' : '#111111');
  const myOpponents = (opponents || []).filter(o => o.id !== id);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <QuadrantWrapper isFlipped={isFlipped} isOut={isOut} artUrl={player.artUrl} isWinner={isWinner}>
        {player.status === 'active' && (
          <div className="flex flex-col w-full h-full" style={{ touchAction: 'none' }}>

            {/* ROW 1 (26%) — [Lose] [Name/Deck] [Win]
                Seats 0,2 (left col): CSS-right = inner edge → paddingRight:95, paddingLeft:10
                Seats 1,3 (right col): rotate-180 flips it → CSS-left = inner edge → paddingLeft:95, paddingRight:10 */}
            {(() => {
              const isRightCol = seatIndex === 1 || seatIndex === 3;
              return (
                <div style={{
                  height: '26%', display: 'flex', flexDirection: 'row', alignItems: 'center',
                  gap: 6,
                  paddingLeft: isRightCol ? 95 : 10,
                  paddingRight: isRightCol ? 10 : 95,
                }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                >
                  <button onClick={(e) => { e.stopPropagation(); onLose(id); }} style={{
                    flexShrink: 0, fontSize: 'clamp(8px, 3vw, 12px)', fontWeight: 900,
                    padding: '6px 14px', borderRadius: 999, textTransform: 'uppercase',
                    backgroundColor: hasArt ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.10)',
                    color: hasArt ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.65)',
                    border: hasArt ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
                  }}>Lose</button>
                  <div style={{
                    flex: 1, minWidth: 0,
                    backgroundColor: hasArt ? 'rgba(0,0,0,0.62)' : 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                    borderRadius: 999, padding: '5px 14px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 'clamp(10px, 3.5vw, 15px)', fontWeight: 900, color: hasArt ? '#fff' : '#111', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center', userSelect: 'none' }}>{player.name}</span>
                    {player.deck && <span style={{ fontSize: 'clamp(6px, 2vw, 9px)', fontWeight: 700, color: hasArt ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center', userSelect: 'none' }}>{player.deck}</span>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onLose(id, null, true); }} style={{
                    flexShrink: 0, fontSize: 'clamp(8px, 3vw, 12px)', fontWeight: 900,
                    padding: '6px 14px', borderRadius: 999, textTransform: 'uppercase',
                    backgroundColor: 'rgba(212,175,55,0.9)', color: '#000',
                  }}>Win</button>
                </div>
              );
            })()}
              <button onClick={(e) => { e.stopPropagation(); onLose(id); }} style={{
                flexShrink: 0, fontSize: 'clamp(8px, 3vw, 12px)', fontWeight: 900,
                padding: '6px 14px', borderRadius: 999, textTransform: 'uppercase',
                backgroundColor: hasArt ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.10)',
                color: hasArt ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.65)',
                border: hasArt ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',

            {/* ROW 2 (48%) — Life number centered, left=−/subtract, right=+/add */}
            <div style={{ height: '48%', position: 'relative', width: '100%' }}>
              {/* Left half tap zone */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', touchAction: 'none', display: 'flex', alignItems: 'center', paddingLeft: 8, zIndex: 1 }}
                onPointerDown={(e) => { e.preventDefault(); startLifeRepeat(-1); }}
                onPointerUp={(e) => { e.preventDefault(); stopLifeRepeat(-1); }}
                onPointerLeave={cancelLifeRepeat} onPointerCancel={cancelLifeRepeat}
              >
                <span style={{ fontSize: 'clamp(12px, 5vw, 18px)', fontWeight: 900, userSelect: 'none', pointerEvents: 'none', color: hasArt ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }}>−</span>
              </div>
              {/* Right half tap zone */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', touchAction: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, zIndex: 1 }}
                onPointerDown={(e) => { e.preventDefault(); startLifeRepeat(1); }}
                onPointerUp={(e) => { e.preventDefault(); stopLifeRepeat(1); }}
                onPointerLeave={cancelLifeRepeat} onPointerCancel={cancelLifeRepeat}
              >
                <span style={{ fontSize: 'clamp(12px, 5vw, 18px)', fontWeight: 900, userSelect: 'none', pointerEvents: 'none', color: hasArt ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }}>+</span>
              </div>
              {/* Life number — fills the row, centered, no pointer events so taps pass through */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{
                  fontSize: 'clamp(56px, 21vw, 115px)', fontWeight: 900, lineHeight: 1,
                  color: lifeColor,
                  textShadow: hasArt ? '0px 2px 20px rgba(0,0,0,0.95)' : 'none',
                  transition: 'color 0.2s', userSelect: 'none',
                }}>{life}</span>
              </div>
            </div>

            {/* ROW 3 (26%) — visual RIGHT: Commander damage grid centered */}
            <div className="flex flex-row items-center justify-center"
              style={{ height: '26%' }}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <div className="grid gap-[3px]" style={{ gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', width: 52, height: 52 }}>
                {myOpponents.map((op) => {
                  const val = (player.stats.cmdDamage || {})[op.id] || 0;
                  const danger = val >= 21;
                  return (
                    <div key={op.id} className="rounded-[5px] flex items-center justify-center"
                      style={{ backgroundColor: danger ? 'rgba(180,20,20,0.85)' : (hasArt ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)'), touchAction: 'none', cursor: 'pointer' }}
                      onPointerDown={(e) => { e.stopPropagation(); startCmd(op.id); }}
                      onPointerUp={(e) => { e.stopPropagation(); stopCmd(op.id); }}
                      onPointerLeave={() => { clearTimeout(cmdTimers.current[op.id]); cmdTimers.current[op.id] = null; }}
                      onPointerCancel={() => { clearTimeout(cmdTimers.current[op.id]); cmdTimers.current[op.id] = null; }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 900, userSelect: 'none', color: danger ? '#fff' : (hasArt ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.6)') }}>{val}</span>
                    </div>
                  );
                })}
                {myOpponents.length < 4 && <div />}
              </div>
            </div>

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
                onSelect={(val) => onLose(id, val === 'Skip' ? null : val)} 
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
    id: i, name: '', deck: '', artUrl: '', colors: '', deckOwner: '', status: 'active', step: 0, order: '',
    stats: { startLands: 3, lands: 0, rocks: 0, dorks: 0, turnDied: 0, life: 40, cmdDamage: {} } 
  }));
  const [seats, setSeats] = useState(initialSeats);
  const timerRef = useRef(null);

  useEffect(() => {
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

  const handlePointerDown = (e) => {
    e.preventDefault();
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
            <div key={i} className="w-full h-full flex items-center justify-center overflow-hidden">
              {!gameStarted ?
                <SetupQuadrant
                  id={i} seat={s} isFlipped={i < 2}
                  playerDataMap={playerDataMap} onUpdate={updateSeat}
                  onSetFirst={handleSetFirst} firstSeatIndex={firstSeatIndex}
                  onResetAll={handleResetAll}
                  mulliganType={mulliganType} onSetMulligan={setMulliganType}
                /> :
                <Quadrant id={i} seatIndex={i} player={s} isFlipped={i < 2} onLose={handleLose} onBackStep={handleBackStep} onLifeChange={handleLifeChange} onCmdDamage={handleCmdDamage} opponents={seats.map((seat, idx) => ({ id: idx, name: seat.name }))} />
              }
            </div>
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[10000]">
          {!gameStarted && (
            <button
              onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}
              disabled={(!allFilled && !hasPending) || isSyncing}
              className={`pointer-events-auto font-black rounded-full transition-all flex items-center justify-center text-center p-4
                ${allFilled ? 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.3)]' :
                  hasPending ? 'bg-amber-500 text-black shadow-[0_0_40px_rgba(245,158,11,0.4)]' :
                  'bg-white/5 text-white/20 border border-white/10'}
              `}
              style={{ width: '120px', height: '120px' }}
            >
              <span className="text-xs font-bold">{isSyncing ? '...' : (allFilled ? 'START' : hasPending ? `SYNC` : 'SETUP')}</span>
            </button>
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
