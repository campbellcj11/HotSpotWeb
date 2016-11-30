class ApplicationState {
	constructor() {
		this.controller = 'unitialized'
		Object.seal(this)
	}
}

export let State = new ApplicationState()
