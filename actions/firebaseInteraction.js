// Initialize Firebase
var config = {
	apiKey: "AIzaSyBc6_49WEUZLKCBoR8FFIHAfVjrZasdHlc",
	authDomain: "projectnow-964ba.firebaseapp.com",
	databaseURL: "https://projectnow-964ba.firebaseio.com",
	storageBucket: "projectnow-964ba.appspot.com",
	messagingSenderId: "14798821887"
};

firebase.initializeApp(config);

var database = firebase.database();

var query = database.ref("events");

query.on("value", function(snapshot) {
	var collection = snapshot.val();
	var keys = Object.keys(collection);
	for (var i=0; i<keys.length; i++) {
		var key = keys[i];
		EventTableRendered.addEvent(collection[key], key)
	}
}, function (error) {
	console.log("Read error:" + error.code);
});
