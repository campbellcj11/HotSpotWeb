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

// get events for events.html
if (location.pathname.endsWith('events.html')) {
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
}



/*Storage*/

/*
//upload photo to firebase storage
// Get elements
var uploader = document.getElementById('uploader');
var fileButton = document.getElementById('fileButton');

//listen for file selection
fileButton.addEventListener('change', function(e){
	//get file
	var file = e.target.files[0];

	//create a storage ref
	var storageRef = firebase.storage().ref('folder_name/' + file.name);

	//upload file
	var task = storageRef.put(file);

	//update progrss bar
	task.on('state_changed',

		function progrss(snapshot){
			var percentage = (snapshot.bytesTransferred / snapshot.totalbytes) * 100;
			uploader.value = percentage;
		},

		function error(err){

		}
		function complete(){

		}

  );

});


//Download photo
var storageRef = firebase.storage.ref("folderName/file.jpg");
storageRef.getDownloadURL().then(function(url) {
  console.log(url);
});




/*db*/
/*
var bulkUploadButton = document.getElementById('bulkUploadButton');

bulkUploadButton.addEventListener('change', function(e){

	var JSONItems = [];
	d3.csv( e, function( data){
	  JSONItems = data;
	});

	for(i = 0; i < JSONItems.length; i++)
	{
		var event = JSONItems[i];
		export function pushEvent(event) {
		  database.ref('events/').push(event));
		  return {
		    type: LOG_IN,
		    currentUser: firebase.auth().currentUser
		  }
		}

	}
}
*/
