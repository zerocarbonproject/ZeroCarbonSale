const BigNumber = web3.BigNumber;

const ERC20Mock = artifacts.require("./mocks/ERC20Mock.sol");

contract('ERC20Mock', function([_, ctcOwner, customer1, customer2, customer3, customer4, customer5]) {

  describe('Test Construct', async function() {

    const totalTokenSupply = new BigNumber('200000000000000000000000000');

    beforeEach(async function () {
      this.token = await ERC20Mock.new(ctcOwner, totalTokenSupply);
    });

    it('Test MockToken Setup', async function() {
      var ctcOwnerBalance = await this.token.balanceOf(ctcOwner);
      assert.isTrue(totalTokenSupply.eq(ctcOwnerBalance));
    });
  });
});
