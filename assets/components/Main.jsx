/**
 * Main component loaded by app.jsx
 * Manages single page application and coordinates with ApplicationState
 * This component is always rendered and controls
 * 	- routing
 * 	- material-ui theme
 *  - checking login state
 * 	- reponsiveness to screen size
 * Login status and relative screen size are available to child components
 * that import ApplicationState because this component is the stored as the
 * ApplicationState.delegator in app.jsx
 */
import React, {Component} from 'react'
import {
	Router,
	IndexRoute,
	Route,
	hashHistory
} from 'react-router'
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
import {lightBlue900} from 'material-ui/styles/colors'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
// First Party
import LocaleTable from './LocaleTable'
import EventTable from './EventTable'
import EventApprovalTable from './EventApprovalTable'
import UploadForm from './UploadForm'
import EventEditor from './EventEditor'
import EventCreator from './EventCreator'
import Login from './Login'
import {State} from './ApplicationState'
import {global as styles} from '../Styles'

class Root extends Component {
	constructor(props) {
		super(props)
		State.router = this.props.router
	}

	componentWillMount() {
		let loggedIn = State.get('loggedIn')
		if (!loggedIn) {
			if (this.props.router.location.pathname != '/login') {
				this.props.router.push({
					pathname: '/login',
					state: {
						redirect: this.props.router.location
					}
				})
			}
		}
	}

	render() {
		let loggedIn = State.get('loggedIn')

		return (
			<div>
				{loggedIn && <AppBarWithDrawer />}
				<div>
					{this.props.children}
				</div>
			</div>
		)
	}
}

const routes = {
	path: '/',
	component: Root,
	childRoutes: [
		{
			path: 'login',
			component: Login
		},
		{
			path: 'manage',
			component: LocaleTable
		},
		{
			path: 'locale',
			component: EventTable
		},
		{
			path: 'pending',
			component: EventApprovalTable
		},
		{
			path: 'import',
			component: UploadForm
		},
		{
			path: 'create',
			component: EventCreator
		},
		{
			path: 'edit',
			component: EventEditor,
		}
	]
}

class Main extends Component {
	constructor(props, context) {
		super(props, context)

		let w = window.innerWidth

		this.state = {
			loggedIn: false,
			screenWidth: w >= 800 ? 'large' : w >= 600 ? 'medium' : 'small'
		}

		this.handleResize = this.handleResize.bind(this)
		this.componentDidMount = this.componentDidMount.bind(this)
		this.componentWillUnmount = this.componentWillUnmount.bind(this)
	}

	handleResize(e) {
		let w = window.innerWidth
		this.setState({
			screenWidth: w >= 800 ? 'large' : w >= 600 ? 'medium' : 'small'
		})
	}

	componentDidMount() {
		window.addEventListener('resize', this.handleResize)
	}
	
	componentWillUnmount() {
		window.removeEventListener('resize', this.handleResize)
	}

	render() {
		return (
			<MuiThemeProvider muiTheme={
				getMuiTheme({
					palette: {
						primary1Color: lightBlue900
					},
					appBar: {
						height: 50
					}
				})
			}>
				<Router history={hashHistory} routes={routes} />
			</MuiThemeProvider>
		)
	}
}

export default Main
