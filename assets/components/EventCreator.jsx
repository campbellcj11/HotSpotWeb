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
    DatePicker
} from 'material-ui'
import EventActions from '../actions/eventActions'
import StorageActions from '../actions/storageActions'
import {State} from './ApplicationState'

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

class EventCreator extends Component {
    constructor(props) {
        super(props)
        this.state = {
            potentialEvent: {},
            tags: [],
            imageName: null,
            image: null
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

    handleDateChange(e, date) {
        let event = this.state.potentialEvent
        event.Date = date.getTime()
        this.setState({
            potentialEvent: event
        })
    }

    onSave() {
        let check = this.verify()
        let potentialEvent = this.state.potentialEvent
        if (check.succeeded) {
            StorageActions.uploadEventImage(this.state.image, (url) => {
                potentialEvent.Image = url
                EventActions.createEvent(potentialEvent, (success, event, ref) => {
                    if (success) {
                        // redirect to event editor page for this event
                        event.key = ref.key
                        State.controller.setState({
                            viewingEvent: event,
                            view: 'individual_edit'
                        })
                    } else {
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

        return (
            <Card>
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
                    <TextField
                        id="City"
                        floatingLabelText="City"
                        fullWidth={true}
                        multiLine={true}
                        onChange={this.handleInputChange.bind(this)} />
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

export default EventCreator