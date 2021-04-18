// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "./oz/util/SafeMath.sol";

contract zAuctionAccountant {
    address zauction;
    address admin;
    mapping(address => uint256) ethbalance;

    event Deposited(address indexed depositer, uint256 amount);
    event Withdrawn(address indexed withrawer, uint256 amount);

    constructor(){//address administrator){ 
        admin = msg.sender;
    }

    modifier onlyZauction(){
        require(msg.sender == zauction, 'zAuctionAccountant: sender is not zauction contract');
        _;
    }
    modifier onlyAdmin(){
        require(msg.sender == admin, 'zAuctionAccountant: sender is not admin');
        _;
    }
    
    function Deposit() external payable {
        ethbalance[msg.sender] = SafeMath.add(ethbalance[msg.sender], msg.value);
        emit Deposited(msg.sender, msg.value);
    }

    function Withdraw(uint256 amount) external {
        require(ethbalance[msg.sender] >= amount);
        ethbalance[msg.sender] = SafeMath.sub(ethbalance[msg.sender], amount);
        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount);
    }

    function zDeposit(address to) external payable onlyZauction {
        ethbalance[to] = SafeMath.add(ethbalance[to], msg.value);
    }

    function zWithdraw(address from, uint256 amount) external onlyZauction {
        ethbalance[from] = SafeMath.sub(ethbalance[from], amount);
    }

    function Exchange(address from, address to, uint256 amount) external onlyZauction {
        ethbalance[from] = SafeMath.sub(ethbalance[from], amount);
        ethbalance[to] = SafeMath.add(ethbalance[to], amount);
    } 

    function SetZauction(address zauctionaddress) external {
        zauction = zauctionaddress;
    }

    function SetAdmin(address newadmin) external onlyAdmin{
        
    }
}