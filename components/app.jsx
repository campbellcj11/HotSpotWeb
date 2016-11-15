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
		let modal = $('#event-modal')
		
		let title = modal.find('.modal-title')
		let body = modal.find('.modal-body')
		
		title.text(this.props.Event_Name)
		body.empty()
		let row = $('<div class="row">')
		let leftCol = $('<div class="col-md-2">')
		let midCol = $('<div class="col-md-1">')
		let rightCol = $('<div class="col-md-9">')
		leftCol.append($('<img src="' + this.props.image + '">'))
		midCol.append($('<p style="text-align:right">Location:</p>'))
		rightCol.append($('<p>' + this.props.Location + '</p>'))
		midCol.append($('<p style="text-align:right">Date:</p>'))
		rightCol.append($('<p>' + this.props.Date + '</p>'))
		row.append(leftCol)
		row.append(midCol)
		row.append(rightCol)
		body.append(row)
		
		// display
		$(modal).modal('show')
	}
	
	//hide modal event view
	hideModal() {
		$('#event-modal').modal('hide')
	}
	
	//save changes from modal editor
	saveChanges() {
	
	}
}

if (location.pathname.endsWith('events.html')) {
	window.EventTableRendered = render(<EventTable/>, document.getElementById('table'))
}
