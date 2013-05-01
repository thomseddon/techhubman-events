var express = require('express'),
	jsdom = require('jsdom');

var list = [],
	timeout = 60 * 60 * 1000; // An hour in ms

var refresh = function () {
	console.log('refreshing...');
	var start = new Date();

	jsdom.env({
		html: 'http://manchester.techhub.com/events/',
		scripts: ["http://code.jquery.com/jquery.js"],
		done: function (errors, window) {
			var $ = window.$,
				newList = [];

			$('article.card.article.span6.event').each(function () {
				var $this = $(this);
				newList.push({
					name: $this.find('.event_title a').html(),
					venue: $this.find('.event_venue').html(),
					description: $this.find('.event_description p').last().html().replace(/\n/g, ' ')
				});
			});

			// Atomic update
			list = newList;

			console.log('refresh done, took', ((+new Date() - +start) / 1000) + ' secs');
		}
	});
};

// Serve
var app = express();

app.get('/', function (req, res) {
	// You get stale data by default (waiting for new data is too slow)
	res.jsonp(list);
});


app.listen(process.env.PORT || 3000, function () {
	console.log('serving on http://127.0.0.1:' + this.address().port);

	// Schedule background updating every hour
	setTimeout(refresh, timeout);

	// Run one now to kick things off
	refresh();
});
