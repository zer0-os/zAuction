import { ZAuction__factory } from "./../typechain/factories/ZAuction__factory";
import { ethers, upgrades, network, run } from "hardhat";
// import * as dotenv from "dotenv";
import { ZAuction } from "../typechain";

import * as zauctionV2Json from "../artifacts/contracts/Zauction.sol/ZAuction.json";
import * as zauctionV1Json from "../contracts/legacyAbi/zAuction.json";

// Rinkeby addresses
const zAuctionV2Address = "0xb2416Aed6f5439Ffa0eCCAaa2b643f3D9828f86B";
const zAuctionV1Address = "0x376030f58c76ECC288a4fce8F88273905544bC07";
const registrarAddress = "0xa4F6C921f914ff7972D7C55c15f015419326e0Ca";
const hubAddress = "0x90098737eB7C3e73854daF1Da20dFf90d521929a";

async function main() {
  const provider = new ethers.providers.StaticJsonRpcProvider(
    process.env.INFURA_URL,
    4
  );

  const zAuctionV1Instance = new ethers.Contract(
    zAuctionV1Address,
    zauctionV1Json.abi,
    provider
  );
  const zAuctionV2Instance = new ethers.Contract(
    zAuctionV2Address,
    zauctionV2Json.abi,
    provider
  );

  console.log(network.name);

  const signers = await ethers.getSigners();
  const mainWallet = signers[0];
  const astroWallet = signers[1];

  const owner = await zAuctionV2Instance.owner();
  const hub = await zAuctionV2Instance.hub();

  console.log(owner, hub);

  // response from /bid
  const response = {
    payload:
      "0x45d6353a3571ba288e77a58f2b51799e9c1210f3ba2a50af3e461cc623e6ff31",
    uniqueBidId: 22787355466,
    nftId: "0x868ab0de466560953b7d302cbbaaadb7f9eca29d0201edce3794f6d1d46ea53f",
  };

  const bytes = ethers.utils.arrayify(response.payload);
  const signedMessage = await astroWallet.signMessage(bytes);
  console.log(signedMessage);
  console.log(await astroWallet.getAddress());

  // input for /bids, update the `uniqueBidId` and `signedMessage` as appropriate based on above response
  const input = {
    account: "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53",
    uniqueBidId: 22787355466,
    tokenId:
      "0x6e35a7ecbf6b6368bb8d42ee9b3dcfc8404857635036e60196931d4458c07622",
    contractAddress: "0xa4F6C921f914ff7972D7C55c15f015419326e0Ca",
    bidAmount: "1300000000000000000",
    minimumBid: "0",
    startBlock: "0",
    expireBlock: "99999999999",
    signedMessage:
      "0x6e815602aec0769a39df8bd47928950efaafaa3a0688387ea0620defaac1057e39207079d00641c6fc27c435418b3570b5647bb402c3f92f5fbe02209e30d9751c",
  };

  // mainWallet is owner of the domain and seller
  const tx = await zAuctionV1Instance
    .connect(mainWallet)
    .acceptBid(
      input.signedMessage,
      input.uniqueBidId,
      input.account,
      input.bidAmount,
      input.tokenId,
      input.minimumBid,
      input.startBlock,
      input.expireBlock,
      { gasLimit: 539800 }
    );

  const receipt = await tx.wait(1);

  console.log(receipt);
}

main();
