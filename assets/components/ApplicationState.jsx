class ApplicationState {
	constructor() {
		this.controller = 'unitialized'
		Object.seal(this)
		this.set.bind(this)
	}

	set(state) {
		//window.location.href = window.location.origin + window.location.pathname + '#/' + state.view
		State.controller.setState(state)
	}
}

export let State = new ApplicationState()
