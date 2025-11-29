import { useEffect, useRef, memo, useCallback } from 'react';

const MatrixRain = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const dropsRef = useRef<number[]>([]);
  const isVisibleRef = useRef(true);
  const lastTimeRef = useRef(0);

  const draw = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, timestamp: number) => {
    // Throttle to ~28 FPS for better performance
    if (timestamp - lastTimeRef.current < 35) {
      animationRef.current = requestAnimationFrame((t) => draw(ctx, canvas, t));
      return;
    }
    lastTimeRef.current = timestamp;

    // Skip rendering if tab is not visible
    if (!isVisibleRef.current) {
      animationRef.current = requestAnimationFrame((t) => draw(ctx, canvas, t));
      return;
    }

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
    const fontSize = 14;
    const drops = dropsRef.current;

    // Semi-transparent black to create trailing effect
    ctx.fillStyle = 'rgba(13, 13, 13, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Green text
    ctx.fillStyle = '#00FF41';
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
      const text = characters.charAt(Math.floor(Math.random() * characters.length));
      ctx.fillText(text, i * fontSize, drops[i]);

      // Reset drop to top after reaching bottom
      if (drops[i] > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }

      drops[i] += fontSize;
    }

    animationRef.current = requestAnimationFrame((t) => draw(ctx, canvas, t));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Set canvas size with device pixel ratio for sharper rendering
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      
      // Reinitialize drops on resize
      const fontSize = 14;
      const columns = Math.floor(rect.width / fontSize);
      dropsRef.current = Array(columns).fill(0).map(() => Math.random() * rect.height);
    };

    resizeCanvas();

    // Debounced resize handler
    let resizeTimeout: number;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resizeCanvas, 150);
    };

    // Visibility change handler
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
    };

    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start animation loop
    animationRef.current = requestAnimationFrame((t) => draw(ctx, canvas, t));

    return () => {
      cancelAnimationFrame(animationRef.current);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      style={{ opacity: 0.1 }}
      aria-hidden="true"
    />
  );
});

MatrixRain.displayName = 'MatrixRain';

export default MatrixRain;
