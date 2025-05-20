
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
  type: 'normal' | 'bonus';
  color: string;
  glowColor: string;
}

// Constants
const PLAYER_SIZE = 32; // px
const MAX_MISSED_STARS = 10;
const STAR_VY_MIN = 0.8; // Slightly faster minimum speed
const STAR_VY_MAX = 1.8; // Slightly faster maximum speed
const STAR_GENERATION_PROBABILITY = 0.04; // Slightly higher probability
const BONUS_STAR_CHANCE = 0.1; // 10% chance for a bonus star

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
        if (playerRef.current && gameStarted) {
          playerRef.current.style.top = `${gameAreaSize.current.height - PLAYER_SIZE - 20}px`; // Ensure player is visible
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
  }, [gameStarted]);

  const createStar = useCallback(() => {
    if (!gameAreaSize.current.width) return null;
    lastStarId.current += 1;
    const isBonus = Math.random() < BONUS_STAR_CHANCE;
    return {
      id: lastStarId.current,
      x: Math.random() * (gameAreaSize.current.width - 30) + 15, // Ensure stars are not too close to edges
      y: -20,
      size: isBonus ? Math.random() * 6 + 8 : Math.random() * 5 + 5, // Bonus stars slightly bigger
      opacity: Math.random() * 0.4 + 0.6, // Brighter stars
      vx: (Math.random() - 0.5) * 0.5, // Slightly more horizontal drift
      vy: Math.random() * (STAR_VY_MAX - STAR_VY_MIN) + STAR_VY_MIN,
      type: isBonus ? 'bonus' : 'normal',
      color: isBonus ? 'bg-yellow-400' : 'bg-accent',
      glowColor: isBonus ? 'hsl(45 90% 60%)' : 'hsl(var(--accent))',
    };
  }, []);

  const startGame = () => {
    setScore(0);
    setMissed(0);
    setIsGameOver(false);
    // Initial burst of stars
    const initialStars = [];
    for(let i=0; i < 5; i++) {
        const newStar = createStar();
        if(newStar) initialStars.push(newStar);
    }
    setStars(initialStars);
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

  useEffect(() => {
    if (!gameStarted || isGameOver || !isClient) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      return;
    }

    const gameLoop = () => {
      setStars(prevStars => {
        let newMissedCount = missed;
        const updatedStars = prevStars.map(star => ({
          ...star,
          x: star.x + star.vx,
          y: star.y + star.vy,
        })).filter(star => {
          if (playerRef.current && gameAreaRef.current) {
            const playerRect = playerRef.current.getBoundingClientRect();
            const gameAreaRectVal = gameAreaRef.current.getBoundingClientRect();
            
            // Star's screen coordinates (center)
            const starCenterX = gameAreaRectVal.left + star.x;
            const starCenterY = gameAreaRectVal.top + star.y;

            // Collision detection (circle vs circle for simplicity, approximating player and star as circles)
            const distanceX = (playerRect.left + PLAYER_SIZE / 2) - starCenterX;
            const distanceY = (playerRect.top + PLAYER_SIZE / 2) - starCenterY;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

            if (distance < (PLAYER_SIZE / 2 + star.size / 2)) {
              setScore(s => s + (star.type === 'bonus' ? 50 : 10));
              return false; // Star caught
            }
          }

          if (star.y > gameAreaSize.current.height + star.size) {
            newMissedCount++;
            return false; // Star missed
          }
          // Keep star if it's within horizontal bounds or slightly outside (for smooth appearance/disappearance)
          return star.x > -star.size * 2 && star.x < gameAreaSize.current.width + star.size * 2;
        });

        if (newMissedCount !== missed) {
          setMissed(newMissedCount);
          if (newMissedCount >= MAX_MISSED_STARS) {
            setIsGameOver(true);
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
      playerRef.current.style.top = `${gameAreaSize.current.height - PLAYER_SIZE - 20}px`;
      playerRef.current.style.left = `${gameAreaSize.current.width / 2}px`;
    }
  }, [gameStarted, isClient]);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl shadow-2xl overflow-hidden relative flex items-center justify-center">
        <p className="text-primary-foreground text-lg">{t('loadingGameMessage')}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative select-none">
      <div
        ref={gameAreaRef}
        className="w-full h-full bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl shadow-2xl overflow-hidden relative cursor-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onTouchStart={e => e.preventDefault()}
      >
        {/* Static background stars for depth */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={`bg-star-${i}`}
            className="absolute rounded-full bg-slate-500"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 0.5}px`,
              height: `${Math.random() * 2 + 0.5}px`,
              opacity: Math.random() * 0.3 + 0.1,
            }}
          />
        ))}

        {gameStarted && !isGameOver && (
          <>
            <div
              ref={playerRef}
              className="absolute bg-primary rounded-full shadow-lg transform -translate-x-1/2 pointer-events-none"
              style={{
                width: `${PLAYER_SIZE}px`,
                height: `${PLAYER_SIZE}px`,
                boxShadow: `
                  0 0 12px 3px hsl(var(--primary)/0.6), 
                  0 0 20px 6px hsl(var(--primary)/0.4),
                  0 0 30px 10px hsl(var(--primary)/0.2)
                `,
              }}
              data-ai-hint="glowing orb"
            />
            {stars.map(star => (
              <div
                key={star.id}
                className={cn("absolute rounded-full", star.color)}
                style={{
                  left: `${star.x}px`,
                  top: `${star.y}px`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  opacity: star.opacity,
                  boxShadow: `0 0 ${star.type === 'bonus' ? '12px 4px' : '8px 2px'} ${star.glowColor}${Math.floor(star.opacity * 100)}`, // Opacity in hex
                  transform: 'translate(-50%, -50%)',
                  transition: 'opacity 0.2s ease-out, transform 0.2s ease-out', // For potential future catch animation
                }}
                data-ai-hint={star.type === 'bonus' ? "bonus star" : "star item"}
              />
            ))}
          </>
        )}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
        {!gameStarted && !isGameOver && (
          <Button 
            onClick={startGame} 
            className="pointer-events-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            {t('startGameButton')}
          </Button>
        )}

        {gameStarted && !isGameOver && (
          <div className="absolute top-4 left-4 text-left text-primary-foreground bg-slate-700/70 backdrop-blur-sm p-3 rounded-lg shadow-lg space-y-1 border border-slate-600/50">
            <p className="text-lg font-semibold">{t('scoreLabel')} {score}</p>
            <p className="text-sm">{t('missedLabel')} {missed} / {MAX_MISSED_STARS}</p>
          </div>
        )}

        {isGameOver && (
          <div className="text-center bg-slate-800/90 backdrop-blur-md p-6 md:p-10 rounded-xl shadow-2xl pointer-events-auto border border-slate-700/60">
            <h2 className="text-4xl font-bold text-primary mb-3">{t('gameOverTitle')}</h2>
            <p className="text-2xl text-primary-foreground mb-2">{t('finalScoreLabel')} {score}</p>
            <p className="text-lg text-muted-foreground mb-6">
              {missed >= MAX_MISSED_STARS ? t('tooManyMissedText') : t('goodTryText')}
            </p>
            <Button 
              onClick={startGame} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-4 shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              {t('restartGameButton')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
