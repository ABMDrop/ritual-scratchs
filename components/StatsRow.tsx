"use client";
interface StatsRowProps { points: number; nfts: number; }

export function StatsRow({ points, nfts }: StatsRowProps) {
  return (
    <div className="stats-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
      <div className="stat-card"><div className="stat-val">{points.toLocaleString()}</div><div className="stat-label">Your Points</div></div>
      <div className="stat-card"><div className="stat-val">{nfts}</div><div className="stat-label">NFTs Owned</div></div>
    </div>
  );
}
