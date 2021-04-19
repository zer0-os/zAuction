// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "./oz/util/ECDSA.sol";
import "./oz/erc20/IERC20.sol";
import "./oz/erc721/IERC721.sol";
import "./zAuctionAccountant.sol";

contract zAuction {
    using ECDSA for bytes32;

    bool initialized;
    zAuctionAccountant accountant;
    IERC20 weth = IERC20(address(0xc778417E063141139Fce010982780140Aa0cD5Ab)); // rinkeby weth

    mapping(bytes32 => bool) public sigUsed;

    event BidAccepted(address indexed bidder, address indexed seller, uint256 amount, address nftaddress, uint256 tokenid, uint256 expireblock);
    event WethBidAccepted(address indexed bidder, address indexed seller, uint256 amount, address nftaddress, uint256 tokenid, uint256 expireblock);

    constructor(address accountantaddress) {
        accountant = zAuctionAccountant(accountantaddress);
    }

    /// recovers bidder's signature based on seller's proposed data and, if bid data hash matches the message hash, transfers nft and payment
    /// @param signature type encoded message signed by the bidder
    /// @param bidder address of who the seller says the bidder is, for confirmation of the recovered bidder
    /// @param bid eth amount bid
    /// @param nftaddress contract address of the nft we are transferring
    /// @param tokenid token id we are transferring
    function acceptBid(bytes memory signature, address bidder, uint256 bid, address nftaddress, uint256 tokenid, uint256 expireblock) external {
        require(bid != 0, 'zAuction: zero bid');
        require(expireblock > block.number, 'zAuction: bid expired');
        require(!sigUsed[keccak256(signature)], 'zAuction: Signature already used');
        address recoveredbidder = recover(toEthSignedMessageHash(keccak256(abi.encode(address(this), block.chainid, bid, nftaddress, tokenid, expireblock))), signature);
        require(bidder == recoveredbidder, 'zAuction: incorrect bidder');
        
        sigUsed[keccak256(signature)] = true;
        IERC721 nftcontract = IERC721(nftaddress);
        accountant.Exchange(bidder, msg.sender, bid);
        nftcontract.transferFrom(msg.sender, bidder, tokenid);
        emit BidAccepted(bidder, msg.sender, bid, nftaddress, tokenid, expireblock);
    }
    
    /// @dev 'true' in the hash here is the eth/weth switch
    function acceptWethBid(bytes memory signature, address bidder, uint256 bid, address nftaddress, uint256 tokenid, uint256 expireblock) external {
        require(bid != 0, 'zAuction: zero bid');
        require(expireblock > block.number, 'zAuction: bid expired');
        require(!sigUsed[keccak256(signature)], 'zAuction: Signature already used');
        address recoveredbidder = recover(toEthSignedMessageHash(keccak256(abi.encode(address(this), block.chainid, bid, nftaddress, tokenid, expireblock, true))), signature);
        require(bidder == recoveredbidder, 'zAuction: incorrect bidder');
        
        sigUsed[keccak256(signature)] = true;
        IERC721 nftcontract = IERC721(nftaddress);
        weth.transferFrom(bidder, msg.sender, bid);
        nftcontract.transferFrom(msg.sender, bidder, tokenid);
        emit WethBidAccepted(bidder, msg.sender, bid, nftaddress, tokenid, expireblock);
    }
    
    function recover(bytes32 hash, bytes memory signature) public pure returns (address) {
        return hash.recover(signature);
    }

    function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
        return hash.toEthSignedMessageHash();
    }
}