/* global console,angular,async,Tock,require */
(function () {
    'use strict';
    angular.module(
        'piecemeta-nw.controllers.osc-player',
        [
            'angularFileUpload',
            'chartjs'
        ])
        .controller('OscPlayer.Load', ['$scope', '$location', function ($scope, $location) {
            $scope.loadPackage = function () {
                if ($scope.dataURL && /^(https?):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test($scope.dataURL)) {
                    var urlparts = $scope.dataURL.split('/'),
                        path = '/oscplayer/' + urlparts.pop() + '/play';
                    urlparts.pop();
                    var search = 'host=' + encodeURIComponent(urlparts.join('/'));
                    $location.path(path).search(search);
                } else {
                    $scope.alerts = [
                        {
                            type: 'danger',
                            msg: 'You need to enter a URL.'
                        }
                    ];
                    $scope.$apply();
                }
            };
        }])
        .controller('OscPlayer.Play', ['$scope', '$q', '$routeParams', 'apiService', 'filecacheService', function ($scope, $q, $routeParams, apiService, filecacheService) {
            var streamData = {};
            $scope.data = {
                dataChannels: [],
                dataPackage: null,
                currentGroup: null,
                streamStatus: {},
                groupStatus: {},
                channelIndex: 0,
                frame: 0,
                totalFrames: 0,
                fps: 0,
                baseUrl: $routeParams.host,
                targetHost: '127.0.0.1',
                targetPort: 8000
            };
            $scope.playprogress = 0;
            $scope.updateTimeout = null;
            var deferred = $q.defer();
            $scope.promiseString = 'Loading data...';
            $scope.promise = deferred.promise;
            $scope.selected_nav = 'channels';
            $scope.playing = false;

            $scope.onURLClick = function ($event) {
                $event.target.select();
                console.log($event.target.value);
            };



            function fetchRemotePackage(uuid, callback) {

            }

            async.waterfall([
                function (cb) {
                    apiService('packages', $scope.data.baseUrl).actions.find($routeParams.uuid, cb);
                },
                function (dataPackage, cb) {
                    apiService('users', $scope.data.baseUrl).actions.find(dataPackage.user_uuid, function (err, user) {
                        cb(err, dataPackage, user);
                    });
                },
                function (dataPackage, user, cb) {
                    $scope.data.dataPackage = dataPackage;
                    $scope.data.packageAuthor = user;
                    $scope.data.dataURL = $scope.data.baseUrl + '/packages/' + dataPackage.uuid;
                    cb(null);
                },
                function (cb) {
                    apiService('packages/' + $scope.data.dataPackage.uuid + '/channels', $scope.data.baseUrl).actions.all(cb);
                },
                function (dataChannels, cb) {

                    cb(null);
                },
                function (cb) {
                    async.eachSeries($scope.data.dataPackage.channels, function (channel, nextChannel) {
                        apiService('channels/' + channel.uuid + '/streams', $scope.data.baseUrl).actions.all(function (err, dataStreams) {
                            if (err) {
                                return nextChannel(err);
                            }
                            for (var i in dataStreams) {
                                if (typeof dataStreams[i] === 'object') {
                                    if (dataStreams[i].group) {
                                        $scope.data.groupStatus[dataStreams[i].group] = true;
                                    }
                                    $scope.data.streamStatus[dataStreams[i].uuid] = true;
                                }
                            }
                            $scope.data.dataPackage.channels[$scope.data.dataPackage.channels.indexOf(channel)].streams = dataStreams;
                            nextChannel();
                        });
                    }, function (err) {
                        cb(err);
                    });
                }
            ], function (err) {
                if (err) {
                    deferred.reject(err);
                    console.log('error getting data', $routeParams, err);
                    $scope.$parent.status = 'ready';
                    return;
                }

                deferred.resolve();
                $scope.$parent.status = 'ready';
                var pkg = $scope.data.dataPackage;
                for (var i in pkg.channels) {
                    if (typeof pkg.channels[i] === 'object') {
                        for (var n in pkg.channels[i].streams) {
                            if (pkg.channels[i].streams[n].frames.length > $scope.data.totalFrames) {
                                $scope.data.totalFrames = pkg.channels[i].streams[n].frames.length;
                                $scope.data.fps = pkg.channels[i].streams[n].fps;
                            }
                        }
                    }
                }

                var framesPadding = $scope.data.totalFrames.toString().length;
                document.getElementById('frameCount').innerText = ('000000000000' + $scope.data.frame).substr(framesPadding * -1, framesPadding);

                var seconds = Math.floor($scope.data.totalFrames / $scope.data.fps);
                var minutes = Math.floor(seconds / 60);
                $scope.data.timeString = ('0' + minutes).substr(-2, 2) + ':' +
                    ('0' + (seconds - minutes * 60)).substr(-2, 2) + ':' +
                    ('0' + ($scope.data.totalFrames - (seconds * $scope.data.fps))).substr(-2, 2);

                $scope.$apply();

                var interfaceTimer = new Tock({
                    interval: 100,
                    callback: function () {
                        document.getElementById('frameCount').innerText = ('000000000000' + $scope.data.frame).substr(framesPadding*-1, framesPadding);
                        var seconds = Math.floor($scope.data.frame / $scope.data.fps);
                        var minutes = Math.floor(seconds / 60);
                        document.getElementById('timeCode').innerText = ('0' + minutes).substr(-2,2) + ':' +
                            ('0' + (seconds - minutes * 60)).substr(-2,2) + ':' +
                            ('0' + ($scope.data.frame - (seconds * $scope.data.fps))).substr(-2,2);
                        if (Math.round($scope.data.frame / $scope.data.totalFrames * 1000) !== $scope.playprogress) {
                            $scope.playprogress = Math.round($scope.data.frame / $scope.data.totalFrames * 1000);
                            $scope.$apply();
                        }
                    }
                });


                $scope.play = function () {
                    if ($scope.playing) {
                        $scope.playing = false;
                    } else {
                        $scope.playing = true;
                    }
                    interfaceTimer.start();
                };
                $scope.rewind = function () {
                    $scope.data.frame = 0;
                    $scope.playprogress = 0;
                };

                $scope.$on('$routeChangeStart', function (next, current) {
                    if (next !== current) {
                        //timer.pause();
                        interfaceTimer.pause();
                        osc.closePort();
                    }
                });
            });
        }])
        .controller('OscPlayer.Settings', ['$scope', function ($scope) {
            $scope.settings = {
                osc: {
                    datahost: localStorage.getItem('osc-datahost'),
                    dataport: parseInt(localStorage.getItem('osc-dataport')),
                    controlport: parseInt(localStorage.getItem('osc-controlport'))
                }
            };
            $scope.submit = function () {
                // TODO: proper validation!
                if (!$scope.settings.osc.datahost ||
                    !$scope.settings.osc.dataport ||
                    !$scope.settings.osc.controlport) {
                    $scope.alerts = [
                        {
                            type: 'danger',
                            msg: 'You need to fill out all fields.'
                        }
                    ];
                    return;
                }
                localStorage.setItem('osc-datahost', $scope.settings.osc.datahost);
                localStorage.setItem('osc-dataport', $scope.settings.osc.dataport);
                localStorage.setItem('osc-controlport', $scope.settings.osc.controlport);
                $scope.alerts = [
                    {
                        type: 'success',
                        msg: 'Settings saved.'
                    }
                ];
            };
        }]);
}());