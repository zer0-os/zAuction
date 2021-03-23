// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "./oz/util/SafeMath.sol"

contract zAuctionAccountant {
    
    address zauction;
    address upgradeadmin;
    mapping(address => uint256) ethbalance;

    constructor(address upgrader, address zauctionaddress){
        zauction = zauctionaddress;  
        upgradeadmin = upgrader;
    }

    modifier onlyZauction(){
        require(msg.sender == zauction, 'zAuctionAccountant: sender is not zauction contract');
        _;
    }

    function Deposit(address to) external payable onlyZauction {
        ethbalance[to] = SafeMath.add(ethbalance[to], msg.value);
    }

    function Withdraw(address from, uint256 amount) external onlyZauction {
        ethbalance[to] = SafeMath.sub(ethbalance[to], amount);
    }

    function SetZauction(address upgradedzauction) external {
        require(msg.sender == upgradeadmin, 'zAuctionAccountant: sender is not upgrade admin');
        zauction = upgradedzauction;
    }
}