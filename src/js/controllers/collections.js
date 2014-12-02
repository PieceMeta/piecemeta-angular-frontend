(function () {
    'use strict';
    angular.module(
        'piecemeta-web.controllers.collections',
        [
            'piecemeta-web.services.api'
        ])
        .controller('Collections.Create', ['$scope', 'apiService', '$q', '$location', '$routeParams', function ($scope, apiService, $q, $location, $routeParams) {
            $scope.dataCollection = {
                title: null,
                description: null
            };
            $scope.formTitle = 'Create Collection';
            $scope.submit = function () {
                var deferred = $q.defer();
                $scope.promiseString = 'Saving...';
                $scope.promise = deferred.promise;
                apiService('collections').actions.create($scope.dataCollection, function (err, data_collection) {
                    if (err) {
                        $scope.alerts = [
                            {
                                type: 'danger',
                                msg: 'Failed to save Collection.'
                            }
                        ];
                        deferred.reject(err);
                        return;
                    }
                    $scope.alerts = [
                        {
                            type: 'success',
                            msg: 'Successfully created Collection.'
                        }
                    ];
                    deferred.resolve();
                    $location.path('/collections/' + data_collection.id + '/edit');
                });
            };
        }])
        .controller('Collections.Edit', ['$scope', '$routeParams', '$q', 'apiService', function ($scope, $routeParams, $q, apiService) {
            var deferred = $q.defer();
            $scope.promiseString = 'Loading Collection...';
            $scope.promise = deferred.promise;
            $scope.formTitle = 'Edit Collection';

            apiService('collections').actions.find($routeParams.id, function (err, data_collection) {
                if (err) {
                    $scope.alerts = [
                        {
                            type: 'danger',
                            msg: 'Failed to load Collection.'
                        }
                    ];
                    deferred.reject(err);
                    return console.log('error getting collection', err);
                }
                $scope.dataCollection = data_collection;
                deferred.resolve();
                $scope.submit = function () {
                    var deferred = $q.defer();
                    $scope.promiseString = 'Saving...';
                    $scope.promise = deferred.promise;
                    apiService('collections').actions.update($routeParams.id, $scope.dataCollection, function (err, data_collection) {
                        if (err) {
                            console.log(err);
                            $scope.alerts = [
                                {
                                    type: 'danger',
                                    msg: 'Failed to update Collection.'
                                }
                            ];
                            deferred.reject(err);
                            return;
                        }
                        deferred.resolve();
                        $scope.alerts = [
                            {
                                type: 'success',
                                msg: 'Successfully updated Collection.'
                            }
                        ];
                    });
                };
            });
        }]);
}());