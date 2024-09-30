// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleAirdrop {
    using SafeERC20 for IERC20;
    uint256 public constant MAX_CLAIMS = 3;
    uint256 public constant CLAIM_AMOUNT = 1000;

    bytes32 public immutable ROOT;
    address public immutable TOKEN;
    uint256 public immutable PRECISION;
    uint256 public totalClaimed;

    mapping(address => bool) public hasClaimed;

    event Claimed(address user, address to);

    constructor(bytes32 root, address token) {
        ROOT = root;
        TOKEN = token;
        PRECISION = 10 ** IERC20Metadata(token).decimals();
    }

    function claim(bytes32[] memory proof, address to) external {
        require(totalClaimed < MAX_CLAIMS, "MERKLE_AIRDROP: MAX CLAIMS");
        require(!hasClaimed[msg.sender], "MERKLE_AIRDROP: ALREADY CLAIMED");
        require(
            IERC20(TOKEN).balanceOf(address(this)) >= CLAIM_AMOUNT * PRECISION,
            "MERKLE_AIRDROP: INSUFFICIENT BALANCE"
        );
        require(
            MerkleProof.verify(
                proof,
                ROOT,
                keccak256(bytes.concat(keccak256(abi.encode(msg.sender))))
            ),
            "MERKLE_AIRDROP: INVALID USER"
        );

        hasClaimed[msg.sender] = true;
        totalClaimed += 1;

        IERC20(TOKEN).safeTransfer(to, CLAIM_AMOUNT * PRECISION);
        emit Claimed(msg.sender, to);
    }
}
