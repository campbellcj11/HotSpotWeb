import firebase from '../assets/actions/firebaseInit'
import React from 'react'
import EventCreator from '../assets/components/EventCreator'
import renderer from 'react-test-renderer'

// test whether component state updates when input values change
test('Test test', () => {
	const component = renderer.create(
		<EventCreator screenWidth={800} />
	)
	let tree = component.toJSON()
	console.log(tree)
	expect(tree).toMatchSnapshot()
})
