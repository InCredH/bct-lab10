const AuctionExchange = artifacts.require("AuctionExchange");
const {expectRevert} = require("@openzeppelin/test-helpers");


contract("Auction Exchange", (accounts)=> {
    let auctionExchange;
    beforeEach( async() => {
        auctionExchange = await AuctionExchange.new();
        console.log(auctionExchange.address);
    });

    auction = {
        name: "car",
        description: "red",
        min: 10
    }

    const [seller, buyer1, buyer2] = [accounts[0], accounts[1], accounts[2]];

    it("should create an Auction", async() => {
        let auctions;
        await auctionExchange.createAuction(auction.name, auction.description, auction.min);
        auctions = await auctionExchange.getTotalAuctions()
        assert(auctions.length === 1);
        assert(auctions[0].name === auction.name);
        assert(auctions[0].description === auction.description);
        assert(parseInt(auctions[0].min) === auction.min);
        //console.log(typeof auctions[0].min);
        //assert(auctions[0].min === auction.min);
    });

    it("should not create an Offer 'Auction Not Exist' ", async() => {
        await expectRevert(auctionExchange.createOffer(1, {from: buyer1, value: auction.min+10}), "Auction not exist");
    });

    it("should not create an Offer 'Price Lower then Minimum value'", async()=> {
        await auctionExchange.createAuction(auction.name, auction.description, auction.min);
        await expectRevert(
            auctionExchange.createOffer(1, {from:buyer1, value:auction.min-1}), 
            "Price must be greater then minimum offer and Best Offer");
    });

    it("should not create an Offer 'Price Lower then Best Offer'", async()=> {
        const offer1 = auction.min+10;
        const offer2 = auction.min+5;

        await auctionExchange.createAuction(auction.name, auction.description, auction.min);
        await auctionExchange.createOffer(1, {from:buyer1, value: offer1});
        await expectRevert(
            auctionExchange.createOffer(1, {from: buyer2, value: offer2}), 
            "Price must be greater then minimum offer and Best Offer"
            );
        });


    it("should not create an Offer 'Auction Ended'", async()=> {
        let auctions;
        await auctionExchange.createAuction(auction.name, auction.description, auction.min);
        await auctionExchange.createOffer(1, {from:buyer1, value:auction.min+5})
        await auctionExchange.transaction(1, {from: seller});
        
        await expectRevert(
            auctionExchange.createOffer(1, {from:buyer1, value:auction.min+10}), 
            "Auction Ended"
        );
    });

    it("should create an offer", async()=> {
        await auctionExchange.createAuction(auction.name, auction.description, auction.min);
        await auctionExchange.createOffer(1, {from: buyer1, value:auction.min+10});

        const userOffer = await auctionExchange.getUserOffers(buyer1);
        assert(userOffer.length === 1);
        assert(parseInt(userOffer[0].id) === 1);
        assert(parseInt(userOffer[0].auctionId) === 1);
        assert(userOffer[0].buyer === buyer1);
        assert(parseInt(userOffer[0].price) === auction.min+10);
    });

    it("should not make transaction 'Auction not exist'", async()=> {
        await expectRevert (auctionExchange.transaction(1), "Auction not exist");
    });

    it("should not make transaction 'Don't have any Offer'", async()=> {
        await auctionExchange.createAuction(auction.name, auction.description, auction.min);
        
        await expectRevert (auctionExchange.transaction(1), "Don't have any Offer");
    });

    it("should not make transaction 'Auction Ended'", async()=> {
        await auctionExchange.createAuction(auction.name, auction.description, auction.min);
        await auctionExchange.createOffer(1, {from: buyer1, value:auction.min});
        await auctionExchange.transaction(1, {from: seller});

        await expectRevert (auctionExchange.transaction(1, {from: seller}), "Auction Ended");
    });

    it("should make transaction", async()=> {
        await auctionExchange.createAuction(auction.name, auction.description, auction.min);
        
        const bestOffer = web3.utils.toBN(auction.min + 10);

        // Create offers from buyers
        await auctionExchange.createOffer(1, {from: buyer1, value:auction.min});
        await auctionExchange.createOffer(1, {from: buyer2, value: bestOffer});
        
        // Get seller's balance before the transaction
        const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(seller));
        console.log("Seller's balance before:", balanceBefore.toString());

        //Transaction
        await auctionExchange.transaction(1, { from: accounts[3] });
        
        // Get seller's balance after the transaction
        const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(seller));
        console.log("Seller's balance after:", balanceAfter.toString());
        
        assert(balanceAfter.eq(balanceBefore.add(bestOffer)), 
            "Seller Balance Should Be Equal to Balance Before + Best Offer"
        );
    });
});