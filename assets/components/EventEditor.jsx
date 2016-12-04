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
    TextField
} from 'material-ui'
import EventActions from '../actions/eventActions'
import StorageActions from '../actions/storageActions'

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

class EventEditor extends Component {
    constructor(props) {
        super(props)
        this.state = {
            changedSinceSave: false,
            newImageURL: null,
            oldImageURL: null, //only set when image has been updated but not yet committed
            hasImage: !!this.props.event.Image,
            editingText: false,
            modifications: {}
        }
    }

    onImageInput(e) {
        let newImage = e.target.files[0]
        let fr = new FileReader()
        fr.onload = ((e) => {
            let old = this.props.event.Image || null
            this.props.event.Image = fr.result
            this.setState({
                changedSinceSave: true,
                newImage: newImage,
                newImageURL: fr.result,
                oldImageURL: old,
            })
        }).bind(this)
        fr.readAsDataURL(newImage)
    }

    //TODO only updates image for now
    onSave() {
        let newImage = this.state.newImage
        let event = this.props.event
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
                let eventRef = EventActions.getRef(event.key)
                let changes = this.state.modifications
                changes.Image = url
                eventRef.update(changes).then(() => {
                    console.log('Reference updated')
                    // update local copy
                    for (let field in changes) {
                        this.props.event[field] = changes[field]
                    }
                    this.setState({
                        changedSinceSave: false,
                        newImage: false,
                        newImageURL: null,
                        oldImageURL: null,
                        hasImage: true,
                        editingText: false,
                        modifications: {}
                    })
                }).catch((error) => {
                    console.log('Failed to update event')
                })
            })
        } else {
            if (Object.keys(this.state.modifications).length) {
                let eventRef = EventActions.getRef(event.key)
                let changes = this.state.modifications
                eventRef.update(changes).then(() => {
                    console.log('Reference updated')
                    //update local copy
                    for (let field in changes) {
                        this.props.event[field] = changes[field]
                    }
                    this.setState({
                        changedSinceSave: false,
                        editingText: false,
                        modifications: {}
                    })
                }).catch((error) => {
                    console.log('Failed to update event')
                })
            }
        }
    }

    clearChanges() {
        if (!this.state.editingText) {
            if (this.state.oldImageURL) {
                this.props.event.Image = this.state.oldImageURL
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
        let modifications = this.state.modifications
        modifications[field] = newValue
        this.setState({
            changedSinceSave: true,
            modifications: modifications
        })
    }

    render() {
        let subtitleText = !this.state.changedSinceSave ? 'Up to date' : 'Click Save to commit your changes'
        let event = this.props.event
        
        let header = (
            <div>
                <CardTitle 
                    title={event.Event_Name}
                    titleColor={event.Image ? '#fff' : '#000'}
                    subtitle={event.Date}
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
            chooseImageButton = (
                <div style={styles.row}>
                    <FlatButton
                        label={chooseImgText}
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
                    <FlatButton
                        label="Edit Properties"
                        primary={true}
                        style={styles.rowItem}
                        onClick={this.enterEditTextMode.bind(this)} />
                </div>
            )
        )

        let modifications = this.state.modifications
        let body = this.state.editingText ? (
            <div style={styles.fields}>
                <TextField
                    id="Address"
                    floatingLabelText="Address"
                    disabled={!this.state.editingText}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.Address || event.Address}
                    onChange={this.handleInputChange.bind(this)} />
                <TextField
                    id="Short_Description"
                    floatingLabelText="Short Description"
                    disabled={!this.state.editingText}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.Short_Description || event.Short_Description}
                    onChange={this.handleInputChange.bind(this)} />
                <TextField
                    id="Long_Description"
                    floatingLabelText="Long Description"
                    disabled={!this.state.editingText}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.Long_Description || event.Long_Description}
                    onChange={this.handleInputChange.bind(this)} />
                <TextField
                    id="Website"
                    floatingLabelText="Website"
                    disabled={!this.state.editingText}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.Website || event.Website}
                    onChange={this.handleInputChange.bind(this)} />
                <TextField
                    id="Email_Contact"
                    floatingLabelText="Email Contact"
                    disabled={!this.state.editingText}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.Email_Contact || event.Email_Contact}
                    onChange={this.handleInputChange.bind(this)} />
                <TextField
                    id="City"
                    floatingLabelText="City"
                    disabled={!this.state.editingText}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.City || event.City}
                    onChange={this.handleInputChange.bind(this)} />
                <TextField
                    id="County"
                    floatingLabelText="County"
                    disabled={!this.state.editingText}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.County || event.County}
                    onChange={this.handleInputChange.bind(this)} />
                <TextField
                    id="State"
                    floatingLabelText="State"
                    disabled={!this.state.editingText}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.State || event.State}
                    onChange={this.handleInputChange.bind(this)} />
                <TextField
                    id="Status"
                    floatingLabelText="Status"
                    disabled={!this.state.editingText}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.Status || event.Status}
                    onChange={this.handleInputChange.bind(this)} />
                <TextField
                    id="Event_Type"
                    floatingLabelText="Type"
                    disabled={!this.state.editingText}
                    fullWidth={true}
                    multiLine={true}
                    defaultValue={modifications.Event_Type || event.Event_Type}
                    onChange={this.handleInputChange.bind(this)} />
            </div>
        ) : null

        return (
            <Card>
                <CardTitle
                    title={'Editing Event'}
                    subtitle={subtitleText} />
                {cardImage}
                {!this.state.editingText && !event.Image && header}
                {!this.state.editingText && chooseImageButton}
                {body}
                <CardActions>
                    <FlatButton
                        label={this.state.editingText ? 'Close Editor' : 'Clear Changes'}
                        disabled={!this.state.changedSinceSave && !this.state.editingText}
                        onClick={this.clearChanges.bind(this)} />
                    <RaisedButton
                        label="Save"
                        primary={true}
                        disabled={!this.state.changedSinceSave}
                        onClick={this.onSave.bind(this)} />
                </CardActions>
            </Card>
        )
    }
}

export default EventEditor