import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nftRoutes from "./routes/nft.js";
import nftAlchemy from "./routes/alchemy.js";
import nftPrice from "./routes/price.js";



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Routes
app.use("/api/nft", nftRoutes);
app.use("/data/alchemy", nftAlchemy);
app.use("/price" , nftPrice);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
