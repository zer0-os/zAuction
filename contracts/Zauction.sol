// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./IRegistrar.sol";

contract ZAuction is Initializable, OwnableUpgradeable {
  using ECDSA for bytes32;

  IERC20 public token;
  IERC721 public nft;
  IRegistrar public registrar;

  // Original zAuction contract address for backward compatibility
  address legacyZAuction;

  mapping(address => mapping(uint256 => bool)) public consumed;
  mapping(uint256 => uint256) public rootDomainId;
  mapping(uint256 => uint256) public rootDomainRoyalty;

  event BidAccepted(
    uint256 auctionId,
    address indexed bidder,
    address indexed seller,
    uint256 amount,
    address nftAddress,
    uint256 tokenId,
    uint256 expireBlock
  );

  function initialize(
    IERC20 tokenAddress,
    IERC721 nftAddress,
    IRegistrar registrarAddress,
    address legacyZAuctionAddress
  ) public initializer {
    __Ownable_init();
    token = tokenAddress;
    nft = nftAddress;
    registrar = registrarAddress;
    legacyZAuction = legacyZAuctionAddress;
  }

  /// recovers bidder's signature based on seller's proposed data and, if bid data hash matches the message hash, transfers nft and payment
  /// @param signature type encoded message signed by the bidder
  /// @param auctionId unique per address auction identifier chosen by seller
  /// @param bidder address of who the seller says the bidder is, for confirmation of the recovered bidder
  /// @param bid token amount bid
  /// @param tokenId token id we are transferring
  /// @param minbid minimum bid allowed
  /// @param startBlock block number at which acceptBid starts working
  /// @param expireBlock block number at which acceptBid stops working
  function acceptBid(
    bytes memory signature,
    uint256 auctionId,
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

    bytes32 data = createBid(
      auctionId,
      bid,
      address(nft),
      tokenId,
      minbid,
      startBlock,
      expireBlock
    );

    if (bidder != recover(toEthSignedMessageHash(data), signature)) {
      // Encode data with legacy zAuction address for backwards compatibility
      bytes32 legacyData = createLegacyBid(
        auctionId,
        bid,
        address(nft),
        tokenId,
        minbid,
        startBlock,
        expireBlock
      );
      require(
        bidder == recover(toEthSignedMessageHash(legacyData), signature),
        "zAuction: recovered incorrect bidder"
      );
    }
    require(!consumed[bidder][auctionId], "zAuction: data already consumed");

    uint256 rootId = rootDomainId[tokenId];
    if (rootId == 0) {
      rootId = rootDomainIdOf(tokenId);
      rootDomainId[tokenId] = rootId;
    }

    consumed[bidder][auctionId] = true;

    // Transfer payment and royalties
    paymentTransfers(bidder, bid, msg.sender, rootId, tokenId);

    // Owner -> Bidder, send NFT
    nft.safeTransferFrom(msg.sender, bidder, tokenId);

    emit BidAccepted(
      auctionId,
      bidder,
      msg.sender,
      bid,
      address(nft),
      tokenId,
      expireBlock
    );
  }

  function paymentTransfers(
    address bidder,
    uint256 bid,
    address sender,
    uint256 rootId,
    uint256 tokenId
  ) public {
    address rootOwner = nft.ownerOf(rootId);
    uint256 rootRoyalty = calculateRootOwnerRoyalty(rootId, bid, tokenId);
    uint256 minterRoyalty = calculateMinterRoyalty(bid, tokenId);

    uint256 bidActual = bid - minterRoyalty - rootRoyalty;

    // Bidder -> Owner, pay transaction
    SafeERC20.safeTransferFrom(token, bidder, sender, bidActual);

    // Bidder -> Minter, pay minter royalty
    SafeERC20.safeTransferFrom(
      token,
      bidder,
      registrar.minterOf(tokenId),
      minterRoyalty
    );

    // Bidder -> Root Owner, pay root owner royalty
    SafeERC20.safeTransferFrom(token, bidder, rootOwner, rootRoyalty);
  }

  function calculateRootOwnerRoyalty(
    uint256 rootId,
    uint256 bid,
    uint256 id
  ) public view returns (uint256) {
    require(id > 0, "zAuction: must provide a valid id");

    // Find what percent they've specified as a royalty
    uint256 royalty = rootDomainRoyalty[rootId];

    // If not found or 0% royalty
    if (royalty == 0) return 0;
    // if not found because it's new do we just say 0?

    // Pad with 18 zeroes for precision
    uint256 divisor = (100 * 10**18) / (royalty * 10**18);
    uint256 calculatedRoyalty = (bid / divisor);
    return calculatedRoyalty;
  }

  function calculateMinterRoyalty(uint256 bid, uint256 id)
    public
    view
    returns (uint256)
  {
    require(id > 0, "zAuction: must provide a valid id");
    // Returns with 5 decimal points of accuracy
    uint256 domainRoyalty = registrar.domainRoyaltyAmount(id);
    if (domainRoyalty == 0) return 0; // same here, 0 for 0% or 0 for not found?

    // Pad with 18 zeroes for precision, 13 for domainRoyalty as already 5 decimal points captured
    uint256 divisor = (100 * (10**18)) / (domainRoyalty * 10**13);
    uint256 calculatedRoyalty = (bid / divisor);
    return calculatedRoyalty;
  }

  function setRootRoyaltyAmount(uint256 id, uint256 amount) public {
    rootDomainRoyalty[id] = amount;
  }

  function setRegistrarRoyaltyAmount(uint256 id, uint256 amount) public {
    registrar.setDomainRoyaltyAmount(id, amount);
  }

  function createBid(
    uint256 auctionId,
    uint256 bid,
    address nftAddress,
    uint256 tokenId,
    uint256 minbid,
    uint256 startBlock,
    uint256 expireBlock
  ) public view returns (bytes32 data) {
    data = keccak256(
      abi.encode(
        auctionId,
        address(this),
        block.chainid,
        bid,
        nftAddress,
        tokenId,
        minbid,
        startBlock,
        expireBlock
      )
    );
    return data;
  }

  function createLegacyBid(
    uint256 auctionId,
    uint256 bid,
    address nftAddress,
    uint256 tokenId,
    uint256 minbid,
    uint256 startBlock,
    uint256 expireBlock
  ) public view returns (bytes32 data) {
    data = keccak256(
      abi.encode(
        auctionId,
        legacyZAuction,
        block.chainid,
        bid,
        nftAddress,
        tokenId,
        minbid,
        startBlock,
        expireBlock
      )
    );
    return data;
  }

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

  function rootDomainIdOf(uint256 id) public view returns (uint256) {
    uint256 parentId = registrar.parentOf(id);
    uint256 holder = id;
    while (parentId != 0) {
      holder = parentId; // Hold on to previous parent
      parentId = registrar.parentOf(parentId);
    }
    return holder;
  }
}
