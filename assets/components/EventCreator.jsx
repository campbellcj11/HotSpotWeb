import React, {Component} from 'react'
import {
    Card,
    CardTitle,
    CardHeader,
    CardText,
    CardMedia,
    CardActions,
    FlatButton,
    RaisedButton,
    Chip,
    TextField,
    DatePicker,
    TimePicker,
    LinearProgress,
    MenuItem,
    SelectField
} from 'material-ui'
import EventActions from '../actions/eventActions'
import StorageActions from '../actions/storageActions'
import {State} from './ApplicationState'
import {global as globalStyles} from '../Styles'

const styles = {
    row: {
        margin: '0px 20px',
        display: 'inline-block',
        padding: '10px'
    },
    rowItem: {
        margin: '5px',
        float: 'left'
    },
    fileInput: {
        cursor: 'pointer',
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        width: '100%',
        opacity: 0,
    }, 
    fields: {
        margin: '10px',
    }
}

let inputTimeouts = {}

export default class EventCreator extends Component {
    constructor(props) {
        super(props)
        this.state = {
            potentialEvent: {},
            tags: [],
            imageName: null,
            image: null,
            datePickerVal: new Date(),
            timePickerVal: new Date()
        }
    }

    onImageInput(e) {
        let image = e.target.files[0]
        let fr = new FileReader()
        this.setState({
            image: image,
            imageName: image.name
        })
    }

    handleInputChange(e) {
        let newValue = e.target.value
        let field = e.target.id
        // prevent rapid setState calls when typing
        clearTimeout(inputTimeouts[field])
        inputTimeouts[field] = setTimeout(() => {
            let event = this.state.potentialEvent
            event[field] = newValue
            this.setState({
                potentialEvent: event
            })
        }, 1000)
    }

    handleLocaleChange(value) {
        let event = this.state.potentialEvent
        event.City = value
        this.setState({
            potentialEvent: event
        })
    }

    handleDateChange(e, date) {
        this.setState({
            datePickerVal: date
        })
        this.mergeTimeAndDate(date, this.state.timePickerVal)
    }

    handleTimeChange(e, time) {
        this.setState({
            timePickerVal: time
        })
        this.mergeTimeAndDate(this.state.datePickerVal, time)
    }

    mergeTimeAndDate(date, time) {
        let event = this.state.potentialEvent
        // TODO consider using UTC values for better cross region compatibility
        let merged = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            time.getHours(),
            time.getMinutes(),
            0 // no seconds
        )
        event.Date = merged.getTime()
        this.setState({
            potentialEvent: event
        })
    }

    onSave() {
        this.setState({
            showProgress: true
        })
        let check = this.verify()
        let potentialEvent = this.state.potentialEvent
        if (check.succeeded) {
            StorageActions.uploadEventImage(this.state.image, (url) => {
                potentialEvent.Image = url
                EventActions.createEvent(potentialEvent, potentialEvent.City, (success, event, ref) => {
                    if (success) {
                        // redirect to event editor page for this event
                        event.key = ref.key
                        State.router.push({
                            pathname: 'edit',
                            query: {
                                id: event.key,
                                l: event.City
                            },
                            state: event
                        })
                    } else {
                        this.setState({
                            showProgress: false
                        })
                        // report failure
                        console.error('Failed to create event:')
                        console.error(JSON.stringify(potentialEvent, null, '\t'))
                        // delete image
                        let imageName = url.substring(url.lastIndexOf('/EventImages%2F') + 15)
                        imageName = imageName.substring(0, imageName.indexOf('?'))
                        let imageRef = StorageActions.getEventImageRef(imageName)
                        StorageActions.deleteEventImage(imageRef, (success, event) => {
                            if (success) {
                                console.log('Delete image from failed commit: ' + imageName)
                            } else {
                                console.log('Failed to delete image: ' + imageName)
                            }
                        })
                    }
                })
            })
        } else {
            // else update editor to show errors TODO
            console.error('Event not verified:')
            console.error(JSON.stringify(potentialEvent, null, '\t'))
            this.setState({
                showProgress: false
            })
        }
        
    }

    //TODO verify event
    // if not verified, return error information
    verify() {
        return {
            succeeded: true
        }
    }

    render() {
        let event = this.state.potentialEvent
        let screenWidth = State.get('screenWidth')

        return (
            <Card style={globalStyles.content[screenWidth]}>
                <CardTitle
                    title={'Create Event'}
                    subtitle='Create a new event' />
                <div style={styles.row}>
                    <FlatButton
                        label="Choose Image"
                        secondary={true}
                        style={styles.rowItem}
                        containerElement="label" >
                            <input
                                id="chooseImageInput"
                                onChange={this.onImageInput.bind(this)}
                                type="file"
                                accept="image/*"
                                style={styles.fileInput} />
                    </FlatButton>
                    {this.state.imageName && (
                        <Chip style={styles.rowItem}>
                            {this.state.imageName}
                        </Chip>
                    )}
                </div>
                <div style={styles.fields}>
                    <TextField
                        id="Event_Name"
                        floatingLabelText="Event Name"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <TextField
                        id="Address"
                        floatingLabelText="Address"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <DatePicker
                        id="Date"
                        floatingLabelText="Date"
                        minDate={new Date()}
                        onChange={this.handleDateChange.bind(this)} />
                    <TimePicker
                        id="Time"
                        floatingLabelText="Time"
                        pedantic={true}
                        onChange={this.handleTimeChange.bind(this)} />
                    <TextField
                        id="Location"
                        floatingLabelText="Location"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <TextField
                        id="Short_Description"
                        floatingLabelText="Short Description"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <TextField
                        id="Long_Description"
                        floatingLabelText="Long Description"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <TextField
                        id="Website"
                        floatingLabelText="Website"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <TextField
                        id="Email_Contact"
                        floatingLabelText="Email Contact"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <LocaleSelect
                        floatingLabelText="City"
                        fullWidth={true}
                        onChange={this.handleLocaleChange.bind(this)} />
                    <TextField
                        id="County"
                        floatingLabelText="County"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <TextField
                        id="State"
                        floatingLabelText="State"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <TextField
                        id="Status"
                        floatingLabelText="Status"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <TextField
                        id="Event_Type"
                        floatingLabelText="Type"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                </div>
                {this.state.showProgress && <LinearProgress mode="indeterminate" />}
                <CardActions>
                    <RaisedButton
                        label="Submit"
                        primary={true}
                        onClick={this.onSave.bind(this)} />
                </CardActions>
            </Card>
        )
    }
}

// Controlled classes for Locale, Tags
export class LocaleSelect extends Component {
    constructor(props) {
        super(props)
        this.state = {
            value: false
        }
        this.locales = []
        this.populate.bind(this)
    }

    componentDidMount() {
        this.populate()
    }

    componentWillReceiveProps() {
        if (!this.locales.length) {
            this.populate()
        }
    }

    populate() {
        this.locales = []
        EventActions
			.get('events')
			.on('value', (snapshot) => {
				snapshot.forEach((child) => {
					let localeName = child.key
                    this.locales.push(localeName)
				})
                if (this.props.defaultValue && this.locales.indexOf(this.props.defaultValue) != -1) {
                    this.setState({
                        value: this.props.defaultValue
                    })
                }
			}, (error) => {
				console.log('Read error: ' + error.message)
			})
    }

    handleChange(event, index, value) {
        if (this.props.onChange) {
            this.props.onChange(value)
        }
        this.setState({
            value: value
        })
    }

    render() {
        let options = [(
            <MenuItem
                key={0}
                value={false}
                primaryText="Select a locale" />
        )]
        this.locales.forEach(function(locale, index) {
            options.push((
                <MenuItem
                    key={index + 1}
                    value={locale}
                    primaryText={locale} />
            ))
        })
        
        return (
            <SelectField
                floatingLabelText={this.props.floatingLabelText || ""}
                fullWidth={this.props.fullWidth ? this.props.fullWidth : false}
                disabled={this.props.disabled ? this.props.disabled : false}
                errorText={this.props.errorText}
                value={this.state.value}
                onChange={this.handleChange.bind(this)}>
                {options}
            </SelectField>
        )
    }
}