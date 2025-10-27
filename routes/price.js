import express from "express";

const router = express.Router();

async function fetchWithTimeout(url, opts = {}, ms = 100000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

// -------- Route: Fetch NFT transfers via Moralis --------
router.get("/sales/:contract/:tokenId", async (req, res) => {
  try {
    const { contract, tokenId } = req.params;
    const chain = req.query.chain || "eth";
    const limit = 100;
    let cursor = null;
    let allTransfers = [];

    // Fetch all pages
    do {
      const url = new URL(
        `https://deep-index.moralis.io/api/v2.2/nft/${contract}/${tokenId}/transfers`
      );
      url.searchParams.append("chain", chain);
      url.searchParams.append("limit", limit);
      url.searchParams.append("order", "desc");
      if (cursor) url.searchParams.append("cursor", cursor);

      const r = await fetchWithTimeout(url.toString(), {
        headers: {
          accept: "application/json",
          "X-API-Key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6Ijg4ODZlZWU1LTA5MmItNDVkZC1iYWZkLTI1NDZkMGUwZjMzNCIsIm9yZ0lkIjoiNDY4NzQ4IiwidXNlcklkIjoiNDgyMjIyIiwidHlwZUlkIjoiNzhiODE1OGUtNWNlNy00MmQ4LWE2ZGQtNGIzOGIzNzQ0MzQwIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTY4MTMxNTUsImV4cCI6NDkxMjU3MzE1NX0.9OdlUNZLBwnkAvld6tiCu2wefNjlOcf6f5e-uN2J2n4",
        },
      });

      if (!r.ok) throw new Error(`Moralis error ${r.status}`);
      const data = await r.json();

      allTransfers = allTransfers.concat(data.result || []);
      cursor = data.cursor || null;
    } while (cursor);

    // ----- Stats -----
    const tradeCount = allTransfers.length;
    let totalVolume = 0;
    let highestSale = 0;
    let lowestSale = Infinity;

    const enrichedSales = allTransfers.map((tx) => {
      // Convert wei -> ETH
      const ethValue = Number(tx.value || 0) / 1e18;

      if (ethValue > 0) {
        totalVolume += ethValue;
        if (ethValue > highestSale) highestSale = ethValue;
        if (ethValue < lowestSale) lowestSale = ethValue;
      }

      return {
        block_number: tx.block_number,
        block_timestamp: tx.block_timestamp,
        block_hash: tx.block_hash,
        transaction_hash: tx.transaction_hash,
        transaction_index: tx.transaction_index,
        log_index: tx.log_index,
        // value now in ETH
        value: ethValue,
        contract_type: tx.contract_type,
        transaction_type: tx.transaction_type,
        token_address: tx.token_address,
        token_id: tx.token_id,
        from_address: tx.from_address,
        from_address_entity: tx.from_address_entity || null,
        from_address_entity_logo: tx.from_address_entity_logo || null,
        from_address_label: tx.from_address_label || null,
        to_address: tx.to_address,
        to_address_entity: tx.to_address_entity || null,
        to_address_entity_logo: tx.to_address_entity_logo || null,
        to_address_label: tx.to_address_label || null,
        amount: tx.amount,
        verified: tx.verified,
        operator: tx.operator || null,
        possible_spam: tx.possible_spam || false,
        verified_collection: tx.verified_collection || false,
      };
    });

    const avgPrice = tradeCount > 0 ? totalVolume / tradeCount : 0;

    res.json({
      contract,
      tokenId,
      highestSale: Number(highestSale.toFixed(6)),
      lowestSale: lowestSale === Infinity ? 0 : Number(lowestSale.toFixed(6)),
      avgPrice: Number(avgPrice.toFixed(6)),
      totalVolume: Number(totalVolume.toFixed(6)),
      tradeCount,
      sales: enrichedSales,
      totalPages: 1,
      cursor: null,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch NFT transfers",
      details: err.message,
    });
  }
});

export default router;
