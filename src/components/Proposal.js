import { Form, Label, Radio, Button, Grid, Icon, Segment } from "semantic-ui-react";
import 'semantic-ui-css/semantic.min.css';

import { ethers } from "ethers";

import { useEffect, useState } from "react";

const proposalStateMapping = {
    0: 'Pending',
    1: 'Active',
    2: 'Canceled',
    3: 'Defeated',
    4: 'Succeeded',
    5: 'Queued',
    6: 'Expired',
    7: 'Executed'
}

const Proposal = ({ tokenModule=null, voteModule=null, index=null, address="", proposal=[], hasClaimedNFT=false }) => {
    const [isVoting, setIsVoting] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [voteType, setVoteType] = useState(null);

    const handleRadioButtons = (e, { value }) => {
        setVoteType(value);
    }

    useEffect(() => {
        const checkVotedStatus = async () => {
            if (!hasClaimedNFT) {
                return;
            }

            // If we haven't received a proposal as a props then we can't check if the user voted yet!
            if (!proposal) {
                return;
            }

            // Check if the user has already voted on the first proposal.
            try {
                let hasVoted = await voteModule.hasVoted(proposal.proposalId, address)
                setHasVoted(hasVoted)

                if (hasVoted) {
                    console.log("🥵 User has already voted for proposal id: " + proposal.proposalId);
                } else {
                    console.log("🙂 User has not voted yet for proposal id: " + proposal.proposalId);
                }
            } catch (err) {
                console.error("failed to check if wallet has voted", err);
            }
        };
        checkVotedStatus();
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
            vote: voteType
        };

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

    if ([3, 7].includes(proposal.state)) {
        // Render only the description of the proposal alongside a green/red icon
        //console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(tokenModule)))
        return (
            <Segment inverted>
                <Grid.Row style={{ padding: '4px' }}>
                    <Grid.Column>
                        <h4>{proposal.description}</h4>
                        <Form inverted>
                            <Form.Field>
                                {proposal.state === 7 ? 
                                <>
                                    <Icon
                                        name="chevron up"
                                        floated="left" 
                                        color="green"
                                    />
                                    <Label color="green">{proposalStateMapping[proposal.state]}</Label>
                                </>
                                 :
                                <>
                                    <Icon
                                        name="chevron down"
                                        floated="left" 
                                        color="red"
                                    />
                                    <Label color="red">{proposalStateMapping[proposal.state]}</Label>
                                </>}
                            </Form.Field>
                        </Form>
                    </Grid.Column>
                </Grid.Row>
            </Segment>
        )
    } else if (proposal.state === 1) {
        // Render active proposal
        return (
            <Segment inverted>
                <Grid.Row style={{ padding: '4px' }} >
                    <Grid.Column>
                        <h4>{proposal.description}</h4>
                        <Form onSubmit={onSubmit} inverted>
                            <Form.Field>
                                {proposal.votes.map((vote, index) => (
                                    <Radio style={{ paddingRight: '20px' }}
                                        label={vote.label}
                                        id={proposal.proposalId + "-" + vote.type}
                                        name={proposal.proposalId}
                                        value={vote.type}
                                        defaultChecked={vote.type === 2}
                                        checked={voteType === vote.type}
                                        onClick={handleRadioButtons}
                                    />
                                ))}
                            </Form.Field>
                            <Form.Field>
                                <Button disabled={isVoting || hasVoted} primary>
                                        {isVoting ? "Voting..." : 
                                            hasVoted ? "You Already Voted" : "Submit Votes"}
                                </Button>
                            </Form.Field>
                        </Form>
                    </Grid.Column>
                </Grid.Row>
            </Segment>
        );
    } else {
        // Otherwise we return nothing to render
        return null
    }
}

export default Proposal;
