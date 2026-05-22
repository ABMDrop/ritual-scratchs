// ── Contracts ─────────────────────────────────────────────────────────────────
export const CONTRACT_ADDRESS      = '0xcEBa4b966578454B0DEBD3E0C36444716AB6cccd';
export const POINTS_CLAIM_CONTRACT = '0x90e1e14a6D1bC404a08588a817e32186B9578309';
export const FAUCET_CONTRACT       = '0x321E7AF843D49d29352F7C899D6846CDDa1e13ec';

export const FAUCET_ABI = [
  { inputs: [], name: 'claim', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'user', type: 'address' }], name: 'hasAddressClaimed', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'faucetBalance', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'claimAmount', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
];

export const RITUAL_CHAIN = {
  chainId: '0x7bb',
  chainName: 'Ritual Testnet',
  nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 },
  rpcUrls: ['https://rpc.ritualfoundation.org'],
  blockExplorerUrls: ['https://explorer.ritualfoundation.org'],
};

export const PRIZES = [
  { pts: 100, label: '🥇 JACKPOT!', chance: 0.05 },
  { pts: 50,  label: '🥈 RARE!',    chance: 0.15 },
  { pts: 25,  label: '🥉 COMMON',   chance: 0.35 },
  { pts: 10,  label: '✨ BASE',      chance: 0.45 },
];

export const NFT_COSTS = [500, 1500, 5000];
export const NFT_NAMES = ['Common Ritualist', 'Rare Ritualist', 'Legendary Ritualist'];

export const CONTRACT_ABI = [
  { inputs:[{internalType:'uint8',name:'tier',type:'uint8'}], name:'mintNFT', outputs:[], stateMutability:'nonpayable', type:'function' },
  { inputs:[{internalType:'address',name:'user',type:'address'}], name:'tokensOfOwner', outputs:[{internalType:'uint256[]',name:'',type:'uint256[]'}], stateMutability:'view', type:'function' },
];

export const COOLDOWN_MS = 24 * 60 * 60 * 1000;
