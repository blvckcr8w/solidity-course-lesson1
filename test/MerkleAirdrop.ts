import {
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { expect } from "chai";

describe("MerkleAirdrop", function () {
    async function initMerkleTreeFixture() {
        const [user1, user2, user3, user4] = await hre.ethers.getSigners();
        const leafs = [
            [user1.address],
            [user2.address],
            [user3.address],
            [user4.address]
        ]
        const tree = StandardMerkleTree.of(leafs, ["address"]);
        return { tree };
    }

    async function deployMerkleAirdropFixture() {
        const { tree } = await initMerkleTreeFixture();

        const [deployer] = await hre.ethers.getSigners();

        const AirdropToken = await hre.ethers.getContractFactory("AirdropToken");
        const airdroptoken = await AirdropToken.connect(deployer).deploy(deployer);

        const MerkleAirdrop = await hre.ethers.getContractFactory("MerkleAirdrop");
        const merkleAirdrop = await MerkleAirdrop.connect(deployer).deploy(tree.root, airdroptoken.target);
        await airdroptoken.connect(deployer).transfer(merkleAirdrop, await airdroptoken.balanceOf(deployer.address));
        return { airdroptoken, merkleAirdrop, tree };
    }

    describe("Airdrop claim", function () {
        it("Valid user can claim", async function () {
            const { airdroptoken, merkleAirdrop, tree } = await loadFixture(deployMerkleAirdropFixture);

            const [, , , user4] = await hre.ethers.getSigners();
            await merkleAirdrop.connect(user4).claim(tree.getProof(3), user4.address);
            const claimAmount = await merkleAirdrop.CLAIM_AMOUNT();
            const decimals = await airdroptoken.decimals();
            const resultingBalance = await airdroptoken.balanceOf(user4.address);

            expect(resultingBalance).to.be.eq(claimAmount * 10n ** decimals);
        });

        it("Invalid user cannot claim", async function () {
            const { merkleAirdrop, tree } = await loadFixture(deployMerkleAirdropFixture);

            const [, , , , user5] = await hre.ethers.getSigners();
            await expect(
                merkleAirdrop.connect(user5).claim(tree.getProof(3), user5.address)
            ).to.be.revertedWith("MERKLE_AIRDROP: INVALID USER");
        });

        it("User cannot claim more than once", async function () {
            const { merkleAirdrop, tree } = await loadFixture(deployMerkleAirdropFixture);

            const [, , , user4] = await hre.ethers.getSigners();
            await merkleAirdrop.connect(user4).claim(tree.getProof(3), user4.address);

            await expect(
                merkleAirdrop.connect(user4).claim(tree.getProof(3), user4.address)
            ).to.be.revertedWith("MERKLE_AIRDROP: ALREADY CLAIMED");

        });
    });
});
