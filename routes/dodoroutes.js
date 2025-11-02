// routes/dodoRoutes.js
import express from "express";
import DodoPayments from "dodopayments";

const router = express.Router();

const client = new DodoPayments({
  bearerToken: process.env.DODO_SECRET_KEY,
});

router.post("/create-session", async (req, res) => {
  try {
    const session = await client.checkoutSessions.create({
      billing: {
        street: req.body.street || "123 Main Street",
        city: req.body.city || "San Francisco",
        state: req.body.state || "CA",
        zipcode: req.body.zipcode || "94103",
        country: req.body.country || "US",
      },
      product_cart: [
        {
          product_id: "pdt_GGdnXYH5FgtraHPU3WRdw", // replace with your actual product ID
          quantity: 1,
        },
      ],
      currency: "USD",
      redirect_url: "https://yourapp.com/success",
      cancel_url: "https://yourapp.com/cancel",
    });

    res.status(200).json({ checkout_url: session.checkout_url });
  } catch (error) {
    console.error("❌ Dodo API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
