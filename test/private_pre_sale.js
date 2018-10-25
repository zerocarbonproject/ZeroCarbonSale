import expectThrow from './helpers/expectThrow';
import { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } from 'constants';

const PrivatePreSale = artifacts.require('PrivatePreSale');
const ERC20Mock = artifacts.require("./mocks/ERC20Mock.sol");

const BigNumber = web3.BigNumber;

// wallet - Storage of sale funds
// tokenWallet - Owner of all tokens
// authorizedInvestor01 - Whitelisted investor (Added by default)
// authorizedInvestor02 - Whitelisted investor (Not whitelisted by beforeEach)
// unauthorizedInvestor - Non whitelisted investor

contract('PrivatePreSale', function ([_, fundsWallet, tokenWallet, lockWallet, authedInvestor01, authedInvestor02, unauthedInvestor01, unauthedInvestor02]) {
  
  describe('Basic Tests', function() {

    // Tokens per Eth (Eth price $200, $0.10 per NRG)
    const rate = new BigNumber(2000);
    const valueWei = new web3.BigNumber(web3.toWei(3, 'ether'));
    const expectedTokenAmount = rate.mul(valueWei);
    // 4 000 000 tokens
    const totalTokens = new BigNumber('4e24');

    // 100 for sale
    const maxTokensSale = new BigNumber('100000000000000000000');
    // Min Buy 10 tokens
    const minInvest = new BigNumber('10000000000000000000');

    beforeEach(async function () {
      this.token = await ERC20Mock.new(tokenWallet, totalTokens);
      this.sale = await PrivatePreSale.new(fundsWallet, this.token.address, tokenWallet, lockWallet, maxTokensSale, minInvest);
      await this.token.approve(this.sale.address, maxTokensSale, { from: tokenWallet });
      await this.sale.addToWhitelist(authedInvestor01);
      await this.sale.addManyToWhitelist([authedInvestor02]);
    });

    it('Check allowance is set correctly', async function() {
      let allowanceAmount = await this.token.allowance.call(tokenWallet, this.sale.address);
      assert.isTrue(allowanceAmount.eq(maxTokensSale), 'Expected allowance to be ' + maxTokensSale + ' but found ' + allowanceAmount);
    });

    it('Is AuthorizedInvestor01 whitelisted', async function() {
      let isAuth01Whitelisted = await this.sale.whitelist(authedInvestor01);
      assert.isTrue(isAuth01Whitelisted, 'Expected authedInvestor01 to be on the whitelist');
    });

    it('Is AuthorizedInvestor02 whitelisted', async function() {
      let isAuthWhitelisted = await this.sale.whitelist(authedInvestor02);
      assert.isTrue(isAuthWhitelisted, 'Expected authedInvestor02 to be on the whitelist');
    });

    it('Remove AuthorizedInvestor02 whitelisted', async function() {
      let isAuthWhitelisted = await this.sale.whitelist(authedInvestor02);
      assert.isTrue(isAuthWhitelisted, 'Expected authedInvestor02 to be on the whitelist');
      await this.sale.removeFromWhitelist(authedInvestor02);
      isAuthWhitelisted = await this.sale.whitelist(authedInvestor02);
      assert.isFalse(isAuthWhitelisted, 'Expected authedInvestor02 to not be on the whitelist');
    });

    it('Is UnAuthorizedInvestor01 not whitelisted', async function() {
      let isAuth01Whitelisted = await this.sale.whitelist(unauthedInvestor01);
      assert.isFalse(isAuth01Whitelisted, 'Expected unauthedInvestor01 not to be on the whitelist');
    });

    it('No tokens must be issued at start',async function() {
      let tokensIssed = await this.sale.tokensIssued();
      assert.isTrue(new BigNumber(0).eq(tokensIssed));
    });

    it('Initial tokens issued correctly', async function() {
      let tokensBal = await this.token.balanceOf(tokenWallet);
      assert.isTrue(tokensBal.eq(totalTokens));
    });

    it('Token Lock Wallet is empty', async function() {
      let tokensBal = await this.token.balanceOf(lockWallet);
      assert.isTrue(tokensBal.eq(new BigNumber('0')));
    });

    it('Token Lock Wallet is empty', async function() {
      let capReach = await this.sale.capReached();
      assert.isFalse(capReach, 'Expected the cap to not be reached');
    });

    it('Close sale', async function() {
      await this.sale.closeSale();
      let isClosed = await this.sale.closed.call();
      assert.isTrue(isClosed, 'Sale to be closed');
    });

    it('Not owner close', async function() {
      await expectThrow(this.sale.closeSale({from : authedInvestor01}));
      let isClosed = await this.sale.closed.call();
      assert.isFalse(isClosed, 'Sale to be open');
    });
    
  });

  describe('Pause Tests', function() {

    // Tokens per Eth (Eth price $200, $0.10 per NRG)
    const rate = new BigNumber(2000);
    const valueWei = new web3.BigNumber(web3.toWei(3, 'ether'));
    const expectedTokenAmount = rate.mul(valueWei);
    // 4 000 000 tokens
    const totalTokens = new BigNumber('4e24');

    // 10 000 for sale
    const maxTokensSale = new BigNumber('1e22');
    // Min Buy 10 tokens
    const minInvest = new BigNumber('1e19');

    beforeEach(async function () {
      this.token = await ERC20Mock.new(tokenWallet, totalTokens);
      this.sale = await PrivatePreSale.new(fundsWallet, this.token.address, tokenWallet, lockWallet, maxTokensSale, minInvest);
      await this.token.approve(this.sale.address, maxTokensSale, { from: tokenWallet });
      await this.sale.addManyToWhitelist([authedInvestor01, authedInvestor02]);
    });

    it('Default not paused', async function() {
      let isPaused = await this.sale.paused.call();
      assert.isFalse(isPaused, 'Expected contract not to be paused');
    });

    it('Whitelist buy when paused', async function() {
      await this.sale.pause();
      let fundBal = await web3.eth.getBalance(fundsWallet);
      await expectThrow(this.sale.sendTransaction({from : unauthedInvestor01, value : web3.toWei(1, 'ether')}));
      let tokensBal = await this.token.balanceOf(lockWallet);
      assert.isTrue(tokensBal.eq(new BigNumber('0')), 'Expected Locked Token Blance to be 0, Found : ' + tokensBal);
      let fundBalAfter = await web3.eth.getBalance(fundsWallet);
      assert.isTrue(fundBal.eq(fundBalAfter), 'Expected Eth Blance to be '+ fundBal.add(new BigNumber('1e18')) + ', Found : ' + fundBalAfter);
    });

    it('Whitelist buy when unpaused', async function() {
      await this.sale.pause();
      let fundBal = await web3.eth.getBalance(fundsWallet);
      await this.sale.unpause();

      await this.sale.sendTransaction({from : authedInvestor01, value : web3.toWei(1, 'ether')});
      let tokensBal = await this.token.balanceOf(lockWallet);
      assert.isTrue(tokensBal.eq(new BigNumber('2e21')), 'Expected Locked Token Blance to be 2 000, Found : ' + tokensBal);
      let fundBalAfter = await web3.eth.getBalance(fundsWallet);
      assert.isTrue(fundBal.add(new BigNumber('1e18')).eq(fundBalAfter), 'Expected Eth Blance to be '+ fundBal.add(new BigNumber('1e18')) + ', Found : ' + fundBalAfter);
    });

  });
  
  describe('Accepting Payments', function() {

    // Tokens per Eth (Eth price $200, $0.10 per NRG)
    const rate = new BigNumber(2000);
    const valueWei = new web3.BigNumber(web3.toWei(3, 'ether'));
    const expectedTokenAmount = rate.mul(valueWei);
    // 4 000 000 tokens
    const totalTokens = new BigNumber('4e24');

    // 10 000 for sale
    const maxTokensSale = new BigNumber('1e21');
    // Min Buy 10 tokens
    const minInvest = new BigNumber('1e19');

    beforeEach(async function () {
      this.token = await ERC20Mock.new(tokenWallet, totalTokens);
      this.sale = await PrivatePreSale.new(fundsWallet, this.token.address, tokenWallet, lockWallet, maxTokensSale, minInvest);
      await this.token.approve(this.sale.address, maxTokensSale, { from: tokenWallet });
      await this.sale.addManyToWhitelist([authedInvestor01, authedInvestor02]);
    });

    it('Single Buy', async function() {
      let fundBal = await web3.eth.getBalance(fundsWallet);
      let investWei = web3.toWei(0.5, 'ether');
      let expectedTokens = new BigNumber(investWei).mul(rate);
      await this.sale.sendTransaction({from : authedInvestor01, value : investWei});
      let tokensBal = await this.token.balanceOf(lockWallet);
      assert.isTrue(tokensBal.eq(expectedTokens), 'Expected Locked Token Blance to be ' + expectedTokens + ', Found : ' + tokensBal);
      let fundBalAfter = await web3.eth.getBalance(fundsWallet);
      assert.isTrue(fundBal.add(investWei).eq(fundBalAfter), 'Expected Eth Blance to be '+ fundBal.add(investWei) + ', Found : ' + fundBalAfter);
    });

    it('Not Whitelist Buy', async function() {
      let fundBal = await web3.eth.getBalance(fundsWallet);
      await expectThrow(this.sale.sendTransaction({from : unauthedInvestor01, value : web3.toWei(1, 'ether')}));
      let tokensBal = await this.token.balanceOf(lockWallet);
      assert.isTrue(tokensBal.eq(new BigNumber('0')), 'Expected Locked Token Blance to be 0, Found : ' + tokensBal);
      let fundBalAfter = await web3.eth.getBalance(fundsWallet);
      assert.isTrue(fundBal.eq(fundBalAfter), 'Expected Eth Blance to be '+ fundBal.add(new BigNumber('1e18')) + ', Found : ' + fundBalAfter);
    });

    it('Max Buy', async function() {
      let fundBal = await web3.eth.getBalance(fundsWallet);
      let maxWeiBuy = maxTokensSale.div(rate);
      await this.sale.sendTransaction({from : authedInvestor01, value : maxWeiBuy});
      let tokensBal = await this.token.balanceOf(lockWallet);
      assert.isTrue(tokensBal.eq(maxTokensSale), 'Expected Locked Token Blance to be ' + maxTokensSale + ', Found : ' + tokensBal);
      let fundBalAfter = await web3.eth.getBalance(fundsWallet);
      assert.isTrue(fundBal.add(maxWeiBuy).eq(fundBalAfter), 'Expected Eth Blance to be '+ fundBal.add(maxWeiBuy) + ', Found : ' + fundBalAfter);

      let capReach = await this.sale.capReached.call();
      assert.isTrue(capReach, 'Expected the cap to be reached');
    });

    it('Buy 0 wei', async function() {
      let fundBal = await web3.eth.getBalance(fundsWallet);
      await expectThrow(this.sale.sendTransaction({from : authedInvestor01, value : 0}));
      let tokensBal = await this.token.balanceOf(lockWallet);
      assert.isTrue(tokensBal.eq(new BigNumber('0')), 'Expected Locked Token Blance to be 0, Found : ' + tokensBal);
      let fundBalAfter = await web3.eth.getBalance(fundsWallet);
      assert.isTrue(fundBal.eq(fundBalAfter), 'Expected Eth Blance to be '+ fundBal.add(new BigNumber('1e18')) + ', Found : ' + fundBalAfter);
    });

    it('Buy under min', async function() {
      let fundBal = await web3.eth.getBalance(fundsWallet);
      await expectThrow(this.sale.sendTransaction({from : authedInvestor01, value : minInvest.div(rate).sub(new BigNumber(1))}));
      let tokensBal = await this.token.balanceOf(lockWallet);
      assert.isTrue(tokensBal.eq(new BigNumber('0')), 'Expected Locked Token Blance to be 0, Found : ' + tokensBal);
      let fundBalAfter = await web3.eth.getBalance(fundsWallet);
      assert.isTrue(fundBal.eq(fundBalAfter), 'Expected Eth Blance to be '+ fundBal.add(new BigNumber('1e18')) + ', Found : ' + fundBalAfter);
    });

    it('Close', async function() {
      let fundBal = await web3.eth.getBalance(fundsWallet);
      await this.sale.closeSale();
      await expectThrow(this.sale.sendTransaction({from : authedInvestor01, value : web3.toWei(1, 'ether')}));
      let tokensBal = await this.token.balanceOf(lockWallet);
      assert.isTrue(tokensBal.eq(new BigNumber('0')), 'Expected Locked Token Blance to be 0, Found : ' + tokensBal);
      let fundBalAfter = await web3.eth.getBalance(fundsWallet);
      assert.isTrue(fundBal.eq(fundBalAfter), 'Expected Eth Blance to be '+ fundBal.add(new BigNumber('1e18')) + ', Found : ' + fundBalAfter);
    });
  });

});
