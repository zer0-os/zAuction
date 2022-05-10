import * as chai from "chai";
import { ethers } from "hardhat";
import { FakeContract, smock } from "@defi-wonderland/smock";

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
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";

chai.use(smock.matchers);

describe("zAuction Contract Tests", () => {
  let creator: SignerWithAddress;
  let bidder: SignerWithAddress;
  let owner: SignerWithAddress;
  let zAuction: ZAuction;

  // Interfaces can't deploy from the factory
  let fakeDefaultToken: FakeContract<IERC20>;
  let fakeNetworkToken: FakeContract<IERC20>;
  let fakeWildToken: FakeContract<IERC20>;
  let fakeRegistrar: FakeContract<IRegistrar>;
  let fakeZNSHub: FakeContract<IZNSHub>;

  const dummyDomainId =
    "0x617b3c878abfceb89eb62b7a24f393569c822946bbc9175c6c65a7d2647c5402";

  before(async () => {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    creator = signers[0];
    bidder = signers[1];
    owner = signers[2];

    fakeDefaultToken = await smock.fake(IERC20__factory.abi);
    fakeNetworkToken = await smock.fake(IERC20__factory.abi);
    fakeWildToken = await smock.fake(IERC20__factory.abi);
    fakeRegistrar = await smock.fake(IRegistrar__factory.abi);
    fakeZNSHub = await smock.fake(IZNSHub__factory.abi);

    // Royalty is fixed at 10% unless otherwise specified
    fakeRegistrar.domainRoyaltyAmount.returns(1000000);
    fakeRegistrar.ownerOf.returns(owner);
    fakeZNSHub.parentOf.returns(0);
    fakeZNSHub.ownerOf.returns(creator.address);
    fakeDefaultToken.transferFrom.returns(true);
    fakeNetworkToken.transferFrom.returns(true);
    fakeWildToken.transferFrom.returns(true);
    fakeZNSHub.getRegistrarForDomain.returns(fakeRegistrar.address);
    fakeRegistrar.ownerOf.returns(owner.address);
    fakeRegistrar.ownerOf.returns;

    const zAuctionFactory = new ZAuction__factory(creator);
    zAuction = await zAuctionFactory.deploy();
    await zAuction.initialize(fakeWildToken.address, fakeZNSHub.address);
    await zAuction.setWildToken(fakeWildToken.address);
    await zAuction.connect(creator).setZNSHub(fakeZNSHub.address);
  });
  it("Sets a network token", async () => {
    await zAuction
      .connect(creator)
      .setNetworkToken(dummyDomainId, fakeNetworkToken.address);

    const token = await zAuction.getPaymentTokenForDomain(dummyDomainId);
    expect(token).to.eq(fakeNetworkToken.address);
  });
  it("Sets a default token", async () => {
    await zAuction
      .connect(creator)
      .setDefaultPaymentToken(fakeDefaultToken.address);

    const token = await zAuction.defaultPaymentToken();
    expect(token).to.eq(fakeDefaultToken.address);
  });
  it("Removes a network token and falls back on the default token", async () => {
    await zAuction
      .connect(creator)
      .setNetworkToken(dummyDomainId, ethers.constants.AddressZero);

    const token = await zAuction.getPaymentTokenForDomain(dummyDomainId);
    expect(token).to.eq(fakeDefaultToken.address);
  });
  it("Sets a buy now price", async () => {
    await zAuction
      .connect(owner)
      .setBuyPrice(ethers.utils.parseEther("10"), dummyDomainId);

    const listing = await zAuction.priceInfo(dummyDomainId);
    expect(listing.price).to.eq(ethers.utils.parseEther("10"));
    expect(listing.paymentToken).to.eq(fakeDefaultToken.address);
  });
  it("Fails a buyNow if the network token is changed before purchase", async () => {
    await zAuction
      .connect(creator)
      .setNetworkToken(dummyDomainId, fakeNetworkToken.address);

    const tx = zAuction
      .connect(bidder)
      .buyNowV2(ethers.utils.parseEther("10"), dummyDomainId);

    await expect(tx).to.be.revertedWith(
      "zAuction: Listing not set in correct domain token"
    );
  });
  it("Accepts a buyNow if the network token is the same as the listing for that domain", async () => {
    // Set network token to 0 will fall back on default
    await zAuction
      .connect(creator)
      .setNetworkToken(dummyDomainId, ethers.constants.AddressZero);

    const tx = await zAuction
      .connect(bidder)
      .buyNowV2(ethers.utils.parseEther("10"), dummyDomainId);

    expect(tx).to.emit(zAuction, "DomainSoldV2");
  });
  it("Fails acceptBidV2 if the wrong token is used", async () => {
    const params = {
      bidNonce: "4771690347",
      bid: ethers.utils.parseEther("123"),
      tokenId: "0x1",
      minBid: "0",
      startBlock: "0",
      expireBlock: "999999999999",
    };
    fakeZNSHub.parentOf.whenCalledWith(dummyDomainId).returns("0");
    fakeZNSHub.parentOf.whenCalledWith(params.tokenId).returns(dummyDomainId);
    fakeZNSHub.ownerOf.whenCalledWith(params.tokenId).returns(owner.address);
    fakeRegistrar.minterOf.whenCalledWith("0x1").returns(owner.address);

    const bidToSign = await zAuction.createBid(
      params.bidNonce,
      params.bid,
      params.tokenId,
      params.minBid,
      params.startBlock,
      params.expireBlock,
      fakeNetworkToken.address
    );

    const signature = await bidder.signMessage(
      ethers.utils.arrayify(bidToSign)
    );

    const tx = zAuction
      .connect(owner)
      .acceptBidV2(
        signature,
        params.bidNonce,
        bidder.address,
        params.bid,
        params.tokenId,
        params.minBid,
        params.startBlock,
        params.expireBlock,
        fakeNetworkToken.address
      );

    await expect(tx).to.be.revertedWith(
      "zAuction: Only bids made with the network's token can be accepted"
    );
  });
  it("Accepts a legacy bid with hardcoded wild token value", async () => {
    const params = {
      bidNonce: "4771690347",
      bid: ethers.utils.parseEther("123"),
      tokenId: "0x1",
      minBid: "0",
      startBlock: "0",
      expireBlock: "999999999999",
    };
    fakeZNSHub.parentOf.whenCalledWith(dummyDomainId).returns("0");
    fakeZNSHub.parentOf.whenCalledWith(params.tokenId).returns(dummyDomainId);
    fakeZNSHub.ownerOf.whenCalledWith(params.tokenId).returns(owner.address);
    fakeRegistrar.minterOf.whenCalledWith("0x1").returns(owner.address);

    // Legacy bids are always with WILD, but signed message doesn't include that
    // so use AddressZero
    const bidToSign = await zAuction.createBid(
      params.bidNonce,
      params.bid,
      params.tokenId,
      params.minBid,
      params.startBlock,
      params.expireBlock,
      ethers.constants.AddressZero
    );

    const signature = await bidder.signMessage(
      ethers.utils.arrayify(bidToSign)
    );

    const tx = await zAuction
      .connect(owner)
      .acceptBid(
        signature,
        params.bidNonce,
        bidder.address,
        params.bid,
        params.tokenId,
        params.minBid,
        params.startBlock,
        params.expireBlock
      );

    expect(tx).to.emit(zAuction, "BidAccepted");
  });
  it("Fails when the token given matches the domain network token but not the token of the original bid", async () => {
    const params = {
      bidNonce: "4771690347",
      bid: ethers.utils.parseEther("123"),
      tokenId: "0x1",
      minBid: "0",
      startBlock: "0",
      expireBlock: "999999999999",
    };
    fakeZNSHub.parentOf.whenCalledWith(dummyDomainId).returns("0");
    fakeZNSHub.parentOf.whenCalledWith(params.tokenId).returns(dummyDomainId);
    fakeZNSHub.ownerOf.whenCalledWith(params.tokenId).returns(owner.address);
    fakeRegistrar.minterOf.whenCalledWith("0x1").returns(owner.address);

    const bidToSign = await zAuction.createBid(
      params.bidNonce,
      params.bid,
      params.tokenId,
      params.minBid,
      params.startBlock,
      params.expireBlock,
      fakeNetworkToken.address
    );

    const signature = await bidder.signMessage(
      ethers.utils.arrayify(bidToSign)
    );

    const tx = zAuction
      .connect(owner)
      .acceptBidV2(
        signature,
        params.bidNonce,
        bidder.address,
        params.bid,
        params.tokenId,
        params.minBid,
        params.startBlock,
        params.expireBlock,
        fakeDefaultToken.address
      );

    await expect(tx).to.be.revertedWith("zAuction: recovered incorrect bidder");
  });
  it("Accepts a bid when the right token is used", async () => {
    const params = {
      bidNonce: "5771690347",
      bid: ethers.utils.parseEther("123"),
      tokenId: "0x1",
      minBid: "0",
      startBlock: "0",
      expireBlock: "999999999999",
    };
    fakeZNSHub.parentOf.whenCalledWith(params.tokenId).returns(dummyDomainId);
    fakeZNSHub.ownerOf.whenCalledWith(params.tokenId).returns(owner.address);
    const bidToSign = await zAuction.createBid(
      params.bidNonce,
      params.bid,
      params.tokenId,
      params.minBid,
      params.startBlock,
      params.expireBlock,
      fakeDefaultToken.address
    );
    const signature = await bidder.signMessage(
      ethers.utils.arrayify(bidToSign)
    );
    const tx = await zAuction
      .connect(owner)
      .acceptBidV2(
        signature,
        params.bidNonce,
        bidder.address,
        params.bid,
        params.tokenId,
        params.minBid,
        params.startBlock,
        params.expireBlock,
        fakeDefaultToken.address
      );

    expect(tx).to.emit(zAuction, "BidAcceptedV2");
  });
  it("Not 18 decimal token test", async () => {
    // Confirm tokens with non-18 decimal precision don't break math
    fakeRegistrar.domainRoyaltyAmount.returns(1000000);

    await zAuction
      .connect(creator)
      .setTopLevelDomainFee(dummyDomainId, "1000000");

    const decimals = 14;
    const bid = ethers.utils.parseUnits("15", decimals);
    const royalty = await zAuction.calculateMinterRoyalty(dummyDomainId, bid);

    const fee = await zAuction.calculateTopLevelDomainFee(dummyDomainId, bid);

    // 10% of bid
    expect(royalty).to.eq(ethers.utils.parseUnits("1.5", decimals));
    expect(fee).to.eq(ethers.utils.parseUnits("1.5", decimals));
  });
});
