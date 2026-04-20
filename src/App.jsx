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
const SelectionCarousel = ({ options = [], onSelect, onBack, title, showBack = true, isFlipped }) => {
  const scrollRef = useRef(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDown(true);
    setStartX(e.pageX - e.currentTarget.offsetLeft);
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDown) return;
    const x = e.pageX - e.currentTarget.offsetLeft;
    const walk = (x - startX) * (isFlipped ? -2 : 2); 
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="w-full max-w-[90%] md:max-w-[450px] flex flex-col items-center animate-in fade-in zoom-in duration-500 z-10 mx-auto">
      <p className="text-white/60 font-black text-[10px] md:text-[14px] uppercase tracking-[0.4em] md:tracking-[0.6em] mb-4 md:mb-8 drop-shadow-md">{title}</p>
      <div 
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDown(false)}
        onMouseLeave={() => setIsDown(false)}
        className="flex overflow-x-auto flex-nowrap gap-4 md:gap-6 py-4 no-scrollbar px-6 md:px-12 snap-x snap-mandatory w-full cursor-grab"
      >
        {options.map((opt, i) => {
          const isObj = typeof opt === 'object' && opt !== null;
          const hasArt = isObj && opt.artUrl;
          const label = isObj ? (opt.deck || opt.name || "Unnamed") : opt;

          return (
            <button
              key={`${title}-${i}`}
              onClick={() => onSelect(opt)}
              className="relative shrink-0 w-[140px] md:w-[180px] h-[80px] md:h-[100px] bg-white/10 border border-white/20 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center px-4 snap-center active:scale-95 transition-all shadow-xl backdrop-blur-md overflow-hidden"
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
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-2">
        {children}
      </div>
    </div>
  );
};

// --- SETUP QUADRANT ---
const SetupQuadrant = ({ id, seat, isFlipped, playerDataMap, onUpdate, onSetFirst, firstSeatIndex, onResetAll, mulliganType, onSetMulligan }) => {
  const [step, setStep] = useState(0); 
  const [tempColors, setTempColors] = useState([]);
  
  const players = [...Object.keys(playerDataMap), "+ GUEST"];
  const rawDecks = playerDataMap[seat.name] || [];
  const decks = [...rawDecks, { deck: "+ OTHER" }, { deck: "* BORROWED" }];
  const mulliganOptions = ["London", "Vegas", "3 Piles of 4", "10 Put Back 3", "Other"];

  useEffect(() => {
    if (firstSeatIndex !== null && step === 0) {
      setStep(1); // Move to the setup phase
    } else if (firstSeatIndex === null) {
      setStep(0); // Reset to "Goes First"
    }
  }, [firstSeatIndex]);

  const handleBack = () => {
    if (step === 1) onResetAll();
    else if (step === 6) { onUpdate(id, 'deckOwner', ''); setStep(1); }
    else setStep(Math.max(0, step - 1));
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <QuadrantWrapper isFlipped={isFlipped} artUrl={seat.artUrl}>
        {/* STEP 0: TURN ORDER SELECTION */}
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

        {/* STEP 1: MULLIGAN SELECTION (FORCE LAST PLAYER) */}
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

        {/* STEP 2+: PLAYER AND DECK SELECTION (ONLY AFTER MULLIGAN) */}
        {step === 1 && mulliganType && <SelectionCarousel title={`Seat ${seat.order}`} isFlipped={isFlipped} options={players} onBack={handleBack} onSelect={(val) => { onUpdate(id, 'name', val === "+ GUEST" ? (prompt("Enter Guest Name:") || "Guest") : val); setStep(2); }} />}
        
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

        {/* (Steps 3-7 remain unchanged for land count and final confirmation) */}
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

        {step === 5 && <SelectionCarousel title="Borrow From?" isFlipped={isFlipped} options={Object.keys(playerDataMap).filter(n => n !== seat.name)} onBack={handleBack} onSelect={(owner) => { onUpdate(id, 'deckOwner', owner); setStep(6); }} />}
        {step === 6 && <SelectionCarousel title={`${seat.deckOwner}'s Decks`} isFlipped={isFlipped} options={playerDataMap[seat.deckOwner]} onBack={handleBack} onSelect={(val) => { onUpdate(id, 'deck', val.deck); onUpdate(id, 'artUrl', val.artUrl); onUpdate(id, 'colors', val.colors || ''); setStep(3); }} />}
        {step === 3 && <SelectionCarousel title="Starting Lands" isFlipped={isFlipped} options={[1, 2, 3, 4, 5, 6, 7]} onBack={handleBack} onSelect={(val) => { onUpdate(id, 'startLands', val); setStep(7); }} />}
        
        {step === 7 && (
          <div className="text-center animate-in fade-in zoom-in duration-500 px-2">
            <p style={seat.artUrl ? textShadowStyle : {}} className="text-white/70 font-black text-[8px] md:text-[16px] uppercase tracking-[0.4em] mb-1 truncate max-w-[200px] mx-auto">{seat.deck}</p>
            <h2 style={seat.artUrl ? textShadowStyle : {}} className="text-white text-2xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4">{seat.name}</h2>
            <button onClick={() => { setStep(1); onUpdate(id, 'artUrl', ''); }} className="text-white/40 font-black text-[9px] uppercase tracking-[0.2em]">Edit</button>
          </div>
        )}
      </QuadrantWrapper>
    </div>
  );
};

// --- GAMEPLAY QUADRANT ---
const Quadrant = ({ id, player, isFlipped, onLose, onBackStep }) => {
  const isOut = player.status === 'done' || player.status === 'out';
  const isWinner = isOut && player.stats.turnDied === 0;
  const hasArt = !!player.artUrl && typeof player.artUrl === 'string' && player.artUrl.startsWith('http');

  return (
    <div className="w-full h-full flex items-center justify-center">
      <QuadrantWrapper isFlipped={isFlipped} isOut={isOut} artUrl={player.artUrl} isWinner={isWinner}>
        {player.status === 'active' && (
          <div className="flex flex-col items-center w-full px-4 md:px-10">
            <p style={hasArt ? textShadowStyle : {}} className="text-white/80 font-black text-[9px] md:text-[18px] uppercase tracking-[0.4em] mb-1 truncate max-w-full">{player.deck}</p>
            <h2 style={hasArt ? textShadowStyle : {}} className="text-white text-2xl md:text-7xl font-black uppercase tracking-tighter text-center leading-[0.8] mb-4 md:mb-16">{player.name}</h2>
            <div className={`flex w-full max-w-[180px] md:max-w-[360px] ${hasArt ? 'bg-black/50' : 'bg-black/[0.08]'} rounded-[1rem] md:rounded-[2.5rem] overflow-hidden backdrop-blur-xl border ${hasArt ? 'border-white/20' : 'border-transparent'}`}>
              <button onClick={() => onLose(id)} className="flex-1 py-3 md:py-7 font-black text-[10px] md:text-[14px] text-white uppercase">Lose</button>
              <div className="w-[1px] bg-white/20 my-2 md:my-5" />
              <button onClick={() => onLose(id, null, true)} className="flex-1 py-3 md:py-7 font-black text-[10px] md:text-[14px] text-white uppercase">Win</button>
            </div>
          </div>
        )}
        
        {player.status === 'questionnaire' && (
          <div className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-3xl">
             <SelectionCarousel 
                title={['Final Lands', 'Final Rocks', 'Final Dorks'][player.step]} 
                isFlipped={isFlipped} 
                options={player.step === 0 ? Array.from({length: 31}, (_, i) => i) : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} 
                onBack={() => onBackStep(id)} 
                onSelect={(val) => onLose(id, val)} 
              />
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
export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [turn, setTurn] = useState(1);
  const [playerDataMap, setPlayerDataMap] = useState({});
  const [pendingGames, setPendingGames] = useState(() => JSON.parse(localStorage.getItem('pending_mtg_games') || '[]'));
  const [firstSeatIndex, setFirstSeatIndex] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [mulliganType, setMulliganType] = useState('');
  
  const clockwiseOrder = [0, 1, 3, 2];

  const initialSeats = Array(4).fill(null).map((_, i) => ({ 
    id: i, name: '', deck: '', artUrl: '', colors: '', deckOwner: '', status: 'active', step: 0, order: '',
    stats: { startLands: 3, lands: 0, rocks: 0, dorks: 0, turnDied: 0 } 
  }));
  const [seats, setSeats] = useState(initialSeats);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch('https://edh-backend.onrender.com/players')
      .then(r => r.json())
      .then(d => setPlayerDataMap(d))
      .catch(() => console.log("Offline: Using cached player data"));

    if (pendingGames.length > 0) syncPending();

    window.addEventListener('online', syncPending);
    return () => window.removeEventListener('online', syncPending);
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
      if (!gameStarted && pendingGames.length > 0) syncPending();
      else setTurn(prev => Math.max(1, prev - 1)); 
      timerRef.current = null; 
    }, 800);
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
    setSeats(prev => {
        const ns = [...prev];
        if (field === 'startLands') ns[id].stats.startLands = value; 
        else ns[id][field] = value;
        return ns;
    });
  };

  const handleLose = (id, val = null, isWin = false) => {
    const ns = [...seats];
    if (isWin) { ns.forEach((p, idx) => { if (p.status === 'active') { p.status = 'questionnaire'; p.stats.turnDied = (idx === id) ? 0 : turn; } }); }
    else {
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
    let remaining = [...games];

    for (const g of games) {
      try {
        const r = await fetch('https://edh-backend.onrender.com/submit', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(g) 
        });
        if (r.ok) {
          remaining = remaining.filter(pg => pg.timestamp !== g.timestamp);
          setPendingGames(remaining);
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
        player: s.name, deck: s.deck, turn_died: s.stats.turnDied, stats: s.stats, 
        colors: s.colors, deck_owner: s.deckOwner || s.name, seat_position: s.order
      }))
    };
    try {
      const r = await fetch('https://edh-backend.onrender.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(gameData) });
      if (!r.ok) throw new Error();
    } catch (e) {
      const updated = [...pendingGames, gameData];
      setPendingGames(updated);
      localStorage.setItem('pending_mtg_games', JSON.stringify(updated));
    }
    setGameStarted(false); setTurn(1); setSeats(initialSeats); setFirstSeatIndex(null); setMulliganType('');
  };

  const allFilled = seats.every(s => s.name !== '' && s.deck !== '') && mulliganType !== '';
  const allFinished = seats.every(s => s.status === 'done');
  const hasPending = pendingGames.length > 0;

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center">
      <div 
        style={{ 
          width: '100vh',   
          height: '100vw', 
          transform: 'rotate(90deg)', 
          transformOrigin: 'center center'
        }}
        className="relative flex items-center justify-center"
      >
        {/* THE GRID: Removed extra margins so it fills the rotation box perfectly */}
        <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-4 md:gap-8 p-2">
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
                <Quadrant id={i} player={s} isFlipped={i < 2} onLose={handleLose} onBackStep={handleBackStep} />
              }
            </div>
          ))}
        </div>

        {/* THE CENTER BUTTON: Simplified the positioning to stay dead-center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[10000]">
          <div className="flex flex-col items-center">
            {!gameStarted && (
              <button 
                onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}
                disabled={(!allFilled && !hasPending) || isSyncing}
                className={`pointer-events-auto font-black rounded-full text-lg md:text-2xl transition-all flex items-center justify-center text-center px-4
                  ${allFilled ? 'bg-white text-black scale-100 shadow-[0_0_60px_rgba(255,255,255,0.4)]' : 
                    hasPending ? 'bg-amber-500 text-black scale-100 shadow-[0_0_60px_rgba(245,158,11,0.5)]' :
                    'bg-white/5 text-white/10 scale-90 border border-white/5'}
                  ${isSyncing ? 'animate-pulse opacity-80' : ''}
                `}
                style={{ width: 'clamp(80px, 18vh, 200px)', height: 'clamp(80px, 18vh, 200px)' }}
              >
                {isSyncing ? 'SYNC' : (allFilled ? 'START' : hasPending ? `SYNC [${pendingGames.length}]` : 'SETUP')}
              </button>
            )}

            {gameStarted && !allFinished && (
              <button 
                onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} 
                className="pointer-events-auto rounded-full flex items-center justify-center active:scale-90 transition-all cursor-pointer touch-none bg-black border-none shadow-[0_0_80px_rgba(0,0,0,1)]"
                style={{ width: 'clamp(90px, 25vh, 280px)', height: 'clamp(90px, 25vh, 280px)' }}
              >
                <span className="font-black tabular-nums leading-none tracking-tighter text-white" style={{ fontSize: 'clamp(3rem, 12vh, 12rem)' }}>{turn}</span>
              </button>
            )}

            {gameStarted && allFinished && (
              <button 
                onClick={submitGame}
                className="pointer-events-auto font-black rounded-full tracking-widest text-lg md:text-2xl bg-[#D4AF37] text-black shadow-[0_0_60px_rgba(212,175,55,0.6)] active:scale-95 transition-all flex items-center justify-center text-center"
                style={{ width: 'clamp(100px, 22vh, 260px)', height: 'clamp(100px, 22vh, 260px)' }}
              >
                SUBMIT
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  }
