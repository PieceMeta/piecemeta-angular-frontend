/* global angular,async */
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
                if (!$scope.regex) {
                    return;
                }
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
                if (!regexString || regexString === '') {
                    return;
                }
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
                    return v !== '';
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