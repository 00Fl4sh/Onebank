import React from 'react'
import axios from 'axios';
import { useEffect } from 'react'
import { usePlaidLink } from 'react-plaid-link';
import { useState } from 'react';

const PlaidAuth = ({publicToken}) => {

  const [account, setAccount] = useState()

  useEffect(() => {
    const fetchData = async() => {
      let accessToken = await axios.post("/exchange_public_token", {publicToken}, { 
        headers: {
          'Content-Type': 'application/json'
        }})
      var accessTokenData = accessToken.data.accessToken 
        console.log("accessToken",accessTokenData);                                                                                                                          

      const auth = await axios.post('/auth', {accessTokenData} , { 
        headers: {
          'Content-Type': 'application/json'
        }})
      console.log("authData",auth.data.data);
      console.log("auth",auth.data.data.numbers.ach[0]);
      setAccount(auth.data.data.numbers.ach[0])
    
     /* let transactionData = await axios.post('/transactions-data', {accessTokenData}, {
        headers: {
          'Content-Type': 'application/json'
        }}) 
      console.log("transactionData",transactionData);

      const recipientData = await axios.get("/recipient-create",{
        headers: {
          'Content-Type': 'application/json'
        }})
        const recipentId = recipientData?.data?.data
        console.log("recipientData",recipentId);

      const paymentData = await axios.post("/payment-create", {recipentId}, {
        headers: {
          'Content-Type': 'application/json'
        }})
        const paymentId = paymentData?.data?.paymentID
        console.log("paymentData",paymentId);

      const getPayment = await axios.post("/payment-get", {paymentId}, {
        headers: {
          'Content-Type': 'application/json'
        }})
        console.log("getPayment",getPayment?.data);

        const intentResponse = await axios.get("/transfer-intent",{
          headers: {
            'Content-Type': 'application/json'
          }})
          const intent_id = intentResponse.data.data.transfer_intent.id
          console.log("intentResponse",intentResponse?.data);
          console.log("intentResponse",intent_id);

          
         
          const transferLinkToken = await axios.post("/transfer-link-token-initial", { intent_id }, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        const transferLinkTokenData = transferLinkToken.data
        console.log("transferLinkToken", transferLinkTokenData)*/

        const authorizationId = await axios.post("/authorization-create",{accessTokenData},{
          headers: {
            'Content-Type': 'application/json'
          }})
          const authorization_id = authorizationId.data.authorizationId
          console.log("authorizationId",authorization_id);

        /*const balance = await axios.get("/balance-get")
        console.log("balance",balance);*/
        
      }
    fetchData()
  },[publicToken])  

  return account && (
    <p>Account Number : {account.account} </p>
  )
}

const App = () => {

  const [linkToken, setLinkToken] = useState()
  const [publicToken, setPublicToken] = useState()

  axios.defaults.baseURL = "http://localhost:8000"

  useEffect(() => {
    const fetch = async() => {
      const response = await axios.post("/create_link_token", { 
      headers: {
        'Content-Type': 'application/json'  
      }})
      console.log("linkToken",response.data.link_token);
      setLinkToken(response.data.link_token)
    }
    fetch()
  },[])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token, metadata) => {
      const account_ids = metadata.accounts.map(account => account.id)
      console.log("account_ids",account_ids);

      console.log("publicToken",public_token);
      console.log("success",metadata);
      setPublicToken(public_token)
    },
  });
  
  return publicToken ? (<PlaidAuth publicToken={publicToken} />) : (
    <button onClick={() => open()} disabled={!ready}>
      Connect a bank account
    </button>
  );
}

export default App