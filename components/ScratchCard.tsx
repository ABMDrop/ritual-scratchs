"use client";
import { useRef, useEffect, useState, useCallback } from 'react';
import { COOLDOWN_MS } from '../lib/constants';

interface ScratchCardProps {
  wallet: string | null;
  lastClaim: number | null;
  revealed: boolean;
  prizeLabel: string;
  prizePoints: number;
  canClaim: boolean;
  onScratch: () => void;
  onClaim: () => void;
  loading: boolean;
}

export function ScratchCard({ wallet, lastClaim, revealed, prizeLabel, prizePoints, canClaim, onScratch, onClaim, loading }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scratched, setScratched] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [timerBadge, setTimerBadge] = useState('🔌 Connect Wallet To Scratch');
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const autoReveal = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasReady = useRef(false);

  useEffect(() => {
    if (!wallet) { setTimerBadge('🔌 Connect Wallet To Scratch'); setCountdown(''); return; }
    if (!lastClaim) { setTimerBadge('🎴 Card Available!'); setCountdown(''); return; }
    function update() {
      const remaining = (lastClaim! + COOLDOWN_MS) - Date.now();
      if (remaining <= 0) { setCountdown(''); setTimerBadge('🎴 Card Available!'); return; }
      const h = Math.floor(remaining / 3600000).toString().padStart(2, '0');
      const m = Math.floor((remaining % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');
      setCountdown(`${h}:${m}:${s}`);
      setTimerBadge('✅ Claimed — Next card soon');
    }
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [lastClaim, wallet]);

  useEffect(() => {
    setScratched(false);
    canvasReady.current = false;
    if (!revealed) {
      // Delay init to ensure DOM is ready and canvas has dimensions
      const t = setTimeout(() => initCanvas(), 80);
      return () => clearTimeout(t);
    }
  }, [revealed, wallet]);

  function initCanvas() {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const w = wrapper.offsetWidth || 280;
    const h = wrapper.offsetHeight || 340;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.globalCompositeOperation = 'source-over';
    // Rich gold scratch surface
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#b8860b');
    grad.addColorStop(0.3, '#d4a017');
    grad.addColorStop(0.5, '#c8960c');
    grad.addColorStop(0.7, '#d4a017');
    grad.addColorStop(1, '#b8860b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // Pattern text
    for (let y = 20; y < h; y += 44) {
      for (let x = -20; x < w + 20; x += 80) {
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillText('✦ RITUAL ✦', x, y);
      }
    }
    // Center instruction
    ctx.font = 'bold 22px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,240,180,0.75)';
    ctx.fillText('SCRATCH', w / 2, h / 2 - 10);
    ctx.fillText('HERE', w / 2, h / 2 + 22);
    canvasReady.current = true;
  }

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY };
  }

  function scratch(pos: { x: number; y: number }) {
    const canvas = canvasRef.current;
    if (!canvas || !canvasReady.current) return;
    const ctx = canvas.getContext('2d')!;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    if (lastPos.current) { ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); }
    else { ctx.moveTo(pos.x, pos.y); }
    ctx.lineWidth = 44; ctx.lineCap = 'round'; ctx.stroke();
    lastPos.current = pos;
    // Only check percentage after meaningful movement
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    if (data.length < 100) return; // guard against 0-size canvas
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) { if (data[i] < 128) transparent++; }
    const pct = Math.round((transparent / (data.length / 4)) * 100);
    if (pct > 55 && !scratched) {
      setScratched(true);
      if (autoReveal.current) clearTimeout(autoReveal.current);
      autoReveal.current = setTimeout(() => {
        const c = canvasRef.current;
        if (c) c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
        onScratch();
      }, 300);
    }
  }

  const onStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (revealed || !wallet || !canvasReady.current) return;
    e.preventDefault();
    isDrawing.current = true; lastPos.current = null;
    scratch(getPos(e, canvasRef.current!));
  }, [revealed, wallet, scratched]);

  const onMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || revealed || !wallet) return;
    e.preventDefault();
    scratch(getPos(e, canvasRef.current!));
  }, [revealed, wallet]);

  const onEnd = useCallback(() => { isDrawing.current = false; lastPos.current = null; }, []);

  const cooldownActive = !!lastClaim && !!countdown;

  return (
    <div className="scratch-section">
      <div className="section-title">Daily Scratch Card</div>
      <div className="timer-badge">{timerBadge}</div>

      {wallet && cooldownActive && !revealed ? (
        <div className="post-claim-area" style={{ display: 'flex' }}>
          <div className="post-claim-label">✅ CLAIMED! NEXT CARD IN</div>
          <div className="post-claim-timer">{countdown}</div>
          <div className="post-claim-sub">Come Back After Timer</div>
        </div>
      ) : wallet ? (
        <>
          <div
            ref={wrapperRef}
            className="scratch-wrapper"
            style={{ touchAction: 'none', userSelect: 'none' }}
            onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
            onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
          >
            <div className="scratch-reveal">
              <div className="scratch-corner tl" /><div className="scratch-corner tr" />
              <div className="scratch-corner bl" /><div className="scratch-corner br" />
              <div className="scratch-logo-ring">
                <img
                  src="/ritual-scratch.png"
                  alt="Ritual"
                  style={{ width: 80, height: 80, objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.5))' }}
                />
              </div>
              <div className="prize-amount">{revealed ? prizePoints : '?'}</div>
              <div className="prize-label">RITUAL POINTS</div>
            </div>
            {!revealed && (
              <canvas
                ref={canvasRef}
                style={{ position: 'absolute', inset: 0, borderRadius: 14, width: '100%', height: '100%', display: 'block' }}
              />
            )}
          </div>
          {revealed && (
            <div className="scratch-hint" style={{ color: 'var(--cyan)' }}>
              🎉 You won {prizePoints} Ritual Points!
            </div>
          )}
          {!revealed && !scratched && (
            <div className="scratch-hint">👆 Scratch To Reveal Prize</div>
          )}
          {revealed && (
            <button className="claim-btn" style={{ display: 'block' }} disabled={!canClaim || loading} onClick={onClaim}>
              {loading ? '⏳ Confirming...' : `🔗 Claim ${prizePoints} Points on Ritual Chain`}
            </button>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 13, padding: 32 }}>
          👆 Connect Wallet First
        </div>
      )}
    </div>
  );
}
