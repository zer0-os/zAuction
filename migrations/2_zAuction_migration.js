const zAuction = artifacts.require("zAuction");
const zAuctionAccountant = artifacts.require("zAuctionAccountant");

module.exports = function(deployer) {
  deployer.deploy(zAuction);
  deployer.deploy(zAuctionAccountant);
};
