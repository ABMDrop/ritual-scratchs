"use client";
import { useState, useEffect, useCallback } from 'react';
import { LeaderboardRow, getLeaderboardPage } from '../lib/api';

interface LeaderboardProps {
  wallet: string | null;
  rows: LeaderboardRow[];
  loading: boolean;
  onRefresh: () => void;
}

const PAGE_SIZE = 10;

function medal(i: number, page: number) {
  if (page !== 0) return null;
  return ['🥇', '🥈', '🥉'][i] ?? null;
}

export function Leaderboard({ wallet }: LeaderboardProps) {
  const [page, setPage]        = useState(0);
  const [rows, setRows]        = useState<LeaderboardRow[]>([]);
  const [totalCount, setTotal] = useState(0);
  const [loading, setLoading]  = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const { rows: r, totalCount: t } = await getLeaderboardPage(p, PAGE_SIZE);
      setRows(r);
      setTotal(t);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPage(page); }, [page, fetchPage]);

  const globalRank = (localIndex: number) => page * PAGE_SIZE + localIndex;

  const btnStyle = (disabled: boolean) => ({
    background: disabled ? 'var(--surface2)' : 'var(--purple)',
    border: '1px solid var(--border)',
    color: disabled ? 'var(--muted)' : '#fff',
    fontFamily: "'Cabinet Grotesk', sans-serif",
    fontWeight: 700 as const,
    fontSize: 13,
    padding: '10px 22px',
    borderRadius: 10,
    cursor: disabled ? 'not-allowed' as const : 'pointer' as const,
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s',
  });

  return (
    <div className="leaderboard-section">
      {/* Header */}
      <div className="lb-header">
        <div className="section-title" style={{ marginBottom: 0 }}>🏆 Global Leaderboard</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--muted)' }}>
          {loading ? 'Loading...' : `${totalCount} Scratcher${totalCount !== 1 ? 's' : ''} · Live`}
        </div>
      </div>

      {/* Rows */}
      {loading ? (
        <div className="lb-loading">Loading leaderboard…</div>
      ) : rows.length === 0 ? (
        <div className="lb-loading">No entries yet — be the first!</div>
      ) : rows.map((row, i) => {
        const rank  = globalRank(i);
        const isYou = wallet && row.wallet_address === wallet.toLowerCase();
        const name  = row.username || (row.wallet_address.slice(0, 6) + '...' + row.wallet_address.slice(-4));
        const m     = medal(i, page);
        return (
          <div key={row.wallet_address}
            className={['lb-row', rank===0?'rank1':rank===1?'rank2':rank===2?'rank3':'', isYou?'you':''].join(' ')}>
            <div className="lb-rank">{m ?? `#${rank + 1}`}</div>
            <div className="lb-avatar">{name.charAt(0).toUpperCase()}</div>
            <div className="lb-info">
              <div className="lb-name">
                {name}
                {isYou && <span style={{ color:'var(--purple)', fontSize:11, marginLeft:6 }}>(You)</span>}
              </div>
              <div className="lb-addr">{row.wallet_address.slice(0,6)}...{row.wallet_address.slice(-4)}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div className="lb-pts">{(row.lifetime_points ?? 0).toLocaleString()} pts</div>
              <div className="lb-scratches">{row.total_scratches} scratches</div>
            </div>
          </div>
        );
      })}

      {/* Pagination — only shown when more than 1 page exists */}
      {totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:16, gap:12 }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            style={btnStyle(page === 0 || loading)}
          >
            ← Prev
          </button>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'var(--muted)', letterSpacing:1 }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || loading}
            style={btnStyle(page >= totalPages - 1 || loading)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
