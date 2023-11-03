// SPDX-License-Identifier: MIT
pragma solidity >= 0.7.0 < 0.9.0;
pragma abicoder v2; // Enable ABI coder v2

contract AuctionExchange {

    struct Auction { //every auction that will create will have all this feild.
        uint id;
        address payable seller;
        string name;
        string description;
        uint min;
        bool end;
        uint bestOfferId;   //who create bestOffer his id will be store here
        uint[] offerIds;    //every offers will store here
    }

    struct Offer { //who create offer will have this feilds
        uint id;
        uint auctionId;
        address payable buyer;
        uint price;
    }

    mapping (uint => Auction) public auctions;
    mapping (uint => Offer) public offers;
    mapping (address => uint[]) private auctionList; //point all the auction
    mapping (address => uint[]) private offerList;   //point all offers

    uint newAuctionId = 1;

    modifier auctionExist(uint _auctionId) { //to check the auction exist or not
        require(_auctionId > 0 && _auctionId < newAuctionId, "Auction not exist");
        _;
    } 
    
    //function to create auctions. Auction start from 1
    function createAuction(string calldata _name, string calldata _description, uint _min) external {
        require(_min > 0, "Minimum Price Must Be Greator Than 0");
        uint[] memory offerIds = new uint[](0); //initialize offerIds from 0
        auctions[newAuctionId] = Auction(newAuctionId, payable(msg.sender), _name, _description, _min, false, 0, offerIds);
        auctionList[msg.sender].push(newAuctionId); //store auction in auction list
        newAuctionId++;
    }

    //fucntion to create offer for any auction
    function createOffer(uint _auctionId) external payable auctionExist(_auctionId) {
        Auction storage auction = auctions[_auctionId]; 
        Offer storage bestOffer = offers[auction.bestOfferId];

        require(auction.end == false, "Auction Ended");
        require(msg.value >= auction.min && msg.value > bestOffer.price, 
        "Price must be greater then minimum offer and Best Offer");

        uint newId = bestOffer.id+1; 
        auction.bestOfferId = newId;
        auction.offerIds.push(newId);
        offers[newId] = Offer(newId, _auctionId, payable(msg.sender), msg.value);
        offerList[msg.sender].push(newId);
    }

    //This function will transfer value to them who not win the auction and will get value who
    function transaction(uint _auctionId) external auctionExist(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(auction.bestOfferId > 0, "Don't have any Offer");
        require(auction.end == false, "Auction Ended");
        auction.end = true; //it will end the auction 

        //it will fetch bestOfferId{number} from auction and map to the offer 
        //struct and store that Offer in bestOffer variable
        Offer storage bestOffer = offers[auction.bestOfferId];

        //Auction offerIds store all the offers in array
        for (uint i=0; i<auction.offerIds.length; i++) 
        {//return other offers price which is not best offer
            uint offerId = auction.offerIds[i]; 
            if (offerId != auction.bestOfferId) { 
                Offer storage offer = offers[offerId];
                offer.buyer.transfer(offer.price);
            }
        }

        //owner of auction get best offer price
        auction.seller.transfer(bestOffer.price);
    } 

    function getTotalAuctions() external view returns(Auction[] memory) {
        Auction[] memory _auction = new Auction[](newAuctionId-1);

        for (uint i=1; i<newAuctionId; i++) 
        {
            _auction[i-1] = auctions[i];
        }

        return _auction;
    }

    function getUserAuctions(address _user) external view returns(Auction[] memory) {
        uint[] storage userAuctionId = auctionList[_user];
        Auction[] memory _auction = new Auction[](userAuctionId.length);
        for (uint i=0; i<userAuctionId.length; i++) {
            uint auctionId = userAuctionId[i];
            _auction[i] = auctions[auctionId];
        }
        return _auction;
    }

    function getUserOffers(address _user) external view returns(Offer[] memory)  {
        uint[] storage userOfferId = offerList[_user];
        Offer[] memory _offer = new Offer[](userOfferId.length);
        for (uint i=0; i<userOfferId.length; i++) 
        {
            uint offerId = userOfferId[i];
            _offer[i] = offers[offerId];
        }
        return _offer;
    }
}