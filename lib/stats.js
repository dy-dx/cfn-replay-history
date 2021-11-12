const { table } = require('table');

function tableConfig(properties) {
  return {
    drawHorizontalLine: (lineIndex, rowCount) => (
      lineIndex === 0 || lineIndex === 1 || lineIndex === rowCount
    ),
    columnDefault: { alignment: 'right' },
    columns: {
      0: { alignment: 'left' },
      [properties.length-1]: { alignment: 'left' },
    },
  };
}

function calculateMatchups(matches) {
  const matchupsByCharacter = {};

  matches.forEach(({ isVictory, lpGain, opponent: { character } }) => {
    if (!matchupsByCharacter[character]) {
      matchupsByCharacter[character] = { wins: 0, losses: 0, lpGain: 0, lpLoss: 0, lpNet: 0 };
    }
    const matchup = matchupsByCharacter[character];

    matchup.lpNet += lpGain;
    if (lpGain < 0) {
      matchup.lpLoss += lpGain;
    } else {
      matchup.lpGain += lpGain;
    }

    if (isVictory) {
      matchup.wins += 1;
    } else {
      matchup.losses += 1;
    }
  });

  // Convert to an array so I can sort the results
  const matchupsTable = [];

  for (const name in matchupsByCharacter) {
    const m = matchupsByCharacter[name];
    m.winrate = m.wins / (m.wins + m.losses);
    m.winrate = parseFloat(m.winrate.toFixed(2)); // truncate for formatting
    matchupsTable.push({ character: name, ...m });
  }

  const sortMatchupsBy = 'winrate';
  const sortedMatchups = matchupsTable.sort((a, b) => a[sortMatchupsBy] - b[sortMatchupsBy]);
  const properties = ['character', 'wins', 'losses', 'lpGain', 'lpLoss', 'lpNet', 'winrate'];
  const tableData = [properties].concat(sortedMatchups.map(m => properties.map(p => m[p])));

  const formatted = table(tableData, tableConfig(properties));
  return { data: matchupsByCharacter, formatted };
}

function calculateBo3Matchups(matches) {
  const bo3Sets = [];
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const prev = matches[i+1];
    const prev2 = matches[i+2];
    // see if this match and the previous match were against the same opponent.
    // assume we never play against the same opponent twice in a row (faulty logic but oh well)
    if (!prev || cur.opponent.publicid !== prev.opponent.publicid) {
      continue;
    }
    i += 1;
    const set = {
      me: cur.me,
      opponent: cur.opponent,
      record: (cur.isVictory ? 1 : -1) + (prev.isVictory ? 1 : -1),
    };
    if (set.record === 0) {
      if (!prev2 || cur.opponent.publicid !== prev2.opponent.publicid) {
        continue;
      }
      i += 1;
      set.record += (prev2.isVictory ? 1 : -1);
    }
    set.isVictory = set.record > 0;
    bo3Sets.push(set);
  }

  const bo3SetMatchupsByCharacter = {};

  bo3Sets.forEach(({ isVictory, opponent: { character } }) => {
    if (!bo3SetMatchupsByCharacter[character]) {
      bo3SetMatchupsByCharacter[character] = { wins: 0, losses: 0 };
    }
    const matchup = bo3SetMatchupsByCharacter[character];

    if (isVictory) {
      matchup.wins += 1;
    } else {
      matchup.losses += 1;
    }
  });

  // Convert to an array so I can sort the results
  const bo3SetMatchupsTable = [];
  for (const name in bo3SetMatchupsByCharacter) {
    const m = bo3SetMatchupsByCharacter[name];
    m.winrate = m.wins / (m.wins + m.losses);
    m.winrate = parseFloat(m.winrate.toFixed(2)); // truncate for formatting
    bo3SetMatchupsTable.push({ character: name, setsWon: m.wins, setsLost: m.losses, winrate: m.winrate });
  }
  const sortedMatchups = bo3SetMatchupsTable.sort((a, b) => a.winrate - b.winrate);

  const properties = ['character', 'setsWon', 'setsLost', 'winrate'];
  const tableData = sortedMatchups.map(r => properties.map(p => r[p]));
  const formatted = table([properties].concat(tableData), tableConfig(properties));

  return { data: bo3SetMatchupsByCharacter, formatted };
}

module.exports = {
  calculateMatchups,
  calculateBo3Matchups,
};
