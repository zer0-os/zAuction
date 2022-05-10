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

  // response from /bid
  const response = {
    payload:
      "0x0c87ee83034ae5c43acc52cc247db4082a270b67ebd3ff25cf649fba318a2092",
    bidNonce: 33987401755,
  };
  const bytes = ethers.utils.arrayify(response.payload);
  const signedMessage = await mainWallet.signMessage(bytes);
  console.log(signedMessage);

  // Astro test
  // 0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53
}

main();
