// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "./oz/util/ECDSA.sol";
import "./oz/erc721/IERC721.sol";
import "./zAuctionAccountant.sol";

contract zAuction {
    using ECDSA for bytes32;

    bool initialized;
    zAuctionAccountant accountant;

    struct EIP712Domain {
        string  name;
        string  version;
        uint256 chainId;
        address verifyingContract;
    }

    struct Bid {
        uint256 amount;
        address contractaddress;
        uint256 tokenid;
    }

    bytes32 constant EIP712DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

    bytes32 constant BID_TYPEHASH = keccak256(
        "Bid(uint256 amount,address contractaddress,uint256 tokenid)"
    );

    bytes32 DOMAIN_SEPARATOR;

    constructor () {
        DOMAIN_SEPARATOR = hash(EIP712Domain({
            name: "zAuction",
            version: '0',
            chainId: 4,
            verifyingContract: address(this)
        }));
    }

    function hash(EIP712Domain memory eip712Domain) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            EIP712DOMAIN_TYPEHASH,
            keccak256(bytes(eip712Domain.name)),
            keccak256(bytes(eip712Domain.version)),
            eip712Domain.chainId,
            eip712Domain.verifyingContract
        ));
    }

    function hash(Bid memory bid) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            BID_TYPEHASH,
            bid.amount,
            bid.contractaddress,
            bid.tokenid
        ));
    }

    function verify(Bid memory bid, uint8 v, bytes32 r, bytes32 s) internal view returns (address) {
        // Note: we need to use `encodePacked` here instead of `encode`.
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR,
            hash(bid)
        ));
        return ecrecover(digest, v, r, s);
    }

    function init(address accountantaddress) external {
        require(!initialized);
        initialized = true;
        accountant = zAuctionAccountant(accountantaddress);
    }

    function acceptBid(bytes memory signature, address bidder, uint256 bid, address nftaddress, uint256 tokenid) external {
        address recoveredbidder = recover(keccak256(abi.encodePacked(bid, nftaddress, tokenid)), signature);
        require(bidder == recoveredbidder, 'zAuction: incorrect bidder');
        IERC721 nftcontract = IERC721(nftaddress);
        accountant.Exchange(bidder, msg.sender, bid);
        nftcontract.transferFrom(msg.sender, bidder, tokenid);
    }

    function testall(uint256 bid, address nftaddress, uint256 tokenid) public pure returns(bytes memory){
        return(abi.encode(bid, nftaddress, tokenid));
    }

    function recover(bytes32 hash, bytes memory signature) public pure returns (address) {
        return hash.recover(signature);
    }

    function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
        return hash.toEthSignedMessageHash();
    }
}