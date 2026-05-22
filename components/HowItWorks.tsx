"use client";

export function HowItWorks() {
  return (
    <div className="info-section">
      <div className="section-title">How It Works</div>
      {[
        ['Connect MetaMask', 'Official Wallet For Ritual Testnet (Chain ID 1979).'],
        ['Scratch Daily Card', 'One Free Scratch Every 24 Hours. Stay Active On Testnet!'],
        ['Claim On-Chain', 'Points Confirms On-Chain. (Fully On-Chain)'],
        ['Mint NFTs 🎴', 'Mint Exclusive Ritual NFT (Marketplace On Mainnet Launch)'],
      ].map(([title, desc], i) => (
        <div className="how-item" key={i}>
          <div className="how-num">{i + 1}</div>
          <div className="how-text"><strong>{title}</strong><span>{desc}</span></div>
        </div>
      ))}
      <div className="prize-table">
        <div className="prize-row"><span>🥇 Jackpot</span><span className="pts">100 Points</span><span className="chance">5%</span></div>
        <div className="prize-row"><span>🥈 Rare</span><span className="pts">50 Points</span><span className="chance">15%</span></div>
        <div className="prize-row"><span>🥉 Common</span><span className="pts">25 Points</span><span className="chance">35%</span></div>
        <div className="prize-row"><span>✨ Base</span><span className="pts">10 Points</span><span className="chance">45%</span></div>
      </div>
    </div>
  );
}
