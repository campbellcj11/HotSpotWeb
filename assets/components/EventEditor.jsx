import React, {Component} from 'react'
import {
    Card,
    CardTitle,
    CardHeader,
    CardText,
    CardMedia,
    CardActions,
    FlatButton,
    RaisedButton
} from 'material-ui'
import EventActions from '../actions/eventActions'
import StorageActions from '../actions/storageActions'

const styles = {
    chooseImageButton: {
        margin: '10px'
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
    }
}

class EventEditor extends Component {
    constructor(props) {
        super(props)
        this.state = {
            changedSinceSave: false,
            newImageURL: null,
            oldImageURL: null, //only set when image has been updated but not yet committed
            hasImage: !!this.props.event.Image
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
            eventRef.update({
                Image: url
            }).then(() => {
                console.log('Reference updated')
                this.setState({
                    changedSinceSave: false,
                    newImage: false,
                    newImageURL: null,
                    oldImageURL: null,
                    hasImage: true
                })
            }).catch((error) => {
                console.log('Failed to update event')
            })
        })
    }

    clearChanges() {
        if (this.state.oldImageURL) {
            this.props.event.Image = this.state.oldImageURL
        }
        this.setState({
            changedSinceSave: false,
            newImage: false,
            newImageURL: null,
            oldImageURL: null
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
        if (event.Image) {
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
                <FlatButton
                    label={chooseImgText}
                    secondary={true}
                    style={styles.chooseImageButton} 
                    containerElement="label" >
                        <input
                            id="chooseImageInput"
                            onChange={this.onImageInput.bind(this)}
                            type="file"
                            accept="image/*"
                            style={styles.fileInput} /> 
                </FlatButton>
            )
        )

        return (
            <Card>
                <CardTitle
                    title={'Editing Event'}
                    subtitle={subtitleText} />
                {cardImage}
                {!event.Image && header}
                {chooseImageButton}
                <CardActions>
                    <FlatButton
                        label="Clear Changes"
                        disabled={!this.state.changedSinceSave}
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