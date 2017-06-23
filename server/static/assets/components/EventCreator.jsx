/**
 * Simple form that allows events to be directly created by an administrator 
 * without approval.  Also exports the LocaleSelector and TagSelector components,
 * which allow only existing locales and tags to be selected and multiselected, respectively.
 */
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
            startDate: new Date(),
            startTime: new Date(),
            endDate: new Date(),
            endTime: new Date()
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
        event.locale_id = value
        this.setState({
            potentialEvent: event
        })
    }

    handleTagsChange(values) {
        let event = this.state.potentialEvent
        event.tags = values
        this.setState({
            potentialEvent: event
        })
    }

    handleDateChange(tag, e, date) {
        this.setState({
            [tag + 'Date']: date
        })
        this.mergeTimeAndDate(tag, date, this.state[tag + 'Time'])
    }

    handleTimeChange(tag, e, time) {
        this.setState({
            [tag + 'Time']: time
        })
        this.mergeTimeAndDate(tag, this.state[tag + 'Date'], time)
    }

    mergeTimeAndDate(tag, date, time) {
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
        event[tag + '_date'] = merged.getTime()
        this.setState({
            potentialEvent: event
        })
    }

    onSave() {
        this.setState({
            showProgress: true
        })
        let potentialEvent = this.state.potentialEvent
        // create event
        EventActions.createEvent(potentialEvent)
            .then(createdEvent => {
                // TODO upload image .then redirect
                State.router.push({
                    pathname: 'edit',
                    query: {
                        id: createdEvent.id
                    }
                })
            })
            .catch(error => {
                console.error(error)
            })
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
                        id="name"
                        floatingLabelText="Event Name"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <TextField
                        id="address"
                        floatingLabelText="Address"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <DatePicker
                        floatingLabelText="Start Date"
                        minDate={new Date()}
                        onChange={this.handleDateChange.bind(this, 'start')} />
                    <TimePicker
                        floatingLabelText="Start Time"
                        pedantic={true}
                        onChange={this.handleTimeChange.bind(this, 'start')} />
                    <DatePicker
                        floatingLabelText="End Date"
                        minDate={new Date()}
                        onChange={this.handleDateChange.bind(this, 'end')} />
                    <TimePicker
                        floatingLabelText="End Time"
                        pedantic={true}
                        onChange={this.handleTimeChange.bind(this, 'end')} />
                    <TextField
                        id="venue_name"
                        floatingLabelText="Venue Name"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <TextField
                        id="short_description"
                        floatingLabelText="Short Description"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <TextField
                        id="long_description"
                        floatingLabelText="Long Description"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <TextField
                        id="website"
                        floatingLabelText="Website"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <TextField
                        id="email_contact"
                        floatingLabelText="Email Contact"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <TextField
                        id="phone_contact"
                        floatingLabelText="Phone Contact"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <LocaleSelect
                        floatingLabelText="Locale"
                        fullWidth={true}
                        onChange={this.handleLocaleChange.bind(this)} />
                    <TextField
                        id="type"
                        floatingLabelText="Type"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
                    <TagSelect
                        floatingLabelText="Tags"
                        fullWidth={true}
                        onChange={this.handleTagsChange.bind(this)} />
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
            value: null
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
        EventActions.getLocales()
            .then(locales => {
                this.locales = locales
                if (this.props.defaultValue) {
                    this.setState({
                        value: this.props.defaultValue
                    })
                }
            })
            .catch(error => {
                console.error(error)
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
        let options = []
        this.locales.forEach(function(locale, index) {
            options.push((
                <MenuItem
                    key={index}
                    value={locale.id}
                    primaryText={locale.name + ', ' + locale.state} />
            ))
        })
        
        return (
            <SelectField
                floatingLabelText={this.props.floatingLabelText || ""}
                fullWidth={this.props.fullWidth ? this.props.fullWidth : false}
                disabled={this.props.disabled ? this.props.disabled : false}
                hintText="Select a locale"
                errorText={this.props.errorText}
                value={this.state.value}
                onChange={this.handleChange.bind(this)}>
                {options}
            </SelectField>
        )
    }
}

export class TagSelect extends Component {
    constructor(props) {
        super(props)
        this.state = {
            values: []
        }
        this.tags = []
        this.populate.bind(this)
    }

    componentDidMount() {
        this.populate()
    }

    componentWillReceiveProps() {
        if (!this.tags.length) {
            this.populate()
        }
    }

    populate() {
        this.tags = [
            "art", "books", "causes", "class", "comedy", "community",
            "conference", "dance", "food", "health", "social", "sports",
            "movie", "music", "nightlife", "theater", "religion",
            "shopping", "other"
        ]
        if (this.props.defaultValue) {
            this.setState({
                values: this.props.defaultValue
            })
        }
    }

    handleChange(event, index, values) {
        if (this.props.onChange) {
            this.props.onChange(values)
        }
        this.setState({
            values: values
        })
    }

    render() {
        let values = this.state.values
        let options = []
        this.tags.forEach((tag, index) => {
            options.push((
                <MenuItem
                    key={index}
                    insetChildren={true}
                    checked={values && values.includes(tag)}
                    value={tag}
                    primaryText={tag.replace(/_/, ' ')} />
            ))
        })

        return (
            <SelectField
                multiple={true}
                floatingLabelText={this.props.floatingLabelText || ""}
                fullWidth={this.props.fullWidth ? this.props.fullWidth : false}
                disabled={this.props.disabled ? this.props.disabled : false}
                hintText="Select tags"
                errorText={this.props.errorText}
                value={values}
                onChange={this.handleChange.bind(this)}>
                {options}
            </SelectField>
        )
    }
}