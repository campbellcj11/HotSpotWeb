/**
 * Retrieve and display all current locales in firbase +
 * the number of events per locale in a table.
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

class LocaleTable extends React.Component {
	constructor(props) {
		super(props)
		
		this.state = {
			locales: [],
			loading: true
		}
	}

	componentDidMount() {
		if (!this.state.locales.length) {
			this.loadLocales.call(this)
		}
	}
	
	loadLocales() {
		EventActions.getLocales()
			.then(locales => {
				this.addLocaleArray(locales)
			})
			.catch(error => {
				console.log(error)
			})
	}

	addLocaleArray(localeArray) {
		this.setState({
			locales: localeArray,
			loading: false
		})
	}

	handleRowSelection(selectedRows) {
		let index = selectedRows[0]
		let locale = this.state.locales[index]
		State.router.push({
			pathname: 'locale',
			query: {
				l: locale.id
			}
		})
	}

	render() {	
		let screenWidth = State.get('screenWidth')
		if (this.state.loading) {
			return (
				<div style={styles.progressContainer}>
                    <CircularProgress
                        size={40}
                        style={styles.loadIndicator} />
                </div>
			)
		}
        
        let rows = []
        this.state.locales.forEach((locale, index) => {
            rows.push(
                <TableRow key={index}>
                    <TableRowColumn>{locale.name}</TableRowColumn>
                    <TableRowColumn>{locale.state}</TableRowColumn>
                    <TableRowColumn>{locale.country}</TableRowColumn>
                </TableRow>
            )
        })
    
        return (
            <Card style={globalStyles.content[screenWidth]}>
                <CardTitle
                    title="Locales"
                    subtitle="Locales with active events" />
                <Table multiSelectable={false} onRowSelection={this.handleRowSelection.bind(this)}>
                    <TableHeader enableSelectAll={false} displaySelectAll={false} adjustForCheckbox={false}>
                        <TableRow>
                            <TableHeaderColumn>Name</TableHeaderColumn>
                            <TableHeaderColumn>State</TableHeaderColumn>
                            <TableHeaderColumn>Country</TableHeaderColumn>
                        </TableRow>
                    </TableHeader>
                    <TableBody displayRowCheckbox={false}>
                        {rows}
                    </TableBody>
                </Table>
            </Card>
        )
	}
}

export default LocaleTable
