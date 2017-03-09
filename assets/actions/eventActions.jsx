import firebase from './firebaseInit'

//initialize database
const database = firebase.database()

let eventTable = database.ref("events")

const EventActions = {
	
	eventTable: eventTable,

	get: (target) => {
		return database.ref(target)
	},

	// get all events
	//	callback args: events, keys
	getAllSnapshots: (callback, alternateTable) => {
		let table = alternateTable ? database.ref(alternateTable) : eventTable
		table.on("value", (snapshot) => {
			let collection = snapshot.val();
			callback(collection)
		}, (error) => {
			console.log("Read error:" + error.code);
		});
	},

	// get a specific event ref
	getRef: (eventId, locale, alternateTable) => {
		return database.ref('events/' + locale + "/" + eventId)
	},

	// get snapshot for event value
	getSnapshot: function(eventId, locale, callback) {
		this.getRef(eventId, locale).once('value', (snapshot) => {
			callback(snapshot.val())
		})
	},

	// remove a specific event entry
	// TODO also remove image
	remove: function(eventId, alternateTable) {
		let event = this.getRef(eventId, alternateTable)
		event.remove()
			.then(() => {
				console.log('Removed')
			})
			.catch(() => {
				console.log('Removal failed')
			})
		return event
	},

	// create new event
	//  callback args: didSucceed, event, eventRef
	createEvent: (event, locale, callback, alternateTable) => {
		let table = alternateTable ? database.ref(alternateTable) : database.ref('events/' + locale)
		let ref = table.push()
		ref.set(event, (error) => {
			callback(!error, event, ref)
		})
	}

}

//export all event related functionality as a single object
export default EventActions
