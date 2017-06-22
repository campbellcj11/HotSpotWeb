/**
 * Manage event related db interactions
 */
import firebase from './firebaseInit'

//initialize database
const database = firebase.database()

let eventTable = database.ref("events")

const EventActions = {
	// Event related server queries start here
	// TODO consider removing catch statements here and letting them be always handled externally
	getLocales: () => {
		return fetch('/locales')
			.then(response => {
				return response.json()
			})
			.catch(error => {
				return error
			})
	},

	getEvents: queryJson => {
		return fetch('/getEvents', {
			method: 'POST',
			body: JSON.stringify(queryJson),
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

	createEvent: event => {
		return fetch('/createEvent', {
			method: 'POST',
			body: JSON.stringify(event),
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
	}
}

//export all event related functionality as a single object
export default EventActions

