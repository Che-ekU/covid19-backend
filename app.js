const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

let stateResponseObj = (dbObj) => {
  return {
    stateId: dbObj.state_id,
    stateName: dbObj.state_name,
    population: dbObj.population,
  };
};

let districtResponseObj = (dbObj) => {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  };
};

app.get("/states/", async (request, response) => {
  let statelist = `
    SELECT
    *
    FROM
    state;`;
  let stateArray = await database.all(statelist);
  response.send(stateArray.map((eachState) => stateResponseObj(eachState)));
});

app.get("/states/:stateId/", async (request, response) => {
  let { stateId } = request.params;
  let state = `
    SELECT
    *
    FROM
    state
    WHERE
    state_id = ${stateId};`;
  let stateName = await database.get(state);
  response.send(stateResponseObj(stateName));
});

app.post("/districts/", async (request, response) => {
  let { stateId, districtName, cases, cured, active, deaths } = request.body;
  let addDistrict = `
    INSERT INTO
    district(state_id, district_name, cases, cured, active, deaths)
    VALUES
    ('${stateId}', ${districtName}, ${cases}, ${cured}, ${active}, ${deaths});`;
  await database.run(addDistrict);
  response.send("District Successfully Added");
});
