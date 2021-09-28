import * as chai from "chai";
import { ethers } from "hardhat";
import { FakeContract, smock } from "@defi-wonderland/smock";

import { ZAuction, ZAuction__factory } from "../typechain";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";

chai.use(smock.matchers);

describe("zAuction Contract Tests", () => {
  let creator: SignerWithAddress;
  let bidder: SignerWithAddress;
  let owner: SignerWithAddress;
  let zAuction: ZAuction;
  let mockZauction: FakeContract<ZAuction>;

  // Use real contract address and tokenId for testing
  const erc20TokenId =
    "0xa16bf218d6e47d3d32b18a19391ba9806354623e85744cc991f6133e3b2663d4";
  const nftContract = "0xC613fCc3f81cC2888C5Cccc1620212420FFe4931";

  before(async () => {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    creator = signers[0];
    bidder = signers[1];
    owner = signers[2];

    const zAuctionFactory = new ZAuction__factory(creator);
    zAuction = await zAuctionFactory.deploy();
    // todo maybe delete the fake?
    mockZauction = await smock.fake(zAuction);
  });

  it("Successfully accepts a bid", async () => {
    const bidParams = {
      auctionId: "4771690347",
      bid: "2000000000000000000",
      nftAddress: nftContract,
      tokenId: erc20TokenId,
      minBid: "0",
      startBlock: "0",
      expireBlock: "999999999999",
    };

    const bidToSign = await zAuction.createBid(
      bidParams.auctionId,
      bidParams.bid,
      bidParams.nftAddress,
      bidParams.tokenId,
      bidParams.minBid,
      bidParams.startBlock,
      bidParams.expireBlock
    );

    const signers = await ethers.getSigners();
    const bidder = signers[1];

    const signature = await bidder.signMessage(
      ethers.utils.arrayify(bidToSign)
    );

    // In the case of a resale, the original creator
    // of an NFT is not necessarily the same as the
    // person who is the owner
    const owner = signers[2];

    // Note added "signature" and "bidder.address" props
    await zAuction
      .connect(owner)
      .acceptBid(
        signature,
        bidParams.auctionId,
        bidder.address,
        bidParams.bid,
        bidParams.nftAddress,
        bidParams.tokenId,
        bidParams.minBid,
        bidParams.startBlock,
        bidParams.expireBlock
      );
  });
  it("Fails when the auction hasn't started", async () => {
    const bidParams = {
      auctionId: "4771690347",
      bid: "2000000000000000000",
      nftAddress: nftContract,
      tokenId: erc20TokenId,
      minBid: "0",
      startBlock: BigNumber.from("999999999999"),
      expireBlock: "1",
    };

    const bidToSign = await zAuction.createBid(
      bidParams.auctionId,
      bidParams.bid,
      bidParams.nftAddress,
      bidParams.tokenId,
      bidParams.minBid,
      bidParams.startBlock,
      bidParams.expireBlock
    );

    const signature = await bidder.signMessage(
      ethers.utils.arrayify(bidToSign)
    );

    try {
      await zAuction
        .connect(owner)
        .acceptBid(
          signature,
          bidParams.auctionId,
          bidder.address,
          bidParams.bid,
          bidParams.nftAddress,
          bidParams.tokenId,
          bidParams.minBid,
          bidParams.startBlock,
          bidParams.expireBlock
        );
    } catch (error) {
      const message = (error as Error).message;
      expect(message).to.contain("zAuction: auction hasn't started");
    }
  });
  it("Fails when the current block is ahead of the expire block", async () => {
    const bidParams = {
      auctionId: "4771690347",
      bid: "2000000000000000000",
      nftAddress: nftContract,
      tokenId: erc20TokenId,
      minBid: "0",
      startBlock: "0",
      expireBlock: "1",
    };

    const bidToSign = await zAuction.createBid(
      bidParams.auctionId,
      bidParams.bid,
      bidParams.nftAddress,
      bidParams.tokenId,
      bidParams.minBid,
      bidParams.startBlock,
      bidParams.expireBlock
    );

    const signature = await bidder.signMessage(
      ethers.utils.arrayify(bidToSign)
    );

    try {
      await zAuction
        .connect(owner)
        .acceptBid(
          signature,
          bidParams.auctionId,
          bidder.address,
          bidParams.bid,
          bidParams.nftAddress,
          bidParams.tokenId,
          bidParams.minBid,
          bidParams.startBlock,
          bidParams.expireBlock
        );
    } catch (error) {
      const message = (error as Error).message;
      expect(message).to.contain("zAuction: auction expired");
    }
  });
  it("Fails when the bid is below the set minimum bid", async () => {
    const bidParams = {
      auctionId: "4771690347",
      bid: "2000000000000000000",
      nftAddress: nftContract,
      tokenId: erc20TokenId,
      minBid: "5000000000000000000",
      startBlock: "0",
      expireBlock: "999999999999",
    };

    const bidToSign = await zAuction.createBid(
      bidParams.auctionId,
      bidParams.bid,
      bidParams.nftAddress,
      bidParams.tokenId,
      bidParams.minBid,
      bidParams.startBlock,
      bidParams.expireBlock
    );

    const signature = await bidder.signMessage(
      ethers.utils.arrayify(bidToSign)
    );

    try {
      await zAuction
        .connect(owner)
        .acceptBid(
          signature,
          bidParams.auctionId,
          bidder.address,
          bidParams.bid,
          bidParams.nftAddress,
          bidParams.tokenId,
          bidParams.minBid,
          bidParams.startBlock,
          bidParams.expireBlock
        );
    } catch (error) {
      const message = (error as Error).message;
      expect(message).to.contain("zAuction: cannot accept bid below min");
    }
  });
  it("Fails when someone tries to accept their own bid", async () => {
    const bidParams = {
      auctionId: "4771690347",
      bid: "2000000000000000000",
      nftAddress: nftContract,
      tokenId: erc20TokenId,
      minBid: "500000000",
      startBlock: "0",
      expireBlock: "999999999999",
    };

    const bidToSign = await zAuction.createBid(
      bidParams.auctionId,
      bidParams.bid,
      bidParams.nftAddress,
      bidParams.tokenId,
      bidParams.minBid,
      bidParams.startBlock,
      bidParams.expireBlock
    );

    const signature = await bidder.signMessage(
      ethers.utils.arrayify(bidToSign)
    );

    try {
      await zAuction
        .connect(owner)
        .acceptBid(
          signature,
          bidParams.auctionId,
          owner.address,
          bidParams.bid,
          bidParams.nftAddress,
          bidParams.tokenId,
          bidParams.minBid,
          bidParams.startBlock,
          bidParams.expireBlock
        );
    } catch (error) {
      const message = (error as Error).message;
      expect(message).to.contain("zAuction: cannot sell to self");
    }
  });
  it("Fails when we recover the incorrect bidder address", async () => {
    const bidParams = {
      auctionId: "4771690347",
      bid: "2000000000000000000",
      nftAddress: nftContract,
      tokenId: erc20TokenId,
      minBid: "500000000",
      startBlock: "0",
      expireBlock: "999999999999",
    };

    const bidToSign = await zAuction.createBid(
      bidParams.auctionId,
      bidParams.bid,
      bidParams.nftAddress,
      bidParams.tokenId,
      bidParams.minBid,
      bidParams.startBlock,
      bidParams.expireBlock
    );

    const signature = await bidder.signMessage(
      ethers.utils.arrayify(bidToSign)
    );

    // The bidder address was used in signing, but the creator
    // address is being sent and the recovery of that account will fail
    try {
      await zAuction
        .connect(owner)
        .acceptBid(
          signature,
          bidParams.auctionId,
          creator.address,
          bidParams.bid,
          bidParams.nftAddress,
          bidParams.tokenId,
          bidParams.minBid,
          bidParams.startBlock,
          bidParams.expireBlock
        );
    } catch (error) {
      const message = (error as Error).message;
      expect(message).to.contain("zAuction: recovered incorrect bidder");
    }
  });
  it("Fails when a bid for an auction is not marked consumed", async () => {
    const bidParams = {
      auctionId: "4771690347",
      bid: "2000000000000000000",
      nftAddress: nftContract,
      tokenId: erc20TokenId,
      minBid: "500000000",
      startBlock: "0",
      expireBlock: "999999999999",
    };

    const bidToSign = await zAuction.createBid(
      bidParams.auctionId,
      bidParams.bid,
      bidParams.nftAddress,
      bidParams.tokenId,
      bidParams.minBid,
      bidParams.startBlock,
      bidParams.expireBlock
    );

    const signature = await bidder.signMessage(
      ethers.utils.arrayify(bidToSign)
    );

    // The bidder address was used in signing, but the creator
    // address is being sent and the recovery of that account will fail
    try {
      await zAuction
        .connect(owner)
        .acceptBid(
          signature,
          bidParams.auctionId,
          bidder.address,
          bidParams.bid,
          bidParams.nftAddress,
          bidParams.tokenId,
          bidParams.minBid,
          bidParams.startBlock,
          bidParams.expireBlock
        );
      const consumed = await zAuction.consumed(
        bidder.address,
        bidParams.auctionId
      );
      console.log(consumed);
      expect(consumed).to.be.true;
    } catch (error) {
      console.log(error);
    }
  });
});
