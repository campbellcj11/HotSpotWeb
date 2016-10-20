import React from 'react'
import {render} from 'react-dom'

class EventTable extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			events: []
		}
		this.addEvent.bind(this)
	}
	
	render() {	
		return (
			<table className="table table-striped table-hover">
				<thead>
					<tr>
						<th>Title</th><th>Start Date</th><th>End Date</th><th>Short Description</th><th>Long Description</th><th>Photo</th><th>Video</th>
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
			events: this.state.events.concat(<Event title={event.title}
													startDate={event.startDate}
													endDate={event.endDate}
													shortDescription={event.shortDescription}
													longDescription={event.longDescription}
													photo={event.photo}
													video={event.video}
													key={key} />)
		})
	}
}

class Event extends React.Component {
	render() {
		return (
			<tr>
				<td>{this.props.title}</td><td>{this.props.startDate}</td><td>{this.props.endDate}</td>
				<td>{this.props.shortDescription}</td><td>{this.props.longDescription}</td><td>{this.props.photo}</td><td>{this.props.video}</td>
			</tr>
		)
	}
}

window.EventTableRendered = render(<EventTable/>, document.getElementById('table'))
