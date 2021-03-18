// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "./oz/util/ECDSA.sol";
import "./oz/erc721/IERC721.sol";

contract zAuction {
    using ECDSA for bytes32;

    function acceptBid(bytes memory signature, uint256 bid, address nftaddress, uint256 tokenid) external {
        address bidder = recover(keccak256(abi.encode(bid, nftaddress, tokenid)), signature);
        IERC721 nftcontract = IERC721(nftaddress);
        nftcontract.transferFrom(msg.sender, bidder, tokenid);
    }

    function recover(bytes32 hash, bytes memory signature) public pure returns (address) {
        return hash.recover(signature);
    }

    function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
        return hash.toEthSignedMessageHash();
    }
}