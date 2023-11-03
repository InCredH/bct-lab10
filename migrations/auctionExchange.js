const AuctionExchange = artifacts.require("AuctionExchange");

module.export = (deployer)=> {
    deployer.deploy(AuctionExchange);
}