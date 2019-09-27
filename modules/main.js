// TODO: message.channel.send <----- i sense something here
const
{ compose, curry, head, toLowerCase, prop, map, join, forEach, toString } = require('../modules/fp.module.js'),
config = require('../config.json'),
helpCommand = require('../constants/help.json'),
vneFeedConst = require('../constants/vneFeedConst.json'),
Discord = require('discord.js'),
{ listBoard, listCatalogByBoard, fork4chan } = require('../modules/Fourchan-module.js'),
{ forkWeatherCurrent, forkWeatherForecast } = require('../modules/Weather-module.js'),
{ forkVnExpress, forkHackernews, forkGematsu } = require('./rss-module.js'),
{ Music } = require('./music-module.js'),
equalPlain = curry((name, e) =>  e.name.toLowerCase() === name.toLowerCase()),
slice = curry((l, xs) => xs.slice(l)),
split = curry((l, xs) => xs.split(l)),
tails = array => array.slice(1, array.length),
getEmoji = (server, name) => server.emojis.filter(equalPlain(name)).first(), 
bot = new Discord.Client(),
pingTest = curry((message, m) => m.edit(`Pong! Hello ${m.author.username}`)),
getParams = compose( split(/ +/g), slice(config.prefix.length), toLowerCase, prop('content') ),
getCmd = compose(head, getParams),
getArgs = compose(tails, getParams),

// start with isolating out every functions in this switch
cmdDefault = mes => () => {
  try {
    var emoji = getEmoji(mes.guild, "ShallAngry");
    return mes.channel.send(`${mes.member}, don't say non-sense gibberish! ${emoji}`);
  } catch (e) {
    console.log(e);
    return mes.channel.send(`I can't send emoji here!`);
  }
},
cmdPing = mes => () => mes.channel.send("Ping?").then(pingTest(mes)).catch(console.error),
cmdHelp = mes => () => mes.channel.send("```json\n"+JSON.stringify(helpCommand, null, 2)+"```"),
cmdTest = curry((command, args, mes) => () => {
  var emoji = getEmoji(mes.guild, "thinkingAkari");
  return mes.channel.send(`${command} => ${args.join('--')}${emoji}`);
}),
cmdDelete = mes => () => mes.channel.bulkDelete(100, true),
cmd4chan = curry((args, mes) => () => { 
  if (mes.channel.name !== "command_4chan") {
    var emoji = getEmoji(mes.guild, "bakabaka");
    mes.channel.send(`${mes.member}, use the right channel baka!!!`);
    mes.channel.send(emoji);
    return;
  }  
  if (!args[0]) {
    return mes.channel.send(`${mes.member}, what are you looking for?`);
  }

  switch(args[0]) {
    case 'boards':
      fork4chan(mes)(listBoard)
      break;
    case 'view':
      if (!args[1]) {
        return mes.channel.send(`${mes.member}, please enter a board name!`)
      }
      fork4chan(mes)(listCatalogByBoard(args[1]));
      break;
    default:
      var emoji = getEmoji(mes.guild, "thinkingAkari");
      return mes.channel.send(`${mes.member}, command not found. Read the faq (we have a FAQ, don't we... ${emoji})? Oh, that's right, no we don't.`);
  }   
}),
cmdWeather = curry((args, mes) => () => {
  switch (args[0]) {
    case 'forecast':
      forkWeatherForecast(mes)(args[1]);
      break;
    default: 
      forkWeatherCurrent(mes);
      break;
  }
}),
cmdNews = curry((args, mes) => () => {
  if (!args[0]) {
    mes.channel.send('Please select a news channel');
    mes.channel.send('```vnexpress | hackernews | gematsu```');
    return;
  }

  switch (args[0]) {
    case "vnexpress": {
      if (vneFeedConst.AvailableType.indexOf(args[1] || '') === -1) {
        mes.channel.send(`Put in the correct feed type!!! Here:`);
        mes.channel.send("```" + vneFeedConst.AvailableType.join(' | ') + "```");
        break;
      }

      forkVnExpress(args[1])(mes);
      break;
    }
    case "hackernews":
      forkHackernews(mes);
      break;
    case "gematsu":
      forkGematsu(mes);
      break;
    default :
      mes.channel.send('Please select a CORRECT news channel');
      mes.channel.send('```vnexpress | hackernews | gematsu```');
      break;
  }
}),
cmdMusic = curry((args, mes) => () => {
  if(!args[0]) {
    mes.channel.send('What do you want?');
  }
  
  switch (args[0]) {
    case "connect": {
      Music.connect(mes);
      break;
    }
    case "add": {
      Music.add(mes, args[1]);
      break;
    }
    case "play": {
      Music.play(mes, args[1]);
      break;
    }
    case "list": {
      Music.list(mes);
      break;
    }
    case "disconnect": {
      Music.disconnect(mes);
      break;
    }
    case "volume": {
      Music.volume(mes, args[1]);
      break;
    }
    case "end": {
      Music.end(mes);
      break;
    }
  }
}),

// old commandProto      
commandProto = curry((command, args, mes) => ({
  "ping": cmdPing(mes),
  "help": cmdHelp(mes),
  "test": cmdTest(command, args, mes),
  "msgdelete": cmdDelete(mes),
  "4chan": cmd4chan(args, mes),
  "weather": cmdWeather(args, mes),
  "news" : cmdNews(args, mes),
  "music": cmdMusic(args, mes)
})[command] || cmdDefault(mes)),

commandObj = mes => commandProto(getCmd(mes), getArgs(mes), mes);

module.exports = { 
  commandObj,
  bot
}
