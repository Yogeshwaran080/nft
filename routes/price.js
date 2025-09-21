// backend/routes/price.js
import express from "express";

const router = express.Router();

// Helper: fetch with timeout
async function fetchWithTimeout(url, opts = {}, ms = 10000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

// -------- Route: Fetch NFT sales --------
// Example: GET /price/sales/0xContract/3
router.get("/sales/:contract/:tokenId", async (req, res) => {
  try {
    const { contract, tokenId } = req.params;
    const limit = req.query.limit || 50;

    const url = `https://api.reservoir.tools/sales/v6?contract=${contract.toLowerCase()}&token=${tokenId}&limit=${limit}`;

    const r = await fetchWithTimeout(url, {
      headers: {
        "accept": "application/json",
      },
    });

    if (!r.ok) throw new Error(`Reservoir error ${r.status}`);
    const data = await r.json();

    // ----- Example Analysis -----
    let highestSale = 0;
    let lowestSale = Infinity;
    let totalVolume = 0;
    let tradeCount = 0;

    const enrichedSales = (data.sales || []).map((sale) => {
      const ethValue = Number(sale.price?.amount?.decimal || 0);
      if (ethValue > highestSale) highestSale = ethValue;
      if (ethValue < lowestSale) lowestSale = ethValue;
      totalVolume += ethValue;
      tradeCount++;

      return {
        txHash: sale.txHash,
        timestamp: sale.timestamp,
        price: ethValue,
        marketplace: sale.orderSource || sale.orderSourceDomain || "unknown",
        buyer: sale.toAddress,
        seller: sale.fromAddress,
        tokenId: sale.token?.tokenId || tokenId,
        contract: sale.token?.contract || contract,
      };
    });

    const avgPrice = tradeCount > 0 ? totalVolume / tradeCount : 0;

    res.json({
      contract,
      tokenId,
      highestSale: highestSale || 0,
      lowestSale: lowestSale === Infinity ? 0 : lowestSale,
      avgPrice,
      totalVolume,
      tradeCount,
      sales: enrichedSales, // processed sales data
      raw: data.sales, // keep original just in case
      continuation: data.continuation || null, // pagination key
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch NFT sales", details: err.message });
  }
});

export default router;
