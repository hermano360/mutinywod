var https = require('https');
var queryString = require('querystring');

exports.sendText = function(accountSid,authToken,fromNumber,to, body){
	actuallySMS(accountSid,authToken,fromNumber,to, body);
};

function actuallySMS(accountSid,authToken,fromNumber,to, body){
	    // The SMS message to send
    var message = {
        To: to, 
        From: fromNumber,
        Body: body
    };

    var messageString = queryString.stringify(message);

    var options = {
    	host: 'api.twilio.com',
        port: 443,
        path: '/2010-04-01/Accounts/' + accountSid + '/Messages.json',
        method: 'POST',
        headers: {
        	'Content-Type': 'application/x-www-form-urlencoded',
        	'Content-Length': Buffer.byteLength(messageString),
        	'Authorization': 'Basic ' + new Buffer(accountSid + ':' + authToken).toString('base64')
        }

    }

    var req = https.request(options, function(res){
    	res.setEncoding('utf-8');
    	var responseString = '';
    	res.on('data', function(data){
    		responseString += data;
    	});
    	    // Log the responce received from Twilio.
        // Or could use JSON.parse(responseString) here to get at individual properties.
        res.on('end', function () {
            //console.log('Twilio Response: ' + responseString);
            console.log("SMS Sent");
        });
    });

    // Handler for HTTP request errors.
    req.on('error', function (e) {
        console.error('HTTP error: ' + e.message);
        
    });

    // Send the HTTP request to the Twilio API.
    // Log the message we are sending to Twilio.
    console.log('Twilio API call: ' + messageString);
    req.write(messageString);
    req.end();
}
