import React from 'react'
import {
	Table,
	TableBody,
	TableHeader,
	TableHeaderColumn,
	TableRow,
	TableRowColumn
} from 'material-ui';
import EventActions from '../actions/eventActions'

class EventTable extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			events: []
		}

		this.addEvent.bind(this)
		this.removeEvent.bind(this)
	}
	
	componentDidMount() {
		if (this.props.loadAll) {
			EventActions.getAll((function(collection) {
				let eventArray = []
				Object.keys(collection).forEach((key, index) => {
					let event = collection[key]
					event.key = key
					eventArray.push(event)
				})
				this.addEventArray(eventArray)
			}).bind(this))
		} else if (this.props.potentialEvents) {
			this.addEventArray(this.props.potentialEvents)
		}
	}
	
	render() {	
		if (this.state.events.length) {
			let rows = []
			this.state.events.forEach((event, index) => {
				rows.push(
					<TableRow key={event.key}>
						<TableRowColumn>{event.Event_Name}</TableRowColumn>
						<TableRowColumn>{event.Date}</TableRowColumn>
						{this.props.screenWidth == 'large' && <TableRowColumn>{event.Location}</TableRowColumn>}
						{this.props.screenWidth == 'large' && <TableRowColumn>{event.Address}</TableRowColumn>}
						{this.props.screenWidth == 'large' && <TableRowColumn>{event.Short_Description}</TableRowColumn>}
					</TableRow>
				)
			})
		
			return (
				<Table multiSelectable={true} >
					<TableHeader enableSelectAll={true} displaySelectAll={!this.props.potentialEvents}>
						<TableRow>
							<TableHeaderColumn>Event Name</TableHeaderColumn>
							<TableHeaderColumn>Date</TableHeaderColumn>
							{this.props.screenWidth == 'large' && <TableHeaderColumn>Location</TableHeaderColumn>}
							{this.props.screenWidth == 'large' && <TableHeaderColumn>Address</TableHeaderColumn>}
							{this.props.screenWidth == 'large' && <TableHeaderColumn>Description</TableHeaderColumn>}
						</TableRow>
					</TableHeader>
					<TableBody displayRowCheckbox={!this.props.potentialEvents}>
						{rows}
					</TableBody>
				</Table>
			)
		} else {
			return null
		}
	}
	
	addEventArray(eventArray) {
		this.setState({
			events: eventArray
		})
	}
	
	addEvent(event, key) {
		event.key = key
		this.setState({
			events: this.state.events.concat(event)
		})
	}
	
	removeEvent(event) {
	
	}
}

export default EventTable
