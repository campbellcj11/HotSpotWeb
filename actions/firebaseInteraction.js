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
*/

// key: 'required' / 'optional'
var EventSchema = {
	Event_Name: 'required',
	Location: 'required',
	Date: 'required',
	image: 'required', //TODO update this to capitalized once Conor fixes rest of schema
	Short_Description: 'optional',
	Long_Description: 'optional',
	Email: 'optional',
	Website: 'optional',
	Status: 'optional',
	Category: 'optional'
}

/*Bulk upload*/
if (location.pathname.endsWith('upload.html')) {
	var bulkUploadButton = document.getElementById('bulkUploadBtn');

	bulkUploadButton.addEventListener('change', function(e) {
		if (e.target.files.length !== 1) {
			console.error("Upload exactly one file at a time")
			return
		}
		// TODO, indicate currently selected file and allow for secondary submit button after selection
		// read file in as text
		var file = e.target.files[0]
		var jsonResult;
		var reader = new FileReader()
		reader.onload = function(event) {
			var contents = event.target.result
			// parse csv to json w/ d3
			var jsonResult = d3.csvParse(contents)
			// TODO sanitize events before attempting to push
			// Commit events to db
			var events = database.ref('events')
			for (var i=0; i<jsonResult.length; i++) {
				var potentialEvent = jsonResult[i]
				// simple verification of incoming event
				if (verifyEvent(potentialEvent)) {
					database.ref('events').push(potentialEvent)
				} else {
					//console.error("Invalid event: " + JSON.stringify(potentialEvent, null, '\t'))
				}
			}
		}
		reader.readAsText(file)
	})
}

// simple verification that event matches schema
function verifyEvent(event) {
		// make sure no unexpected props are found
		for (var key in event) {
			if (!EventSchema.hasOwnProperty(key)) {
				console.error('Potential event contains unexpected key: ' + key)
				return false
			}
		}
		// check for specifically required props
		for (var prop in EventSchema) {
			if (EventSchema[prop] === 'required' && !event.hasOwnProperty(prop)) {
				console.error('Potential event is missing the required key: ' + prop)
				return false
			}
		}
		return true
}
