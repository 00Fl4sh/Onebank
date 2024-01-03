  const express = require("express");
  const cors = require("cors");
  const bodyParser = require("body-parser");
  const validator = require("validator");


  const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");

  const configuration = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": "656b485c4e877a001caf091a",
        "PLAID-SECRET": "118e8ef8cf343fd429f5fd72f7d646",
      },
    },
  });

  const plaidClient = new PlaidApi(configuration);

  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());


  app.post("/create", async(req, res, next)=>{
    try {
      const username = validator.escape(req.body.username);
      const userId = uuidv4();
      const result = await db.addUser(userId, username);

      console.log(`User creation result is ${JSON.stringify(result)}`);

      if (result.lastID != null) {
        res.cookie("signedInUser", userId, {
          maxAge: 1000 * 60 * 60 * 24 * 30,
          httpOnly: true, 
          // Consider adding 'secure: true' when using HTTPS
        });

        res.status(201).json({ userId, message: "User created successfully" });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/create_link_token", async function (request, response) {
    // Get the client_user_id by searching for the current user

    const plaidRequest = {
      user: {
        // This should correspond to a unique id for the current user.
        client_user_id: "user",
      },
      client_name: "Plaid Test App",
      products: ["auth"],
      language: "en",
      redirect_uri: "http://localhost:5173/",
      country_codes: ["US"],
      link_customization_name: "payment_ui",
    };
    try {
      const createTokenResponse = await plaidClient.linkTokenCreate(plaidRequest);
      response.json(createTokenResponse.data);
    } catch (error) {
      // handle error
    }
  });

  app.post("/sync", async (req, res, next) => {
    try {
      const userId = getLoggedInUserId(req);
      const items = await db.getItemIdsForUser(userId);
      const fullResults = await Promise.all(
        items.map(async (item) => {
          return await syncTransactions(item.id);
        })
      );
      res.json({ completeResults: fullResults });
    } catch (error) {
      console.error("Error during synchronization:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/exchange_public_token", async function (request, response, next) {
    const publicToken = request.body.publicToken;
    try {
      const plaidResponse = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
      });

      // These values should be saved to a persistent database and
      // associated with the currently signed-in user
      console.log("plaidResponse", plaidResponse.data.item_id);
      const accessToken = plaidResponse.data.access_token;
      const item_id = plaidResponse.data.item_id;

      response.json({ accessToken, item_id });
    } catch (error) {
      // handle error
    }
  });

  app.post("/auth", async function (request, response) {
    try {
      const access_token = request.body.accessTokenData;
      const plaidRequest = {
        access_token,
      };
      const plaidResponse = await plaidClient.authGet(plaidRequest);
      response.status(200).json({ data: plaidResponse.data });
    } catch (e) {
      response.status(500).send("failed");
    }
  });

  /*

    app.post('/transactions-data', async function(request, response) {
      const transactionRequest = {
      access_token: request.body.accessTokenData,
            start_date: '2018-01-01',
          end_date: '2020-02-01'
        }
      try {
        const transactionResponse = await plaidClient.transactionsGet(transactionRequest);
          console.log("response",transactionResponse.data);
            let transactions = transactionResponse.data.transactions;
          console.log("transactions",transactions);
          let accounts = transactionResponse.data.accounts;
            console.log("accounts",accounts);
            const total_transactions = transactionResponse.data.total_transactions;
            console.log("total_transactions",total_transactions);
            response.status(200).json({data: transactions})
          } catch{(err) => {
            console.log(err);
            response.status(500).json({message : "Failure", err})
          }}
        })

    
  app.get("/recipient-create", async function(request, response){
    // Using BACS, without IBAN or address
  const recipientRequest = {
    name: 'John Doe',
    bacs: {
      account: '26207729',
      sort_code: '560029',
    },
  };
  try {
    const recipientResponse = await plaidClient.paymentInitiationRecipientCreate(recipientRequest);
    console.log("paymentResponse",recipientResponse.data);
    const recipientID = recipientResponse.data.recipient_id;
    const requestId = recipientResponse.data.request_id
      console.log("recipientID",recipientID);
      console.log("requestId",requestId);
    response.status(200).json({data:recipientID })
  } catch (error) {
    console.log(error);
    response.status(500).json({message: "Failure"})
  }
  })

  app.post("/payment-create", async function(request,response){
      const paymentRequest = {
      recipient_id: request.body.recipentId,
      reference: 'TestPayment',
      amount: {
          currency: 'GBP',
          value: 100.0,
        },
      };  
    try {
    const paymentResponse = await plaidClient.paymentInitiationPaymentCreate(paymentRequest);
    console.log("paymentResponse",paymentResponse.data);
    const paymentID = paymentResponse.data.payment_id;
    console.log("paymentID",paymentID);
    const status = paymentResponse.data.status;
    console.log("status",status);
    response.status(200).json({paymentID})
    } catch (error) {
      console.log(error);
      response.status(500).json({message:"Failure"})
    }
  })

  app.post("/payment-get", async function(request, response){
    const getPaymentRequest = {
      payment_id: request.body.paymentId,
    };
    try {
      const getPaymentResponse = await plaidClient.paymentInitiationPaymentGet(getPaymentRequest);
      console.log("getPaymentResponse",getPaymentResponse.data);
      const paymentToken = getPaymentResponse.data.payment_token;
      const paymentTokenExpirationTime = getPaymentResponse.data.payment_token_expiration_time;
      response.status(200).json({data : getPaymentResponse.data})
    } catch (error) {
      console.log(error);
    response.status(500).json({message: "failure"})
    }
  })
  */

  // payment_ui = new customize ui for transfer
  app.post("/transfer-intent", async function (request, response) {
    const intentRequest = {
      mode: "PAYMENT",
      amount: "12.34", //id
      description: "payment",
      ach_class: "ppd",
      user: {
        legal_name: "Leslie Knope",
      },
      account_id: request.body.account_id,
    };
    try {
      const intentResponse = await plaidClient.transferIntentCreate(
        intentRequest
      );
      console.log("intentResponse", intentResponse.data);
      response.json({ data: intentResponse.data });
    } catch (error) {
      console.log(error);
      response.status(500).json({ message: "failure" });
    }
  });

  app.post("/transfer-link-token-initial", async function (request, response) {
    const linkTokenParams = {
      user: {
        client_user_id: "user",
      },
      client_name: "Plaid Test App",
      products: ["transfer"],
      language: "en",
      country_codes: ["US"],
      transfer: {
        intent_id: request.body.intent_id,
      },
      access_token: request.body.accessTokenData,
      link_customization_name: "payment_ui",
    };
    try {
      const linkTokenResponse = await plaidClient.linkTokenCreate(
        linkTokenParams
      );
      console.log("linkTokenResponse", linkTokenResponse.data);
      response.json({ data: linkTokenResponse.data });
    } catch (error) {
      console.log(error);
      response.json({ message: error.message });
    }
  });
  /*
  app.post("/intent-get", async function(request, response){  
    const intentGetRequest = {
      transfer_intent_id: request.body.intent_id,
    };
    
    try {
      const intentGetResponse = await plaidClient.transferIntentGet(intentGetRequest);
      const intentGet = intentGetResponse.data
      response.json({intentGet})
    } catch (error) {
    response.json({message : error.message})
    }
  })

  app.post("/authorization-create", async function(request,response){
  const authorizeRequest = {
    access_token: request.body.accessTokenData,
    account_id: request.body.account_id, 
      type: 'debit',
    network: 'ach',
      amount: '12.34',
      ach_class: 'ppd',
    user: {
      legal_name: 'Leslie Knope',
      },
    };
    try {
    const authorizeResponse = await plaidClient.transferAuthorizationCreate(authorizeRequest);
      console.log("authorizeResponse",authorizeResponse.data);
      const authorizationId = authorizeResponse.data.authorization.id;
      console.log("authorizationId",authorizationId);
      response.json({authorizationId})
    } catch (error) {
      response.json({message: error})
    }
  })

  app.post("/trasfer-create", async function(request,response){
    const transferRequest = {
      amount: '12.34',
      description: 'payment',
      access_token: request.body.accessTokenData,
      account_id: request.body.account_id,
      authorization_id: request.body.authorizationId,
    };
    try {
      const transferResponse = await plaidClient.transferCreate(transferRequest);
      const transfer = transferResponse.data.transfer;
      console.log("transfer", transfer);
      response.json({transfer})
    } catch (error) {
      response.json({message: error.message})
    }
  })
    
  */

  app.listen(8000, () => {
    console.log("server started");
  });
