const keyPublishable = process.env.PUBLISHABLE_KEY;
const keySecret = process.env.SECRET_KEY;

var stripe = require('stripe')(keySecret);
var aws = require('aws-sdk');
var db_conn = new aws.Lambda();

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const done = (err, res) => callback (null, {
        statusCode: err ? '400' : '200',
        body: err ? {errorMessage: err.message} : res,
        headers: {'Content-Type': 'application/json',},
    });

    console.log("length = " + event.itemIDList.length);
    if(event.itemIDList.length == 0) {
        done(new Error('Can not checkout with 0 item'));
        return;
    }

    try {
        db_conn.invoke({
            FunctionName: "DbConnector",
            Payload: JSON.stringify({
                operation: "searchItemBasedOnID",
                itemIDList: event.itemIDList
            })
        }, function(err, data){
            if(err) {
                console.log(err);
                done(Error(err.errorMessage));
                return;
            }
            var items = JSON.parse(data.Payload);
            if(items.errorMessage) {
                console.log(items);
                done(new Error("Error when retrieveing items info from database. Error message from db is: " + items.errorMessage));
                return;
            }
            var totalPrice = 0;
            var itemListLength = items.itemList.length;
            for (var i = 0; i < itemListLength; i++)
                totalPrice += items.itemPriceList[i];
            console.log("Checkout", items);
            console.log("Total Price " + totalPrice);
            ret = {
                keyPublishable: keyPublishable,
                itemList: '[' + items.itemList + ']',
                itemNameList: items.itemNameList,
                itemPriceList: items.itemPriceList,
                totalPrice: totalPrice
            };
            done(null, ret);
        });
    } catch (e) {
        console.log(e.message);
        done(new Error(e.message));
    }
}
