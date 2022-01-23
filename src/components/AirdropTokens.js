import { Segment, Button, Label, Message } from 'semantic-ui-react';
import { ethers } from "ethers";

import { useState } from "react";

const AirdropTokens = ({ tokenModule, bundleDropModule }) => {
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const initiateAirdrop = async () => {
        setLoading(true);
        setErrorMessage("");
        try {
            const walletAddresses = await bundleDropModule.getAllClaimerAddresses("0");
            console.log(walletAddresses);
            // Loop through the array of addresses.
            const airdropTargets = walletAddresses.map((address) => {
                // Pick a random # between 1000 and 10000.
                const randomAmount = Math.floor(Math.random() * (10000 - 1000 + 1) + 1000);
                console.log("✅ Going to airdrop", randomAmount, "tokens to", address);

                // Set up the target.
                const airdropTarget = {
                    address,
                    // Remember, we need 18 decimal placees!
                    amount: ethers.utils.parseUnits(randomAmount.toString(), 18),
                };
                return airdropTarget;
            });
            
            // Call transferBatch on all our airdrop targets.
            console.log("🌈 Starting airdrop...")
            await tokenModule.transferBatch(airdropTargets);
            console.log("✅ Successfully airdropped tokens to all the holders of the NFT!");
        } catch (err) {
            setErrorMessage(err)
            console.error("Failed to airdrop tokens", err);
        }
        setLoading(false);
    }

    return (
        <Segment inverted>
            <h2>Airdrop tokens to NFT holders</h2>
            <Button onClick={initiateAirdrop} loading={loading}>Initiate Airdrop!</Button>
            <Label basic pointing='left'>Just press the button and accept the transaction!</Label>
            {!errorMessage ? null : <Message color='red' header="Oops!" content={errorMessage} />}
        </Segment>
    )
}

export default AirdropTokens;
