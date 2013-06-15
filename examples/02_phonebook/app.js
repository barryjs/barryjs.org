var app = angular.module('app', ['barry']);

function PhonebookCtrl($scope, $barry) {
  var consumer = $barry.consumer(null).toScope($scope, 'suggestions');

  $scope.$watch('prefix', function (prefix) {
    consumer.setUrl(prefix ? 'phonebook/'+prefix+'*' : null);
  });
}
