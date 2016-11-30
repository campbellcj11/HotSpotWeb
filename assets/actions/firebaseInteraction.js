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
			uploader.val. ue = percentage;
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
	Address: 'required',
	Date: 'required',
	Image: 'optional',
	Latitude: 'optional',
	Longitude: 'optional',
	Short_Description: 'required',
	Long_Description: 'optional',
	Email: 'optional',
	Website: 'optional',
	Status: 'optional',
	Tags: 'optional',
	State: 'optional',
	County: 'optional',
	Event_Type: 'optional',
	Event_Contact: 'optional',
	Phone_Number: 'optional',
	Price: 'optional'
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
		document.querySelector('#selectedFileName').innerHTML = file.name
		
		var reader = new FileReader()
		var previewBtn = document.querySelector('#previewBtn')
		var uploadBtn = document.querySelector('#uploadBtn')
		var alertArea = document.querySelector('#alerts')
		previewBtn.disabled = false
		previewBtn.onclick = function() {
			reader.readAsText(file)
			hideAlert(alertArea)
		}
		
		var jsonResult;
		var brokenImages;
		reader.onload = function(event) {
			var contents = event.target.result
			// parse csv to json w/ d3
			jsonResult = d3.csvParse(contents)
			
			console.log(jsonResult)
						
			// verify events and populate table
			for (var i=0; i<jsonResult.length; i++) {
				if (verifyEvent(jsonResult[i])) {
					jsonResult[i].previewMode = true
					EventPreviewTableRendered.addEvent(jsonResult[i], i)
				} else {
					previewBtn.disabled = true
					showWarning(alertArea, 'Invalid event: ' +  JSON.stringify(jsonResult[i]).substring(0, 50) + '...')
					console.error("Invalid event: " + JSON.stringify(jsonResult[i], null, '\t'))
					return
				}
			}
			
			// Enable upload btn
			uploadBtn.disabled = false
			
			// verify image sources
			brokenImages = []
			for (var i=0; i<jsonResult.length; i++) {
				verifyImage(jsonResult[i].Image, (function(event, index, broken, verified) {
					if (!verified) {
						broken.push(index)
						console.log('Image not found for event ' + JSON.stringify(event, null, '\t'))
						showWarning(alertArea, 'Image not found for events ' + JSON.stringify(broken.sort()))
						if (broken.length === jsonResult.length) {
							uploadBtn.disabled = true
							showWarning(alertArea, 'All images were not found')
						}
					}
				}).bind(this, jsonResult[i], i, brokenImages))
			}
			
		}
		
		uploadBtn.onclick = function() {
			// Upload images to firebase
			for (var i=0; i<jsonResult.length; i++) {
				if (brokenImages.indexOf(i) == -1) {
					retrieveFile(jsonResult[i].Image, (function (file) {
							var imageDestination = firebase.storage().ref('EventImages/' + generateBase64String(20) + '.jpg')
							imageDestination.put(file).then((function(snapshot) {
								var fileLocation = snapshot.a.downloadURLs[0]
								this.Image = fileLocation
								delete this.previewMode
								database.ref('events').push(this, (function(error) {
									if (!error) {
										showAlert(alertArea, 'Successfully uploaded: ' + JSON.stringify(this).substring(0, 50))
										console.log('Successfully uploaded: ' + JSON.stringify(this))
									}
								}).bind(this))
							}).bind(this))
						}).bind(jsonResult[i])
					)
				}
			}
		}
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


function retrieveFile(imgUrl, callback) {
	var c = document.createElement('canvas')
	//document.body.appendChild(c)
	var img = document.createElement('img')
	img.style.position = 'absolute'
	img.style.left = -10000
	img.crossOrigin = 'Anonymous'
	document.body.appendChild(img)
	var ctx = c.getContext('2d')
	img.onload = function() {
		c.height = img.naturalHeight
		c.width = img.naturalWidth
		ctx.drawImage(img, 0, 0)
		c.toBlob(function(blob) {
			//document.body.removeChild(c)
			callback(blob)
		}, 'image/jpeg', 0.8)
		//document.body.removeChild(img)
	}
	img.src = imgUrl
}

function verifyImage(imgUrl, callback) {
	var img = document.createElement('img')
	img.crossOrigin = 'Anonymous'
	img.onload = function() {
		callback(true)
	}
	img.onerror = function() {
		console.error('Failed to load image from: ' + imgUrl)
		callback(false)
	}
	img.src = imgUrl
}

function generateBase64String(length) {
	var text = "";
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < length; i++ ) {
		text += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return text;
}

function showWarning(alerts, text) {
	alerts.style.display = ""
	alerts.className = 'alert alert-danger'
	alerts.innerHTML = text
}

function hideAlert() {
	alerts.style.display = ""
}

function showAlert(alerts, text) {
	alerts.style.display = ""
	alerts.className = 'alert alert-success'
	alerts.innerHTML = text
}
