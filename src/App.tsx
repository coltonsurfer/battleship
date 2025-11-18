import { useMemo, useEffect, useRef, useState } from 'react';

import { BoardGrid } from './components/BoardGrid';
import { CowboyNav } from './components/CowboyNav';
import { DifficultyToggle } from './components/DifficultyToggle';
import { LanguageToggle } from './components/LanguageToggle';
import { FleetSetup } from './components/FleetSetup';
import { ArsenalShowcase } from './components/ArsenalShowcase';
import { AiThinkingMap } from './components/AiThinkingMap';
import { GameProvider, useGame } from './context/GameContext';
import { useTranslation } from './hooks/useTranslation';
import { getHistoryAtTurn } from './game/history';
import { audioManager } from './utils/audio';

function GameLayout() {
  const { state, dispatch } = useGame();
  const { t } = useTranslation();
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
    if (phase === 'setup') return t('status.placeFleet');
    if (phase === 'playerTurn') return t('status.yourTurn');
    if (phase === 'aiTurn') return aiThinking ? t('status.aiThinking') : t('status.aiTurn');
    if (phase === 'finished') {
      return winner === 'player' ? t('status.victory') : t('status.defeat');
    }
    return '';
  }, [phase, aiThinking, winner, t]);

  const aiTargetHints = useMemo(
    () => new Set(aiMemory.targetQueue.map(coord => `${coord.x},${coord.y}`)),
    [aiMemory.targetQueue]
  );

  const lastEntry = history[history.length - 1];
  const lastSummary = lastEntry
    ? `${lastEntry.shooter === 'player' ? t('status.you') : t('status.ai')} targeted ${String.fromCharCode(65 + lastEntry.target.y)}${
        lastEntry.target.x + 1
      } (${t(`status.${lastEntry.result}` as any)}${lastEntry.sunk ? `, ${t('status.sunk')} ${lastEntry.shipId}` : ''})`
    : t('status.noShots');

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
            <span>{t('hero.badge')}</span>
          </div>
          <h1 className="hero-title">
            <span className="hero-title__main">{t('hero.title.main')}</span>
            <span className="hero-title__accent">{t('hero.title.accent')}</span>
          </h1>
          <p className="hero-subtitle">
            {t('hero.subtitle')}
          </p>
          <div className="hero-actions">
            <button className="hero-cta hero-cta--primary" onClick={handleQuickDraw}>
              {phase !== 'setup' ? t('hero.newBattle') : t('hero.quickDraw')}
            </button>
            <button className="hero-cta hero-cta--secondary" onClick={toggleHistory}>
              {isHistoryOpen ? t('hero.hideBattleLog') : `${t('hero.cattleDriveLog')} (${history.length})`}
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
          <LanguageToggle />
          <button className="belt-buckle" type="button" onClick={handleNewGame}>
            {t('controls.newShowdown')}
          </button>
          <button className="belt-buckle" type="button" onClick={toggleHistory}>
            {isHistoryOpen ? t('controls.hideCattleDriveLog') : `${t('controls.cattleDriveLog')} (${history.length})`}
          </button>
          <button 
            className="belt-buckle belt-buckle--ghost" 
            type="button" 
            onClick={() => setAudioEnabled(!audioEnabled)}
            aria-label={audioEnabled ? t('controls.muteAudio') : t('controls.unmuteAudio')}
          >
            {audioEnabled ? t('controls.audioOn') : t('controls.audioOff')}
          </button>
        </div>
        <div className="status-banner">
          <div>
            <p>{statusText}</p>
            <p className="status-subtext" aria-live="polite">
              {viewingHistory ? t('status.viewingTurn', { turn: String(historyCursor) }) : lastSummary}
            </p>
          </div>
          <span aria-live="polite">
            {viewingHistory ? t('status.historyActive') : t('status.turnsRecorded', { count: String(history.length) })}
          </span>
        </div>
      </section>

      {phase === 'setup' ? (
        <FleetSetup />
      ) : (
        <section id="arena" className="board-layout" aria-label={t('board.battlefield')}>
          <div className="panel" aria-label={t('board.yourRanchGrid')}>
            <h2>{t('board.ranch')}</h2>
            <BoardGrid
              board={playerBoardDisplay}
              mode="player"
              ariaLabel={t('board.playerRanchGrid')}
              highlightTargets={viewingHistory ? undefined : aiTargetHints}
              disabled={viewingHistory}
            />
          </div>
          <div className="panel" aria-label={t('board.outlawWatersGrid')}>
            <h2>{t('board.outlawWaters')}</h2>
            <BoardGrid
              board={aiBoardDisplay}
              mode="enemy"
              ariaLabel={t('board.outlawGrid')}
              onSelectCell={handlePlayerFire}
              disabled={viewingHistory || phase !== 'playerTurn' || Boolean(winner)}
            />
          </div>
        </section>
      )}

      <section id="log" className="panel history-panel" hidden={!isHistoryOpen} aria-hidden={!isHistoryOpen}>
        <h2>{t('history.heading')}</h2>
        <p className="panel-footer" aria-live="polite">
          {phase === 'setup'
            ? t('history.setupMessage')
            : history.length === 0
              ? t('history.noShots')
              : t('history.loggedTurns', { count: String(history.length) })}
        </p>
        <ol className="history-list">
          {history.map(entry => (
            <li
              key={entry.timestamp}
              className={`history-entry${historyCursor === entry.turn ? ' history-entry--active' : ''}`}
            >
              <div>
                <strong>{t('history.turn', { turn: String(entry.turn) })}</strong> {entry.shooter === 'player' ? t('status.you') : t('status.ai')} →
                ({String.fromCharCode(65 + entry.target.y)}{entry.target.x + 1}) — {t(`status.${entry.result}` as any)}
                {entry.sunk ? `, ${t('status.sunk')} ${entry.shipId}` : ''}
              </div>
              <button
                type="button"
                className="belt-buckle belt-buckle--ghost"
                onClick={() => dispatch({ type: 'SET_HISTORY_CURSOR', payload: { turn: entry.turn } })}
                aria-pressed={historyCursor === entry.turn}
                disabled={phase === 'setup'}
              >
                {t('history.view')}
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
            {t('history.returnToLive')}
          </button>
        )}
      </section>

      {phase === 'finished' && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t('modal.gameResult')}>
          <div className="modal-panel">
            <h2>{winner === 'player' ? t('modal.victory') : t('modal.defeat')}</h2>
            <p>
              {winner === 'player'
                ? t('modal.victoryMessage')
                : t('modal.defeatMessage')}
            </p>
            <div className="modal-actions">
              <button className="belt-buckle" type="button" onClick={handleNewGame}>
                {t('modal.newShowdown')}
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
