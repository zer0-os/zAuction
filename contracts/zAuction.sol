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
    IERC20 weth = IERC20(address(0xc778417E063141139Fce010982780140Aa0cD5Ab));

    mapping(uint256 => bool) public randUsed;

    event BidAccepted(address indexed bidder, address indexed seller, uint256 amount, address nftaddress, uint256 tokenid);

    function init(address accountantaddress) external {
        require(!initialized);
        initialized = true;
        accountant = zAuctionAccountant(accountantaddress);
    }

    function acceptBid(bytes memory signature, uint256 rand, address bidder, uint256 bid, address nftaddress, uint256 tokenid) external {
        address recoveredbidder = recover(toEthSignedMessageHash(keccak256(abi.encode(rand, address(this), block.chainid, bid, nftaddress, tokenid))), signature);
        require(bidder == recoveredbidder, 'zAuction: incorrect bidder');
        require(!randUsed[rand], 'Random nonce already used');
        randUsed[rand] = true;
        IERC721 nftcontract = IERC721(nftaddress);
        accountant.Exchange(bidder, msg.sender, bid);
        nftcontract.transferFrom(msg.sender, bidder, tokenid);
        emit BidAccepted(bidder, msg.sender, bid, nftaddress, tokenid);
    }

    function acceptWethBid(bytes memory signature, uint256 rand, address bidder, uint256 bid, address nftaddress, uint256 tokenid) external {
        address recoveredbidder = recover(toEthSignedMessageHash(keccak256(abi.encode(rand, address(this), block.chainid, bid, nftaddress, tokenid))), signature);
        require(bidder == recoveredbidder, 'zAuction: incorrect bidder');
        require(!randUsed[rand], 'Random nonce already used');
        randUsed[rand] = true;
        IERC721 nftcontract = IERC721(nftaddress);
        //accountant.Exchange(bidder, msg.sender, bid);
        nftcontract.transferFrom(msg.sender, bidder, tokenid);

        emit BidAccepted(bidder, msg.sender, bid, nftaddress, tokenid);
    }
    
    function recover(bytes32 hash, bytes memory signature) public pure returns (address) {
        return hash.recover(signature);
    }

    function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
        return hash.toEthSignedMessageHash();
    }
}