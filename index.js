import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nftRoutes from "./routes/nft.js";
import nftAlchemy from "./routes/alchemy.js";
import nftPrice from "./routes/price.js";
import walletRoutes from "./routes/wallet.js";
import alchemySales from "./routes/nftpricehistory.js"; 
import top from "./routes/top.js";
import dodoroutes from "./routes/dodoroutes.js";
import connectDB from "./config/db.js"; 
import userRoutes from "./routes/userRoutes.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/nft", nftRoutes);
app.use("/data/alchemy", nftAlchemy);
app.use("/price", nftPrice);
app.use("/api/wallet", walletRoutes);
app.use("/api/sales", alchemySales); 
app.use("/api/top",top);
app.use("/api/payment",dodoroutes);
app.use("/api/users", userRoutes);


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
