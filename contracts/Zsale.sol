// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Zsale {
    using ECDSA for bytes32;

    IERC20 weth;
    mapping(bytes32 => bool) public cancelled;
    mapping(uint256 => bool) public idconsumed; //saleid to consumed state

    event Purchased(address indexed seller, address indexed buyer, uint256 amount, address nftaddress, uint256 tokenid, uint256 expireblock, uint256 royalty, address nftcreator);
    event Cancelled(address indexed seller, uint256 saleid);

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
        uint256 saleid, 
        address seller, 
        uint256 price, 
        address nftaddress, 
        uint256 tokenid, 
        uint256 expireblock,
        uint256 royalty,
        address nftcreator) external 
    {
        require(seller != msg.sender, "zSale: sale to self");
        require(expireblock > block.number, "zSale: sale expired");
        
        bytes32 data = keccak256(abi.encode(
            saleid, address(this), block.chainid, price, nftaddress, tokenid, expireblock, royalty, nftcreator));
        require(!idconsumed[saleid], "zSale: data already consumed");
        require(seller == recover(toEthSignedMessageHash(data), signature),
            "zSale: recovered incorrect seller");
        require(!cancelled[data], "zSale: sale cancelled");
        
        idconsumed[saleid] = true;
        IERC721 nftcontract = IERC721(nftaddress);
        nftcontract.safeTransferFrom(seller, msg.sender, tokenid);
        SafeERC20.safeTransferFrom(weth, msg.sender, seller, price - royalty);
        SafeERC20.safeTransferFrom(weth, msg.sender, nftcreator, royalty);
        emit Purchased(seller, msg.sender, price, nftaddress, tokenid, expireblock, royalty, nftcreator);
    }

    function cancelSale(uint256 saleid, uint256 price, address nftaddress, uint256 tokenid, uint256 expireblock) external {
        IERC721 nftcontract = IERC721(nftaddress);
        require(nftcontract.ownerOf(tokenid) == msg.sender, "Sender isnt token owner");
        cancelled[
            keccak256(abi.encode(
            saleid, address(this), block.chainid, price, nftaddress, tokenid, expireblock))
        ] = true;

        emit Cancelled(msg.sender, saleid);
    }

    function recover(bytes32 hash, bytes memory signature) public pure returns (address) {
        return hash.recover(signature);
    }

    function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
        return hash.toEthSignedMessageHash();
    }
}