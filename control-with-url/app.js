const axios = require('axios');
const express = require('express');
const https = require('https');

const app = express();
const port = 8088;

// Update API token here
const IMPLY_API_TOKEN = "30b2cf42-acc7-436e-b0e6-613a9504164e";
const PIVOT_BASE_URI = "https://pivot.internal.thing-it.com:9095";

app.use(express.static('public'));
app.use(express.json());

// Get url for dataCube view
app.post("/mkurl-dataCube", async function (req, res) {

  //Add user selected dimension to splits
  let splits =[];
  if(req.body.dimension) {
    splits = [{
      dimension: (String(req.body.dimension).toLocaleLowerCase()),
      sortType: "measure",
      direction: "descending"
    }];
  }

  const essence = {
    "dataCube": "c1b0",
    "filter": {
      "clauses": [
        {
          "dimension": "__time",
          "dynamic": {
            "op": "timeRange",
            "operand": {
              "op": "ref",
              "name": "m"
            },
            "duration": "P3M",
            "step": -1
          }
        }
      ]
    },
    "timezone": "Etc/UTC",
    "splits": splits,
    "pinnedDimensions": [],
    "selectedMeasures": ["count"],
    "settingsVersion": null,
    "visualization": req.body.dimension ? "table": "totals"
  };

  //Use user input to add a page filter
  if(req.body.filterValue){
    essence.filter.clauses.push({
      "dimension": "page",
      "action": "overlap",
      "exclude": false,
      "values": {
        "elements": [String(req.body.filterValue)]//User Inputs updates filter
      },
      "setType": "STRING",
    });
  }

  // Send request to imply-ui api endpoint
  let response;
  try{
    response = await axios({
      url: `${PIVOT_BASE_URI}/api/v1/mkurl`,
      method: 'post',
      headers: {
        "x-imply-api-token": IMPLY_API_TOKEN
      },
      data: {
        domain: `${PIVOT_BASE_URI}`,
        essence: essence
      },
      httpsAgent: new https.Agent({rejectUnauthorized: false}), // accept self-signed TLS cert
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      error: 'could not make url'
    });
    return
  }

  // Update and send URL
  let url = response.data.url;
  if (url) {
    res.send({
      url: url
    });
  } else {
    // If no URL return error
    res.status(500).send({
      error: 'could not make url'
    });
  }
});

// Get url for dashboard view
app.post("/mkurl-dashboard", async function (req, res) {
  // Set request essence
  const essence = {
    "dashboard": "9dd9",
    "filter": {
      "clauses": [
        {
          "dimension": "page",
          "action": "overlap",
          "exclude": false,
          "values": {
            "elements": [String(req.body.filterValue)]//User Inputs updates filter
          },
          "setType": "STRING",
        }
      ]
    },
    "timezone": "Etc/UTC",
    "selectedMeasures": [],
    "selectedPage": "page"
  };

  //Send request to imply-ui api endpoint
  let response;
  try {
    response = await axios({
      url: `${PIVOT_BASE_URI}/api/v1/mkurl`,
      method: 'post',
      headers: {
        "x-imply-api-token": IMPLY_API_TOKEN
      },
      data: {
        domain: `${PIVOT_BASE_URI}`,
        essence: essence
      },
      httpsAgent: new https.Agent({rejectUnauthorized: false}), // accept self-signed TLS cert
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      error: 'could not make url'
    });
    return
  }


  // Update and send URL
  let url = response.data.url;
  if (url) {
    res.send({
      url: url
    });
  } else {
    // If no URL return error
    res.status(500).send({
      error: 'could not make url'
    });
  }
});

app.listen(port, () => {
  console.log(`control-with-url example listening on port ${port}!`);
});
