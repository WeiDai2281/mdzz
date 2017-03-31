var mysql = require('mysql'),
    crypto = require('crypto'),
    jwt = require('jsonwebtoken'),
    _ = require('lodash'),
    AWS = require("aws-sdk"),
    db_conn = new AWS.Lambda();

const LENGTH = 16;

var createToken = function(user_info) {
    return jwt.sign(user_info, process.env.SECRET_KEY, {
        expiresIn: 60 * 20
    });
};

//Function for send verification email

var SendEmailToVerify = function(message, context, callback) {
        var sns = new AWS.SNS();
        sns.publish({
            TopicArn: "arn:aws:sns:us-east-1:062874207600:Registration",
            Message: JSON.stringify(message)
        }, function(err, data) {
            if (err) {
                console.error('error publishing to SNS');
                context.fail(err);
                callback(err, null);
            } else {
                console.info('message published to SNS');
                console.log(data);
                context.done(null, data);
                callback(null, {
                    "message": "confirmation email has been sent"
                })
            }
        });
    }
    //

var generateSalt = function(length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
}

var hashPassword = function(user_info, salt) {
    var hash = crypto.createHmac('sha512', new Buffer(salt));
    hash.update(user_info.password);
    user_info.password = hash.digest('hex');
}

var getInfo = function(event, callback) {
    db_conn.invoke({
        FunctionName: "DbConnector",
        Payload: JSON.stringify({
            operation: "getUserInfo",
            customer_id: event.customer_id
        })
    }, function(err, data) {
        if (err) {
            callback(err);
            return;
        }
        data = JSON.parse(data.Payload);
        console.log(data);
        if (data.error) {
            console.log(data.error);
            callback(data.error);
            return;
        }
        if (data.user_info.length === 0) {
            callback('Customer id does not exist');
            return;
        }
        console.log(data.user_info);
        callback(null, {
            "user_info": data.user_info[0]
        });
        return;
    });
};


var signup = function(event, context, callback) {
    db_conn.invoke({
        FunctionName: "DbConnector",
        Payload: JSON.stringify({
            operation: "search",
            email: event.user_info.email
        }),
    }, function(err, data) {
        if (err) {
            callback(err);
            return;
        }
        data = JSON.parse(data.Payload);
        if (data.data.length > 0) {
            callback(`An account is registered using "${event.user_info.email}"`);
            return;
        } else {
            //if haven't been encoded, create token and send email
            var salt = generateSalt(LENGTH);
            hashPassword(event.user_info, salt);
            event.user_info.salt = salt;
            SendEmailToVerify({
                "email": event.user_info.email,
                "token": createToken(event.user_info)
            }, context, function(err, data) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, data);
            });

        }
    });
}

var verify = function(event, callback) {
    var token = event.token;
    jwt.verify(token, process.env.SECRET_KEY, function(err, decoded) {
        console.log("Err: ", err);
        console.log("Decoded: ", decoded);
        if (err) {
            callback(err, null);
            return;
        }

        db_conn.invoke({
            FunctionName: "DbConnector",
            Payload: JSON.stringify({
                operation: "search",
                email: decoded.email
            }),
        }, function(err, data) {
            console.log("Err: ", err);
            console.log("data: ", data);
            if (err) {
                callback(err);
                return;
            }
            data = JSON.parse(data.Payload);
            if (data.data.length > 0) {
                callback(`An account is registered using "${decoded.email}"`);
                return;
            }

            db_conn.invoke({
                FunctionName: "DbConnector",
                Payload: JSON.stringify({
                    operation: "register",
                    user_info: decoded,
                }),
            }, function(err, data) {
                console.log("DB err: ", err);
                console.log("DB data: ", data);
                data = JSON.parse(data.Payload);
                if (err) {
                    callback(err);
                    return;
                }
                if (data.err) {
                    callback(data.err);
                    return;
                }
                callback(null, {
                    "authorizationToken": createToken(data.data)
                });
            });
        });
    });

}

var login = function(event, callback) {
    db_conn.invoke({
        FunctionName: "DbConnector",
        Payload: JSON.stringify({
            operation: "search",
            email: event.user_info.email
        }),
    }, function(err, data) {
        if (err) {
            callback(err);
            return;
        }
        data = JSON.parse(data.Payload);
        if (data.err) {
            callback(data.err);
            return;
        }
        var user = data.data;
        console.log(user);
        if (user.length === 0) {
            callback("The email address or the password does not match.");
        } else {
            user = user[0];
            hashPassword(event.user_info, user.salt);
            if (event.user_info.password != user.password) {
                callback("The email address or the password does not match.");
            }
            console.log("User", user);
            var token = createToken({
                customer_id: user.customer_id,
                account_id: user.account_id
            });
            callback(null, {
                "authorizationToken": token
            });
        }
    });
};



exports.handler = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    switch (event.operation) {
        case "signup":
            signup(event, context, callback);
            break;
        case "login":
            login(event, callback);
            break;
        case "getInfo":
            getInfo(event, callback);
            break;
        case "verify":
            verify(event, callback);
            break;
        default:
            callback(`Unsupported operation "${event.operation}"`);
            break;
    }
};
