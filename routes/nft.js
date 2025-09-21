import express from "express";
import dotenv from "dotenv";

// If on Node < 18, uncomment next line and install node-fetch
// import fetch from "node-fetch";

dotenv.config();

const router = express.Router();

const NETWORK = process.env.ALCHEMY_NETWORK || "eth-mainnet";
const ALCHEMY_KEY = process.env.ALCHEMY_KEY;
if (!ALCHEMY_KEY) {
  throw new Error("Missing ALCHEMY_KEY in .env");
}
const ALCHEMY_BASE = `https://${NETWORK}.g.alchemy.com/nft/v2/${ALCHEMY_KEY}`;

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

// Optional: request timeout (prevents hanging)
async function fetchWithTimeout(url, opts = {}, ms = 10000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

// ---------- Route: Single NFT metadata ----------
router.get("/metadata/:contract/:tokenId", async (req, res) => {
  try {
    const key = `metadata-${req.params.contract}-${req.params.tokenId}`;
    const cached = getCache(key);
    if (cached) return res.json(cached);

    const url = withQuery(`${ALCHEMY_BASE}/getNFTMetadata`, {
      contractAddress: req.params.contract,
      tokenId: req.params.tokenId,
      refreshCache: "false"
    });

    const r = await fetchWithTimeout(url);
    if (!r.ok) throw new Error(`Alchemy error ${r.status}`);
    const data = await r.json();

    setCache(key, data); // cache it
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
