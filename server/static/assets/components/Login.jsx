/**
 * Allow admin to login, interact with firebase auth provider and 
 * separate user db entry to gather user information.
 */
import React, {Component} from 'react'
import {
    Card,
    CardTitle,
    TextField,
    FlatButton,
    RaisedButton,
    CircularProgress
} from 'material-ui'
import UserActions from '../actions/userActions'
import {State} from './ApplicationState'

const styles = {
    login: {
		large: {
			margin: '5px 100px 5px 100px',
			maxWidth: '600px',
			minWidth: '400px'
		},
		medium: {
			margin: '5px 50px 5px 50px',
			maxWidth: '600px',
			minWidth: '400px'
		},
		small: {
			margin: '5px 10px'
		}
	},
    row: {
        margin: '0px 20px',
        display: 'inline-block',
        padding: '10px'
    },
    rowItem: {
        margin: '5px',
        float: 'left'
    },
    fields: {
        margin: '10px'
    },
    progressContainer: {
        width: '100%',
        position: 'relative'
    },
    loadIndicator: {
        marginLeft: '50%',
        left: '-50px',
        top: '25px'
    }
}

class Login extends Component {
    constructor(props) {
        super(props)
        this.state = {
            status: 'LOGGED_OUT',
            loading: true,
            user: {
                email: null,
                password: null
            },
            //status:
            //'LOGGING_IN'
            //'LOGGED_OUT'
            //'LOGIN_FAILED'
            //'LOGIN_SUCCEEDED'
            errorText: {}
        }
    }

    componentWillMount() {
        UserActions.getCurrentUser((success, content) => {
            if (success) {
                this.setState({
                    status: 'LOGIN_SUCCEEDED',
                    user: null,
                    errorText: {}
                })
                State.set({
                    loggedIn: true,
                    currentUser: content
                })
                if (State.router.location.state && State.router.location.state.redirect && State.router.location.state.redirect.pathname !== '/') {
                    State.router.push(State.router.location.state.redirect)
                } else {
                    State.router.push('/manage')
                }
            } else {
                this.setState({
                    loading: false
                })
            }
        })
    }

    onEmailChange(e) {
        let user = this.state.user
        user.email = e.target.value
        this.setState({
            user: user,
            errorText: {}
        })
    }

    onPasswordChange(e) {
        let user = this.state.user
        user.password = e.target.value
        this.setState({
            user: user,
            errorText: {}
        })
    }

    checkForEnter(e) {
        if (e.which == 13 || e.keyCode == 13) {
            this.attemptLogin()
        }
    }

    attemptLogin() {
        this.setState({
            status: 'LOGGING_IN',
        })
        UserActions.loginUser(this.state.user, ((success, content, authResponse) => {
            if (success) {
                this.setState({
                    status: 'LOGIN_SUCCEEDED',
                    user: null,
                    errorText: {}
                })
                State.set({
                    loggedIn: true,
                    currentUser: content
                })
                if (State.router.location.state.redirect && State.router.location.state.redirect.pathname !== '/') {
                    State.router.push(State.router.location.state.redirect)
                } else {
                    State.router.push('/manage')
                }
            } else {
                if (content == 'AUTH') {
                    this.setState({
                        status: 'LOGIN_FAILED',
                        errorText: {
                            auth: 'The email address or password is incorrect'
                        }
                    })
                } else if (content == 'USER_NOT_FOUND') {
                    this.setState({
                        status: 'LOGIN_FAILED',
                        errorText: {
                           user: 'User not found.'
                        }
                    })
                }
            }
        }).bind(this))
    }

    onSignUpClick() {

    }
    
    render() {
        if (this.state.loading) {
            return (
                <div style={styles.progressContainer}>
                    <CircularProgress
                        size={80}
                        thickness={5}
                        style={styles.loadIndicator} />
                </div>
            )
        } else {
            let screenWidth = State.get('screenWidth')
            return (
                <Card style={styles.login[screenWidth]}>
                    <CardTitle
                        title="Log in"
                        subtitle="Log in to the administrative panel" />
                    <div style={styles.fields}>
                        <TextField
                            floatingLabelText="User Email"
                            fullWidth={true}
                            onChange={this.onEmailChange.bind(this)}
                            onKeyDown={this.checkForEnter.bind(this)}
                            errorText={this.state.errorText.user} />
                        <TextField
                            floatingLabelText="Password"
                            fullWidth={true}
                            type="password"
                            onChange={this.onPasswordChange.bind(this)}                            
                            onKeyDown={this.checkForEnter.bind(this)}
                            onKeyDown={this.checkForEnter.bind(this)}
                            errorText={this.state.errorText.auth} />
                    </div>
                    <div style={styles.row}>
                        <FlatButton
                            label="Sign Up"
                            style={styles.rowItem}
                            secondary={true}
                            onClick={this.onSignUpClick.bind(this)}
                            disabled={true} />
                        <RaisedButton
                            label="Log in"
                            style={styles.rowItem}
                            primary={true}
                            onClick={this.attemptLogin.bind(this)} />
                    </div>
                </Card>
            )
        }
    }
}


export default Login