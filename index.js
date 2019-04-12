const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);


const MY_PLAYER_ID = '131418';

const RESPONSES_FILE = 'replaysearchresponses/2019-04-11-concatenated';


const SEC_TO_WIN32_EPOCH = 50491123200;
const SEC_TO_UNIX_EPOCH = 11644473600;

// 100ns ticks since January 1, 0001, 00:00:00
function parseUploadDate(s) {
  const unixMs = 1000 * (Number(s.substr(0, s.length - 7)) - SEC_TO_WIN32_EPOCH - SEC_TO_UNIX_EPOCH);
  return new Date(unixMs);
}

function parseMatchType(s) {
  if (s === 'rm') {
    return 'ranked';
  } else if (s === 'cm') {
    return 'casual';
  } else if (s === '2') {
    return 'lounge';
  }
  throw new Error(`unexpected match type ${s}`);
}

function findPlayer(result, playerId) {
  const p1 = result.leftplayer[0];
  const p2 = result.rightplayer[0];
  if (playerId === p1.publicid) {
    return p1;
  } else if (playerId === p2.publicid) {
    return p2;
  }
  throw new Error(`could not find playerId ${playerId} in result`);
}

const charactersById = {
  0: 'ryu',
  1: 'mbison',
  2: 'chunli',
  3: 'ken',
  4: 'karin',
  5: 'zangief',
  6: 'dhalsim',
  7: 'nash',
  8: 'vega',
  9: 'juri',
  10: 'birdie',
  11: 'r_mika',
  12: 'rashid',
  13: 'fang',
  14: 'laura',
  15: 'necalli',
  16: 'cammy',
  17: 'guile',
  18: 'ibuki',
  19: 'balrog',
  20: 'urien',
  21: 'alex',
  23: 'akuma',
  24: 'kolin',
  25: 'ed', // probably
  26: 'menat', // wild guess
  27: 'abigail',
  28: 'zeku', // probably
  29: 'sakura', // probably
  30: 'blanka', // probably
  31: 'falke', // probably
  32: 'cody',
  33: 'g',
  34: 'sagat',
  35: 'kage',
};

function parsePlayer(p) {
  p.character = charactersById[parseInt(p.charaid, 10)];
  return p;
}

function parseMatch(r) {
  const p1Id = r.leftplayer[0].publicid;
  const p2Id = r.rightplayer[0].publicid;
  const opponentId = MY_PLAYER_ID === p1Id ? p2Id : p1Id;

  return {
    matchId: r.matchid,
    date: parseUploadDate(r.uploaddate),
    matchType: parseMatchType(r.matchtype),

    isVictory: r.winner === MY_PLAYER_ID,
    isTie: r.winner === r.loser,

    me: parsePlayer(findPlayer(r, MY_PLAYER_ID)),
    opponent: parsePlayer(findPlayer(r, opponentId)),
  };
}

readFile(RESPONSES_FILE, 'utf-8').then(data => {
  const searchResults = [];

  data.split("\n").filter(s => s.length).map(JSON.parse).forEach(({ common, response }) => {
    if (response.length != 1) {
      throw new Error("response.length != 1");
    }
    const { searchresult, searchreplaymeta } = response[0];
    searchResults.push(...searchresult);
  });

  const matches = searchResults.map(parseMatch);
  const rankedMatches = matches.filter(m => m.matchType === 'ranked');

  const june2018 = Date.parse('2018-06-01T00:00:00.000Z');
  const rankedMatchesSinceJune = rankedMatches.filter(m => m.date > june2018 && m.me.character === 'karin');

  const matchupsByCharacter = {};

  rankedMatchesSinceJune.forEach(({ isVictory, opponent: { character } }) => {
    if (!matchupsByCharacter[character]) {
      matchupsByCharacter[character] = { wins: 0, losses: 0 };
    }

    if (isVictory) {
      matchupsByCharacter[character].wins += 1;
    } else {
      matchupsByCharacter[character].losses += 1;
    }
  });


  console.log('ranked matches since june 2018 where I played karin:', rankedMatchesSinceJune.length);

  // Convert to an array so I can sort the results
  const matchupsTable = [];

  for (let name in matchupsByCharacter) {
    const m = matchupsByCharacter[name];
    m.ratio = m.wins / m.losses;
    matchupsTable.push({ character: name, ...m });
  }

  console.table(matchupsTable.sort((a, b) => a.ratio - b.ratio));
});
