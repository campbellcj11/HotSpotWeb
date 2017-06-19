/**
 * Retrieve and display all current events for a locale in firbase +
 * the basic attributes about those events.
 * The locale is accepted as a URL query parameter
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

class EventTable extends React.Component {
	constructor(props) {
		super(props)
		
		this.state = {
			events: [],
			loading: true
		}

		if (this.props.router) {
			this.mode = this.props.router.location.query.mode || 'manage'
		} else {
			this.mode = 'potential'
		}
	}

	componentDidMount() {
		this.loadEvents.call(this)
	}

	componentWillReceiveProps(nextProps) {
		this.mode = this.props.router.location.query.mode || 'manage'
		this.setState({
			loading: true,
			locale: this.props.router.location.query.l
		})
		this.loadEvents.call(this)
	}

	loadEvents() {
		if (this.mode == 'potential') {
			this.addEventArray(this.props.potentialEvents)
		} else {
			EventActions.getLocaleEvents(this.props.router.location.query.l)
				.then(events => {
					this.addEventArray(events)
				})
				.catch(error => {
					console.log(error)
				})
		}
	}

	addEventArray(eventArray) {
		this.setState({
			events: eventArray,
			loading: false
		})
	}

	handleRowSelection(selectedRows) {
		/*let index = selectedRows[0]
		let event = this.state.events[index]
		State.router.push({
			pathname: 'edit',
			query: {
				id: event.key,
				l: this.state.locale
			},
			state: event
		})*/
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
				var d = new Date(event.start_date)
				rows.push(
					<TableRow key={event.id}>
						<TableRowColumn>{event.name}</TableRowColumn>
						<TableRowColumn>{d.toLocaleDateString() + ' ' + d.toLocaleTimeString()}</TableRowColumn>
						{screenWidth == 'large' && <TableRowColumn>{event.venue_name}</TableRowColumn>}
						{screenWidth == 'large' && <TableRowColumn>{event.address}</TableRowColumn>}
						{screenWidth == 'large' && <TableRowColumn>{event.short_description}</TableRowColumn>}
					</TableRow>
				)
			})
		
			//TODO reenable multiSelectable and selectAll
			return (
				<Card style={globalStyles.content[screenWidth]}>
					{!this.props.potentialEvents && (<CardTitle
						title="Manage Events"
						subtitle="View and edit pre-existing events" />
					)}
					<Table multiSelectable={false} onRowSelection={this.handleRowSelection.bind(this)}>
						<TableHeader enableSelectAll={false} displaySelectAll={!this.props.potentialEvents}>
							<TableRow>
								<TableHeaderColumn>Event Name</TableHeaderColumn>
								<TableHeaderColumn>Start Date</TableHeaderColumn>
								{screenWidth == 'large' && <TableHeaderColumn>Venue</TableHeaderColumn>}
								{screenWidth == 'large' && <TableHeaderColumn>Address</TableHeaderColumn>}
								{screenWidth == 'large' && <TableHeaderColumn>Short Description</TableHeaderColumn>}
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

export default EventTable
