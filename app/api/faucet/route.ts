import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createClient } from '@libsql/client';

// ── Config ────────────────────────────────────────────────────────────────────
const RPC_URL       = 'https://rpc.ritualfoundation.org';
const FAUCET_AMOUNT = ethers.parseEther('0.01');
const CHAIN_ID      = 1979;

function getDb() {
  const url   = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) throw new Error('TURSO_DATABASE_URL or TURSO_AUTH_TOKEN is not set.');
  return createClient({ url, authToken: token });
}

// ── GET /api/faucet?address=0x... — check if address has claimed ──────────────
export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get('address');
    if (!address || !ethers.isAddress(address)) {
      return NextResponse.json({ claimed: false });
    }
    const db     = getDb();
    const result = await db.execute({
      sql:  'SELECT address FROM faucet_claims WHERE address = ? LIMIT 1',
      args: [address.toLowerCase()],
    });
    return NextResponse.json({ claimed: result.rows.length > 0 });
  } catch (err) {
    console.warn('[Faucet GET] DB error:', err);
    return NextResponse.json({ claimed: false });
  }
}

// ── POST /api/faucet — send RITUAL directly, no MetaMask needed ───────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Parse & validate address
    const body = await req.json().catch(() => ({}));
    const rawAddress: unknown = body?.address;
    if (typeof rawAddress !== 'string' || !ethers.isAddress(rawAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address.' }, { status: 400 });
    }
    const userAddress = ethers.getAddress(rawAddress);

    // 2. Permanent one-time claim check via Turso
    const db       = getDb();
    const existing = await db.execute({
      sql:  'SELECT address FROM faucet_claims WHERE address = ? LIMIT 1',
      args: [userAddress.toLowerCase()],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'This wallet has already claimed the faucet.' },
        { status: 409 }
      );
    }

    // 3. Check server private key
    const privateKey = process.env.FAUCET_PRIVATE_KEY;
    if (!privateKey) {
      console.error('[Faucet] FAUCET_PRIVATE_KEY env var is not set.');
      return NextResponse.json({ error: 'Faucet not configured. Contact admin.' }, { status: 500 });
    }

    // 4. Connect provider + server wallet
    const provider     = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
    const serverWallet = new ethers.Wallet(privateKey, provider);

    // 5. Check user doesn't already have enough RITUAL
    const userBalance = await provider.getBalance(userAddress);
    if (userBalance >= ethers.parseEther('0.01')) {
      return NextResponse.json(
        { error: 'Your wallet already has enough RITUAL (≥ 0.01).' },
        { status: 409 }
      );
    }

    // 6. Check server wallet has enough funds
    const serverBalance = await provider.getBalance(serverWallet.address);
    if (serverBalance < FAUCET_AMOUNT + ethers.parseEther('0.001')) {
      console.error('[Faucet] Server wallet low on funds:', ethers.formatEther(serverBalance));
      return NextResponse.json({ error: 'Faucet is temporarily empty. Contact admin.' }, { status: 503 });
    }

    // 7. Send RITUAL directly — zero MetaMask popup for user
    const tx      = await serverWallet.sendTransaction({ to: userAddress, value: FAUCET_AMOUNT });
    const receipt = await tx.wait(1);
    const txHash  = receipt?.hash ?? tx.hash;

    // 8. Record permanently in Turso
    try {
      await db.execute({
        sql:  'INSERT OR IGNORE INTO faucet_claims (address, tx_hash, claimed_at) VALUES (?, ?, ?)',
        args: [userAddress.toLowerCase(), txHash, new Date().toISOString()],
      });
    } catch (insertErr) {
      console.error('[Faucet] DB insert failed (tokens already sent):', insertErr);
    }

    return NextResponse.json({ success: true, txHash, amount: '0.01', message: '0.01 RITUAL sent!' });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Faucet] Error:', message);
    return NextResponse.json({ error: 'Transaction failed. Please try again.' }, { status: 500 });
  }
}
