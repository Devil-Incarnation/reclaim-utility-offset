const { ethers } = require("ethers");

function parseKwh(raw) {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const match = String(raw).replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  return Number(match[1]);
}

function readParamMap(source) {
  if (!source || typeof source !== "object") return {};
  if (typeof source.parameters === "string") {
    try {
      return JSON.parse(source.parameters);
    } catch {
      return {};
    }
  }
  return source;
}

function extractKwh(proof, verifyData) {
  const verifiedParams = Array.isArray(verifyData)
    ? verifyData[0]?.extractedParameters
    : verifyData?.extractedParameters;

  const contextParams = (() => {
    const context = proof?.claimData?.context;
    if (typeof context !== "string") return {};
    try {
      return JSON.parse(context)?.extractedParameters || {};
    } catch {
      return {};
    }
  })();

  const maps = [
    verifiedParams,
    proof?.extractedParameterValues,
    contextParams,
    readParamMap(proof?.claimData),
    proof,
  ];

  for (const map of maps) {
    if (!map || typeof map !== "object") continue;
    const raw = map.kWh ?? map.kwh ?? map.KWH ?? map["kwh-usage"];
    const kwh = parseKwh(raw);
    if (kwh != null) return kwh;
  }

  return null;
}

function proofHashFrom(proof) {
  if (proof?.identifier) return proof.identifier;
  return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(proof)));
}

function isProofValid(verifyResult) {
  if (typeof verifyResult === "boolean") return verifyResult;
  if (verifyResult && typeof verifyResult === "object") {
    if (typeof verifyResult.isVerified === "boolean") return verifyResult.isVerified;
    if (typeof verifyResult === "object" && "error" in verifyResult && verifyResult.error) {
      return false;
    }
  }
  return Boolean(verifyResult);
}

module.exports = {
  extractKwh,
  proofHashFrom,
  isProofValid,
};
