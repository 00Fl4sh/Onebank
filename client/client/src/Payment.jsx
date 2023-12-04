import React, { useState } from 'react'
import axios from 'axios';
import { usePlaidLink } from 'react-plaid-link';
import { useEffect } from 'react';

const TransferUi = ({transferLinkTokenData}) => {

    axios.defaults.baseURL = "http://localhost:8000"

    const transferData = async() => {
        open()  
    }

    const transferConfig = {
        token: transferLinkTokenData,
        onSuccess: (public_token, metadata) => {
          console.log("publicTokenTransfer", public_token);
          console.log("successTransfer", metadata);

        }
      };
      const { open,ready } = usePlaidLink(transferConfig);

    return (
        <button onClick={transferData} disabled= {!ready}>Transfer UI</button>
    )
}

const Payment = () => {

    const [linkToken, setLinkToken] = useState()
    const [publicToken, setPublicToken] = useState()
    const [transferLinkTokenData, setTransferLinkTokenData] = useState()

    axios.defaults.baseURL = "http://localhost:8000"

    const transferHandler = async () => {

        let accessToken = await axios.post("/exchange_public_token", {publicToken}, { 
            headers: {
              'Content-Type': 'application/json'
            }})
          var accessTokenData = accessToken?.data?.accessToken 
          const item_id = accessToken?.data?.item_id
          console.log("item_id",item_id);
          console.log("accessToken",accessTokenData);   

        const auth = await axios.post('/auth', {accessTokenData} , { 
            headers: {
                'Content-Type': 'application/json',
            }})
            const account_id = auth?.data?.data?.numbers?.ach[0]?.account_id
            console.log("authData",auth?.data?.data);
            console.log("auth",auth?.data?.data?.numbers?.ach[0]?.account_id);
            
        const intentResponse = await axios.post("/transfer-intent", {account_id, accessTokenData}, {
            headers: {
                'Content-Type': 'application/json'
            }})
        const intent_id = intentResponse?.data?.data?.transfer_intent?.id
        console.log("intentResponse", intentResponse?.data);
        console.log("intentResponse", intent_id);

        const transferLinkToken = await axios.post("/transfer-link-token-initial", { intent_id, accessTokenData }, {
            headers: {
                'Content-Type': 'application/json'
            }})
        const transferLinkTokenData = transferLinkToken?.data?.data?.link_token
        setTransferLinkTokenData(transferLinkTokenData)
        console.log("transferLinkToken", transferLinkTokenData)
    }
    
    useEffect(() => {
        const fetch = async() => {
            const response = await axios.post("/create_link_token", { 
            headers: {
              'Content-Type': 'application/json'  
            }})
            console.log("linkToken",response?.data?.link_token);
            setLinkToken(response?.data?.link_token)
          }
          fetch()
    },[])


    const { open,ready } = usePlaidLink({
        token: linkToken,
        onSuccess: (public_token, metadata) => {
            console.log("publicToken",public_token);
            console.log("success",metadata);
          
          setPublicToken(public_token)
        }});

    return (
        <div>
            <button onClick={() => open()} disabled= {!ready}>connect Account</button>
            <button onClick={transferHandler}>
                Transfer
            </button>
            <TransferUi transferLinkTokenData={transferLinkTokenData} />
        </div>

    );
}

export default Payment 