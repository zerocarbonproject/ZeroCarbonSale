const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const PrivatePreSale = artifacts.require('PrivatePreSale');
const SimpleToken = artifacts.require('SimpleToken');

// wallet - Storage of sale funds
// tokenWallet - Owner of all tokens
// authorizedInvestor01 - Whitelisted investor (Added by default)
// authorizedInvestor02 - Whitelisted investor (Not whitelisted by beforeEach)
// unauthorizedInvestor - Non whitelisted investor

contract('PrivatePreSale', function ([_, wallet, tokenWallet, authorizedInvestor01, authorizedInvestor02, unauthorizedInvestor]) {
  
  // Tokens per Eth (Eth price $10 000, $0.10 per NRG)
  const rate = new BigNumber(100000);
  const valueWei = new web3.BigNumber(web3.toWei(3, 'ether'));
  const expectedTokenAmount = rate.mul(valueWei);
  // 4 000 000 tokens
  const tokenAllowance = new BigNumber('4e24');

  console.log("Default Adr : " + _);
  console.log("Wallet Adr : " + wallet);
  console.log("Token Wallet Adr : " + tokenWallet);
  console.log("Auth Investor Adr : " + authorizedInvestor01);

  beforeEach(async function () {
    this.token = await SimpleToken.new({ from: tokenWallet });
    this.sale = await PrivatePreSale.new(wallet, this.token.address, tokenWallet);
    await this.token.approve(this.sale.address, tokenAllowance, { from: tokenWallet });
    await this.sale.addToWhitelist(authorizedInvestor01);
  });

  describe('Basic Tests', function() {
    it('Check allowance is set correctly', async function() {
      let allowanceAmount = await this.token.allowance(tokenWallet, this.sale.address);
      assert.isTrue(allowanceAmount.eq(tokenAllowance));
    });

    it('Is AuthorizedInvestor01 whitelisted', async function() {
      let isAuth01Whitelisted = await this.sale.whitelist(authorizedInvestor01);
      assert.isTrue(isAuth01Whitelisted);
    });

    it('No tokens must be issued at start',async function() {
      let tokensIssed = await this.sale.tokensIssued();
      assert.isTrue(new BigNumber(0).eq(tokensIssed));
    });
  });
  
  describe('accepting payments', function () { 
    it('should accept sends (Whitelisted and conditions matched)', async function () {
      let txId = await web3.eth.sendTransaction({ from: authorizedInvestor01, to: this.sale.address, value: valueWei });
      console.log(`Tx: ${txId}`);
      // await this.sale.send(valueWei, {from : authorizedInvestor01, value : valueWei}).should.be.fulfilled;
      // await this.sale.testFunc({from : authorizedInvestor01, value : valueWei}).should.be.fulfilled;
    });
  });
  
  
});
