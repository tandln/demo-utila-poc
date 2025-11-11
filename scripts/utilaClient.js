import fs from 'fs';
import jwt from 'jsonwebtoken';
import fetch from 'cross-fetch';

const {
  UTILA_BASE_URL,
  UTILA_VAULT_ID,
  UTILA_SERVICE_ACCOUNT_EMAIL,
  UTILA_RSA_PRIVATE_KEY_PEM_PATH,
} = process.env;

function getAccessToken() {
  const privateKey = fs.readFileSync(UTILA_RSA_PRIVATE_KEY_PEM_PATH, 'utf8').trim();
  // https://docs.utila.io/reference/authentication
  return jwt.sign(
    {
      sub: UTILA_SERVICE_ACCOUNT_EMAIL,
      aud: "https://api.utila.io/",
      exp: Math.floor(Date.now()/1000) + 60*60
    },
    privateKey.replace(/\\n/g, '\n'),
    { algorithm: 'RS256' }
  );
}

async function api(path, init = {}) {
  const token = getAccessToken();
  const res = await fetch(`${UTILA_BASE_URL}${path}`, {
    ...init,
    headers: {
      'authorization': `Bearer ${token}`,
      'content-type': 'application/json',
      ...(init.headers || {})
    }
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Utila API ${res.status} ${res.statusText}: ${t}`);
  }
  // endpoint sometimes returns empty body
  const txt = await res.text();
  return txt ? JSON.parse(txt) : {};
}

// List wallets
export const listWallets = () =>
  api(`/v2/vaults/${UTILA_VAULT_ID}/wallets`); // GET
// Create a tx
// POST https://api.utila.io/v2/vaults/{vault_id}/transactions:initiate
export const initiateTx = (body) =>
  api(`/v2/vaults/${UTILA_VAULT_ID}/transactions:initiate`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
// approve a tx request
// POST /v2/vaults/{vault_id}/transactionRequests/{id}:vote
export const voteOnTxRequest = (txReqId, approve = true) =>
  api(`/v2/vaults/${UTILA_VAULT_ID}/transactionRequests/${txReqId}:vote`, {
    method: 'POST',
    body: JSON.stringify({ approve })
  });
// Fetch transaction to poll state
export const getTransaction = (txId) =>
  api(`/v2/transactions/${txId}`); // GET

export default { initiateTx, voteOnTxRequest, getTransaction, listWallets };
