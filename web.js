var express = require('express'),
	cheerio = require('cheerio'),
	request = require('request'),
	rss = require('rss'),
	ical = require('ical-generator');

var list = [],
	feed = '',
	icalFeed = false,
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

	var newIcalFeed = ical();
	newIcalFeed.setDomain('http://techhubmanevents.herokuapp.com/ical');

	list.forEach(function (item) {
		newFeed.item({
			title: item.title,
			description: item.description,
			url: item.url,
			date: item.date
		});

		newIcalFeed.addEvent({
			summary: item.title,
			description: item.description,
			url: item.url,
			start: item.date,
			end: new Date(+item.date + 3600000)
		});
	});

	feed = newFeed.xml();
	icalFeed = newIcalFeed;
};

var refresh = function () {
	console.log('refreshing...');
	var start = new Date();

	request('http://manchester.techhub.com/events/', function (err, res, body) {
		var $ = cheerio.load(body),
			list = [];

		$('.card.span6').each(function () {
			var $this = $(this),
				title = $this.find('h2.title a');
			list.push({
				title: title.html(),
				venue: $this.find('.event_meta').html().replace(/^\d+:\d+(a|p)m,\s+/, ''),
				description: $this.find('.excerpt').last().html().replace(/\n/g, ' ').replace(/^\s+|\s+$/g, ''),
				url: title.attr('href'),
				date: new Date($this.find('time.datestamp').attr('datetime'))
			});
		});

		// Atomic update
		update(list);

		console.log('refresh done, took', ((+new Date() - +start) / 1000) + ' secs');
	});
};

// Serve
var app = express();

app.get('/', function (req, res) {
	res.send('<h1>TechHub Manchester Events as: <a href="/json">JSON</a>, <a href="/rss">RSS</a> and <a href="/ical">iCal</a></h1>');
});

app.get('/json', function (req, res) {
	res.jsonp(list);
});

app.get('/rss', function (req, res) {
	res.setHeader('Content-Type', 'application/rss+xml');
	res.send(feed);
});

app.get('/ical', function (req, res) {
	if (!icalFeed) return res.send('waiting...');
	icalFeed.serve(res);
});

app.listen(process.env.PORT || 3000, function () {
	console.log('serving on http://127.0.0.1:' + this.address().port);

	// Schedule background updating every hour
	setInterval(refresh, timeout);

	// Run one now to kick things off
	refresh();
});
