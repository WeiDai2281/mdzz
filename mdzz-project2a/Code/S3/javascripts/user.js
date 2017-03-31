var app = angular.module("User", [], function($locationProvider) {
    //$locationProvider.html5Mode(true);
});

app.controller("Signup", function($scope, $http) {
    $scope.email = "";
    $scope.password = "";
    $scope.firstname = "";
    $scope.lastname = "";
    $scope.cellphone = "";
    $scope.submit_signup = function() {
        $http({
            method: "POST",
            url: "https://841ejpwxqh.execute-api.us-east-1.amazonaws.com/test/users/signup",
            data: JSON.stringify({
                "user_info": {
                    "email": $scope.email,
                    "password": $scope.password,
                    "firstname": $scope.firstname,
                    "lastname": $scope.lastname,
                    "cellphone": $scope.cellphone
                },
            }),
            headers: {
                "Authorization": "placeholder"
            }
        }).then(function(data) {
                $scope.error_message = "Confirmation email is sent.";
                //        window.sessionStorage.setItem('authorizationToken', data.data.authorizationToken);
                //        window.sessionStorage.setItem('email', $scope.email);
                //        window.location = "profile.html";
            },
            function(res) {
                $scope.error_message = res.data.errorMessage;
            });
    };
});

app.controller("Login", function($scope, $http) {
    $scope.email = "";
    $scope.password = "";

    $scope.submit_login = function() {
        $http({
            method: "POST",
            url: "https://841ejpwxqh.execute-api.us-east-1.amazonaws.com/test/users/login",
            data: JSON.stringify({
                "user_info": {
                    "email": $scope.email,
                    "password": $scope.password
                }
            }),
            headers: {
                "Authorization": "placeholder"
            }
        }).then(function(data) {
                console.log(data.data);
                window.sessionStorage.setItem('authorizationToken', data.data.authorizationToken);
                window.sessionStorage.setItem('email', $scope.email);
                window.location = "profile.html";
            },
            function(res) {
                $scope.error_message = res.data.errorMessage;
            });
    };
});

app.controller("VerifyCtrl", function($scope, $http, $location) {
    $scope.vfy_message = "";
    $scope.verify = function() {
        var url = $location.absUrl();
        if (url.indexOf("?token=") == -1) {
            $scope.vfy_message = "Missing token in url";
            return;
        }
        var token = url.split("?token=")[1];
        $http({
            method: "GET",
            url: "https://841ejpwxqh.execute-api.us-east-1.amazonaws.com/test/users/verify",
            params: {
                "token": token
            },
            headers: {
                "Authorization": "placeholder"
            }
        }).then(function(data) {
                console.log("Data");
                window.sessionStorage.setItem('authorizationToken', data.data.authorizationToken);
                window.sessionStorage.setItem('email', $scope.email);
                window.location = "profile.html";
            },
            function(res) {
                console.log("Error: ", res);
                $scope.vfy_message = res.data.errorMessage;
            });
    };
});
