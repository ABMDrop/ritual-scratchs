"use client";
interface WalletModalProps { open: boolean; onClose: () => void; onConnectMetaMask: () => void; }

export function WalletModal({ open, onClose, onConnectMetaMask }: WalletModalProps) {
  if (!open) return null;
  return (
    <div className="wmodal open">
      <div className="wmodal-box">
        <div className="wmodal-title">Connect Wallet</div>
        <div className="wmodal-sub">Connect to play Ritual Scratch</div>
        <button className="wallet-option" onClick={onConnectMetaMask}>
          <div className="wallet-option-icon">🦊</div>
          <div><div className="wallet-option-name">MetaMask</div><div className="wallet-option-sub">Connect with MetaMask</div></div>
        </button>
        <button className="wallet-option" onClick={() => { window.open('https://metamask.io/download/', '_blank'); onClose(); }}>
          <div className="wallet-option-icon">📥</div>
          <div><div className="wallet-option-name">Get MetaMask</div><div className="wallet-option-sub">Install the browser extension</div></div>
        </button>
        <button className="wmodal-close" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
