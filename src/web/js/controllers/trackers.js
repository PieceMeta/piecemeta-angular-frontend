/* global angular */
(function () {
    'use strict';
    angular.module(
        'piecemeta-web.controllers.trackers',
        [
            'piecemeta-web.services.api'
        ])
        .controller('Trackers.List', ['$scope', 'apiService', function ($scope, apiService) {
            $scope.data = {};
            apiService('trackers').actions.all(function (err, trackers) {
                if (err) {
                    return console.log('error getting trackers', err);
                }
                $scope.data.trackers = trackers;
                $scope.$apply();
            });
        }]);
}());