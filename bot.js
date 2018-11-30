const
{ compose, prop, Maybe, maybe, Task } = require('./modules/fp.module.js'),
http = require('http'),
express = require('express'),
app = express(),
// Discord = require('discord.js'),
config = require('./config.json'),
channelName = require('./constants/channelNameConst.json'),
helpCommand = require('./constants/help.json'),
{ commandObj, bot } = require("./modules/main.js");

// express code --- what are these? maybe we dont need to read these, so make it as compact as possible
app.get("/", (request, response) => { response.sendStatus(200); });
app.listen(process.env.PORT);
setInterval(() => { http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`); }, 280000);
///----------------------------------//

// bot code
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