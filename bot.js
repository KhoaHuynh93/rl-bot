const
{ compose, curry, prop, Either, left, either, identity, eq } = require('./modules/fp.module.js'),
config = require('./config.json'),
channelName = require('./constants/channelNameConst.json'),
helpCommand = require('./constants/help.json'),
{ commandObj, bot } = require("./modules/main.js"),
{ expressServerRun } = require("./modules/express-server.js"),

eitherCond = curry((cond, xs) => !!cond ? Either.of(cond) : left(xs)),

eitherIsBot = mes => eitherCond(mes.author, 'No author')
  .chain(e => eitherCond(!e.bot, 'Is Bot')),

eitherIsHome = mes => eitherCond(mes.channel, 'No channel')
  .chain(e => eitherCond(e.parent, 'Is chatting in private'))
  .chain(p => eitherCond(p.name, 'No name'))
  .chain(n => eitherCond(n === config.botHome, 'Is not bot home')),

eitherIsCommand = mes => eitherCond(mes.content[0] === config.prefix , 'Not a command'),

eitherMessage = mes => eitherIsBot(mes)
  .chain(_ => eitherIsHome(mes))
  .chain(_ => eitherIsCommand(mes)),

messageAction = mes => either(console.error, _ => {
  commandObj(mes)();
  mes.delete();
}, eitherMessage(mes));

// console.log(process.env.TOKEN);
bot.login(process.env.TOKEN).then().catch(console.error);
bot.on("ready", () => {
  var RL = bot.guilds.find(guild => guild.name === 'RL');
  if(!!RL) {
    var ownerId = RL.ownerID;
    var members = RL.members.array();
    var owner = members.filter(c => c.id === ownerId)[0];
    
    var status = !!owner.nickname ? owner.nickname : owner.user.username;
    bot.user.setActivity (` with ${status}.`);
    setInterval(function() {
      status = !!owner.nickname ? owner.nickname : owner.user.username;
      bot.user.setActivity (` with ${status}.`);
    }, 5000);  
  } else {
    bot.user.setActivity (" with anime tiddies.");
  }
   
  bot.user.setStatus("Online");
});

bot.on("message", messageAction);
expressServerRun();