require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const { verifyProof } = require("@reclaimprotocol/js-sdk");
const { burnTokenOnChain } = require("./src/chain");
const { extractKwh, proofHashFrom, isProofValid } = require("./src/proofUtils");
const { createReclaimProofRequest, triggerZkTlsProofRequest } = require("./src/reclaim");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/reclaim/config", async (_req, res) => {
  try {
    const reclaimProofRequest = await createReclaimProofRequest();
    const requestUrl = await reclaimProofRequest.getRequestUrl();
    res.json({
      requestUrl,
      statusUrl: reclaimProofRequest.getStatusUrl(),
      config: reclaimProofRequest.toJsonString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/reclaim/prove", async (_req, res) => {
  try {
    const result = await triggerZkTlsProofRequest();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/verify-and-offset", async (req, res) => {
  try {
    const proof = req.body?.proof || req.body;
    if (!proof || typeof proof !== "object") {
      return res.status(400).json({ success: false, error: "zkTLS proof JSON is required" });
    }

    const verifyResult = await verifyProof(proof);
    if (!isProofValid(verifyResult)) {
      const reason =
        (verifyResult && typeof verifyResult === "object" && verifyResult.error) ||
        "Invalid zkTLS proof";
      return res.status(400).json({ success: false, error: String(reason) });
    }

    const verifiedData = verifyResult?.data;
    const kwh = extractKwh(proof, verifiedData);
    if (kwh == null || Number.isNaN(kwh)) {
      return res.status(400).json({ success: false, error: "Verified kWh value not found in proof" });
    }

    const co2Tonnage = (kwh * 0.4) / 1000;
    const proofHash = proofHashFrom(proof);
    const verraSerial = req.body?.verraSerial || process.env.VERRA_SERIAL || "VCS-MOCK-0001";
    const txHash = await burnTokenOnChain(co2Tonnage, proofHash, verraSerial);

    return res.json({
      success: true,
      txHash,
      kwh,
      co2Tonnage,
      verraSerial,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Utility portal + API listening on http://localhost:${PORT}`);
});
