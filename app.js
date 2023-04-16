const express = require("./node_modules/express");
const path = require("path");
const { open } = require("./node_modules/sqlite");
const sqlite3 = require("./node_modules/sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let dataBase = null;

initializeDBAndServer = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// GET THE ALL PLAYERS

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT 
        player_id AS playerId,
        player_name AS playerName
    FROM 
        player_details;
    `;
  const playersArray = await dataBase.all(getPlayersQuery);
  response.send(playersArray);
});

// GET A SPECIFIC PLAYER

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
        player_id AS playerId,
        player_name AS playerName
    FROM 
        player_details
    WHERE 
        player_id = ${playerId};
    `;
  const player = await dataBase.get(getPlayerQuery);
  response.send(player);
});

// GET A SPECIFIC MATCH

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
        match_id AS matchId,
        match,
        year
    FROM 
        match_details
    WHERE 
        match_id = ${matchId};

    `;
  const match = await dataBase.get(getMatchQuery);
  response.send(match);
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT 
        match_id AS matchId,
        match,
        year
    FROM 
        match_details
    NATURAL JOIN player_match_score
    WHERE 
        player_id = ${playerId};
    `;
  const playerMatches = await dataBase.all(getPlayerMatchesQuery);
  response.send(playerMatches);
});

// GET PLAYERS OF A MATCH

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfMatchQuery = `
    SELECT 
        player_id AS playerId,
        player_name AS playerName
    FROM 
        player_details
        NATURAL JOIN 
            player_match_score
    WHERE 
        match_id = ${matchId};
    `;
  const PlayerOfMatch = await dataBase.all(getPlayersOfMatchQuery);
  response.send(PlayerOfMatch);
});

// GET TOTAL SCORE, FOURS, SIXES OF A PLAYER

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getScoresQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const playerScores = await dataBase.all(getScoresQuery);
  response.send(playerScores[0]);
});

// UPDATE A PLAYER

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const updatePlayerQuery = `
    UPDATE 
        player_details
    SET 
        player_name = '${playerName}'
    WHERE
        player_id = ${playerId};
    `;
  await dataBase.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// EXPORTING THE INSTANCE

module.exports = app;
