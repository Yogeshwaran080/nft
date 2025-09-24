// models/NftSales.js
import mongoose from "mongoose";

const NftSalesSchema = new mongoose.Schema({
  contract: { type: String, required: true },
  tokenId: { type: String, required: true },
  response: { type: Object, required: true }, // full enriched response JSON
  fetchedAt: { type: Date, default: Date.now }
});

export default mongoose.model("NFTSales", NftSalesSchema);
