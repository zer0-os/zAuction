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
  IRegistrar public registrar;

  // Original zAuction contract address for backward compatibility
  address zAuctionV1;
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
    address zAuctionV1Address
  ) public initializer {
    __Ownable_init();
    token = tokenAddress;
    registrar = registrarAddress;
    zAuctionV1 = zAuctionV1Address;
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
      // Check v1 encoding for backwards compatibility
      bytes32 dataV1 = createBidV1(
        auctionId,
        bid,
        nftAddress,
        tokenId,
        minbid,
        startBlock,
        expireBlock
      );
      require(
        bidder == recover(toEthSignedMessageHash(dataV1), signature),
        "zAuction: recovered incorrect bidder"
      );
    }
    require(!consumed[bidder][auctionId], "zAuction: data already consumed");

    // Will truncate any decimals
    uint256 royalty = bid / 10;

    IERC721 nftContract = IERC721(nftAddress);
    consumed[bidder][auctionId] = true;
    // Bidder -> Owner, send funds
    SafeERC20.safeTransferFrom(token, bidder, msg.sender, bid - royalty);
    // Bidder -> Registrar, pay royalty
    SafeERC20.safeTransferFrom(
      token,
      bidder,
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

  function createBidV1(
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
        zAuctionV1,
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
}
