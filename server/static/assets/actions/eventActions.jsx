/**
 * Manage event related db interactions
 */
import firebase from './firebaseInit'

//initialize database
const database = firebase.database()

let eventTable = database.ref("events")

const EventActions = {
	//NEW server queries start here
	getLocales: () => {
		return fetch('/admin/locales')
			.then(response => {
				return response.json()
			})
			.catch(error => {
				return error
			})
	},
	// TODO paginate
	getLocaleEvents: id => {
		return fetch('/admin/localeEvents/' + id)
			.then(response => {
				return response.json()
			})
			.catch(error => {
				return error
			})
	},

	getEvent: id => {
		return fetch('/event/' + id)
			.then(response => {
				return response.json()
			})
			.catch(error => {
				return error
			})
	},

	deleteEvent: id => {
		return fetch('/event/' + id, { method: 'DELETE' })
			.then(response => {
				return response.json()
			})
			.catch(error => {
				return error
			})
	},

	updateEvent: (id, modifications) => {
		return fetch('/event/' + id, { 
			method: 'PUT' ,
			body: JSON.stringify(modifications),
			headers: {
				'Content-Type': 'application/json'
			}
		})
			.then(response => {
				return response.json()
			})
			.catch(error => {
				return error
			})
	},

	//OLD firebase functions start here
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

	// create new event
	//  callback args: didSucceed, event, eventRef
	createEvent: (event, locale, callback, alternateTable) => {
		let table = alternateTable ? database.ref(alternateTable) : database.ref('events/' + locale)
		let ref = table.push()
		ref.set(event, (error) => {
			callback(!error, event, ref)
		})
	},

	// move event to new locale
	// create old reference -> delete old reference -> catch errors -> revert changes if an error occurs
	// 	callback args: didSucced: boolean, event, newRef?
	moveEvent: (event, fromLocale, toLocale, callback) => {
		let key = event.key
		delete event.key
		let oldRef = database.ref('events/' + fromLocale + '/' + key)
		let newRef = database.ref('events/' + toLocale + '/' + key)
		newRef.set(event, (error) => {
			if (error) {
				console.log('Failed to create new event')
				callback(!error, event)
			}
			oldRef.remove()
				.then(() => {
					callback(true, event, newRef)
				})
				.catch(() => {
					console.log('Failed to delete old event')
					newRef.remove()
						.then(() => {
							console.log('moveEvent reverted')
							callback(false, event)
						})
						.catch(() => {
							console.log('Failed moveEvent failed to revert')
						})
				})
		})
	},

	// check existing tags for event in db
	getTags: (eventId, callback) => {
		let ref = database.ref('tags/' + eventId)
		ref.on('value', (snapshot) => {
			let tags = []
			snapshot.forEach(child => {
				tags.push(child.key)
			})
			callback(tags, eventId, ref)
		})
	},

	// set tags for event in db
	setTags: (eventId, tagArray, callback) => {
		let object = {}
		tagArray.forEach(function(tag) {
			object[tag] = true
		})
		let ref = database.ref('tags/' + eventId)
		ref.set(object, error => {
			if (callback) {
				callback(!error, tagArray, ref)
			}
		})
	}

}

//export all event related functionality as a single object
export default EventActions

