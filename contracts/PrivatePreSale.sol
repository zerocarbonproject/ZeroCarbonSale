pragma solidity ^0.4.24;

import "./external/KYCWhitelist.sol";
import "./external/Pausable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Claimable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/**
 * @title PrivatePreSale
 * 
 * Private Pre-sale contract for Energis tokens
 *
 * (c) Philip Louw / Zero Carbon Project 2018. The MIT Licence.
 */
contract PrivatePreSale is Claimable, KYCWhitelist, Pausable {
    using SafeMath for uint256;

  
    // Send ETH to this address
    address public FUNDS_WALLET;
    // ZCC for sale wallet address
    address public TOKEN_WALLET;
    // ZCC token contract address
    ERC20 public TOKEN;
    // Wallet to store sold Tokens needs to be locked
    address public LOCKUP_WALLET;
    // Conversion Rate (Eth cost of 1 NRG) (Testing uses ETH price of $200)
    uint256 public constant TOKENS_PER_ETH = 2000;
    // Max NRG tokens to sell
    uint256 public MAX_TOKENS = 4000000 * (10**18);
    // Min investment in Tokens
    uint256 public MIN_TOKEN_INVEST = 300000 * (10**18);
    // Token sale start date
    uint256 public START_DATE = 1522749798;

    // -----------------------------------------
    // State Variables
    // -----------------------------------------

    // Amount of wei raised
    uint256 public weiRaised;
    // Amount of tokens issued
    uint256 public tokensIssued;
    // If the pre-sale has ended
    bool public closed;

    // -----------------------------------------
    // Events
    // -----------------------------------------

    /**
    * @dev Event for token purchased
    * @param purchaser who paid for the tokens
    * @param beneficiary who got the tokens
    * @param value weis paid for purchase
    * @param amount amount of tokens purchased
    */
    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);


    /**
     * @dev Constructor
     * @param fundsWallet Wallet address where ETH is sent to
     * @param tokenWallet The wallet holding the token, allowance is setup
     */
    constructor(
      address fundsWallet, 
      ERC20 tokenAddress, 
      address tokenWallet, 
      address lockWallet,
      uint256 maxTokensForSale, 
      uint256 minTokenInvest) 
      public {
        assert(fundsWallet != address(0));
        assert(tokenAddress != address(0));
        assert(tokenWallet != address(0));
        assert(lockWallet != address(0));
        assert(maxTokensForSale > 0);
        assert(minTokenInvest >= 0);

        FUNDS_WALLET = fundsWallet;
        TOKEN_WALLET = tokenWallet;
        TOKEN = tokenAddress;
        LOCKUP_WALLET = lockWallet;

        MAX_TOKENS = maxTokensForSale;
        MIN_TOKEN_INVEST = minTokenInvest;
    }

    // -----------------------------------------
    // Private PreSale external Interface
    // -----------------------------------------

    /**
    * @dev Checks whether the cap has been reached. 
    * @return Whether the cap was reached
    */
    function capReached() public view returns (bool) {
        return tokensIssued >= MAX_TOKENS;
    }

    /**
    * @dev Closes the sale, can only be called once. Once closed can not be opened again.
    */
    function closeSale() public onlyOwner {
        assert(!closed);
        closed = true;
    }

    /**
    * @dev Returns the amount of tokens given for the amount in Wei
    * @param _weiAmount Value in wei
    */
    function getTokenAmount(uint256 _weiAmount) public pure returns (uint256) {
        // Amount in wei (10**18 wei == 1 eth) and the token is 18 decimal places
        return _weiAmount.mul(TOKENS_PER_ETH);
    }

    /**
    * @dev fallback function ***DO NOT OVERRIDE***
    */
    function () external payable {
        buyTokens(msg.sender);
    }

    // -----------------------------------------
    // Private PreSale internal
    // -----------------------------------------

    /**
    * @dev low level token purchase ***DO NOT OVERRIDE***
    * @param _beneficiary Address performing the token purchase
    */
    function buyTokens(address _beneficiary) internal whenNotPaused {

        uint256 weiAmount = msg.value;

        // calculate token amount to be created
        uint256 tokenAmount = getTokenAmount(weiAmount);

        // Validation Checks
        preValidateChecks(_beneficiary, weiAmount, tokenAmount);
        
        

        // update state
        tokensIssued = tokensIssued.add(tokenAmount);
        weiRaised = weiRaised.add(weiAmount);

        // Send tokens from token wallet
        TOKEN.transferFrom(TOKEN_WALLET, LOCKUP_WALLET, tokenAmount);       

        // Forward the funds to wallet
        FUNDS_WALLET.transfer(msg.value);

        // Event trigger
        emit TokenPurchase(msg.sender, _beneficiary, weiAmount, tokenAmount);
    }

    /**
    * @dev Validation of an incoming purchase. Use require statements to revert state when conditions are not met. Use super to concatenate validations.
    * @param _beneficiary Address performing the token purchase
    * @param _weiAmount Value in wei involved in the purchase
    * @param _tokenAmount Amount of token to purchase
    */
    function preValidateChecks(address _beneficiary, uint256 _weiAmount, uint256 _tokenAmount) internal view {
        require(_beneficiary != address(0));
        require(_weiAmount != 0);
        require(now >= START_DATE);
        require(!closed);

        // KYC Check
        validateWhitelisted(_beneficiary);

        // Test Min Investment
        require(_tokenAmount >= MIN_TOKEN_INVEST);

        // Test hard cap
        require(tokensIssued.add(_tokenAmount) <= MAX_TOKENS);
    }
}