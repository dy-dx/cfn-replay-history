const cfnId = 'dy__dx';
const responsesPath = `replaysearchresponses/2021-11-10-${cfnId}`;

const request = require('request');
const fs = require('fs').promises;

const oauth = {
  // REDACTED
};

const replaySearchApiPath = ''; // REDACTED

async function getPage(num = 1) {
  const url = `${replaySearchApiPath}?id=${cfnId}&sort=uploaddate&sortdir=d&page=${num}`;
  return new Promise((resolve, reject) => {
    request.get({ url, oauth }, (err, res, body) => {
      if (err) {
        reject(err);
      }
      if (res.statusCode >= 300 || res.statusCode < 200) {
        reject(res.statusCode);
      } else {
        resolve(body);
      }
    });
  });
}

async function main() {
  try {
    await fs.mkdir(responsesPath);
  } catch (e) { /* don't care if dir already exists */ }

  let pageNum = 0;
  while (true) {
    pageNum += 1;
    console.log(`fetching results for ${cfnId}, page ${pageNum}`);
    const body = await getPage(pageNum);
    const searchMetadata = JSON.parse(body).response[0].searchreplaymeta[0];
    await fs.writeFile(`${responsesPath}/${pageNum}.json`, body);
    const isLastPage = searchMetadata.currentpage === searchMetadata.totalpage;
    if (isLastPage) {
      break;
    }
    await new Promise(res => setTimeout(res, 2000));
  }
  console.log(`done. responsesPath: ${responsesPath}`);
}

main();
