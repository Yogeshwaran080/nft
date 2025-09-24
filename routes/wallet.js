// wallet.js
import express from "express";

const router = express.Router();

// ---------- Helper: build URL with query params ----------
const withQuery = (base, params) => {
  const u = new URL(base);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, v);
  });
  return u.toString();
};

// ---------- Simple in-memory cache ----------
const cache = new Map();
function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}
function setCache(key, value, ttl = 5 * 60 * 1000) { // default 5 minutes
  cache.set(key, { value, expiry: Date.now() + ttl });
}

// Optional: request timeout
async function fetchWithTimeout(url, opts = {}, ms = 10000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

// ---------- Config from .env ----------
const NETWORK = process.env.ALCHEMY_NETWORK || "eth-mainnet";
const ALCHEMY_KEY = process.env.ALCHEMY_KEY;
if (!ALCHEMY_KEY) {
  throw new Error("Missing ALCHEMY_KEY in .env");
}
const ALCHEMY_BASE = `https://${NETWORK}.g.alchemy.com/nft/v2/${ALCHEMY_KEY}`;

// ---------- Route: NFTs held by wallet ----------
router.get("/nfts/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const key = `wallet-nfts-${walletAddress}`;
    const cached = getCache(key);
    if (cached) return res.json(cached);

    const url = withQuery(`${ALCHEMY_BASE}/getCollectionsForOwner`, {
      owner: walletAddress,
      withMetadata: "true"
    });

    const r = await fetchWithTimeout(url);
    if (!r.ok) throw new Error(`Alchemy error ${r.status}`);
    const data = await r.json();

    setCache(key, data, 10 * 60 * 1000); // cache for 10 min
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Route: NFT transfers for wallet ----------
router.get("/transfers/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const key = `wallet-transfers-${walletAddress}`;
    const cached = getCache(key);
    if (cached) return res.json(cached);

    const url = withQuery(`${ALCHEMY_BASE}/getTransfers`, {
      fromAddress: walletAddress,
      toAddress: walletAddress,
      withMetadata: "true"
    });

    const r = await fetchWithTimeout(url);
    if (!r.ok) throw new Error(`Alchemy error ${r.status}`);
    const data = await r.json();

    setCache(key, data, 10 * 60 * 1000); // cache for 10 min
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
