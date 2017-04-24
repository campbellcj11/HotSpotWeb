/**
 * Easily importable singleton object that allows the delegator, 
 * the delegator's state properties, and the the router (see Main.jsx for more information)
 * to be accessible to all components that require state information.
 */
class ApplicationState {
	constructor() {
		this.delegator = 'unitialized'
		this.router = 'unitialized'
		Object.seal(this)
		this.set.bind(this)
	}

	set(state) {
		this.delegator.setState(state)
	}

	get(property) {
		return this.delegator.state ? this.delegator.state[property] : null
	}
}

export let State = new ApplicationState()
