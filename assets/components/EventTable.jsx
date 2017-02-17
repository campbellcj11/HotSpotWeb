import React from 'react'
import {
	Table,
	TableBody,
	TableHeader,
	TableHeaderColumn,
	TableRow,
	TableRowColumn,
	CircularProgress
} from 'material-ui';
import EventActions from '../actions/eventActions'
import {State} from './ApplicationState'

const styles = {
	progressContainer: {
        width: '100%',
        position: 'relative'
    },
    loadIndicator: {
        marginLeft: '50%',
        left: '-20px',
    }
}

class EventTable extends React.Component {
	constructor(props) {
		super(props)
		
		this.state = {
			events: [],
			loading: true
		}

		this.addEvent.bind(this)
		this.removeEvent.bind(this)
	}

	componentDidMount() {
		this.loadEvents.call(this, this.props)
	}

	/*componentWillReceiveProps(nextProps) {
		if (nextProps.mode != this.props.mode) {
			this.setState({
				loading: true
			})
			this.loadEvents.call(this, nextProps)
		}
	}*/

	loadEvents(props) {
		if (props.mode == 'potential') {
			this.addEventArray(this.props.potentialEvents)
		} else {
			EventActions.eventTable.orderByChild('Date').limitToLast(50).on('value', (snapshot) => {
					let eventArray = []
					snapshot.forEach((child) => {
						let event = child.val()
						event.key = child.key
						eventArray.unshift(event)
					})
					this.addEventArray(eventArray)
					console.log(eventArray.length + ' events found')
				}, (error) => {
					console.log("Read error:" + error.code);
			})
		}
	}

	addEventArray(eventArray) {
		this.setState({
			events: eventArray,
			loading: false
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

	handleRowSelection(selectedRows) {
		let index = selectedRows[0]
		let event = this.state.events[index]
		State.set({
			view: 'individual_edit',
			viewParams: {
				event: event
			}
		})
	}

	render() {	
		if (!this.props.potentialEvents && this.state.loading) {
			return (
				<div style={styles.progressContainer}>
                    <CircularProgress
                        size={40}
                        style={styles.loadIndicator} />
                </div>
			)
		}
		if (this.state.events.length) {
			let rows = []
			this.state.events.forEach((event, index) => {
				var d = new Date(event.Date)
				rows.push(
					<TableRow key={event.key}>
						<TableRowColumn>{event.Event_Name}</TableRowColumn>
						<TableRowColumn>{d.toLocaleDateString() + ' ' + d.toLocaleTimeString()}</TableRowColumn>
						{this.props.screenWidth == 'large' && <TableRowColumn>{event.Location}</TableRowColumn>}
						{this.props.screenWidth == 'large' && <TableRowColumn>{event.Address}</TableRowColumn>}
						{this.props.screenWidth == 'large' && <TableRowColumn>{event.Short_Description}</TableRowColumn>}
					</TableRow>
				)
			})
		
			//TODO reenable multiSelectable and selectAll
			return (
				<Table multiSelectable={false} onRowSelection={this.handleRowSelection.bind(this)}>
					<TableHeader enableSelectAll={false} displaySelectAll={!this.props.potentialEvents}>
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
}

export default EventTable
