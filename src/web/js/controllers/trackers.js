/* global angular */
(function () {
    'use strict';
    angular.module(
        'piecemeta-web.controllers.trackers',
        [
            'piecemeta-web.services.api'
        ])
        .controller('Trackers.Create', ['$scope', 'apiService', '$q', '$location', function ($scope, apiService, $q, $location) {
            $scope.tracker = {
                title: null,
                description: null
            };
            $scope.formTitle = 'Create Tracker';
            $scope.submit = function () {
                var deferred = $q.defer();
                $scope.promiseString = 'Saving...';
                $scope.promise = deferred.promise;
                apiService('trackers').actions.create($scope.tracker, function (err, tracker) {
                    if (err) {
                        $scope.alerts = [
                            {
                                type: 'danger',
                                msg: 'Failed to save tracker.'
                            }
                        ];
                        deferred.reject(err);
                        return;
                    }
                    $scope.alerts = [
                        {
                            type: 'success',
                            msg: 'Successfully registered tracker.'
                        }
                    ];
                    deferred.resolve();
                    $location.path('/trackers/' + tracker.id + '/edit');
                });
            };
        }])
        .controller('Trackers.Edit', ['$scope', '$routeParams', '$q', 'apiService', function ($scope, $routeParams, $q, apiService) {
            var deferred = $q.defer();
            $scope.promiseString = 'Loading Tracker...';
            $scope.promise = deferred.promise;
            $scope.formTitle = 'Edit Tracker';

            apiService('trackers').actions.find($routeParams.id, function (err, tracker) {
                if (err) {
                    $scope.alerts = [
                        {
                            type: 'danger',
                            msg: 'Failed to load tracker.'
                        }
                    ];
                    deferred.reject(err);
                    return console.log('error getting tracker', err);
                }
                $scope.tracker = tracker;
                deferred.resolve();
                $scope.submit = function () {
                    var deferred = $q.defer();
                    $scope.promiseString = 'Saving...';
                    $scope.promise = deferred.promise;
                    apiService('trackers').actions.update($routeParams.id, $scope.tracker, function (err) {
                        if (err) {
                            console.log(err);
                            $scope.alerts = [
                                {
                                    type: 'danger',
                                    msg: 'Failed to update tracker.'
                                }
                            ];
                            deferred.reject(err);
                            return;
                        }
                        $scope.alerts = [
                            {
                                type: 'success',
                                msg: 'Successfully updated tracker.'
                            }
                        ];
                        deferred.resolve();
                    });
                };
            });
        }])
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