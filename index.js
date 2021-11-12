const MY_FIGHTER_ID = 'dy__dx';
const RESPONSES_PATH = `replaysearchresponses/2021-11-10-${MY_FIGHTER_ID}`;

const filterAfterDate = new Date('2021-10-20T04:00:00.000Z');
const filterByCharacter = 'kolin';

const fs = require('fs').promises;
const path = require('path');
const parseMatch = require('./lib/parse-match');
const { calculateMatchups, calculateBo3Matchups } = require('./lib/stats');

async function main() {
  const filePaths = (await fs.readdir(RESPONSES_PATH))
    .sort((a, b) => a.localeCompare(b, 'en-u-kn-true')) // natural numeric sort
    .map(name => path.join(RESPONSES_PATH, name));

  const responses = await Promise.all(filePaths.map(f => fs.readFile(f, 'utf-8')));

  const searchResults = [];
  responses.map(JSON.parse).forEach(({ /*common,*/ response }) => {
    if (response.length !== 1) {
      throw new Error('response.length !== 1');
    }
    const { searchresult /*, searchreplaymeta*/ } = response[0];
    searchResults.push(...searchresult);
  });

  const allMatches = searchResults.map(r => parseMatch(r, MY_FIGHTER_ID)).filter(m => !!m);
  const rankedMatches = allMatches.filter(m => m.matchType === 'ranked');

  // Calculate lp gain for each match by looking at my lp of the next match
  rankedMatches.forEach((m, idx) => {
    if (idx === 0) {
      // don't know how much lp I gained from the most recent match - will have to request profile for current lp.
      // just guess "65 points" for now.
      m.lpGain = m.isVictory ? 65 : -65;
      return;
    }
    m.lpGain = rankedMatches[idx-1].me.lp - m.me.lp;
    // sanity check
    if ((m.isVictory && m.lpGain < 0) || (!m.isVictory && m.lpGain > 0)) {
      console.error("lpGain doesn't look right", m);
    }
  });

  const filteredMatches = rankedMatches.filter(m => m.date > filterAfterDate && m.me.character === filterByCharacter);

  console.log(`ranked matches since ${filterAfterDate} where I played ${filterByCharacter}: ${filteredMatches.length}`);

  console.log(calculateMatchups(filteredMatches).formatted);

  console.log(calculateBo3Matchups(filteredMatches).formatted);
}

main();
