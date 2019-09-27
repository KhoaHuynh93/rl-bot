const 
{ compose, curry, prop, map, forEach } = require('../modules/fp.module.js'),
{ httpGetTask, messageSend, sendEach } = require('../modules/utilities.js'),
key = '6768f2fa758a4af7a6a32912182512',
defaultRange = 7,
weatherTask = day => httpGetTask(`https://api.apixu.com/v1/forecast.json?key=${key}&q=saigon&days=${ day || defaultRange }`),
                                                                                                     
normalEmbed = data => ({
  "embed": {
    "title": `Current weather - ${data.last_updated}`,
    "description": data.condition.text,
    "color": 5273500,
    "thumbnail": {
      "url": `https:${data.condition.icon}`
    },
    "fields": [
      {
        "name": "Temperature",
        "value": `${data.temp_c} C`
      }
    ]
  }
}),
forecastEmbed = data => ({
  "embed": {
    "title": `Forecast weather - ${data.date}`,
    "description": data.day.condition.text,
    "color": 5273500,
    "thumbnail": {
      "url": `https:${data.day.condition.icon}`
    },
    "fields": [
      {
        "name": "Temperature",
        "value": `${data.day.mintemp_c} C to ${data.day.maxtemp_c} C`
      }
    ]
  }
}),

currentWeatherTask = weatherTask()
.map(prop('current'))
.map(normalEmbed),
      
forecastWeatherTask = day => weatherTask(day)
.map(prop('forecast'))
.map(prop('forecastday'))
.map(map(forecastEmbed)),


forkWeatherCurrent = message => currentWeatherTask.fork(console.error, messageSend(message)),
forkWeatherForecast = curry((message, day) => forecastWeatherTask(day).fork(console.error, sendEach(message)));

module.exports = {
  forkWeatherCurrent,
  forkWeatherForecast
};