(function () {
    'use strict';
    angular.module(
        'piecemeta-web.controllers.data-packages',
        [
            'angularFileUpload',
            'piecemeta-web.services.api',
            'chartjs'
        ])
        .controller('DataPackages.ImportBVH', ['$scope', '$q', 'authService', 'apiService', function ($scope, $q, authService, apiService) {
            $scope.file = null;
            $scope.onFileSelect = function ($files) {
                var deferred = $q.defer();
                $scope.promiseString = 'Importing data...';
                $scope.promise = deferred.promise;

                $scope.file = $files[0];
                $scope.dataPackage = null;
                $scope.dataChannels = [];
                var reader = new FileReader();
                reader.onload = function (onLoadEvent) {
                    async.waterfall([
                        function (cb) {
                            cb(null, BVH.parse(onLoadEvent.target.result));
                        },
                        function (motion, cb) {
                            $scope.motion = motion;
                            cb(null);
                        },
                        function (cb) {
                            var dataPackage = {
                                title: $files[0].name
                            };
                            apiService('packages').actions.create(dataPackage, function (err, dataPackage) {
                                cb(err, dataPackage);
                            });
                        },
                        function (dataPackage, cb) {
                            $scope.dataPackage = dataPackage;
                            cb(null);
                        },
                        function (cb) {
                            async.eachSeries($scope.motion.nodeList, function (node, nextNode) {
                                var dataChannel = {
                                    title: node.id,
                                    package_uuid: $scope.dataPackage.uuid
                                };
                                apiService('channels').create(dataChannel, function (err, dataChannel) {
                                    if (err) {
                                        return nextNode(err);
                                    }
                                    $scope.dataChannels.push(dataChannel);
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
                                            dataStreams[i].fps = parseFloat((1.0 / $scope.motion.frameTime).toFixed(2));
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
                                            function (err, dataStream) {
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
                            async.eachSeries($scope.dataChannels, function (dataChannel, nextChannel) {
                                var i = 0,
                                    nodes = $scope.motion.nodeList;
                                while (nodes[i].id !== dataChannel.title && i < nodes.length) {
                                    i += 1;
                                }
                                if (nodes[i].parent) {
                                    var n = 0;
                                    while ($scope.dataChannels[n].title !== nodes[i].parent.id && n < $scope.dataChannels.length) {
                                        n += 1;
                                    }
                                    dataChannel.parent_channel_uuid = $scope.dataChannels[n].uuid;
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
                        ],
                        function (err, result) {
                            if (err) {
                                console.log('error processing bvh file', err);
                                deferred.reject(err);
                                return;
                            }
                            console.log('successfully processed bvh file', result);
                            deferred.resolve();
                        }
                    );
                };
                reader.readAsText($files[0]);
            };
        }])
        .controller('DataPackages.ImportOSC', ['$scope', '$q', 'authService', 'apiService', '$routeParams', function ($scope, $q, authService, apiService, $routeParams) {
            $scope.file = null;
            $scope.onFileSelect = function ($files) {
                var deferred = $q.defer();
                $scope.promiseString = 'Importing data...';
                $scope.promise = deferred.promise;

                $scope.file = $files[0];
                $scope.dataPackage = null;
                $scope.dataChannels = [];
                var reader = new FileReader();
                reader.onload = function (onLoadEvent) {
                    console.log('onload');
                    async.waterfall([
                            function (cb) {
                                var input;
                                try {
                                    input = JSON.parse(onLoadEvent.target.result);
                                    cb(null, input);
                                } catch (e) {
                                    cb(new Error('error parsing json: ' + e.toString()), null);
                                }
                            },
                            function (input, cb) {
                                if ($routeParams.garbage) {
                                    var maxFrames = 0;
                                    var paddedFrames = {};
                                    for (var key in input) {
                                        if (typeof input[key] === 'object' && input[key].length > 0) {
                                            if (input[key].length > maxFrames) {
                                                maxFrames = input[key].length;
                                            }
                                        }
                                    }
                                    console.log('max frame is', maxFrames);
                                    for (var key in input) {
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
                                                    paddedFrames[key].push(input[key][input[key].length-1]);
                                                }
                                            }
                                        }
                                    }
                                    cb(null, paddedFrames);
                                } else {
                                    var targetMillis = 1000 / 60;
                                    var saneFrames = {};
                                    for (var key in input) {
                                        if (typeof input[key] === 'object' && input[key].length > 0) {
                                            var lastMillis = input[key][0].m * 1000 + input[key][0].s;
                                            saneFrames[key] = [];
                                            console.log('frames', input[key].length);
                                            for (var index in input[key]) {
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
                                    cb(null, saneFrames);
                                }
                            },
                            function (input, cb) {
                                if ($routeParams.garbage) {
                                    for (var key in input) {
                                        if (typeof input[key] === 'object' && input[key].length > 0) {
                                            console.log(key, input[key].length);
                                        }
                                    }
                                    cb(null, input);
                                } else {
                                    var filteredFrames = {};
                                    var targetMillis = 1000 / 60;
                                    for (var key in input) {
                                        if (typeof input[key] === 'object' && input[key].length > 0) {
                                            var faults = 0;
                                            var lastMillis = input[key][0].m * 1000 + input[key][0].s;
                                            filteredFrames[key] = [];
                                            console.log('frames', input[key].length);
                                            for (var index in input[key]) {
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
                                            console.log('total faults', faults);
                                        }
                                    }
                                    cb(null, filteredFrames);
                                }
                            },
                            function (input, cb) {
                                if ($routeParams.garbage) {
                                    cb(null, input);
                                } else {
                                    var targetMillis = 1000 / 60;
                                    for (var key in input) {
                                        if (typeof input[key] === 'object' && input[key].length > 0) {
                                            var faults = 0;
                                            var lastMillis = input[key][0].m * 1000 + input[key][0].s;
                                            console.log('cleaned frames for index', key, input[key].length);
                                            for (var index in input[key]) {
                                                var nowMillis = input[key][index].m * 1000 + input[key][index].s;
                                                var diff = Math.round((nowMillis - lastMillis) / targetMillis);
                                                if (diff !== 1) {
                                                    faults += 1;
                                                    //console.log('faulty frame with diff != 1 at', diff, index);
                                                }
                                                lastMillis = nowMillis;
                                            }
                                            console.log('total faults', faults);
                                        }
                                    }
                                    cb(null, input);
                                }
                            },
                            function (input, cb) {
                                var dataPackage = {
                                    title: $files[0].name
                                };
                                apiService('packages').actions.create(dataPackage, function (err, newPackage) {
                                    cb(err, newPackage, input);
                                });
                            },
                            function (dataPackage, input, cb) {
                                $scope.dataPackage = dataPackage;
                                console.log($scope.dataPackage);
                                cb(null, input);
                            },
                            function (input, cb) {
                                for (var key in input) {
                                    if (typeof input[key] === 'object' && input[key].length > 0) {
                                        var dataChannel = {
                                            title: key.substr(1, key.length-1),
                                            id: null,
                                            package_uuid: $scope.dataPackage.uuid,
                                            streams: []
                                        };
                                        var paramLength = input[key][0].a.length;
                                        for (var n = 0; n < paramLength; n+=1) {
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
                                            for (var p = 0; p < paramLength; p += 1) {
                                                dataChannel.streams[p].frames.push(input[key][index].a[p]);
                                            }
                                        }
                                        $scope.dataChannels.push(dataChannel);
                                    }
                                }
                                cb(null);
                            },
                            function (cb) {
                                async.eachSeries($scope.dataChannels, function (channel, nextChannel) {
                                    channel.package_uuid = $scope.dataPackage.uuid;
                                    apiService('channels').actions.create(channel, function (err, dataChannel) {
                                        if (err) {
                                            return nextChannel(err);
                                        }
                                        $scope.dataChannels[$scope.dataChannels.indexOf(channel)].uuid = dataChannel.uuid;
                                        async.eachSeries($scope.dataChannels[$scope.dataChannels.indexOf(channel)].streams, function (dataStream, nextStream) {
                                                dataStream.channel_uuid = dataChannel.uuid;
                                                apiService('streams').actions.create(
                                                    dataStream,
                                                    function (err, dataStream) {
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
                        ],
                        function (err, result) {
                            if (err) {
                                console.log('error processing json file', err);
                                deferred.reject(err);
                                return;
                            }
                            console.log('successfully processed json file', result);
                            deferred.resolve();
                        }
                    );
                };
                reader.readAsText($files[0]);
            };
        }])
        .controller('DataPackages.Show', ['$scope', '$q', '$routeParams', 'apiService', function ($scope, $q, $routeParams, apiService) {
            $scope.data = {
                dataChannels: [],
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
                for (var i in channel.streams) {
                    if (channel.streams[i].frames.length > 0) {
                        var frames = [];
                        if (channel.streams[i].frames.length > 500 * 2) {
                            var quantize = Math.floor(channel.streams[i].frames.length / 500);
                            for (var q = 0; q < channel.streams[i].frames.length; q += quantize) {
                                frames.push(channel.streams[i].frames[q]);
                            }
                        } else {
                            frames = channel.streams[i].frames;
                        }
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
                        if (a.title < b.title)
                            return -1;
                        if (a.title > b.title)
                            return 1;
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
                    for (var idx in $scope.data.dataPackage.channels) {
                        if (typeof $scope.data.dataPackage.channels[idx] === 'object') {
                            if ($scope.data.dataPackage.channels[idx].streams.length > 0) {
                                $scope.data.dataChannels.push($scope.data.dataPackage.channels[idx]);
                            }
                        }
                    }
                    cb(null);
                },
                function (cb) {
                    if ($scope.data.dataChannels.length > 0) {
                        $scope.data.currentChannel = $scope.data.dataChannels[0];
                    }
                    cb(null);
                },
                function (cb) {
                    $scope.updateChart();
                    cb(null);
                },
                function (cb) {
                    $scope.$watch('data.currentChannel', function (newVal, oldVal) {
                        $scope.data.currentGroup = null;
                        $scope.updateChart();
                    }, true);
                    $scope.$watch('data.currentGroup', function (newVal, oldVal) {
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
        .controller('DataPackages.List', ['$scope', 'apiService', function ($scope, apiService) {
            $scope.data = {};
            apiService('packages').actions.all(function (err, data_packages) {
                if (err) {
                    return console.log('error getting packages', err);
                }
                $scope.data.data_packages = data_packages.sort(function (a, b) {
                    if (a.title < b.title)
                        return -1;
                    if (a.title > b.title)
                        return 1;
                    return 0;
                });
                $scope.$apply();
            });
        }])
        .controller('DataPackages.Create', ['$scope', 'apiService', '$q', '$location', function ($scope, apiService, $q, $location) {
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
        .controller('DataPackages.Edit', ['$scope', '$routeParams', '$q', '$location', 'apiService', function ($scope, $routeParams, $q, $location, apiService) {
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
                apiService('packages').actions.update($routeParams.uuid, $scope.dataPackage, function (err, data_package) {
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
                            if (a.title < b.title)
                                return -1;
                            if (a.title > b.title)
                                return 1;
                            return 0;
                        });
                    }
                    deferred.resolve();
                    $scope.$apply();
                });
            });
        }]);
}());