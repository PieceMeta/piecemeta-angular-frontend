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