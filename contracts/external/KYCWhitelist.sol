pragma solidity ^0.4.19;

import "openzeppelin-solidity/contracts/ownership/Claimable.sol";

/**
 * @title KYCWhitelist
 * @dev Crowdsale in which only whitelisted users can contribute.
 */
contract KYCWhitelist is Claimable {

    mapping(address => bool) public whitelist;

    /**
    * @dev Reverts if beneficiary is not whitelisted. Can be used when extending this contract.
    */
    modifier isWhitelisted(address _beneficiary) {
        require(whitelist[_beneficiary]);
        _;
    }

    /**
    * @dev Does a "require" check if _beneficiary address is approved
    * @param _beneficiary Token beneficiary
    */
    function validateWhitelisted(address _beneficiary) internal view {
        require(whitelist[_beneficiary]);
    }

    /**
    * @dev Adds single address to whitelist.
    * @param _beneficiary Address to be added to the whitelist
    */
    function addToWhitelist(address _beneficiary) external onlyOwner {
        whitelist[_beneficiary] = true;
        emit addToWhiteListE(_beneficiary);
    }
    
    // ******************************** Test Start

    event addToWhiteListE(address _beneficiary);

    // ******************************** Test End


    /**
    * @dev Adds list of addresses to whitelist. Not overloaded due to limitations with truffle testing. 
    * @param _beneficiaries Addresses to be added to the whitelist
    */
    function addManyToWhitelist(address[] _beneficiaries) external onlyOwner {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            whitelist[_beneficiaries[i]] = true;
        }
    }

    /**
    * @dev Removes single address from whitelist. 
    * @param _beneficiary Address to be removed to the whitelist
    */
    function removeFromWhitelist(address _beneficiary) external onlyOwner {
        whitelist[_beneficiary] = false;
    }
}