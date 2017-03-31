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
            console.log(items);
            if(items.errorMessage) {
                done(new Error("Error when retrieveing items info from database. Error message from db is: " + items.errorMessage));
                return;
            }
            var totalPrice = 0;
            var itemListLength = items.itemList.length;
            for (var i = 0; i < itemListLength; i++)
                totalPrice += items.itemPriceList[i];
            console.log("Charging " + totalPrice);
            console.log("For items: " + items.itemList.toString());
            stripe.customers.create({
                email: event.stripeEmail,
                card: event.stripeToken
            }).then(customer => stripe.charges.create({
                amount: totalPrice * 100,
                description: itemList.toString(),
                currency: "usd",
                customer: customer.id,
                metadata: {items: '[' + items.itemList.toString() + ']'}
            })).then(function() {
                // put buying record into database
                // TODO error handling
                try{
                  db_conn.invoke({
                      FunctionName: "DbConnector",
                      Payload: JSON.stringify({
                          operation: "insertPurchaseRecord",
                          itemList: event.itemIDList,
                          totalPrice: totalPrice,
                          email: event.buyerEmail
                      })
                  }, function(err, data){
                        if(err) {
                            console.log(err);
                            done(Error(err.errorMessage));
                            return;
                        }
                        payload = JSON.parse(data.Payload);
                        if(payload.errorMessage) {
                            done(new Error("Error when inserting buying info to database. Error message from db is: " + payload.errorMessage));
                            return;
                        }
                        done(null, {totalPrice: totalPrice});
                  })
                } catch(e) {
                    console.log(e.message);
                    done(new Error(e.message));
                }
            }, err => {
                console.log(err.message);
                done(new Error("Error when processing with stripe. Error message is: " + err.message));
            })
        })
    } catch (e) {
        console.log(e.message);
        done(new Error(e.message));
        // TODO error handling
    }
}
