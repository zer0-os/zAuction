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
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";

chai.use(smock.matchers);

describe("zAuction Contract Tests", () => {
  let creator: SignerWithAddress;
  let bidder: SignerWithAddress;
  let owner: SignerWithAddress;
  let zAuction: ZAuction;
  let mockZauctionFactory: MockContractFactory<ZAuction__factory>;
  let mockZauction: MockContract<ZAuction>;

  // Interfaces can't deploy from the factory
  let fakeDefaultToken: FakeContract<IERC20>;
  let fakeNetworkToken: FakeContract<IERC20>;
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
    fakeRegistrar = await smock.fake(IRegistrar__factory.abi);
    fakeZNSHub = await smock.fake(IZNSHub__factory.abi);

    // Royalty is fixed at 10% unless otherwise specified
    fakeRegistrar.domainRoyaltyAmount.returns(1000000);
    fakeRegistrar.ownerOf.returns(owner);
    fakeZNSHub.parentOf.returns(0);
    fakeZNSHub.ownerOf.returns(creator.address);
    fakeDefaultToken.transferFrom.returns(true);

    fakeRegistrar["safeTransferFrom(address,address,uint256)"].returns(true);

    fakeZNSHub.getRegistrarForDomain.returns(fakeRegistrar.address);
    fakeRegistrar.ownerOf.returns(owner.address);

    const zAuctionFactory = new ZAuction__factory(creator);
    zAuction = await zAuctionFactory.deploy();
    await zAuction.initialize(fakeDefaultToken.address, fakeZNSHub.address);
    await zAuction.connect(creator).setZNSHub(fakeZNSHub.address);
  });
  it("Sets a network token", async () => {
    await zAuction
      .connect(creator)
      .setNetworkToken(dummyDomainId, fakeNetworkToken.address);

    const token = await zAuction.getTokenForDomain(dummyDomainId);
    expect(token).to.eq(fakeNetworkToken.address);
  }).timeout(300000);
  it("Sets a default token", async () => {
    await zAuction.connect(creator).setDefaultToken(wildToken);

    const token = await zAuction.token();
    expect(token).to.eq(wildToken);
  }).timeout(300000);
  it("Removes a network token and falls back on the default token", async () => {
    await zAuction
      .connect(creator)
      .setNetworkToken(dummyDomainId, ethers.constants.AddressZero);

    const token = await zAuction.getTokenForDomain(dummyDomainId);
    expect(token).to.eq(wildToken);
  }).timeout(300000);
  it("Sets a buy now price", async () => {
    await zAuction
      .connect(owner)
      .setBuyPrice(ethers.utils.parseEther("10"), dummyDomainId);

    const listing = await zAuction.priceInfo(dummyDomainId);
    expect(listing.price).to.eq(ethers.utils.parseEther("10"));
    expect(listing.token).to.eq(wildToken);
  }).timeout(300000);
  it("Fails a buyNow if the network token is changed before purchase", async () => {
    await zAuction.connect(creator).setNetworkToken(dummyDomainId, lootToken);

    const tx = zAuction
      .connect(bidder)
      .buyNow(ethers.utils.parseEther("10"), dummyDomainId);

    await expect(tx).to.be.revertedWith(
      "zAuction: Listing not set in correct domain token"
    );
  });
  it("Accepts a buyNow if the network token is the same as the listing for that domain", async () => {
    await zAuction
      .connect(creator)
      .setNetworkToken(dummyDomainId, fakeDefaultToken.address);

    // error: Address: call to non contract, in `paymentTransfers` internally, because SafeERC20
    const tx = await zAuction
      .connect(bidder)
      .buyNow(ethers.utils.parseEther("10"), dummyDomainId);

    const receipt = await tx.wait();
    expect(receipt.from).to.eq(bidder.address);
  });
});
