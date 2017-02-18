class ApplicationState {
	constructor() {
		this.delegator = 'unitialized'
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
