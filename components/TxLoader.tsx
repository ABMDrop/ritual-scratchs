"use client";
interface TxLoaderProps { show: boolean; msg: string; pts?: number; }

export function TxLoader({ show, msg, pts }: TxLoaderProps) {
  if (!show) return null;
  return (
    <div className="tx-loader show">
      <div className="tx-loader-box">
        <div className="tx-pulse">⛓️</div>
        <div className="tx-loader-title">On-Chain Confirmation</div>
        <div className="tx-loader-msg">{msg}</div>
        <div style={{ marginTop: 16, fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)' }}>
          Do Not Close This Window
        </div>
      </div>
    </div>
  );
}
