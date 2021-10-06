import * as chai from "chai";
import * as sinonChai from "sinon-chai";
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
// chai.use(sinonChai.default);

describe("zAuction Contract Tests", () => {
  let creator: SignerWithAddress;
  let bidder: SignerWithAddress;
  let owner: SignerWithAddress;
  let zAuction: ZAuction;
  let mockERC20Token: FakeContract<IERC20>;
  let mockRegistrar: FakeContract<IRegistrar>;

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

  it("Successfully tests a specific scenario", async () => {
    const signers: SignerWithAddress[] = await ethers.getSigners();

    const minter = signers[0]; // User Z, gets royalty of 5%
    const topLevelOwner = signers[1]; // User W, Owns A, 4.44% fee
    const seller = signers[2]; // User X, selling ABC
    const buyer = signers[3]; // user Y, buying ABC, bids 123
    // const id = "2";
    const topLevelId = "1";

    const bidParams = {
      auctionId: "4771690347",
      bid: ethers.utils.parseEther("123"),
      tokenId: "0x1",
      minBid: "0",
      startBlock: "0",
      expireBlock: "999999999999",
    };

    // Minter royalty is set at 5%
    mockRegistrar.domainRoyaltyAmount
      .whenCalledWith(bidParams.tokenId)
      .returns("500000");

    // Top level owner fee is set at 4.44%
    mockRegistrar.parentOf
      .whenCalledWith(bidParams.tokenId)
      .returns(topLevelId);
    mockRegistrar.parentOf.whenCalledWith(topLevelId).returns("0");
    mockRegistrar.ownerOf
      .whenCalledWith(topLevelId)
      .returns(topLevelOwner.address);
    mockRegistrar.minterOf.whenCalledWith(topLevelId).returns(minter.address);

    await zAuction
      .connect(topLevelOwner)
      .setTopLevelDomainFee(topLevelId, 444000);

    const bidToSign = await zAuction.createBid(
      bidParams.auctionId,
      bidParams.bid,
      mockRegistrar.address,
      bidParams.tokenId,
      bidParams.minBid,
      bidParams.startBlock,
      bidParams.expireBlock
    );

    const signature = await buyer.signMessage(ethers.utils.arrayify(bidToSign));

    mockERC20Token.transferFrom.returns(true);
    await zAuction
      .connect(seller)
      .acceptBid(
        signature,
        bidParams.auctionId,
        buyer.address,
        bidParams.bid,
        bidParams.tokenId,
        bidParams.minBid,
        bidParams.startBlock,
        bidParams.expireBlock
      );

    const transactionPayment = ethers.utils.parseEther("111.3888");
    const royalty = ethers.utils.parseEther("6.150");
    const fee = ethers.utils.parseEther("5.4612");

    expect(mockRegistrar.domainRoyaltyAmount).to.have.been.calledWith(
      topLevelId
    );
    expect(mockRegistrar.parentOf).to.have.been.calledWith(bidParams.tokenId);
    expect(mockRegistrar.parentOf).to.have.been.calledWith(topLevelId);
    expect(mockRegistrar.ownerOf).to.have.been.calledWith(topLevelId);

    // Bidder -> Owner, pay transaction
    expect(mockERC20Token.transferFrom).calledWith(
      buyer.address,
      seller.address,
      transactionPayment
    );

    // Bidder -> Minter, pay minter royalty
    expect(mockERC20Token.transferFrom).to.have.been.calledWith(
      buyer.address,
      minter.address,
      royalty
    );

    // Bidder -> topLevel Owner, pay top level owner fee
    expect(mockERC20Token.transferFrom).to.have.been.calledWith(
      buyer.address,
      topLevelOwner.address,
      fee
    );

    mockRegistrar.domainRoyaltyAmount.reset();
    mockRegistrar.parentOf.reset();
    mockRegistrar.ownerOf.reset();
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
      tokenId: "0x1",
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
      tokenId: "0x1",
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
      tokenId: "0x1",
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
      tokenId: "0x1",
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
      tokenId: "0x1",
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
      tokenId: "0x1",
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
  it("Calculates top level domain fee correctly at 10%", async () => {
    // Each WILD is 10^18, Bid is 15 WILD
    // A percent with 5 decimals of precision
    const bid = ethers.utils.parseEther("15");
    const id = "123245";
    const callers = await ethers.getSigners();
    const mainAccount = callers[0];

    // mockRegistrar.domainRoyaltyAmount.returns(1000000);
    mockRegistrar.ownerOf.whenCalledWith(id).returns(mainAccount.address);

    // Set fee for 10%
    await zAuction.connect(mainAccount).setTopLevelDomainFee(id, 1000000);
    let returnedFee = await zAuction.calculateTopLevelDomainFee(id, bid);
    let fee = returnedFee.toString();
    expect(fee).to.equal(ethers.utils.parseEther("1.5"));
  });
  it("Calculates top level domain fee correctly at 3%", async () => {
    const bid = ethers.utils.parseEther("15");
    const id = "123245";
    const callers = await ethers.getSigners();
    const mainAccount = callers[0];

    mockRegistrar.ownerOf.whenCalledWith(id).returns(mainAccount.address);

    // Set fee for 3%
    await zAuction.connect(mainAccount).setTopLevelDomainFee(id, 300000);
    const returnedFee = await zAuction.calculateTopLevelDomainFee(id, bid);
    const fee = returnedFee.toString();
    expect(fee).to.equal(ethers.utils.parseEther("0.45"));
  });
  it("Calculates top level domain fee correctly at 1.23456%", async () => {
    const bid = ethers.utils.parseEther("15");
    const id = "123245";
    const callers = await ethers.getSigners();
    const mainAccount = callers[0];

    mockRegistrar.ownerOf.whenCalledWith(id).returns(mainAccount.address);

    // Set fee for 1.23456%
    await zAuction.connect(mainAccount).setTopLevelDomainFee(id, 123456);
    const returnedFee = await zAuction.calculateTopLevelDomainFee(id, bid);
    const fee = returnedFee.toString();
    expect(fee).to.equal(ethers.utils.parseEther("0.185184"));
  });
  it("Calculates top level domain fee correctly at 9.99999%", async () => {
    const bid = ethers.utils.parseEther("15");
    const id = "123245";
    const callers = await ethers.getSigners();
    const mainAccount = callers[0];

    mockRegistrar.ownerOf.whenCalledWith(id).returns(mainAccount.address);

    // Set fee for 9.99999%
    await zAuction.connect(mainAccount).setTopLevelDomainFee(id, 999999);
    const returnedFee = await zAuction.calculateTopLevelDomainFee(id, bid);
    const fee = returnedFee.toString();
    expect(fee).to.equal(ethers.utils.parseEther("1.4999985"));
  });
  it("Calculates top level domain fee correctly at 9.11111%", async () => {
    const bid = ethers.utils.parseEther("15");
    const id = "123245";
    const callers = await ethers.getSigners();
    const mainAccount = callers[0];

    mockRegistrar.ownerOf.whenCalledWith(id).returns(mainAccount.address);

    // Set fee for 9.11111%
    await zAuction.connect(mainAccount).setTopLevelDomainFee(id, 911111);
    const returnedFee = await zAuction.calculateTopLevelDomainFee(id, bid);
    const fee = returnedFee.toString();
    expect(fee).to.equal(ethers.utils.parseEther("1.3666665"));
  });
  it("Calculates top level domain fee correctly at 0.0001%", async () => {
    const bid = ethers.utils.parseEther("15");
    const id = "123245";
    const callers = await ethers.getSigners();
    const mainAccount = callers[0];

    mockRegistrar.ownerOf.whenCalledWith(id).returns(mainAccount.address);

    // Set fee for 0.0001%%
    await zAuction.connect(mainAccount).setTopLevelDomainFee(id, 1);
    const returnedFee = await zAuction.calculateTopLevelDomainFee(id, bid);
    const fee = returnedFee.toString();
    expect(fee).to.equal(ethers.utils.parseEther("0.0000015"));
  });
  it("Fails to set top level royalty when domain is not owned by caller", async () => {
    // Fee is set to 10%
    const fee = "1000000";
    const id = "123245";

    const callers = await ethers.getSigners();
    const mainAccount = callers[0];
    const otherAccount = callers[1];

    mockRegistrar.ownerOf.whenCalledWith(id).returns(mainAccount.address);

    const tx = zAuction.connect(otherAccount).setTopLevelDomainFee(id, fee);
    await expect(tx).to.be.revertedWith(
      "zAuction: Cannot set fee on unowned domain"
    );
  });
  it("Fails if the domain fee is set higher than 10%", async () => {
    // Fee is set to 10%
    const fee = "1000001";
    const id = "123245";

    const callers = await ethers.getSigners();
    const mainAccount = callers[0];

    mockRegistrar.ownerOf.whenCalledWith(id).returns(mainAccount.address);
    const tx = zAuction.connect(mainAccount).setTopLevelDomainFee(id, fee);

    await expect(tx).to.be.revertedWith(
      "zAuction: Cannot set a fee higher than 10%"
    );
  });
  it("Fails if the domain fee is set lower than 0.0001%", async () => {
    // Fee is set to 0%
    const fee = "0";
    const id = "123245";

    const callers = await ethers.getSigners();
    const mainAccount = callers[0];

    mockRegistrar.ownerOf.whenCalledWith(id).returns(mainAccount.address);
    const tx = zAuction.connect(mainAccount).setTopLevelDomainFee(id, fee);

    await expect(tx).to.be.revertedWith(
      "zAuction: Cannot set a fee lower than 0.0001%"
    );
  });
  it("Gets the top level parent of a domain that is already the top", async () => {
    // Case where id given is already the top level domain id
    mockRegistrar.parentOf.returns(0);
    const id = "12345";
    const topLevelId = await zAuction.topLevelDomainIdOf(id);
    expect(topLevelId).to.equal(id);
  });
  it("Gets the top level parent when the id given is not already the top", async () => {
    // Case where id given is not the top level domain id
    mockRegistrar.parentOf.whenCalledWith("3").returns("2");
    mockRegistrar.parentOf.whenCalledWith("2").returns("1");
    mockRegistrar.parentOf.whenCalledWith("1").returns("0");
    const id = "3";
    const TopLevelId = await zAuction.topLevelDomainIdOf(id);
    expect(TopLevelId).to.equal("1");
  });
});
