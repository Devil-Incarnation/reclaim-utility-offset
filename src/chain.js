const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function loadAbi() {
  const abiPath = path.resolve(
    process.cwd(),
    process.env.CONTRACT_ABI_PATH || "./src/contract.abi.json"
  );
  const raw = fs.readFileSync(abiPath, "utf8");
  return JSON.parse(raw);
}

function getContract() {
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
  const contractAddress = requireEnv("CONTRACT_ADDRESS");
  const privateKey = requireEnv("PRIVATE_KEY");
  const abi = loadAbi();

  const provider = new ethers.JsonRpcProvider(rpcUrl, 84532);
  const wallet = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(contractAddress, abi, wallet);
}

function toBytes32(value) {
  if (typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value)) {
    return value;
  }
  return ethers.keccak256(ethers.toUtf8Bytes(String(value ?? "")));
}

/**
 * Burns receipt tokens on Base Sepolia.
 * @param {string|number} tonnage CO2 tonnage (human-readable, 18 decimals on-chain)
 * @param {string} proofHash zkTLS proof identifier or hash
 * @param {string} verraSerial Verra credit serial
 * @returns {Promise<string>} transaction hash
 */
async function burnTokenOnChain(tonnage, proofHash, verraSerial) {
  const contract = getContract();
  const amount = ethers.parseUnits(String(tonnage), 18);
  const hashedProof = toBytes32(proofHash);

  const tx = await contract.burnReceipt(amount, hashedProof, String(verraSerial));
  const receipt = await tx.wait(1);

  return receipt.hash;
}

module.exports = {
  burnTokenOnChain,
};
