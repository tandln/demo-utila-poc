import 'dotenv/config';
import { ethers } from 'ethers';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';
import { UtilaSignerMock } from '../lib/signers/utila.js';

// recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async function main () {
  const { RPC_URL, CHAIN_ID, BROADCASTER_PRIVATE_KEY, UTILA_MOCK_PRIVATE_KEY } = process.env;
  if (!RPC_URL || !BROADCASTER_PRIVATE_KEY || !UTILA_MOCK_PRIVATE_KEY) {
    throw new Error("Set RPC_URL, BROADCASTER_PRIVATE_KEY, UTILA_MOCK_PRIVATE_KEY in .env");
  }
  const provider = new ethers.JsonRpcProvider(RPC_URL, Number(CHAIN_ID));

  const deployPath = join(__dirname, "..", "deployment.json");
  if (!existsSync(deployPath)) throw new Error("Run the deploy script first");
  const { address, abi } = JSON.parse(readFileSync(deployPath, "utf-8"));
  const contract = new ethers.Contract(address, abi, provider);

  const calldata = contract.interface.encodeFunctionData("increment", []);

  const utila = new UtilaSignerMock({ privateKey: UTILA_MOCK_PRIVATE_KEY });
  const fromAddress = utila.getAddress();

  const nonce = await provider.getTransactionCount(fromAddress);
  const feeData = await provider.getFeeData();
  const unsignedTx = {
    from: fromAddress,
    to: address,
    data: calldata,
    chainId: Number(CHAIN_ID),
    nonce,
    gasLimit: 200000n,
    maxFeePerGas: feeData.maxFeePerGas ?? ethers.parseUnits("30", "gwei"),
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? ethers.parseUnits("1", "gwei"),
    value: 0n,
    type: 2
  };

  console.log("Signing via Utila (mock) from address:", fromAddress);
  const rawSigned = await utila.sign(unsignedTx);

  const sent = await provider.broadcastTransaction(rawSigned);
  console.log("Tx hash:", sent.hash);
  const receipt = await sent.wait();
  console.log("Confirmed in block", receipt.blockNumber);

  const newVal = await contract.value();
  console.log("Counter value:", newVal.toString());
})().catch(e => { console.error(e); process.exit(1); });
