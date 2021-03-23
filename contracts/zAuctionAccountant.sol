// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "./oz/util/SafeMath.sol"

contract zAuctionAccountant {
    address zauction;
    address upgradeadmin;
    mapping(address => uint256) ethbalance;

    constructor(address administrator){ 
        admin = administrator;
    }

    modifier onlyZauction(){
        require(msg.sender == zauction, 'zAuctionAccountant: sender is not zauction contract');
        _;
    }

    function Deposit(address to) external payable onlyZauction {
        ethbalance[to] = SafeMath.add(ethbalance[to], msg.value);
    }

    function Withdraw(address from, uint256 amount) external onlyZauction {
        ethbalance[from] = SafeMath.sub(ethbalance[to], amount);
    }

    function Exchange(address from, address to, uint256 amount) external onlyZauction {
        ethbalance[from] = SafeMath.sub(ethbalance[to], amount);
        ethbalance[to] = SafeMath.add(ethbalance[to], msg.value);
    } 

    function SetZauction(address zauctionaddress) external {
        require(msg.sender == admin, 'zAuctionAccountant: sender is not admin');
        zauction = zauctionaddress;
    }
}