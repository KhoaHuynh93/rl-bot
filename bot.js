const
{ compose, prop, Maybe, maybe, Task } = require('./modules/fp.module.js'),
config = require('./config.json'),
channelName = require('./constants/channelNameConst.json'),
helpCommand = require('./constants/help.json'),
{ commandObj, bot } = require("./modules/main.js"),
{ expressServerRun } = require("./modules/express-server.js");

expressServerRun();

bot.login(process.env.TOKEN).then().catch(console.error);
bot.on("ready", () => {
  bot.user.setActivity (" > Monitoring RL server");
  bot.user.setStatus("Online");
});

bot.on("message", message => {   
  if (!!message.author.bot) return;
  if (!!message.channel.parent && (message.channel.parent.name !== config.botHome)) return;
  if (message.content.indexOf(config.prefix) !== 0) return;

  commandObj(message)();
});


// ths iss a bs command to push and import test