// src/routes/nftSalesHistory.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// Helper with timeout
async function fetchWithTimeout(url, opts = {}, ms = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}
router.get("/alchemy-sales/:contract/:tokenId", async (req, res) => {
  try {
    const { contract, tokenId } = req.params;
    const apiKey = process.env.ALCHEMY_KEY;
    const network = process.env.ALCHEMY_NETWORK || "eth-mainnet";

    if (!apiKey) {
      return res.status(500).json({ error: "No ALCHEMY_KEY in environment" });
    }

    let pageKey = null;
    let aggregatedResponse = {
      nftSales: [],
      pageKey: null,
    };

    // Fetch all pages
    do {
      const url = new URL(
        `https://${network}.g.alchemy.com/nft/v2/${apiKey}/getNFTSales`
      );

      url.searchParams.append("contractAddress", contract.toLowerCase());
      url.searchParams.append("tokenId", tokenId.toString());
      url.searchParams.append("limit", "1000");
      if (pageKey) {
        url.searchParams.append("pageKey", pageKey);
      }

      const r = await fetchWithTimeout(url.toString(), {
        headers: { accept: "application/json" },
      });
      if (!r.ok) {
        const body = await r.text();
        throw new Error(`Alchemy error ${r.status}: ${body}`);
      }

      const data = await r.json();
      aggregatedResponse.nftSales.push(...(data.nftSales || []));
      pageKey = data.pageKey || null;
    } while (pageKey);

    res.json(aggregatedResponse);
  } catch (err) {
    console.error("Alchemy sales history error:", err);
    res.status(500).json({
      error: "Failed to fetch NFT sales history from Alchemy",
      details: err.message,
    });
  }
});

export default router;
