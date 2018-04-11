var SimpleToken = artifacts.require("./SimpleToken.sol");
var PrivatePreSale = artifacts.require("./PrivatePreSale.sol");
 
module.exports = function(deployer) {
  deployer.deploy(SimpleToken).then(function() {
    deployer.deploy(PrivatePreSale,0xf17f52151ebef6c7334fad080c5704d77216b732, SimpleToken.address, 0x627306090abab3a6e1400e9345bc60c78a8bef57);
  });
};