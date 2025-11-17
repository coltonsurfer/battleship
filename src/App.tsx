import { useMemo, useEffect, useRef, useState } from 'react';

import { BoardGrid } from './components/BoardGrid';
import { CowboyNav } from './components/CowboyNav';
import { DifficultyToggle } from './components/DifficultyToggle';
import { FleetSetup } from './components/FleetSetup';
import { ArsenalShowcase } from './components/ArsenalShowcase';
import { AiThinkingMap } from './components/AiThinkingMap';
import { GameProvider, useGame } from './context/GameContext';
import { getHistoryAtTurn } from './game/history';
import { audioManager } from './utils/audio';

function GameLayout() {
  const { state, dispatch } = useGame();
  const {
    phase,
    difficulty,
    boardPlayer,
    boardAI,
    aiThinking,
    history,
    isHistoryOpen,
    historyCursor,
    winner,
    aiMemory
  } = state;

  const viewingHistory = historyCursor !== null;
  const historyBoards = viewingHistory ? getHistoryAtTurn(state, historyCursor) : null;
  const playerBoardDisplay = historyBoards?.player ?? boardPlayer;
  const aiBoardDisplay = historyBoards?.ai ?? boardAI;

  const statusText = useMemo(() => {
    if (phase === 'setup') return 'Place your fleet or randomize to begin the skirmish.';
    if (phase === 'playerTurn') return 'Your turn — pick a square on the outlaw waters.';
    if (phase === 'aiTurn') return aiThinking ? 'Outlaw AI lining up a shot…' : 'Outlaw turn.';
    if (phase === 'finished') {
      return winner === 'player'
        ? 'You branded every outlaw ship. Victory is yours!'
        : 'The outlaws sank your herd. Tip your hat and try again.';
    }
    return '';
  }, [phase, aiThinking, winner]);

  const aiTargetHints = useMemo(
    () => new Set(aiMemory.targetQueue.map(coord => `${coord.x},${coord.y}`)),
    [aiMemory.targetQueue]
  );

  const lastEntry = history[history.length - 1];
  const lastSummary = lastEntry
    ? `${lastEntry.shooter === 'player' ? 'You' : 'AI'} targeted ${String.fromCharCode(65 + lastEntry.target.y)}${
        lastEntry.target.x + 1
      } (${lastEntry.result}${lastEntry.sunk ? `, sunk ${lastEntry.shipId}` : ''})`
    : 'No shots yet — saddle up!';

  // Track previous history length to detect new shots
  const prevHistoryLengthRef = useRef(history.length);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Update audio manager when enabled state changes
  useEffect(() => {
    audioManager.setEnabled(audioEnabled);
  }, [audioEnabled]);

  // Play entrance sound on mount
  useEffect(() => {
    audioManager.playEntrance();
  }, []);

  // Play victory/defeat sound when game ends
  useEffect(() => {
    if (phase === 'finished' && winner) {
      if (winner === 'player') {
        audioManager.playVictory();
      } else {
        audioManager.playDefeat();
      }
    }
  }, [phase, winner]);

  // Play shot sounds when history updates
  useEffect(() => {
    if (history.length > prevHistoryLengthRef.current) {
      const latestShot = history[history.length - 1];
      
      // Play fire sound first
      audioManager.playFire();
      
      // Then play hit or miss sound after a short delay
      setTimeout(() => {
        if (latestShot.result === 'hit') {
          audioManager.playHit();
        } else {
          audioManager.playMiss();
        }
      }, 150);
    }
    
    prevHistoryLengthRef.current = history.length;
  }, [history]);

  const handlePlayerFire = (coordinate: { x: number; y: number }) => {
    try {
      if (viewingHistory || phase !== 'playerTurn' || winner) return;
      dispatch({ type: 'PLAYER_FIRE', payload: { coordinate } });
    } catch (error) {
      console.warn(error);
    }
  };

  const handleNewGame = () => dispatch({ type: 'RESET_TO_SETUP' });
  const handleDifficultyChange = (next: typeof difficulty) =>
    dispatch({ type: 'SET_DIFFICULTY', difficulty: next });

  const toggleHistory = () => dispatch({ type: 'TOGGLE_HISTORY' });

  const handleQuickDraw = () => {
    if (phase !== 'setup') {
      handleNewGame();
      return;
    }
    dispatch({ type: 'RANDOMIZE_PLAYER_FLEET', seed: Date.now() });
    setTimeout(() => dispatch({ type: 'START_GAME' }), 0);
  };

  return (
    <div className="app-shell">
      <CowboyNav onQuickDraw={handleQuickDraw} />

      {/* AI Thinking Map Animation */}
      {aiThinking && phase === 'aiTurn' && <AiThinkingMap />}

      <header className="app-header">
        <div className="hero-content">
          <div className="hero-badge">
            <span>⚔️ WESTERN NAVAL WARFARE ⚔️</span>
          </div>
          <h1 className="hero-title">
            <span className="hero-title__main">Cattle</span>
            <span className="hero-title__accent">Clash</span>
          </h1>
          <p className="hero-subtitle">
            Battleship on the open range — rustle up those outlaws.
          </p>
          <div className="hero-actions">
            <button className="hero-cta hero-cta--primary" onClick={handleQuickDraw}>
              {phase !== 'setup' ? '⚡ New Battle' : '🤠 Quick Draw'}
            </button>
            <button className="hero-cta hero-cta--secondary" onClick={toggleHistory}>
              {isHistoryOpen ? '📋 Hide Battle Log' : `📋 Cattle Drive Log (${history.length})`}
            </button>
          </div>
        </div>
        <div className="hero-background">
          <div className="hero-particles"></div>
        </div>
      </header>

      <ArsenalShowcase />

      <section id="controls" className="panel" aria-live="polite">
        <div className="control-bar">
          <DifficultyToggle
            difficulty={difficulty}
            onChange={handleDifficultyChange}
            disabled={phase !== 'setup'}
          />
          <button className="belt-buckle" type="button" onClick={handleNewGame}>
            New showdown
          </button>
          <button className="belt-buckle" type="button" onClick={toggleHistory}>
            {isHistoryOpen ? 'Hide cattle drive log' : `Cattle drive log (${history.length})`}
          </button>
          <button 
            className="belt-buckle belt-buckle--ghost" 
            type="button" 
            onClick={() => setAudioEnabled(!audioEnabled)}
            aria-label={audioEnabled ? 'Mute audio' : 'Unmute audio'}
          >
            {audioEnabled ? '🔊 Audio On' : '🔇 Audio Off'}
          </button>
        </div>
        <div className="status-banner">
          <div>
            <p>{statusText}</p>
            <p className="status-subtext" aria-live="polite">
              {viewingHistory ? `Viewing turn ${historyCursor}` : lastSummary}
            </p>
          </div>
          <span aria-live="polite">
            {viewingHistory ? 'History view active' : `Turns recorded: ${history.length}`}
          </span>
        </div>
      </section>

      {phase === 'setup' ? (
        <FleetSetup />
      ) : (
        <section id="arena" className="board-layout" aria-label="Battlefield">
          <div className="panel" aria-label="Your ranch grid">
            <h2>Ranch</h2>
            <BoardGrid
              board={playerBoardDisplay}
              mode="player"
              ariaLabel="Player ranch grid"
              highlightTargets={viewingHistory ? undefined : aiTargetHints}
              disabled={viewingHistory}
            />
          </div>
          <div className="panel" aria-label="Outlaw waters grid">
            <h2>Outlaw Waters</h2>
            <BoardGrid
              board={aiBoardDisplay}
              mode="enemy"
              ariaLabel="Outlaw grid"
              onSelectCell={handlePlayerFire}
              disabled={viewingHistory || phase !== 'playerTurn' || Boolean(winner)}
            />
          </div>
        </section>
      )}

      <section id="log" className="panel history-panel" hidden={!isHistoryOpen} aria-hidden={!isHistoryOpen}>
        <h2>Cattle Drive Log</h2>
        <p className="panel-footer" aria-live="polite">
          {phase === 'setup'
            ? 'History will fill in once the showdown starts. Place your ships to begin.'
            : history.length === 0
              ? 'No shots have been fired yet — take aim to rustle up entries.'
              : `Logged turns: ${history.length}`}
        </p>
        <ol className="history-list">
          {history.map(entry => (
            <li
              key={entry.timestamp}
              className={`history-entry${historyCursor === entry.turn ? ' history-entry--active' : ''}`}
            >
              <div>
                <strong>Turn {entry.turn}:</strong> {entry.shooter === 'player' ? 'You' : 'AI'} →
                ({String.fromCharCode(65 + entry.target.y)}{entry.target.x + 1}) — {entry.result}
                {entry.sunk ? `, sunk ${entry.shipId}` : ''}
              </div>
              <button
                type="button"
                className="belt-buckle belt-buckle--ghost"
                onClick={() => dispatch({ type: 'SET_HISTORY_CURSOR', payload: { turn: entry.turn } })}
                aria-pressed={historyCursor === entry.turn}
                disabled={phase === 'setup'}
              >
                View
              </button>
            </li>
          ))}
        </ol>
        {historyCursor !== null && (
          <button
            type="button"
            className="belt-buckle belt-buckle--ghost"
            onClick={() => dispatch({ type: 'SET_HISTORY_CURSOR', payload: { turn: null } })}
          >
            Return to live battle
          </button>
        )}
      </section>

      {phase === 'finished' && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Game result">
          <div className="modal-panel">
            <h2>{winner === 'player' ? 'Victory!' : 'Defeat!'}</h2>
            <p>
              {winner === 'player'
                ? 'You sent those bandits packing. Fancy another round?'
                : 'The outlaws seized your herd this round. Saddle up and try again.'}
            </p>
            <div className="modal-actions">
              <button className="belt-buckle" type="button" onClick={handleNewGame}>
                New showdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameLayout />
    </GameProvider>
  );
}
