
import { Form, Label, Radio, Button, Input, Message, Segment } from "semantic-ui-react";

import { ethers } from "ethers";

import { useState } from "react";

const CreateProposal = ({ voteModule, tokenModule }) => {
    const [description, setDescription] = useState("");
    const [proposalType, setProposalType] = useState("");
    const [tokenAmount, setTokenAmount] = useState("");
    const [transferAddress, setTransferAddress] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);
    
    const handleRadioButtons = (e, { value }) => {
        setProposalType(value);
    }

    function is_number(input) {
        if(input === '')
            return false;
        let regex = new RegExp(/[^0-9]/, 'g');
        return (input.match(regex) === null);
    }

    function is_address(input) {
        let regex = /^0x[0-9A-Fa-f]{40}$/;
        return !(input.match(regex) === null)
    }

    const onSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        setLoading(true);
        setErrorMessage("");

        if (!is_number(tokenAmount)) {
            setErrorMessage("'" + tokenAmount + "' was not a valid number.");
            setLoading(false)
            return;
        }

        if (proposalType === "mint") {
            try {
                await voteModule.propose(description,
                    [
                      {
                        nativeTokenValue: 0,
                        transactionData: tokenModule.contract.interface.encodeFunctionData(
                          "mint",
                          [
                            voteModule.address,
                            ethers.utils.parseUnits(tokenAmount.toString(), 18),
                          ]
                        ),
                        toAddress: tokenModule.address,
                      },
                    ]
                  );
            } catch (err) {
                console.log("Minting " + tokenAmount + " new tokens has failed: " + err);
                setErrorMessage(err);
                setLoading(false);
                return;
            }
        } else {
            // Validate address
            if (!is_address(transferAddress)) {
                setErrorMessage("Invalid address: " + transferAddress);
                return;
            }

            // If the proposal is to transfer tokens, check if it exceeds amount available in treasury
            let balance = (await voteModule.balanceOfToken(tokenModule.address)).displayValue;
            if (parseInt(tokenAmount) > balance) {
                setErrorMessage("Amount to be transferred exceeds treasury balance. (maximum amount: " + balance + " tokens)")
                setLoading(false)
                return;
            }
            try {
                await voteModule.propose(description,
                    [
                        {
                            nativeTokenValue: 0,
                            transactionData: tokenModule.contract.interface.encodeFunctionData(
                            "transfer",
                            [
                                transferAddress,
                                ethers.utils.parseUnits(tokenAmount.toString(), 18),
                            ]
                            ),
                            toAddress: tokenModule.address,
                        },
                    ]
                );
            } catch (err) {
                console.log("Transferring " + tokenAmount + " tokens to address '" + transferAddress + "' has failed: " + err);
                setErrorMessage(err);
                setLoading(false);
                return;
            }
        // We're done interacting
        setLoading(false);

        }

    };
    
    return (
        <Segment inverted>
            <h2>Create a new proposal</h2>
            <Form onSubmit={onSubmit} inverted error={!!errorMessage}>
                <Form.Field>
                    <Radio style={{ paddingRight: '20px' }}
                        label='Mint new tokens'
                        name='radioGroup'
                        value='mint'
                        checked={proposalType === 'mint'}
                        onClick={handleRadioButtons}
                    />
                    <Radio 
                        label='Transfer tokens to address'
                        name='radioGroup'
                        value='transfer'
                        checked={proposalType === 'transfer'}
                        onClick={handleRadioButtons}
                    />
                </Form.Field>
                <Form.Field>
                    <Label>Description</Label>
                    <Input
                        value={description}
                        onChange={(event) => { setDescription(event.target.value) }}
                        fluid
                        />
                </Form.Field>
                {!proposalType ? <Label color="red">Choose one of the proposal types</Label> : 
                    <Form.Field>
                        <Label>{proposalType === 'mint' ? "Mint" : "Transfer"}</Label>
                        <Input
                            label="tokens"
                            labelPosition="right"
                            value={tokenAmount}
                            onChange={(event) => { setTokenAmount(event.target.value) }}
                            fluid
                        />
                    </Form.Field>}
                {proposalType === 'transfer' ? 
                    <Form.Field>
                        <Label>to</Label>
                        <Input
                            label="address"
                            labelPosition="right"
                            value={transferAddress}
                            onChange={(event) => { setTransferAddress(event.target.value) }}
                            fluid
                        />
                    </Form.Field> : null}
                <Button disabled={!proposalType} loading={loading}>Create</Button>
                <Message error header="Oops!" content={errorMessage} />
            </Form>
        </Segment> 
    )

}

export default CreateProposal;
