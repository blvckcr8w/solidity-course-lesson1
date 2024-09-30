// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AirdropToken is ERC20, Ownable {
    constructor(
        address initialOwner
    ) ERC20("Airdrop Token", "AT") Ownable(initialOwner) {
        _mint(msg.sender, 100_000 * 10 ** decimals());
    }

    /**
     * Creates a `amount` of tokens and assigns them to `to`, by transferring it from address(0).
     * @param to The address receiving tokens
     * @param amount The amount of tokens to create
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
