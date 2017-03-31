var mysql = require('mysql');
var AWS = require("aws-sdk");
var db_conn = new AWS.Lambda();

exports.handler = (event, context, callback) => {
    db_conn.invoke({
        FunctionName: "DbConnector",
        Payload: JSON.stringify({
            operation: "getAllItems"   
        }),
    }, function(err, data) {
        if (err) {
            callback(JSON.parse(data.Payload));
        } else {
            console.log("Data: ", data);
            callback(null, JSON.parse(data.Payload));
        }
    });
};