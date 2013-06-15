var app = angular.module('app', ['barry']);

function AppCtrl($scope, $barry) {
  $barry.consumer('client/count').toScope($scope, 'numClients');
}
