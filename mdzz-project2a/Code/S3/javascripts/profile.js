var app = angular.module("Profile", []);

app.controller("AccountCtrl", function($scope, $http){
    $scope.account_info = []
    $http({
      method: "GET",
      url: "https://841ejpwxqh.execute-api.us-east-1.amazonaws.com/test/accounts",
      headers: {
          'Authorization': window.sessionStorage.authorizationToken
      }
    }).then(function(res) {
          $scope.account_info = res.data.account_info;
      },
      function(res) {
          $scope.error_message = res.data.errorMessage;
      }
    );

});

app.controller("ProfileCtrl", function($scope, $http) {
    $scope.user_info = [];
    $scope.account_info = [];
    $scope.error_message = "";
    $http({
        method: "GET",
        url: "https://841ejpwxqh.execute-api.us-east-1.amazonaws.com/test/users",
        headers: {
            'Authorization': window.sessionStorage.authorizationToken
        }
    }).then(function(res) {
            $scope.user_info = res.data.user_info;
        },
        function(res) {
            $scope.error_message = res.data.errorMessage;
        }
    );

});
