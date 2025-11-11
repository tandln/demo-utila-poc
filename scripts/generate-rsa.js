import { writeFileSync } from 'fs';
import { generateKeyPairSync } from 'crypto';

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding:  { type: 'spki',  format: 'pem' },  // -----BEGIN PUBLIC KEY-----
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' }   // -----BEGIN RSA PRIVATE KEY-----
});

writeFileSync('public_key.pem',  publicKey);
writeFileSync('private_key.pem', privateKey);
console.log('Wrote public_key.pem and private_key.pem');
