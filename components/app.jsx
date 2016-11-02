import React from 'react'
import {render} from 'react-dom'

class EventTable extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			events: []
		}
		this.addEvent.bind(this)
		this.removeEvent.bind(this)
	}
	
	render() {	
		return (
			<table className="table table-striped table-hover">
				<thead>
					<tr>
						<th>Event Name</th>
						<th>Date</th>
						<th>Location</th>
						<th>Image</th>
					</tr>
				</thead>
				<tbody>
				{this.state.events}
				</tbody>
			</table>
		)
	}
	
	addEvent(event, key) {
		this.setState({
			events: this.state.events.concat(<Event 
													Event_Name={event.Event_Name}
													Date={event.Date}
													Location={event.Location}
													image={event.image}
													key={key} />)
		})
	}
	
	removeEvent(event) {
	
	}
}

class Event extends React.Component {
	constructor(props) {
		super(props)
		this.showModal = this.showModal.bind(this)
		this.hideModal = this.hideModal.bind(this)
	}
	
	render() {
		return (
			<tr onClick={this.showModal}>
				<td>{this.props.Event_Name}</td>
				<td>{this.props.Date}</td>
				<td>{this.props.Location}</td>
				<td><img src={this.props.image}></img></td>
			</tr>
		)
	}
	
	//populate and display modal event view
	showModal() {
		// populate
		let modal = document.querySelector('#event-modal')
		
		let title = modal.querySelector('.modal-title')
		let body = $(body)
		
		title.innerHTML = this.props.Event_Name
		body.empty()
		let row = $('<div class="row">')
		let leftCol
		body.append($('<img src="' + this.props.image + '">'))
		
		// display
		showModal(modal)
	}
	
	//hide modal event view
	hideModal() {
		let modal = document.querySelector('#event-modal')
		hideModal(modal)
	}
	
	//save changes from modal editor
	saveChanges() {
	
	}
}

window.EventTableRendered = render(<EventTable/>, document.getElementById('table'))
