import firebase from './firebaseInit'

//initialize database
const database = firebase.database()

let eventTable = database.ref("events")

const EventActions = {
	
	eventTable: eventTable,
	
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
	getRef: (eventId, alternateTable) => {
		let tableName = alternateTable || 'events'
		return database.ref(tableName + '/' + eventId)
	},

	// get snapshot for event value
	getSnapshot: (eventId, callback, alternateTable) => {
		this.getRef(eventId, alternateTable).once('value', (snapshot) => {
			callback(snapshot.val())
		})
	},

	// remove a specific event entry
	// TODO also remove image
	remove: (eventId, alternateTable) => {
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
	createEvent: (event, callback, alternateTable) => {
		let table = alternateTable ? database.ref(alternateTable) : eventTable
		let ref = table.push()
		ref.set(event, (error) => {
			callback(!error, event, ref)
		})
	}

}

//export all event related functionality as a single object
export default EventActions
