import firebase from './firebaseInit'

//initialize database
const database = firebase.database()

let eventTable = database.ref("events")

const EventActions = {
	// get all events
	//	callback args: events, keys
	getAll: (callback) => {
		eventTable.on("value", (snapshot) => {
			let collection = snapshot.val();
			callback(collection)
		}, (error) => {
			console.log("Read error:" + error.code);
		});
	},

	// get a specific event ref
	get: (eventId) => {
		return database.ref('events/' + eventId)
	},

	// remove a specific event entry
	// TODO also remove image
	remove: (eventId) => {
		let event = this.get(eventId)
		event.remove()
		return event
	},

	// create new event
	//  callback args: didSucceed, event
	createEvent: (event, callback) => {
		eventTable.push(event, (error) => {
			callback(!error, event)
		})
	}
}

//export all event related functionality as a single object
export default EventActions
