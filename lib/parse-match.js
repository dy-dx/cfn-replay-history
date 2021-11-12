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

const charactersById = {
  0: 'ryu',
  1: 'm_bison',
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
  25: 'ed',
  26: 'menat',
  27: 'abigail',
  28: 'zeku',
  29: 'sakura',
  30: 'blanka',
  31: 'falke',
  32: 'cody',
  33: 'g',
  34: 'sagat',
  35: 'kage',
  36: 'poison',
  37: 'e_honda',
  38: 'lucia',
  39: 'gill',
  40: 'seth',
  41: 'dan',
  42: 'rose',
  43: 'oro',
  44: 'akira',
  45: 'luke',
};

function parsePlayer(p) {
  if (p) {
    p.character = charactersById[parseInt(p.charaid, 10)] || p.charaid;
    p.lp = parseInt(p.lp, 10);
  }
  return p;
}

function parseMatch(r, MY_FIGHTER_ID) {
  const p1 = r.leftplayer[0];
  const p2 = r.rightplayer[0];

  const me = (MY_FIGHTER_ID === p1.fighterid) ? p1 : p2;
  const opponent = (MY_FIGHTER_ID === p1.fighterid) ? p2: p1;

  if (MY_FIGHTER_ID !== me.fighterid) {
    // this can happen if we searched for a player name that matches multiple different players
    // console.warn(Error(`could not find fighterid ${MY_FIGHTER_ID} in result`));
    return null;
  }

  const parsedMatch = {
    matchId: r.matchid,
    date: parseUploadDate(r.uploaddate),
    matchType: parseMatchType(r.matchtype),

    isVictory: r.winner === me.publicid,
    isTie: r.winner === r.loser,

    me: parsePlayer(me),
    opponent: parsePlayer(opponent),
  };
  return parsedMatch;
}

module.exports = parseMatch;
