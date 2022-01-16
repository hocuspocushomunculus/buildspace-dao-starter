import sdk from "./1-initialize-sdk.js";
import { readFileSync } from "fs";

const bundleDrop = sdk.getBundleDropModule(
  "0x00F4D9c7d441C3DCAa39FFdF869cAb8e980d744E",
);

(async () => {
  try {
    await bundleDrop.createBatch([
      {
        name: "How you'll feel if you miss FOMODAO",
        description: "This NFT will give you access to FOMODAO!",
        image: readFileSync("scripts/assets/shocked.png"),
      },
    ]);
    console.log("✅ Successfully created a new NFT in the drop!");
  } catch (error) {
    console.error("failed to create the new NFT", error);
  }
})()