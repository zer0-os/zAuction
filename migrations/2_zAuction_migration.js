const zAuction = artifacts.require("zAuction");

module.exports = function(deployer) {
  deployer.deploy(zAuction);
};
