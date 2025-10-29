// routes/top.js
import express from "express";
import fetch from "node-fetch"; // if using Node 18+, built-in fetch works fine

const router = express.Router();

// Replace with your actual Moralis API key
const MORALIS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6Ijg4ODZlZWU1LTA5MmItNDVkZC1iYWZkLTI1NDZkMGUwZjMzNCIsIm9yZ0lkIjoiNDY4NzQ4IiwidXNlcklkIjoiNDgyMjIyIiwidHlwZUlkIjoiNzhiODE1OGUtNWNlNy00MmQ4LWE2ZGQtNGIzOGIzNzQ0MzQwIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTY4MTMxNTUsImV4cCI6NDkxMjU3MzE1NX0.9OdlUNZLBwnkAvld6tiCu2wefNjlOcf6f5e-uN2J2n4"; 

router.get("/", async (req, res) => {
  try {
    const response = await fetch(
      "https://deep-index.moralis.io/api/v2.2/market-data/nfts/hottest-collections?limit=15",
      {
        headers: {
          accept: "application/json",
          "X-API-Key": MORALIS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Moralis API Error: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching NFT collections:", err);
    res.status(500).json({ error: "Failed to fetch top NFT collections" });
  }
});

export default router;
