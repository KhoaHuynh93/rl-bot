// TODO: message.channel.send <----- i sense something here
const
{ compose, curry, head, toLowerCase, prop, map, join, forEach } = require('../modules/fp.module.js'),
config = require('../config.json'),
helpCommand = require('../constants/help.json'),
Discord = require('discord.js'),
{ listBoard, listCatalogByBoard } = require('../modules/Fourchan-module.js'),

trace = curry((msg, xs) => { console.log(msg, xs); return xs; }),
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
messageSend = curry((message, xs) => message.channel.send(xs)),
getParams = compose(
  split(/ +/g),
  slice(config.prefix.length),
  toLowerCase, // just lower case the content for easier reading
  prop('content')
),
getCmd = compose(head, getParams), // cmd is the head!
getArgs = compose(tails, getParams), // args is the tails!

fork4chan = curry((message, task) => task.fork(
  err => {
    console.error(err);
    message.channel.send(`Sorry, but there's something wrong`)
  },
  forEach(messageSend(message))
)),
// display4chanBoards = message => listBoard.fork(
//   err => {
//     console.error(err);
//     message.channel.send(`Sorry, but there's something wrong`)
//   },
//   forEach(messageSend(message))
// ),

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
    var allEmoji = message.guild.emojis.array();
    var embed = new Discord.RichEmbed();
    embed.description = "[a](https://www.google.com)";
    
    message.channel.send(`${allEmoji.join("-")}`);
    message.channel.send(embed);
    return;
  },
  "4chan": () => { 
    if(!args[0]) {
      return message.channel.send(`${message.member}, what are you looking for?`);
    }
    
    switch(args[0]) {
      case 'boards':
        // display4chanBoards(message);
        fork4chan(message)(listBoard)
        break;
      case 'view':
        if (!args[1]) {
          return message.channel.send(`${message.member}, please enter a board name!`)
        }
        fork4chan(message)(listCatalogByBoard(args[1]));
        break;
      default:
        var emoji = getEmoji(message.guild, "thinkingAkari");
        return message.channel.send(`${message.member}, command not found. Read the faq (we have a FAQ, don't we... ${emoji})? Oh, that's right, no we don't.`);
    }   
  }
})[command] || (() => {
  var emoji = getEmoji(message.guild, "ShallAngry");
  return message.channel.send(`${message.member}, don't say non-sense gibberish! ${emoji}`);
})),
commandObj = mes => commandProto(getCmd(mes), getArgs(mes), mes);

module.exports = { commandObj, bot }
