/**
 * Modified event table that draws its events from the event approvalQueue
 * in firebase that are awaiting administrator approval.
 */

import React from 'react'
import {
	Table,
	TableBody,
	TableHeader,
	TableHeaderColumn,
	TableRow,
	TableRowColumn,
	CircularProgress,
	Card,
	CardTitle
} from 'material-ui';
import EventActions from '../actions/eventActions'
import {State} from './ApplicationState'
import {global as globalStyles} from '../Styles'

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

class EventApprovalTable extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			events: [],
			loading: true
		}

		this.mode = 'pending'

		this.addEvent.bind(this)
		this.removeEvent.bind(this)
	}
	
	componentDidMount() {
		this.loadEvents.call(this, this.props)
	}

	componentWillReceiveProps(nextProps) {
		this.mode = this.props.router.location.query.mode || 'pending'
		this.setState({
			loading: true
		})
		this.loadEvents.call(this)
	}

	loadEvents(props) {
        EventActions.getAllSnapshots((function(collection) {
            let eventArray = []
            Object.keys(collection).forEach((key, index) => {
                let event = collection[key]
                event.key = key
				if (event.approvalStatus !== 'approved' && event.approvalStatus !== 'denied') {
					eventArray.push(event)
				}
            })
            this.addEventArray(eventArray)
        }).bind(this), 'approvalQueue')
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
		State.router.push({
			pathname: 'edit',
			query: {
				id: event.key,
				pending: true,
			},
			state: event
		})
	}

	render() {	
		let screenWidth = State.get('screenWidth')
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
						{screenWidth == 'large' && <TableRowColumn>{event.Location}</TableRowColumn>}
						{screenWidth == 'large' && <TableRowColumn>{event.Address}</TableRowColumn>}
						{screenWidth == 'large' && <TableRowColumn>{event.Short_Description}</TableRowColumn>}
					</TableRow>
				)
			})
		
			//TODO reenable multiSelectable and selectAll
			return (
				<Card style={globalStyles.content[screenWidth]}>
					<CardTitle
						title="Pending Events"
						subtitle="Manage pending user submitted events" />
					<Table multiSelectable={false} onRowSelection={this.handleRowSelection.bind(this)}>
						<TableHeader enableSelectAll={false} displaySelectAll={!this.props.potentialEvents}>
							<TableRow>
								<TableHeaderColumn>Event Name</TableHeaderColumn>
								<TableHeaderColumn>Date</TableHeaderColumn>
								{screenWidth == 'large' && <TableHeaderColumn>Location</TableHeaderColumn>}
								{screenWidth == 'large' && <TableHeaderColumn>Address</TableHeaderColumn>}
								{screenWidth == 'large' && <TableHeaderColumn>Description</TableHeaderColumn>}
							</TableRow>
						</TableHeader>
						<TableBody displayRowCheckbox={!this.props.potentialEvents}>
							{rows}
						</TableBody>
					</Table>
				</Card>
			)
		} else {
			return null
		}
	}
}

export default EventApprovalTable
