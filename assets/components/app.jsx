import React from 'react'
import {render} from 'react-dom'
import Main from './Main'
import injectTapEventPlugin from 'react-tap-event-plugin';

import {State} from './ApplicationState'

// For material-ui
injectTapEventPlugin()

State.delegator = render(<Main/>, document.getElementById('main'))
