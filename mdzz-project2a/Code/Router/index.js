'use strict';

var AWS = require("aws-sdk");

process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

var handleProducts = function(event, done) {
    switch (event.httpMethod) {
        case 'GET':
            var getProducts = new AWS.Lambda();
            getProducts.invoke({
                FunctionName: "GetProducts",
                Payload: "",
            }, function(err, data) {
                console.log("GetProducts finsihes");
                if (err) {
                    done({
                        statusCode: 400,
                        Payload: err.Payload
                    });
                } else {
                    done(null, {
                        statusCode: 200,
                        Payload: data.Payload
                    });
                }
            });
            break;
        default:
            done({
                statusCode: 400,
                Payload: `Unsupported method "${event.httpMethod}"`
            });
    }
};

var handleAccounts = function(event, done) {
    if (event.httpMethod != "GET") {
        done({
            statusCode: 400,
            Payload: `Unsupported method "${event.httpMethod}"`
        });
        return;
    }

    var account_id = event.requestContext.authorizer.account_id;

    var getAccountInfo = new AWS.Lambda();
    getAccountInfo.invoke({
        FunctionName: "getAccountInfo",
        Payload: JSON.stringify({
            operation: "getAccountInfo",
            account_number: account_id,
        }),
    }, function(err, data) {
        console.log("GetInfo error:", err);
        console.log("GetInfo data:", data);
        if (err) {
            done(err);
            return;
        }
        if (data.FunctionError) {
            done({
                statusCode: 400,
                Payload: data.Payload
            });
            return;
        } else {
            done(null, {
                statusCode: 200,
                Payload: data.Payload
            });
            return;
        }
    });
};

var handleUsers = function(event, done) {
    var action = event.path.split("/")[2];
    var body = (event.body ? JSON.parse(event.body) : null);
    var getUserInfo = new AWS.Lambda();
    console.log("Action: ", action);
    switch (action) {
        case 'signup':
            if (!body.user_info) {
                done({
                    statusCode: 400,
                    Payload: 'No user information provided'
                });
            }
            getUserInfo.invoke({
                FunctionName: "GetUserInfo",
                Payload: JSON.stringify({
                    operation: "signup",
                    user_info: body.user_info,
                }),
            }, function(err, data) {
                console.log("Signup err:", err);
                console.log("Signup data:", data);
                if (err) {
                    done(err);
                    return;
                }
                if (data.FunctionError) {
                    done({
                        statusCode: 400,
                        Payload: data.Payload
                    });
                } else {
                    done(null, {
                        statusCode: 200,
                        Payload: data.Payload
                    });
                }
            });
            break;

        case 'login':
            console.log("login user_info: ", body.user_info);
            if (!body.user_info) {
                done({
                    statusCode: 400,
                    Payload: 'No user information provided'
                });
                return;
            }
            getUserInfo.invoke({
                FunctionName: "GetUserInfo",
                Payload: JSON.stringify({
                    operation: "login",
                    user_info: body.user_info,
                }),
            }, function(err, data) {
                console.log("Login error:", err);
                console.log("Login data:", data);
                if (err) {
                    done(err);
                    return;
                }
                if (data.FunctionError) {
                    done({
                        statusCode: 400,
                        Payload: data.Payload
                    });
                } else {
                    done(null, {
                        statusCode: 200,
                        Payload: data.Payload
                    });
                }
            });
            break;

        case 'verify':
            if (!event.queryStringParameters.token) {
                done({
                    statusCode: 400,
                    Payload: 'No token provided'
                });
                return;
            }
            console.log("verify signup token:", event.queryStringParameters.token);
            var token = event.queryStringParameters.token;
            getUserInfo.invoke({
                FunctionName: "GetUserInfo",
                Payload: JSON.stringify({
                    operation: "verify",
                    token: event.queryStringParameters.token,
                }),
            }, function(err, data) {
                console.log("Verify error:", err);
                console.log("Verify data:", data);
                if (err) {
                    done(err);
                    return;
                }
                if (data.FunctionError) {
                    done({
                        statusCode: 400,
                        Payload: data.Payload
                    });
                } else {
                    done(null, {
                        statusCode: 200,
                        Payload: data.Payload
                    });
                }
            });
            break;

        default:
            if (event.httpMethod != "GET") {
                done({
                    statusCode: 400,
                    Payload: `Unsupported operation "${action}"`
                });
                return;
            }

            var customer_id = event.requestContext.authorizer.customer_id;
            getUserInfo.invoke({
                FunctionName: "GetUserInfo",
                Payload: JSON.stringify({
                    operation: "getInfo",
                    //email: event.queryStringParameters.email,
                    customer_id: customer_id
                }),
            }, function(err, data) {
                console.log("GetInfo error:", err);
                console.log("GetInfo data:", data);
                if (err) {
                    done(err);
                    return;
                }
                if (data.FunctionError) {
                    done({
                        statusCode: 400,
                        Payload: data.Payload
                    });
                } else {
                    done(null, {
                        statusCode: 200,
                        Payload: data.Payload
                    });
                }
            });
            return;
    }
};


var handleOrder = function(event, done) {
    // var body = event.body;
    if (!event.body) {
        done({
            statusCode: 400,
            Payload: `Missing order list`
        });
        return;
    }

    var body = JSON.parse(event.body);
    console.log("handleOrder: ", body);
    var orderMaker = new AWS.Lambda();
    switch (event.httpMethod) {
        case 'POST':
            // create order, checkout
            orderMaker.invoke({
                FunctionName: "checkout",
                Payload: JSON.stringify({
                    itemIDList: body.itemIDList
                }),
            }, function(err, data) {
                console.log("checkout err:", err);
                console.log("checkout data:", data);
                if (err) {
                    done(err);
                    return;
                }
                var parsedData = JSON.parse(data.Payload);
                if (parsedData.statusCode == 400) {
                    done({
                        statusCode: 400,
                        Payload: JSON.stringify(parsedData.body)
                    });
                } else {
                    done(null, {
                        statusCode: 200,
                        Payload: JSON.stringify(parsedData.body)
                    });
                }
            });
            break;
        case 'GET':
            // get order history
            break;
        default:
            done({
                statusCode: 400,
                Payload: `Unsupported method "${event.httpMethod}"`
            });
    }
};


var route = function(event, done) {
    var resource = event.path.split("/")[1];
    console.log('Resource: ', resource);
    switch (resource) {
        case 'accounts':
            handleAccounts(event, done);
            break;
        case 'products':
            handleProducts(event, done);
            break;
        case 'users':
            handleUsers(event, done);
            break;
        case 'orders':
            handleOrder(event, done);
            break;
        default:
            done(null, {
                statusCode: 400,
                Payload: "Invalid Resource"
            });
    }
};


exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    var done = (err, res) => {
        var response = {
            "statusCode": err ? err.statusCode : res.statusCode,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": err ? err.Payload : res.Payload
        };
        console.log("Done: ", err, ", ", res);
        context.succeed(response);
    };

    console.log("Begining Routing");
    route(event, done);
};
