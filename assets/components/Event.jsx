import React from 'react'
import {TableRow} from 'material-ui'

class Event extends React.Component {
	constructor(props) {
		super(props)
		this.showModal = this.showModal.bind(this)
		this.hideModal = this.hideModal.bind(this)
	}
	
	render() {
		return (
			<TableRow>
				<td>{this.props.Event_Name}</td>
				<td>{this.props.Date}</td>
				<td>{this.props.Location}</td>
				<td>{this.props.Short_Description}</td>
			</TableRow>
		)
	}
	
	//populate and display modal event view
	/*showModal() {
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
		leftCol.append($('<img src="' + this.props.Image + '">'))
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
	
	}*/
}

export default Event
