import { network } from "hardhat";

async function main() {
  console.log("🚀 Deploying VeriChainReceipt...");

  const { viem } = await network.connect();
  const verichain = await viem.deployContract("VeriChainReceipt");

  console.log("✅ VeriChainReceipt deployed!");
  console.log("📍 Contract address:", verichain.address);
  console.log("");
  console.log("Save this address — you'll need it later.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
