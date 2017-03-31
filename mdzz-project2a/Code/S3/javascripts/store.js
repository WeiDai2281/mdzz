var app = angular.module("Store", []);

app.controller();

app.controller("StoreCtrl", function($scope, $http) {
    $scope.item_list = [];
    $scope.cart = [];
    $http({
        method: "GET",
        url: "https://841ejpwxqh.execute-api.us-east-1.amazonaws.com/test/products",
        headers: {
          'Authorization': window.sessionStorage.authorizationToken
        }
    }).then(function(res) {
            $scope.item_list = res.data.item_list;
        },
        function(res) {
            $scope.error_message = res.data.store_error;
        });

    $scope.submit_order = function() {
        var selected_items = [];
        angular.forEach($scope.item_list, function(item) {
            if (item.checked) {
                selected_items.push(item.good_id);
            }
        });

        $http({
            method: "POST",
            url: "https://841ejpwxqh.execute-api.us-east-1.amazonaws.com/test/orders",
            data: JSON.stringify({
                "itemIDList": selected_items
            }),
            headers: {
                'Authorization': window.sessionStorage.authorizationToken
            }
        }).then(function(data) {
            var handler = StripeCheckout.configure({
                key: data.data.keyPublishable,
                image: 'https://stripe.com/img/documentation/checkout/marketplace.png',
                locale: 'auto',
                token: function(token) {
                    console.log(token.id);
                    // post to save customer
                }
            });

            handler.open({
                name: 'Stripe.com',
                description: '',
                zipCode: true,
                billingAddress: false,
                amount: parseFloat(data.data.totalPrice)*100
            });
        }, function(req) {
            $('#order_error').text(req.responseText);
        });
    };

});
