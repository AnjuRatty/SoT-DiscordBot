const fs = require('fs');
const { Client, Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const clientId = '';
const guildId = '';
const token = '';

let scores = {};
let abyssSettings = {
  Floor9_1: 2,
  Floor10_1: 2,
  Floor11_1: 2,
  Floor12_1: 2,
  Floor9_2: 2,
  Floor10_2: 2,
  Floor11_2: 2,
  Floor12_2: 2,
};

var teamAetherChannel = null;
var teamLumineChannel = null;

// Load scores data from file on bot startup
fs.readFile('./scores.json', (err, data) => {
  if (!err) {
    scores = JSON.parse(data);
    console.log('Scores data loaded successfully!');
  } else {
    console.error('Error loading scores data:', err);
  }
});



function logScoreSubmission(user, playerName, team, activity, score) {
  const logEntry = `Submitted by: ${user.username}#${user.discriminator}\nPlayer: ${playerName}\nTeam: ${team}\nActivity: ${activity}\nScore: ${score}\n\n`;

  // Append the log entry to a file
  fs.appendFile('./scorelog.txt', logEntry, (err) => {
    if (err) {
      console.error('Error logging score submission:', err);
    } else {
      console.log('Score submission logged successfully!');
    }
  });

  // Send a message in a specific channel
  const channel = client.channels.cache.get('1090908040263372801');
  const channel2 = client.channels.cache.get('1085590223787937952');
  if (channel) {
    channel.send(`New score submission:\n${logEntry}`);
  }
  if (channel2) {
    channel2.send(`New score submission:\n${logEntry}`);
  }
}

function calculateTeamTotalAbyssScore(team) {
  let totalAbyssScore = 0;

  for (const playerName in scores) {
    if (scores[playerName][team] && scores[playerName][team].abyss) {
      const playerAbyssScores = scores[playerName][team].abyss;
      for (const floor in playerAbyssScores) {
        console.log(floor + playerAbyssScores[floor]);
        totalAbyssScore += playerAbyssScores[floor] || 0;
      }
    }
  }
  totalAbyssScore = totalAbyssScore / 2;
  return totalAbyssScore;
}

function calculateTeamTotals() {
  let teamTotals = {};

  for (const playerName in scores) {
    for (const team in scores[playerName]) {
      if (!teamTotals.hasOwnProperty(team)) {
        teamTotals[team] = {
          total: 0,
          abyss: 0, // Add additional properties for each scoring activity
          photoHunt: 0,
          additional: 0,
        };
      }

      const playerScores = scores[playerName][team];
      const playerTotalScore = playerScores.total || 0;
      const playerAbyssScore = playerScores.abyss || 0;
      const playerPhotoHuntScore = playerScores.photoHunt || 0;
      const playerAdditionalScore = playerScores.additional || 0;

      teamTotals[team].total += playerTotalScore;
      teamTotals[team].abyss += playerAbyssScore;
      teamTotals[team].photoHunt += playerPhotoHuntScore;
      teamTotals[team].additional += playerAdditionalScore;
    }
  }

  return teamTotals;
}



// Function to update the channel name with the team score
function updateChannelName(channel, teamName, teamScore) {
  channel.setName(`${teamName} - Score: ${teamScore}`)
    .catch(console.error);
}

// Update the channel names with the team scores
function updateChannelNames(teamTotals) {
  for (const team in teamTotals) {
    const totalScore = teamTotals[team].total;

    if (team === 'TeamAether') {
      updateChannelName(teamAetherChannel, team, totalScore);
    } else if (team === 'TeamLumine') {
      updateChannelName(teamLumineChannel, team, totalScore);
    }
  }
}

// Function to save scores data to file
function saveScoresData() {
  fs.writeFile('./scores.json', JSON.stringify(scores, null, 2), (err) => {
    if (err) {
      console.error('Error saving scores data:', err);
    } else {
      console.log('Scores data saved successfully!');
    }
  });
  let teamTotal = calculateTeamTotals();
  updateChannelNames(teamTotal);
}

const commands = [
  {
    name: 'submit-abyss',
    description: 'Submit scores for the Spiral Abyss',
    options: [
      {
        name: 'playername',
        type: 3, // STRING
        description: 'The name of the player',
        required: true,
      },
      {
        name: 'team',
        type: 3, // STRING
        description: 'The team of the player (TeamLumine or TeamAether)',
        required: true,
        choices: [
          {
            name: 'Team Lumine',
            value: 'TeamLumine',
          },
          {
            name: 'Team Aether',
            value: 'TeamAether',
          },
        ],
      },
      {
        name: 'floor',
        type: 3, // STRING
        description: 'The floor (Floor9, Floor10, Floor11, or Floor12)',
        required: true,
        choices: [
          {
            name: 'Floor 9 - 1st week',
            value: 'Floor9_1',
          },
          {
            name: 'Floor 10 - 1st week',
            value: 'Floor10_1',
          },
          {
            name: 'Floor 11 - 1st week',
            value: 'Floor11_1',
          },
          {
            name: 'Floor 12 - 1st week',
            value: 'Floor12_1',
          },
          {
            name: 'Floor 9 - 3rd week',
            value: 'Floor9_2',
          },
          {
            name: 'Floor 10 - 3rd week',
            value: 'Floor10_2',
          },
          {
            name: 'Floor 11 - 3rd week',
            value: 'Floor11_2',
          },
          {
            name: 'Floor 12 - 3rd week',
            value: 'Floor12_2',
          }
        ],
      },
      {
        name: 'stars',
        type: 4, // INTEGER
        description: 'The number of stars earned',
        required: true,
      },
      {
        name: 'bonus',
        type: 4, // INTEGER
        description: 'The bonus points',
        required: true,
      },
    ],
  },
  {
    name: 'submit-photo-hunt',
    description: 'Submit scores for the Photo Hunt',
    options: [
      {
        name: 'playername',
        type: 3, // STRING
        description: 'The name of the player',
        required: true,
      },
      {
        name: 'team',
        type: 3, // STRING
        description: 'The team of the player (TeamLumine or TeamAether)',
        required: true,
        choices: [
          {
            name: 'Team Lumine',
            value: 'TeamLumine',
          },
          {
            name: 'Team Aether',
            value: 'TeamAether',
          },
        ],
      },
      {
        name: 'score',
        type: 4, // INTEGER
        description: 'The score earned in the Photo Hunt',
        required: true,
      },
    ],
  },
  {
    name: 'add-score',
    description: 'Add additional scores to the team total',
    options: [
      {
        name: 'playername',
        type: 3, // STRING
        description: 'The name of the player',
        required: true,
      },
      {
        name: 'team',
        type: 3, // STRING
        description: 'The team of the player (TeamLumine or TeamAether)',
        required: true,
        choices: [
          {
            name: 'Team Lumine',
            value: 'TeamLumine',
          },
          {
            name: 'Team Aether',
            value: 'TeamAether',
          },
        ],
      },
      {
        name: 'score',
        type: 4, // INTEGER
        description: 'The additional score to add',
        required: true,
      },
    ],
  },
  {
    name: 'view-score-for-player',
    description: 'View all player scores',
    options: [
      {
        name: 'playername',
        type: 3, // STRING
        description: 'The name of the player',
        required: true,
      },
    ],
  },
  {
    name: 'abyss-settings',
    description: 'Adjust the points awarded for each star in the Spiral Abyss',
    options: [
      {
        name: 'floor',
        type: 3, // STRING
        description: 'The floor (Floor9, Floor10, Floor11, or Floor12)',
        required: true,
        choices: [
          {
            name: 'Floor 9 - 1st Half',
            value: 'Floor9_1',
          },
          {
            name: 'Floor 10 - 1st Half',
            value: 'Floor10_1',
          },
          {
            name: 'Floor 11 - 1st Half',
            value: 'Floor11_1',
          },
          {
            name: 'Floor 12 - 1st Half',
            value: 'Floor12_1',
          },
          {
            name: 'Floor 9 - 2nd Half',
            value: 'Floor9_2',
          },
          {
            name: 'Floor 10 - 2nd Half',
            value: 'Floor10_2',
          },
          {
            name: 'Floor 11 - 2nd Half',
            value: 'Floor11_2',
          },
          {
            name: 'Floor 12 - 2nd Half',
            value: 'Floor12_2',
          },
        ],
      },
      {
        name: 'points',
        type: 4, // INTEGER
        description: 'The number of points to award for each star',
        required: true,
      },
    ],
  },
  {
    name: 'view-all-player-scores',
    description: 'List scores of all players',
  },
  {
    name: 'view-summary',
    description: 'View team totals',
  },
  {
    name: 'add-note',
    description: 'Add a note for a player',
    options: [
      {
        name: 'playername',
        type: 3, // STRING
        description: 'The name of the player',
        required: true,
      },
      {
        name: 'note',
        type: 3, // STRING
        description: 'The note to add',
        required: true,
      },
    ],
  },
  {
    name: 'refresh-scores',
    description: 'Refresh and Update Scores',
  },
];


const rest = new REST({ version: '9' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.on('ready', () => {
  console.log(`Bot is ready. Logged in as ${client.user.tag}`);
  const guild = client.guilds.cache.get(guildId);
  console.log(`Guild ID: ${guildId}`);
  // Retrieve the channel objects
  teamAetherChannel = guild.channels.cache.get('1120018500853956619');
  teamLumineChannel = guild.channels.cache.get('1120019391845781504');
});


client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'submit-abyss') {
    const playerName = options.getString('playername');
    const team = options.getString('team');
    const floor = options.getString('floor');
    let stars = options.getInteger('stars');
    const bonus = options.getInteger('bonus');



    // Handle the submitAbyss command
    if (!scores.hasOwnProperty(playerName)) {
      scores[playerName] = {
        TeamLumine: { total: 0 },
        TeamAether: { total: 0 },
      };
    }

    if (!scores[playerName][team].hasOwnProperty('abyss')) {
      scores[playerName][team].abyss = {
        Floor9_1: 0,
        Floor10_1: 0,
        Floor11_1: 0,
        Floor12_1: 0,
        Floor9_2: 0,
        Floor10_2: 0,
        Floor11_2: 0,
        Floor12_2: 0
      };
    } else if (!scores[playerName][team].abyss.hasOwnProperty(floor)) {
      scores[playerName][team].abyss[floor] = 0;
    }

    let scorePerStar = abyssSettings[floor];
    stars = stars * scorePerStar;
    const abyssScore = stars + bonus;

    scores[playerName][team].total = scores[playerName][team].total - scores[playerName][team].abyss[floor];
    scores[playerName][team].abyss[floor] = abyssScore;
    scores[playerName][team].total += abyssScore;

    saveScoresData();

    // Get the user who submitted the command
    const user = interaction.user;
    logScoreSubmission(user, playerName, team, 'Abyss Floor ' + floor , stars + bonus);

    return interaction.reply('Spiral Abyss scores submitted successfully!');
  } else if (commandName === 'submit-photo-hunt') {
    const playerName = options.getString('playername');
    const team = options.getString('team');
    const photoHuntScore = options.getInteger('score');

    // Handle the submitPhotoHunt command
    if (!scores.hasOwnProperty(playerName)) {
      scores[playerName] = {
        TeamLumine: { total: 0 },
        TeamAether: { total: 0 },
      };
    }

    if (!scores[playerName][team].hasOwnProperty('photoHunt')) {
      scores[playerName][team].photoHunt = 0;
    }

    scores[playerName][team].photoHunt += photoHuntScore;
    scores[playerName][team].total += photoHuntScore;

    saveScoresData();

    // Get the user who submitted the command
    const user = interaction.user;
    logScoreSubmission(user, playerName, team, 'Photo Hunt : ', photoHuntScore);

    return interaction.reply('Photo Hunt scores submitted successfully!');
  } else if (commandName === 'add-score') {
    const playerName = options.getString('playername');
    const team = options.getString('team');
    const additionalScore = options.getInteger('score');

    // Handle the addScore command
    if (!scores.hasOwnProperty(playerName)) {
      scores[playerName] = {
        TeamLumine: { total: 0 },
        TeamAether: { total: 0 },
      };
    }

    if (!scores[playerName].hasOwnProperty(team)) {
      scores[playerName][team] = {
        total: 0,
      };
    }

    scores[playerName][team].total += additionalScore;
    const user = interaction.user;
    logScoreSubmission(user, playerName, team, 'Additional Score : ', additionalScore);

    saveScoresData();

    return interaction.reply('Additional score added successfully!');
  } else if (commandName === 'view-score-for-player') {
    const playerName = options.getString('playername');

    // Handle the viewScores command
    if (!scores.hasOwnProperty(playerName)) {
      return interaction.reply('Player not found.');
    }

    let response = `**${playerName}**\n\n`;

    for (const team in scores[playerName]) {
      const totalScore = scores[playerName][team].total;
      if(totalScore != null && totalScore != 0){
        response += `**${team}**: Total Score: ${totalScore}\n`;
      }
      
    }

    return interaction.reply(response);
  } else if (commandName === 'team-totals') {
    // Handle the teamtotals command
    let teamScores = {};

    for (const playerName in scores) {
      for (const team in scores[playerName]) {
        if (!teamScores.hasOwnProperty(team)) {
          teamScores[team] = {
            total: 0,
          };
        }

        const playerScore = scores[playerName][team].total;
        teamScores[team].total += playerScore;
      }
    }

    let response = '';

    for (const team in teamScores) {
      const totalScore = teamScores[team].total;
      response += `**${team}**: Total Score: ${totalScore}\n`;
    }

    return interaction.reply(response);
  } else if (commandName === 'abyss-settings') {
    const floor = options.getString('floor');
    const points = options.getInteger('points');

    // Handle the abyssSettings command
    if (!abyssSettings.hasOwnProperty(floor)) {
      return interaction.reply('Invalid floor. Please specify Floor9, Floor10, Floor11, or Floor12.');
    }

    abyssSettings[floor] = points;

    return interaction.reply(`Points awarded for ${floor} stars in the Spiral Abyss have been updated to ${points}.`);
  } else if (commandName === 'view-all-player-scores') {
    // Handle the view-all-player-scores command
    let response = 'Contributions of all players:\n\n';

    for (const playerName in scores) {
      response += `**${playerName}**:\n`;

      for (const team in scores[playerName]) {
        const totalScore = scores[playerName][team].total;
        if (totalScore != null && totalScore != 0) {
          response += `**${team}**:\n`;

          if (scores[playerName][team].hasOwnProperty('abyss')) {
            const abyssScores = scores[playerName][team].abyss;
            for (let floor in abyssScores) {
              console.log(floor);

              const score = abyssScores[floor];
              console.log(score);
              if (score != null && score != 0) {
                if (floor == "Floor9_1") {
                  response += `Abyss Floor 9 - 1st Half : ${score}\n`;
                }
                if (floor == "Floor10_1") {
                  response += `Abyss Floor 10 - 1st Half : ${score}\n`;
                }
                if (floor == "Floor11_1") {
                  response += `Abyss Floor 11 - 1st Half : ${score}\n`;
                }
                if (floor == "Floor12_1") {
                  response += `Abyss Floor 12 - 1st Half : ${score}\n`;
                }
                if (floor == "Floor9_2") {
                  response += `Abyss Floor 9 - 2nd Half : ${score}\n`;
                }
                if (floor == "Floor10_2") {
                  response += `Abyss Floor 10 - 2nd Half : ${score}\n`;
                }
                if (floor == "Floor11_2") {
                  response += `Abyss Floor 11 - 2nd Half : ${score}\n`;
                }
                if (floor == "Floor12_2") {
                  response += `Abyss Floor 12 - 2nd Half : ${score}\n`;
                }
                //response += `Abyss - ${floor}: ${score}\n`;
              }

            }
          }

          if (scores[playerName][team].hasOwnProperty('photoHunt')) {
            const photoHuntScore = scores[playerName][team].photoHunt;
            response += `Photo Hunt: ${photoHuntScore}\n`;
          }


          response += `Total Score: ${totalScore}\n\n`;
        }

      }

      response += '---\n';
    }

    return interaction.reply(response);
  } else if (commandName === 'test') {
    let teamTotals = calculateTeamTotals(); // Calculate team totals

    let response = '';

    for (const team in teamTotals) {
      const totalScore = teamTotals[team].total;
      response += `**${team}**: Total Score: ${totalScore}\n`;

      const breakdown = teamTotals[team].breakdown;
      for (const category in breakdown) {
        const categoryScore = breakdown[category];
        response += `- ${category}: ${categoryScore}\n`;
      }

      response += '\n';
    }

    for (const playerName in scores) {
      for (const team in scores[playerName]) {
        if (scores[playerName][team].notes) {
          //response += `Team: ${team}\n`;
          response += `Player: ${playerName}\n`;
          response += `Notes: ${scores[playerName][team].notes}`;
        }
      }
    }

    return interaction.reply(response);
  } else if (commandName === "view-summary") {
    // Handle the view-summary command
    let teamTotals = {};

    for (const playerName in scores) {
      for (const team in scores[playerName]) {
        if (team != 'notes') {
          if (!teamTotals.hasOwnProperty(team)) {
            teamTotals[team] = {
              total: 0,
              breakdown: {
                'Spiral Abyss': 0,
                'Photo Hunt': 0,
                'Additional Scores': 0,
              },
            };
          }

          const playerScore = scores[playerName][team].total;
          teamTotals[team].total += playerScore;
          let abyssTotal = 0;
          
          //abyssTotal = scores[playerName][team].abyss.Floor9_1 + scores[playerName][team].abyss.Floor10_1 + scores[playerName][team].abyss.Floor11_1 + scores[playerName][team].abyss.Floor12_1 + scores[playerName][team].abyss.Floor9_2 + scores[playerName][team].abyss.Floor10_2 + scores[playerName][team].abyss.Floor11_2 + scores[playerName][team].abyss.Floor12_2;
          abyssTotal = calculateTeamTotalAbyssScore(team);
          if (scores[playerName][team].abyss) {
            var abyssTemp = abyssTotal * 2;
            teamTotals[team].breakdown['Spiral Abyss'] += abyssTemp;
          }

          if (scores[playerName][team].photoHunt) {
            teamTotals[team].breakdown['Photo Hunt'] += scores[playerName][team].photoHunt;
          }

          if (playerScore - (scores[playerName][team].abyss || 0) - (scores[playerName][team].photoHunt || 0) > 0) {
            teamTotals[team].breakdown['Additional Scores'] += playerScore - (scores[playerName][team].abyss || 0) - (scores[playerName][team].photoHunt || 0);
          }

          
        }

      }
    }

    let response = '';

    for (const team in teamTotals) {

      let buggyAbyssTotalFix = (teamTotals[team].total) - (teamTotals[team].breakdown['Photo Hunt'] + teamTotals[team].breakdown['Additional Scores']);
      teamTotals[team].breakdown['Spiral Abyss'] = buggyAbyssTotalFix;
      const totalScore = teamTotals[team].total;
      response += `**${team}**: Total Score: ${totalScore}\n`;

      const breakdown = teamTotals[team].breakdown;
      for (const category in breakdown) {
        const categoryScore = breakdown[category];
        response += `- ${category}: ${categoryScore}\n`;
      }
      response += '\n';

    }

    const addedNotes = {}; // Track notes already added for players

    for (const playerName in scores) {
      for (const team in scores[playerName]) {
        if (scores[playerName].notes) {
          const notes = scores[playerName].notes;
          if (!addedNotes[playerName] || !addedNotes[playerName].includes(notes)) {
            response += `Player: ${playerName}\n`;
            response += `Notes: \n${notes}\n`;

            if (!addedNotes[playerName]) {
              addedNotes[playerName] = [notes]; // Initialize with the first note
            } else {
              addedNotes[playerName].push(notes); // Add the note to the array
            }
          }
        }
      }
    }



    return interaction.reply(response);
  } else if (commandName === 'add-note') {
    const playerName = options.getString('playername');
    const note = options.getString('note');

    if (!scores.hasOwnProperty(playerName)) {
      scores[playerName] = {
        TeamLumine: { total: 0 },
        TeamAether: { total: 0 },
      };
    }
    if(scores[playerName].notes != undefined){
      scores[playerName].notes = scores[playerName].notes + `\n` + note;
    } else {
      scores[playerName].notes = note;
    }
    

    saveScoresData();

    return interaction.reply(`Note added successfully for ${playerName}!`);
  } else if (commandName === 'refresh-scores') {
    let teamTotal = calculateTeamTotals();
    updateChannelNames(teamTotal);
    return interaction.reply(`Scores Successfully Refreshed and Updated!`);
  }
});

client.login(token);
