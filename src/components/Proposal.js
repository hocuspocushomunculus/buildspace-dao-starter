import { Form, Card, Button, Grid } from "semantic-ui-react";
import 'semantic-ui-css/semantic.min.css';

import { ethers } from "ethers";

import { useEffect, useState } from "react";

const Proposal = ({ tokenModule=null, voteModule=null, index=null, address="", proposal=[], hasClaimedNFT=false }) => {
    const [isVoting, setIsVoting] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);

    // We also need to check if the user already voted.
    useEffect(() => {
        if (!hasClaimedNFT) {
            return;
        }

        // If we haven't received a proposal as a props then we can't check if the user voted yet!
        if (!proposal) {
            return;
        }

        // Check if the user has already voted on the first proposal.
        voteModule.hasVoted(proposal.proposalId, address)
            .then((hasVoted) => {
                setHasVoted(hasVoted);
                if (hasVoted) {
                    console.log("🥵 User has already voted for proposal id: " + proposal.proposalId);
                } else {
                    console.log("🙂 User has not voted yet for proposal id: " + proposal.proposalId);
                }
            })
            .catch((err) => {
                console.error("failed to check if wallet has voted", err);
            });
    }, [hasClaimedNFT, proposal, address, voteModule]);


    const onSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        //before we do async things, we want to disable the button to prevent double clicks
        setIsVoting(true);

        // lets get the votes from the form for the values
        let voteResult = {
            proposalId: proposal.proposalId,
            //abstain by default
            vote: 2,
        };
        proposal.votes.forEach((vote) => {
            const elem = document.getElementById(
                proposal.proposalId + "-" + vote.type
            );

            if (elem.checked) {
                voteResult.vote = vote.type;
                return;
            }
        });

        // first we need to make sure the user delegates their token to vote
        try {
            // we'll check if the wallet still needs to delegate their tokens before they can vote
            const delegation = await tokenModule.getDelegationOf(address);
            // if the delegation is the 0x0 address that means they have not delegated their governance tokens yet
            if (delegation === ethers.constants.AddressZero) {
            //if they haven't delegated their tokens yet, we'll have them delegate them before voting
            await tokenModule.delegateTo(address);
            }
            // then we need to vote on the proposals
            try {
                // before voting we first need to check whether the proposal is open for voting
                // we first need to get the latest state of the proposal
                let proposal = await voteModule.get(voteResult.proposalId);
                // then we check if the proposal is open for voting (state === 1 means it is open)
                if (proposal.state === 1) {
                    // if it is open for voting, we'll vote on it
                    await voteModule.vote(voteResult.proposalId, voteResult.vote);
                }

                try {
                    // a proposal is ready to be executed if it is in state 4
                    // we'll first get the latest state of the proposal again, since we may have just voted before
                    proposal = await voteModule.get(voteResult.proposalId);

                    //if the state is in state 4 (meaning that it is ready to be executed), we'll execute the proposal
                    if (proposal.state === 4) {
                        await voteModule.execute(voteResult.proposalId);
                    }

                    // if we get here that means we successfully voted, so let's set the "hasVoted" state to true
                    setHasVoted(true);
                    // and log out a success message
                    console.log("successfully voted");
                } catch (err) {
                    console.error("failed to execute votes", err);
                }
            } catch (err) {
                console.error("failed to vote", err);
            }
        } catch (err) {
            console.error("failed to delegate tokens");
        } finally {
            // in *either* case we need to set the isVoting state to false to enable the button again
            setIsVoting(false);
        }
    };

    return (
        <Form onSubmit={onSubmit}>
            <Grid.Row style={{ padding: '4px' }} >
                <Grid.Column>
                    <Card key={proposal.proposalId} className="fluid" >
                        <Card.Content>
                            <Card.Description>
                                {proposal.description}
                            </Card.Description>
                        </Card.Content>
                        <Card.Content>
                            {proposal.votes.map((vote) => (
                                <label htmlFor={proposal.proposalId + "-" + vote.type} style={{display: "inline", padding: "20px"}}>
                                    <input type="radio" id={proposal.proposalId + "-" + vote.type} name={proposal.proposalId} value={vote.type} defaultChecked={vote.type === 2} />
                                    {vote.label}
                                </label>
                            ))}
                        </Card.Content>
                        <Card.Content>
                            <Button disabled={isVoting || hasVoted} type="submit" primary>
                                {isVoting ? "Voting..." : 
                                    hasVoted ? "You Already Voted" : "Submit Votes"}
                            </Button>
                        </Card.Content>
                    </Card>
                </Grid.Column>
            </Grid.Row>
        </Form>
    );
}

export default Proposal;
