import * as chai from "chai";
import { ethers } from "hardhat";
import {
  FakeContract,
  MockContract,
  MockContractFactory,
  smock,
} from "@defi-wonderland/smock";

import {
  IERC20,
  IERC20__factory,
  IRegistrar,
  IRegistrar__factory,
  IZNSHub,
  IZNSHub__factory,
  ZAuction,
  ZAuction__factory,
} from "../typechain";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { solidityKeccak256 } from "ethers/lib/utils";

chai.use(smock.matchers);

describe("zAuction Contract Tests", () => {
  let creator: SignerWithAddress;
  let bidder: SignerWithAddress;
  let owner: SignerWithAddress;
  let zAuction: ZAuction;
  let mockZauctionFactory: MockContractFactory<ZAuction__factory>;
  let mockZauction: MockContract<ZAuction>;

  // Interfaces can't deploy from the factory
  let fakeERC20Token: FakeContract<IERC20>;
  let fakeRegistrar: FakeContract<IRegistrar>;
  let fakeZNSHub: FakeContract<IZNSHub>;

  before(async () => {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    creator = signers[0];
    bidder = signers[1];
    owner = signers[2];

    fakeERC20Token = await smock.fake(IERC20__factory.abi);
    fakeRegistrar = await smock.fake(IRegistrar__factory.abi);
    fakeZNSHub = await smock.fake(IZNSHub__factory.abi);

    mockZauctionFactory = await smock.mock<ZAuction__factory>("ZAuction");
    mockZauction = await mockZauctionFactory.deploy();

    // Royalty is fixed at 10% unless otherwise specified
    fakeRegistrar.domainRoyaltyAmount.returns(1000000);

    const zAuctionFactory = new ZAuction__factory(creator);
    zAuction = await zAuctionFactory.deploy();
    // Unused
    // const legacyZAuctionKovanAddress =
    //   "0x18A804a028aAf1F30082E91d2947734961Dd7f89";
    await zAuction.initialize(fakeERC20Token.address, fakeZNSHub.address);
  });

  it("Successfully tests a specific scenario", async () => {
    const signers: SignerWithAddress[] = await ethers.getSigners();

    const minter = signers[0]; // User Z, gets royalty of 5%
    const topLevelOwner = signers[1]; // User W, Owns A, 4.44% fee
    const seller = signers[2]; // User X, selling ABC
    const buyer = signers[3]; // user Y, buying ABC, bids 123
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
    fakeRegistrar.domainRoyaltyAmount
      .whenCalledWith(bidParams.tokenId)
      .returns("500000");

    // Top level owner fee is set at 4.44%
    fakeRegistrar.parentOf
      .whenCalledWith(bidParams.tokenId)
      .returns(topLevelId);
    fakeRegistrar.parentOf.whenCalledWith(topLevelId).returns("0");
    fakeZNSHub.ownerOf
      .whenCalledWith(bidParams.tokenId)
      .returns(topLevelOwner.address);
    fakeZNSHub.getRegistrarForDomain
      .whenCalledWith(bidParams.tokenId)
      .returns(fakeRegistrar.address);
    fakeRegistrar.minterOf.whenCalledWith(topLevelId).returns(minter.address);

    await zAuction
      .connect(topLevelOwner)
      .setTopLevelDomainFee(topLevelId, 444000);

    const bidToSign = await zAuction.createBid(
      bidParams.auctionId,
      bidParams.bid,
      fakeRegistrar.address,
      bidParams.tokenId,
      bidParams.minBid,
      bidParams.startBlock,
      bidParams.expireBlock
    );

    const signature = await buyer.signMessage(ethers.utils.arrayify(bidToSign));

    fakeERC20Token.transferFrom.returns(true);
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

    expect(fakeRegistrar.minterOf).to.have.been.calledWith(bidParams.tokenId);
    expect(fakeZNSHub.ownerOf).to.have.been.calledWith(topLevelId);

    // Even when using SafeERC20 contracts in zAuction, typechain gives us
    // regular ERC20 interfaces, so we can't test `SafeERC20.safeTransferFrom`

    // Bidder -> Owner, pay transaction
    // expect(fakeERC20Token.transferFrom).calledWith(
    //   buyer.address,
    //   seller.address,
    //   transactionPayment
    // );

    // // Bidder -> Minter, pay minter royalty
    // expect(fakeERC20Token.transferFrom).to.have.been.calledWith(
    //   buyer.address,
    //   minter.address,
    //   royalty
    // );

    // // Bidder -> topLevel Owner, pay top level owner fee
    // expect(fakeERC20Token.transferFrom).to.have.been.calledWith(
    //   buyer.address,
    //   topLevelOwner.address,
    //   fee
    // );

    fakeRegistrar.domainRoyaltyAmount.reset();
    fakeRegistrar.parentOf.reset();
    fakeRegistrar.ownerOf.reset();
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
      fakeRegistrar.address,
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
    fakeERC20Token.transferFrom.returns(true);

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
      fakeRegistrar.address,
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
      fakeRegistrar.address,
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
      fakeRegistrar.address,
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
      fakeRegistrar.address,
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
      fakeRegistrar.address,
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
      fakeRegistrar.address,
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
    fakeRegistrar.domainRoyaltyAmount.returns(1000000);
    // Each WILD is 10^18, Bid is 15 WILD
    const bid = ethers.utils.parseEther("15");
    const id = "12345";
    const royalty = await zAuction.calculateMinterRoyalty(id, bid);
    const decimal = royalty.toString();

    // 10% of bid
    expect(decimal).to.equal(ethers.utils.parseEther("1.5"));
  });
  it("Calculates top level domain fee correctly at 10%", async () => {
    // Each WILD is 10^18, Bid is 15 WILD
    // A percent with 5 decimals of precision
    const bid = ethers.utils.parseEther("15");
    const tokenId = "123245";
    const callers = await ethers.getSigners();
    const mainAccount = callers[0];

    // mockRegistrar.domainRoyaltyAmount.returns(1000000);
    fakeZNSHub.ownerOf.whenCalledWith(tokenId).returns(mainAccount.address);
    // fakeRegistrar.ownerOf.whenCalledWith(tokenId).returns(mainAccount.address);

    // Set fee for 10%
    await zAuction.connect(mainAccount).setTopLevelDomainFee(tokenId, 1000000);
    let returnedFee = await zAuction.calculateTopLevelDomainFee(tokenId, bid);
    let fee = returnedFee.toString();
    expect(fee).to.equal(ethers.utils.parseEther("1.5"));
  });
  it("Calculates top level domain fee correctly at 3%", async () => {
    const bid = ethers.utils.parseEther("15");
    const id = "123245";
    const callers = await ethers.getSigners();
    const mainAccount = callers[0];

    fakeRegistrar.ownerOf.whenCalledWith(id).returns(mainAccount.address);

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

    fakeRegistrar.ownerOf.whenCalledWith(id).returns(mainAccount.address);

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

    fakeRegistrar.ownerOf.whenCalledWith(id).returns(mainAccount.address);

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

    fakeRegistrar.ownerOf.whenCalledWith(id).returns(mainAccount.address);

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

    fakeRegistrar.ownerOf.whenCalledWith(id).returns(mainAccount.address);

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

    fakeRegistrar.ownerOf.whenCalledWith(id).returns(mainAccount.address);

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

    fakeRegistrar.ownerOf.whenCalledWith(id).returns(mainAccount.address);
    const tx = zAuction.connect(mainAccount).setTopLevelDomainFee(id, fee);

    await expect(tx).to.be.revertedWith(
      "zAuction: Cannot set a fee higher than 10%"
    );
  });
  it("Fails if the domain fee is already set to that amount", async () => {
    // Fee is set to 5%
    const fee = "500000";
    const id = "123245";

    const callers = await ethers.getSigners();
    const mainAccount = callers[0];

    fakeRegistrar.ownerOf.whenCalledWith(id).returns(mainAccount.address);
    await zAuction.connect(mainAccount).setTopLevelDomainFee(id, fee);
    const tx = zAuction.connect(mainAccount).setTopLevelDomainFee(id, fee);

    await expect(tx).to.be.revertedWith("zAuction: Amount is already set");
  });
  it("Gets the top level parent of a domain that is already the top", async () => {
    // Case where id given is already the top level domain id
    fakeRegistrar.parentOf.returns(0);
    const id = "12345";
    const topLevelId = await zAuction.topLevelDomainIdOf(id);
    expect(topLevelId).to.equal(id);
  });
  it("Gets the top level parent when the id given is not already the top", async () => {
    // Case where id given is not the top level domain id
    fakeZNSHub.parentOf.whenCalledWith("3").returns("2");
    fakeZNSHub.parentOf.whenCalledWith("2").returns("1");
    fakeZNSHub.parentOf.whenCalledWith("1").returns("0");
    const id = "3";
    const topLevelId = await zAuction.topLevelDomainIdOf(id);
    expect(topLevelId).to.equal("1");
  });
  it("Fails to cancel a bid when the caller is not the creator of that bid", async () => {
    const callers = await ethers.getSigners();
    const accountOne = callers[0];
    const accountTwo = callers[1];

    const tx = zAuction
      .connect(accountOne)
      .cancelBid(accountTwo.address, "123");

    await expect(tx).to.be.revertedWith(
      "zAuction: Cannot cancel someone else's bid"
    );
  });
  it("Fails to cancel a bid when it has already been consumed", async () => {
    mockZauction.setVariable("consumed", {
      [bidder.address]: {
        "12345": true,
      },
    });
    const tx = mockZauction.connect(bidder).cancelBid(bidder.address, "12345");
    await expect(tx).to.be.revertedWith(
      "zAuction: Cannot cancel an already consumed bid"
    );
  });

  // buyNow tests
  it("Only allows owner to setBuyPrice", async () => {
    const callers = await ethers.getSigners();
    const accountOne = callers[0];
    const accountTwo = callers[1];
    // Random string from random.org - collisions cause other tests to behave weirdly
    const id = "11497969225667248727";

    fakeRegistrar.ownerOf.whenCalledWith(id).returns(accountOne.address);

    const tx = zAuction.connect(accountTwo).setBuyPrice("1", id);

    await expect(tx).to.be.revertedWith("zAuction: only owner can set price");
  });

  it("Fails to set price for ID to the same price as already exists", async () => {
    const callers = await ethers.getSigners();
    const owner = callers[0];
    // Random string from random.org - collisions cause other tests to behave weirdly
    const id = "22971314508482482246";

    fakeZNSHub.ownerOf.whenCalledWith(id).returns(owner.address);

    await zAuction.connect(owner).setBuyPrice("1", id);
    const tx = zAuction.connect(owner).setBuyPrice("1", id);

    await expect(tx).to.be.revertedWith("zAuction: listing already exists");
  });

  it("Fails to buyNow for the wrong price", async () => {
    const callers = await ethers.getSigners();
    const accountOne = callers[0];
    const accountTwo = callers[1];
    // Random string from random.org - collisions cause other tests to behave weirdly
    const id = "48297906617199394916";

    fakeZNSHub.ownerOf.whenCalledWith(id).returns(accountOne.address);

    zAuction.connect(accountOne).setBuyPrice("1", id);
    const tx = zAuction.connect(accountTwo).buyNow("2", id);

    await expect(tx).to.be.revertedWith("zAuction: wrong sale price");
  });

  it("Fails to buyNow when not listed by current owner", async () => {
    const callers = await ethers.getSigners();
    const accountOne = callers[0];
    const accountTwo = callers[1];
    // Random string from random.org - collisions cause other tests to behave weirdly
    const id = "61480887673643103205";

    fakeZNSHub.ownerOf.whenCalledWith(id).returns(accountOne.address);

    await zAuction.connect(accountOne).setBuyPrice("1", id);

    fakeZNSHub.ownerOf.whenCalledWith(id).returns(accountTwo.address);

    const tx = zAuction.connect(accountOne).buyNow("1", id);

    await expect(tx).to.be.revertedWith("zAuction: not listed for sale");
  });

  it("Fails to buyNow when not listed for sale", async () => {
    const callers = await ethers.getSigners();
    const accountOne = callers[0];
    const accountTwo = callers[1];
    // Random string from random.org - collisions cause other tests to behave weirdly
    const id = "32959946775240558658";

    fakeZNSHub.ownerOf.whenCalledWith(id).returns(accountOne.address);

    const tx = zAuction.connect(accountTwo).buyNow("0", id);

    await expect(tx).to.be.revertedWith("zAuction: not listed for sale");
  });

  it("Fails to buyNow when listed for sale at a price of 0", async () => {
    const callers = await ethers.getSigners();
    const accountOne = callers[0];
    const accountTwo = callers[1];
    // Random string from random.org - collisions cause other tests to behave weirdly
    const id = "30277782698379432561";

    fakeZNSHub.ownerOf.whenCalledWith(id).returns(accountOne.address);

    //Generate new listing
    await zAuction.connect(accountOne).setBuyPrice("1", id);

    //Changed my mind, I don't want to sell id
    await zAuction.connect(accountOne).setBuyPrice("0", id);

    const tx = zAuction.connect(accountTwo).buyNow("0", id);

    await expect(tx).to.be.revertedWith("zAuction: item not for sale");
  });

  it("Transfers payment from seller to buyer on buyNow", async () => {
    const callers = await ethers.getSigners();
    const seller = callers[0];
    const buyer = callers[1];
    // Random string from random.org - collisions cause other tests to behave weirdly
    const id = "43229603412059879257";
    const amount = "1";

    fakeZNSHub.ownerOf.whenCalledWith(id).returns(seller.address);
    fakeZNSHub.getRegistrarForDomain.returns(fakeRegistrar.address);
    fakeRegistrar.minterOf.whenCalledWith(id).returns(seller.address);
    fakeERC20Token.transferFrom.returns(true);

    //Generate new listing
    await zAuction.connect(seller).setBuyPrice(amount, id);

    await zAuction.connect(buyer).buyNow(amount, id);

    expect(fakeERC20Token.transferFrom).to.have.been.calledWith(
      buyer.address,
      seller.address,
      amount
    );
  });

  it("Transfers NFT from seller to buyer on buyNow", async () => {
    const callers = await ethers.getSigners();
    const seller = callers[0];
    const buyer = callers[1];
    // Random string from random.org - collisions cause other tests to behave weirdly
    const id = "75466840944549860413";
    const amount = "1";

    fakeZNSHub.ownerOf.whenCalledWith(id).returns(seller.address);

    //Generate new listing
    await zAuction.connect(seller).setBuyPrice(amount, id);

    await zAuction.connect(buyer).buyNow(amount, id);

    expect(
      fakeRegistrar["safeTransferFrom(address,address,uint256)"]
    ).to.have.been.calledWith(
      seller.address,
      buyer.address,
      BigNumber.from(id)
    );
  });

  // Covers a corner case where a buyer's listing could have continued existing after already being used to make a purchase.
  it("Destroys current listing after purchase", async () => {
    const callers = await ethers.getSigners();
    const seller = callers[0];
    const buyer = callers[1];
    // Random string from random.org - collisions cause other tests to behave weirdly
    const id = "50369901766853079283";
    const amount = "1";

    fakeZNSHub.ownerOf.whenCalledWith(id).returns(seller.address);

    //Generate new listing
    await zAuction.connect(seller).setBuyPrice(amount, id);

    await zAuction.connect(buyer).buyNow(amount, id);

    //Successful transfer of NFT
    expect(
      fakeRegistrar["safeTransferFrom(address,address,uint256)"]
    ).to.have.been.calledWith(
      seller.address,
      buyer.address,
      BigNumber.from(id)
    );

    // If seller comes back into possession of NFT, listing should be removed.
    const tx = zAuction.connect(buyer).buyNow(amount, id);
    await expect(tx).to.be.revertedWith("zAuction: wrong sale price"); // price is now 0
    const tx2 = zAuction.connect(buyer).buyNow("0", id);
    await expect(tx2).to.be.revertedWith("zAuction: item not for sale"); // ...aka not for sale
  });
});
