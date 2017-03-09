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
		this.loadLocales.call(this)
	}

	componentWillReceiveProps(nextProps) {
		this.mode = this.props.router.location.query.mode || 'manage'
		this.setState({
			loading: true
		})
		this.loadLocales.call(this)
	}

	loadLocales() {
        EventActions
			.get('events')
			.on('value', (snapshot) => {
				let localeArray = []
				snapshot.forEach((child) => {
					let locale = child.val()
					locale.key = child.key
					localeArray.push(locale)
				})
				this.addLocaleArray(localeArray)
				console.log(localeArray.length + ' locales found')
			}, (error) => {
				console.log('Read error: ' + error.message)
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
				l: locale.key
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
                    <TableRowColumn>{locale.key}</TableRowColumn>
                    <TableRowColumn>{Object.keys(locale).length - 1}</TableRowColumn>
                </TableRow>
            )
        })
    
        return (
            <Card style={globalStyles.content[screenWidth]}>
                <CardTitle
                    title="Locales"
                    subtitle="Locales with active events" />
                <Table multiSelectable={false} onRowSelection={this.handleRowSelection.bind(this)}>
                    <TableHeader enableSelectAll={false} displaySelectAll={false}>
                        <TableRow>
                            <TableHeaderColumn>Locale</TableHeaderColumn>
                            <TableHeaderColumn>Events</TableHeaderColumn>
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
