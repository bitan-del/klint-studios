import React, { useEffect, useRef } from 'react';

interface Meteor {
  id: number;
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  angle: number; // Diagonal angle
  type: 'ambient' | 'hover'; // Meteor type
  width: number; // Meteor thickness
}

export const MeteorEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const meteorsRef = useRef<Meteor[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, isMoving: false });
  const animationRef = useRef<number>();
  const lastSpawnRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse position
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, isMoving: true };
      
      // Create meteors near mouse (increased frequency)
      if (Math.random() > 0.5) { // 50% chance on each mouse move
        createMeteor(e.clientX + (Math.random() - 0.5) * 200, e.clientY - Math.random() * 100, 'hover');
      }
      
      // Extra meteors for dramatic effect
      if (Math.random() > 0.85) {
        createMeteor(e.clientX + (Math.random() - 0.5) * 300, e.clientY - Math.random() * 150, 'hover');
      }
    };

    const createMeteor = (x: number, y: number, type: 'ambient' | 'hover' = 'ambient') => {
      // Diagonal angle (falling from top-left to bottom-right, like shooting stars)
      const angle = Math.random() * 15 + 35; // 35-50 degrees
      
      const meteor: Meteor = {
        id: Date.now() + Math.random(),
        x: x,
        y: y,
        length: type === 'hover' 
          ? Math.random() * 100 + 60  // 60-160px (longer for hover)
          : Math.random() * 80 + 40,  // 40-120px (ambient)
        speed: type === 'hover'
          ? Math.random() * 4 + 3     // 3-7px per frame (faster)
          : Math.random() * 2 + 1.5,  // 1.5-3.5px per frame
        opacity: type === 'hover'
          ? Math.random() * 0.4 + 0.7 // 0.7-1.1 (brighter)
          : Math.random() * 0.3 + 0.4, // 0.4-0.7 (dimmer)
        angle: angle,
        type: type,
        width: type === 'hover'
          ? Math.random() * 1.5 + 2   // 2-3.5px
          : Math.random() * 1 + 1,    // 1-2px
      };
      meteorsRef.current.push(meteor);
      
      // Limit meteors (increased for more dramatic effect)
      if (meteorsRef.current.length > 60) {
        meteorsRef.current.shift();
      }
    };

    // Spawn ambient meteors constantly
    const spawnAmbientMeteors = () => {
      const now = Date.now();
      
      // Spawn 2-4 ambient meteors every 100ms
      if (now - lastSpawnRef.current > 100) {
        const spawnCount = Math.floor(Math.random() * 3) + 2; // 2-4 meteors
        
        for (let i = 0; i < spawnCount; i++) {
          // Random positions across the top and left edges
          const spawnX = Math.random() * (canvas.width + 400) - 200;
          const spawnY = Math.random() * -200 - 50;
          createMeteor(spawnX, spawnY, 'ambient');
        }
        
        lastSpawnRef.current = now;
      }
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn ambient meteors
      spawnAmbientMeteors();

      meteorsRef.current = meteorsRef.current.filter((meteor) => {
        // Calculate diagonal movement
        const radians = (meteor.angle * Math.PI) / 180;
        const dx = Math.cos(radians) * meteor.speed;
        const dy = Math.sin(radians) * meteor.speed;
        
        // Update position (diagonal fall)
        meteor.x += dx;
        meteor.y += dy;
        
        // Fade out based on type
        meteor.opacity -= meteor.type === 'hover' ? 0.008 : 0.006;

        // Remove if off screen or faded
        if (
          meteor.y > canvas.height + meteor.length || 
          meteor.x > canvas.width + meteor.length ||
          meteor.opacity <= 0
        ) {
          return false;
        }

        // Calculate end point of meteor trail
        const endX = meteor.x - Math.cos(radians) * meteor.length;
        const endY = meteor.y - Math.sin(radians) * meteor.length;

        // Draw meteor with glassmorphism effect
        const gradient = ctx.createLinearGradient(
          meteor.x,
          meteor.y,
          endX,
          endY
        );
        
        // Enhanced green gradient with more variation
        const intensity = meteor.type === 'hover' ? 1 : 0.7;
        gradient.addColorStop(0, `rgba(16, 185, 129, ${meteor.opacity * 0.9 * intensity})`); // emerald-500
        gradient.addColorStop(0.3, `rgba(52, 211, 153, ${meteor.opacity * 0.7 * intensity})`); // emerald-400
        gradient.addColorStop(0.7, `rgba(110, 231, 183, ${meteor.opacity * 0.4 * intensity})`); // emerald-300
        gradient.addColorStop(1, `rgba(167, 243, 208, ${meteor.opacity * 0.05 * intensity})`); // emerald-200

        // Draw glow effect (outer)
        ctx.shadowBlur = meteor.type === 'hover' ? 25 : 15;
        ctx.shadowColor = `rgba(16, 185, 129, ${meteor.opacity * 0.6})`;
        
        // Draw meteor trail
        ctx.strokeStyle = gradient;
        ctx.lineWidth = meteor.width;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Add glassmorphism effect (thinner inner highlight)
        ctx.shadowBlur = meteor.type === 'hover' ? 12 : 8;
        ctx.strokeStyle = `rgba(209, 250, 229, ${meteor.opacity * 0.5})`; // emerald-100
        ctx.lineWidth = meteor.width * 0.5;
        
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Add bright core for hover meteors
        if (meteor.type === 'hover' && meteor.opacity > 0.5) {
          ctx.shadowBlur = 5;
          ctx.strokeStyle = `rgba(236, 253, 245, ${meteor.opacity * 0.8})`; // emerald-50
          ctx.lineWidth = meteor.width * 0.2;
          
          ctx.beginPath();
          ctx.moveTo(meteor.x, meteor.y);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }

        // Reset shadow
        ctx.shadowBlur = 0;

        return true;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Reset mouse moving flag after inactivity
    const resetMouseMoving = setInterval(() => {
      mouseRef.current.isMoving = false;
    }, 100);
    
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(resetMouseMoving);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

