// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/erc721/IERC721.sol";

contract zAuction {
    using ECDSA for bytes32;

    IERC20 weth;

    mapping(bytes32 => bool) public consumed;

    event Purchased(address indexed seller, address indexed buyer, uint256 amount, address nftaddress, uint256 tokenid, uint256 expireblock);
    event BidAccepted(address indexed bidder, address indexed seller, uint256 amount, address nftaddress, uint256 tokenid, uint256 expireblock);

    constructor(IERC20 _weth) {
        weth = _weth;
    }
    
    /// recovers sellers's signature based on buyer's proposed data and, if sale data hash matches the message hash, transfers nft and payment
    /// @param signature type encoded message signed by the seller
    /// @param seller address of who the buyer says the seller is, for confirmation of the recovered seller
    /// @param price eth amount bid
    /// @param nftaddress contract address of the nft we are transferring
    /// @param tokenid token id we are transferring
    function wethPurchase(
        bytes memory signature, 
        address seller, 
        uint256 price, 
        address nftaddress, 
        uint256 tokenid, 
        uint256 expireblock,
        uint256 auctionid,
        uint8 functionselector) external 
    {
        bytes32 data = keccak256(abi.encode(
            auctionid, address(this), block.chainid, price, nftaddress, tokenid, expireblock, functionselector));
        require(seller == recover(toEthSignedMessageHash(data), signature),
                 'zAuction: recovered incorrect seller');
        require(seller != msg.sender, 'zAuction: sale to self');
        require(functionselector == 1, 'zAuction: unauthorized function');
        require(price != 0, 'zAuction: zero price');
        require(expireblock > block.number, 'zAuction: sale expired');
        require(!consumed[data], 'zAuction: Signature already used');
        
        consumed[data] = true;
        IERC721 nftcontract = IERC721(nftaddress);
        nftcontract.transferFrom(seller, msg.sender, tokenid);
        weth.transferFrom(msg.sender, seller, price);
        emit Purchased(seller, msg.sender, price, nftaddress, tokenid, expireblock);
    }
    ///@dev same as purchase, but deposits directly into the seller's ethbalance in the accountant 
    function purchaseAndPay(
        bytes memory signature, 
        address payable seller, 
        uint256 price, 
        address nftaddress, 
        uint256 tokenid, 
        uint256 expireblock,
        uint256 auctionid,
        uint8 functionselector) external payable{
        
        bytes32 data = keccak256(abi.encode(
            auctionid, address(this), block.chainid, price, nftaddress, tokenid, expireblock, functionselector));
        require(seller == recover(toEthSignedMessageHash(data)),'zAuction: recovered incorrect seller');
        require(seller != msg.sender, 'zAuction: sale to self');
        require(price != 0, 'zAuction: zero price');
        require(functionselector == 1, 'zAuction: unauthorized function');
        require(msg.value == price, 'zAuction: invalid payment');
        require(price == msg.value, 'zAuction: invalid payment');
        require(expireblock > block.number, 'zAuction: sale expired');
        require(!consumed[data], 'zAuction: Signature already used');

        consumed[data] = true;
        IERC721 nftcontract = IERC721(nftaddress);
        nftcontract.transferFrom(seller, msg.sender, tokenid);
        seller.transfer(msg.value);
        emit Purchased(seller, msg.sender, price, nftaddress, tokenid, expireblock);
    }

    /// recovers bidder's signature based on seller's proposed data and, if bid data hash matches the message hash, transfers nft and payment
    /// @param signature type encoded message signed by the bidder
    /// @param bidder address of who the seller says the bidder is, for confirmation of the recovered bidder
    /// @param bid eth amount bid
    /// @param nftaddress contract address of the nft we are transferring
    /// @param tokenid token id we are transferring
    
    /// @dev 'true' in the hash here is the eth/weth switch
    function acceptBid(
        bytes memory signature, 
        address bidder, 
        uint256 bid, 
        address nftaddress, 
        uint256 tokenid, 
        uint256 expireblock,
        uint256 auctionid,
        uint8 functionselector) external {
        
        bytes32 data = keccak256(abi.encode(
            auctionid, address(this), block.chainid, bid, nftaddress, tokenid, expireblock, functionselector))), signature);
        require(bidder == recover(toEthSignedMessageHash(data),
            'zAuction: recovered incorrect bidder');
        require(bidder != msg.sender, 'zAuction: sale to self');
        require(functionselector == 3, 'zAuction: unauthorized function');
        require(bid != 0, 'zAuction: zero bid');
        require(expireblock > block.number, 'zAuction: bid expired');
        require(!consumed[data], 'zAuction: Signature already used');
        
        consumed[data] = true;
        IERC721 nftcontract = IERC721(nftaddress);
        weth.transferFrom(bidder, msg.sender, bid);
        nftcontract.transferFrom(msg.sender, bidder, tokenid);
        emit BidAccepted(bidder, msg.sender, bid, nftaddress, tokenid, expireblock);
    }
    
    function recover(bytes32 hash, bytes memory signature) public pure returns (address) {
        return hash.recover(signature);
    }

    function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
        return hash.toEthSignedMessageHash();
    }
}