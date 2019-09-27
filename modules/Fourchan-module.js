const
Discord = require('discord.js'),
{ compose, curry, map, prop, head, replace, toString, forEach } = require('../modules/fp.module.js'),
{ forcePlainText, truncate, httpGetTask, sendEach } = require('./utilities.js'),
getListingEndpoint = curry((type, board) => `https://a.4cdn.org/${board}/${type}.json`),
getAllBoards = getListingEndpoint('catalog'),
stripHTML = replace(/<(?:.|\n)*?>/gm, ''),

truncateLimit = truncate(100),

boardToEmbedArray = curry((max, data) => {
  let embedArray = ["Here, your list of 4chan boards."];
  while(data.length > 0) {
    let realFields = data.length >= max ? max : data.length;
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

listCatalogByBoard = board => httpGetTask(getAllBoards(board))
  .map(head)
  .map(prop('threads'))
  .map(map(item => ({
    "embed": {
      "title": `${truncateLimit(item.sub, "Untitled")} - ${item.no}`,
      "url": `https://boards.4chan.org/${board}/thread/${item.no}`,
      "color": 109922,
      "thumbnail": {
        "url": `http://i.4cdn.org/${board}/${item.tim}${item.ext}`
      },
      "author": { 
        "name": truncateLimit(item.name, '')
      },
      "description": truncateLimit(item.com, ''),
    }
  }))),
messageSend = curry((message, xs) => message.channel.send(xs)),
fork4chan = curry((message, task) => task.fork(
  err => {
    console.log(err);
    message.channel.send("Sorry, but there is something wrong");
  },
  sendEach(message)
));
      
module.exports = { listBoard, listCatalogByBoard, fork4chan }