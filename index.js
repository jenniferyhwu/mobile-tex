'use strict';

const request = require('request');
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Imports dependencies and set up http server
const
	express = require('express'),
	bodyParser = require('body-parser'),
	{ convert } = require('convert-svg-to-png'),
	converters = require('./converters.js'),
	app = express().use(bodyParser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));


app.get('/', function (req, res) {
	res.send("HELLO WORLD KILL ME NOW");
})


// Adds support for GET requests to our webhook
app.get('/webhook/', (req, res) => {

	// Your verify token. Should be a random string.
	let VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    
	// Parse the query params
	let mode = req.query['hub.mode'];
	let token = req.query['hub.verify_token'];
	let challenge = req.query['hub.challenge'];
    
	// Checks if a token and mode is in the query string of the request
	if (mode && token) {

		// Checks the mode and token sent is correct
		if (mode === 'subscribe' && token === VERIFY_TOKEN) {

			// Responds with the challenge token from the request
			console.log('WEBHOOK_VERIFIED');
			res.status(200).send(challenge);
		
		} else {
			// Responds with '403 Forbidden' if verify tokens do not match
			res.sendStatus(403);      
		}
	}
});


// Creates the endpoint for our webhook 
app.post('/webhook/', (req, res) => {  
 
	let body = req.body;

	// Checks this is an event from a page subscription
	if (body.object === 'page') {

		// Iterates over each entry - there may be multiple if batched
		body.entry.forEach(function(entry) {

			// Gets the body of the webhook event
			let webhook_event = entry.messaging[0];
			console.log(webhook_event);

			// Get the sender PSID
			let sender_psid = webhook_event.sender.id;
			console.log('Sender PSID: ' + sender_psid);

			// Check if the event is a message or postback and
			// pass the event to the appropriate handler function
			
			if (webhook_event.message) {		// LOTS OF QUESTIONS
				
				// let pngBuffer = inputToPng(webhook_event.message);  
				let url = 'https://mobile-latex.herokuapp.com/' + sender_psid + '/';
				
				res.set('Location', url);
				// res.set('Content-Type', 'image/png');
				// res.write(pngBuffer);
				res.write('fuck it alllll');
				
				callSendAPI(sender_psid, {"text": url});
				
				callSendAPI(sender_psid, {"text": `You sent the message: "${webhook_event.message.text}". Good luck with the rest <3`});
			}
		});
		
		// Returns a '200 OK' response to all requests
		res.set('Location', 'https://mobile-latex.herokuapp.com/webhook/');
		res.status(200).send('EVENT_RECEIVED');
	} else {
		// Returns a '404 Not Found' if event is not from a page subscription
		res.sendStatus(404);
	}

});


// converts to png
function inputToPng(received_message) {
	// Check if the message contains text
	if (received_message.text) {    
		let unformatted = received_message.text;
		let svg = converters(unformatted);
		let png = convert(svg);
		
		return png;
	}
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
	// Construct the message body
	let request_body = {
		"recipient": {
		  "id": sender_psid
		},
		"message": response
	}
	
	// Send the HTTP request to the Messenger Platform
	request({
		"url": "https://graph.facebook.com/v2.6/me/messages",
		"qs": { "access_token": PAGE_ACCESS_TOKEN },
		"method": "POST",
		"json": request_body
	}, (err, res, body) => {
		if (!err) {
			console.log('message sent!')
		} else {
			console.error("Unable to send message:" + err);
		}
	}); 
}