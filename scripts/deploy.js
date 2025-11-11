import 'dotenv/config';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

async function main() {
  const { RPC_URL, BROADCASTER_PRIVATE_KEY, CHAIN_ID } = process.env;
  if (!RPC_URL || !BROADCASTER_PRIVATE_KEY) {
    throw new Error("Set RPC_URL and BROADCASTER_PRIVATE_KEY in .env");
  }
  const provider = new ethers.JsonRpcProvider(RPC_URL, Number(CHAIN_ID));
  const broadcaster = new ethers.Wallet(BROADCASTER_PRIVATE_KEY, provider);

  // Minimal ABI/bytecode for Counter (precompiled)
  const abi = [
    {"inputs":[],"name":"increment","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"value","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"by","type":"address"},{"indexed":false,"internalType":"uint256","name":"newValue","type":"uint256"}],"name":"Incremented","type":"event"}
  ];

  const bytecode = "0x608060405234801561001057600080fd5b5061011b806100206000396000f3fe608060405260043610601f5760003560e01c806306661abd1460245780633fa4f24514603a575b600080fd5b602a6044565b6040516001600160a01b03909116815260200160405180910390f35b6040604f565b005b6000546001600160a01b03163314606b57600080fd5b60016000546040516001600160a01b03909116815260200160405180910390a156fea2646970667358221220f0a7f0b9d62e1a8e16b4d8a6fe9b0c2d7617b2a83c66889dc4a56e9b2d3e1fbe64736f6c63430008180033";

  const factory = new ethers.ContractFactory(abi, bytecode, broadcaster);
  console.log("Deploying Counter...");
  const contract = await factory.deploy();
  await contract.deploymentTransaction().wait();
  const address = await contract.getAddress();
  console.log("Counter deployed at:", address);

  const outPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(outPath, JSON.stringify({ address, abi }, null, 2));
  console.log("Saved:", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
