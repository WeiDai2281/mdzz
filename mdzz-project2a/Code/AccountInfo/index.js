var mysql = require('mysql');
var AWS = require("aws-sdk");
var db_conn = new AWS.Lambda();

exports.handler = (event, context, callback) => {
    db_conn.invoke({
        FunctionName: "DbConnector",
        Payload: JSON.stringify({
            operation: "getAccountInfo",
            account_number: event.account_number
        }),
    }, function(err, data) {
        if (err) { callback(err); }
        data = JSON.parse(data.Payload);
        console.log(data);
        if (data.error) {
            console.log(data.error);
            callback(data.error);
            return; 
        }
        if (data.Account_Info.length === 0) {
            callback("Email does not exists");
            return; 
        }
        console.log(data.user_info)
        callback(null, {"account_info": data.Account_Info[0]});
        return;
    });
};
