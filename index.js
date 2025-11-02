// server.js (or app.js)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// import mongoose from "mongoose";

import nftRoutes from "./routes/nft.js";
import nftAlchemy from "./routes/alchemy.js";
import nftPrice from "./routes/price.js";
import walletRoutes from "./routes/wallet.js";
import alchemySales from "./routes/nftpricehistory.js"; // <-- Added Alchemy sales history
import top from "./routes/top.js";
import dodoroutes from "./routes/dodoroutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ------------------ MongoDB connection (optional) ------------------
// mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nftDB", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log("✅ MongoDB connected"))
// .catch((err) => console.error("❌ MongoDB connection error:", err));

// ------------------ Middleware ------------------
app.use(cors());
app.use(express.json());

// ------------------ Routes ------------------
app.use("/api/nft", nftRoutes);
app.use("/data/alchemy", nftAlchemy);
app.use("/price", nftPrice);
app.use("/api/wallet", walletRoutes);
app.use("/api/sales", alchemySales); // <-- New sales history endpoint
app.use("/api/top",top);
app.use("/api/payment",dodoroutes);


// ------------------ Start Server ------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
