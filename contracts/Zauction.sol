// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Zauction {
    using ECDSA for bytes32;

    IERC20 weth;
    mapping(address => mapping(uint256 => bool)) public consumed;
    mapping(address => mapping(uint256 => uint256)) cancelprice;
    
    event Cancelled(address indexed bidder, uint256 indexed auctionid, uint256 price);
    event BidAccepted(
        uint256 auctionid, 
        address indexed bidder, 
        address indexed seller, 
        uint256 amount, 
        address nftaddress, 
        uint256 tokenid, 
        uint256 expireblock
    );

    constructor(IERC20 wethcontract) {
        weth = wethcontract;
    }

    /// recovers bidder's signature based on seller's proposed data and, if bid data hash matches the message hash, transfers nft and payment
    /// @param signature type encoded message signed by the bidder
    /// @param auctionid unique per address auction identifier chosen by seller
    /// @param bidder address of who the seller says the bidder is, for confirmation of the recovered bidder
    /// @param bid weth amount bid
    /// @param nftaddress contract address of the nft we are transferring
    /// @param tokenid token id we are transferring
    /// @param minbid minimum bid allowed
    /// @param startblock block number at which acceptBid starts working
    /// @param expireblock block number at which acceptBid stops working
    function acceptBid(
        bytes memory signature,
        uint256 auctionid, 
        address bidder, 
        uint256 bid, 
        address nftaddress, 
        uint256 tokenid, 
        uint256 minbid,
        uint256 startblock,
        uint256 expireblock) external 
    {    
        require(startblock <= block.number, "zAuction: auction hasnt started");
        require(expireblock > block.number, "zAuction: auction expired");
        require(minbid <= bid, "zAuction: cant accept bid below min");
        require(bidder != msg.sender, "zAuction: sale to self");

        bytes32 data = keccak256(abi.encode(
            auctionid, address(this), block.chainid, bid, nftaddress, tokenid, minbid, startblock, expireblock));
        require(bidder == recover(toEthSignedMessageHash(data), signature),
            "zAuction: recovered incorrect bidder");
        require(!consumed[bidder][auctionid], "zAuction: data already consumed");
        require(bid > cancelprice[bidder][auctionid], "zAuction: below cancel price");

        IERC721 nftcontract = IERC721(nftaddress);
        consumed[bidder][auctionid] = true;
        SafeERC20.safeTransferFrom(weth, bidder, msg.sender, bid);
        nftcontract.safeTransferFrom(msg.sender, bidder, tokenid);
        emit BidAccepted(auctionid, bidder, msg.sender, bid, address(nftcontract), tokenid, expireblock);
    }
    
    /// invalidates all sender's bids at and under given price
    /// @param auctionid unique per address auction identifier chosen by seller
    /// @param price weth amount to cancel at and under
    function cancelBidsUnderPrice(uint256  auctionid, uint256 price) external {
        cancelprice[msg.sender][auctionid] = price;
        emit Cancelled(msg.sender, auctionid, price);
    }


    function recover(bytes32 hash, bytes memory signature) public pure returns (address) {
        return hash.recover(signature);
    }

    function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
        return hash.toEthSignedMessageHash();
    }
}