/**
 * Exports an editor/viewer for events that shows a simple preview card, allows images and
 * text to be edited by an admin, allows events to be deleted,
 * and allows pending events to be explicitly approved or denied by the admin.
 */

// third party
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
    TextField,
    DatePicker,
    TimePicker,
    LinearProgress
} from 'material-ui'
// first party
import {
    LocaleSelect,
    TagSelect
} from './EventCreator'
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

class EventEditor extends Component {
    constructor(props) {
        super(props)
        
        this.pending = !!this.props.router.location.query.pending

        this.state = {
            changedSinceSave: false,
            locale: this.props.router.location.query.l,
            newImageURL: null,
            oldImageURL: null, //only set when image has been updated but not yet committed
            editingText: false,
            modifications: {},
            tags: [],
            showProgress: false
        }
    }

    componentWillMount() {
        let id = this.props.router.location.query.id
        if (this.props.router.location.state) {
            this.event = this.props.router.location.state
            let date = new Date(this.event.Date)
            this.setState({
                hasImage: !!this.event.Image,
                datePickerVal: date,
                timePickerVal: date
            })
        } else {
            let locale = this.props.router.location.query.l
            EventActions.getSnapshot(id, locale, (function(snapshot) {
                this.event = snapshot
                let date = new Date(this.event.Date)
                this.setState({
                    hasImage: !!this.event.Image,
                    datePickerVal: date,
                    timePickerVal: date
                })
            }).bind(this), this.pending ? 'approvalQueue' : 'events')
        }

        if (!this.pending) {
            EventActions.getTags(id, tags => {
                this.setState({
                    tags: tags
                })
            })
        } else {
            this.setState({
                tags: this.event.Tags
            })
        }
    }

    onImageInput(e) {
        let newImage = e.target.files[0]
        let fr = new FileReader()
        fr.onload = ((e) => {
            let old = this.event.Image || null
            this.event.Image = fr.result
            this.setState({
                changedSinceSave: true,
                newImage: newImage,
                newImageURL: fr.result,
                oldImageURL: old,
            })
        }).bind(this)
        fr.readAsDataURL(newImage)
    }

    onDelete() {
        let event = this.event
        let ref = EventActions.getRef(event.key, this.state.locale)
        ref.remove()
            .then(() => {
                State.router.push({
                    pathname: 'locale',
                    query: {
                        l: this.state.locale
                    }
                })
            })
            .catch(() => {
                console.log('Deletion failed')
            })
    }

    onSave() {
        let newImage = this.state.newImage
        let event = this.event
        if (this.state.newImage) {
            if (this.state.hasImage) {
                // delete old image
                let oldURL = this.state.oldImageURL
                let oldImageName = oldURL.substring(oldURL.lastIndexOf('/EventImages%2F') + 15)
                oldImageName = oldImageName.substring(0, oldImageName.indexOf('?'))
                let oldImageRef = StorageActions.getEventImageRef(oldImageName)
                StorageActions.deleteEventImage(oldImageRef, (success) => {
                    if (success) {
                        console.log('Delete old image: ' + oldImageName)
                    } else {
                        console.log('Failed to delete old image: ' + oldImageName)
                    }
                })
            }

            //upload new image
            StorageActions.uploadEventImage(newImage, (url) => {
                // update event to use new image url
                let eventRef = EventActions.getRef(event.key, this.state.locale)
                let changes = this.state.modifications
                changes.Image = url
                eventRef.update(changes).then(() => {
                    console.log('Reference updated')
                    // update local copy
                    for (let field in changes) {
                        this.event[field] = changes[field]
                    }

                    // if locale has changed, move event, redirect
                    if (this.state.locale !== event.City) {
                        EventActions.moveEvent(event, this.state.locale, event.City, (success, event, newRef) => {
                            if (!success) {
                                console.log('Failed to move event to new locale')
                                return
                            }
                            // redirect to editor for newly moved event
                            State.router.push({
                                pathname: 'edit',
                                query: {
                                    id: newRef.key,
                                    l: event.City
                                },
                                state: event
                            })
                        })
                    } else {
                        this.setState({
                            changedSinceSave: false,
                            newImage: false,
                            newImageURL: null,
                            oldImageURL: null,
                            hasImage: true,
                            editingText: false,
                            modifications: {}
                        })
                    }
                }).catch((error) => {
                    console.log('Failed to update event')
                })
            })
        } else {
            if (Object.keys(this.state.modifications).length) {
                let eventRef = EventActions.getRef(event.key, this.state.locale)
                let changes = this.state.modifications
                changes.Sort_Date = event.Date
                eventRef.update(changes).then(() => {
                    console.log('Reference updated')
                    //update local copy
                    for (let field in changes) {
                        this.event[field] = changes[field]
                    }

                    // if locale has changed, move event, redirect
                    if (this.state.locale !== event.City) {
                        EventActions.moveEvent(event, this.state.locale, event.City, (success, event, newRef) => {
                            if (!success) {
                                console.log('Failed to move event to new locale')
                                return
                            }
                            // redirect to editor for newly moved event
                            State.router.push({
                                pathname: 'edit',
                                query: {
                                    id: newRef.key,
                                    l: event.City
                                },
                                state: event
                            })
                        })
                    } else {
                        this.setState({
                            changedSinceSave: false,
                            editingText: false,
                            modifications: {}
                        })
                    }
                }).catch((error) => {
                    console.log('Failed to update event')
                })
            }

            EventActions.setTags(event.key, this.state.tags, success => {
                if (!Object.keys(this.state.modifications).length) {
                    this.setState({
                        changedSinceSave: false,
                        editingText: false,
                        modifications: {}
                    })
                }
            })
        }
    }

    onApprove() {
        // Copy new event to event table from approval queue
        let potentialEvent = this.event
        let key = potentialEvent.key
        delete potentialEvent.key
        if (this.pending) {
            delete potentialEvent.Tags
        }
        this.setState({
            showProgress: true
        })
        EventActions.createEvent(potentialEvent, potentialEvent.City, (success, event, ref) => {
            if (success) {
                // redirect to regular event editor page for this event
                event.key = ref.key
                
                // set tags on created event
                EventActions.setTags(event.key, this.state.tags)

                // mark approved
                EventActions.get('approvalQueue/' + key)
                    .update({
                        approvalStatus: 'approved'
                    })
                
                // redirect and reset state
                State.router.push({
                    pathname: 'edit',
                    query: {
                        id: event.key,
                        l: event.City
                    },
                    state: event
                })
                this.pending = false
                this.setState({
                    schangedSinceSave: false,
                    locale: this.props.router.location.query.l,
                    newImageURL: null,
                    oldImageURL: null, //only set when image has been updated but not yet committed
                    editingText: false,
                    modifications: {},
                    tags: [],
                    showProgress: false
                })
            } else {
                this.setState({
                    showProgress: false
                })
                // report failure
                console.error('Failed to create event:')
                console.error(JSON.stringify(potentialEvent, null, '\t'))
            }
        })
    }

    onDeny() {
        let potentialEvent = this.event
        let key = potentialEvent.key
        EventActions.get('approvalQueue/' + key)
            .update({
                approvalStatus: 'denied'
            })
        State.router.push('/pending')
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
        let modifications = this.state.modifications
        // TODO consider using UTC values for better cross region compatibility
        let merged = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            time.getHours(),
            time.getMinutes(),
            0 // no seconds
        )
        modifications.Date = merged.getTime()
        this.setState({
            changedSinceSave: true,
            modifications: modifications
        })
    }

    handleTagsChange(values) {
        this.setState({
            tags: values,
            changedSinceSave: true
        })
    }

    clearChanges() {
        if (!this.state.editingText) {
            if (this.state.oldImageURL) {
                this.event.Image = this.state.oldImageURL
            }
            this.setState({
                changedSinceSave: false,
                newImage: false,
                newImageURL: null,
                oldImageURL: null,
                editingText: false,
                modifications: {}
            })
        } else {
            this.setState({
                editingText: false
            })
        }
    }

    enterEditTextMode() {
        this.setState({
            editingText: true
        })
    }

    handleInputChange(e) {
        let newValue = e.target.value
        let field = e.target.id
        // prevent rapid setState calls when typing
        clearTimeout(inputTimeouts[field])
        inputTimeouts[field] = setTimeout(() => {
            let modifications = this.state.modifications
            modifications[field] = newValue
            this.setState({
                changedSinceSave: true,
                modifications: modifications
            })
        }, 1000)
    }

    handleLocaleChange(value) {
        let modifications = this.state.modifications
        modifications.City = value
        this.setState({
            changedSinceSave: true,
            modfications: modifications
        })
    }

    render() {
        let screenWidth = State.get('screenWidth')
        if (!this.event) {
            return null
        }
        let event = this.event
        
        let subtitleText = !this.state.changedSinceSave ? 'Up to date' : 'Click Save to commit your changes'
        let date = new Date(event.Date)
        let header = (
            <div>
                <CardTitle 
                    title={event.Event_Name}
                    titleColor={event.Image ? '#fff' : '#000'}
                    subtitle={date.toLocaleDateString() + ' ' + date.toLocaleTimeString()}
                    subtitleColor={event.Image ? '#ddd' : '#222'} />
                <CardHeader
                    title={'@ ' + event.Location}
                    titleColor={event.Image ? '#fff' : '#000'}
                    subtitle={event.Short_Description}
                    subtitleColor={event.Image ? '#ccc' : '#333'} />
            </div>
        )

        let cardImage = null
        let chooseImgText
        if (!this.state.editingText && event.Image) {
            cardImage = (
                <CardMedia
                    overlay={header} >
                        <img src={event.Image} />
                </CardMedia>
            )
            chooseImgText = 'Choose image'
        } else {
            chooseImgText = 'Add an Image'
        }
        let chooseImageButton = (
            <div style={styles.row}>
                <FlatButton
                    label={chooseImgText}
                    secondary={true}
                    disabled={this.pending}
                    style={styles.rowItem}
                    containerElement="label" >
                        <input
                            id="chooseImageInput"
                            onChange={this.onImageInput.bind(this)}
                            type="file"
                            accept="image/*"
                            style={styles.fileInput} /> 
                </FlatButton>
                <FlatButton
                    label={this.pending ? "View Properties" : "Edit Properties"}
                    primary={true}
                    style={styles.rowItem}
                    onClick={this.enterEditTextMode.bind(this)} />
                {!this.pending && <FlatButton
                    label="Delete event"
                    disabled={this.pending}
                    onClick={this.onDelete.bind(this)}
                    style={styles.rowItem} />}
            </div>
        )

        let modifications = this.state.modifications
        let body = this.state.editingText ? (
            <div style={styles.fields}>
                <TextField
                    id="Event_Name"
                    floatingLabelText="Event Name"
                    disabled={!this.state.editingText || this.pending}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.Event_Name || event.Event_Name}
                    onChange={this.handleInputChange.bind(this)} />
                <TextField
                    id="Address"
                    floatingLabelText="Address"
                    disabled={!this.state.editingText || this.pending}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.Address || event.Address}
                    onChange={this.handleInputChange.bind(this)} />
                <DatePicker
                    id="Date"
                    floatingLabelText="Date"
                    disabled={this.pending}
                    minDate={new Date()}
                    defaultDate={modifications.Date ? 
                        new Date(modifications.Date) : date}
                    onChange={this.handleDateChange.bind(this)} />
                <TimePicker
                    id="Time"
                    floatingLabelText="Time"
                    disabled={this.pending}
                    defaultTime={modifications.Date ? 
                        new Date(modifications.Date) : date}
                    pedantic={true}
                    onChange={this.handleTimeChange.bind(this)} />
                 <TextField
                    id="Location"
                    floatingLabelText="Location"
                    disabled={!this.state.editingText || this.pending}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.Location || event.Location}
                    onChange={this.handleInputChange.bind(this)} />
                <TextField
                    id="Short_Description"
                    floatingLabelText="Short Description"
                    disabled={!this.state.editingText || this.pending}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.Short_Description || event.Short_Description}
                    onChange={this.handleInputChange.bind(this)} />
                <TextField
                    id="Long_Description"
                    floatingLabelText="Long Description"
                    disabled={!this.state.editingText || this.pending}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.Long_Description || event.Long_Description}
                    onChange={this.handleInputChange.bind(this)} />
                <TextField
                    id="Website"
                    floatingLabelText="Website"
                    disabled={!this.state.editingText || this.pending}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.Website || event.Website}
                    onChange={this.handleInputChange.bind(this)} />
                <TextField
                    id="Email_Contact"
                    floatingLabelText="Email Contact"
                    disabled={!this.state.editingText || this.pending}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.Email_Contact || event.Email_Contact}
                    onChange={this.handleInputChange.bind(this)} />
                <LocaleSelect
                    floatingLabelText="City"
                    disabled={!this.state.editingText || this.pending}
                    fullWidth={true}
                    defaultValue={modifications.City || event.City}
                    //errorText={!this.pending && "This selector is being temporarily ignored"}
                    onChange={this.handleLocaleChange.bind(this)} />
                <TextField
                    id="County"
                    floatingLabelText="County"
                    disabled={!this.state.editingText || this.pending}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.County || event.County}
                    onChange={this.handleInputChange.bind(this)} />
                <TextField
                    id="State"
                    floatingLabelText="State"
                    disabled={!this.state.editingText || this.pending}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.State || event.State}
                    onChange={this.handleInputChange.bind(this)} />
                <TextField
                    id="Status"
                    floatingLabelText="Status"
                    disabled={!this.state.editingText || this.pending}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.Status || event.Status}
                    onChange={this.handleInputChange.bind(this)} />
                <TextField
                    id="Event_Type"
                    floatingLabelText="Type"
                    disabled={!this.state.editingText || this.pending}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.Event_Type || event.Event_Type}
                    onChange={this.handleInputChange.bind(this)} />
                <TagSelect
                    floatingLabelText="Tags"
                    fullWidth={true}
                    disabled={!this.state.editingText || this.pending}
                    onChange={this.handleTagsChange.bind(this)}
                    defaultValue={this.state.tags || []} />
            </div>
        ) : null

        return (
            <Card style={globalStyles.content.edit[screenWidth]}>
                <CardTitle
                    title={'Edit Event'}
                    subtitle={subtitleText} />
                {cardImage}
                {!this.state.editingText && !event.Image && header}
                {!this.state.editingText && chooseImageButton}
                {body}
                {this.state.showProgress && <LinearProgress mode="indeterminate" />}
                <CardActions>
                    <FlatButton
                        label={this.state.editingText ? 'Close Editor' : 'Clear Changes'}
                        disabled={!this.state.changedSinceSave && !this.state.editingText}
                        onClick={this.clearChanges.bind(this)} />
                    {this.pending && (
                        <RaisedButton
                            label="Deny"
                            secondary={true}
                            onClick={this.onDeny.bind(this)} />
                    )}
                    <RaisedButton
                        label={this.pending ? "Approve" : "Save"}
                        primary={true}
                        disabled={!this.pending && !this.state.changedSinceSave}
                        onClick={this.pending ? this.onApprove.bind(this) : this.onSave.bind(this)} />
                </CardActions>
            </Card>
        )
    }
}

export default EventEditor