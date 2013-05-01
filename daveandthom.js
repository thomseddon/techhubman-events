var express = require('express');

var app = express();

app.get('/', function (req, res) {
	res.json([{
		"name": "MancJS",
		"venue": "TechHub",
		"details": "..."
	}]);
});

app.listen(process.env.PORT || 3000);
