// TODO: message.channel.send <----- i sense something here
const
{ compose, curry, head, toLowerCase, prop, map, join, forEach } = require('../modules/fp.module.js'),
config = require('../config.json'),
helpCommand = require('../constants/help.json'),
Discord = require('discord.js'),
{ listBoard } = require('../modules/Fourchan-module.js'),
      
trace = curry((msg, xs) => {
  console.log(msg, xs);
  return xs;
}),
slice = curry((l, xs) => xs.slice(l)),
split = curry((l, xs) => xs.split(l)),
tails = array => array.slice(1, array.length), // tails: Array -> Array - remove 0th position

getEmoji = (server, name) => server.emojis.filter(emoji => {
  return emoji.name.toLowerCase() === name.toLowerCase()
}).first(),

bot = new Discord.Client(),

pingTest = curry((message, m) => {
  if(!message.channel.parent) {
    m.edit(`Pong! Hello ${m.author.username}`);
  } else {
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(bot.ping)}ms\nGot ping by ${message.member.nickname || message.member.user.username}`);
  } 
}),

getParams = compose(
  split(/ +/g),
  slice(config.prefix.length),
  prop('content')
),
getCmd = compose(toLowerCase, head, getParams),
getArgs = compose(tails, getParams),

// boardToField = board => ({
//   title: `${board.board} - ${board.title}`,
//   url: `http://boards.4channel.org/${board.board}/`
// }),
// oneBoard = obj => ({embed: { title: obj.title, url: obj.url }}),

commandProto = curry((command, args, message) => ({
  "ping": () => {
    return message.channel.send("Ping?").then(pingTest(message)).catch(console.error)
  },
  "help": () => {
    return message.channel.send("```"+JSON.stringify(helpCommand, null, 2)+"```")
  },
  "test": () => {
    var emoji = getEmoji(message.guild, "thinkingAkari");
    
    return message.channel.send(`${command} => ${args.join('--')}${emoji}`)
  },
  "<:thinkingakari:408618297047777280>": () => {
    // var emoji = getEmoji(message.guild, "saberChan");
    var allEmoji = message.guild.emojis.array();
    // console.log(emoji);
    return message.channel.send(`${allEmoji.join("-")}`);
  },
  "4chan": () => { 
    listBoard
      .map(prop('boards'))
      .map(map(board => ({ 
        'name': `${board.board} - ${board.title}`,
        'value': `http://boards.4channel.org/${board.board}/`
      })))
      .fork(console.error, data => {
        var max = 25;
        message.channel.send("Here, your list of 4chan boards.");
        while(data.length > 0) {
          var realFields = data.length >= max ? max : data.length;
          var sendBlock = data.splice(0, realFields);
          
          var embed = new Discord.RichEmbed();
          sendBlock.forEach(item => embed.addField(item.name, item.value, false));
          
          message.channel.send(embed);
        }
      })
     }
})[command] || (() => {
  // console.log(command);
  var emoji = getEmoji(message.guild, "ShallAngry");
  return message.channel.send(`${message.member}, don't say non-sense gibberish! ${emoji}`);
})),
commandObj = mes => commandProto(getCmd(mes), getArgs(mes), mes);

module.exports = { commandObj, bot }
