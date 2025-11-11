import 'dotenv/config';
import fs from 'fs';
import { Interface } from 'ethers';
import utila from './utilaClient.js';

const {
  COUNTER_ABI_PATH,
  FROM,
  TO
} = process.env;

function extractTxId(resourceName) {
  if (!resourceName) return null;
  const m = resourceName.match(/\/transactions\/([^/]+)\/?$/);
  return m ? m[1] : null;
}

async function main() {
  // 1) Build calldata for Counter.increment()
  const abi = JSON.parse(fs.readFileSync(COUNTER_ABI_PATH, 'utf8'))?.abi;
  const iface = new Interface(abi);
  const data = iface.encodeFunctionData('increment', []);

  // 2) Initiate an evmTransaction
  const body = {
    details: {
      evm_transaction: {
        network: "ethereum-testnet-sepolia",
        fromAddress: FROM,
        toAddress: TO,
        data: data,
        value: "1",
        gasLimit: "0x013880",            // 31,989
        maxFeePerGas: "0x59682f00",      // 0.001050011  gwei
        maxPriorityFeePerGas: "0x3b9aca00" // 0.001050001 gwei
      }
    },
    note: "Token Approval",
    includeReferencedResources: true
  };

  const initiated = await utila.initiateTx(body);
  console.log('Initiated:', initiated);

  if (initiated?.transactionRequests?.length) {
    for (const req of initiated.transactionRequests) {
      console.log('Voting approve on transactionRequest:', req.id);
      await utila.voteOnTxRequest(req.id, true); // approve
    }
  }

  // 3) Wait for Co-Signer to sign
  // https://docs.utila.io/reference/utila-cosigner
  const txName = initiated?.transaction?.name;
  const txId = extractTxId(txName);
  if (!txId) throw new Error('No transaction id returned');
  console.log('Waiting for Co-Signer to sign transaction:', txId);

  // // 4) Poll tx until mined
  // for (;;) {
  //   const tx = await utila.getTransaction(txId);
  //   console.log('tx.status =', tx.status);
  //   if (["published", "mined", "completed"].includes(tx.status)) {
  //     console.log('DONE:', tx);
  //     break;
  //   }
  //   await new Promise(r => setTimeout(r, 3000));
  // }
}

main().catch(e => { console.error(e); process.exit(1); });
