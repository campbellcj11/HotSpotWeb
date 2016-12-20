import firebase from './firebaseInit'

//initialize database
const database = firebase.database()

let eventTable = database.ref("events")

const EventActions = {
	// get all events
	//	callback args: events, keys
	getAllSnapshots: (callback) => {
		eventTable.on("value", (snapshot) => {
			let collection = snapshot.val();
			callback(collection)
		}, (error) => {
			console.log("Read error:" + error.code);
		});
	},

	// get a specific event ref
	getRef: (eventId) => {
		return database.ref('events/' + eventId)
	},

	// get snapshot for event value
	getSnapshot: (eventId, callback) => {
		this.getRef().once('value', (snapshot) => {
			callback(snapshot.val())
		})
	},

	// remove a specific event entry
	// TODO also remove image
	remove: (eventId) => {
		let event = this.getRef(eventId)
		event.remove()
		return event
	},

	// create new event
	//  callback args: didSucceed, event, eventRef
	createEvent: (event, callback) => {
		let ref = eventTable.push()
		ref.set(event, (error) => {
			callback(!error, event, ref)
		})
	}
}

//export all event related functionality as a single object
export default EventActions
