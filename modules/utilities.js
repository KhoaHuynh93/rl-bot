const
{ compose, curry, map, prop, head, replace, toString, forEach, Task } = require('../modules/fp.module.js'),
https = require('https'),

httpGetTask = url => new Task((reject, result) => https.get(url, res => {
	const { statusCode } = res;
	const contentType = res.headers['content-type'];

	let error;
	if (statusCode !== 200) {
		error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
	} else if (!/^application\/json/.test(contentType)) {
		error = new Error('Invalid content-type.\n' + `Expected application/json but received ${contentType}`);
	}
	if (error) { reject(error); res.resume(); return; }

	res.setEncoding('utf8');
	let rawData = '';
	res.on('data', (chunk) => { rawData += chunk; });
  
	res.on('end', () => {
		try {
			result(JSON.parse(rawData));
		} catch (e) {
			reject(e);
		}
	});
}).on('error', reject)),
httpGetRaw = url => new Task((reject, result) => https.get(url, res => {
  const { statusCode } = res;
	const contentType = res.headers['content-type'];
  if(statusCode === 200) {
    result(res.on('data'))
  }
}).on('error', reject)),
stripHTML = replace(/<(?:.|\n)*?>/gm, ''),
forcePlainText = compose(stripHTML, toString),
truncate = curry((length, text, fallbackText) => {
  if (!text) { return fallbackText; } 
  let plainText = forcePlainText(text);
  return (plainText.length > length) ? plainText.substring(0, length) : plainText;
}),
messageSend = curry((message, xs) => message.channel.send(xs)),
sendEach = compose(forEach, messageSend);

module.exports = { 
  messageSend, 
  forcePlainText, 
  truncate, 
  sendEach,
  httpGetTask,
  httpGetRaw
};