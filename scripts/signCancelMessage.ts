import { ethers, upgrades, network, run } from "hardhat";

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

  const signers = await ethers.getSigners();
  const cptdWallet = signers[0];
  const astroWallet = signers[1];
  const mainWallet = signers[2];

  // response from /bid/cancel/encode
  const response = {
    hashedCancelMessage:
      "0x17c503a08c47436eb3b35ef7b1af634392d7213c1a2344022c696c09dcd813f2",
  };

  const signedMessage = await astroWallet.signMessage(
    response.hashedCancelMessage
  );
  console.log(signedMessage);

  // Astro test
  // 0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53
}

main();
