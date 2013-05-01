var express = require('express'),
	jsdom = require('jsdom');

var app = express();

var serve = function (list) {

	app.get('/', function (req, res) {
		res.jsonp(list);
	});

	app.listen(process.env.PORT || 3000);
	console.log('serving on ' + (process.env.PORT || 3000))
};

jsdom.env({
	html: 'http://manchester.techhub.com/events/',
	scripts: ["http://code.jquery.com/jquery.js"],
	done: function (errors, window) {
		var $ = window.$;

		var list = [];
		$('article.card.article.span6.event').each(function() {
			list.push({
				name: $(this).find('.event_title a').html(),
				venue: $(this).find('.event_venue').html(),
				description: $(this).find('.event_description p').last().html().replace(/\n/g, ' ')
			});
		});

		serve(list);
	}
});
