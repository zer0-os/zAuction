const zAuction = artifacts.require("Zauction");
const zSale = artifacts.require("Zsale");
const token = artifacts.require("ERC721TestToken");
const weth = artifacts.require("ERC20TestToken");

module.exports = async function(deployer) {
  await deployer.deploy(weth, "weth", "WETH");
  let wethd = await weth.deployed();
  await deployer.deploy(zAuction, wethd.address);
  await deployer.deploy(zSale, wethd.address);
  await deployer.deploy(token, 'Test 721', 'TEST', {
    "id": 0,
    "description": "My NFT",
    "external_url": "https://forum.openzeppelin.com/t/create-an-nft-and-deploy-to-a-public-testnet-using-truffle/2961",
    "image": "https://twemoji.maxcdn.com/svg/1f40e.svg",
    "name": "My NFT 0"
  });
  
  //let zad = await zAuction.deployed();
  //let zsd = await zSale.deployed();
  //let td = await token.deployed();
  //td.mint("0xD3a9ac5FfCFeb6100349644D90376577d966f78E");
  //zaad.SetZauction(zad.address);
  //zaad.Deposit({value: 1000000000000000000});
  //console.log("owner of 0: ", await td.ownerOf(0));
  //td.approve(zad.address, 0);
};
