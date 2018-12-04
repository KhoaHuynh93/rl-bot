const
https = require('https'),
Discord = require('discord.js'),
{ compose, curry, Task, map, prop, head, replace, toString } = require('../modules/fp.module.js'),
getListingEndpoint = (board, type) => `https://a.4cdn.org/${board}/${type}.json`,
getThreadEndpointByBoard = board => getListingEndpoint(board, 'threads'), // I inspect this url, 'threads.json' only listed out a bunch of number, so it's just a subset of catalog
getCatalogEndpointByBoard = board => getListingEndpoint(board, 'catalog'),
stripHTML = replace(/<(?:.|\n)*?>/gm, ''),

forcePlainText = compose(stripHTML, toString),
truncate = (text, length) => {
  if (!text) { return ''; } 
  let plainText = forcePlainText(text);
  return (plainText.length > length) ? plainText.substring(0, length) : plainText;
},

httpGetTask = url => new Task((reject, result) => https.get(url, res => {
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
			result(JSON.parse(rawData));
		} catch (e) {
			reject(e);
		}
	});
}).on('error', reject)),

boardToEmbedArray = curry((max, data) => {
  let embedArray = ["Here, your list of 4chan boards."];
  while(data.length > 0) {
    let realFields = data.length >= max ? max : data.length; // Math.min(max, data.length) , it's a number, why'd you called it realFields?
    let sendBlock = data.splice(0, realFields).join(" -- ");
    let embed = new Discord.RichEmbed();
    
    embed.description = sendBlock;
    embedArray.push(embed);
  }
  return embedArray;
}),

listBoard = httpGetTask('https://a.4cdn.org/boards.json')
  .map(prop('boards'))
  .map(map(i => `[${i.board}-${i.title}](https://boards.4channel.org/${i.board}/)`))
  .map(boardToEmbedArray(25)),

listCatalogByBoard = board => httpGetTask(getCatalogEndpointByBoard(board))
  .map(head)
  .map(prop('threads'))
  .map(map(item => ({
    "embed": {
      "title": `${truncate(item.sub, 100) || "Titleless"} - ${item.no}`,
      "url": `https://boards.4chan.org/${board}/thread/${item.no}`,
      "color": 109922,
      "thumbnail": {
        "url": `http://i.4cdn.org/${board}/${item.tim}${item.ext}`
      },
      "author": { 
        "name": truncate(item.name, 100)
      },
      "description": truncate(item.com, 100),
    }
  })));
      
module.exports = { listBoard, listCatalogByBoard }