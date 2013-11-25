module.exports = function (err, req, res, next) {
	console.log(req);
   if (err) {
			console.log(err);
			
     res.send('Something went wrong user');
     console.log(err.error);
   } else {
		next();
	}
};