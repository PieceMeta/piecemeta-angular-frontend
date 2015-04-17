/* global angular,async */
(function () {
    'use strict';
    angular.module(
        'piecemeta-web.controllers.data-channels',
        [
            'angularFileUpload',
            'piecemeta-web.services.api'
        ])
        .controller('DataChannels.Create', ['$scope', 'apiService', '$q', '$location', '$routeParams', function ($scope, apiService, $q, $location, $routeParams) {
            var deferred = $q.defer();
            $scope.data = {
                dataChannel: {
                    package_uuid: $routeParams.package_uuid
                }
            };
            $scope.formTitle = 'Create channel';
            $scope.promiseString = 'Loading...';
            $scope.promise = deferred.promise;

            async.waterfall([
                function (cb) {
                    apiService('packages').actions.find($routeParams.package_uuid, cb);
                },
                function (dataPackage, cb) {
                    if (!dataPackage) {
                        cb(new Error('No package found.'));
                        return;
                    }
                    $scope.data.dataPackage = dataPackage;
                    cb(null);
                }
            ], function (err) {
                if (err) {
                    $scope.alerts = [
                        {
                            type: 'danger',
                            msg: 'Failed to load package.'
                        }
                    ];
                    deferred.reject(err);
                    return;
                }
                deferred.resolve();
                $scope.submit = function () {
                    var deferred = $q.defer();
                    $scope.promiseString = 'Saving...';
                    $scope.promise = deferred.promise;
                    apiService('channels').actions.create($scope.data.dataChannel, function (err) {
                        if (err) {
                            $scope.alerts = [
                                {
                                    type: 'danger',
                                    msg: 'Failed to save channel.'
                                }
                            ];
                            deferred.reject(err);
                            return;
                        }
                        $scope.alerts = [
                            {
                                type: 'danger',
                                msg: 'Successfully saved channel.'
                            }
                        ];
                        deferred.resolve();
                        $location.path('/packages/edit/' + $routeParams.package_uuid);
                    });
                };
            });


        }])
        .controller('DataChannels.Edit', ['$scope', '$routeParams', '$q', '$location', 'apiService', function ($scope, $routeParams, $q, $location, apiService) {
            var deferred = $q.defer();
            $scope.data = {};
            $scope.promiseString = 'Loading channel...';
            $scope.promise = deferred.promise;
            $scope.formTitle = 'Edit channel';

            async.waterfall([
                function (cb) {
                    apiService('channels').actions.find($routeParams.uuid, cb);
                },
                function (dataChannel, cb) {
                    if (!dataChannel) {
                        cb(new Error('No channel found.'));
                        return;
                    }
                    $scope.data.dataChannel = dataChannel;
                    $scope.formTitle = 'Edit "' + dataChannel.title + '"';
                    cb(null);
                },
                function (cb) {
                    apiService('packages').actions.find($scope.data.dataChannel.package_uuid, cb);
                },
                function (dataPackage, cb) {
                    if (!dataPackage) {
                        cb(new Error('No package found.'));
                        return;
                    }
                    $scope.data.dataPackage = dataPackage;
                    cb(null);
                },
                function (cb) {
                    apiService('channels/' + $routeParams.uuid + '/streams').actions.all(cb);
                },
                function (dataStreams, cb) {
                    if (dataStreams.length > 0) {
                        $scope.data.dataStreams = dataStreams.sort(function (a, b) {
                            if (a.group < b.group) {
                                return -1;
                            } else if (a.group > b.group) {
                                return 1;
                            }
                            return 0;
                        });
                    }
                    cb(null);
                }
            ], function (err) {
                if (err) {
                    $scope.alerts = [
                        {
                            type: 'danger',
                            msg: 'Failed to load channel.'
                        }
                    ];
                    deferred.reject(err);
                    return;
                }
                deferred.resolve();
                $scope.$apply();
                $scope.deleteStream = function (stream, $event) {
                    $event.preventDefault();
                    if (window.confirm('Do you really want to delete this stream?')) {
                        var deferred = $q.defer();
                        $scope.promiseString = 'Deleting data stream...';
                        $scope.promise = deferred.promise;
                        $scope.data.dataStreams.splice($scope.data.dataStreams.indexOf(stream), 1);
                        apiService('streams').actions.remove(stream.uuid, function (err) {
                            if (err) {
                                $scope.alerts = [
                                    {
                                        type: 'danger',
                                        msg: 'Failed to delete stream.'
                                    }
                                ];
                                deferred.reject(err);
                                return console.log('error deleting stream', err);
                            }
                            $scope.alerts = [
                                {
                                    type: 'success',
                                    msg: 'Successfully saved stream.'
                                }
                            ];
                            deferred.resolve();
                            $scope.$apply();
                        });
                    }
                };
                $scope.deleteCurrentItem = function () {
                    if (window.confirm('Do you really want to delete this channel and all attached streams?')) {
                        var deferred = $q.defer();
                        $scope.promiseString = 'Deleting channel and streams...';
                        $scope.promise = deferred.promise;
                        async.waterfall([
                            function (cb) {
                                    apiService('channels/' + $routeParams.uuid + '/streams').actions.all(function (err, streams) {
                                        async.each(streams, function (stream, nextStream) {
                                            apiService('streams').actions.remove(stream.uuid, nextStream);
                                        }, cb);
                                    });
                            },
                            function (cb) {
                                apiService('channels').actions.remove($routeParams.uuid, cb);
                            }
                        ], function (err) {
                            if (err) {
                                $scope.alerts = [
                                    {
                                        type: 'danger',
                                        msg: 'Failed to delete channel.'
                                    }
                                ];
                                deferred.reject(err);
                                return console.log('error deleting channel', err);
                            }
                            deferred.resolve();
                            $location.path('/packages/' + $scope.data.dataPackage.uuid + '/edit');
                        });
                    }
                };
                $scope.submit = function () {
                    var deferred = $q.defer();
                    $scope.promiseString = 'Saving...';
                    $scope.promise = deferred.promise;
                    apiService('channels').actions.update($routeParams.uuid, $scope.data.dataChannel, function (err) {

                        if (err) {
                            console.log(err);
                            $scope.alerts = [
                                {
                                    type: 'danger',
                                    msg: 'Failed to update channel.'
                                }
                            ];
                            deferred.reject(err);
                            return;
                        }
                        deferred.resolve();
                        $scope.alerts = [
                            {
                                type: 'success',
                                msg: 'Successfully updated channel.'
                            }
                        ];
                    });
                };
            });
        }]);
}());