import { Wallet } from 'ethers';

export class UtilaSignerMock {
  constructor({ privateKey } = {}) {
    if (!privateKey) throw new Error('UTILA_MOCK_PRIVATE_KEY missing');
    this.wallet = new Wallet(privateKey);
  }
  getAddress() { return this.wallet.address; }
  async sign(unsignedTx) {
    return await this.wallet.signTransaction(unsignedTx);
  }
}

export default UtilaSignerMock;
