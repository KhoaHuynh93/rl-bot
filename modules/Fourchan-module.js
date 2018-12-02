const
https = require('https'),
{ Task } = require('../modules/fp.module.js'),
getListingEndpoint = (board, type) => `https://a.4cdn.org/${board}/${type}.json`,
getThreadEndpointByBoard = (board) => getListingEndpoint(board, 'threads'),
getCatalogEndpointByBoard = (board) => getListingEndpoint(board, 'catalog'),
// wrap the http call in Task model for easy future use:
httpGetTask = url => new Task((reject, result) => {
  https.get(url, resp => {
    let data = '';
    resp.on('data', (chunk) => { data += chunk; });
    resp.on('end', () => result(JSON.parse(data)));
  }).on("error", reject);
});
const listBoard = httpGetTask('https://a.4cdn.org/boards.json'),
listThreadByBoard = board => httpGetTask(getThreadEndpointByBoard(board)),
listCatalogByBoard = board => httpGetTask(getCatalogEndpointByBoard(board));
      
module.exports = { listBoard }

// usage sample:
// listBoard
//   .map( transform the SUCCESS data here anyway wanted, the error will immediately forked ) .... many maps
//   .fork( errorCatcher, successCallback )

// note: Monad :: map multiple functions (aka steps in data transforming) === map one compose of those multiple functions aka lineMap
// aMonad.map(fnA).map(fnB).map(fnC)
// === 
// aMonad.map(compose(fnA, fnB, fnC))
// ===
// lineMap(fnA, fnB, fnC)(aMonad)