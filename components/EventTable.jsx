import React from 'react'
import Event from './Event'

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
													Image={event.Image}
													previewMode={event.previewMode}
													key={key} />)
		})
	}
	
	removeEvent(event) {
	
	}
}

export default EventTable
