
var google = require('../controllers/google');
var url = require('url');


var title = "Extreme Cities";

exports.post = function(req, res){

}

exports.put = function(req, res){
	
}
exports.delete = function(req, res){
	
}
exports.get = function(req, res){
	console.log('extreme-cities::router.js::get()');

	var url_parts = url.parse(req.url, true);
	var url_array = url_parts.pathname.split('/');//gets rid of the preceding empty string

	console.log('url_array: ');
	console.dir(url_array);

	
	switch(url_array[1]){
		case 'admin':
			switch(url_array[2]){
				case 'reset':
					google.resetFromGoogleSpreadsheet(req, res);
					break;
				case 'log':
					google.logAll(req, res);
					break;
				case 'cacheimages':
					google.recacheImages(req, res);
					break;
				case 'arrayqualities':
					//google.convertQualities(req, res);
					break;
			}
			break;

			
		case 'api':
			switch(url_array[2]){
				case 'post':
					google.getPost(req, res, url_array[3]);
					break;
				case 'posts':
					google.getPosts(req, res, url_array[3]);
					break;
				case 'scrollratios':
					//getScrollRatio(req, res, screen, total);
					google.getScrollRatio(req, res, url_array[3], url_array[4]);
					break;
			}
			break;


		case 'about':
			switch(url_array[2]){
				case 'credits':
					res.render('about/credits', {title: title});
					break;
				case 'photos':
					res.render('about/photos', {title: title});
					break;
				default:
					res.render('about', {title: title});
					break;
			}
			break;
			

		case 'building-megalopolis':
			res.render('building-megalopolis', {title: title});
			break;

		case 'hypotheses':
			res.render('hypotheses', {title: title});
			break;

			
		default:
			google.renderTimeline(req, res);
			break;
	}
};