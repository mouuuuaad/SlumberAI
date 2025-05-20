
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  vx: number; // horizontal velocity for gentle drift
  vy: number; // vertical velocity
}

const StarCatcherGame: React.FC = () => {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<Star[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const lastStarId = useRef(0);
  const gameAreaSize = useRef({ width: 0, height: 0 });

  const createStar = useCallback(() => {
    if (!gameAreaSize.current.width) return null;
    lastStarId.current += 1;
    return {
      id: lastStarId.current,
      x: Math.random() * gameAreaSize.current.width,
      y: -20, // Start above the screen
      size: Math.random() * 5 + 3, // Star size between 3px and 8px
      opacity: Math.random() * 0.5 + 0.5, // Opacity between 0.5 and 1
      vx: (Math.random() - 0.5) * 0.2, // Gentle horizontal drift
      vy: Math.random() * 0.5 + 0.3, // Falling speed
    };
  }, []);

  useEffect(() => {
    const updateGameAreaSize = () => {
      if (gameAreaRef.current) {
        gameAreaSize.current = {
          width: gameAreaRef.current.offsetWidth,
          height: gameAreaRef.current.offsetHeight,
        };
      }
    };
    updateGameAreaSize();
    window.addEventListener('resize', updateGameAreaSize);
    
    // Initialize with a few stars
    setStars(Array.from({ length: 10 }, createStar).filter(s => s !== null) as Star[]);

    return () => {
      window.removeEventListener('resize', updateGameAreaSize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [createStar]);


  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (playerRef.current && gameAreaRef.current) {
      const gameAreaRect = gameAreaRef.current.getBoundingClientRect();
      let x = e.clientX - gameAreaRect.left;
      let y = e.clientY - gameAreaRect.top;

      // Keep player within bounds
      const playerSize = playerRef.current.offsetWidth; // Assuming square
      x = Math.max(playerSize / 2, Math.min(x, gameAreaRect.width - playerSize / 2));
      y = Math.max(playerSize / 2, Math.min(y, gameAreaRect.height - playerSize / 2));
      
      playerRef.current.style.left = `${x}px`;
      playerRef.current.style.top = `${y}px`;
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (playerRef.current && gameAreaRef.current && e.touches.length > 0) {
      const gameAreaRect = gameAreaRef.current.getBoundingClientRect();
      let x = e.touches[0].clientX - gameAreaRect.left;
      let y = e.touches[0].clientY - gameAreaRect.top;

      const playerSize = playerRef.current.offsetWidth;
      x = Math.max(playerSize / 2, Math.min(x, gameAreaRect.width - playerSize / 2));
      y = Math.max(playerSize / 2, Math.min(y, gameAreaRect.height - playerSize / 2));

      playerRef.current.style.left = `${x}px`;
      playerRef.current.style.top = `${y}px`;
    }
  };

  useEffect(() => {
    const gameLoop = () => {
      setStars(prevStars => {
        const newStars = prevStars
          .map(star => ({
            ...star,
            x: star.x + star.vx,
            y: star.y + star.vy,
          }))
          .filter(star => star.y < gameAreaSize.current.height + 20 && star.x > -20 && star.x < gameAreaSize.current.width + 20); // Remove off-screen stars

        // Add new star periodically
        if (Math.random() < 0.02 && gameAreaSize.current.width) { // Adjust probability as needed
          const newStar = createStar();
          if (newStar) newStars.push(newStar);
        }
        
        // Collision detection (simple)
        if (playerRef.current) {
          const playerRect = playerRef.current.getBoundingClientRect();
          const gameAreaRect = gameAreaRef.current!.getBoundingClientRect();

          return newStars.filter(star => {
            const starScreenX = gameAreaRect.left + star.x;
            const starScreenY = gameAreaRect.top + star.y;
            
            const caught = !(
              playerRect.right < starScreenX - star.size / 2 ||
              playerRect.left > starScreenX + star.size / 2 ||
              playerRect.bottom < starScreenY - star.size / 2 ||
              playerRect.top > starScreenY + star.size / 2
            );
            return !caught; // Remove caught stars
          });
        }
        return newStars;
      });
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    if (gameAreaSize.current.width > 0) {
        animationFrameId.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [createStar]);


  return (
    <div
      ref={gameAreaRef}
      className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl shadow-2xl overflow-hidden relative cursor-none"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onTouchStart={e => e.preventDefault()} // Prevents page scroll on touch
    >
      {/* Player Orb */}
      <div
        ref={playerRef}
        className="absolute w-8 h-8 bg-primary rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ 
            boxShadow: '0 0 15px 5px hsl(var(--primary)/0.7), 0 0 25px 10px hsl(var(--primary)/0.5)',
            transition: 'left 0.05s linear, top 0.05s linear' // Smooth out movement slightly
        }}
        data-ai-hint="orb light"
      />

      {/* Stars */}
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
            transform: 'translate(-50%, -50%)', // Center the star on its x,y
          }}
          data-ai-hint="star light"
        />
      ))}
    </div>
  );
};

export default StarCatcherGame;
