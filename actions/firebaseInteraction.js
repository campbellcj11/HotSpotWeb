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
	var nested = snapshot.val();
	var key = Object.keys(nested)[0];
	var event = nested[key];
	EventTableRendered.addEvent(event, key);
}, function (error) {
	console.log("Read error:" + error.code);
});
