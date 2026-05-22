"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '../components/Header';
import { StatsRow } from '../components/StatsRow';
import { ScratchCard } from '../components/ScratchCard';
import { HowItWorks } from '../components/HowItWorks';
import { NFTSection } from '../components/NFTSection';
import { Leaderboard } from '../components/Leaderboard';
import { WalletModal } from '../components/WalletModal';
import { Modal } from '../components/Modal';
import { TxLoader } from '../components/TxLoader';
import { GlobalLoader } from '../components/GlobalLoader';
import { Toast, ToastData } from '../components/Toast';
import {
  getUser, createUser, saveClaim, deductPoints,
  getLeaderboard, saveUsername, checkUsernameAvailable, LeaderboardRow,
} from '../lib/api';
import {
  rollPrize, getChainId, switchToRitual, addRitualNetwork, getNFTCount,
  mintNFTOnChain, claimPointsTx, waitForTx, fireConfetti,
} from '../lib/web3';
import { COOLDOWN_MS, NFT_COSTS, NFT_NAMES, RITUAL_CHAIN } from '../lib/constants';

interface SuccessInfo { label: string; pts: number; txHash: string; }

export default function Home() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [lifetimePts, setLifetimePts] = useState(0);
  const [scratches, setScratches] = useState(0);
  const [nfts, setNfts] = useState(0);
  const [lastClaim, setLastClaim] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [usernameInput, setUsernameInput] = useState('');

  const [revealed, setRevealed] = useState(false);
  const [prize, setPrize] = useState<{ pts: number; label: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileLoadMsg, setProfileLoadMsg] = useState('LOADING PROFILE...');
  const [wrongNetwork, setWrongNetwork] = useState(false);

  // TX overlay (On-Chain Confirmation)
  const [txOverlay, setTxOverlay] = useState(false);
  const [txOverlayMsg, setTxOverlayMsg] = useState('');

  const [lbRows, setLbRows] = useState<LeaderboardRow[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  // Modals & toasts
  const [walletModal, setWalletModal] = useState(false);
  const [modal, setModal] = useState<{ icon: string; title: string; body: string } | null>(null);
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  const confettiRef = useRef<HTMLCanvasElement>(null);

  /* ── helpers ── */
  function showToast(title: string, body: string, error = false) { setToast({ title, body, error }); }
  function showModal(icon: string, title: string, body: string) { setModal({ icon, title, body }); }

  /* ── load leaderboard ── */
  async function loadLeaderboard() {
    setLbLoading(true);
    try { setLbRows(await getLeaderboard()); } finally { setLbLoading(false); }
  }

  /* ── load user profile ── */
  async function loadUser(addr: string) {
    try {
      let user = await getUser(addr);
      if (!user) {
        setProfileLoadMsg('CREATING ACCOUNT...');
        // createUser now silently ignores duplicate-key (23505) — safe for race conditions
        await createUser(addr);
        user = await getUser(addr);
      }
      if (!user) return;
      setPoints(user.total_points ?? 0);
      setLifetimePts(user.lifetime_points ?? 0);
      setScratches(user.total_scratches ?? 0);
      setLastClaim(user.last_claim ?? null);
      // Treat empty string same as null so username banner shows correctly
      const uname = user.username?.trim() || '';
      setUsername(uname);
      setUsernameInput(uname);
      const count = await getNFTCount(addr);
      setNfts(count);
    } catch (e) {
      const msg = String((e as { message?: string })?.message ?? e);
      showToast('DB Error', msg, true);
    }
  }

  /* ── auto-reconnect on page load (persists across refresh) ── */
  useEffect(() => {
    loadLeaderboard();

    async function tryAutoConnect() {
      if (typeof window === 'undefined' || !window.ethereum) return;
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
        if (accounts?.length) {
          setProfileLoadMsg('LOADING PROFILE...');
          setProfileLoading(true);
          await handleConnected(accounts[0]);
          setProfileLoading(false);
        }
      } catch { /* silent */ }
    }
    tryAutoConnect();

    // Listen for account / network changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts: string[]) => {
        if (accounts?.length) {
          setProfileLoadMsg('SWITCHING ACCOUNT...');
          setProfileLoading(true);
          await handleConnected(accounts[0]);
          setProfileLoading(false);
        } else disconnect();
      });
      window.ethereum.on('chainChanged', () => checkNetwork());
    }
  }, []);

  async function checkNetwork() {
    const chainId = await getChainId();
    setWrongNetwork(chainId !== RITUAL_CHAIN.chainId);
  }

  async function handleConnected(addr: string) {
    const lower = addr.toLowerCase();
    setWallet(lower);
    await checkNetwork();
    await loadUser(lower);
  }

  /* ── connect MetaMask ── */
  async function connectMetaMask() {
    setWalletModal(false);
    if (typeof window === 'undefined' || !window.ethereum) {
      showModal('🦊', 'MetaMask Required', 'Please install MetaMask browser extension and reload the page.');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      if (!accounts?.length) return;
      showToast('✅ Connected!', accounts[0].slice(0, 6) + '...' + accounts[0].slice(-4));
      setProfileLoadMsg('LOADING PROFILE...');
      setProfileLoading(true);
      await handleConnected(accounts[0]);
      setProfileLoading(false);
    } catch (e: unknown) {
      setProfileLoading(false);
      if ((e as { code?: number })?.code !== 4001) showModal('❌', 'Connection Failed', String(e));
    }
  }

  function disconnect() {
    setWallet(null);
    setPoints(0); setLifetimePts(0); setScratches(0); setNfts(0);
    setLastClaim(null); setUsername(''); setUsernameInput('');
    setRevealed(false); setPrize(null); setWrongNetwork(false);
    showToast('🔌 Disconnected', 'Connect again to play');
  }

  function copyAddress() {
    if (wallet) { navigator.clipboard.writeText(wallet); showToast('✅ Copied!', wallet); }
  }

  /* ── scratch reveal ── */
  function onScratch() {
    if (!wallet) return;
    const now = Date.now();
    if (lastClaim && (now - lastClaim) < COOLDOWN_MS) {
      showToast('Cooldown Active', 'You already scratched today. Come back in 24h!', true);
      return;
    }
    const p = rollPrize();
    setPrize({ pts: p.pts, label: p.label });
    setRevealed(true);
  }

  /* ── claim on-chain ── */
  async function onClaim() {
    if (!wallet || !prize) return;
    setLoading(true);
    try {
      if (wrongNetwork) { await switchToRitual(); await checkNetwork(); }

      // Show on-chain confirmation overlay
      setTxOverlayMsg(`Confirming your ${prize.pts} pts claim on Ritual Chain...`);
      setTxOverlay(true);

      const txHash = await claimPointsTx(wallet, prize.pts);
      setTxOverlayMsg(`Waiting for blockchain confirmation...`);
      await waitForTx(txHash);
      setTxOverlay(false);

      // Save to Supabase
      await saveClaim(wallet, prize.pts, points, lifetimePts, scratches, username);
      const newPts = points + prize.pts;
      const newLifetime = lifetimePts + prize.pts;
      setPoints(newPts);
      setLifetimePts(newLifetime);
      setScratches(s => s + 1);
      setLastClaim(Date.now());
      setRevealed(false);

      // Fire confetti
      if (confettiRef.current) fireConfetti(confettiRef.current);

      // Show success popup (like original)
      setSuccessInfo({ label: prize.label, pts: prize.pts, txHash });

      // Auto-refresh leaderboard
      await loadLeaderboard();

      setPrize(null);
    } catch (e: unknown) {
      setTxOverlay(false);
      const msg = String((e as { message?: string })?.message ?? e);
      // Rejection → toast only (like original), real errors → toast too
      const isRejection = msg.includes('4001') || msg.includes('rejected') || msg.includes('denied') || msg.includes('cancel');
      showToast(
        isRejection ? '✖ TX Failed — No Points Added' : '❌ Claim Failed',
        isRejection ? 'User rejected the request.' : msg.slice(0, 80),
        true,
      );
    } finally {
      setLoading(false);
    }
  }

  /* ── mint NFT ── */
  async function onMint(tier: number) {
    if (!wallet) return;
    const cost = NFT_COSTS[tier];
    if (points < cost) { showToast('Insufficient Points', `You need ${cost.toLocaleString()} pts to mint.`, true); return; }
    setLoading(true);
    try {
      if (wrongNetwork) { await switchToRitual(); await checkNetwork(); }
      setTxOverlayMsg(`Minting ${NFT_NAMES[tier]}...`);
      setTxOverlay(true);
      const txHash = await mintNFTOnChain(tier);
      setTxOverlay(false);
      await deductPoints(wallet, cost, points);
      setPoints(p => Math.max(0, p - cost));
      const newCount = await getNFTCount(wallet);
      setNfts(newCount);
      showModal('🎉', `${NFT_NAMES[tier]} Minted!`, `Your NFT was minted!\n\nTX: ${txHash.slice(0, 30)}...`);
    } catch (e: unknown) {
      setTxOverlay(false);
      const msg = String((e as { message?: string })?.message ?? e);
      const isRejection = msg.includes('4001') || msg.includes('rejected') || msg.includes('denied');
      showToast(
        isRejection ? '✖ Mint Cancelled' : '❌ Mint Failed',
        isRejection ? 'User rejected the request.' : msg.slice(0, 80),
        true,
      );
    } finally { setLoading(false); }
  }

  /* ── save username ── */
  async function onSaveUsername() {
    if (!wallet || !usernameInput.trim()) return;
    const name = usernameInput.trim();
    if (name.length < 3 || name.length > 20) { showToast('Invalid Name', 'Username must be 3–20 characters.', true); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(name)) { showToast('Invalid Characters', 'Only letters, numbers, underscores.', true); return; }
    setLoading(true);
    try {
      const available = await checkUsernameAvailable(wallet, name);
      if (!available) { showToast('❌ Username Taken', `"${name}" is already taken.`, true); return; }
      await saveUsername(wallet, name);
      setUsername(name);
      showToast('✅ Username Saved!', name);
      await loadLeaderboard();
    } catch (e) { showToast('Error', String(e), true); }
    finally { setLoading(false); }
  }

  const canClaim = revealed && !!prize && !wrongNetwork;

  return (
    <>
      <div className="orb orb1" /><div className="orb orb2" />
      <canvas ref={confettiRef} id="confetti-canvas" />

      {/* Profile loading overlay - shown on auto-connect and wallet connect */}
      <GlobalLoader show={profileLoading} msg={profileLoadMsg} />

      {/* On-chain confirmation overlay */}
      <TxLoader show={txOverlay} msg={txOverlayMsg} />

      <WalletModal open={walletModal} onClose={() => setWalletModal(false)} onConnectMetaMask={connectMetaMask} />

      {/* Generic info modal */}
      {modal && <Modal open={!!modal} icon={modal.icon} title={modal.title} body={modal.body} onClose={() => setModal(null)} />}

      {/* Success claim modal (matches original) */}
      {successInfo && (
        <div className="modal open">
          <div className="modal-box">
            <div className="modal-icon">🎊</div>
            <div className="modal-title">{successInfo.label}</div>
            <div className="modal-body">
              {`You earned ${successInfo.pts} Ritual Points!\n\nSaved to leaderboard ✅\nTX: ${successInfo.txHash.slice(0, 20)}...`}
            </div>
            <button className="modal-btn" onClick={() => setSuccessInfo(null)}>OK</button>
          </div>
        </div>
      )}

      <Toast toast={toast} onClear={() => setToast(null)} />

      <div className="app">
        <Header wallet={wallet} onOpenWalletModal={() => setWalletModal(true)} onDisconnect={disconnect} onCopyAddress={copyAddress} />

        {wrongNetwork && wallet && (
          <div className="network-banner show">
            <p>⚠️ Wrong Network! Add <strong>Ritual Testnet</strong> to continue.</p>
            <button className="add-network-btn" onClick={async () => { await addRitualNetwork(); await checkNetwork(); }}>
              ⚡ Add Ritual Testnet Automatically
            </button>
          </div>
        )}

        {wallet && !username && (
          <div className="username-banner show">
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--muted)' }}>Set display name:</span>
            <input
              className="username-input"
              placeholder="e.g. CryptoWhale"
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSaveUsername()}
              maxLength={20}
            />
            <button className="username-save-btn" onClick={onSaveUsername} disabled={loading}>Save</button>
          </div>
        )}

        <StatsRow points={points} nfts={nfts} />

        <div className="main-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <ScratchCard
            wallet={wallet} lastClaim={lastClaim} revealed={revealed}
            prizeLabel={prize?.label ?? ''} prizePoints={prize?.pts ?? 0}
            canClaim={canClaim} onScratch={onScratch} onClaim={onClaim} loading={loading}
          />
          <HowItWorks />
        </div>

        <NFTSection wallet={wallet} points={points} onMint={onMint} loading={loading} />
        <Leaderboard wallet={wallet} rows={lbRows} loading={lbLoading} onRefresh={loadLeaderboard} />
      </div>
    </>
  );
}
