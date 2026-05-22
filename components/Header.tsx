"use client";
import { useState, useEffect, useRef } from 'react';
import { FaucetButton } from './FaucetButton';

interface HeaderProps {
  wallet: string | null;
  onOpenWalletModal: () => void;
  onDisconnect: () => void;
  onCopyAddress: () => void;
}

export function Header({ wallet, onOpenWalletModal, onDisconnect, onCopyAddress }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const short    = wallet ? wallet.slice(0, 6) + '...' + wallet.slice(-4) : '';
  const dropAddr = wallet ? wallet.slice(0, 10) + '...' + wallet.slice(-6) : '';

  return (
    <header className="header">
      <div className="logo">
        <div className="logo-icon">
          <img
            src="/net.png"
            alt="Ritual"
            width={36}
            height={36}
            style={{ width: '36px', height: '36px', objectFit: 'contain' }}
          />
        </div>
        <div>
          <div className="logo-text">Ritual Scratch</div>
          <div className="logo-sub">Testnet · Chain ID 1979</div>
        </div>
      </div>

      {/* Faucet button — auto-shows only when wallet connected + balance < 0.01 + not yet claimed */}
      <FaucetButton wallet={wallet} />

      <div className="wallet-wrapper" ref={wrapperRef}>
        <button
          className={`wallet-btn${wallet ? ' connected' : ''}`}
          onClick={() => wallet ? setDropdownOpen(v => !v) : onOpenWalletModal()}
        >
          {wallet ? short : 'Connect Wallet'}
        </button>
        {wallet && (
          <div className={`wallet-dropdown${dropdownOpen ? ' open' : ''}`}>
            <div className="wallet-dropdown-addr">{dropAddr}</div>
            <button className="wallet-dropdown-item" onClick={() => { onCopyAddress(); setDropdownOpen(false); }}>
              📋 Copy Address
            </button>
            <button className="wallet-dropdown-item disconnect" onClick={() => { onDisconnect(); setDropdownOpen(false); }}>
              🔌 Disconnect
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
