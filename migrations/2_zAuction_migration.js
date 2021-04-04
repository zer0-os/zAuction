const zAuction = artifacts.require("zAuction");
const zAuctionAccountant = artifacts.require("zAuctionAccountant");
const token = artifacts.require("ERC721TestToken.sol");

module.exports = async function(deployer) {
  await deployer.deploy(zAuctionAccountant);
  await deployer.deploy(zAuction);
  await deployer.deploy(token, 'Test 721', 'TEST', {
    "id": 0,
    "description": "My NFT",
    "external_url": "https://forum.openzeppelin.com/t/create-an-nft-and-deploy-to-a-public-testnet-using-truffle/2961",
    "image": "https://twemoji.maxcdn.com/svg/1f40e.svg",
    "name": "My NFT 0"
  });

  let zad = await zAuction.deployed();
  let zaad = await zAuctionAccountant.deployed();
  let td = await token.deployed();

  td.mint("0xD3a9ac5FfCFeb6100349644D90376577d966f78E");
};
