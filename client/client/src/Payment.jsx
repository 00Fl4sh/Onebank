import React, { useState, useEffect } from "react";
import axios from "axios";
import { usePlaidLink } from "react-plaid-link";

const TransferUi = ({ transferLinkTokenData }) => {
  axios.defaults.baseURL = "http://localhost:8000"
  const transferData = async () => {
    open();
  };

  const transferConfig = {
    token: transferLinkTokenData,
    onSuccess: (public_token, metadata) => {
      console.log("publicTokenTransfer", public_token);
      console.log("successTransfer", metadata);
    },
  };
  const { open, ready } = usePlaidLink(transferConfig);

  return (
    <button onClick={transferData} disabled={!ready}>
      Transfer UI
    </button>
  );
};
const Payment = () => {
  const [linkToken, setLinkToken] = useState();
  const [publicToken, setPublicToken] = useState();
  const [transferLinkTokenData, setTransferLinkTokenData] = useState();
  const [username, setUsername] = useState(""); // New state for username
  const [password, setPassword] = useState("");
  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const response = await axios.post("/create_link_token");
        console.log("linkToken", response?.data?.link_token);
        setLinkToken(response?.data?.link_token);
      } catch (error) {
        console.error("Error fetching link token:", error);
      }
    };
    fetchLinkToken();
  }, []);
  const transferHandler = async () => {
    try {
      const accessTokenResponse = await axios.post("/exchange_public_token", {
        publicToken,
      });
      const accessTokenData = accessTokenResponse?.data?.accessToken;
      const item_id = accessTokenResponse?.data?.item_id;
      console.log("item_id", item_id);
      console.log("accessToken", accessTokenData);
      const authResponse = await axios.post("/auth", { accessTokenData });
      const account_id = authResponse?.data?.data?.numbers?.ach[0]?.account_id;
      console.log("authData", authResponse?.data?.data);
      console.log("auth", account_id);
      const intentResponse = await axios.post("/transfer-intent", {
        account_id,
        accessTokenData,
      });
      const intent_id = intentResponse?.data?.data?.transfer_intent?.id;
      console.log("intentResponse", intentResponse?.data);
      console.log("intent_id", intent_id);

      const transferLinkTokenResponse = await axios.post(
        "/transfer-link-token-initial",
        { intent_id, accessTokenData }
      );
      const transferLinkTokenData =
        transferLinkTokenResponse?.data?.data?.link_token;
      setTransferLinkTokenData(transferLinkTokenData);
      console.log("transferLinkToken", transferLinkTokenData);
    } catch (error) {
      console.error("Error during transfer:", error);
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token, metadata) => {
      console.log("publicToken", public_token);
      console.log("success", metadata)
      setPublicToken(public_token);
    },
  });
  const createAccountHandler = async () => {
    try {
      const response = await axios.post("/create", {
        username,
        password,
      });
      console.log("Account created successfully!", response.data);
    } catch (error) {
      console.error("Error creating account:", error);
    }
  };
  return (
    <div>
      <label>
        Username:
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label>
        Password:
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <button onClick={createAccountHandler}>Create Account!</button>
      <button onClick={() => open()} disabled={!ready}>
        Connect Account
      </button>
      <button onClick={transferHandler}>Transfer</button>
      <TransferUi transferLinkTokenData={transferLinkTokenData} />
    </div>
  );
};

export default Payment;