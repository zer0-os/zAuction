import * as chai from "chai";
import { ethers } from "hardhat";
import { FakeContract, smock } from "@defi-wonderland/smock";

import {
  IERC20,
  IERC20__factory,
  IERC721,
  IERC721__factory,
  IRegistrar,
  IRegistrar__factory,
  ZAuction,
  ZAuction__factory,
} from "../typechain";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";

chai.use(smock.matchers);

describe("zAuction Contract Tests", () => {
  let creator: SignerWithAddress;
  let bidder: SignerWithAddress;
  let owner: SignerWithAddress;
  let zAuction: ZAuction;
  let mockERC20Token: FakeContract<IERC20>;
  let mockERC721: FakeContract<IERC721>;
  let mockRegistrar: FakeContract<IRegistrar>;

  const tokenId = "0x1";
  const nftContract = "0xC613fCc3f81cC2888C5Cccc1620212420FFe4931";

  before(async () => {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    creator = signers[0];
    bidder = signers[1];
    owner = signers[2];

    mockERC20Token = await smock.fake(IERC20__factory.abi);
    mockERC721 = await smock.fake(IERC721__factory.abi);
    mockRegistrar = await smock.fake(IRegistrar__factory.abi);

    // Royalty is 10%
    mockRegistrar.domainRoyaltyAmount.returns(1000000);

    const zAuctionFactory = new ZAuction__factory(creator);
    zAuction = await zAuctionFactory.deploy();
    const legacyZAuctionKovanAddress =
      "0x18A804a028aAf1F30082E91d2947734961Dd7f89";
    await zAuction.initialize(
      mockERC20Token.address,
      mockRegistrar.address,
      legacyZAuctionKovanAddress
    );
  });

  it("Successfully accepts a bid", async () => {
    const bidParams = {
      auctionId: "4771690347",
      bid: "2000000000000000000",
      nftAddress: mockERC721.address,
      tokenId: "0x1",
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
    mockERC20Token.transferFrom.returns(true);

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
      tokenId: tokenId,
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

    const tx = zAuction
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
    await expect(tx).to.be.revertedWith("zAuction: auction hasn't started");
  });
  it("Fails when the current block is ahead of the expire block", async () => {
    const bidParams = {
      auctionId: "4771690347",
      bid: "2000000000000000000",
      nftAddress: nftContract,
      tokenId: tokenId,
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

    const tx = zAuction
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
    await expect(tx).to.be.revertedWith("zAuction: auction expired");
  });
  it("Fails when the bid is below the set minimum bid", async () => {
    const bidParams = {
      auctionId: "4771690347",
      bid: "2000000000000000000",
      nftAddress: nftContract,
      tokenId: tokenId,
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

    const tx = zAuction
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
    await expect(tx).to.be.revertedWith(
      "zAuction: cannot accept bid below min"
    );
  });
  it("Fails when someone tries to accept their own bid", async () => {
    const bidParams = {
      auctionId: "4771690347",
      bid: "2000000000000000000",
      nftAddress: nftContract,
      tokenId: tokenId,
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

    const tx = zAuction
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
    await expect(tx).to.be.revertedWith("zAuction: cannot sell to self");
  });
  it("Fails when we recover the incorrect bidder address", async () => {
    const bidParams = {
      auctionId: "4771690347",
      bid: "2000000000000000000",
      nftAddress: nftContract,
      tokenId: tokenId,
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
    const tx = zAuction
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
    await expect(tx).to.be.revertedWith("zAuction: recovered incorrect bidder");
  });
  it("Fails when a bid is already consumed", async () => {
    const bidParams = {
      auctionId: "4771690347",
      bid: "2000000000000000000",
      nftAddress: nftContract,
      tokenId: tokenId,
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

    const tx = zAuction
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

    await expect(tx).to.be.revertedWith("zAuction: data already consumed");
  });
  it("Calculates a royalty correctly", async () => {
    // Royalty is set to 10% above
    const bid = 100;
    const id = 1;
    const royalty = await zAuction.calculateRoyalty(bid, id);
    expect(royalty).to.equal(10);
  });
  it("Truncates a royalty on uneven numbers", async () => {
    // Fraction that results in a decimal should truncate
    // Set royalty to 13%
    mockRegistrar.domainRoyaltyAmount.returns(1300000);

    const bid = 120;
    const id = 1;
    // 13% of 120 is 15.6, but truncation happens twice in calculation
    // making us round up
    const royalty = await zAuction.calculateRoyalty(bid, id);
    expect(royalty).to.equal(17);
  });
  it("Fails when an invalid id is given", async () => {
    const bid = 120;
    const id = 0;
    // 13% of 120 is 15.6, but truncation happens twice in calculation
    // making us round up
    const tx = zAuction.calculateRoyalty(bid, id);
    await expect(tx).to.be.revertedWith("zAuction: must provide a valid id");
  });
  it("Returns 0 when no loyalty is specified", async () => {
    mockRegistrar.domainRoyaltyAmount.returns(0);
    const bid = 100;
    const id = 1;

    const royalty = await zAuction.calculateRoyalty(bid, id);
    expect(royalty).to.equal(0);
  });
  // it("Returns the expected root parent owner of a domain", async () => {
  //   mockRegistrar.parentOf.returns(0);
  //   mockERC721.ownerOf.returns("0x1");

  //   const rootAddress = await zAuction.rootParentOf(1);
  //   console.log(rootAddress);
  //   expect(rootAddress).to.equal("0x1");
  // });
});
