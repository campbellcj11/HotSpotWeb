import firebase from './firebaseInit'

//initialize storage
const storage = firebase.storage()

const StorageActions = {
    // Upload an Event Image and provide its URL to the callback function
    uploadEventImage: (file, callback) => {
        let imageDestination = storage.ref('EventImages/' + generateBase64String(20) + '.jpg')
        imageDestination.put(file).then(snapshot => {
            let fileLocation = snapshot.a.downloadURLs[0]
            callback(fileLocation)
        })
    }
}

// auxiliary function to uploading images
let generateBase64String = (length) => {
	let text = ""
	let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

	for (let i=0; i < length; i++) {
		text += chars.charAt(Math.floor(Math.random() * chars.length))
	}
	return text
}

//export all event related functionality as a single object
export default StorageActions
