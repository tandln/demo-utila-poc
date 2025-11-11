// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.24;

contract Counter {
    uint256 public value;
    event Incremented(address indexed by, uint256 newValue);
    function increment() external {
        value += 1;
        emit Incremented(msg.sender, value);
    }
}