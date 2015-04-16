/**
 * piecemeta-angular-frontend - Angular-based web frontend for PieceMeta service
 * @version v0.9.2
 * @link http://www.piecemeta.com
 * @license MIT
 */
// DEV
// PIECEMETA_DEV_API_URL = 'http://localhost:8080';
// PIECEMETA_API_HOST = 'http://localhost:8080';

// PRODUCTION
PIECEMETA_DEV_API_URL = 'https://api.piecemeta.com';
PIECEMETA_API_HOST = 'https://api.piecemeta.com';
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
                    $location.path('/collections/' + data_collection.uuid + '/edit');
                });
            };
        }])
        .controller('Collections.Edit', ['$scope', '$routeParams', '$q', 'apiService', function ($scope, $routeParams, $q, apiService) {
            var deferred = $q.defer();
            $scope.promiseString = 'Loading Collection...';
            $scope.promise = deferred.promise;
            $scope.formTitle = 'Edit Collection';

            apiService('collections').actions.find($routeParams.uuid, function (err, data_collection) {
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
                    apiService('collections').actions.update($routeParams.uuid, $scope.dataCollection, function (err, data_collection) {
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
                        $scope.alerts = [
                            {
                                type: 'success',
                                msg: 'Successfully updated Collection.'
                            }
                        ];
                        deferred.resolve();
                    });
                };
            });
        }]);
}());
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
                            if (a.group < b.group)
                                return -1;
                            if (a.group > b.group)
                                return 1;
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
                    apiService('channels').actions.update($routeParams.uuid, $scope.data.dataChannel, function (err, data_channel) {

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
(function () {
    'use strict';
    angular.module(
        'piecemeta-web.controllers.data-streams',
        [
            'angularFileUpload',
            'piecemeta-web.services.api'
        ])
        .controller('DataStreams.Create', ['$scope', 'apiService', '$q', '$location', '$routeParams', function ($scope, apiService, $q, $location, $routeParams) {
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
        .controller('DataStreams.Edit', ['$scope', '$routeParams', '$q', '$location', 'apiService', function ($scope, $routeParams, $q, $location, apiService) {
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
                    apiService('streams').actions.update($routeParams.uuid, $scope.data.dataStream, function (err, data_stream) {
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
        .controller('DataStreams.ImportFile', ['$scope', '$q', 'apiService', '$routeParams', '$location', function ($scope, $q, apiService, $routeParams, $location) {
            var fileData = "",
                deferred = $q.defer();

            $scope.data = {
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
                isComplete: false
            };

            $scope.fileLines = [];
            $scope.frameCount = 0;
            $scope.valLength = 0;
            $scope.valLabel = [];

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


            var parseData = function () {
                if (!$scope.regex) return;
                $scope.data.resultLines = [];
                $scope.valLength = 0;
                $scope.valLabel = [];
                for (var idx in $scope.fileLines) {
                    var match = null;
                    var values = [];
                    while ((match = $scope.regex.exec($scope.fileLines[idx])) !== null) {
                        values = match;
                    }
                    values.shift();
                    if ($scope.valLength < values.length) {
                        $scope.valLength = values.length;
                    }
                    $scope.data.resultLines.push(values);
                }
                for (var i = 0; i < $scope.valLength; i += 1) {
                    $scope.valLabel.push('');
                }
            };

            $scope.parseLines = function () {
                var lines = fileData.split('\n');
                $scope.frameCount = lines.length;
                $scope.fileLines = lines.slice(Math.abs(parseInt($scope.data.startFrame)), 10);
                parseData();
            };

            $scope.updateRegex = function (regexString) {
                if (!regexString || regexString === '') return;
                $scope.regex = new RegExp(regexString, 'gm');
                parseData();
            };
            $scope.onFileSelect = function ($files) {
                var deferred = $q.defer();
                $scope.promiseString = 'Reading file...';
                $scope.promise = deferred.promise;
                var reader = new FileReader();
                reader.onload = function (onLoadEvent) {
                    fileData = onLoadEvent.target.result;
                    $scope.updateRegex($scope.data.regexString);
                    $scope.parseLines();
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

                var dataStreams = [];
                var lines = fileData.split('\n');

                async.waterfall([
                    function (cb) {
                        for (var i = 0; i < $scope.valLength; i += 1) {
                            var dataStream = {
                                channel_uuid: $scope.data.selectedChannel.uuid,
                                title: $scope.valLabel[i],
                                fps: $scope.data.fps,
                                group: $scope.data.valueGroup,
                                frames: []
                            };
                            dataStreams.push(dataStream);
                        }
                        cb(null);
                    },
                    function (cb) {
                        for (var l in lines) {
                            var match = null,
                                values = [];
                            while ((match = $scope.regex.exec(lines[l])) !== null) {
                                values = match;
                            }
                            values.shift();
                            for (var n in values) {
                                if (typeof dataStreams[n] === 'object') {
                                    dataStreams[n].frames.push(values[n]);
                                }
                            }
                        }
                        cb(null);
                    },
                    function (cb) {
                        if ($scope.data.selectedChannel.uuid) {
                            cb(null, null);
                        } else {
                            var channel = {
                                package_uuid: $routeParams.uuid,
                                title: $scope.data.selectedChannel.title ? $scope.data.selectedChannel.title : $scope.data.channelTitle
                            };
                            apiService('channels').actions.create(channel, cb);
                        }
                    },
                    function (channel, cb) {
                        cb(null, $scope.data.selectedChannel.uuid || channel.uuid);
                    },
                    function (channel_uuid, cb) {
                        async.eachSeries(dataStreams, function (stream, next) {
                            stream.channel_uuid = channel_uuid;
                            apiService('streams').actions.create(stream, next);
                        }, function (err) {
                            cb(err);
                        });
                    }
                ], function (err) {
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
        .controller('DataStreams.ImportTrac', ['$scope', '$q', 'apiService', '$routeParams', '$location', function ($scope, $q, apiService, $routeParams, $location) {
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
                isComplete: false
            };

            $scope.fileLines = [];
            $scope.frameCount = 0;
            $scope.valLength = 0;
            $scope.valLabel = [];

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

            $scope.parseLines = function (callback) {

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
                    return v != '';
                });

                var inconsistencies = 0;

                async.waterfall([
                    function (cb) {
                        $scope.data.fps = parseFloat(headerLines[2][0]);
                        $scope.frameCount = lines.length;
                        $scope.fileLines = lines.slice(Math.abs(parseInt($scope.data.startFrame)), 10);
                        cb();
                    },
                    function (cb) {
                        var timeStream = {
                            channel_uuid: $scope.data.selectedChannel.uuid,
                            title: labels.shift(),
                            frames: [],
                            fps: $scope.data.fps
                        };
                        $scope.data.dataStreams.push(timeStream);
                        cb();
                    },
                    function (cb) {
                        async.eachSeries(labels, function (label, next) {
                            var xyz = props.splice(0, 3);
                            async.each(xyz, function (streamlabel, nextStreamLabel) {
                                var stream = {
                                    channel_uuid: $scope.data.selectedChannel.uuid,
                                    title: streamlabel.replace(/[0-9]/g, ''),
                                    group: label,
                                    frames: [],
                                    fps: $scope.data.fps
                                };
                                $scope.data.dataStreams.push(stream);
                                nextStreamLabel();
                            }, function (err) {
                                next(err);
                            });
                        }, cb);
                    },
                    function (cb) {
                        for (var i in lines) {
                            var values = lines[i];
                            // drop framenumber
                            values.splice(0, 1);
                            if (propertyCount !== values.length) {
                                inconsistencies += 1;
                            }
                            for (var n = 0; n < propertyCount; n += 1) {
                                if (typeof values[n] === 'undefined') {
                                    $scope.data.dataStreams[n].frames.push(null);
                                } else {
                                    $scope.data.dataStreams[n].frames.push(parseFloat(values[n]));
                                }
                            }
                        }
                        cb();
                    }
                ], function (err) {
                    //console.log(propertyCount, inconsistencies, $scope.data.dataStreams);
                    callback(err, inconsistencies);
                });
            };

            $scope.onFileSelect = function ($files) {
                var deferred = $q.defer();
                $scope.promiseString = 'Reading file...';
                $scope.promise = deferred.promise;
                var reader = new FileReader();
                reader.onload = function (onLoadEvent) {
                    fileData = onLoadEvent.target.result;
                    $scope.parseLines(function (err, inconsistencies) {
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

                async.waterfall([
                    function (cb) {
                        if ($scope.data.selectedChannel.uuid) {
                            cb(null, null);
                        } else {
                            var channel = {
                                package_uuid: $routeParams.uuid,
                                title: $scope.data.selectedChannel.title ? $scope.data.selectedChannel.title : $scope.data.channelTitle
                            };
                            apiService('channels').actions.create(channel, cb);
                        }
                    },
                    function (channel, cb) {
                        cb(null, $scope.data.selectedChannel.uuid || channel.uuid);
                    },
                    function (channel_uuid, cb) {
                        async.eachSeries($scope.data.dataStreams, function (stream, next) {
                            stream.channel_uuid = channel_uuid;
                            apiService('streams').actions.create(stream, next);
                        }, function (err) {
                            cb(err);
                        });
                    }
                ], function (err) {
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
angular.module('piecemeta-web.services.api', []).
factory('apiService', ['authService', function (authService) {
    'use strict';
    return function (resourceName, host) {
        var apiClient = PMApi({
            host: host ? host : PIECEMETA_API_HOST,
            contentType: 'application/json',
            api_key: authService.api_key,
            access_token: authService.access_token
        });
        return {
            client: apiClient,
            actions: {
                all: function (callback, progress) {
                    apiClient.resource(resourceName).action('get', null, callback, progress);
                },
                find: function (uuid, callback, progress) {
                    apiClient.resource(resourceName).action('get', uuid, callback, progress);
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
/*
var generateCSV = function (req, res, next) {
    var mongoose = require('mongoose'),
        async = require('async'),
        restify = require('restify'),
        Baby = require('babyparse');
    async.waterfall([
        function (cb) {
            mongoose.model('DataChannelModel').find({ data_package_id: req.params.id }, cb);
        },
        function (dataChannels, cb) {
            var result = {};
            async.eachSeries(dataChannels, function (channel, nextChannel) {
                async.waterfall([
                    function (cb) {
                        mongoose.model('DataStreamModel').find({ data_channel_id: channel.id }, cb);
                    },
                    function (streams, cb) {
                        async.eachSeries(streams, function (stream, nextStream) {
                            var streamTitle = channel.title + "/" + stream.title + "/" + streams.indexOf(stream);
                            result[streamTitle] = stream.data_frames;
                            nextStream(null);
                        }, function (err) {
                            cb(err);
                        });
                    }
                ], function (err) {
                    nextChannel(err);
                });
            }, function (err) {
                cb(err, result);
            });
        }
    ], function (err, result) {
        if (err) {
            console.log(err);
            res.send(new restify.InternalError());
            return next();
        }
        var csv = '';
        var count = 0;
        var max = Object.keys(result).length;
        var maxFrames = 0;
        for (var key in result) {
            if (typeof result[key] === 'object') {
                if (maxFrames < result[key].length) {
                    maxFrames = result[key].length;
                }
                csv += key;
                if (count < max - 1) {
                    csv += ',';
                } else {
                    csv += "\r\n";
                }
                count += 1;
            }
        }
        for (var i = 0; i < maxFrames; i += 1) {
            count = 0;
            for (var item in result) {
                if (typeof result[item] === 'object') {
                    csv += result[item][i];
                    if (count < max - 1) {
                        csv += ',';
                    } else {
                        csv += "\r\n";
                    }
                    count += 1;
                }
            }
        }
        console.log(csv, max);
        var fs = require('fs');
        fs.writeFile('/Users/anton/brain.txt', csv, function (err) {
            if (err) {
                console.log(err);
            }
            res.send(200, 'ok');
            next();
        });
    });
};
    */
angular.module('piecemeta-web.services.spatial-viewer', []).
    factory('spatialViewer', [function () {
        'use strict';
        var viewer = {
            scene : new THREE.Scene(),
            renderer: new THREE.CanvasRenderer(),
            hierarchy: new THREE.Object3D(),
            camera : null,
            meshes : {},
            dataSequence : null,
            frameIndex: 0,
            frameCount: 0,
            init : function (dataPackage, targetSelector, callback) {
                var width = document.querySelector(targetSelector).offsetWidth,
                    height = document.querySelector(targetSelector).offsetHeight;

                if (height === 0) {
                    height = 320;
                }

                viewer.dataPackage = dataPackage;
                viewer.camera = new THREE.PerspectiveCamera(75, width / height, 1, 10000);
                viewer.camera.position.z = 1000;
                viewer.renderer.setSize(width, height);

                for (var i in dataPackage.data_channels) {
                    if (typeof dataPackage.data_channels[i] === 'object') {
                        var geometry = new THREE.BoxGeometry(10, 10, 10),
                            material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true }),
                            mesh = new THREE.Mesh(geometry, material);
                        viewer.meshes[dataPackage.data_channels[i].id] = mesh;
                        for (var s in dataPackage.data_channels[i].data_streams) {
                            if (typeof dataPackage.data_channels[i].data_streams[s] === 'object') {
                                var stream = dataPackage.data_channels[i].data_streams[s];
                                if (stream.data_frames.length > viewer.frameCount) {
                                    viewer.frameCount = stream.data_frames.length;
                                }
                                if (typeof stream.data_frames[viewer.frameIndex] === 'number') {
                                    viewer.meshes[dataPackage.data_channels[i].id][stream.group][stream.title] = (stream.value_offset + stream.data_frames[viewer.frameIndex])*10;
                                }
                            }
                        }
                    }
                }

                for (var n in dataPackage.data_channels) {
                    if (typeof dataPackage.data_channels[n] === 'object') {
                        var channel = dataPackage.data_channels[n];
                        if (channel.parent_data_channel_id) {
                            viewer.meshes[channel.parent_data_channel_id].add(viewer.meshes[channel.id]);
                        } else {
                            viewer.hierarchy.add(viewer.meshes[channel.id]);
                        }
                    }
                }

                viewer.scene.add(viewer.hierarchy);
                document.querySelector(targetSelector).appendChild(viewer.renderer.domElement);
                viewer.animate();
                if (typeof callback === 'function') {
                    callback();
                }
            },
            animate : function () {
                window.requestAnimationFrame(viewer.animate);



                viewer.renderer.render(viewer.scene, viewer.camera);
            }
        };
        return viewer;
    }]);
(function () {
    'use strict';
    angular.module('piecemeta-frontend', [
        'ui.bootstrap',
        'ngRoute',
        'cgBusy',
        'btford.markdown',
        'piecemeta-web.controllers.site',
        'piecemeta-web.controllers.users',
        'piecemeta-web.controllers.collections',
        'piecemeta-web.controllers.data-packages',
        'piecemeta-web.controllers.data-channels',
        'piecemeta-web.controllers.data-streams',
        'piecemeta-web.controllers.trackers',
        'piecemeta-web.directives.helpers'
    ])
    .config(['$routeProvider', '$locationProvider', '$logProvider', function ($routeProvider, $locationProvider, $logProvider) {

        $logProvider.debugEnabled(true);

        $locationProvider.html5Mode(true).hashPrefix('!');

        var partialsPath = 'partials/';

        $routeProvider.when('/', {templateUrl: partialsPath + 'welcome.html', controller: 'Site.Welcome'});
        $routeProvider.when('/about', {templateUrl: partialsPath + 'about.html', controller: 'Site.About'});
        $routeProvider.when('/software', {templateUrl: partialsPath + 'software.html', controller: 'Site.Software'});

        $routeProvider.when('/signup', {templateUrl: partialsPath + 'signup.html', controller: 'Users.Create'});
        $routeProvider.when('/me/account', {templateUrl: partialsPath + 'account.html', controller: 'Users.Edit'});
        $routeProvider.when('/confirm/:single_access_token', {templateUrl: partialsPath + 'confirm', controller: 'Users.Confirm'});
        $routeProvider.when('/login', {templateUrl: partialsPath + 'login.html', controller: 'Users.Login'});
        $routeProvider.when('/logout', {templateUrl: partialsPath + 'logout.html', controller: 'Users.Logout'});

        $routeProvider.when('/packages/browse', {templateUrl: partialsPath + 'packages_browse.html', controller: 'DataPackages.List'});
        $routeProvider.when('/packages/:uuid/channels/import/csv', {templateUrl: partialsPath+ 'streams_import.html', controller: 'DataStreams.ImportFile'});
            $routeProvider.when('/packages/:uuid/channels/import/trac', {
                templateUrl: partialsPath + 'streams_import_trac.html',
                controller: 'DataStreams.ImportTrac'
            });
        $routeProvider.when('/packages/upload', {templateUrl: partialsPath + 'packages_upload.html', controller: 'DataPackages.ImportBVH'});
        $routeProvider.when('/packages/uploadosc', {templateUrl: partialsPath + 'packages_upload_osc.html', controller: 'DataPackages.ImportOSC'});
        $routeProvider.when('/packages/create', {templateUrl: partialsPath + 'packages_edit.html', controller: 'DataPackages.Create'});
        $routeProvider.when('/packages/:uuid/edit', {templateUrl: partialsPath + 'packages_edit.html', controller: 'DataPackages.Edit'});
        $routeProvider.when('/packages/:uuid/show', {templateUrl: partialsPath + 'packages_show.html', controller: 'DataPackages.Show'});

        $routeProvider.when('/collections/create', {templateUrl: partialsPath + 'collections_edit.html', controller: 'Collections.Create'});
        $routeProvider.when('/collections/:uuid/edit', {templateUrl: partialsPath + 'collections_edit.html', controller: 'Collections.Edit'});

        $routeProvider.when('/channels/:uuid/streams/create', {templateUrl: partialsPath + 'streams_edit.html', controller: 'DataStreams.Create'});
        $routeProvider.when('/streams/:uuid/edit', {templateUrl: partialsPath + 'streams_edit.html', controller: 'DataStreams.Edit'});

        $routeProvider.when('/packages/:package_uuid/channels/create', {templateUrl: partialsPath + 'channels_edit.html', controller: 'DataChannels.Create'});
        $routeProvider.when('/channels/:uuid/edit', {templateUrl: partialsPath + 'channels_edit.html', controller: 'DataChannels.Edit'});

        $routeProvider.when('/trackers', {templateUrl: partialsPath + 'trackers_list.html', controller: 'Trackers.List'});
        $routeProvider.when('/trackers/create', {templateUrl: partialsPath + 'trackers_edit.html', controller: 'Trackers.Create'});
        $routeProvider.when('/trackers/:uuid/edit', {templateUrl: partialsPath + 'trackers_edit.html', controller: 'Trackers.Edit'});

        $routeProvider.otherwise({redirectTo: '/'});
    }]).run(['$rootScope', '$q', function ($rootScope, $q) {

        if (!Modernizr.localstorage || !Modernizr.canvas || !Modernizr.hashchange || !Modernizr.fontface) {
            window.alert("Your browser is too old or not compatible with this website. It may still work, but most likely won't.");
        }

        $rootScope.$on('$routeChangeStart', function (e, curr, prev) {
            $rootScope.pageDefer = $q.defer();
            $rootScope.pagePromise = $rootScope.pageDefer.promise;
        });
        $rootScope.$on('$routeChangeSuccess', function (e, curr, prev) {
            $rootScope.pageDefer.resolve();
        });
        $rootScope.$on('$routeChangeError', function (e, curr, prev) {
            $rootScope.pageDefer.reject();
        });
    }]);
}());
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
(function () {
    'use strict';
    angular.module(
        'piecemeta-web.controllers.trackers',
        [
            'piecemeta-web.services.api'
        ])
        .controller('Trackers.Create', ['$scope', 'apiService', '$q', '$location', '$routeParams', function ($scope, apiService, $q, $location, $routeParams) {
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
                    apiService('trackers').actions.update($routeParams.id, $scope.tracker, function (err, tracker) {
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
        .controller('Users.Confirm', ['$scope', '$q', '$location', '$routeParams', 'apiService', 'authService', function ($scope, $q, $location, $routeParams, apiService, authService) {
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