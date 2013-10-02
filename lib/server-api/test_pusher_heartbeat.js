var Pusher = require('pusher');
var pusher = new Pusher({
  appId: '54725',
  key: '212c3181292b80f4e1a9',
  secret: '4857bb6a46e81f7e29c1'
});


setInterval(function(){
	console.log('ping');
  pusher.trigger('empire_com.mobiltal.service', 'heartbeat@main', {
		"foo": "bar"
	});
},5000);

