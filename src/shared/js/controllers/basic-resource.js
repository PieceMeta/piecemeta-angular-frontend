/* global angular,console */
(function () {
    'use strict';
    angular.module(
        'piecemeta-web.controllers.basic-resource',
        [
            'piecemeta-web.services.api'
        ])
        .controller('BasicResource.Create', ['$scope', 'apiService', '$q', '$location', function ($scope, apiService, $q, $location) {
            var resourceSingular = $location.path.split('/')[1].substr(0, $location.path.split('/')[1].length-1);
            $scope.data = {};
            $scope.formTitle = 'Create ' + resourceSingular;
            $scope.submit = function () {
                var deferred = $q.defer();
                $scope.promiseString = 'Saving...';
                $scope.promise = deferred.promise;
                apiService(resourceSingular + 's').actions.create($scope.data, function (err, data) {
                    if (err) {
                        $scope.alerts = [
                            {
                                type: 'danger',
                                msg: 'Failed to save ' + resourceSingular
                            }
                        ];
                        deferred.reject(err);
                        return;
                    }
                    $scope.alerts = [
                        {
                            type: 'success',
                            msg: 'Successfully created ' + resourceSingular
                        }
                    ];
                    deferred.resolve();
                    $location.path('/' + resourceSingular + 's/' + data.uuid + '/edit');
                });
            };
        }])
        .controller('BasicResource.Edit', ['$scope', '$routeParams', '$q', 'apiService', '$location', function ($scope, $routeParams, $q, apiService, $location) {
            var resourceSingular = $location.path.split('/')[1].substr(0, $location.path.split('/')[1].length - 1);
            var deferred = $q.defer();
            $scope.promiseString = 'Loading...';
            $scope.promise = deferred.promise;
            $scope.formTitle = 'Edit ' + resourceSingular;

            apiService(resourceSingular + 's').actions.find($routeParams.uuid, function (err, data) {
                if (err) {
                    $scope.alerts = [
                        {
                            type: 'danger',
                            msg: 'Failed to load ' + resourceSingular
                        }
                    ];
                    deferred.reject(err);
                    return console.log('error getting ' + resourceSingular, err);
                }
                $scope.data = data;
                deferred.resolve();
                $scope.submit = function () {
                    var deferred = $q.defer();
                    $scope.promiseString = 'Saving...';
                    $scope.promise = deferred.promise;
                    apiService(resourceSingular + 's').actions.update($routeParams.uuid, $scope.dataCollection, function (err) {
                        if (err) {
                            console.log(err);
                            $scope.alerts = [
                                {
                                    type: 'danger',
                                    msg: 'Failed to update ' + resourceSingular
                                }
                            ];
                            deferred.reject(err);
                            return;
                        }
                        $scope.alerts = [
                            {
                                type: 'success',
                                msg: 'Successfully updated ' + resourceSingular
                            }
                        ];
                        deferred.resolve();
                    });
                };
            });
        }]);
}());