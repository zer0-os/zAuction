// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "./oz/util/SafeMath.sol";

contract zAuctionAccountant {
    address public zauction;
    address public admin;
    mapping(address => uint256) public ethbalance;

    event Deposited(address indexed depositer, uint256 amount);
    event Withdrew(address indexed withrawer, uint256 amount);
    event zDeposited(address indexed depositer, uint256 amount);
    event zExchanged(address indexed from, address indexed to, uint256 amount);
    event ZauctionSet(address);
    event AdminSet(address, address);
    
    constructor(){
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
    
    function deposit() external payable {
        ethbalance[msg.sender] = SafeMath.add(ethbalance[msg.sender], msg.value);
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        ethbalance[msg.sender] = SafeMath.sub(ethbalance[msg.sender], amount);
        payable(msg.sender).transfer(amount);
        emit Withdrew(msg.sender, amount);
    }

    function exchange(address from, address to, uint256 amount) external onlyZauction {
        ethbalance[from] = SafeMath.sub(ethbalance[from], amount);
        ethbalance[to] = SafeMath.add(ethbalance[to], amount);
        emit zExchanged(from, to, amount);
    }

    function setZauction(address zauctionaddress) external onlyAdmin{
        zauction = zauctionaddress;
        emit ZauctionSet(zauctionaddress);
    }

    function SetAdmin(address newadmin) external onlyAdmin{
        admin = newadmin;
        emit AdminSet(msg.sender, newadmin);
    }
}