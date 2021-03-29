// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "./oz/util/ECDSA.sol";
import "./oz/erc721/IERC721.sol";
import "./zAuctionAccountant.sol";

contract zAuction {
    using ECDSA for bytes32;

    bool initialized;
    zAuctionAccountant accountant;

    function init(address accountantaddress) external {
        require(!initialized);
        initialized = true;
        accountant = zAuctionAccountant(accountantaddress);
    }

    function acceptBid(bytes memory signature, uint256 bid, address nftaddress, uint256 tokenid) external {
        address bidder = recover(keccak256(abi.encode(bid, nftaddress, tokenid)), signature);
        IERC721 nftcontract = IERC721(nftaddress);
        accountant.Exchange(bidder, msg.sender, bid);
        nftcontract.transferFrom(msg.sender, bidder, tokenid);
    }

    function recover(bytes32 hash, bytes memory signature) public pure returns (address) {
        return hash.recover(signature);
    }

    function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
        return hash.toEthSignedMessageHash();
    }
}