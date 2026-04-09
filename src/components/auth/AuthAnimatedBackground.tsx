import { useEffect, useRef } from "react";

function getColors(dark: boolean) {
  if (dark) {
    return {
      particleColors: [[0, 212, 122], [0, 150, 255]] as [number, number, number][],
      connectionColor: (alpha: number) => `rgba(0,200,140,${alpha})`,
      waves: [
        { yRatio: 0.75, color: "rgba(0,150,214,0.10)", speed: 0.8, freq: 0.012 },
        { yRatio: 0.82, color: "rgba(0,180,120,0.08)", speed: -0.6, freq: 0.016 },
        { yRatio: 0.9, color: "rgba(0,120,200,0.07)", speed: 1.1, freq: 0.02 },
      ],
    };
  }
  return {
    particleColors: [[0, 150, 70], [0, 80, 200]] as [number, number, number][],
    connectionColor: (alpha: number) => `rgba(0,140,80,${alpha})`,
    waves: [
      { yRatio: 0.75, color: "rgba(0,100,180,0.12)", speed: 0.8, freq: 0.012 },
      { yRatio: 0.82, color: "rgba(0,160,90,0.09)", speed: -0.6, freq: 0.016 },
      { yRatio: 0.9, color: "rgba(0,80,160,0.08)", speed: 1.1, freq: 0.02 },
    ],
  };
}

export default function AuthAnimatedBackground({
  dark,
  zIndex = 0,
  opacity = 1,
  density = 1,
}: {
  dark: boolean;
  zIndex?: number;
  opacity?: number;
  density?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const darkRef = useRef(dark);
  darkRef.current = dark;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const particleCount = Math.max(80, Math.floor(120 * density));
    const linkDist = 170;
    const linkDistSq = linkDist * linkDist;

    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * (0.18 + 0.12 * density),
      vy: (Math.random() - 0.5) * (0.18 + 0.12 * density),
      r: 1.2 + Math.random() * (2.2 + 1.2 * density),
      colorIndex: Math.random() > 0.5 ? 0 : 1,
    }));

    function draw() {
      const dm = darkRef.current;
      const colors = getColors(dm);
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      colors.waves.forEach((wv) => {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x++) {
          ctx.lineTo(x, h * wv.yRatio + Math.sin(x * wv.freq + t * wv.speed) * 18);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = wv.color;
        ctx.fill();
      });

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const c = colors.particleColors[p.colorIndex];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.95)`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < linkDistSq) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist / linkDist) * (0.22 + 0.18 * density);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = colors.connectionColor(alpha);
            ctx.lineWidth = 0.55 * dpr;
            ctx.stroke();
          }
        }
      }

      t += 0.018;
      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex,
        opacity,
        pointerEvents: "none",
      }}
      aria-hidden
    />
  );
}

