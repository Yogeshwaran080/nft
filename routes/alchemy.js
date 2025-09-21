// backend/routes/alchemy.js
import express from "express";
import dotenv from "dotenv";
import { Alchemy, Network, fromHex } from "alchemy-sdk";

dotenv.config();
const router = express.Router();

// ---------- Setup Alchemy SDK ----------
const ALCHEMY_KEY = process.env.ALCHEMY_KEY;
if (!ALCHEMY_KEY) {
  throw new Error("Missing ALCHEMY_KEY in .env");
}

const NETWORK =
  process.env.ALCHEMY_NETWORK?.toUpperCase() || "ETH_MAINNET";
const alchemy = new Alchemy({
  apiKey: ALCHEMY_KEY,
  network: Network[NETWORK],
});

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
function setCache(key, value, ttl = 5 * 60 * 1000) {
  cache.set(key, { value, expiry: Date.now() + ttl });
}

// ---------- Route: NFT Trades & Price Analysis ----------
router.get("/trades/:contract/:tokenId", async (req, res) => {
  try {
    const { contract, tokenId } = req.params;
    const key = `alchemy-trades-${contract}-${tokenId}`;
    const cached = getCache(key);
    if (cached) return res.json(cached);

    // Fetch all ERC721 transfers for the contract
    const response = await alchemy.core.getAssetTransfers({
      fromBlock: "0x0",
      contractAddresses: [contract],
      category: ["erc721"],
      excludeZeroValue: false,
    });

    // Filter for the specific tokenId
    const txns = response.transfers.filter(
      (txn) => txn.erc721TokenId && fromHex(txn.erc721TokenId) === Number(tokenId)
    );

    let floorPrice = null;
    let highestSale = 0;
    let totalVolume = 0;

    txns.forEach((tx) => {
      if (tx.value && Number(tx.value) > 0) {
        const ethValue = Number(tx.value); // Already in ETH
        if (floorPrice === null || ethValue < floorPrice) floorPrice = ethValue;
        if (ethValue > highestSale) highestSale = ethValue;
        totalVolume += ethValue;
      }
    });

    const analysis = {
      floorPrice: floorPrice || 0,
      highestSale,
      totalVolume,
      tradeCount: txns.length,
      trades: txns,
    };

    setCache(key, analysis);
    res.json(analysis);
  } catch (err) {
    console.error("Alchemy API Error:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch NFT trades", details: err.message });
  }
});

export default router;
