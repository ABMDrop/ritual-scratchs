import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RITUAL_CHAIN, POINTS_CLAIM_CONTRACT, PRIZES } from './constants';

export function rollPrize() {
  const r = Math.random();
  let cum = 0;
  for (const p of PRIZES) { cum += p.chance; if (r < cum) return p; }
  return PRIZES[PRIZES.length - 1];
}

export async function getChainId(): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) return '';
  return (await window.ethereum.request({ method: 'eth_chainId' })) as string;
}

export async function switchToRitual() {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: RITUAL_CHAIN.chainId }] });
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 4902) {
      await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [RITUAL_CHAIN] });
    }
  }
}

export async function addRitualNetwork() {
  if (!window.ethereum) return;
  try {
    // First try switching — works if the user already has the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: RITUAL_CHAIN.chainId }],
    });
  } catch (switchErr: unknown) {
    // Error 4902 = chain not added yet → add it
    if ((switchErr as { code?: number })?.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [RITUAL_CHAIN],
        });
      } catch (addErr: unknown) {
        // User rejected the add-network popup — ignore silently
        if ((addErr as { code?: number })?.code !== 4001) throw addErr;
      }
    } else if ((switchErr as { code?: number })?.code !== 4001) {
      // Propagate unexpected errors, but swallow user-rejected (4001)
      throw switchErr;
    }
  }
}

export async function getNFTCount(wallet: string): Promise<number> {
  if (!window.ethereum || !CONTRACT_ADDRESS) return 0;
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const nfts = await contract.tokensOfOwner(wallet);
    return nfts.length;
  } catch { return 0; }
}

export async function mintNFTOnChain(tier: number): Promise<string> {
  if (!window.ethereum) throw new Error('No wallet');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  const tx = await contract.mintNFT(tier);
  await tx.wait();
  return tx.hash;
}

export async function claimPointsTx(wallet: string, pts: number): Promise<string> {
  if (!window.ethereum) throw new Error('No wallet');
  const iface = new ethers.Interface(['function claimPoints(uint256 amount)']);
  const claimData = iface.encodeFunctionData('claimPoints', [BigInt(pts)]);
  let gasLimit: string;
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const estimated = await provider.estimateGas({ from: wallet, to: POINTS_CLAIM_CONTRACT, data: claimData });
    gasLimit = '0x' + ((estimated * 130n) / 100n).toString(16);
  } catch { gasLimit = '0x493E0'; }
  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{ from: wallet, to: POINTS_CLAIM_CONTRACT, value: '0x0', data: claimData, gas: gasLimit }],
  });
  return txHash as string;
}

export async function waitForTx(hash: string, max = 60): Promise<{ status: string }> {
  if (!window.ethereum) throw new Error('No wallet');
  for (let i = 0; i < max; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const r = await window.ethereum.request({ method: 'eth_getTransactionReceipt', params: [hash] }) as { blockNumber?: string; status?: string } | null;
      if (r?.blockNumber) {
        if (r.status === '0x0') throw new Error('Transaction reverted');
        return r as { status: string };
      }
    } catch (e) { if ((e as Error).message?.includes('reverted')) throw e; }
  }
  throw new Error('TX timeout');
}

export function fireConfetti(canvas: HTMLCanvasElement) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d')!;
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height - canvas.height,
    r: Math.random() * 6 + 3, d: Math.random() * 3 + 1,
    color: ['#8b5cf6','#a78bfa','#22d3ee','#f59e0b','#10b981'][Math.floor(Math.random() * 5)],
    tiltAngle: 0, tiltSpeed: Math.random() * 0.1 + 0.05,
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.fill();
      p.y += p.d; p.tiltAngle += p.tiltSpeed; p.x += Math.sin(p.tiltAngle) * 1.5;
      if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
    });
    if (++frame < 200) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}
