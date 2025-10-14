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

// -------- Route: Fetch NFT sales (full history) --------
router.get("/sales/:contract/:tokenId", async (req, res) => {
  try {
    const { contract, tokenId } = req.params;

    let continuation = null;
    let allSales = [];

    // keep fetching until no continuation
    do {
      const url = new URL("https://api.reservoir.tools/sales/v6");
      url.searchParams.append("contract", contract.toLowerCase());
      url.searchParams.append("token", tokenId);
      url.searchParams.append("limit", "1000"); // max allowed
      if (continuation) {
        url.searchParams.append("continuation", continuation);
      }

      const r = await fetchWithTimeout(url.toString(), {
        headers: { accept: "application/json" },
      });

      if (!r.ok) throw new Error(`Reservoir error ${r.status}`);
      const data = await r.json();

      // merge only matching tokenId
      const filteredSales = (data.sales || []).filter(
        (sale) => sale.token?.tokenId?.toString() === tokenId.toString()
      );

      allSales = allSales.concat(filteredSales);

      continuation = data.continuation || null;
    } while (continuation);

    // ----- Stats -----
    let highestSale = 0;
    let lowestSale = Infinity;
    let totalVolume = 0;
    let totalVolumeUSD = 0;
    let tradeCount = 0;

    const enrichedSales = allSales.map((sale) => {
      const ethValue = Number(sale.price?.amount?.decimal || 0);
      const usdValue = Number(sale.price?.amount?.usd || 0);

      if (ethValue > highestSale) highestSale = ethValue;
      if (ethValue < lowestSale) lowestSale = ethValue;
      totalVolume += ethValue;
      totalVolumeUSD += usdValue;
      tradeCount++;

      return {
        id: sale.id,
        saleId: sale.saleId,
        orderId: sale.orderId,
        orderSource: sale.orderSource,
        orderSide: sale.orderSide,
        orderKind: sale.orderKind,
        from: sale.from,
        to: sale.to,
        token: {
          contract: sale.token?.contract || contract,
          tokenId: sale.token?.tokenId || tokenId,
          name: sale.token?.name || null,
          collection: {
            id: sale.token?.collection?.id || null,
            name: sale.token?.collection?.name || null,
          },
        },
        amount: sale.amount,
        fillSource: sale.fillSource,
        block: sale.block,
        txHash: sale.txHash,
        logIndex: sale.logIndex,
        batchIndex: sale.batchIndex,
        timestamp: sale.timestamp,
        price: {
          currency: sale.price?.currency,
          amount: sale.price?.amount,
          netAmount: sale.price?.netAmount,
        },
        washTradingScore: sale.washTradingScore,
        marketplaceFeeBps: sale.marketplaceFeeBps,
        paidFullRoyalty: sale.paidFullRoyalty,
        feeBreakdown: sale.feeBreakdown || [],
        comment: sale.comment,
        isDeleted: sale.isDeleted,
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt,
      };
    });

    const avgPrice = tradeCount > 0 ? totalVolume / tradeCount : 0;
    const avgPriceUSD = tradeCount > 0 ? totalVolumeUSD / tradeCount : 0;

    res.json({
      contract,
      tokenId,
      highestSale,
      lowestSale: lowestSale === Infinity ? 0 : lowestSale,
      avgPrice,
      avgPriceUSD,
      totalVolume,
      totalVolumeUSD,
      tradeCount,
      sales: enrichedSales,
      totalPages: Math.ceil(enrichedSales.length / 1000),
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch NFT sales",
      details: err.message,
    });
  }
});

export default router; 