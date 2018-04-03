pragma solidity ^0.4.19;

import "./external/KYCWhitelist.sol";
import "./external/Pausable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Claimable.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract PrivatePreSale is Claimable, KYCWhitelist, Pausable {
  using SafeMath for uint256;

  
  // Wallet Address for funds
  address public constant FUNDS_WALLET = address(0);
  // Token Wallet Address
  address public constant TOKEN_WALLET = address(0);
  // Token adderss being sold
  address public constant TOKEN_ADDRESS = address(0);
  // Token being sold
  ERC20 public constant TOKEN = ERC20(TOKEN_ADDRESS);
  // Conversion Rate (Eth cost of 1 NRG)
  uint256 public constant TOKENS_PER_ETH = 0;
  // Max NRG tokens to sell
  uint256 public constant MAX_TOKENS = 4000000 * (10**18);
  // Min investment in Tokens
  uint256 public constant MIN_TOKEN_INVEST = 300000 * (10**18);
  // Token sale start date
  uint256 public constant START_DATE = 1522749798;

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
   * Event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

  // -----------------------------------------
  // Constructor
  // -----------------------------------------


  function PrivatePreSale() public {
    require(TOKENS_PER_ETH > 0);
    require(FUNDS_WALLET != address(0));
    require(TOKEN_WALLET != address(0));
    require(TOKEN_ADDRESS != address(0));
    require(MAX_TOKENS > 0);
    require(MIN_TOKEN_INVEST >= 0);
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
    TOKEN.transferFrom(TOKEN_WALLET, _beneficiary, tokenAmount);

    // Forward the funds to wallet
    FUNDS_WALLET.transfer(msg.value);

    // Event trigger
    TokenPurchase(msg.sender, _beneficiary, weiAmount, tokenAmount);
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

  /**
   * @dev Returns the amount of tokens given for the amount in Wei
   * @param _weiAmount Value in wei
   */
  function getTokenAmount(uint256 _weiAmount) internal pure returns (uint256) {
    // Amount in wei (10**18 wei == 1 eth) and the token is 18 decimal places
    return _weiAmount.mul(TOKENS_PER_ETH);
  }

  /**
   * @dev Closes the sale, can only be called once. Once closed can not be opened again.
   */
  function closeSale() public onlyOwner {
    require(!closed);
    closed = true;
  }
}