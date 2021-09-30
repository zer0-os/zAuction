// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./IRegistrar.sol";

contract ZAuction is Initializable, OwnableUpgradeable, ERC721Upgradeable {
  using ECDSA for bytes32;

  IERC20 public token;
  IRegistrar public registrar;

  // Original zAuction contract address for backward compatibility
  address legacyZAuction;
  mapping(address => mapping(uint256 => bool)) public consumed;

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
    IRegistrar registrarAddress,
    address legacyZAuctionAddress
  ) public initializer {
    __Ownable_init();
    token = tokenAddress;
    registrar = registrarAddress;
    legacyZAuction = legacyZAuctionAddress;
  }

  /// recovers bidder's signature based on seller's proposed data and, if bid data hash matches the message hash, transfers nft and payment
  /// @param signature type encoded message signed by the bidder
  /// @param auctionId unique per address auction identifier chosen by seller
  /// @param bidder address of who the seller says the bidder is, for confirmation of the recovered bidder
  /// @param bid token amount bid
  /// @param nftAddress contract address of the nft we are transferring
  /// @param tokenId token id we are transferring
  /// @param minbid minimum bid allowed
  /// @param startBlock block number at which acceptBid starts working
  /// @param expireBlock block number at which acceptBid stops working
  function acceptBid(
    bytes memory signature,
    uint256 auctionId,
    address bidder,
    uint256 bid,
    address nftAddress,
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
      nftAddress,
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
        nftAddress,
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

    // tokenId === domainId in zNS registrar
    // Gets royalty as percent + 5 decimal places, e.g. 10% === 1000000
    uint256 royalty = calculateRoyalty(bid, tokenId);

    // require statement for possible overflow?
    IERC721 nftContract = IERC721(nftAddress);
    consumed[bidder][auctionId] = true;
    // Bidder -> Owner, pay transaction
    SafeERC20.safeTransferFrom(token, bidder, msg.sender, bid - royalty);
    // Bidder -> Top level owner, pay royalty
    // address rootParentAddress = rootParentOf(tokenId);
    SafeERC20.safeTransferFrom(
      token,
      bidder,
      // get address from id?
      registrar.minterOf(tokenId),
      royalty
    );
    // Owner -> Bidder, send NFT
    nftContract.safeTransferFrom(msg.sender, bidder, tokenId);
    emit BidAccepted(
      auctionId,
      bidder,
      msg.sender,
      bid,
      address(nftContract),
      tokenId,
      expireBlock
    );
  }

  function calculateRoyalty(uint256 bid, uint256 id)
    public
    view
    returns (uint256)
  {
    require(id > 0, "zAuction: must provide a valid id");
    uint256 domainRoyalty = registrar.domainRoyaltyAmount(id);
    if (domainRoyalty == 0) return 0;
    uint256 divisor = 10000000 / domainRoyalty;
    uint256 calculatedRoyalty = (bid / divisor);
    return calculatedRoyalty;
  }

  // function setRoyaltyAmount(uint256 id, uint256 amount) public {
  //   // unlock metadata first?
  //   registrar.setDomainRoyaltyAmount(id, amount);
  // }

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

  function rootParentOf(uint256 id) external view returns (address) {
    uint256 parentId = registrar.parentOf(id);
    uint256 holder = 0;
    while (parentId != 0) {
      holder = parentId; // Hold on to previous parent
      parentId = registrar.parentOf(parentId);
    }
    address rootAddress;
    // id was already root parent owner
    if (holder == 0) {
      rootAddress = ownerOf(id);
      return rootAddress;
    }
    rootAddress = ownerOf(holder);
    return rootAddress;
  }
}
