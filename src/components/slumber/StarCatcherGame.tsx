
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  vx: number; // horizontal velocity for gentle drift
  vy: number; // vertical velocity
}

// Constants
const PLAYER_SIZE = 32; // px
const MAX_MISSED_STARS = 10;
const STAR_VY_MIN = 0.7; // Slightly faster minimum speed
const STAR_VY_MAX = 1.6; // Slightly faster maximum speed
const STAR_GENERATION_PROBABILITY = 0.035; // Slightly higher probability

export default function StarCatcherGame() {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<Star[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const lastStarId = useRef(0);
  const gameAreaSize = useRef({ width: 0, height: 0 });

  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const t = useTranslations('SleepGamePage');

  useEffect(() => {
    setIsClient(true);
    const updateGameAreaSize = () => {
      if (gameAreaRef.current) {
        gameAreaSize.current = {
          width: gameAreaRef.current.offsetWidth,
          height: gameAreaRef.current.offsetHeight,
        };
         // Update player Y position on resize if game has started
        if (playerRef.current && gameStarted) {
            playerRef.current.style.top = `${gameAreaSize.current.height - PLAYER_SIZE - 10}px`;
        }
      }
    };
    updateGameAreaSize();
    window.addEventListener('resize', updateGameAreaSize);
    
    return () => {
      window.removeEventListener('resize', updateGameAreaSize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameStarted]); // Rerun if gameStarted changes to correctly position player

  const createStar = useCallback(() => {
    if (!gameAreaSize.current.width) return null;
    lastStarId.current += 1;
    return {
      id: lastStarId.current,
      x: Math.random() * (gameAreaSize.current.width - 20) + 10,
      y: -20,
      size: Math.random() * 5 + 5,
      opacity: Math.random() * 0.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: Math.random() * (STAR_VY_MAX - STAR_VY_MIN) + STAR_VY_MIN,
    };
  }, []);

  const startGame = () => {
    setScore(0);
    setMissed(0);
    setIsGameOver(false);
    setStars(Array.from({ length: 5 }, createStar).filter(s => s !== null) as Star[]);
    setGameStarted(true);
     if (playerRef.current && gameAreaSize.current.width && gameAreaSize.current.height) {
        playerRef.current.style.top = `${gameAreaSize.current.height - PLAYER_SIZE - 10}px`;
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

  useEffect(() => {
    if (!gameStarted || isGameOver || !isClient) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      return;
    }

    const gameLoop = () => {
      setStars(prevStars => {
        let newMissedCount = missed; // Use current state 'missed'
        const updatedStars = prevStars.map(star => ({
          ...star,
          x: star.x + star.vx,
          y: star.y + star.vy,
        })).filter(star => {
          if (playerRef.current && gameAreaRef.current) {
            const playerRect = playerRef.current.getBoundingClientRect();
            const gameAreaRectVal = gameAreaRef.current.getBoundingClientRect();
            const starScreenX = gameAreaRectVal.left + star.x;
            const starScreenY = gameAreaRectVal.top + star.y;

            const caught = !(
              playerRect.right < starScreenX - star.size || // Adjusted for star center vs edge
              playerRect.left > starScreenX + star.size ||
              playerRect.bottom < starScreenY - star.size ||
              playerRect.top > starScreenY + star.size
            );

            if (caught) {
              setScore(s => s + 10); // Give 10 points per star
              return false;
            }
          }

          if (star.y > gameAreaSize.current.height + star.size) {
            newMissedCount++;
            return false;
          }
          return star.x > -star.size && star.x < gameAreaSize.current.width + star.size;
        });

        if (newMissedCount !== missed) {
          setMissed(newMissedCount);
          if (newMissedCount >= MAX_MISSED_STARS) {
            setIsGameOver(true);
            // setGameStarted(false); // Keep gameStarted true to show game over screen correctly
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
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameStarted, isGameOver, createStar, missed, isClient]);


  useEffect(() => {
    if (gameStarted && playerRef.current && gameAreaSize.current.height && gameAreaSize.current.width) {
        playerRef.current.style.top = `${gameAreaSize.current.height - PLAYER_SIZE - 10}px`;
        playerRef.current.style.left = `${gameAreaSize.current.width / 2}px`;
    }
  }, [gameStarted, isClient]); // Depends on gameStarted and isClient

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl shadow-2xl overflow-hidden relative flex items-center justify-center">
        <p className="text-primary-foreground text-lg">{t('loadingGameMessage')}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative select-none">
      <div
        ref={gameAreaRef}
        className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl shadow-2xl overflow-hidden relative cursor-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onTouchStart={e => e.preventDefault()}
      >
        {gameStarted && !isGameOver && (
            <>
                <div
                    ref={playerRef}
                    className="absolute bg-primary rounded-full shadow-lg transform -translate-x-1/2 pointer-events-none"
                    style={{
                    width: `${PLAYER_SIZE}px`,
                    height: `${PLAYER_SIZE}px`,
                    boxShadow: '0 0 15px 5px hsl(var(--primary)/0.7), 0 0 25px 10px hsl(var(--primary)/0.5)',
                    }}
                    data-ai-hint="orb light"
                />
                {stars.map(star => (
                    <div
                    key={star.id}
                    className="absolute rounded-full bg-accent"
                    style={{
                        left: `${star.x}px`,
                        top: `${star.y}px`,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        opacity: star.opacity,
                        boxShadow: '0 0 8px 2px hsl(var(--accent)/0.6)',
                        transform: 'translate(-50%, -50%)',
                    }}
                    data-ai-hint="star light"
                    />
                ))}
            </>
        )}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
        {!gameStarted && !isGameOver && (
          <Button onClick={startGame} className="pointer-events-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 shadow-xl">
            {t('startGameButton')}
          </Button>
        )}

        {gameStarted && !isGameOver && (
          <div className="absolute top-4 left-4 text-left text-primary-foreground bg-slate-700/60 backdrop-blur-sm p-3 rounded-lg shadow-md space-y-1">
            <p className="text-lg font-semibold">{t('scoreLabel')} {score}</p>
            <p className="text-sm">{t('missedLabel')} {missed} / {MAX_MISSED_STARS}</p>
          </div>
        )}

        {isGameOver && (
          <div className="text-center bg-slate-800/80 backdrop-blur-md p-6 md:p-10 rounded-xl shadow-2xl pointer-events-auto">
            <h2 className="text-4xl font-bold text-primary mb-3">{t('gameOverTitle')}</h2>
            <p className="text-2xl text-primary-foreground mb-2">{t('finalScoreLabel')} {score}</p>
            <p className="text-lg text-muted-foreground mb-6">
              {missed >= MAX_MISSED_STARS ? t('tooManyMissedText') : t('goodTryText')}
            </p>
            <Button onClick={startGame} className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-4 shadow-xl">
              {t('restartGameButton')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
