const Discord = require('discord.js'),
ytdl = require('ytdl-core'),
{ bot } = require("./main.js"),
queue = new Map(),
storedSongsFile = '../stored-music.json',
storedSongs = require(storedSongsFile),
fse = require("fs-extra"),
{ YT } = require("./yt-module.js");

const
getServerQueue = (message) => {
  var serverQueue = queue.get(message.guild.id);
  if(!serverQueue) {
    message.channel.send("Server isn't connected!");
    return null;
  }
  return serverQueue;
},
saveJson = async (json, path) => {
  try {
    await fse.outputJson(path, json)

    const data = await fse.readJson(path)

    console.log(data)
    return true;
  } catch (err) {
    console.error(err)
    return false;
  }
},
Music = {
  skip: (message, serverQueue) => {
    serverQueue = serverQueue || getServerQueue(message);

    if (!message.member.voiceChannel) return message.channel.send('You have to be in a voice channel to stop the music!');
    if (!serverQueue) return message.channel.send('There is no song that I could skip!');
    serverQueue.connection.dispatcher.end();
  },

  stop: (message, serverQueue) => {
    serverQueue = serverQueue || getServerQueue(message);

    if (!message.member.voiceChannel) return message.channel.send('You have to be in a voice channel to stop the music!');
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
  },

  play: (message, index) => {
    var guild = message.guild;

    const serverQueue = getServerQueue(message);
    if(!serverQueue) {
      return;
    }
    
    if (!serverQueue.storedSongs || serverQueue.storedSongs.length === 0) {
      return;
    }
    
    var song = serverQueue.storedSongs[index];
    if(!serverQueue.connection) {
      message.channel.send("I'm tired.");
      return;
    }
    
    if(!song) {
      message.channel.send("I'm tired of singing.");
      return;
    }
    
    if(!!serverQueue.connection.dispatcher) {
      serverQueue.connection.dispatcher.end();
    }
    
    message.channel.send(`Start playing: ${song.title}`);
    
    const dispatcher = serverQueue.connection.playStream(song.url)
      .on('end', (reason) => {
        if(reason === "stop") {
          return message.channel.send("Alright, I'll stop... for now.");
        }
      
        console.log('Current song ended!');
        Music.play(message, index + 1);
      })
      .on('error', error => {
        message.channel.send("Halp!!!");
        console.error(error);
      });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 100);
  },
  connect: async (message) => {
    const args = message.content.split(' ');

    const voiceChannel = message.member.voiceChannel;
    if (!voiceChannel) return message.channel.send('You need to be in a voice channel to play music!');
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
      return message.channel.send('I need the permissions to join and speak in your voice channel!');
    }

    var serverQueue = queue.get(message.guild.id);
    if(!serverQueue) {
      serverQueue = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 100,
        playing: true,
        storedSongs: storedSongs
      };

      queue.set(message.guild.id, serverQueue);
    }

    var connection = await voiceChannel.join();
    serverQueue.connection = connection;
  },
  disconnect: async (message) => {
    var serverQueue = getServerQueue(message);    
    if(!serverQueue) {
      return;
    }

    serverQueue.voiceChannel.leave();
    queue.delete(message.guild.id);
    return message.channel.send("Disconnected!");
  },

  addYoutube: async (message, url) => {
    var serverQueue = getServerQueue(message);   
    if(!serverQueue) { return; }
  
    var id = ytdl.getURLVideoID(url);
    console.log(id);
    
    var song = {};
    await ytdl.getInfo(id).then((info) => {
      console.log(info);
      
      song = {
        title: info.title,
        url: info.video_url
      };
    }).catch(err => console.log(err));
     
    if(!song.url) {
      return message.channel.send("404 - Song not found!");
    }
    
    serverQueue.songs.push(song);
  },

  list: (message) => {
    var serverQueue = getServerQueue(message);    
    if(!serverQueue) {
      return;
    }

    return message.channel.send(JSON.stringify(serverQueue.storedSongs));
  },
  listDefault: (message) => {
    var serverQueue = getServerQueue(message);    
    if(!serverQueue) {
      return;
    }

    return message.channel.send(JSON.stringify(serverQueue.storedSongs));
  },
  add: (message, url) => {
    var serverQueue = getServerQueue(message);
    
    if(!serverQueue) {
      return;
    }
    
    serverQueue.connection.playArbitraryInput(url);
  },
  addStore: (message, song) => {
    var serverQueue = getServerQueue(message);    
    if(!serverQueue) {
      return;
    }

    if(!song || !song.url || !song.title || !song.type) {
      return message.channel.send("Don't get that shit near me.");
      return;
    }
    
    serverQueue.storedSongs = serverQueue.storedSongs || [];
    serverQueue.storedSongs.push(song);
    
    if(saveJson(serverQueue.storedSongs, storedSongsFile)) {
      message.channel.send('Song is stored');
      return;
    }
    return message.channel.send('Messed up, Sowwy');
  },
  volume: (message, vol) => {
    var serverQueue = getServerQueue(message);
    if(!serverQueue) {
      return;
    }    
    
    if(isNaN(vol) || vol < 0 || vol > 100) {
      message.channel.send('Volume must be in the range from 0 to 100!');
      return;
    }
    
    serverQueue.volume = vol;
    if(!!serverQueue.connection && !!serverQueue.connection.dispatcher) {
      serverQueue.connection.dispatcher.setVolumeLogarithmic(vol / 100);
      message.channel.send('New volume: ' + vol);
    }
  },
  end: (message) => {
    var serverQueue = getServerQueue(message);
    if(!serverQueue) {
      message.channel.send("Want to end your life?");
      return;
    }    
    
    if(!serverQueue.connection || !serverQueue.connection.dispatcher) {
      message.channel.send("Are you imagining my voice in your dumb head?");
      return;
    }
    
    serverQueue.connection.dispatcher.end("stop");
  },
  test: () => {
    YT.getUrls("lJUq8jzU0CA");
  }
}

module.exports = {
  Music
}