// #1 Get an instance of the contract to be deployed/migrated
var KycContract = artifacts.require("./KycContract.sol");
var Test01 = artifacts.require("./Test01.sol");
var Test02 = artifacts.require("./Test02.sol");


module.exports = function(deployer) {
  // #2 Deploy the instance of the contract
  deployer.deploy(KycContract).then(function() {
    return deployer.deploy(Test01,KycContract.address);
  });
  deployer.deploy(Test02);
};
