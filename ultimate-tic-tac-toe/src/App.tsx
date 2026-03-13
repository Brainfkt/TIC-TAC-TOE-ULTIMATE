import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  RotateCcw, 
  Zap, 
  ChevronRight,
  Lock,
  Clock,
  Play,
  Pause,
  Camera,
  Smile,
  Hourglass,
} from 'lucide-react';
import { 
  createInitialState, 
  checkWin, 
  Player, 
  GameState,
  PowerUp,
  GameStatus
} from './logic/game';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility for Tailwind classes */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Sub-components ---

interface PlayerCardProps {
  player: 'X' | 'O';
  name: string;
  avatar: string;
  score: number;
  isTurn: boolean;
  powerUps: PowerUp[];
  onPowerUpClick: (id: string) => void;
  activePowerUpId: string | null;
  onAvatarClick: () => void;
  isEditable: boolean;
}

const PlayerCard = ({ 
  player, 
  name, 
  avatar, 
  score, 
  isTurn, 
  powerUps, 
  onPowerUpClick, 
  activePowerUpId,
  onAvatarClick,
  isEditable
}: PlayerCardProps) => {
  const isX = player === 'X';
  const color = isX ? "text-blue-400" : "text-pink-400";
  const bgActive = isX ? "bg-blue-500/20" : "bg-pink-500/20";
  const borderActive = isX ? "border-blue-500" : "border-pink-500";

  const isDataURI = avatar.startsWith('data:image');

  return (
    <motion.div 
      layout
      className={cn(
        "w-full md:w-52 p-6 rounded-2xl border transition-all duration-500 relative z-[60]",
        isTurn ? cn("bg-slate-800/80 border-2", borderActive) : "bg-slate-900 border-white/10 opacity-60",
        isEditable && "shadow-[0_0_30px_rgba(255,255,255,0.05)] border-white/20 opacity-100 ring-1 ring-white/10"
      )}
    >
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onAvatarClick}
          disabled={!isEditable}
          className={cn(
            "relative w-14 h-14 rounded-xl flex items-center justify-center transition-all overflow-hidden border-2 group",
            bgActive,
            isTurn ? borderActive : "border-white/10",
            isEditable ? "hover:border-white/30 cursor-pointer scale-110" : "cursor-default"
          )}
        >
          {isDataURI ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover mirror" />
          ) : (
            <span className="text-3xl">{avatar}</span>
          )}
          {isEditable && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
          )}
        </button>
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Joueur</h3>
          <p className={cn("text-xl font-black tracking-tight leading-none", color)}>{name}</p>
        </div>
      </div>

      <div className="py-6 border-y border-white/5 mb-6">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Score</h3>
        <p className="text-4xl font-mono font-black text-white">{score}</p>
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pouvoirs</h4>
        <div className="flex gap-3">
          {powerUps.map((p) => (
            <div key={p.id} className="relative group">
              <button
                onClick={() => onPowerUpClick(p.id)}
                className={cn(
                  "relative w-10 h-10 rounded-lg flex items-center justify-center transition-all border-2",
                  activePowerUpId === p.id 
                    ? cn(bgActive, borderActive, "scale-110 shadow-lg") 
                    : "bg-slate-800 border-white/10 hover:border-white/20 active:scale-90"
                )}
              >
                {p.id === 'sabotage' && <Hourglass className={cn("w-4 h-4", color)} />}
                {p.id === 'block' && <Lock className={cn("w-4 h-4", color)} />}
                {p.id === 'swap' && <Zap className={cn("w-4 h-4", color)} />}
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 px-1 bg-slate-700 rounded-full text-[8px] flex items-center justify-center font-black border-2 border-slate-900 text-white">
                  {p.count}
                </span>
              </button>
              
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-[10px] w-32 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-[100] shadow-2xl">
                <p className="font-black mb-1 uppercase tracking-tighter text-white">{p.name}</p>
                <p className="text-slate-400 leading-tight">{p.description}</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [activePowerUp, setActivePowerUp] = useState<{ id: string, player: Player } | null>(null);
  
  // Avatar Editing State
  const [cameraPlayer, setCameraPlayer] = useState<Player>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // UseEffect to handle camera stream when modal opens
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      if (cameraPlayer && !isEmojiPickerOpen) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300 } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera access denied or unavailable", err);
          setIsEmojiPickerOpen(true);
        }
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraPlayer, isEmojiPickerOpen]);

  const openAvatarEditor = (player: Player) => {
    setCameraPlayer(player);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraPlayer) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        updateAvatar(cameraPlayer, dataUri);
        closeCamera();
      }
    }
  };

  const closeCamera = () => {
    setCameraPlayer(null);
    setIsEmojiPickerOpen(false);
  };

  const updateAvatar = (player: Player, avatar: string) => {
    setGameState(prev => ({
      ...prev,
      playerInfo: {
        ...prev.playerInfo,
        [player!]: { ...prev.playerInfo[player!], avatar }
      }
    }));
  };

  const selectEmoji = (emoji: string) => {
    if (cameraPlayer) {
      updateAvatar(cameraPlayer, emoji);
      closeCamera();
    }
  };

  useEffect(() => {
    if (gameState.status !== 'playing' || gameState.isPaused) return;
    
    const interval = setInterval(() => {
      setGameState(prev => {
        if (prev.isPaused) return prev;
        if (prev.timeLeft <= 0) {
          // Time's up, switch player
          const nextLimit = prev.nextTurnTimeLimit || 5;
          return {
            ...prev,
            currentPlayer: prev.currentPlayer === 'X' ? 'O' : 'X',
            timeLeft: nextLimit,
            nextTurnTimeLimit: undefined, // Reset after use
          };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.status, gameState.currentPlayer, gameState.isPaused]);

  const togglePause = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      status: 'playing',
      isPaused: false,
      timeLeft: 5,
      nextTurnTimeLimit: undefined
    }));
  };

  const resetGame = () => {
    setGameState(prev => {
      const newState = createInitialState();
      return {
        ...newState,
        playerInfo: prev.playerInfo,
        scores: prev.scores
      };
    });
    setActivePowerUp(null);
    closeCamera();
  };

  const handlePowerUpClick = (powerUpId: string, player: Player) => {
    if (gameState.currentPlayer !== player || gameState.status !== 'playing') return;
    if (powerUpId === 'sabotage') {
      applySabotage(player);
      return;
    }
    setActivePowerUp(activePowerUp?.id === powerUpId ? null : { id: powerUpId, player });
  };

  const applySabotage = (currentPlayer: Player) => {
    const newPowerUps = { ...gameState.powerUps };
    newPowerUps[currentPlayer!] = newPowerUps[currentPlayer!]?.map(p => 
      p.id === 'sabotage' ? { ...p, count: p.count - 1 } : p
    ).filter(p => p.count > 0) || [];

    setGameState(prev => ({
      ...prev,
      powerUps: newPowerUps,
      nextTurnTimeLimit: 1, 
    }));
  };

  const applyPowerUp = (sgIndex: number, cIndex: number) => {
    if (!activePowerUp) return;
    const newBoard = [...gameState.board];
    const newSmallGrid = { ...newBoard[sgIndex] };
    const newCells = [...newSmallGrid.cells];
    const targetCell = newCells[cIndex];
    const currentPlayer = activePowerUp.player!;
    const opponent = currentPlayer === 'X' ? 'O' : 'X';

    let success = false;
    if (activePowerUp.id === 'erase' && targetCell.player === opponent) {
      newCells[cIndex] = { player: null, blockedTurns: 0 };
      success = true;
    } else if (activePowerUp.id === 'block' && !targetCell.player && !targetCell.blockedTurns) {
      newCells[cIndex] = { ...targetCell, blockedTurns: 2 };
      success = true;
    } else if (activePowerUp.id === 'swap' && targetCell.player === opponent) {
      newCells[cIndex] = { ...targetCell, player: currentPlayer };
      success = true;
    }

    if (success) {
      newSmallGrid.cells = newCells;
      newBoard[sgIndex] = newSmallGrid;
      const newPowerUps = { ...gameState.powerUps };
      newPowerUps[currentPlayer] = newPowerUps[currentPlayer]?.map(p => 
        p.id === activePowerUp.id ? { ...p, count: p.count - 1 } : p
      ).filter(p => p.count > 0) || [];
      endTurn(newBoard, newPowerUps);
      setActivePowerUp(null);
    }
  };

  const endTurn = (newBoard: any, newPowerUps: any) => {
    setGameState(prev => {
      const boardWithUpdatedBlocks = newBoard.map((grid: any) => ({
        ...grid,
        cells: grid.cells.map((cell: any) => ({
          ...cell,
          blockedTurns: Math.max(0, (cell.blockedTurns || 0) - 1)
        }))
      }));
      const boardWithWinners = boardWithUpdatedBlocks.map((grid: any) => {
        const winner = checkWin(grid.cells);
        const isFull = grid.cells.every((c: any) => c.player !== null);
        return { ...grid, winner, isFull };
      });
      const winners = boardWithWinners.map((g: any) => g.winner);
      const overallWinner = checkWin(winners);
      let nextStatus: GameStatus = prev.status;
      if (overallWinner) nextStatus = overallWinner === 'X' ? 'X_wins' : 'O_wins';
      else if (boardWithWinners.every((g: any) => g.winner || g.isFull)) nextStatus = 'draw';
      const nextLimit = prev.nextTurnTimeLimit || 5;
      return {
        ...prev,
        board: boardWithWinners,
        currentPlayer: prev.currentPlayer === 'X' ? 'O' : 'X',
        status: nextStatus,
        powerUps: newPowerUps || prev.powerUps,
        timeLeft: nextLimit,
        nextTurnTimeLimit: undefined,
      };
    });
  };

  const handleCellClick = (smallGridIndex: number, cellIndex: number) => {
    if (gameState.status !== 'playing') return;
    if (activePowerUp) { applyPowerUp(smallGridIndex, cellIndex); return; }
    const targetGrid = gameState.board[smallGridIndex];
    const targetCell = targetGrid.cells[cellIndex];
    if (targetCell.blockedTurns && targetCell.blockedTurns > 0) return;
    if (targetGrid.winner || targetCell.player) return;
    const newBoard = [...gameState.board];
    const newSmallGrid = { ...newBoard[smallGridIndex] };
    const newCells = [...newSmallGrid.cells];
    newCells[cellIndex] = { player: gameState.currentPlayer, blockedTurns: 0 };
    newSmallGrid.cells = newCells;
    newBoard[smallGridIndex] = newSmallGrid;
    endTurn(newBoard, null);
  };

  const isWaiting = gameState.status === 'waiting';
  const isGameOver = gameState.status !== 'playing' && gameState.status !== 'waiting' && !gameState.isPaused;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[300px] h-[300px] bg-pink-500/5 blur-[100px] rounded-full" />
      </div>

      {/* Header Minimaliste */}
      <header className={cn(
        "w-full h-16 border-b border-white/5 flex items-center justify-between px-6 lg:px-10 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-[100] transition-all duration-700",
        isWaiting && "blur-sm opacity-50 grayscale"
      )}>
        <div className="flex items-center gap-8">
          <h1 className="text-sm font-black uppercase tracking-widest text-white">
            Ultimate Tic Tac Toe
          </h1>
          
          <div className={cn(
            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border-2 flex items-center gap-3 transition-all",
            gameState.currentPlayer === 'X' ? "border-blue-500/30 text-blue-400 bg-blue-500/5" : "border-pink-500/30 text-pink-400 bg-pink-500/5",
            isWaiting && "opacity-0"
          )}>
            <span>Au tour de {gameState.currentPlayer}</span>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5 min-w-[45px]">
              <Clock className={cn("w-3 h-3", gameState.timeLeft <= 2 ? "text-red-500 animate-pulse" : "opacity-50")} />
              <span className={cn(gameState.timeLeft <= 2 && "text-red-500")}>{gameState.timeLeft}s</span>
            </div>
          </div>
        </div>

        {/* Timer Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/5">
          <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: isWaiting ? "0%" : `${(gameState.timeLeft / 5) * 100}%` }}
            transition={{ duration: 1, ease: "linear" }}
            className={cn(
              "h-full transition-colors",
              gameState.timeLeft <= 2 ? "bg-red-500" : (gameState.currentPlayer === 'X' ? "bg-blue-500" : "bg-pink-500")
            )}
          />
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={togglePause}
            disabled={gameState.status !== 'playing'}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border",
              gameState.isPaused ? "bg-white text-slate-950 border-white" : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10",
              gameState.status !== 'playing' && "hidden"
            )}
          >
            {gameState.isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {gameState.isPaused ? "Reprendre" : "Pause"}
          </button>

          <button 
            onClick={isWaiting ? startGame : resetGame}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
              isWaiting 
                ? "bg-white text-slate-950 border-white hover:bg-slate-200" 
                : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
            )}
          >
            {isWaiting ? <Play className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
            {isWaiting ? "Prêt" : "Reset"}
          </button>
        </div>
      </header>

      {/* Zone de Jeu */}
      <main className="relative flex-1 flex items-center justify-center p-6 max-w-7xl mx-auto w-full z-10 overflow-hidden">
        
        {/* Layout Animé : Cartes au centre en 'waiting', sur les côtés en 'playing' */}
        <div className={cn(
          "w-full flex transition-all duration-1000 ease-in-out",
          isWaiting ? "flex-row justify-center gap-12" : "flex-col md:flex-row justify-center gap-8 lg:gap-12"
        )}>
          
          <PlayerCard 
            player="X" name={gameState.playerInfo.X.name} avatar={gameState.playerInfo.X.avatar}
            score={gameState.scores.X} isTurn={gameState.currentPlayer === 'X'} powerUps={gameState.powerUps.X} 
            onPowerUpClick={(id) => handlePowerUpClick(id, 'X')} activePowerUpId={activePowerUp?.player === 'X' ? activePowerUp.id : null}
            onAvatarClick={() => openAvatarEditor('X')} isEditable={isWaiting}
          />

          {/* Plateau Central - Flou si en attente */}
          <motion.div 
            layout
            className={cn(
              "relative p-2 rounded-2xl bg-slate-900 border border-white/5 shadow-2xl w-full max-w-[500px] transition-all duration-700",
              isWaiting ? "blur-2xl opacity-20 scale-90 pointer-events-none grayscale" : "blur-0 opacity-100 scale-100"
            )}
          >
            <div className="grid grid-cols-3 gap-2 aspect-square">
              {gameState.board.map((smallGrid, sgIndex) => (
                <div key={sgIndex} className={cn(
                  "relative grid grid-cols-3 gap-1 p-1.5 rounded-xl transition-all duration-300 bg-slate-950 border-2 border-white/5",
                  smallGrid.winner === 'X' ? "bg-blue-500/5 border-blue-500/10" : smallGrid.winner === 'O' ? "bg-pink-500/5 border-pink-500/10" : ""
                )}>
                  {smallGrid.cells.map((cell, cIndex) => (
                    <button key={cIndex} onClick={() => handleCellClick(sgIndex, cIndex)}
                      disabled={!activePowerUp && (!!cell.player || !!smallGrid.winner || (cell.blockedTurns! > 0))}
                      className={cn(
                        "aspect-square rounded flex items-center justify-center text-lg lg:text-xl font-black transition-all relative overflow-hidden",
                        !cell.player && !smallGrid.winner && !(cell.blockedTurns! > 0) && "bg-white/5 hover:bg-white/10 active:scale-90",
                        cell.player === 'X' ? "text-blue-500" : cell.player === 'O' ? "text-pink-500" : "text-white/5",
                        cell.blockedTurns! > 0 && "bg-red-500/10 cursor-not-allowed opacity-50"
                      )}
                    >
                      {cell.player || ""}
                      {cell.blockedTurns! > 0 && <Lock className="absolute inset-0 m-auto w-3 h-3 text-red-500 opacity-40" />}
                    </button>
                  ))}
                  {smallGrid.winner && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 rounded-xl backdrop-blur-[1px] z-10">
                      <span className={cn("text-3xl font-black italic tracking-tighter", smallGrid.winner === 'X' ? "text-blue-500" : "text-pink-500")}>
                        {smallGrid.winner}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <PlayerCard 
            player="O" name={gameState.playerInfo.O.name} avatar={gameState.playerInfo.O.avatar}
            score={gameState.scores.O} isTurn={gameState.currentPlayer === 'O'} powerUps={gameState.powerUps.O} 
            onPowerUpClick={(id) => handlePowerUpClick(id, 'O')} activePowerUpId={activePowerUp?.player === 'O' ? activePowerUp.id : null}
            onAvatarClick={() => openAvatarEditor('O')} isEditable={isWaiting}
          />
        </div>

        {/* Bouton Démarrer Flottant (uniquement en waiting ou game over) */}
        <AnimatePresence>
          {(isWaiting || isGameOver) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="absolute inset-0 flex items-center justify-center z-[100] pointer-events-none"
            >
              <div className="pointer-events-auto flex flex-col items-center gap-6">
                {isGameOver && (
                  <div className="text-center mb-4 space-y-2">
                    <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase">
                      {gameState.status === 'draw' ? "Match Nul" : "Victoire !"}
                    </h2>
                    <p className="text-slate-400 font-bold tracking-[0.3em] uppercase text-xs">
                      {gameState.status === 'X_wins' ? "BLEU a triomphé" : gameState.status === 'O_wins' ? "ROUGE a triomphé" : "Égalité parfaite"}
                    </p>
                  </div>
                )}
                
                <button 
                  onClick={isGameOver ? resetGame : startGame}
                  className="px-12 py-6 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-4 hover:scale-110 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.2)]"
                >
                  {isGameOver ? "Nouvelle Partie" : "Prêt"}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modal Éditeur d'Avatar (Gardé en overlay car c'est une action ponctuelle) */}
      <AnimatePresence>
        {cameraPlayer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-6"
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 p-8 rounded-2xl text-center max-w-sm w-full border border-white/10 shadow-2xl"
            >
              <h2 className="text-xl font-black mb-6 uppercase italic tracking-tighter text-white">
                Avatar : {gameState.playerInfo[cameraPlayer!].name}
              </h2>
              {!isEmojiPickerOpen ? (
                <div className="flex flex-col gap-6">
                  <div className="relative aspect-square w-full bg-black rounded-xl overflow-hidden border-2 border-white/10">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover mirror" />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={capturePhoto} className="flex-1 py-3 bg-white text-slate-950 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
                      <Camera className="w-4 h-4" /> Capturer
                    </button>
                    <button onClick={() => setIsEmojiPickerOpen(true)} className="p-3 bg-white/5 text-white rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-4 gap-3">
                    {['👤', '🤖', '👾', '🦊', '🐱', '🐲', '🚀', '🔥', '⚡️', '🌟', '💎', '🎯'].map(emoji => (
                      <button key={emoji} onClick={() => selectEmoji(emoji)} className="aspect-square bg-white/5 rounded-xl text-2xl flex items-center justify-center hover:bg-white/10 border border-white/10 transition-all">
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setIsEmojiPickerOpen(false)} className="py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Retour Caméra</button>
                </div>
              )}
              <button onClick={closeCamera} className="mt-6 w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors">Annuler</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
