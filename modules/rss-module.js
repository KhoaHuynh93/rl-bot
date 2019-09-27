const 
{ compose, curry, prop, replace, map, forEach, take, Task } = require('./fp.module.js'),
{ forcePlainText, truncate, sendEach, httpGetTask } = require('./utilities.js'),
Feed = require('feed-to-json-promise'),
feed = new Feed(),
feedTask = url => new Task((reject, result) => feed.load(url, { timeout: 10000 }).then(result).catch(reject)),
buildEmbed = curry((source, data) => ({
  "embed": {
    "title": `${data.title}`,
      "url": `${data.link}`,
      "color": 0xeba8c3,
      "thumbnail": {
        "url": ``
      },
      "author": { 
        "name": `${data.author || source}`
      },
      "description": truncate(500, data.description, ''),
  }
})),
rssTransform = source => compose(
  map(buildEmbed(source)),
  take(5),
  prop("items")
),
commonRssTask = curry((source, url, message) => feedTask(url)
  .map(rssTransform(source))
  .fork(console.error, sendEach(message))
),

forkVnExpress = type => commonRssTask('VN Express', `https://vnexpress.net/rss/${type}.rss`),
forkHackernews = commonRssTask('Hackernews', 'https://news.ycombinator.com/rss'),
forkGematsu = commonRssTask('Gematsu', 'https://gematsu.com/feed');

module.exports = { 
  forkVnExpress,
  forkHackernews,
  forkGematsu
}