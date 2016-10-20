import React from 'react'
import {render} from 'react-dom'

class EventTable extends React.Component {
	//getInitialState: 
	render() {
		return (
			<table className="table table-striped table-hover">
				<thead>
					<tr>
						<th>Title</th><th>Start Date</th><th>End Date</th><th>Short Description</th><th>Long Description</th><th>Photo</th><th>Video</th>
					</tr>
				</thead>
			</table>
		)
	}
}

render(<EventTable/>, document.getElementById('table'))
