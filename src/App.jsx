import { useEffect, useMemo, useState } from "react";

import { ethers } from "ethers";

import { useWeb3 } from "@3rdweb/hooks";
import { ThirdwebSDK } from "@3rdweb/sdk";

import { UnsupportedChainIdError } from "@web3-react/core";

import { Container, Grid, Button } from 'semantic-ui-react';
import Proposal from "./components/Proposal";
import MemberList from "./components/MemberList";
import CreateProposal from "./components/CreateProposal";

// We instantiate the sdk on Rinkeby.
const sdk = new ThirdwebSDK("rinkeby");

// We can grab a reference to our ERC-1155 contract.
const bundleDropModule = sdk.getBundleDropModule(
  "0x00F4D9c7d441C3DCAa39FFdF869cAb8e980d744E",
);

const tokenModule = sdk.getTokenModule(
  "0xBa0d7d11Bb4de1D8bE234f10861E4728c9472F7D"
);

const voteModule = sdk.getVoteModule(
  "0x3fc00737D5D5DB952efb85e324A3F35FB59DC792",
);

const App = () => {
  const { connectWallet, address, error, provider } = useWeb3();
  console.log("👋 Address:", address)

  // The signer is required to sign transactions on the blockchain.
  // Without it we can only read data, not write.
  const signer = provider ? provider.getSigner() : undefined;

  const [hasClaimedNFT, setHasClaimedNFT] = useState(false);  // State variable for us to know if user has our NFT.
  const [isClaiming, setIsClaiming] = useState(false);        // isClaiming lets us easily keep a loading state while the NFT is minting.  
  const [memberTokenAmounts, setMemberTokenAmounts] = useState({}); // Holds the amount of token each member has in state.
  const [memberAddresses, setMemberAddresses] = useState([]); // The array holding all of our members addresses.
  const [proposals, setProposals] = useState([]);

  // Retrieve all our existing proposals from the contract.
  useEffect(() => {
    const getProposals = async () => {
      if (!hasClaimedNFT) {
        return;
      }
      
      try {
        // A simple call to voteModule.getAll() to grab the proposals.
        let proposals = await voteModule.getAll()             // this is a different object than that of 'useState'
        setProposals(proposals)
        console.log("🌈 Proposals:", proposals)
      } catch (err) {
        console.error("failed to get proposals", err);
      }
    }
    getProposals();
  }, [hasClaimedNFT]);

  // A fancy function to shorten someones wallet address, no need to show the whole thing. 
  const shortenAddress = (str) => {
    return str.substring(0, 6) + "..." + str.substring(str.length - 4);
  };

  // This useEffect grabs all the addresses of our members holding our NFT.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }
    
    // Just like we did in the 7-airdrop-token.js file! Grab the users who hold our NFT
    // with tokenId 0.
    bundleDropModule
      .getAllClaimerAddresses("0")
      .then((addresses) => {
        console.log("🚀 Members addresses", addresses)
        setMemberAddresses(addresses);
      })
      .catch((err) => {
        console.error("failed to get member list", err);
      });
  }, [hasClaimedNFT]);

  // This useEffect grabs the # of token each member holds.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // Grab all the balances.
    tokenModule
      .getAllHolderBalances()
      .then((amounts) => {
        console.log("👜 Amounts", amounts)
        setMemberTokenAmounts(amounts);
      })
      .catch((err) => {
        console.error("failed to get token amounts", err);
      });
  }, [hasClaimedNFT]);

  // Now, we combine the memberAddresses and memberTokenAmounts into a single array
  const memberList = useMemo(() => {
    return memberAddresses.map((address) => {
      return {
        address,
        tokenAmount: ethers.utils.formatUnits(
          // If the address isn't in memberTokenAmounts, it means they don't hold any of our token.
          memberTokenAmounts[address] || 0,
          18,
        ),
      };
    });
  }, [memberAddresses, memberTokenAmounts]);

  // Another useEffect!
  useEffect(() => {
    // We pass the signer to the sdk, which enables us to interact with our deployed contract!
    sdk.setProviderOrSigner(signer);
  }, [signer]);

  useEffect(() => {
    async function fetchNFT() {
    // If they don't have an connected wallet, exit!
    if (!address) {
      return;
    }
    
    // Check if the user has the NFT by using bundleDropModule.balanceOf
    try {
      let balance = await bundleDropModule.balanceOf(address, "0")
      if (balance.gt(0)) {
        setHasClaimedNFT(true);
        console.log("🌟 this user has a membership NFT!")
      } else {
        setHasClaimedNFT(false);
        console.log("😭 this user doesn't have a membership NFT.")
      }
    } catch (error) {
      setHasClaimedNFT(false);
      console.error("failed to nft balance", error);
    }
  }
  fetchNFT();
  }, [address]);

  if (error instanceof UnsupportedChainIdError ) {
    return (
      <Container style={{background: 'green', width: '100vh'}} className="unsupported-network">
        <h2>Please connect to Rinkeby</h2>
        <p>
          This dapp only works on the Rinkeby network, please switch networks
          in your connected wallet.
        </p>
      </Container>
    );
  }

  // This is the case where the user hasn't connected their wallet
  // to your web app. Let them call connectWallet.
  if (!address) {
    return (
      <Container style={{background: 'green', width: '100vw', height: '100vh'}} className="landing">
        <h1>Welcome to FOMODAO</h1>
        <Button onClick={() => connectWallet("injected")} primary>
          Connect your wallet
        </Button>
      </Container>
    );
  }

  // If the user has already claimed their NFT we want to display the interal DAO page to them
  // only DAO members will see this. Render all the members + token amounts.
  if (hasClaimedNFT) {
    return (
      <Container style={{background: 'green', width: '100vw', height: '100%'}}>
        <div style={{textAlign: "center", paddingBottom: '20px'}}>
          <h1>FOMODAO Member Page</h1>
          <p>Congratulations on being a member</p>
        </div>
        <Grid columns={2} divided textAlign='center' centered>
          <Grid.Row>
            <Grid.Column style={{width: '40vw'}}>
              <Grid.Row style={{paddingBottom: '20px'}}>
                <MemberList shortenAddress={shortenAddress} memberList={memberList} className="card"/>
              </Grid.Row>
              <Grid.Row style={{paddingBottom: '20px'}} >
                <CreateProposal voteModule={voteModule} tokenModule={tokenModule} />
              </Grid.Row>
              <Grid.Row style={{paddingBottom: '20px'}}>
                <h2>Airdrop tokens to NFT holders</h2>
              </Grid.Row>
            </Grid.Column>
            <Grid.Column style={{width: '40vw'}}>
              <h2>Active Proposals</h2>
              {proposals.map((proposal, index) => <Proposal
                key={index}
                index={index}
                address={address}
                proposal={proposal}
                hasClaimedNFT={hasClaimedNFT}
                tokenModule={tokenModule}
                voteModule={voteModule}
              />)}
              <small>Interacting with any of the proposals will trigger multiple transactions that you will need to sign.</small>
            </Grid.Column>
          </Grid.Row>          
        </Grid>
      </Container>
    );
  };

  const mintNft = () => {
    setIsClaiming(true);
    // Call bundleDropModule.claim("0", 1) to mint nft to user's wallet.
    bundleDropModule.claim("0", 1)
      .then(() => {
        // Set claim state.
        setHasClaimedNFT(true);
        // Show user their fancy new NFT!
        console.log(
          `🌊 Successfully Minted! Check it our on OpenSea: https://testnets.opensea.io/assets/${bundleDropModule.address}/0`
        );
      })
      .catch((err) => {
        console.error("failed to claim", err);
      })
      .finally(() => {
        // Stop loading state.
        setIsClaiming(false);
      });
  }
  
  // Render mint nft screen.
  return (
    <Container style={{background: 'green', width: '100vw', height: '100vh'}} className="mint-nft">
      <h1>Mint your free FOMODAO Membership NFT</h1>
      <Button
        primary
        disabled={isClaiming}
        onClick={() => mintNft()}
      >
        {isClaiming ? "Minting..." : "Mint your nft (FREE)"}
      </Button>
    </Container>
  );
};

export default App;