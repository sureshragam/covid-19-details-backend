const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
const dbPath = path.join(__dirname, "covid19India.db");
app.use(express.json());
let db = null;

// get /states/ api

app.get("/states/", async (request, response) => {
  try {
    const getStatesQuery = `
        SELECT *
        FROM state
        ORDER BY state_id;
        `;
    const statesList = await db.all(getStatesQuery);
    let modifiedStatesList = [];
    for (let obj of statesList) {
      modifiedStatesList.push(convertSnakeCaseToCamelCaseForState(obj));
    }

    response.send(modifiedStatesList);
  } catch (e) {
    console.log(e.message);
  }
});

// get /states/:stateId/ api

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  try {
    const singleStateQuery = `
        SELECT *
        FROM state
        WHERE state_id = ${stateId};
        `;
    const singleStateDetails = await db.get(singleStateQuery);
    response.send(convertSnakeCaseToCamelCaseForState(singleStateDetails));
  } catch (e) {
    console.log(e.message);
  }
});

// post /districts/

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  try {
    const addDistrictQuery = `
        INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
        VALUES(
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
        )
        `;
    await db.run(addDistrictQuery);
    response.send("District Successfully Added");
  } catch (e) {
    console.log(e.message);
  }
});

// /districts/:districtId api

app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  try {
    const singleDistrictQuery = `
        SELECT *
        FROM district
        WHERE district_id = ${districtId};
        `;
    const singleDistrictDetails = await db.get(singleDistrictQuery);
    response.send(
      convertSnakeCaseToCamelCaseForDistrict(singleDistrictDetails)
    );
  } catch (e) {
    console.log(e.message);
  }
});

// delete /districts/:districtId/ api

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  try {
    const deleteDistrictQuery = `
        DELETE 
        FROM district
        WHERE district_id = ${districtId};
        `;
    await db.run(deleteDistrictQuery);
    response.send("District Removed");
  } catch (e) {
    console.log(e.message);
  }
});

// put /districts/:districtId/

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  try {
    const updateDistrictQuery = `
        UPDATE district
        SET
            district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
        WHERE district_id = ${districtId};
        `;
    await db.run(updateDistrictQuery);
    response.send("District Details Updated");
  } catch (e) {
    console.log(e.message);
  }
});

// get /states/:stateId/stats/

app.get("/states/:stateId/stats", async (request, response) => {
  const { stateId } = request.params;
  try {
    const statesStatsQuery = `
        SELECT SUM(cases) AS totalCases,
        SUM(cured)AS totalCured,
        SUM(active) AS totalActive,
        SUM(deaths) AS totalDeaths 
        FROM district
        WHERE state_id = ${stateId};
        `;
    const stateStatsDetails = await db.get(statesStatsQuery);
    response.send(stateStatsDetails);
  } catch (e) {
    console.log(e.message);
  }
});

// get /districts/:districtId/details/ api

app.get("/districts/:districtId/details", async (request, response) => {
  const { districtId } = request.params;
  try {
    const districtDetailQuery = `
        SELECT state_name AS stateName
        FROM district
        NATURAL JOIN state
        WHERE district_id = ${districtId};
        `;
    const districtDetailResponse = await db.get(districtDetailQuery);
    response.send(districtDetailResponse);
  } catch (e) {
    console.log(e.message);
  }
});

// initalizing Server and Connecting Database

const initializeServerAndConnectDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("server connected at http://localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeServerAndConnectDatabase();

function convertSnakeCaseToCamelCaseForState(obj) {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
}

function convertSnakeCaseToCamelCaseForDistrict(obj) {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
}

module.exports = app;
