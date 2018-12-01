const
http = require('http'),
express = require('express'),
expressServerRun = () => {
	const app = express();
	app.get("/", (request, response) => { response.sendStatus(200); });
	app.listen(process.env.PORT);
	setInterval(() => { http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`); }, 280000);
}

module.exports = { expressServerRun }
