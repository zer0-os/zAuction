import * as chai from "chai";
import { ethers } from "hardhat";
import { FakeContract, smock } from "@defi-wonderland/smock";

import { ZAuction, ZAuction__factory } from "../typechain";

chai.use(smock.matchers);

describe("zAuction Contract Tests", () => {
  let mockZauction: FakeContract<ZAuction>;

  beforeEach(async () => {
    const signers = await ethers.getSigners();

    const creator = signers[0];

    const zAuctionFactory = new ZAuction__factory(creator);
    const zAuction: ZAuction = await zAuctionFactory.deploy();

    mockZauction = await smock.fake(zAuction);
  });

  it("Successfully accepts a bid", async () => {
    const erc20TokenId =
      "0xa16bf218d6e47d3d32b18a19391ba9806354623e85744cc991f6133e3b2663d4";
    const nftContract = "0xC613fCc3f81cC2888C5Cccc1620212420FFe4931";

    const bidParams = {
      auctionId: "4771690347",
      bid: "2000000000000000000",
      nftAddress: nftContract,
      tokenId: erc20TokenId,
      minBid: "0",
      startBlock: "0",
      expireBlock: "999999999999",
    };

    const bidToSign = await mockZauction.createBid(
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
    await mockZauction
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
});
