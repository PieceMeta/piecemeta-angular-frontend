/**
 * piecemeta-angular-frontend - Angular-based web frontend for PieceMeta service
 * @version v0.9.4
 * @link http://www.piecemeta.com
 * @license MIT
 */
// PRODUCTION
var PIECEMETA_DEV_API_URL = 'https://api.piecemeta.com';
var PIECEMETA_API_HOST = 'https://api.piecemeta.com';

// DEV
// PIECEMETA_DEV_API_URL = 'http://localhost:8080';
// PIECEMETA_API_HOST = 'http://localhost:8080';
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
/* global angular,async,console */
(function () {
    'use strict';
    angular.module(
        'piecemeta-web.controllers.channels',
        [
            'ngFileUpload',
            'piecemeta-web.services.api'
        ])
        .controller('Channels.Create', ['$scope', 'apiService', '$q', '$location', '$routeParams', function ($scope, apiService, $q, $location, $routeParams) {
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
        .controller('Channels.Edit', ['$scope', '$routeParams', '$q', '$location', 'apiService', function ($scope, $routeParams, $q, $location, apiService) {
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
/* global angular,async,PIECEMETA_API_HOST,console */

(function () {
    'use strict';
    angular.module(
        'piecemeta-web.controllers.packages',
        [
            'ngFileUpload',
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
                        console.log($scope.data.currentGroup, stream.group);
                        if (!$scope.data.currentGroup || ($scope.data.currentGroup && $scope.data.currentGroup === stream.group)) {
                            var skipVal;
                            if (stream.frameCount > 100) {
                                skipVal = {skip: Math.floor(stream.frameCount / 100)};
                            }
                            apiService('streams', null, skipVal).actions.find(stream.uuid, function (err, frameData) {
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
                        deferred.resolve();
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
/* global console,angular,async,Papa */
(function () {
    'use strict';
    angular.module(
        'piecemeta-web.controllers.streams',
        [
            'ngFileUpload',
            'piecemeta-web.services.api',
            'piecemeta-web.services.importers.text',
            'piecemeta-web.services.importers.trac'
        ])
        .controller('Streams.Create', ['$scope', 'apiService', '$q', '$location', '$routeParams', function ($scope, apiService, $q, $location, $routeParams) {
            $scope.data = {
                dataStream: {
                    channel_uuid: $routeParams.uuid
                }
            };
            var deferred = $q.defer();
            $scope.promiseString = 'Loading...';
            $scope.promise = deferred.promise;
            $scope.formTitle = 'Create stream';

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
                $scope.submit = function () {
                    var deferred = $q.defer();
                    $scope.promiseString = 'Saving...';
                    $scope.promise = deferred.promise;
                    apiService('streams').actions.create($scope.dataStream, function (err, data_stream) {
                        if (err) {
                            $scope.alerts = [
                                {
                                    type: 'danger',
                                    msg: 'Failed to save stream.'
                                }
                            ];
                            deferred.reject(err);
                            return;
                        }
                        $scope.alerts = [
                            {
                                type: 'success',
                                msg: 'Successfully saved stream.'
                            }
                        ];
                        deferred.resolve();
                        $location.path('/streams/' + data_stream.uuid + '/edit');
                    });
                };
            });
        }])
        .controller('Streams.Edit', ['$scope', '$routeParams', '$q', '$location', 'apiService', function ($scope, $routeParams, $q, $location, apiService) {
            var deferred = $q.defer();
            $scope.data = {};
            $scope.promiseString = 'Loading stream...';
            $scope.promise = deferred.promise;
            $scope.formTitle = 'Edit stream';

            async.waterfall([
                function (cb) {
                    apiService('streams').actions.find($routeParams.uuid, cb);
                },
                function (dataStream, cb) {
                    if (!dataStream) {
                        cb(new Error('No stream found.'));
                        return;
                    }
                    $scope.data.dataStream = dataStream;
                    $scope.formTitle = 'Edit "' + dataStream.title + '"';
                    cb(null);
                },
                function (cb) {
                    apiService('channels').actions.find($scope.data.dataStream.channel_uuid, cb);
                },
                function (dataChannel, cb) {
                    if (!dataChannel) {
                        cb(new Error('No channel found.'));
                        return;
                    }
                    $scope.data.dataChannel = dataChannel;
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
                }
            ], function (err) {
                if (err) {
                    $scope.alerts = [
                        {
                            type: 'danger',
                            msg: 'Failed to load stream.'
                        }
                    ];
                    deferred.reject(err);
                    return console.log('error getting stream', err);
                }
                deferred.resolve();
                $scope.submit = function () {
                    var deferred = $q.defer();
                    $scope.promiseString = 'Saving...';
                    $scope.promise = deferred.promise;
                    apiService('streams').actions.update($routeParams.uuid, $scope.data.dataStream, function (err) {
                        if (err) {
                            console.log(err);
                            $scope.alerts = [
                                {
                                    type: 'danger',
                                    msg: 'Failed to update data stream.'
                                }
                            ];
                            deferred.reject(err);
                            return;
                        }
                        $scope.alerts = [
                            {
                                type: 'success',
                                msg: 'Successfully updated stream.'
                            }
                        ];
                        deferred.resolve();
                    });
                };
                $scope.deleteCurrentItem = function () {
                    if (window.confirm('Do you really want to delete this stream?')) {
                        var deferred = $q.defer();
                        $scope.promiseString = 'Deleting data stream...';
                        $scope.promise = deferred.promise;
                        apiService('streams').actions.remove($routeParams.uuid, function (err) {
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
                            deferred.resolve();
                            $location.path('/channels/' + $scope.data.dataChannel.uuid + '/edit');
                        });
                    }
                };
                $scope.onFileSelect = function ($files) {
                    var reader = new FileReader();
                    reader.onload = function (onLoadEvent) {
                        var frames;
                        try {
                            frames = JSON.parse(onLoadEvent.target.result);
                        } catch (e) {
                            console.log('error parsing json', e);
                            $scope.alerts = [
                                {
                                    type: 'danger',
                                    msg: 'Error parsing JSON'
                                }
                            ];
                            return;
                        }
                        if (typeof frames === 'object' && frames.length > 0 && typeof frames[0] === 'number') {
                            $scope.dataStream.data_frames = frames;
                        } else {
                            $scope.alerts = [
                                {
                                    type: 'danger',
                                    msg: 'JSON is not in the required format'
                                }
                            ];
                        }
                    };
                    reader.readAsText($files[0]);
                };
            });
        }])
        .controller('Streams.ImportFile', ['$scope', '$q', '$routeParams', '$location', 'apiService', 'textImportService', function ($scope, $q, $routeParams, $location, apiService, textImportService) {
            var fileData, fileLines,
                deferred = $q.defer();

            $scope.data = {
                regex: null,
                dataPackage: null,
                selectedChannel: {},
                startFrame: 1,
                regexString: '',
                regexPresets: [
                    {
                        title: '3 Numbers separated by space',
                        data: '([-+]?[0-9]*\\.?[0-9]+) ([-+]?[0-9]*\\.?[0-9]+) ([-+]?[0-9]*\\.?[0-9]+)'
                    },
                    {
                        title: '3 Numbers separated by semicolon',
                        data: '([-+]?[0-9]*\\.?[0-9]+);([-+]?[0-9]*\\.?[0-9]+);([-+]?[0-9]*\\.?[0-9]+)'
                    },
                    {
                        title: '2 Numbers separated by comma and enclosed in quotes',
                        data: '"([-+]?[0-9]*\\.?[0-9]+)","([-+]?[0-9]*\\.?[0-9]+)"'
                    }
                ],
                channelTitle: "",
                resultLines: [],
                fileLines: [],
                isComplete: false,
                valLength: 0,
                valLabel: []
            };

            $scope.frameCount = 0;

            $scope.promiseString = 'Loading...';
            $scope.promise = deferred.promise;

            async.waterfall([
                function (cb) {
                    apiService('packages').actions.find($routeParams.uuid, cb);
                },
                function (dataPackage, cb) {
                    if (dataPackage) {
                        $scope.data.dataPackage = dataPackage;
                        cb(null);
                    } else {
                        cb(new Error('package not found'));
                    }
                },
                function (cb) {
                    apiService('packages/' + $routeParams.uuid + '/channels').actions.all(cb);
                },
                function (dataChannels, cb) {
                    if (dataChannels) {
                        $scope.data.dataChannels = dataChannels;
                        cb(null);
                    } else {
                        cb(new Error('no channels found'));
                    }
                }
            ], function (err) {
                if (err) {
                    console.log('error getting package', err);
                    deferred.reject(err);
                    return;
                }
                deferred.resolve();
            });

            $scope.updateRegex = function (regexString) {
                if (!regexString || regexString === '') {
                    return;
                }
                $scope.data.regex = new RegExp(regexString, 'gm');
                var result = textImportService.applyRegex(fileLines, $scope.data.regex);
                $scope.data.resultLines = result.frames;
                $scope.data.valLength = result.valLength;
                $scope.data.valLabel = [];
                for (var i = 0; i < $scope.data.valLength; i += 1) {
                    $scope.data.valLabel.push('');
                }
            };

            $scope.onFileSelect = function ($files) {
                var deferred = $q.defer();
                $scope.promiseString = 'Reading file...';
                $scope.promise = deferred.promise;
                var reader = new FileReader();
                reader.onload = function (onLoadEvent) {
                    fileData = onLoadEvent.target.result;
                    $scope.data.fileLines = fileData.split('\n').splice(0, 10);
                    var lineResults = textImportService.parse(fileData, $scope.data.startFrame, 10);
                    $scope.frameCount = lineResults.frameCount;
                    fileLines = lineResults.frames;
                    $scope.updateRegex($scope.data.regexString);
                    $scope.$apply();
                    deferred.resolve();
                };
                reader.readAsText($files[0]);
            };

            $scope.submit = function () {
                var deferred = $q.defer();
                $scope.promiseString = 'Adding channel...';
                $scope.promise = deferred.promise;
                $scope.$broadcast('show-errors-check-validity');
                if ($scope.channelImportForm.$invalid) {
                    $scope.alerts = [
                        {
                            type: 'danger',
                            msg: 'You have to at least enter a title, frame rate and value titles.'
                        }
                    ];
                    deferred.reject();
                    return;
                }
                textImportService.submit(fileData, $scope.data, function (err) {
                    if (err) {
                        $scope.alerts = [
                            {
                                type: 'danger',
                                msg: 'Failed to add streams'
                            }
                        ];
                        console.log('failed to create streams', err);
                        deferred.reject();
                        return;
                    }
                    $scope.alerts = [
                        {
                            type: 'danger',
                            msg: 'Successfully added streams'
                        }
                    ];
                    $location.path('/packages/' + $routeParams.uuid + '/edit');
                    deferred.resolve();
                });
            };
        }])
        .controller('Streams.ImportTrac', ['$scope', '$q', 'apiService', '$routeParams', '$location', 'tracImportService', function ($scope, $q, apiService, $routeParams, $location, tracImportService) {
            var fileData = "",
                deferred = $q.defer();

            $scope.data = {
                dataPackage: null,
                dataChannels: null,
                dataStreams: [],
                selectedChannel: {},
                channelTitle: '',
                startFrame: 1,
                fps: null,
                resultLines: [],
                frameCount: 0,
                valLength: 0,
                valLabel: [],
                fileLines: [],
                isComplete: false
            };

            $scope.promiseString = 'Loading...';
            $scope.promise = deferred.promise;

            async.waterfall([
                function (cb) {
                    apiService('packages').actions.find($routeParams.uuid, cb);
                },
                function (dataPackage, cb) {
                    if (dataPackage) {
                        $scope.data.dataPackage = dataPackage;
                        cb(null);
                    } else {
                        cb(new Error('package not found'));
                    }
                },
                function (cb) {
                    apiService('packages/' + $routeParams.uuid + '/channels').actions.all(cb);
                },
                function (dataChannels, cb) {
                    if (dataChannels) {
                        $scope.data.dataChannels = dataChannels;
                        cb(null);
                    } else {
                        cb(new Error('no channels found'));
                    }
                }
            ], function (err) {
                if (err) {
                    console.log('error getting package', err);
                    deferred.reject(err);
                    return;
                }
                deferred.resolve();
            });

            $scope.onFileSelect = function ($files) {
                var deferred = $q.defer();
                $scope.promiseString = 'Reading file...';
                $scope.promise = deferred.promise;
                var reader = new FileReader();
                reader.onload = function (onLoadEvent) {
                    fileData = onLoadEvent.target.result;
                    tracImportService.parse(onLoadEvent.target.result, $scope.data, function (err, inconsistencies) {
                        if (inconsistencies > 0) {
                            $scope.alerts = [
                                {
                                    type: 'warning',
                                    msg: 'The data contains ' + inconsistencies + ' line(s) containing a different number of values than labels.'
                                }
                            ];
                        }
                        deferred.resolve();
                        $scope.$apply();
                    });
                };
                reader.readAsText($files[0]);
            };
            $scope.submit = function () {
                var deferred = $q.defer();
                $scope.promiseString = 'Adding channel...';
                $scope.promise = deferred.promise;
                $scope.$broadcast('show-errors-check-validity');
                if ($scope.tracImportForm.$invalid) {
                    $scope.alerts = [
                        {
                            type: 'danger',
                            msg: 'You have to at least enter a title, frame rate and value titles.'
                        }
                    ];
                    deferred.reject();
                    return;
                }
                tracImportService.submit($scope.data, function (err) {
                    if (err) {
                        $scope.alerts = [
                            {
                                type: 'danger',
                                msg: 'Failed to add streams'
                            }
                        ];
                        console.log('failed to create streams', err);
                        deferred.reject();
                        return;
                    }
                    $scope.alerts = [
                        {
                            type: 'danger',
                            msg: 'Successfully added streams'
                        }
                    ];
                    $location.path('/packages/' + $routeParams.uuid + '/edit');
                    deferred.resolve();
                });
            };
        }]);
}());
/* global angular,PIECEMETA_API_HOST,PMApi */
angular.module('piecemeta-web.services.api', []).
factory('apiService', ['authService', function (authService) {
    'use strict';
    return function (resourceName, host, query) {
        var apiClient = new PMApi({
            host: host ? host : PIECEMETA_API_HOST,
            contentType: 'application/json',
            api_key: authService.api_key,
            access_token: authService.access_token
        });
        return {
            client: apiClient,
            actions: {
                all: function (callback, progress) {
                    apiClient.resource(resourceName, query).action('get', null, callback, progress);
                },
                find: function (uuid, callback, progress) {
                    apiClient.resource(resourceName, query).action('get', uuid, callback, progress);
                },
                create: function (data, callback, progress) {
                    apiClient.resource(resourceName).action('post', data, callback, progress);
                },
                update: function (uuid, data, callback, progress) {
                    data.uuid = uuid;
                    apiClient.resource(resourceName).action('put', data, callback, progress);
                },
                remove: function (uuid, callback, progress) {
                    apiClient.resource(resourceName).action('delete', uuid, callback, progress);
                }
            },
            getCredentials: function (access_token, callback) {
                apiClient.setToken(access_token);
                apiClient.getCredentials(function (err, credentials) {
                    if (err) {
                        return callback(err);
                    }
                    if (typeof credentials === 'object') {
                        authService.setCredentials(credentials, access_token);
                        callback(null);
                    } else {
                        callback(new Error('Failed to get credentials'));
                    }
                });
            },
            authenticate: function (login, password, callback) {
                apiClient.getToken({ email: login, password: password }, function (err, token) {
                    if (err) {
                        return callback(err);
                    }
                    if (typeof token === 'object') {
                        apiClient.getCredentials(function (err, credentials) {
                            if (err) {
                                return callback(err);
                            }
                            if (typeof credentials === 'object') {
                                authService.setCredentials(credentials, token);
                                callback(null);
                            } else {
                                callback(new Error('Failed to get credentials'));
                            }
                        });
                    } else {
                        callback(new Error('Failed to get token'));
                    }
                });
            }
        };
    };
}]);


/* global angular */
(function () {
    'use strict';
    angular.module('piecemeta-web.services.auth', []).
        factory('authService', ['$http', function () {
            var auth = {
                api_key : null,
                access_token : null,
                getCredentials : function () {
                    auth.api_key = typeof localStorage.api_key === 'string' ? JSON.parse(localStorage.api_key) : null;
                    auth.access_token = typeof localStorage.access_token === 'string' ? JSON.parse(localStorage.access_token) : null;
                },
                setCredentials : function (api_key, access_token) {
                    localStorage.api_key = JSON.stringify(api_key);
                    localStorage.access_token = JSON.stringify(access_token);
                    auth.getCredentials();
                },
                clearCredentials : function () {
                    localStorage.removeItem('api_key');
                    localStorage.removeItem('access_token');
                    auth.getCredentials();
                }
            };
            auth.getCredentials();
            return auth;
        }]);
}());
/* global console,angular */
angular.module('piecemeta-web.directives.helpers', [
        'piecemeta-web.services.api',
        'piecemeta-web.services.auth'
    ]).
    directive('checkLogin', ['apiService', 'authService', function (apiService, authService) {
        'use strict';
        return {
            link: function (scope) {
                scope.updateUser = function () {
                    if (authService.access_token) {
                        apiService('users').actions.find('me', function (err, res) {
                            if (err) {
                                console.log('error fetching user', err);
                                scope.userSession = null;
                                return;
                            }
                            scope.userSession = res;
                            scope.$apply();
                        });
                    }
                };
                scope.updateUser();
            }
        };
    }]);
/* global angular,async,BVH */
angular.module('piecemeta-web.services.importers.bvh', ['piecemeta-web.services.api']).
    factory('bvhImportService', ['apiService', function (apiService) {
        'use strict';
        return {
            parse: function (fileData, title, callback) {
                var dataPackageResult;
                var motionData;
                async.waterfall([
                    function (cb) {
                        cb(null, BVH.parse(fileData));
                    },
                    function (motion, cb) {
                        motionData = motion;
                        cb(null);
                    },
                    function (cb) {
                        var dataPackage = {
                            title: title
                        };
                        apiService('packages').actions.create(dataPackage, function (err, dataPackage) {
                            cb(err, dataPackage);
                        });
                    },
                    function (dataPackage, cb) {
                        dataPackageResult = dataPackage;
                        dataPackageResult.channels = [];
                        cb(null);
                    },
                    function (cb) {
                        async.eachSeries(motionData.nodeList, function (node, nextNode) {
                                var dataChannel = {
                                    title: node.id,
                                    package_uuid: dataPackageResult.uuid
                                };
                                apiService('channels').create(dataChannel, function (err, dataChannel) {
                                    if (err) {
                                        return nextNode(err);
                                    }
                                    dataPackageResult.channels.push(dataChannel);
                                    var dataStreams = [
                                        {
                                            title: 'x',
                                            group: 'position',
                                            value_offset: node.offsetX
                                        },
                                        {
                                            title: 'y',
                                            group: 'position',
                                            value_offset: node.offsetY
                                        },
                                        {
                                            title: 'z',
                                            group: 'position',
                                            value_offset: node.offsetZ
                                        },
                                        {
                                            title: 'z',
                                            group: 'rotation'
                                        },
                                        {
                                            title: 'y',
                                            group: 'rotation'
                                        },
                                        {
                                            title: 'x',
                                            group: 'rotation'
                                        }
                                    ];
                                    for (var i in dataStreams) {
                                        if (typeof dataStreams[i] === 'object') {
                                            dataStreams[i].frames = [];
                                            dataStreams[i].fps = parseFloat((1.0 / motionData.frameTime).toFixed(2));
                                        }
                                    }
                                    for (var f in node.frames) {
                                        if (typeof node.frames[f] === 'object') {
                                            var frameSource = node.frames[f];
                                            for (var n in frameSource) {
                                                if (typeof frameSource[n] === 'number') {
                                                    dataStreams[n].frames.push(frameSource[n]);
                                                }
                                            }
                                        }
                                    }
                                    async.eachSeries(dataStreams, function (dataStream, nextStream) {
                                            dataStream.channel_uuid = dataChannel.uuid;
                                            apiService('streams').actions.create(
                                                dataStream,
                                                function (err) {
                                                    nextStream(err);
                                                }
                                            );
                                        },
                                        function (err) {
                                            nextNode(err);
                                        });
                                });
                            },
                            function (err) {
                                cb(err);
                            });
                    },
                    function (cb) {
                        async.eachSeries(dataPackageResult.channels, function (dataChannel, nextChannel) {
                                var i = 0,
                                    nodes = motionData.nodeList;
                                while (nodes[i].id !== dataChannel.title && i < nodes.length) {
                                    i += 1;
                                }
                                if (nodes[i].parent) {
                                    var n = 0;
                                    while (dataPackageResult.channels[n].title !== nodes[i].parent.id && n < dataPackageResult.channels.length) {
                                        n += 1;
                                    }
                                    dataChannel.parent_channel_uuid = dataPackageResult.channels[n].uuid;
                                    apiService('channels').actions.update(dataChannel.uuid, dataChannel, function (err) {
                                        nextChannel(err);
                                    });
                                } else {
                                    nextChannel(null);
                                }
                            },
                            function (err) {
                                cb(err);
                            });
                    }
                ], callback);
            }
        };
    }]);
/* global angular,async */
angular.module('piecemeta-web.services.importers.json', ['piecemeta-web.services.api']).
    factory('jsonImportService', ['apiService', function (apiService) {
        'use strict';
        return {
            parse: function (fileData, title, cleanupNeeded, callback) {
                var dataPackageResult;
                async.waterfall([
                    function (cb) {
                        var input;
                        try {
                            input = JSON.parse(fileData);
                            cb(null, input);
                        } catch (e) {
                            cb(new Error('error parsing json: ' + e.toString()), null);
                        }
                    },
                    function (input, cb) {
                        var key;
                        if (cleanupNeeded) {
                            var maxFrames = 0;
                            var paddedFrames = {};
                            for (key in input) {
                                if (typeof input[key] === 'object' && input[key].length > 0) {
                                    if (input[key].length > maxFrames) {
                                        maxFrames = input[key].length;
                                    }
                                }
                            }
                            console.log('max frame is', maxFrames);
                            for (key in input) {
                                if (typeof input[key] === 'object' && input[key].length > 0) {
                                    paddedFrames[key] = [];
                                    if (input[key].length < maxFrames) {
                                        var frameDiff = maxFrames - input[key].length;
                                        var addInterval = Math.ceil(maxFrames / frameDiff);
                                        var added = 0;
                                        console.log('extend', input[key].length, frameDiff, addInterval);
                                        for (var i = 0; i < input[key].length; i += 1) {
                                            if (input[key][i]) {
                                                //for (var n = 0; n < addInterval; n += 1) {
                                                paddedFrames[key].push(input[key][i]);
                                                if (added < frameDiff) {
                                                    paddedFrames[key].push(input[key][i]);
                                                    added += 1;
                                                }
                                                //}
                                                /*
                                                 if (i % addInterval === 0) {
                                                 paddedFrames[key].push(input[key][i]);
                                                 paddedFrames[key].push(input[key][i]);
                                                 } else {
                                                 paddedFrames[key].push(input[key][i]);
                                                 }
                                                 */
                                            }
                                        }
                                        while (paddedFrames[key].length < maxFrames) {
                                            paddedFrames[key].push(input[key][input[key].length - 1]);
                                        }
                                    }
                                }
                            }
                            cb(null, paddedFrames);
                        } else {
                            var targetMillis = 1000 / 60;
                            var saneFrames = {};
                            for (key in input) {
                                if (typeof input[key] === 'object' && input[key].length > 0) {
                                    var lastMillis = input[key][0].m * 1000 + input[key][0].s;
                                    saneFrames[key] = [];
                                    console.log('frames', input[key].length);
                                    for (var index in input[key]) {
                                        if (typeof input[key][index] === 'object') {
                                            var nowMillis = input[key][index].m * 1000 + input[key][index].s;
                                            var diff = Math.round((nowMillis - lastMillis) / targetMillis);
                                            //if (diff > 1) {
                                            for (var d = 0; d < diff; d += 1) {
                                                var milliOffset = d * targetMillis;
                                                var newMillis = nowMillis + milliOffset;
                                                saneFrames[key].push({
                                                    a: input[key][index].a,
                                                    m: Math.floor(newMillis / 1000),
                                                    s: (newMillis / 1000 - Math.floor(newMillis / 1000)) * 1000
                                                });
                                            }
                                            //console.log('diff', (nowMillis - lastMillis) / targetMillis);
                                            /*
                                             } else {
                                             saneFrames[key].push(input[key][index]);
                                             }
                                             */
                                            lastMillis = nowMillis;
                                        }
                                    }
                                }
                            }
                            cb(null, saneFrames);
                        }
                    },
                    function (input, cb) {
                        var key;
                        if (cleanupNeeded) {
                            for (key in input) {
                                if (typeof input[key] === 'object' && input[key].length > 0) {
                                    console.log(key, input[key].length);
                                }
                            }
                            cb(null, input);
                        } else {
                            var filteredFrames = {};
                            var targetMillis = 1000 / 60;
                            for (key in input) {
                                if (typeof input[key] === 'object' && input[key].length > 0) {
                                    var faults = 0;
                                    var lastMillis = input[key][0].m * 1000 + input[key][0].s;
                                    filteredFrames[key] = [];
                                    console.log('frames', input[key].length);
                                    for (var index in input[key]) {
                                        if (typeof input[key][index] === 'object') {
                                            var nowMillis = input[key][index].m * 1000 + input[key][index].s;
                                            var diff = Math.round((nowMillis - lastMillis) / targetMillis);
                                            if (diff !== 1) {
                                                faults += 1;
                                                console.log('dropped faulty frame with diff != 1at', diff, index);
                                            } else {
                                                filteredFrames[key].push(input[key][index]);
                                            }
                                            lastMillis = nowMillis;
                                        }
                                    }
                                    console.log('total faults', faults);
                                }
                            }
                            cb(null, filteredFrames);
                        }
                    },
                    function (input, cb) {
                        if (cleanupNeeded) {
                            cb(null, input);
                        } else {
                            var targetMillis = 1000 / 60;
                            for (var key in input) {
                                if (typeof input[key] === 'object' && input[key].length > 0) {
                                    var faults = 0;
                                    var lastMillis = input[key][0].m * 1000 + input[key][0].s;
                                    console.log('cleaned frames for index', key, input[key].length);
                                    for (var index in input[key]) {
                                        if (typeof input[key][index] === 'object') {
                                            var nowMillis = input[key][index].m * 1000 + input[key][index].s;
                                            var diff = Math.round((nowMillis - lastMillis) / targetMillis);
                                            if (diff !== 1) {
                                                faults += 1;
                                                //console.log('faulty frame with diff != 1 at', diff, index);
                                            }
                                            lastMillis = nowMillis;
                                        }
                                    }
                                    console.log('total faults', faults);
                                }
                            }
                            cb(null, input);
                        }
                    },
                    function (input, cb) {
                        var dataPackage = {
                            title: title
                        };
                        apiService('packages').actions.create(dataPackage, function (err, newPackage) {
                            cb(err, newPackage, input);
                        });
                    },
                    function (dataPackage, input, cb) {
                        dataPackageResult = dataPackage;
                        dataPackageResult.channels = [];
                        cb(null, input);
                    },
                    function (input, cb) {
                        for (var key in input) {
                            if (typeof input[key] === 'object' && input[key].length > 0) {
                                var dataChannel = {
                                    title: key.substr(1, key.length - 1),
                                    id: null,
                                    package_uuid: dataPackageResult.uuid,
                                    streams: []
                                };
                                var paramLength = input[key][0].a.length;
                                for (var n = 0; n < paramLength; n += 1) {
                                    dataChannel.streams.push({
                                        id: null,
                                        fps: 60,
                                        channel_id: null,
                                        title: 'p' + n.toString(),
                                        group: paramLength > 1 ? 'grouped' : null,
                                        frames: []
                                    });
                                }
                                for (var index in input[key]) {
                                    if (typeof input[key][index] === 'object') {
                                        for (var p = 0; p < paramLength; p += 1) {
                                            dataChannel.streams[p].frames.push(input[key][index].a[p]);
                                        }
                                    }
                                }
                                dataPackageResult.channels.push(dataChannel);
                            }
                        }
                        cb(null);
                    },
                    function (cb) {
                        async.eachSeries(dataPackageResult.channels, function (channel, nextChannel) {
                                channel.package_uuid = dataPackageResult.uuid;
                                apiService('channels').actions.create(channel, function (err, dataChannel) {
                                    if (err) {
                                        return nextChannel(err);
                                    }
                                    dataPackageResult.channels[dataPackageResult.channels.indexOf(channel)].uuid = dataChannel.uuid;
                                    async.eachSeries(dataPackageResult.channels[dataPackageResult.channels.indexOf(channel)].streams, function (dataStream, nextStream) {
                                            dataStream.channel_uuid = dataChannel.uuid;
                                            apiService('streams').actions.create(
                                                dataStream,
                                                function (err) {
                                                    nextStream(err);
                                                }
                                            );
                                        },
                                        function (err) {
                                            nextChannel(err);
                                        });
                                });
                            },
                            function (err) {
                                cb(err);
                            });
                    }
                ], callback);
            }
        };
    }]);
/* global angular,async */
angular.module('piecemeta-web.services.importers.text', ['piecemeta-web.services.api']).
    factory('textImportService', ['apiService', function (apiService) {
        'use strict';
        return {
            parse: function (fileData, startFrame, numFrames) {
                var lines = fileData.split('\n');
                var frameCount = lines.length;
                var fileLines = lines.slice(Math.abs(parseInt(startFrame)), numFrames);
                return {
                    frames: fileLines,
                    frameCount: frameCount
                };
            },
            applyRegex: function (lines, regex) {
                if (!regex) {
                    return;
                }
                var resultLines = [];
                var valLength = 0;
                for (var idx in lines) {
                    if (typeof lines[idx] === 'string') {
                        var match = null;
                        var values = [];
                        while ((match = regex.exec(lines[idx])) !== null) {
                            values = match;
                        }
                        values.shift();
                        if (valLength < values.length) {
                            valLength = values.length;
                        }
                        resultLines.push(values);
                    }
                }
                return {
                    frames: resultLines,
                    valLength: valLength
                };
            },
            submit: function (fileData, meta, callback) {
                var dataStreams = [];
                var lines = fileData.split('\n');
                async.waterfall([
                    function (cb) {
                        for (var i = 0; i < meta.valLength; i += 1) {
                            var dataStream = {
                                channel_uuid: meta.selectedChannel.uuid,
                                title: meta.valLabel[i],
                                fps: meta.fps,
                                group: meta.valueGroup,
                                frames: []
                            };
                            dataStreams.push(dataStream);
                        }
                        cb(null);
                    },
                    function (cb) {
                        for (var l in lines) {
                            if (typeof lines[l] === 'string') {
                                var match = null,
                                    values = [];
                                while ((match = meta.regex.exec(lines[l])) !== null) {
                                    values = match;
                                }
                                values.shift();
                                for (var n in values) {
                                    if (typeof dataStreams[n] === 'object') {
                                        dataStreams[n].frames.push(values[n]);
                                    }
                                }
                            }
                        }
                        cb(null);
                    },
                    function (cb) {
                        if (meta.selectedChannel.uuid) {
                            cb(null, null);
                        } else {
                            var channel = {
                                package_uuid: meta.dataPackage.uuid,
                                title: meta.selectedChannel.title ? meta.selectedChannel.title : meta.channelTitle
                            };
                            apiService('channels').actions.create(channel, cb);
                        }
                    },
                    function (channel, cb) {
                        cb(null, meta.selectedChannel.uuid || channel.uuid);
                    },
                    function (channel_uuid, cb) {
                        async.eachSeries(dataStreams, function (stream, next) {
                            stream.channel_uuid = channel_uuid;
                            apiService('streams').actions.create(stream, next);
                        }, function (err) {
                            cb(err);
                        });
                    }
                ], callback);
            }
        };
    }]);
/* global angular,Papa,async */
angular.module('piecemeta-web.services.importers.trac', ['piecemeta-web.services.api']).
    factory('tracImportService', ['apiService', function (apiService) {
        'use strict';
        return {
            parse: function (fileData, meta, callback) {
                var lines = Papa.parse(fileData).data;
                var headerLines = lines.splice(0, 5);

                // drop the framenumber
                var labels = headerLines[3];
                labels.splice(0, 1);
                var props = headerLines[4];
                props.splice(0, 2);

                while (props[props.length - 1] === null || props[props.length - 1] === "") {
                    props.pop();
                }

                var propertyCount = props.length + 1;

                // remove empty labels
                labels = labels.filter(function (v) {
                    return v !== '';
                });

                var inconsistencies = 0;

                async.waterfall([
                    function (cb) {
                        meta.fps = parseFloat(headerLines[2][0]);
                        meta.frameCount = lines.length;
                        meta.fileLines = lines.slice(Math.abs(parseInt(meta.startFrame)), 10);
                        cb();
                    },
                    function (cb) {
                        var timeStream = {
                            channel_uuid: meta.selectedChannel.uuid,
                            title: labels.shift(),
                            frames: [],
                            fps: meta.fps
                        };
                        meta.dataStreams.push(timeStream);
                        cb();
                    },
                    function (cb) {
                        async.eachSeries(labels, function (label, next) {
                            var xyz = props.splice(0, 3);
                            async.each(xyz, function (streamlabel, nextStreamLabel) {
                                var stream = {
                                    channel_uuid: meta.selectedChannel.uuid,
                                    title: streamlabel.replace(/[0-9]/g, ''),
                                    group: label,
                                    frames: [],
                                    fps: meta.fps
                                };
                                meta.dataStreams.push(stream);
                                nextStreamLabel();
                            }, function (err) {
                                next(err);
                            });
                        }, cb);
                    },
                    function (cb) {
                        for (var i in lines) {
                            if (typeof lines[i] === 'object') {
                                var values = lines[i];
                                // drop framenumber
                                values.splice(0, 1);
                                if (propertyCount !== values.length) {
                                    inconsistencies += 1;
                                }
                                for (var n = 0; n < propertyCount; n += 1) {
                                    if (typeof values[n] === 'undefined') {
                                        meta.dataStreams[n].frames.push(null);
                                    } else {
                                        meta.dataStreams[n].frames.push(parseFloat(values[n]));
                                    }
                                }
                            }
                        }
                        cb();
                    }
                ], function (err) {
                    callback(err, inconsistencies);
                });
            },
            submit: function (meta, callback) {
                async.waterfall([
                    function (cb) {
                        if (meta.selectedChannel.uuid) {
                            cb(null, null);
                        } else {
                            var channel = {
                                package_uuid: meta.dataPackage.uuid,
                                title: meta.selectedChannel.title ? meta.selectedChannel.title : meta.channelTitle
                            };
                            apiService('channels').actions.create(channel, cb);
                        }
                    },
                    function (channel, cb) {
                        cb(null, meta.selectedChannel.uuid || channel.uuid);
                    },
                    function (channel_uuid, cb) {
                        async.eachSeries(meta.dataStreams, function (stream, next) {
                            stream.channel_uuid = channel_uuid;
                            apiService('streams').actions.create(stream, next);
                        }, function (err) {
                            cb(err);
                        });
                    }
                ], callback);
            }
        };
    }]);
/* global angular,Modernizr */
(function () {
    'use strict';
    angular.module('piecemeta-frontend', [
        'ui.bootstrap',
        'ngRoute',
        'cgBusy',
        'btford.markdown',
        'piecemeta-web.controllers.site',
        'piecemeta-web.controllers.users',
        'piecemeta-web.controllers.packages',
        'piecemeta-web.controllers.channels',
        'piecemeta-web.controllers.streams',
        'piecemeta-web.directives.helpers'
    ])
    .config(['$routeProvider', '$locationProvider', '$logProvider', function ($routeProvider, $locationProvider, $logProvider) {

        $logProvider.debugEnabled(true);

        $locationProvider.html5Mode(true).hashPrefix('!');

        var partialsPath = 'partials/';

        $routeProvider.when('/', {templateUrl: partialsPath + 'welcome.html', controller: 'Site.Welcome'});

        $routeProvider.when('/signup', {templateUrl: partialsPath + 'signup.html', controller: 'Users.Create'});
        $routeProvider.when('/me/account', {templateUrl: partialsPath + 'account.html', controller: 'Users.Edit'});
        $routeProvider.when('/confirm/:single_access_token', {templateUrl: partialsPath + 'confirm', controller: 'Users.Confirm'});
        $routeProvider.when('/login', {templateUrl: partialsPath + 'login.html', controller: 'Users.Login'});
        $routeProvider.when('/logout', {templateUrl: partialsPath + 'logout.html', controller: 'Users.Logout'});

        $routeProvider.when('/packages/browse', {templateUrl: partialsPath + 'packages_browse.html', controller: 'Packages.List'});
        $routeProvider.when('/packages/:uuid/channels/import/csv', {templateUrl: partialsPath+ 'streams_import.html', controller: 'Streams.ImportFile'});
        $routeProvider.when('/packages/:uuid/channels/import/trac', {templateUrl: partialsPath + 'streams_import_trac.html', controller: 'Streams.ImportTrac'});
        $routeProvider.when('/packages/upload', {templateUrl: partialsPath + 'packages_upload.html', controller: 'Packages.ImportBVH'});
        $routeProvider.when('/packages/uploadjson', {templateUrl: partialsPath + 'packages_upload_json.html', controller: 'Packages.ImportJSON'});
        $routeProvider.when('/packages/create', {templateUrl: partialsPath + 'packages_edit.html', controller: 'Packages.Create'});
        $routeProvider.when('/packages/:uuid/edit', {templateUrl: partialsPath + 'packages_edit.html', controller: 'Packages.Edit'});
        $routeProvider.when('/packages/:uuid/show', {templateUrl: partialsPath + 'packages_show.html', controller: 'Packages.Show'});

        $routeProvider.when('/collections/create', {templateUrl: partialsPath + 'collections_edit.html', controller: 'BasicResource.Create'});
        $routeProvider.when('/collections/:uuid/edit', {templateUrl: partialsPath + 'collections_edit.html', controller: 'BasicResource.Edit'});

        $routeProvider.when('/channels/:uuid/streams/create', {templateUrl: partialsPath + 'streams_edit.html', controller: 'Streams.Create'});
        $routeProvider.when('/streams/:uuid/edit', {templateUrl: partialsPath + 'streams_edit.html', controller: 'Streams.Edit'});

        $routeProvider.when('/packages/:package_uuid/channels/create', {templateUrl: partialsPath + 'channels_edit.html', controller: 'Channels.Create'});
        $routeProvider.when('/channels/:uuid/edit', {templateUrl: partialsPath + 'channels_edit.html', controller: 'Channels.Edit'});

        $routeProvider.otherwise({redirectTo: '/'});
    }]).run(['$rootScope', '$q', function ($rootScope, $q) {

        if (!Modernizr.localstorage || !Modernizr.canvas || !Modernizr.hashchange || !Modernizr.fontface) {
            window.alert("Your browser is too old or not compatible with this website. It may still work, but most likely won't.");
        }

        $rootScope.$on('$routeChangeStart', function () {
            $rootScope.pageDefer = $q.defer();
            $rootScope.pagePromise = $rootScope.pageDefer.promise;
        });
        $rootScope.$on('$routeChangeSuccess', function () {
            $rootScope.pageDefer.resolve();
        });
        $rootScope.$on('$routeChangeError', function () {
            $rootScope.pageDefer.reject();
        });
    }]);
}());
/* global angular */
(function () {
    'use strict';
    angular.module('piecemeta-web.controllers.site', [])
        .controller('Site.Welcome', ['$scope', function ($scope) {
            $scope.$parent.status = 'ready';
        }])
        .controller('Site.About', ['$scope', function ($scope) {
            $scope.$parent.status = 'ready';
        }])
        .controller('Site.Software', ['$scope', function ($scope) {
            $scope.$parent.status = 'ready';
        }]);
}());
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
/* global angular */
(function () {
    'use strict';
    angular.module(
        'piecemeta-web.controllers.users',
        [
            'piecemeta-web.services.api',
            'piecemeta-web.services.auth'
        ])
        .controller('Users.Create', ['$scope', '$q', 'apiService', function ($scope, $q, apiService) {
            $scope.signup_complete = false;
            $scope.alerts = [];
            $scope.user = {
                name : null,
                email : null,
                password : null,
                password_confirm: null
            };
            $scope.closeAlert = function (index) {
                $scope.alerts.splice(index, 1);
            };
            $scope.$parent.status = 'ready';
            $scope.submit = function () {
                var deferred = $q.defer();
                $scope.promiseString = 'Registering...';
                $scope.promise = deferred.promise;
                $scope.$broadcast('show-errors-check-validity');
                if ($scope.signupForm.$invalid) {
                    $scope.alerts = [{
                        type : 'danger',
                        msg : 'Form is still invalid.'
                    }];
                    deferred.reject();
                    return;
                }
                apiService('users').actions.create($scope.user, function (err, res) {
                    if (err) {
                        if (err.status !== 200) {
                            $scope.alerts = [];
                            if (res && res.errors) {
                                for (var field in res.errors) {
                                    if (typeof res.errors[field] === 'object') {
                                        $scope.alerts.push({
                                            type: 'danger',
                                            msg: res.errors[field].message
                                        });
                                    }
                                }
                            } else {
                                $scope.alerts = [
                                    {
                                        type: 'danger',
                                        msg: 'Server returned: ' + err.status + ' - ' + err.code
                                    }
                                ];
                            }
                        }
                        deferred.reject();
                        return;
                    }
                    $scope.alerts = [
                        {
                            type: 'success',
                            msg: 'Your account has been successfully created. Please check your E-Mails to complete the registration.'
                        }
                    ];
                    $scope.signup_complete = true;
                    deferred.resolve();
                });
            };
        }])
        .controller('Users.Edit', ['$scope', '$q', 'apiService', function ($scope, $q, apiService) {
            var deferred = $q.defer();
            $scope.alerts = [];
            $scope.user = {
                name: null,
                email: null,
                avatar: null,
                password: null,
                password_confirm: null
            };
            $scope.closeAlert = function (index) {
                $scope.alerts.splice(index, 1);
            };
            $scope.submit = function () {
                var deferred = $q.defer();
                $scope.promiseString = 'Saving user...';
                $scope.promise = deferred.promise;
                $scope.$broadcast('show-errors-check-validity');
                if ($scope.userForm.$invalid) {
                    $scope.alerts = [
                        {
                            type: 'danger',
                            msg: 'Form is still invalid.'
                        }
                    ];
                    deferred.reject();
                    return;
                }
                if (!$scope.user.password || $scope.user.password.length === 0 || $scope.user.password !== $scope.user.password_confirm) {
                    delete $scope.user.password;
                    delete $scope.user.password_confirm;
                }
                apiService('users').actions.update('me', $scope.user, function (err) {
                    if (err) {
                        var alerts = [];
                        if (err.status === 409) {
                            var messages = JSON.parse(err.message);
                            for (var field in messages) {
                                if (typeof messages[field] === 'object') {
                                    alerts.push({
                                        type: 'danger',
                                        msg: messages[field].message
                                    });
                                }
                            }
                        } else {
                            alerts = [
                                {
                                    type: 'danger',
                                    msg: 'Server returned: ' + err.status + ' - ' + err.code
                                }
                            ];
                        }
                        $scope.alerts = alerts;
                        deferred.reject(err);
                        return;
                    }
                    $scope.user.password = null;
                    $scope.user.password_confirm = null;
                    $scope.updateUser();
                    $scope.alerts = [
                        {
                            type: 'success',
                            msg: 'Your account has been successfully updated.'
                        }
                    ];
                    deferred.resolve();
                });
            };

            $scope.promiseString = 'Loading user...';
            $scope.promise = deferred.promise;
            apiService('users').actions.find('me', function (err, user) {
                if (err) {
                    console.log('unable to get user', err);
                    deferred.reject(err);
                } else {
                    $scope.user = {
                        name: user.name,
                        email: user.email,
                        avatar: user.avatar,
                        password: null,
                        password_confirm: null
                    };
                    deferred.resolve(user);
                }
            });
        }])
        .controller('Users.Confirm', ['$scope', '$q', '$location', '$routeParams', 'apiService', function ($scope, $q, $location, $routeParams, apiService) {
            var deferred = $q.defer();
            $scope.promiseString = 'Confirming user...';
            $scope.promise = deferred.promise;
            apiService('users/me/access_tokens').actions.create({ single_access_token: $routeParams.single_access_token },
                function (err, access_token) {
                    if (err) {
                        $scope.alerts = [
                            {
                                type: 'danger',
                                msg: 'Your account could not be confirmed.'
                            }
                        ];
                        deferred.reject(err);
                        return;
                    }
                    apiService().getCredentials(access_token, function (err) {
                        if (err) {
                            $scope.alerts = [
                                {
                                    type: 'danger',
                                    msg: 'Your account could not be confirmed.'
                                }
                            ];
                            deferred.reject(err);
                            return;
                        }
                        $scope.alerts = [
                            {
                                type: 'success',
                                msg: 'Your account has been successfully confirmed.'
                            }
                        ];
                        $scope.updateUser();
                        deferred.resolve();
                    });
                }
            );
        }])
        .controller('Users.Login', ['$scope', '$q', '$location', 'apiService', function ($scope, $q, $location, apiService) {
            $scope.alerts = [];
            $scope.user = {
                email: null,
                password: null
            };
            $scope.$parent.status = 'ready';
            $scope.closeAlert = function (index) {
                $scope.alerts.splice(index, 1);
            };
            $scope.submit = function () {
                var deferred = $q.defer();
                $scope.promiseString = 'Logging in...';
                $scope.promise = deferred.promise;
                apiService().authenticate($scope.user.email, $scope.user.password, function (err) {
                    if (err) {
                        $scope.alerts = [
                            {
                                type: 'danger',
                                msg: 'Login failed.'
                            }
                        ];
                        deferred.reject(err);
                        return;
                    }
                    $scope.updateUser();
                    deferred.resolve();
                    $location.path('/');
                });
            };
        }])
        .controller('Users.Logout', ['$scope', 'authService', function ($scope, authService) {
            authService.clearCredentials();
            window.location = '/';
        }]);
}());