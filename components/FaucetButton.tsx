"use client";
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { FAUCET_CONTRACT, FAUCET_ABI } from '../lib/constants';

interface FaucetButtonProps {
  wallet: string | null;
}

type FaucetState = 'loading' | 'eligible' | 'claimed' | 'rich' | 'empty' | 'claiming' | 'success';

export function FaucetButton({ wallet }: FaucetButtonProps) {
  const [state,  setState]  = useState<FaucetState>('loading');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [popup,  setPopup]  = useState(false);

  useEffect(() => {
    if (!wallet) return;
    checkEligibility(wallet);
  }, [wallet]);

  useEffect(() => {
    if (!popup) return;
    const t = setTimeout(() => setPopup(false), 8000);
    return () => clearTimeout(t);
  }, [popup]);

  async function checkEligibility(addr: string) {
    setState('loading');
    setErrMsg(null);

    // ── 1. Check Supabase for permanent claim record ─────────────────────────
    // If this fails for any reason, we still continue — don't block the user
    try {
      const claimRes  = await fetch(`/api/faucet?address=${addr}`);
      if (claimRes.ok) {
        const claimData = await claimRes.json();
        if (claimData.claimed === true) { setState('claimed'); return; }
      }
      // If response not ok or any parse error — fall through and show button
    } catch {
      // Supabase/API unreachable — fall through, don't block
    }

    // ── 2. Check on-chain balance ─────────────────────────────────────────────
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Check user balance
      const balance = await provider.getBalance(addr);
      if (BigInt(balance) >= BigInt('10000000000000000')) {
        setState('rich'); return; // already has ≥ 0.01 RITUAL
      }

      setState('eligible');
    } catch {
      // Can't read chain at all — still show button optimistically
      // Server-side will do final validation on claim
      setState('eligible');
    }
  }

  async function handleClaim() {
    if (!wallet || state !== 'eligible') return;
    setState('claiming');
    setErrMsg(null);
    setTxHash(null);

    try {
      const res  = await fetch('/api/faucet', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ address: wallet }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) { setState('claimed'); return; }
        setErrMsg(data.error ?? 'Something went wrong.');
        setState('eligible');
        return;
      }

      setTxHash(data.txHash ?? null);
      setState('success');
      setPopup(true);
      setTimeout(() => setState('claimed'), 8500);
    } catch {
      setErrMsg('Network error. Please try again.');
      setState('eligible');
    }
  }

  if (!wallet || state === 'loading' || state === 'claimed' || state === 'rich' || state === 'empty') {
    return null;
  }

  const isClaiming = state === 'claiming';
  const isSuccess  = state === 'success';

  return (
    <>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <button
          onClick={handleClaim}
          disabled={isClaiming || isSuccess}
          style={{
            display:       'flex',
            alignItems:    'center',
            gap:           6,
            background:    '#12152a',
            border:        `1px solid ${isSuccess ? 'rgba(16,185,129,0.4)' : '#10b981'}`,
            borderRadius:  10,
            color:         isSuccess ? 'rgba(16,185,129,0.55)' : '#10b981',
            fontFamily:    "'Cabinet Grotesk', sans-serif",
            fontWeight:    700,
            fontSize:      13,
            padding:       '10px 20px',
            cursor:        isClaiming || isSuccess ? 'not-allowed' : 'pointer',
            transition:    'all 0.2s',
            whiteSpace:    'nowrap',
            boxShadow:     isClaiming || isSuccess ? 'none' : '0 0 16px rgba(16,185,129,0.2)',
            letterSpacing: '0.3px',
            opacity:       isSuccess ? 0.6 : 1,
          }}
          onMouseEnter={e => {
            if (!isClaiming && !isSuccess) {
              (e.currentTarget as HTMLButtonElement).style.boxShadow   = '0 0 22px rgba(16,185,129,0.4)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.9)';
            }
          }}
          onMouseLeave={e => {
            if (!isClaiming && !isSuccess) {
              (e.currentTarget as HTMLButtonElement).style.boxShadow   = '0 0 16px rgba(16,185,129,0.2)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#10b981';
            }
          }}
        >
          {isClaiming && (
            <span style={{
              width: 11, height: 11, borderRadius: '50%',
              border: '2px solid rgba(16,185,129,0.2)',
              borderTop: '2px solid #10b981',
              display: 'inline-block',
              animation: 'faucetSpin 0.7s linear infinite',
            }} />
          )}
          {!isClaiming && <span style={{ fontSize: 13 }}>💧</span>}
          {isClaiming ? 'Sending…' : 'Claim 0.01 RITUAL'}
        </button>

        {errMsg && (
          <span style={{
            fontSize: 10, color: 'rgba(248,113,113,0.9)',
            fontFamily: "'DM Mono', monospace",
            whiteSpace: 'nowrap',
            position: 'absolute', top: '100%', marginTop: 4,
          }}>
            ⚠ {errMsg}
          </span>
        )}
      </div>

      {/* ── Success Popup ── */}
      {popup && (
        <div
          onClick={() => setPopup(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg, #12152a, #0c0e1e)',
              border: '1px solid rgba(16,185,129,0.4)',
              borderRadius: 20,
              padding: '36px 40px',
              maxWidth: 360,
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 0 60px rgba(16,185,129,0.15), 0 20px 60px rgba(0,0,0,0.5)',
              animation: 'slideUp 0.25s ease',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setPopup(false)}
              style={{
                position: 'absolute', top: 14, right: 16,
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.3)', fontSize: 18,
                cursor: 'pointer', lineHeight: 1,
              }}
            >✕</button>

            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(16,185,129,0.12)',
              border: '2px solid rgba(16,185,129,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, margin: '0 auto 18px',
              boxShadow: '0 0 24px rgba(16,185,129,0.25)',
            }}>✅</div>

            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.7rem', letterSpacing: 2,
              color: '#10b981', marginBottom: 8,
            }}>RITUAL Claimed!</div>

            <div style={{
              fontFamily: "'Cabinet Grotesk', sans-serif",
              fontSize: 14, color: 'rgba(255,255,255,0.55)',
              marginBottom: 24, lineHeight: 1.6,
            }}>
              <span style={{ color: '#6ee7b7', fontWeight: 700 }}>0.01 RITUAL</span> has been sent
              to your wallet. This is a <span style={{ color: '#6ee7b7', fontWeight: 700 }}>one-time</span> faucet — use it wisely!
            </div>

            {txHash && (
              <a
                href={`https://explorer.ritualfoundation.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.4)',
                  borderRadius: 10, padding: '11px 24px',
                  color: '#10b981',
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                  fontWeight: 700, fontSize: 13,
                  textDecoration: 'none',
                  marginBottom: 12,
                  boxSizing: 'border-box',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(16,185,129,0.2)';
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow  = '0 0 16px rgba(16,185,129,0.3)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(16,185,129,0.12)';
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow  = 'none';
                }}
              >
                🔍 View on Explorer ↗
              </a>
            )}

            <button
              onClick={() => setPopup(false)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '10px 24px',
                color: 'rgba(255,255,255,0.35)',
                fontFamily: "'Cabinet Grotesk', sans-serif",
                fontWeight: 600, fontSize: 12,
                cursor: 'pointer', width: '100%',
                boxSizing: 'border-box', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)'; }}
            >Close</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes faucetSpin { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </>
  );
}
