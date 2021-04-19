const zAuction = artifacts.require("zAuction");
const zAuctionAccountant = artifacts.require("zAuctionAccountant");
const token = artifacts.require("ERC721TestToken.sol");

module.exports = async function(deployer) {
  await deployer.deploy(zAuctionAccountant);
  let zaad = await zAuctionAccountant.deployed();
  await deployer.deploy(zAuction, zaad.address);
  await deployer.deploy(token, 'Test 721', 'TEST', {
    "id": 0,
    "description": "My NFT",
    "external_url": "https://forum.openzeppelin.com/t/create-an-nft-and-deploy-to-a-public-testnet-using-truffle/2961",
    "image": "https://twemoji.maxcdn.com/svg/1f40e.svg",
    "name": "My NFT 0"
  });

  
  let zad = await zAuction.deployed();
  
  let td = await token.deployed();

  //td.mint("0xD3a9ac5FfCFeb6100349644D90376577d966f78E");
  //zaad.SetZauction(zad.address);
  //zaad.Deposit({value: 1000000000000000000});
  //console.log("owner of 0: ", await td.ownerOf(0));
  //td.approve(zad.address, 0);
};
