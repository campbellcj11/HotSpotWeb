/**
 * Main component loaded by app.jsx
 * Manages single page application and coordinates with ApplicationState
 */
import React, {Component} from 'react'
// MUI
import {
	Dialog,
	RaisedButton,
	FlatButton,
	Drawer,
	MenuItem,
	Card,
	CardHeader,
	CardTitle
} from 'material-ui'
import AppBarWithDrawer from './AppBarWithDrawer'
import {blueA400} from 'material-ui/styles/colors'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
// First Party
import EventTable from './EventTable'
import EventApprovalTable from './EventApprovalTable'
import UploadForm from './UploadForm'
import EventEditor from './EventEditor'
import EventCreator from './EventCreator'
import Login from './Login'
import {State} from './ApplicationState'

const styles = {
	content: {
		large: {
			margin: '5px 10px 5px 266px'
		},
		medium: {
			margin: '5px 10px'
		},
		small: {
			margin: '5px 10px'
		},
		edit: {
			large: {
				margin: '5px 50px 5px 316px',
				maxWidth: '600px',
				minWidth: '400px'
			},
			medium: {
				margin: '5px 50px 5px 50px',
				maxWidth: '600px',
				minWidth: '400px'
			},
			small: {
				margin: '5px 10px'
			}
		}
	}
}

class Main extends Component {
	constructor(props, context) {
		super(props, context)
		
		let view = this.parseURL()

		this.state = {
			logged_in: false,
			currentUser: null,
			width: window.innerWidth,
			view: view,
			viewParams: {}
		}

		this.lastView = view

		this.handleResize = this.handleResize.bind(this)
		this.componentDidMount = this.componentDidMount.bind(this)
		this.componentWillUnmount = this.componentWillUnmount.bind(this)
	}

	parseURL() {
		if (location.hash && location.hash !== '#/individual_edit') {
			return location.hash.split('/')[1]
		}
		return 'manage'
	}

	handleResize(e) {
		this.setState({
			width: window.innerWidth
		})
	}

	componentDidMount() {
		window.addEventListener('resize', this.handleResize)
	}
	
	componentWillUnmount() {
		window.removeEventListener('resize', this.handleResize)
	}

	// make this more advanced
	setHref(state) {
		let string = location.origin + location.pathname + '#/' + state.view
		window.location.href = string
	}

	render() {
		let screenWidth = this.state.width >= 800 ? 'large' : this.state.width >= 600 ? 'medium' : 'small'
		
		if (this.lastView !== this.state.view) {
			this.setHref(this.state)
		}
		this.lastView = this.state.view

		let container = null
		let content = null
		if (this.state.logged_in) {
			switch (this.state.view) {
				case 'manage':
					content = (
						<div>
							<CardTitle
								title="Manage Events"
								subtitle="View and edit pre-existing events"							/>
							<EventTable mode="manage" screenWidth={screenWidth} />
						</div>
					)
					break
				case 'pending':
					content = (
						<div>
							<CardTitle
								title="Pending Events"
								subtitle="Manage pending user submitted events" />
							<EventApprovalTable screenWidth={screenWidth} />
						</div>
					)
					break
				case 'import':
					content = (
						<div>
							<CardTitle
								title="Import Events"
								subtitle="Upload new events to the database in bulk"							/>
							<UploadForm screenWidth={screenWidth} />
						</div>
					)
					break
				case 'create':
					content = (
						<EventCreator screenWidth={screenWidth} />
					)
					break
				case 'individual_edit': {
					content = (
						<EventEditor event={this.state.viewParams.event} pending={this.state.viewParams.pending} screenWidth={screenWidth} />
					)
					break
				}
				case 'metrics':
					content = (
						<CardHeader
							title="Metrics"
							subtitle="Not yet implemented" />
					)
			}
			container = (
				<Card style={this.state.view !== 'individual_edit' ? styles.content[screenWidth] : styles.content.edit[screenWidth]}>
					{content}
				</Card>
			)	
		} else {
			container = <Login screenWidth={screenWidth} />
		}
	
		return (
			<MuiThemeProvider muiTheme={
				getMuiTheme({
					palette: {
						primary1Color: blueA400
					},
					appBar: {
						height: 50
					}
				})
			}>
				<div id="body">
					{this.state.logged_in && 
						<AppBarWithDrawer
							screenWidth={this.state.width}
							userLabel={this.state.currentUser.First_Name + ' ' +
								this.state.currentUser.Last_Name} /> }
					{container}
				</div>
			</MuiThemeProvider>
		)
	}
}

export default Main
