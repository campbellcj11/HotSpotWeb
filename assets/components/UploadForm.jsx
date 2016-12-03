import React from 'react'
import EventTable from './EventTable'
import StorageActions from '../actions/storageActions'
import EventActions from '../actions/eventActions'
import {
    RaisedButton, 
    Chip,
    Card,
    CardTitle,
    Snackbar
} from 'material-ui'

const styles = {
    row: {
        margin: '0px 20px 20px 20px',
        display: 'flex',
        flex: 'row wrap',
        padding: '10px'
    },
    rowItem: {
        margin: '5px'
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
    uploadButton: {
        margin: '5px 5px 5px 25px',
    },
    warning: {
        backgroundColor: 'rgba(150, 0, 0, 0.4)'
    },
}

//TODO handle error alerts better
class UploadForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            status: 'NO_FILE_SELECTED',
            //status:
            // 'FILE_SELECTED'
            // 'FILE_VERIFIED'
            // 'IMPORT_IN_PROGRESS'
            // 'IMPORT_FAILED'
            // 'IMPORT_COMPLETED_WITH_ERRORS'
            // 'IMPORT_SUCCESS'
            potentialEvents: null,
            selectedFileName: null,
            importedEvents: [],
            failedImports: []
        }

        this.onInputChange = this.onInputChange.bind(this)
        this.handleUpload = this.handleUpload.bind(this)
        this.resetStatus = this.resetStatus.bind(this)
        this.assessImport = this.assessImport.bind(this)
    }

    onInputChange(e) {
        // update state based on selected file
        let file = e.target.files[0]
        this.setState({
            status: 'FILE_SELECTED',
            selectedFileName: file.name
        })
        //read in file
        let reader = new FileReader() 
        let potentialEvents = []       
        reader.onload = (event) => {
            let contents = event.target.result
            //parse csv to json w/ d3
            let jsonResult = d3.csvParse(contents)

            //verify events and populate preview table
            for (let i=0; i<jsonResult.length; i++) {
                let potentialEvent = jsonResult[i]
                if (verifyEvent(potentialEvent)) {
                    potentialEvents.push(potentialEvent)
                    verifyImage(potentialEvent, (imageExists) => {
                        if (!imageExists) {
                            potentialEvent.Image = null
                            this.setState({
                                error: 'Some images could not be found'
                            })
                        }
                    })
                } else {
                    console.log(potentialEvent)
                }
            }
            this.setState({
                status: 'FILE_VERIFIED',
                potentialEvents: potentialEvents
            })
        }
        reader.readAsText(file)
    }

    handleUpload() {
        this.setState({
            status: 'IMPORT_IN_PROGRESS'
        })
        let importedEvents = []
        let failedImports = []
        let potentialEvents = this.state.potentialEvents
        let component = this
        // retrieve verified images and upload them first
        potentialEvents.forEach((event, index) => {
            if (event.Image) { // upload image first
                retrieveFile(event.Image, (file) => {
                    StorageActions.uploadEventImage(file, (url) => {
                        event.Image = url
                        EventActions.createEvent(event, (success, event) => {
                            if (success) {
                                importedEvents.push(event)
                            } else {
                                failedImports.push(event)
                            }
                            // update state if necessary
                            component.assessImport(importedEvents, failedImports, potentialEvents)

                        })
                    })
                })
            } else { // no image
                EventActions.createEvent(event, (success, event) => {
                    if (success) {
                        importedEvents.push(event)
                    } else {
                        failedImports.push(event)
                    }
                    //update state if necessary
                    component.assessImport(importedEvents, failedImports, potentialEvents)
                })
            }
        })
    }

    resetStatus() {
        document.querySelector('#uploadFileInput').value = ''
        this.setState({
            status: 'NO_FILE_SELECTED',
            selectedFileName: null,
            potentialEvents: null
        })
    }

    assessImport(importedEvents, failedImports, potentialEvents) {
        if (potentialEvents.length == importedEvents.length + failedImports.length) {
            let newState = { importedEvents, failedImports }
            if (importedEvents.length == potentialEvents.length) {
                newState.status = 'IMPORT_SUCCESS'
            } else if (importedEvents.length > 1) {
                newState.status = 'IMPORT_COMPLETED_WITH_ERRORS'
            } else {
                newState.status = 'IMPORT_FAILED'
            }
            console.log(newState)
            this.setState(newState)
        }
    }

    render() {
        let chip = null
        if (this.state.status != 'NO_FILE_SELECTED') {
            chip = (
                <Chip style={styles.rowItem}
                    onRequestDelete={this.resetStatus}>
                    {this.state.selectedFileName}
                </Chip>
            )
        }
        
        let previewTable = null
        let enableUpload = false
        let uploadButtonLabel = "Import "
        if (this.state.status == 'FILE_VERIFIED' && this.state.potentialEvents.length) {
            //populate table
            previewTable = (
                <EventTable
                    potentialEvents={this.state.potentialEvents}
                    screenWidth={this.props.screenWidth} 
                    hideCheckboxes={true} />
            )

            //enable upload button
            enableUpload = true
            uploadButtonLabel += this.state.selectedFileName
        } else if (this.state.status == 'FILE_VERIFIED') {
            // warn on invalid file
            previewTable = (
                <Card style={styles.warning}>
                    <CardTitle
                        style={styles.warningText}
                        title="The file could not be imported" />
                </Card>
            )
        }

        return (
            <div>
                <div style={styles.row}>
                    <RaisedButton
                        primary={true}
                        label="Select file for event import"
                        containerElement="label"
                        style={styles.rowItem}>
                        <input
                            id="uploadFileInput"
                            onChange={this.onInputChange}
                            type="file"
                            accept=".csv, .dsv, .tsv"
                            style={styles.fileInput} />   
                    </RaisedButton>
                    {chip}
                    <RaisedButton
                        disabled={!enableUpload}
                        label={uploadButtonLabel}
                        secondary={true}
                        style={styles.uploadButton} 
                        onClick={this.handleUpload} />
                    <Snackbar
                        open={true}
                        message={'state: ' + this.state.status}
                        autoHideDuration={5000} />
                </div>
            {previewTable}
            </div>
        )
    }
}

export default UploadForm

// auxiliary functions for event verification
// key: 'required' / 'optional'
let EventSchema = {
	Event_Name: 'required',
	Location: 'required',
	Address: 'required',
	Date: 'required',
	Image: 'optional',
	Latitude: 'optional',
	Longitude: 'optional',
	Short_Description: 'required',
	Long_Description: 'optional',
	Email: 'optional',
	Website: 'optional',
	Status: 'optional',
	Tags: 'optional',
	State: 'optional',
	County: 'optional',
	Event_Type: 'optional',
	Email_Contact: 'optional',
	Phone_Number: 'optional',
	Price: 'optional',
    Start_Date: 'optional',
    End_Date: 'optional',
    City: 'optional'
}

Object.freeze(EventSchema)

// simple verification that event matches schema
let verifyEvent = (event) => {
    // make sure no unexpected props are found
    for (let key in event) {
        if (!EventSchema.hasOwnProperty(key)) {
            console.error('Potential event contains unexpected key: ' + key)
            return false
        }
    }
    // check for specifically required props
    for (let prop in EventSchema) {
        if (EventSchema[prop] === 'required' && !event.hasOwnProperty(prop)) {
            console.error('Potential event is missing the required key: ' + prop)
            return false
        }
    }
    return true
}

let verifyImage = (event, callback) => {
	if (!event.Image) callback(false)
    let imgUrl = event.Image
    let img = document.createElement('img')
	img.crossOrigin = 'Anonymous'
	img.onload = function() {
		callback(true)
	}
	img.onerror = function() {
		console.error('Failed to load image from: ' + imgUrl)
		callback(false)
	}
	img.src = imgUrl
}

let retrieveFile = (imgUrl, callback) => {
	var c = document.createElement('canvas')
	var img = document.createElement('img')
	img.style.position = 'absolute'
	img.style.left = -10000
	img.crossOrigin = 'Anonymous'
	document.body.appendChild(img)
	var ctx = c.getContext('2d')
	img.onload = function() {
		c.height = img.naturalHeight
		c.width = img.naturalWidth
		ctx.drawImage(img, 0, 0)
		c.toBlob(function(blob) {
			callback(blob)
		}, 'image/jpeg', 0.8)
	}
	img.src = imgUrl
}