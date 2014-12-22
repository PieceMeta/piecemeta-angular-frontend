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
                    channel_id: $routeParams.id
                }
            };
            var deferred = $q.defer();
            $scope.promiseString = 'Loading...';
            $scope.promise = deferred.promise;
            $scope.formTitle = 'Create stream';

            async.waterfall([
                function (cb) {
                    apiService('channels').actions.find($routeParams.id, cb);
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
                    apiService('packages').actions.find($scope.data.dataChannel.package_id, cb);
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
                        $location.path('/streams/' + data_stream.id + '/edit');
                    });
                };
            });
        }])
        .controller('DataStreams.Edit', ['$scope', '$routeParams', '$q', 'apiService', function ($scope, $routeParams, $q, apiService) {
            var deferred = $q.defer();
            $scope.data = {};
            $scope.promiseString = 'Loading stream...';
            $scope.promise = deferred.promise;
            $scope.formTitle = 'Edit stream';

            async.waterfall([
                function (cb) {
                    apiService('streams').actions.find($routeParams.id, cb);
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
                    apiService('channels').actions.find($scope.data.dataStream.channel_id, cb);
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
                    apiService('packages').actions.find($scope.data.dataChannel.package_id, cb);
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
                    apiService('streams').actions.update($routeParams.id, $scope.dataStream, function (err, data_stream) {
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
                    apiService('packages').actions.find($routeParams.id, cb);
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
                    apiService('packages/' + $routeParams.id + '/channels').actions.all(cb);
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
                                channel_id: $scope.data.selectedChannel.id,
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
                        if ($scope.data.selectedChannel.id) {
                            cb(null, null);
                        } else {
                            var channel = {
                                package_id: $routeParams.id,
                                title: $scope.data.selectedChannel.title ? $scope.data.selectedChannel.title : $scope.data.channelTitle
                            };
                            apiService('channels').actions.create(channel, cb);
                        }
                    },
                    function (channel, cb) {
                        cb(null, $scope.data.selectedChannel.id || channel.id);
                    },
                    function (channel_id, cb) {
                        async.eachSeries(dataStreams, function (stream, next) {
                            stream.channel_id = channel_id;
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
                    $location.path('/packages/' + $routeParams.id + '/edit');
                    deferred.resolve();
                });
            };
        }]);
}());