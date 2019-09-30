pragma solidity ^0.5.0;

// Contract Address: 0x53840c08F92F935C9C10033837A82eE81eBD088f

contract Bounties {
    enum BountyStatus { CREATED, ACCEPTED, CANCELLED }
    Bounty[] public bounties;
    mapping(uint => Fulfillment[]) public fulfillments;

    struct Bounty {
        address payable issuer;
        uint deadline;
        string data;
        BountyStatus status;
        uint reward;
        uint acceptedFulfillmentId;
        uint fulfilledOn;
        uint cancelledOn;
    }

    struct Fulfillment {
        bool accepted;
        address payable fulfiller;
        string data;
        uint date;
    }

    constructor() public {}

    function issueBounty(string memory _data, uint _deadline)
        public
        payable
        hasValue()
        validateDeadline(_deadline)
        returns (uint)
    {
        Bounty memory newBounty = Bounty({
            issuer: msg.sender,
            deadline: _deadline,
            data: _data,
            reward: msg.value,
            status: BountyStatus.CREATED,
            acceptedFulfillmentId: 0,
            fulfilledOn: 0,
            cancelledOn: 0
        });


        bounties.push(newBounty);

        uint bountyId = bounties.length - 1;

        emit BountyIssued({ bountyId: bountyId, issuer: msg.sender, deadline: _deadline, data: _data, reward: msg.value });

        return (bountyId);
    }

    function fulfillBounty(uint bountyId, string memory _data)
        public
        bountyExists(bountyId)
        notIssuer(bountyId)
        hasStatus(bountyId, BountyStatus.CREATED)
        isBeforeDeadline(bountyId)
        returns (uint)
    {
        fulfillments[bountyId].push(Fulfillment({
            accepted: false,
            fulfiller: msg.sender,
            data: _data,
            date: now
        }));

        uint fulfillmentId = fulfillments[bountyId].length-1;

        emit BountyFulfilled({ bountyId: bountyId, fulfillmentId: fulfillmentId, fulfiller: msg.sender, data: _data, date: now });

        return (fulfillmentId);
    }

    function cancelBounty(uint bountyId)
        public
        payable
        bountyExists(bountyId)
        isBountyIssuer(bountyId)
        hasStatus(bountyId, BountyStatus.CREATED)
    {
        Bounty storage bounty = bounties[bountyId];
        bounty.status = BountyStatus.CANCELLED;
        bounty.cancelledOn = now;

        // Transfer funds back to bounty issuer
        bounty.issuer.transfer(bounty.reward);

        emit BountyCancelled(bountyId, bounty.cancelledOn);
    }

    function getNumberOfBounties() public view returns (uint) {
        return bounties.length;
    }

    function getNumberOfBountyFulfillments(uint bountyId) public view returns (uint) {
        return fulfillments[bountyId].length;
    }

    function getBountyStatus(uint bountyId) public view returns (string memory) {
        Bounty memory bounty = bounties[bountyId];

        if (bounty.status == BountyStatus.CREATED) return "CREATED";
        if (bounty.status == BountyStatus.ACCEPTED) return "ACCEPTED";
        if (bounty.status == BountyStatus.CANCELLED) return "CANCELLED";
    }

    function acceptFulfillment(uint bountyId, uint fulfillmentId)
        public
        bountyExists(bountyId)
        fulfillmentExists(bountyId, fulfillmentId)
        isBountyIssuer(bountyId)
        hasStatus(bountyId, BountyStatus.CREATED)
        fulfillmentNotYetAccepted(bountyId, fulfillmentId)
        returns (bool)
    {
        // Change fulfillment values
        Fulfillment storage fulfillment = fulfillments[bountyId][fulfillmentId];
        fulfillment.accepted = true;

        // Change bounty values
        Bounty storage bounty = bounties[bountyId];
        bounty.status = BountyStatus.ACCEPTED;
        bounty.acceptedFulfillmentId = fulfillmentId;
        bounty.fulfilledOn = now;

        // Transfer money to fulfiller
        fulfillment.fulfiller.transfer(bounty.reward);

        emit FulfillmentAccepted(bountyId, fulfillmentId, fulfillment.fulfiller, bounty.fulfilledOn, bounty.reward);
    }




    // MODIFIERS

    modifier validateDeadline(uint _newDeadline) {
        require(_newDeadline > now, "Make deadline greater than now");
        _;
    }

    modifier hasValue() {
        require(msg.value > 0, "Make wei value greater than 0");
        _;
    }

    modifier bountyExists(uint bountyId) {
        require(bountyId < bounties.length, "Bounty does not exist");
        _;
    }

    modifier notIssuer(uint bountyId) {
        Bounty memory bounty = bounties[bountyId];
        require(bounty.issuer != msg.sender, "Fulfillment issuer cannot be the same as Bounty Issuer");
        _;
    }

    modifier hasStatus(uint bountyId, BountyStatus _desiredStatus) {
        require(bounties[bountyId].status == _desiredStatus, "Bounty status is not the same as the desired status");
        _;
    }

    modifier isBeforeDeadline(uint _bountyId) {
        require(bounties[_bountyId].deadline > now, "Deadline has passed");
        _;
    }

    modifier fulfillmentExists(uint _bountyId, uint _fulfillmentId) {
        require(_fulfillmentId < fulfillments[_bountyId].length, "Fulfillment for given bounty id does not exist");
        _;
    }

    modifier isBountyIssuer(uint bountyId) {
        require(bounties[bountyId].issuer == msg.sender, "Only bounty issuer can accept a fulfillment");
        _;
    }

    modifier fulfillmentNotYetAccepted(uint bountyId, uint fulfillmentId) {
        require(fulfillments[bountyId][fulfillmentId].accepted == false, "Fulfillment is already accepted" );
        _;
    }




    // EVENTS

    event BountyIssued(uint bountyId, address issuer, uint deadline, string data, uint reward);
    event BountyFulfilled(uint bountyId, uint fulfillmentId, address fulfiller, string data, uint date);
    event FulfillmentAccepted(uint bountyId, uint fulfillmentId, address fulfiller, uint fulfilledOn, uint reward);
    event BountyCancelled(uint bountyId, uint cancelledOn);
}