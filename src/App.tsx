import { Fragment, useMemo } from 'react';

import { BoardGrid } from './components/BoardGrid';
import { DifficultyToggle } from './components/DifficultyToggle';
import { FleetSetup } from './components/FleetSetup';
import { GameProvider, useGame } from './context/GameContext';
import { getHistoryAtTurn } from './game/history';

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

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Cattle Clash</h1>
        <p className="header-subtitle">Battleship on the open range — rustle up those outlaws.</p>
      </header>

      <section className="panel" aria-live="polite">
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
        <Fragment>
          <section className="board-layout" aria-label="Battlefield">
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

          <section className="panel history-panel" hidden={!isHistoryOpen} aria-hidden={!isHistoryOpen}>
            <h2>Cattle Drive Log</h2>
            <ol className="history-list">
              {history.length === 0 && <li>No shots have been fired yet.</li>}
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
                    onClick={() =>
                      dispatch({ type: 'SET_HISTORY_CURSOR', payload: { turn: entry.turn } })
                    }
                    aria-pressed={historyCursor === entry.turn}
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
        </Fragment>
      )}

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
