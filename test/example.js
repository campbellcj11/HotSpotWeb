var casper = require('casper').create({
	viewportSize: {
		width: 1000,
		height: 1000
	},
    pageSettings: {
        userAgent: "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.1847.131 Safari/537.36"
    },
	verbose: true,
	logLevel: 'debug'
})
casper.start('http://localhost:5000/html/index.html', function() {
	this.echo(this.getCurrentUrl())
	this.capture('cap.png', {
		top: 0,
		left: 0,
		width: 1000,
		height: 1000
	})
	this.evaluate(function submit() {
		document.querySelector('input[type="text"]').value = 'clem.daniel@gmail.com'
		document.querySelector('input[type="password"]').value = 'w3stThul3'
	})
	this.capture('cap2.png', {
		top: 0,
		left: 0,
		height: 1000,
		width: 1000
	})
	this.click('button:enabled')
})

casper.wait(10000, function() {
	this.capture('cap3.png', {
		top: 0,
		left: 0,
		width: 1000,
		height: 1000
	})
	this.echo(this.getHTML())
})

/*casper.waitFor(function check() {
	return this.evaluate(function() {
		return document.querySelectorAll('i.material-icons').length > 0 
	})
}, function then() {
	this.echo(this.getCurrentUrl())
	getNav().forEach(function(link) {
		console.log(link)
	})
}, function onTimeout() {
	console.log('Request timed out')
}, 15000)

function getNav() {
	var result = []
	document.querySelectorAll('i.material-icons').forEach(function(icon) {
		result.push(icon.parentNode)
	})
	return result
}*/

casper.run()
