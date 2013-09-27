var path = require('path')
	, store = require('json-store')(path.join(__dirname, '../../../')+'config');
	
module.exports = function(app,App){
	
	app.get('/_db',function(req, res){

		store.load(req.query.id, function(err, data) {
		  // called when the file has been written
		  // to the /path/to/storeage/location/12345.json
		  if (err) throw err; // err if the save failed
			res.json(data);
		});
		
	});
	
	app.delete('/_db',function(req, res){

		store.remove(req.query.id, function(err, data) {
		  // called when the file has been written
		  // to the /path/to/storeage/location/12345.json
		  if (err) throw err; // err if the save failed
			res.json({"response":"ok"});
		});
		
	});
	
	app.post('/_db',function(req, res){	
	
		store.add(req.body, function(err) {
		  // called when the file has been written
		  // to the /path/to/storeage/location/12345.json
		  if (err) throw err; // err if the save failed
			res.json({"response":"ok"});
		});
		
	});
	
	app.options('/_db',function(req, res){	
					
		store.list(function(err, objects) {
		  // called when the file has been written
		  // to the /path/to/storeage/location/12345.json
		  if (err) throw err; // err if the save failed
			res.json(objects);
		});
		
	});
	
};