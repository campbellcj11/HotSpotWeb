import React, {Component} from 'react'
import {indigo500} from 'material-ui/styles/colors'
import {AppBar, Drawer, Menu, FlatButton, MenuItem} from 'material-ui'
import {State} from './ApplicationState'

const styles = {
	all: {
		//height: '50px' TODO look into thisf
	},
	large: {
		paddingLeft: '276px'
	},
	medium: {
		paddingLeft: '20px',
	}
}

export default class AppBarWithDrawer extends Component {
	constructor(props, context) {
		super(props, context);
		
		this.state = {
			drawer: false
		}
		
		this.onLeftIconButtonTap = this.onLeftIconButtonTap.bind(this)
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
			State.controller.setState({
				view: item.props.value
			})
		}
	}
	
	render() {
		let fullSize = this.props.screenWidth >= 800
		// apply global styles and view port specific styles
		let currentStyle = Object.assign({}, styles.all, styles[fullSize ? 'large' : 'medium'])
		
		let showDrawer = false
		if (fullSize || this.state.drawer) {
			showDrawer = true
		}
		
		// populate drawer with items
		let drawerItems = [
			(<MenuItem
				key={1}
				value="manage"
				leftIcon={<i className="material-icons">list</i>}>
				Manage
			</MenuItem>),
			(<MenuItem
				key={2}
				value="import"
				leftIcon={<i className="material-icons">file_upload</i>}>
				Import
			</MenuItem>),
			(<MenuItem
				key={3}
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
				<Menu onItemTouchTap={this.onDrawerMenuItemSelect}>
					{drawerItems}
				</Menu>
			</Drawer>
		) : null

		return (
			<div>
				<AppBar title="Panel"
					style={currentStyle}
					iconElementRight={<FlatButton>Log in</FlatButton>}
					showMenuIconButton={!fullSize}
					onLeftIconButtonTouchTap={this.onLeftIconButtonTap} />
				{drawer}
			</div>
		)
	}
}