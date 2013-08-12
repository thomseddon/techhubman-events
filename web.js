var express = require('express'),
	jsdom = require('jsdom'),
	rss = require('rss');

var list = [],
	feed = '',
	timeout = 60 * 60 * 1000; // An hour in ms

var update = function (newList) {
	// Atomic update
	list = newList;

	var newFeed = new rss({
		title: 'TechHub Manchester Events',
		description: 'TechHub Manchester Events',
		feed_url: 'http://techhubmanevents.herokuapp.com/rss',
		site_url: 'http://manchester.techhub.com/events',
		author: 'TechHub Manchester'
	});

	list.forEach(function (item) {
		newFeed.item({
			title: item.title,
			description: item.description,
			url: item.url,
			date: item.date
		});
	});

	feed = newFeed.xml();
};

var refresh = function () {
	console.log('refreshing...');
	var start = new Date();

	jsdom.env({
		html: 'http://manchester.techhub.com/events/',
		scripts: ["http://code.jquery.com/jquery.js"],
		done: function (errors, window) {
			var $ = window.$,
				list = [];

			$('.card.span6').each(function () {
				var $this = $(this),
					title = $this.find('h2.title a');
				list.push({
					title: title.html(),
					venue: $this.find('.event_meta').html().replace(/^\d+:\d+(a|p)m,\s+/, ''),
					description: $.trim($this.find('.excerpt').last().html().replace(/\n/g, ' ')),
					url: title.attr('href'),
					date: new Date($this.find('time.datestamp').attr('datetime'))
				});
			});

			// Atomic update
			update(list);

			console.log('refresh done, took', ((+new Date() - +start) / 1000) + ' secs');
		}
	});
};

// Serve
var app = express();

app.get('/', function (req, res) {
	res.send('<h1>TechHub Manchester Events as: <a href="/json">JSON</a> and <a href="/rss">RSS</a></h1>');
});

app.get('/json', function (req, res) {
	res.jsonp(list);
});

app.get('/rss', function (req, res) {
	res.setHeader('Content-Type', 'application/rss+xml');
	res.send(feed);
});

app.listen(process.env.PORT || 3000, function () {
	console.log('serving on http://127.0.0.1:' + this.address().port);

	// Schedule background updating every hour
	setInterval(refresh, timeout);

	// Run one now to kick things off
	refresh();
});
