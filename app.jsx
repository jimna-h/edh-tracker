import React, { useState, useEffect } from 'react';

const PlayerQuadrant = ({ id, isFlipped, data, onLose, status }) => {
  return (
    <div className={`h-[45vh] w-full border border-zinc-800 flex flex-col items-center justify-center p-6 
      ${isFlipped ? 'rotate-180' : ''} ${status === 'out' ? 'bg-zinc-900 opacity-50' : 'bg-black'}`}>
      
      {status === 'active' ? (
        <>
          <h2 className="text-3xl font-bold tracking-tighter">{data.name}</h2>
          <p className="text-zinc-500 mb-8">{data.deck}</p>
          <button 
            onClick={() => onLose(id)}
            className="px-12 py-4 bg-zinc-800 border border-zinc-600 rounded-full font-bold active:scale-95 transition-transform"
          >
            LOSE
          </button>
        </>
      ) : (
        <h1 className="text-6xl font-black text-zinc-700">OUT</h1>
      )}
    </div>
  );
};

export default function LifetapClone() {
  const [turn, setTurn] = useState(1);
  const [showTurn, setShowTurn] = useState(false);
  const [players, setPlayers] = useState([
    { id: 0, name: "Ben", deck: "Ur-Dragon", status: "active" },
    { id: 1, name: "Cameron", deck: "Zacama", status: "active" },
    { id: 2, name: "Megan", deck: "Chatterfang", status: "active" },
    { id: 3, name: "User", deck: "Moira", status: "active" },
  ]);

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden select-none font-sans">
      
      {/* 2v2 Grid */}
      <div className="grid grid-cols-2 h-full w-full">
        <PlayerQuadrant id={0} isFlipped={true} data={players[0]} status={players[0].status} onLose={(id) => setPlayerStatus(id, 'out')} />
        <PlayerQuadrant id={1} isFlipped={true} data={players[1]} status={players[1].status} onLose={(id) => setPlayerStatus(id, 'out')} />
        <PlayerQuadrant id={2} isFlipped={false} data={players[2]} status={players[2].status} onLose={(id) => setPlayerStatus(id, 'out')} />
        <PlayerQuadrant id={3} isFlipped={false} data={players[3]} status={players[3].status} onLose={(id) => setPlayerStatus(id, 'out')} />
      </div>

      {/* Center Turn Button */}
      <div 
        onClick={() => setShowTurn(true)}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-zinc-900 border-4 border-zinc-800 rounded-full flex items-center justify-center z-50 active:scale-90 transition-transform shadow-2xl"
      >
        <span className="text-xs font-black tracking-widest">TURN</span>
      </div>

      {/* Turn Overlay */}
      {showTurn && (
        <div 
          className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center"
          onClick={() => setShowTurn(false)}
        >
          <div className="text-[15rem] font-black leading-none text-emerald-400 drop-shadow-glow">
            {turn}
          </div>
          <div className="flex gap-12 mt-10">
            <button 
              onClick={(e) => { e.stopPropagation(); setTurn(Math.max(1, turn - 1)); }}
              className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-700 text-4xl"
            >—</button>
            <button 
              onClick={(e) => { e.stopPropagation(); setTurn(turn + 1); }}
              className="w-24 h-24 rounded-full bg-emerald-500 text-black text-4xl font-bold"
            >＋</button>
          </div>
        </div>
      )}
    </div>
  );
}