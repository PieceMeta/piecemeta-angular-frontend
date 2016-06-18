/* global angular,async,PIECEMETA_API_HOST,console,define */

'use strict';

define([
    'services_api',
    'services_importers_json',
    'services_importers_bvh'
], function () {
    return angular.module(
        'piecemeta-web.controllers.packages',
        [
            'ngFileUpload',
            'piecemeta-web.services.api',
            'piecemeta-web.services.importers.json',
            'piecemeta-web.services.importers.bvh'
        ])
        .controller('Packages.ImportBVH', ['$scope', '$q', 'bvhImportService', function ($scope, $q, bvhImportService) {
            $scope.file = null;
            $scope.onFileSelect = function ($files) {
                var deferred = $q.defer();
                $scope.promiseString = 'Importing data...';
                $scope.promise = deferred.promise;

                $scope.file = $files[0];
                $scope.dataPackage = null;
                var reader = new FileReader();
                reader.onload = function (onLoadEvent) {
                    bvhImportService.parse(onLoadEvent.target.result, $files[0].name, function (err, result) {
                        if (err) {
                            console.log('error processing bvh file', err);
                            deferred.reject(err);
                            return;
                        }
                        $scope.dataPackage = result;
                        console.log('successfully processed bvh file', result);
                        deferred.resolve();
                    });
                };
                reader.readAsText($files[0]);
            };
        }])
        .controller('Packages.ImportJSON', ['$scope', '$q', '$routeParams', 'jsonImportService', function ($scope, $q, $routeParams, jsonImportService) {
            $scope.file = null;
            $scope.onFileSelect = function ($files) {
                var deferred = $q.defer();
                $scope.promiseString = 'Importing data...';
                $scope.promise = deferred.promise;

                $scope.file = $files[0];
                $scope.dataPackage = null;
                var reader = new FileReader();
                reader.onload = function (onLoadEvent) {
                    console.log('onload');
                    jsonImportService.parse(onLoadEvent.target.result, $files[0].name, $routeParams.garbage, function (err, result) {
                        if (err) {
                            console.log('error processing json file', err);
                            deferred.reject(err);
                            return;
                        }
                        $scope.dataPackage = result;
                        console.log('successfully processed json file', result);
                        deferred.resolve();
                    });
                };
                reader.readAsText($files[0]);
            };
        }])
        .controller('Packages.Show', ['$scope', '$q', '$routeParams', 'apiService', function ($scope, $q, $routeParams, apiService) {
            var streamData = {};
            $scope.data = {
                streamGroups: [],
                dataPackage: null,
                currentGroup: null,
                channelIndex: 0,
                chartSetup: {},
                exports: {
                    json: PIECEMETA_API_HOST + '/exports/' + $routeParams.uuid + '.json',
                    msgpack: PIECEMETA_API_HOST + '/exports/' + $routeParams.uuid + '.msgpack',
                    xml: PIECEMETA_API_HOST + '/exports/' + $routeParams.uuid + '.xml'
                }
            };
            $scope.updateTimeout = null;
            var deferred = $q.defer();
            $scope.promiseString = 'Loading data...';
            $scope.promise = deferred.promise;
            $scope.collapseUrls = false;

            $scope.onURLClick = function ($event) {
                $event.target.select();
            };

            $scope.updateChart = function () {
                if ($scope.chartPromise && $scope.chartPromise.$$state.status === 0) {
                    return;
                }

                var deferred = $q.defer(),
                    dataSets = {},
                    maxFrames = 0,
                    channel;

                $scope.chartPromise = deferred.promise;
                $scope.data.streamGroups = [];

                channel = $scope.data.currentChannel;

                if (!channel || !$scope.data.selectedStreams) {
                    deferred.resolve();
                    $scope.chartPromise = null;
                    return;
                }

                var properties = [],
                    labels = [];

                for (var s = 0; s < channel.streams.length; s += 1) {
                    if ($scope.data.selectedStreams.indexOf(channel.streams[s]) > -1) {
                        for (var p = 0; p < channel.streams[s].labels.length; p += 1) {
                            if (p !== channel.streams[s].timeAtIndex) {
                                properties.push(channel.streams[s].labels[p]);
                            }
                            if ($scope.data.selectedProperties && $scope.data.selectedProperties.indexOf(channel.streams[s].labels[p]) > -1) {
                                if (!$scope.data.currentGroup || ($scope.data.currentGroup && $scope.data.currentGroup === channel.streams[s].group)) {
                                    var dataPath = channel.streams[s].labels[p],
                                        dataSet = {
                                            label: dataPath
                                        };
                                    var frames = [],
                                        frameCount = streamData[channel.streams[s].uuid].length;
                                    if (frameCount > maxFrames) {
                                        maxFrames = frameCount;
                                    }
                                    for (var f = 0; f < frameCount; f += 1) {
                                        if (channel.streams[s].timeAtIndex >= 0 && labels.length !== frameCount) {
                                            labels.push(streamData[channel.streams[s].uuid][f][channel.streams[s].timeAtIndex]);
                                        }
                                        frames.push(streamData[channel.streams[s].uuid][f][p]);
                                    }
                                    dataSet.data = frames;
                                    dataSets[dataPath] = dataSet;
                                }
                            }
                        }
                    }
                    $scope.data.properties = properties;
                    if ($scope.data.streamGroups.indexOf(channel.streams[s].group) < 0) {
                        $scope.data.streamGroups.push(channel.streams[s].group);
                    }
                }

                var finalDataSets = [];
                var series = [];
                for (var d in dataSets) {
                    if (typeof dataSets[d] === 'object') {
                        finalDataSets.push(dataSets[d].data);
                        series.push(dataSets[d].label);
                    }
                }

                $scope.data.streamGroups = $scope.data.streamGroups.sort();

                if (!$scope.data.currentGroup) {
                    $scope.data.currentGroup = $scope.data.streamGroups[0];
                }

                $scope.data.chartSetup.graphDataSet = finalDataSets;
                $scope.data.chartSetup.labels = labels;
                $scope.data.chartSetup.series = series;
                $scope.data.chartSetup.options = {};

                deferred.resolve();
                $scope.chartPromise = null;
            };

            function loadStreamData(callback) {
                if (typeof $scope.data.currentChannel === 'object') {
                    streamData = {};
                    async.each($scope.data.currentChannel.streams, function (stream, next) {
                        console.log($scope.data.currentGroup, stream.group);
                        if (!$scope.data.currentGroup || ($scope.data.currentGroup && $scope.data.currentGroup === stream.group)) {
                            var skipVal;
                            if (stream.frameCount > 100) {
                                skipVal = {skip: Math.floor(stream.frameCount / 100), from: 0, to: stream.frameCount};
                            }
                            apiService('streams/' + stream.uuid + '/frames', null, skipVal).actions.all(function (err, frameData) {
                                streamData[stream.uuid] = frameData.frames;
                                window.setTimeout(function () {
                                    next(err);
                                }, 0);
                            });
                        } else {
                            next();
                        }
                    }, function (err) {
                        if (typeof callback === 'function') {
                            callback(err);
                        }
                    });
                } else {
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            }

            async.waterfall([
                function (cb) {
                    apiService('packages').actions.find($routeParams.uuid, cb);
                },
                function (dataPackage, cb) {
                    apiService('users').actions.find(dataPackage.user_uuid, function (err, user) {
                        if (err) {
                            console.log('error loading package author: ' + err.message);
                        }
                        cb(null, dataPackage, user);
                    });
                },
                function (dataPackage, user, cb) {
                    $scope.data.dataPackage = dataPackage;
                    $scope.data.packageAuthor = user;
                    $scope.data.dataURL = PIECEMETA_API_HOST + '/packages/' + dataPackage.uuid;
                    cb(null);
                },
                function (cb) {
                    apiService('packages/' + $scope.data.dataPackage.uuid + '/channels').actions.all(cb);
                },
                function (dataChannels, cb) {
                    $scope.data.dataPackage.channels = dataChannels.sort(function (a, b) {
                        if (a.title < b.title) {
                            return -1;
                        } else if (a.title > b.title) {
                            return 1;
                        }
                        return 0;
                    });
                    cb(null);
                },
                function (cb) {
                    async.eachSeries($scope.data.dataPackage.channels, function (channel, nextChannel) {
                        apiService('channels/' + channel.uuid + '/streams').actions.all(function (err, dataStreams) {
                            if (err) {
                                return nextChannel(err);
                            }
                            $scope.data.dataPackage.channels[$scope.data.dataPackage.channels.indexOf(channel)].streams = dataStreams;
                            nextChannel();
                        });
                    }, function (err) {
                        cb(err);
                    });
                },
                function (cb) {
                    $scope.$watch('data.currentChannel', function () {
                        var deferred = $q.defer();
                        $scope.chartPromise = deferred.promise;
                        loadStreamData(function (err) {
                            if (err) {
                                console.log('error getting stream data', err);
                            }
                            deferred.resolve();
                            $scope.updateChart();
                        });
                    }, true);
                    $scope.$watch('data.currentGroup', $scope.updateChart, true);
                    $scope.$watch('data.selectedStreams', $scope.updateChart, true);
                    $scope.$watch('data.selectedProperties', $scope.updateChart, true);
                    cb(null);
                }
            ], function (err) {
                if (err) {
                    deferred.reject(err);
                    console.log('error getting data', $routeParams, err);
                    $scope.$parent.status = 'ready';
                    return;
                }
                $scope.$apply();
                deferred.resolve();
                $scope.$parent.status = 'ready';
            });
        }])
        .controller('Packages.List', ['$scope', 'apiService', function ($scope, apiService) {
            $scope.data = {};
            apiService('packages').actions.all(function (err, data_packages) {
                if (err) {
                    return console.log('error getting packages', err);
                }
                $scope.data.data_packages = data_packages.sort(function (a, b) {
                    if (a.title < b.title) {
                        return -1;
                    } else if (a.title > b.title) {
                        return 1;
                    }
                    return 0;
                });
                $scope.$apply();
            });
        }])
        .controller('Packages.Create', ['$scope', 'apiService', '$q', '$location', function ($scope, apiService, $q, $location) {
            $scope.dataPackage = {
                title: null,
                description: null,
                contributor_uuid: null
            };
            $scope.formTitle = 'Create package';
            $scope.submit = function () {
                var deferred = $q.defer();
                $scope.promiseString = 'Saving...';
                $scope.promise = deferred.promise;
                apiService('packages').actions.create($scope.dataPackage, function (err, data_package) {
                    if (err) {
                        $scope.alerts = [
                            {
                                type: 'danger',
                                msg: 'Failed to save Package.'
                            }
                        ];
                        deferred.reject(err);
                        return;
                    }
                    $scope.alerts = [
                        {
                            type: 'success',
                            msg: 'Successfully saved Package.'
                        }
                    ];
                    deferred.resolve();
                    $location.path('/packages/' + data_package.uuid + '/edit');
                });
            };
        }])
        .controller('Packages.Edit', ['$scope', '$routeParams', '$q', '$location', 'apiService', function ($scope, $routeParams, $q, $location, apiService) {
            var deferred = $q.defer();
            $scope.promiseString = 'Loading Package...';
            $scope.promise = deferred.promise;
            $scope.formTitle = 'Edit package';

            $scope.deleteChannel = function (channel, $event) {
                $event.preventDefault();
                if (window.confirm('Do you really want to delete this channel and all attached streams?')) {
                    var deferred = $q.defer();
                    $scope.promiseString = 'Deleting channel and streams...';
                    $scope.promise = deferred.promise;
                    async.waterfall([
                        function (cb) {
                            apiService('channels/' + channel.uuid + '/streams').actions.all(function (err, streams) {
                                async.each(streams, function (stream, nextStream) {
                                    apiService('streams').actions.remove(stream.uuid, nextStream);
                                }, cb);
                            });
                        },
                        function (cb) {
                            apiService('channels').actions.remove(channel.uuid, cb);
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
                        $scope.dataChannels.splice($scope.dataChannels.indexOf(channel), 1);
                        $scope.$apply();
                    });
                }
            };
            $scope.deleteCurrentItem = function () {
                if (window.confirm('Do you really want to delete this package and all attached channels and streams?')) {
                    var deferred = $q.defer();
                    $scope.promiseString = 'Deleting package, channels and streams...';
                    $scope.promise = deferred.promise;
                    async.waterfall([
                        function (cb) {
                            apiService('packages/' + $routeParams.uuid + '/channels').actions.all(cb);
                        },
                        function (channels, cb) {
                            async.each(channels, function (channel, next) {
                                apiService('channels/' + channel.uuid + '/streams').actions.all(function (err, streams) {
                                    async.each(streams, function (stream, nextStream) {
                                        apiService('streams').actions.remove(stream.uuid, nextStream);
                                    }, function (err) {
                                        if (err) {
                                            next(err);
                                        } else {
                                            apiService('channels').actions.remove(channel.uuid, next);
                                        }
                                    });
                                });
                            }, cb);
                        },
                        function (cb) {
                            apiService('packages').actions.remove($routeParams.uuid, cb);
                        }
                    ], function (err) {
                        if (err) {
                            $scope.alerts = [
                                {
                                    type: 'danger',
                                    msg: 'Failed to delete package.'
                                }
                            ];
                            deferred.reject(err);
                            return console.log('error deleting package', err);
                        }
                        deferred.resolve();
                        $location.path('/packages/browse');
                    });
                }
            };
            $scope.submit = function () {
                var deferred = $q.defer();
                $scope.promiseString = 'Saving...';
                $scope.promise = deferred.promise;
                apiService('packages').actions.update($routeParams.uuid, $scope.dataPackage, function (err) {
                    if (err) {
                        console.log(err);
                        $scope.alerts = [
                            {
                                type: 'danger',
                                msg: 'Failed to update Package.'
                            }
                        ];
                        deferred.reject(err);
                        return;
                    }
                    deferred.resolve();
                    $scope.alerts = [
                        {
                            type: 'success',
                            msg: 'Successfully updated Package.'
                        }
                    ];
                });
            };

            apiService('packages').actions.find($routeParams.uuid, function (err, data_package) {
                if (err) {
                    $scope.alerts = [
                        {
                            type: 'danger',
                            msg: 'Failed to load Package.'
                        }
                    ];
                    deferred.reject(err);
                    return console.log('error getting package', err);
                }
                $scope.dataPackage = data_package;
                $scope.formTitle = 'Edit "' + data_package.title + '"';
                apiService('packages/' + data_package.uuid + '/channels').actions.all(function (err, data_channels) {
                    if (err) {
                        $scope.alerts = [
                            {
                                type: 'danger',
                                msg: 'Failed to load Channels.'
                            }
                        ];
                        deferred.reject(err);
                        return console.log('error getting channels', err);
                    }
                    if (data_channels.length > 0) {
                        $scope.dataChannels = data_channels.sort(function (a, b) {
                            if (a.title < b.title) {
                                return -1;
                            } else if (a.title > b.title) {
                                return 1;
                            }
                            return 0;
                        });
                    }
                    deferred.resolve();
                    $scope.$apply();
                });
            });
        }]);
});