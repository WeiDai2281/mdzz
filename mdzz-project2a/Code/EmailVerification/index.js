'use strict';
console.log('Loading function');

var aws = require('aws-sdk');
var ses = new aws.SES({
   region: 'us-east-1'
});

exports.handler = function(event, context) {
    console.log("Incoming: ", event);
    var eParams = {
        Destination: {
            ToAddresses: [JSON.parse(event.Records[0].Sns.Message).email]
            //ToAddresses: ["th2668@columbia.edu"]
        },
        Message: {
            Body: {
                Text: {
                    Data: "s3.amazonaws.com/mdzz-test/verify.html?token=" + JSON.parse(event.Records[0].Sns.Message).token
                }
            },
            Subject: {
                Data: "Email Verification"
            }
        },
        Source: "anythingaas@gmail.com"
    };

    console.log('===SENDING EMAIL===');
    var email = ses.sendEmail(eParams, function(err, data){
        if(err) console.log(err);
        else {
            console.log("===EMAIL SENT===");
            console.log(data);


            console.log("EMAIL CODE END");
            console.log('EMAIL: ', email);
            context.succeed(event);
        }
    });

};
