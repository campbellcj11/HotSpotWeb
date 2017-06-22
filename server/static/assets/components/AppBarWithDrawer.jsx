/**
 * Manage app bar and drawer state, specifically in response to screen dimensions.
 */
import React, {Component} from 'react'
import {Link} from 'react-router' 
import {AppBar, Drawer, Menu, FlatButton, MenuItem} from 'material-ui'
import UserActions from '../actions/userActions'
import {State} from './ApplicationState'

const styles = {
	all: {
		//height: '50px'
	},
	large: {
		paddingLeft: '276px'
	},
	medium: {
		paddingLeft: '20px',
	},
	small: {
		paddingLeft: '20px'
	}
}

export default class AppBarWithDrawer extends Component {
	constructor(props, context) {
		super(props, context);
		
		this.state = {
			drawer: false
		}
		
		this.closeDrawer = this.closeDrawer.bind(this)
	}
	
	onLeftIconButtonTap() {
		this.setState({
			drawer: true
		})
	}
	
	closeDrawer() {
		this.setState({
			drawer: false
		})
	}
	
	onDrawerMenuItemSelect(event, item, index) {
		if (item.props.value) {
			State.router.push('/' + item.props.value)
		}
		this.closeDrawer()
	}

	handleLogOut() {
		UserActions.logoutUser((success, errMessage) => {
			if (success) {
				State.router.push('/login')
				State.set({
					loggedIn: false,
					currentUser: null
				})
			} else {
				console.error('Error logging out: ' + errMessage)
			}
		})
	}
	
	render() {
		let fullSize = State.get('screenWidth') == 'large'
		// apply global styles and view port specific styles
		let currentStyle = Object.assign({}, styles.all, styles[fullSize ? 'large' : 'medium'])
		
		let showDrawer = false
		if (fullSize || this.state.drawer) {
			showDrawer = true
		}
		
		// populate drawer with items
		// TODO bulk import tool disabled for now since we're scraping events and it wasn't
		// updated for locale support/more recent db changes
		let drawerItems = [
			(<MenuItem
				key={1}
				value="manage"
				leftIcon={<i className="material-icons">list</i>}>
				Manage
			</MenuItem>),
			(<MenuItem
					key={2}
					value="pending"
					leftIcon={<i className="material-icons">done_all</i>}>
					Pending
			</MenuItem>
			),
			(<MenuItem
				key={4}
				value="create"
				leftIcon={<i className="material-icons">note_add</i>}>
				Create
			</MenuItem>)
		]
		if (!fullSize) {
			drawerItems.unshift(
				<MenuItem
					key={0}
					leftIcon={<i className="material-icons">close</i>}
					onTouchTap={this.closeDrawer}>
					Close Drawer
				</MenuItem>)
		}
		let drawer = showDrawer ? (
			<Drawer>
				<Menu onItemTouchTap={this.onDrawerMenuItemSelect.bind(this)}>
					{drawerItems}
				</Menu>
			</Drawer>
		) : null

		return (
			<div>
				<AppBar title="HotSpot"
					style={currentStyle}
					iconElementRight={
						<FlatButton
							onClick={this.handleLogOut.bind(this)} >
							Log out
						</FlatButton>}
					showMenuIconButton={!fullSize}
					onLeftIconButtonTouchTap={this.onLeftIconButtonTap.bind(this)} />
				{drawer}
			</div>
		)
	}
}
