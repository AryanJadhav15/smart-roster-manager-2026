import express from "express";
import cors from "cors";
import "dotenv/config";
import db from "./config/db.js";
import rosterRoutes from "./routes/rosterRoutes.js";
import configRoutes from "./routes/configRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT DATABASE() AS db, NOW() AS time");
        res.json({ status: "connected", data: rows[0] });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// API Routes
app.use("/api/rosters", rosterRoutes);
app.use("/api/config", configRoutes);

const PORT = process.env.PORT || 5001;

// Listen locally, while exporting `app` cleanly for Vercel Serverless
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

export default app;
