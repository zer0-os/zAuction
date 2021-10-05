import * as chai from "chai";
import { ethers } from "hardhat";
import { FakeContract, smock } from "@defi-wonderland/smock";

import {
  IERC20,
  IERC20__factory,
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
  let mockRegistrar: FakeContract<IRegistrar>;

  const tokenId = "0x1";

  before(async () => {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    creator = signers[0];
    bidder = signers[1];
    owner = signers[2];

    mockERC20Token = await smock.fake(IERC20__factory.abi);
    mockRegistrar = await smock.fake(IRegistrar__factory.abi);

    // Royalty is fixed at 10% unless otherwise specified
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
      tokenId: "0x1",
      minBid: "0",
      startBlock: "0",
      expireBlock: "999999999999",
    };

    const bidToSign = await zAuction.createBid(
      bidParams.auctionId,
      bidParams.bid,
      mockRegistrar.address,
      bidParams.tokenId,
      bidParams.minBid,
      bidParams.startBlock,
      bidParams.expireBlock
    );

    const signature = await bidder.signMessage(
      ethers.utils.arrayify(bidToSign)
    );

    // In the case of a resale, the original creator
    // of an NFT is not necessarily the same as the
    // person who is the owner
    mockERC20Token.transferFrom.returns(true);

    // Note added "signature" and "bidder.address" props
    await zAuction
      .connect(owner)
      .acceptBid(
        signature,
        bidParams.auctionId,
        bidder.address,
        bidParams.bid,
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
      tokenId: tokenId,
      minBid: "0",
      startBlock: BigNumber.from("999999999999"),
      expireBlock: "1",
    };

    const bidToSign = await zAuction.createBid(
      bidParams.auctionId,
      bidParams.bid,
      mockRegistrar.address,
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
      tokenId: tokenId,
      minBid: "0",
      startBlock: "0",
      expireBlock: "1",
    };

    const bidToSign = await zAuction.createBid(
      bidParams.auctionId,
      bidParams.bid,
      mockRegistrar.address,
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
      tokenId: tokenId,
      minBid: "5000000000000000000",
      startBlock: "0",
      expireBlock: "999999999999",
    };

    const bidToSign = await zAuction.createBid(
      bidParams.auctionId,
      bidParams.bid,
      mockRegistrar.address,
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
      tokenId: tokenId,
      minBid: "500000000",
      startBlock: "0",
      expireBlock: "999999999999",
    };

    const bidToSign = await zAuction.createBid(
      bidParams.auctionId,
      bidParams.bid,
      mockRegistrar.address,
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
      tokenId: tokenId,
      minBid: "500000000",
      startBlock: "0",
      expireBlock: "999999999999",
    };

    const bidToSign = await zAuction.createBid(
      bidParams.auctionId,
      bidParams.bid,
      mockRegistrar.address,
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
      tokenId: tokenId,
      minBid: "500000000",
      startBlock: "0",
      expireBlock: "999999999999",
    };

    const bidToSign = await zAuction.createBid(
      bidParams.auctionId,
      bidParams.bid,
      mockRegistrar.address,
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
        bidParams.tokenId,
        bidParams.minBid,
        bidParams.startBlock,
        bidParams.expireBlock
      );

    await expect(tx).to.be.revertedWith("zAuction: data already consumed");
  });
  it("Calculates minter royalty correctly", async () => {
    // A percent with 5 decimals of precision
    mockRegistrar.domainRoyaltyAmount.returns(1000000);
    // Each WILD is 10^18, Bid is 15 WILD
    const bid = ethers.utils.parseEther("15");
    const id = "12345";
    const royalty = await zAuction.calculateMinterRoyalty(bid, id);
    const decimal = royalty.toString();

    // 10% of bid
    expect(decimal).to.equal(ethers.utils.parseEther("1.5"));
  });
  it("Calculates root owner royalty correctly", async () => {
    // Each WILD is 10^18, Bid is 15 WILD
    // A percent with 5 decimals of precision
    const bid = ethers.utils.parseEther("15");
    const id = "123245";
    mockRegistrar.domainRoyaltyAmount.returns(1000000);
    const callers = await ethers.getSigners();
    mockRegistrar.ownerOf.whenCalledWith(id).returns(callers[0].address);

    await zAuction.connect(callers[0]).setRootRoyaltyAmount(id, 10);

    const royalty = await zAuction.calculateRootOwnerRoyalty(id, bid, id);
    const decimal = royalty.toString();

    // 10% of bid (one less zero)
    expect(decimal).to.equal(ethers.utils.parseEther("1.5"));
  });
  it("Gets the root parent of a domain that is already the root", async () => {
    // Case where id given is already the root
    mockRegistrar.parentOf.returns(0);
    const id = "12345";
    const rootId = await zAuction.rootDomainIdOf(id);
    expect(rootId).to.equal(id);
  });
  it("Gets the root parent when the id given is not already the root", async () => {
    // Case where id given is not the root
    mockRegistrar.parentOf.whenCalledWith("3").returns("2");
    mockRegistrar.parentOf.whenCalledWith("2").returns("1");
    mockRegistrar.parentOf.whenCalledWith("1").returns("0");
    const id = "3";
    const rootId = await zAuction.rootDomainIdOf(id);
    expect(rootId).to.equal("1");
  });
});
