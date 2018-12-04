const
https = require('https'),
Discord = require('discord.js'),
{ curry, Task, map, prop, head } = require('../modules/fp.module.js'),
getListingEndpoint = (board, type) => `https://a.4cdn.org/${board}/${type}.json`,
getThreadEndpointByBoard = board => getListingEndpoint(board, 'threads'), // I inspect this url, 'threads.json' only listed out a bunch of number, so it's just a subset of catalog
getCatalogEndpointByBoard = board => getListingEndpoint(board, 'catalog'),

// httpGetTask = url => new Task((reject, result) => {
//   https.get(url, resp => {
//     let data = '';
//     resp.on('data', chunk => { data += chunk; });
//     resp.on('end', () => result(JSON.parse(data)));
//   }).on("error", reject);
// }),
      
httpGetTask = url  => new Task((reject, result) => https.get(url, res => {
	const { statusCode } = res;
	const contentType = res.headers['content-type'];

	let error;
	if (statusCode !== 200) {
		error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
	} else if (!/^application\/json/.test(contentType)) {
		error = new Error('Invalid content-type.\n' + `Expected application/json but received ${contentType}`);
	}
	if (error) { reject(error); res.resume(); return; }

	res.setEncoding('utf8');
	let rawData = '';
	res.on('data', (chunk) => { rawData += chunk; });
	res.on('end', () => {
		try {
			const parsedData = JSON.parse(rawData);
			result(parsedData);
		} catch (e) {
			reject(e);
		}
	});
}).on('error', reject)),    

boardToEmbedArray = curry((max, data) => {
  var embedArray = ["Here, your list of 4chan boards."];
  while(data.length > 0) {
    var realFields = data.length >= max ? max : data.length; // Math.min(max, data.length) , it's a number, why'd you called it realFields?
    var sendBlock = data.splice(0, realFields).join(" -- ");
    var embed = new Discord.RichEmbed();
    
    embed.description = sendBlock;
    embedArray.push(embed);
  }
  return embedArray;
}),

listBoard = httpGetTask('https://a.4cdn.org/boards.json')
  .map(prop('boards'))
  // .map(map(board => ({
  //   'name': `/${board.board}/-${board.title}`,
  //   'value': `https://boards.4channel.org/${board.board}/catalog`
  // })))
  // .map(map(i => `[${i.name}](${i.value})`)) <-- transform to object just to transform to md String again???????
  .map(map(i => `[${i.board}-${i.title}](https://boards.4channel.org/${i.board}/)`)) // <-- just transform it away!
  .map(boardToEmbedArray(25)),
      
listThreadByBoard = board => httpGetTask(getThreadEndpointByBoard(board)),
listCatalogByBoard = board => httpGetTask(getCatalogEndpointByBoard(board))
  .map(head)
  .map(prop('threads'))
  .map(map(i => `https://i.4cdn.org/${board}/${i.tim}${i.ext}`))
  .map(a => a.join('\n'))
  .map(s => [s])
;
      
module.exports = { listBoard, listCatalogByBoard }