// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./IRegistrar.sol";
import "./IZNSHub.sol";

contract ZAuction is Initializable, OwnableUpgradeable {
  using ECDSA for bytes32;
  using SafeERC20 for IERC20;

  // Default ERC20 Token
  IERC20 public defaultToken;

  // To avoid overriding this variable in memory on upgrades we have to keep it
  IRegistrar public registrar;

  struct Listing {
    uint256 price;
    address holder;
    IERC20 token;
  }

  mapping(uint256 => Listing) public priceInfo;
  mapping(address => mapping(uint256 => bool)) public consumed;
  mapping(uint256 => uint256) public topLevelDomainIdCache;
  mapping(uint256 => uint256) public topLevelDomainFee;

  event BidAccepted(
    uint256 bidNonce,
    address indexed bidder,
    address indexed seller,
    uint256 amount,
    address nftAddress,
    uint256 tokenId,
    uint256 expireBlock,
    address paymentToken,
    uint256 topLevelDomainId
  );

  event DomainSold(
    address indexed buyer,
    address indexed seller,
    uint256 amount,
    address nftAddress,
    uint256 indexed tokenId,
    address paymentToken,
    uint256 topLevelDomainId
  );

  event BuyNowPriceSet(
    uint256 indexed tokenId,
    uint256 amount,
    address paymentToken
  );

  event BidCancelled(uint256 bidNonce, address indexed bidder);

  // On upgrade new variables must be inserted after all existing variables
  IZNSHub public hub;

  // Map top level domain ID to the ERC20 token used for that network.
  mapping(uint256 => IERC20) public networkToken;

  function initialize(IERC20 tokenAddress, IRegistrar registrarAddress)
    public
    initializer
  {
    __Ownable_init();
    defaultToken = tokenAddress;
    registrar = registrarAddress;
  }

  /// recovers bidder's signature based on seller's proposed data and, if bid data hash matches the message hash, transfers nft and payment
  /// @param signature type encoded message signed by the bidder
  /// @param bidNonce unique per address auction identifier chosen by seller
  /// @param bidder address of who the seller says the bidder is, for confirmation of the recovered bidder
  /// @param bid token amount bid
  /// @param tokenId token id we are transferring
  /// @param minbid minimum bid allowed
  /// @param startBlock block number at which acceptBid starts working
  /// @param expireBlock block number at which acceptBid stops working
  function acceptBid(
    bytes memory signature,
    uint256 bidNonce,
    address bidder,
    uint256 bid,
    uint256 tokenId,
    uint256 minbid,
    uint256 startBlock,
    uint256 expireBlock
  ) external {
    require(startBlock <= block.number, "zAuction: auction hasn't started");
    require(expireBlock > block.number, "zAuction: auction expired");
    require(minbid <= bid, "zAuction: cannot accept bid below min");
    require(bidder != msg.sender, "zAuction: cannot sell to self");
    require(msg.sender == hub.ownerOf(tokenId), "Only Owner");

    IRegistrar domainRegistrar = hub.getRegistrarForDomain(tokenId);

    // Don't include a token address when recreating bid data for legacy bids
    bytes32 data = createBid(
      bidNonce,
      bid,
      tokenId,
      minbid,
      startBlock,
      expireBlock,
      address(0)
    );

    require(
      bidder == recover(toEthSignedMessageHash(data), signature),
      "zAuction: recovered incorrect bidder"
    );
    require(!consumed[bidder][bidNonce], "zAuction: data already consumed");

    consumed[bidder][bidNonce] = true;

    uint256 topLevelDomainId = getTopLevelIdWithUpdate(tokenId);
    // Transfer payment, royalty to minter, and fee to topLevel domain
    paymentTransfers(
      bidder,
      bid,
      msg.sender,
      topLevelDomainId,
      tokenId,
      defaultToken
    );

    // Owner -> Bidder, send NFT
    domainRegistrar.safeTransferFrom(msg.sender, bidder, tokenId);

    emit BidAccepted(
      bidNonce,
      bidder,
      msg.sender,
      bid,
      address(domainRegistrar),
      tokenId,
      expireBlock,
      address(defaultToken),
      topLevelDomainId
    );
  }

  // Accept a bid but with the addition of a bidToken parameter to support v2.1 changes
  /// @param signature type encoded message signed by the bidder
  /// @param bidNonce unique per address auction identifier chosen by seller
  /// @param bidder address of who the seller says the bidder is, for confirmation of the recovered bidder
  /// @param bid token amount bid
  /// @param tokenId token id we are transferring
  /// @param minbid minimum bid allowed
  /// @param startBlock block number at which acceptBid starts working
  /// @param expireBlock block number at which acceptBid stops working
  /// @param bidToken the token used in payment for the bid
  function acceptBidV2(
    bytes memory signature,
    uint256 bidNonce,
    address bidder,
    uint256 bid,
    uint256 tokenId,
    uint256 minbid,
    uint256 startBlock,
    uint256 expireBlock,
    IERC20 bidToken
  ) external {
    require(startBlock <= block.number, "zAuction: auction hasn't started");
    require(expireBlock > block.number, "zAuction: auction expired");
    require(minbid <= bid, "zAuction: cannot accept bid below min");
    require(bidder != msg.sender, "zAuction: cannot sell to self");
    require(msg.sender == hub.ownerOf(tokenId), "Only Owner");

    // Disallow accepting bid if made in the wrong ERC20 token
    IERC20 domainToken = getTokenForDomain(tokenId);
    require(
      domainToken == bidToken,
      "zAuction: Only bids made with the network's token can be accepted"
    );

    IRegistrar domainRegistrar = hub.getRegistrarForDomain(tokenId);

    bytes32 data = createBid(
      bidNonce,
      bid,
      tokenId,
      minbid,
      startBlock,
      expireBlock,
      address(bidToken)
    );

    require(
      bidder == recover(toEthSignedMessageHash(data), signature),
      "zAuction: recovered incorrect bidder"
    );
    require(!consumed[bidder][bidNonce], "zAuction: data already consumed");

    consumed[bidder][bidNonce] = true;

    uint256 topLevelDomainId = getTopLevelIdWithUpdate(tokenId);
    // Transfer payment, royalty to minter, and fee to topLevel domain owner
    paymentTransfers(
      bidder,
      bid,
      msg.sender,
      topLevelDomainId,
      tokenId,
      bidToken
    );

    // Owner -> Bidder, send NFT
    domainRegistrar.safeTransferFrom(msg.sender, bidder, tokenId);

    emit BidAccepted(
      bidNonce,
      bidder,
      msg.sender,
      bid,
      address(domainRegistrar),
      tokenId,
      expireBlock,
      address(bidToken),
      topLevelDomainId
    );
  }

  /// Allows setting of a network token. Network is the same conceptually as a top level domain,
  /// so a network might be 0://wilder and network token would mean that every subdomain in that network
  /// e.g. 0://wilder.kitty will use that ERC20 token for bidding and sales.
  /// @param domainNetworkId The top level domainId of a network
  /// @param domainNetworkToken The token to set for purchases of subdomains in that network
  function setNetworkToken(uint256 domainNetworkId, IERC20 domainNetworkToken)
    external
    onlyOwner
  {
    // Setting to 0 will cause the system to fall back onto the default token
    require(
      networkToken[domainNetworkId] != domainNetworkToken,
      "No state change"
    );
    networkToken[domainNetworkId] = domainNetworkToken;
  }

  /// Admin modify default token
  /// @param newDefaultToken The new default ERC20 token to use
  function setDefaultToken(IERC20 newDefaultToken) external onlyOwner {
    require(
      newDefaultToken != IERC20(address(0)),
      "Must provide a valid default token"
    );
    defaultToken = newDefaultToken;
  }

  /// Allows for setting the buyNow price of a domain in either the network token or default token
  /// @param amount The price to be set
  /// @param tokenId The domain token to be put up for sale
  function setBuyPrice(uint256 amount, uint256 tokenId) external {
    IRegistrar domainRegistrar = hub.getRegistrarForDomain(tokenId);
    address owner = domainRegistrar.ownerOf(tokenId);

    require(msg.sender == owner, "zAuction: only owner can set price"); // fail

    require(
      priceInfo[tokenId].price != amount,
      "zAuction: listing already exists"
    );

    // Always set in whatever the current token for that domain is
    IERC20 paymentToken = getTokenForDomain(tokenId);

    priceInfo[tokenId] = Listing(amount, owner, paymentToken);
    emit BuyNowPriceSet(tokenId, amount, address(paymentToken));
  }

  /// recovers buyer's signature based on seller's proposed data and, if bid data hash matches the message hash, transfers nft and payment
  /// @param amount token amount of sale
  /// @param tokenId token id we are transferring
  function buyNow(uint256 amount, uint256 tokenId) external {
    require(priceInfo[tokenId].price != 0, "zAuction: item not for sale");
    require(amount == priceInfo[tokenId].price, "zAuction: wrong sale price");

    // It is possible the payment token is modified between the time
    // a buy price is set and the time it is accepted. If this is so,
    // we can't perform a buyNow sale as it is not set in the updated
    //token.
    IERC20 paymentToken = priceInfo[tokenId].token;
    IERC20 domainToken = getTokenForDomain(tokenId);
    require(
      paymentToken == domainToken,
      "zAuction: Listing not set in correct domain token"
    );

    IRegistrar domainRegistrar = hub.getRegistrarForDomain(tokenId);
    address seller = domainRegistrar.ownerOf(tokenId);

    require(msg.sender != seller, "zAuction: cannot sell to self");
    require(
      priceInfo[tokenId].holder == seller,
      "zAuction: not listed for sale"
    );

    // Transfer payment, royalty to minter, and fee to topLevel domain
    paymentTransfers(
      msg.sender,
      amount,
      seller,
      getTopLevelIdWithUpdate(tokenId),
      tokenId,
      paymentToken
    );

    uint256 topLevelId = getTopLevelIdWithUpdate(tokenId);

    // To disallow being shown as a sale after being already purchased, we set price to 0
    priceInfo[tokenId].price = 0;

    // Owner -> message sender, send NFT
    domainRegistrar.safeTransferFrom(seller, msg.sender, tokenId);

    emit DomainSold(
      msg.sender,
      seller,
      amount,
      address(domainRegistrar),
      tokenId,
      address(paymentToken),
      topLevelId
    );
  }

  /// Cancels an existing bid for an NFT by marking it as already consumed
  /// so that it can never be fulfilled.
  /// @param account The account that made the specific bid
  /// @param bidNonce A nonce for the bid (account based nonce)
  function cancelBid(address account, uint256 bidNonce) external {
    require(
      msg.sender == account,
      "zAuction: Cannot cancel someone else's bid"
    );
    require(
      !consumed[account][bidNonce],
      "zAuction: Cannot cancel an already consumed bid"
    );

    consumed[account][bidNonce] = true;

    emit BidCancelled(bidNonce, account);
  }

  /// Allows setting of a zNS Hub that provides access to multiple
  /// registrars for different domains, instead of a single one.
  /// Because this contract has already been deployed this value
  /// cannot be set in the initializer. On new upgrades, this must
  /// be run immediately afterwards.
  /// @param hubAddress The address of the zNS Hub deployment
  function setZNSHub(IZNSHub hubAddress) public onlyOwner {
    require(
      address(hubAddress) != address(0),
      "zAuction: Cannot set the zNSHub to an empty address"
    );
    require(hubAddress != hub, "zAuction: Cannot set to the same hub");
    hub = hubAddress;
  }

  /// Allows the owner of the given token to set the fee owed upon sale
  /// Amount given should be as a percent with 5 decimals of precision
  /// e.g. 10% (max) is 1000000, 0.0001% (min) is 1
  /// @param id The id of the domain to update
  /// @param amount The amount to set
  function setTopLevelDomainFee(uint256 id, uint256 amount) public {
    require(
      msg.sender == hub.ownerOf(id),
      "zAuction: Cannot set fee on unowned domain"
    );
    require(amount <= 1000000, "zAuction: Cannot set a fee higher than 10%");
    require(amount != topLevelDomainFee[id], "zAuction: Amount is already set");
    topLevelDomainFee[id] = amount;
  }

  /// Get the defined ERC20 token used for payment of a domain in either bidding
  /// or immediate buying.
  /// @param domainId The id of the domain to get an ERC20 token for
  function getTokenForDomain(uint256 domainId) public view returns (IERC20) {
    require(domainId != 0, "Must provide a valid domainId");

    uint256 topLevelDomainId = getTopLevelId(domainId);
    IERC20 domainToken = networkToken[topLevelDomainId];

    // If value is unset, or set to 0 intentionally, we return the default
    if (domainToken == IERC20(address(0))) {
      return defaultToken;
    } else {
      return domainToken;
    }
  }

  /// Fetch the top level domain fee if it exists and calculate the token amount
  /// @param topLevelId The id of the top level domain for a subdomain
  /// @param bid The bid for the fee to apply to
  function calculateTopLevelDomainFee(uint256 topLevelId, uint256 bid)
    public
    view
    returns (uint256)
  {
    require(topLevelId > 0, "zAuction: must provide a valid id");
    require(bid > 0, "zAuction: Cannot calculate domain fee on an empty bid");

    // Find what percent is specified as a top level fee
    uint256 fee = topLevelDomainFee[topLevelId];
    if (fee == 0) return 0;

    uint256 calculatedFee = (bid * fee * 10**13) / (100 * 10**18);

    return calculatedFee;
  }

  /// Fetch the minter royalty if it exists and calculate the token amount
  /// @param bid The bid for the royalty to be calculated
  /// @param id The id of the minted domain
  function calculateMinterRoyalty(uint256 id, uint256 bid)
    public
    pure
    returns (uint256)
  {
    require(id > 0, "zAuction: must provide a valid id");
    uint256 domainRoyalty = 1000000;
    uint256 royalty = (bid * domainRoyalty * 10**13) / (100 * 10**18);

    return royalty;
  }

  /// Create a bid object hashed with the current contract address
  /// @param bidNonce unique per address bid identifier chosen by seller
  /// @param bid token amount bid
  /// @param tokenId token id we are transferring
  /// @param minbid minimum bid allowed
  /// @param startBlock block number at which acceptBid starts working
  /// @param expireBlock block number at which acceptBid stops working
  /// @param bidToken The token used in that bid, 0 for legacy bids
  function createBid(
    uint256 bidNonce,
    uint256 bid,
    uint256 tokenId,
    uint256 minbid,
    uint256 startBlock,
    uint256 expireBlock,
    address bidToken
  ) public view returns (bytes32 data) {
    IRegistrar domainRegistrar = hub.getRegistrarForDomain(tokenId);

    // If a legacy bid we don't include the token address in hash
    if (bidToken == address(0)) {
      return
        keccak256(
          abi.encode(
            bidNonce,
            address(this),
            block.chainid,
            bid,
            address(domainRegistrar),
            tokenId,
            minbid,
            startBlock,
            expireBlock
          )
        );
    } else {
      return
        keccak256(
          abi.encode(
            bidNonce,
            address(this),
            block.chainid,
            bid,
            address(domainRegistrar),
            tokenId,
            minbid,
            startBlock,
            expireBlock,
            bidToken
          )
        );
    }
  }

  /// Get the top level domain ID of a given domain. Will return self if already the top level.
  /// Note will not update the cache once found, this is to keep it a view function. To force
  /// updating the cache, instead use getTopLevelIdWithUpdate(uint256) below
  ///
  /// @param tokenId The domain ID to get the top level domain for.
  function getTopLevelId(uint256 tokenId) public view returns (uint256) {
    uint256 topLevelDomainId = topLevelDomainIdCache[tokenId];
    if (topLevelDomainId != 0) {
      return topLevelDomainId;
    }

    uint256 parentId = hub.parentOf(tokenId);
    uint256 holder = tokenId;
    while (parentId != 0) {
      holder = parentId;
      parentId = hub.parentOf(parentId);
    }
    return holder;
  }

  /// Recover an account from a signature hash
  /// @param hash the bytes object
  /// @param signature the signature to recover from
  function recover(bytes32 hash, bytes memory signature)
    public
    pure
    returns (address)
  {
    return hash.recover(signature);
  }

  function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
    return hash.toEthSignedMessageHash();
  }

  /// Send all required payment transfers when an NFT is sold
  /// This requires paying the owner, minter, and top level domain owner
  /// @param bidder address of who the seller says the bidder is, for confirmation of the recovered bidder
  /// @param bid token amount bid
  /// @param owner address of the owner of that domain pre-transfer
  /// @param topLevelId the ID of the top level domain for a given domain or subdomain
  /// @param tokenId the ID of the domain
  /// @param paymentToken The token of the network for that domain, used for payment in bids
  function paymentTransfers(
    address bidder,
    uint256 bid,
    address owner,
    uint256 topLevelId,
    uint256 tokenId,
    IERC20 paymentToken
  ) internal {
    address topLevelOwner = hub.ownerOf(topLevelId);
    uint256 topLevelFee = calculateTopLevelDomainFee(topLevelId, bid);
    uint256 minterRoyalty = calculateMinterRoyalty(tokenId, bid);

    uint256 bidActual = bid - minterRoyalty - topLevelFee;

    // Bidder -> Owner, pay transaction
    SafeERC20.safeTransferFrom(paymentToken, bidder, owner, bidActual);

    IRegistrar domainRegistrar = hub.getRegistrarForDomain(tokenId);

    // Bidder -> Minter, pay minter royalty
    SafeERC20.safeTransferFrom(
      paymentToken,
      bidder,
      domainRegistrar.minterOf(tokenId),
      minterRoyalty
    );

    // Bidder -> topLevel Owner, pay top level owner fee
    SafeERC20.safeTransferFrom(
      paymentToken,
      bidder,
      topLevelOwner,
      topLevelFee
    );
  }

  /// Get top level domain id for a domain. Update the cache once this is found.
  /// @param tokenId The id to get the top level owner of
  function getTopLevelIdWithUpdate(uint256 tokenId) private returns (uint256) {
    uint256 topLevelId = topLevelDomainIdCache[tokenId];
    if (topLevelId == 0) {
      topLevelId = getTopLevelId(tokenId);
      topLevelDomainIdCache[tokenId] = topLevelId;
    }
    return topLevelId;
  }
}
