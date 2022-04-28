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
import { BigNumberish, CallOverrides } from "ethers";

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

  const wildToken = "0x3Ae5d499cfb8FB645708CC6DA599C90e64b33A79";
  const lootToken = "0x5bAbCA2Af93A9887C86161083b8A90160DA068f2";
  const dummyDomainId =
    "0x617b3c878abfceb89eb62b7a24f393569c822946bbc9175c6c65a7d2647c5402";

  before(async () => {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    creator = signers[0];
    bidder = signers[1];
    owner = signers[2];

    fakeERC20Token = await smock.fake(IERC20__factory.abi);
    fakeRegistrar = await smock.fake(IRegistrar__factory.abi);
    fakeZNSHub = await smock.fake(IZNSHub__factory.abi);

    // Royalty is fixed at 10% unless otherwise specified
    fakeRegistrar.domainRoyaltyAmount.returns(1000000);
    fakeRegistrar.ownerOf.returns(owner);
    fakeZNSHub.parentOf.returns(0);

    const reg: IRegistrar = {
      ownerOf: (tokenId: string) => {},
    } as unknown as IRegistrar;

    fakeZNSHub.getRegistrarForDomain.returns(fakeRegistrar.address);
    fakeRegistrar.ownerOf.returns(owner.address);

    const zAuctionFactory = new ZAuction__factory(creator);
    zAuction = await zAuctionFactory.deploy();
    await zAuction.initialize(fakeERC20Token.address, fakeZNSHub.address);
    await zAuction.connect(creator).setZNSHub(fakeZNSHub.address);
  });
  it("Sets a network token", async () => {
    await zAuction.connect(creator).setNetworkToken(dummyDomainId, lootToken);

    const token = await zAuction.getTokenForDomain(dummyDomainId);
    expect(token).to.eq(lootToken);
  }).timeout(300000);
  it("Sets a default token", async () => {
    await zAuction.connect(creator).setDefaultToken(wildToken);

    const token = await zAuction.token();
    expect(token).to.eq(wildToken);
  });
  it("Removes a network token and falls back on the default token", async () => {
    await zAuction
      .connect(creator)
      .setNetworkToken(dummyDomainId, ethers.constants.AddressZero);

    const token = await zAuction.getTokenForDomain(dummyDomainId);
    expect(token).to.eq(wildToken);
  });
  it("Sets a buy now price", async () => {
    // first confirm the registrar we get back gives us the owner we expect
    const retrievedRegistrar = await zAuction
      .connect(owner)
      .setBuyPrice(ethers.utils.parseEther("10"), dummyDomainId);

    const listing = await zAuction.priceInfo(dummyDomainId);
    expect(listing.price).to.eq(ethers.utils.parseEther("10"));
    expect(listing.token).to.eq(wildToken);
  });
});
