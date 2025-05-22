
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { Award, TrendingUp, Rocket, Sparkle, Volume2, VolumeX, Play, RefreshCw } from 'lucide-react';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  vx: number;
  vy: number;
  type: 'normal' | 'bonus';
  color: string;
  glowColor: string;
  rotation: number;
  rotationSpeed: number;
}

const PLAYER_SIZE = 36; // px
const MAX_MISSED_STARS = 10;
const STAR_VY_MIN = 0.7;
const STAR_VY_MAX = 1.5;
const STAR_GENERATION_PROBABILITY = 0.04;
const BONUS_STAR_CHANCE = 0.12;
const HIGH_SCORE_KEY = 'slumberAiStarCatcherHighScore';

export default function StarCatcherGame() {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<Star[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const lastStarId = useRef(0);
  const gameAreaSize = useRef({ width: 0, height: 0 });

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showBonusText, setShowBonusText] = useState<{text: string; x: number; y: number} | null>(null);
  const bonusTextTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMuted, setIsMuted] = useState(true); // Sound toggle placeholder

  const t = useTranslations('SleepGamePage');

  useEffect(() => {
    setIsClient(true);
    const storedHighScore = localStorage.getItem(HIGH_SCORE_KEY);
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore, 10));
    }

    const updateGameAreaSize = () => {
      if (gameAreaRef.current) {
        gameAreaSize.current = {
          width: gameAreaRef.current.offsetWidth,
          height: gameAreaRef.current.offsetHeight,
        };
        if (playerRef.current && gameStarted) {
          playerRef.current.style.top = `${gameAreaSize.current.height - PLAYER_SIZE - 20}px`;
        }
      }
    };
    updateGameAreaSize();
    window.addEventListener('resize', updateGameAreaSize);

    const styleId = "star-catcher-animations";
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes bg-star-twinkle {
          0%, 100% { opacity: 0.1; transform: scale(0.8); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .bg-star-animate { animation: bg-star-twinkle 5s infinite alternate; }

        @keyframes bonus-text-pop {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -80%) scale(0.8); opacity: 0; }
        }
        .animate-bonus-text-pop {
          animation: bonus-text-pop 1.2s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      window.removeEventListener('resize', updateGameAreaSize);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (bonusTextTimeoutRef.current) clearTimeout(bonusTextTimeoutRef.current);
    };
  }, [gameStarted]);

  const createStar = useCallback(() => {
    if (!gameAreaSize.current.width) return null;
    lastStarId.current += 1;
    const isBonus = Math.random() < BONUS_STAR_CHANCE;
    return {
      id: lastStarId.current,
      x: Math.random() * (gameAreaSize.current.width - 40) + 20,
      y: -30,
      size: isBonus ? Math.random() * 8 + 14 : Math.random() * 6 + 8,
      opacity: Math.random() * 0.3 + 0.7,
      vx: (Math.random() - 0.5) * 0.5,
      vy: Math.random() * (STAR_VY_MAX - STAR_VY_MIN) + STAR_VY_MIN,
      type: isBonus ? 'bonus' : 'normal',
      color: isBonus ? 'bg-yellow-400' : 'bg-cyan-400',
      glowColor: isBonus ? 'hsl(50 100% 70%)' : 'hsl(180 100% 70%)',
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
    };
  }, []);

  const startGame = () => {
    setScore(0);
    setMissed(0);
    setIsGameOver(false);
    setStars(Array.from({ length: 5 }, createStar).filter(Boolean) as Star[]);
    setGameStarted(true);
    if (playerRef.current && gameAreaSize.current.width && gameAreaSize.current.height) {
      playerRef.current.style.top = `${gameAreaSize.current.height - PLAYER_SIZE - 20}px`;
      playerRef.current.style.left = `${gameAreaSize.current.width / 2}px`;
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!gameStarted || isGameOver || !playerRef.current || !gameAreaRef.current) return;
    const gameAreaRect = gameAreaRef.current.getBoundingClientRect();
    let x = e.clientX - gameAreaRect.left;
    x = Math.max(PLAYER_SIZE / 2, Math.min(x, gameAreaRect.width - PLAYER_SIZE / 2));
    playerRef.current.style.left = `${x}px`;
  }, [gameStarted, isGameOver]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!gameStarted || isGameOver || !playerRef.current || !gameAreaRef.current || e.touches.length === 0) return;
    const gameAreaRect = gameAreaRef.current.getBoundingClientRect();
    let x = e.touches[0].clientX - gameAreaRect.left;
    x = Math.max(PLAYER_SIZE / 2, Math.min(x, gameAreaRect.width - PLAYER_SIZE / 2));
    playerRef.current.style.left = `${x}px`;
  }, [gameStarted, isGameOver]);

  const triggerBonusText = (text: string, x: number, y: number) => {
    setShowBonusText({text, x, y});
    if (bonusTextTimeoutRef.current) clearTimeout(bonusTextTimeoutRef.current);
    bonusTextTimeoutRef.current = setTimeout(() => setShowBonusText(null), 1200);
  };

  useEffect(() => {
    if (!gameStarted || isGameOver || !isClient) {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      return;
    }

    const gameLoop = () => {
      setStars(prevStars => {
        let newMissedCount = missed;
        const updatedStars = prevStars.map(star => ({
          ...star,
          x: star.x + star.vx,
          y: star.y + star.vy,
          rotation: star.rotation + star.rotationSpeed,
        })).filter(star => {
          if (playerRef.current && gameAreaRef.current) {
            const playerRect = playerRef.current.getBoundingClientRect();
            const gameAreaRectVal = gameAreaRef.current.getBoundingClientRect();
            const starScreenX = gameAreaRectVal.left + star.x;
            const starScreenY = gameAreaRectVal.top + star.y;

            const distanceX = (playerRect.left + PLAYER_SIZE / 2) - starScreenX;
            const distanceY = (playerRect.top + PLAYER_SIZE / 2) - starScreenY;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

            if (distance < (PLAYER_SIZE / 2 + star.size / 2 + 5)) { // +5 for easier catch
              const points = star.type === 'bonus' ? 50 : 10;
              setScore(s => s + points);
              if(star.type === 'bonus') triggerBonusText(`+${points} ✨`, star.x, star.y);
              return false;
            }
          }

          if (star.y > gameAreaSize.current.height + star.size) {
            newMissedCount++;
            return false;
          }
          return star.x > -star.size * 2 && star.x < gameAreaSize.current.width + star.size * 2;
        });

        if (newMissedCount !== missed) {
          setMissed(newMissedCount);
          if (newMissedCount >= MAX_MISSED_STARS) {
            setIsGameOver(true);
            if (score > highScore) {
              setHighScore(score);
              localStorage.setItem(HIGH_SCORE_KEY, score.toString());
            }
          }
        }

        if (Math.random() < STAR_GENERATION_PROBABILITY && gameAreaSize.current.width && !isGameOver) {
          const newStar = createStar();
          if (newStar) updatedStars.push(newStar);
        }
        return updatedStars;
      });
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    if (gameAreaSize.current.width > 0 && !isGameOver) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    } else if (isGameOver && animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameStarted, isGameOver, createStar, missed, isClient, score, highScore]);

  useEffect(() => {
    if (gameStarted && playerRef.current && gameAreaSize.current.height && gameAreaSize.current.width) {
      playerRef.current.style.top = `${gameAreaSize.current.height - PLAYER_SIZE - 30}px`; // Slightly higher
      playerRef.current.style.left = `${gameAreaSize.current.width / 2}px`;
    }
  }, [gameStarted, isClient]);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 rounded-xl shadow-2xl overflow-hidden relative flex items-center justify-center">
        <p className="text-slate-300 text-lg">{t('loadingGameMessage')}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative select-none font-sans">
      <div
        ref={gameAreaRef}
        className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-950 to-blue-950 rounded-xl shadow-2xl overflow-hidden relative cursor-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onTouchStart={e => e.preventDefault()}
      >
        {/* Decorative Background Stars */}
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={`bg-star-${i}`}
            className="absolute rounded-full bg-slate-600 bg-star-animate"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2.5 + 0.5}px`,
              height: `${Math.random() * 2.5 + 0.5}px`,
              animationDelay: `${Math.random() * 5}s`,
              boxShadow: `0 0 6px 1px hsla(200, 80%, 70%, 0.3)`,
            }}
            data-ai-hint="background star"
          />
        ))}

        {gameStarted && !isGameOver && (
          <>
            <div
              ref={playerRef}
              className="absolute rounded-full shadow-lg transform -translate-x-1/2 pointer-events-none animate-float"
              style={{
                width: `${PLAYER_SIZE}px`,
                height: `${PLAYER_SIZE}px`,
                background: 'radial-gradient(circle, hsl(180 80% 70%), hsl(180 90% 50%))',
                boxShadow: `
                  0 0 10px 3px hsl(180 80% 70% / 0.7),
                  0 0 20px 6px hsl(180 80% 60% / 0.5),
                  0 0 35px 10px hsl(180 80% 50% / 0.3)
                `,
              }}
              data-ai-hint="player orb"
            >
              <Rocket className="w-1/2 h-1/2 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80" />
            </div>
            {stars.map(star => (
              <div
                key={star.id}
                className={cn("absolute rounded-full flex items-center justify-center", star.color)}
                style={{
                  left: `${star.x}px`,
                  top: `${star.y}px`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  opacity: star.opacity,
                  boxShadow: `0 0 ${star.type === 'bonus' ? '18px 7px' : '10px 4px'} ${star.glowColor}${Math.floor(star.opacity * 100)}`,
                  transform: `translate(-50%, -50%) rotate(${star.rotation}deg)`,
                  transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
                }}
                data-ai-hint={star.type === 'bonus' ? "bonus star" : "star item"}
              >
                <Sparkle className={cn("w-2/3 h-2/3", star.type === 'bonus' ? 'text-yellow-100' : 'text-cyan-100')} />
              </div>
            ))}
            {showBonusText && (
              <div
                className="absolute text-2xl font-bold animate-bonus-text-pop pointer-events-none"
                style={{ left: `${showBonusText.x}px`, top: `${showBonusText.y}px`, color: 'hsl(50 100% 70%)', textShadow: '0 0 10px hsl(50 100% 60%)' }}
              >
                {showBonusText.text}
              </div>
            )}
          </>
        )}
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-3 text-slate-100">
        {!gameStarted && !isGameOver && (
          <div className="text-center bg-slate-800/70 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl pointer-events-auto border border-slate-700/60">
            <h2 className="text-2xl font-semibold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">{t('startGamePrompt')}</h2>
            <Button
              onClick={startGame}
              className="pointer-events-auto bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white text-lg px-10 py-7 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 transform focus:ring-4 focus:ring-cyan-300/50"
            >
              <Play className="mr-2 h-5 w-5" /> {t('startGameButton')}
            </Button>
            {highScore > 0 && (
              <p className="mt-6 text-md text-amber-400 flex items-center justify-center gap-2">
                <Award className="h-5 w-5" /> {t('highScoreLabel')} {highScore}
              </p>
            )}
             <Button variant="ghost" size="sm" onClick={() => setIsMuted(!isMuted)} className="mt-5 text-slate-400 hover:text-slate-200 pointer-events-auto">
                {isMuted ? <VolumeX className="mr-1.5 h-4 w-4" /> : <Volume2 className="mr-1.5 h-4 w-4" />}
                {isMuted ? t('soundOff') : t('soundOn')}
              </Button>
          </div>
        )}

        {gameStarted && !isGameOver && (
          <div className="absolute top-3 left-3 text-left text-slate-100 bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-xl shadow-lg space-y-1.5 border border-slate-700/50">
            <p className="text-lg font-medium">{t('scoreLabel')} <span className="font-bold text-cyan-300">{score}</span></p>
            <p className="text-sm text-slate-300">{t('missedLabel')} <span className="font-bold text-pink-400">{missed}</span> / {MAX_MISSED_STARS}</p>
            {highScore > 0 && <p className="text-xs text-amber-400/80 flex items-center gap-1"><Award className="h-3.5 w-3.5"/> {t('highScoreLabel')} {highScore}</p>}
          </div>
        )}

        {isGameOver && (
          <div className="text-center bg-slate-800/80 backdrop-blur-md p-6 md:p-10 rounded-2xl shadow-xl pointer-events-auto border border-slate-700/60">
            <h2 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">{t('gameOverTitle')}</h2>
            <p className="text-2xl text-slate-100 mb-1">{t('finalScoreLabel')} <span className="font-bold text-cyan-300">{score}</span></p>
            {score > 0 && score >= highScore && (
              <p className="text-lg text-amber-300 mb-2 flex items-center justify-center gap-1.5">
                <TrendingUp className="h-5 w-5" /> {t('newHighScoreText')}
              </p>
            )}
            <p className="text-sm text-slate-300 mb-1">{t('highScoreLabel')} {highScore}</p>
            <p className="text-base text-slate-300/90 mb-6">
              {missed >= MAX_MISSED_STARS ? t('tooManyMissedText') : t('goodTryText')}
            </p>
            <Button
              onClick={startGame}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white text-lg px-8 py-4 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 transform focus:ring-4 focus:ring-cyan-300/50"
            >
              <RefreshCw className="mr-2 h-5 w-5" /> {t('restartGameButton')}
            </Button>
             <Button variant="ghost" size="sm" onClick={() => setIsMuted(!isMuted)} className="mt-5 text-slate-400 hover:text-slate-200 pointer-events-auto">
                {isMuted ? <VolumeX className="mr-1.5 h-4 w-4" /> : <Volume2 className="mr-1.5 h-4 w-4" />}
                {isMuted ? t('soundOff') : t('soundOn')}
              </Button>
          </div>
        )}
      </div>
    </div>
  );
}
