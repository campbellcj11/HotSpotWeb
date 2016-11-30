import React from 'react'
import {render} from 'react-dom'

import Event from './Event'
import EventTable from './EventTable'

import Main from './Main'
import injectTapEventPlugin from 'react-tap-event-plugin';

import {State} from './ApplicationState'

// For material-ui
injectTapEventPlugin()

//TODO do away with separate pages and go full single page
if (location.pathname.endsWith('events.html')) {
	window.EventTableRendered = render(<EventTable/>, document.getElementById('table'))
} else if (location.pathname.endsWith('upload.html')) {
	window.EventPreviewTableRendered = render(<EventTable/>, document.getElementById('previewTable'))
} else if (location.pathname.endsWith('login.html')) {
	State.controller = render(<Main/>, document.getElementById('main'))
}

//render(<Main/>, document.getElementById('main'))
