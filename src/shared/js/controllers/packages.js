/* global angular,async,PIECEMETA_API_HOST,console */

(function () {
    'use strict';
    angular.module(
        'piecemeta-web.controllers.packages',
        [
            'angularFileUpload',
            'piecemeta-web.services.api',
            'piecemeta-web.services.importers.json',
            'piecemeta-web.services.importers.bvh',
            'chartjs'
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
                chartSetup: {
                    graphOptions: {
                        showTooltips: true,
                        scaleShowLabels: true,
                        animation: false,
                        responsive: true,
                        pointDot: false,
                        bezierCurve: false,
                        scaleShowGridLines: false,
                        datasetFill: false,
                        legend: true
                    }
                },
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

            $scope.onURLClick = function ($event) {
                $event.target.select();
            };

            $scope.updateChart = function () {
                var dataSets = {},
                    maxFrames = 0,
                    channel = null;

                var colors = [
                    '#ff0000', '#732e00', '#b2a159', '#435946', '#b6def2', '#8660bf', '#ff0088', '#e50000', '#331c0d', '#d6e600', '#40ffa6', '#0066bf', '#a38fbf', '#4c0029', '#d90000', '#ffb380', '#494d13', '#269973', '#80b3ff', '#442d59', '#99003d', '#590000', '#a67453', '#818c69', '#b6f2de', '#434c59', '#33004d', '#bf6086', '#d96c6c', '#ffd9bf', '#81f200', '#005359', '#334166', '#a300cc', '#d9003a', '#332626', '#cc8800', '#448000', '#36ced9', '#263699', '#fbbfff', '#e6acbb', '#7f2d20', '#7f5500', '#d6f2b6', '#698a8c', '#3d3df2', '#cc33ad', '#733941', '#8c7369', '#665533', '#8fcc66', '#002b40', '#140099', '#664d61', '#ff6600', '#ffcc00', '#17330d', '#308fbf', '#120d33', '#802060'
                ];

                $scope.data.streamGroups = [];

                channel = $scope.data.currentChannel;

                if (!channel) {
                    return;
                }

                var colorOffset = Math.floor(Math.random() * 8);
                for (var i=0; i < channel.streams.length; i+=1) {
                    if (typeof streamData[channel.streams[i].uuid] === 'object' && streamData[channel.streams[i].uuid].length > 0) {
                        var frames = streamData[channel.streams[i].uuid];
                        /*
                        var frames = [];
                        if (frameData.length > 500 * 2) {
                            var quantize = Math.floor(frameData.length / 500);
                            for (var q = 0; q < frameData.length; q += quantize) {
                                frames.push(frameData[q]);
                            }
                        } else {
                            frames = frameData;
                        }
                        frames = frameData;
                        */
                        if (typeof channel.streams[i] === 'object') {
                            var dataPath = (channel.streams[i].group ? channel.streams[i].group + '/' : '') + channel.streams[i].title;
                            var randomColValues = [];
                            for (var c = 0; c < 3; c += 1) {
                                randomColValues.push(Math.round(Math.random() * 100) + 100);
                            }
                            var color = colors.splice(colorOffset, 1);
                            var dataSet = {
                                label: dataPath,
                                strokeColor: color,
                                highlightStroke: color,
                                pointColor: color,
                                data: frames
                            };
                            if (dataSet.data.length > maxFrames) {
                                maxFrames = dataSet.data.length;
                            }
                            if (!$scope.data.currentGroup || ($scope.data.currentGroup && $scope.data.currentGroup === channel.streams[i].group)) {
                                dataSets[dataPath] = dataSet;
                            }
                            if ($scope.data.streamGroups.indexOf(channel.streams[i].group) < 0) {
                                $scope.data.streamGroups.push(channel.streams[i].group);
                            }
                        }
                    } else {
                        console.log('empty stream');
                    }
                }

                var finalDataSets = [];
                var labels = [];
                for (var d in dataSets) {
                    if (typeof dataSets[d] === 'object') {
                        finalDataSets.push(dataSets[d]);
                    }
                }

                for (var n = 1; n <= maxFrames; n += 1) {
                    labels.push('');
                }

                $scope.data.streamGroups = $scope.data.streamGroups.sort();

                if (!$scope.data.currentGroup) {
                    $scope.data.currentGroup = $scope.data.streamGroups[0];
                }

                var dataSetChart = {
                    labels: labels,
                    datasets: finalDataSets
                };

                $scope.data.chartSetup.graphDataSet = dataSetChart;
            };

            function loadStreamData(callback) {
                if (typeof $scope.data.currentChannel === 'object') {
                    streamData = {};
                    async.each($scope.data.currentChannel.streams, function (stream, next) {
                        var skipVal;
                        if (stream.frameCount > 100) {
                            skipVal = { skip: Math.floor(stream.frameCount / 100) };
                        }
                        apiService('streams', null, skipVal).actions.find(stream.uuid, function (err, frameData) {
                            streamData[stream.uuid] = frameData.frames;
                            next(err);
                        });
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
                        cb(err, dataPackage, user);
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
                            $scope.updateChart();
                            deferred.resolve();
                        });
                    }, true);
                    $scope.$watch('data.currentGroup', function () {
                        $scope.updateChart();
                    }, true);
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
}());