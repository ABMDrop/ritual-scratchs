"use client";
import { NFT_COSTS, NFT_NAMES } from '../lib/constants';

interface NFTSectionProps {
  wallet: string | null;
  points: number;
  onMint: (tier: number) => void;
  loading: boolean;
}

const NFT_IMGS = ['/nft-common.png', '/nft-rare.png', '/nft-legendary.png'];
const NFT_TIERS = ['common', 'rare', 'legendary'];

export function NFTSection({ wallet, points, onMint, loading }: NFTSectionProps) {
  return (
    <div className="nft-section">
      <div className="nft-section-header">
        <div className="section-title">🎴 Mint Ritual NFTs</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>
          Spend Points → Mint On-Chain (NFT Usecase On Mainnet Launch!)
        </div>
      </div>
      <div className="nft-grid">
        {NFT_COSTS.map((cost, i) => {
          const pct = Math.min(100, Math.round((points / cost) * 100));
          const canMint = !!wallet && points >= cost;
          const needed = cost - points;
          return (
            <div key={i} className={`nft-card ${NFT_TIERS[i]}`}>
              <img
                src={NFT_IMGS[i]}
                alt={NFT_NAMES[i]}
                width={120}
                height={160}
                style={{
                  width: '120px',
                  height: '160px',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  display: 'block',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              />
              <div className="nft-name">{NFT_NAMES[i].toUpperCase()}</div>
              <div className="nft-cost">Cost: <span>{cost.toLocaleString()} pts</span></div>
              <div className="nft-progress">
                <div className="nft-progress-fill" style={{ width: `${wallet ? pct : 0}%` }} />
              </div>
              <div className="nft-pts-needed">
                {!wallet ? 'Connect wallet' : needed > 0 ? `Need ${needed.toLocaleString()} more pts` : 'Ready to mint!'}
              </div>
              <button className="mint-btn" disabled={!canMint || loading} onClick={() => onMint(i)}>
                {!wallet ? '🔌 Connect First' : loading ? 'Minting...' : `🔱 ${cost.toLocaleString()} pts`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
