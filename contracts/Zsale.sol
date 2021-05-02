// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/erc721/IERC721.sol";
contract Zsale {
    using ECDSA for bytes32;

    IERC20 weth;
    mapping(bytes32 => bool) public consumed;

    event Purchased(address indexed seller, address indexed buyer, uint256 amount, address nftaddress, uint256 tokenid, uint256 expireblock);

    constructor(IERC20 wethcontract) {
        weth = wethcontract;
    }
    
    /// recovers sellers's signature based on buyer's proposed data and, if sale data hash matches the message hash, transfers nft and payment
    /// @param signature type encoded message signed by the seller
    /// @param seller address of who the buyer says the seller is, for confirmation of the recovered seller
    /// @param price eth amount bid
    /// @param nftaddress contract address of the nft we are transferring
    /// @param tokenid token id we are transferring
    function purchase(
        bytes memory signature,
        uint256 auctionid, 
        address seller, 
        uint256 price, 
        address nftaddress, 
        uint256 tokenid, 
        uint256 expireblock) external 
    {
        require(seller != msg.sender, "zSale: sale to self");
        require(price != 0, "zSale: zero price");
        require(expireblock > block.number, "zSale: sale expired");
        
        bytes32 data = keccak256(abi.encode(
            auctionid, address(this), block.chainid, price, nftaddress, tokenid, expireblock));
        require(!consumed[data], 'zSale: data already consumed');
        require(seller == recover(toEthSignedMessageHash(data), signature),
                 'zSale: recovered incorrect seller');
        
        consumed[data] = true;
        IERC721 nftcontract = IERC721(nftaddress);
        nftcontract.transferFrom(seller, msg.sender, tokenid);
        weth.transferFrom(msg.sender, seller, price);

        emit Purchased(seller, msg.sender, price, nftaddress, tokenid, expireblock);
    }
   
    function recover(bytes32 hash, bytes memory signature) public pure returns (address) {
        return hash.recover(signature);
    }

    function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
        return hash.toEthSignedMessageHash();
    }
}