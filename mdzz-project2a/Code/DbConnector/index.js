var mysql = require('mysql');

var getUserInfo = function(done, conn, event) {
    var p = new Promise(function(resolve, reject) {
        conn.connect();
        conn.query('SELECT account_number, first_name, last_name, phone from customers where customer_id = ?', [event.customer_id], function(error, results, fields) {
            if (error) return reject(error);
            var json = JSON.parse(JSON.stringify(results));
            resolve(json);
        });
    });

    p.then(function(data) {
        conn.end();
        done(null, {
            user_info: data,
        });
    }).catch(function(error) {
        conn.end();
        console.log(error);
        done(error);
    });
};

// Register user
var register = function(done, conn, event) {
    var addCustomer = new Promise(function(resolve, reject) {
        conn.connect();
        conn.query('INSERT INTO customers SET ?', {
            'email': event.user_info.email.toLowerCase(),
            'password': event.user_info.password,
            'salt': event.user_info.salt,
            'first_name': event.user_info.firstname,
            'last_name': event.user_info.lastname,
            'phone': event.user_info.phone,
            'account_number': 0
        }, function(error, results, fields) {
            console.log("Customer Error:", error);
            console.log("Customer Results:", results);
            if (error) return reject(error);
            resolve(results);
        });
    });

    addCustomer.then(function(results) {
        conn.end();
        console.log("Success: ", results);
        var data = {};
        data.customer_id = results.insertId;
        data.account_id = 0;
        done(null, {
            data: data
        });
    }).catch(function(error) {
        conn.end();
        console.log("Error: ", error);
        done(null, {
            error: error
        });
    });
};


// Search user
var search = function(done, conn, event) {
    var p = new Promise(function(resolve, reject) {
        conn.connect();
        conn.query('SELECT password, salt, customer_id, account_number from customers where email = ?', event.email.toLowerCase(), function(error, results, fields) {
            if (error) return reject(error);
            if (!results || results.length === 0) {
                return resolve([]);
            }
            var user_info = {};
            user_info["password"] = results[0].password;
            user_info["salt"] = results[0].salt;
            user_info["customer_id"] = results[0].customer_id;
            user_info["account_id"] = results[0].account_number;
            resolve([user_info]);
        });
    });

    p.then(function(data) {
        conn.end();
        done(null, {
            data: data
        });
    }).catch(function(error) {
        conn.end();
        console.log(error);
        done(null, {
            error: error
        });
    });
};


// Get product list
var getItemList = function(done, conn) {
    var p = new Promise(function(resolve, reject) {
        conn.connect();
        conn.query('SELECT good_id, good_name, merchant_name, price from goods, merchants where goods.merchant_id = merchants.merchant_id', function(error, results, fields) {
            if (error) return reject(error);
            var json = JSON.parse(JSON.stringify(results));
            resolve(json);
        });
    });

    p.then(function(data) {
        conn.end();
        done(null, {
            item_list: data,
        });
    }).catch(function(error) {
        conn.end();
        console.log(error);
        done(error);
    });
};

// Get account info
var getAccountInfo = function(done, conn, event) {
    var p = new Promise(function(resolve, reject) {
        conn.connect();
        conn.query('SELECT date_opened, balance from accounts where account_number = ?', [event.account_number], function(error, results, fields) {
            if (error) return reject(error);
            var json = JSON.parse(JSON.stringify(results));
            resolve(json);
        });
    });

    p.then(function(data) {
        conn.end();
        done(null, {
            Account_Info: data,
        });
    }).catch(function(error) {
        conn.end();
        console.log(error);
        done(error);
    });
};


// Insert payment
var insertPayment = function(done, conn, event) {
    var payment_id;
    var length = event.itemList.length;
    var p = new Promise(function(resolve, reject) {
        conn.connect();
        var created = new Date()
        conn.query('INSERT INTO payments SET ?', {
            'customer_id': event.cid,
            'account_id': event.aid,
            'created': created,
            'amount': event.totalPrice
        }, function(error, results, fields) {
            if (error) throw error;
            resolve(results);
        });
    })

    p.then(function(results) {
        for (var i = 0; i < length; i++) {
            conn.query('INSERT INTO good_list SET ?', {
                'payment_id': results.insertId,
                'good_id': event.itemList[i]
            }, function(error, results, fields) {
                if (error) throw error;
            });
        }
    }).then(function(data) {
        conn.end();
        console.log("test");
        done(null, data);
    }).catch(function(error) {
        conn.end();
        console.log("Error!");
        done(error);
    });
}

//Search product item via id
var searchItemBasedOnID = function(done, conn, event) {
    queryString = 'SELECT good_id, good_name, price from goods where';
    var itemListLength = event.itemIDList.length;
    for (var i = 1; i < itemListLength; i++)
        queryString += " good_id=? or";
    queryString += " good_id=?";

    var p = new Promise(function(resolve, reject) {
        conn.connect();
        conn.query(queryString, event.itemIDList, function(error, results, fields) {
            if (error) return reject(error);
            if (!results || !results.length) return reject("No Such Items");
            var ret = {
                'itemList': [],
                'itemNameList': [],
                'itemPriceList': []
            };
            console.log("serachID", results);
            for (var i = 0; i < results.length; i++) {
                ret.itemList.push(results[i].good_id);
                ret.itemNameList.push(results[i].good_name);
                ret.itemPriceList.push(results[i].price);
            }
            resolve(ret);
        });
    });
    p.then(function(data) {
        conn.end();
        console.log(data);
        done(null, data)
    }).catch(function(error) {
        conn.end();
        console.log("Unable to get item list!");
        done(error);

    });
}



exports.handler = (event, context, callback) => {
    var operation = event.operation;

    var conn = mysql.createConnection({
        connectionLimit: 10,
        host: 'mydbinstance.cezvifo2hz8o.us-east-1.rds.amazonaws.com',
        user: 'awsuser',
        password: 'mypassword',
        database: 'mydb',
        port: '3306'
    });

    switch (operation) {
        case "getAccountInfo":
            getAccountInfo(callback, conn, event);
            break;
        case "getUserInfo":
            getUserInfo(callback, conn, event);
            break;
        case "getAllItems":
            getItemList(callback, conn);
            break;
        case "insertPayment":
            insertPayment(callback, conn, event);
            break;
        case "search":
            search(callback, conn, event);
            break;
        case "register":
            register(callback, conn, event);
            break;
        case "searchItemBasedOnID":
            searchItemBasedOnID(callback, conn, event);
            break;
        default:
            conn.end();
            callback(new Error("Invalid Operation"));
    }
}
