module.exports = function(app,App) {
	
	app.use(function(req, res, next){
		res.render('404', {title: "404 - Page Not Found", showFullNav: false, status: 404, url: req.url });
	});
	
	
	// error-handling middleware, take the same form
	// as regular middleware, however they require an
	// arity of 4, aka the signature (err, req, res, next).
	// when connect has an error, it will invoke ONLY error-handling
	// middleware.

	// If we were to next() here any remaining non-error-handling
	// middleware would then be executed, or if we next(err) to
	// continue passing the error, only error-handling middleware
	// would remain being executed, however here
	// we simply respond with an error page.
	
	app.get('/404', function(req, res, next){
	  // trigger a 404 since no other middleware
	  // will match /404 after this one, and we're not
	  // responding here
	  next();
	});
	
	app.get('/403', function(req, res, next){
	  // trigger a 403 error
	  var err = new Error('not allowed!');
	  err.status = 403;
	  next(err);
	});

	app.get('/500', function(req, res, next){
	  // trigger a generic (500) error
	  next(new Error('keyboard cat!'));
	});
	
}