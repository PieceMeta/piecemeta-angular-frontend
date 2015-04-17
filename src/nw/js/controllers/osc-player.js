/* global angular,async,Tock */
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
                console.log("called!", $scope.dataURL);
                if ($scope.dataURL) {
                    var urlparts = $scope.dataURL.split('/'),
                        path = '/oscplayer/' + urlparts.pop();
                    urlparts.pop();
                    path += '/play?host=' + urlparts.join('/');
                    console.log(path);
                    $location.url(path);
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
        .controller('OscPlayer.Play', ['$scope', '$q', '$routeParams', 'apiService', function ($scope, $q, $routeParams, apiService) {
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
            console.log($scope.data);
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
                        apiService('channels/' + channel.uuid + '/streams', $scope.data.baseUrl).actions.all(function (err, dataStreams) {
                            if (err) {
                                return nextChannel(err);
                            }
                            for (var i in dataStreams) {
                                if (dataStreams[i].group) {
                                    $scope.data.groupStatus[dataStreams[i].group] = true;
                                }
                                $scope.data.streamStatus[dataStreams[i].uuid] = true;
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
                            if ($scope.data.dataPackage.channels[idx].streams.length > 0 &&
                                $scope.data.dataPackage.channels[idx].streams.length > 0 &&
                                $scope.data.dataPackage.channels[idx].streams[0].frames.length > 0) {
                                $scope.data.dataChannels.push({
                                    title: $scope.data.dataPackage.channels[idx].title,
                                    id: $scope.data.dataPackage.channels[idx].uuid
                                });
                            }
                        }
                    }
                    cb(null);
                },
                function (cb) {
                    if ($scope.data.dataChannels.length > 0) {
                        $scope.data.currentChannel = $scope.data.dataChannels[0].uuid;
                    }
                    cb(null);
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
                    for (var n in pkg.channels[i].streams) {
                        if (pkg.channels[i].streams[n].frames.length > $scope.data.totalFrames) {
                            $scope.data.totalFrames = pkg.channels[i].streams[n].frames.length;
                            $scope.data.fps = pkg.channels[i].streams[n].fps;
                        }
                    }
                }

                var framesPadding = $scope.data.totalFrames.toString().length;
                document.getElementById('frameCount').innerText = ('000000000000' + $scope.data.frame).substr(framesPadding * -1, framesPadding);

                var seconds = Math.floor($scope.data.totalFrames / $scope.data.fps);
                var minutes = Math.floor(seconds / 60);
                $scope.data.timeString = ('0' + minutes).substr(-2, 2) + ':'
                    + ('0' + (seconds - minutes * 60)).substr(-2, 2) + ':'
                    + ('0' + ($scope.data.totalFrames - (seconds * $scope.data.fps))).substr(-2, 2);

                $scope.$apply();

                var osc = require('piecemeta-oscplayer');
                osc.openPort('0.0.0.0', parseInt(localStorage.getItem('osc-controlport')));
                osc.registerControls(function (err, command, args) {
                    switch (command) {
                        case 'toggle':
                            $scope.play(null);
                            break;
                        case 'rewind':
                            $scope.rewind(null);
                            break;
                        case 'frame':
                            if (args && args.length > 0) {
                                var targetFrame = parseInt(args[0]);
                                if (targetFrame < $scope.data.totalFrames) {
                                    $scope.data.frame = parseInt(args[0]);
                                    $scope.playprogress = Math.round($scope.data.frame / $scope.data.totalFrames * 1000);
                                    $scope.$apply();
                                }
                            }
                            break;
                    }
                });

                var interfaceTimer = new Tock({
                    interval: 100,
                    callback: function () {
                        document.getElementById('frameCount').innerText = ('000000000000' + $scope.data.frame).substr(framesPadding*-1, framesPadding);
                        var seconds = Math.floor($scope.data.frame / $scope.data.fps);
                        var minutes = Math.floor(seconds / 60);
                        document.getElementById('timeCode').innerText = ('0' + minutes).substr(-2,2) + ':'
                                + ('0' + (seconds - minutes * 60)).substr(-2,2) + ':'
                                + ('0' + ($scope.data.frame - (seconds * $scope.data.fps))).substr(-2,2);
                        if (Math.round($scope.data.frame / $scope.data.totalFrames * 1000) !== $scope.playprogress) {
                            $scope.playprogress = Math.round($scope.data.frame / $scope.data.totalFrames * 1000);
                            $scope.$apply();
                        }
                    }
                });

                var tickStart;
                var tick = function() {
                    var messages = [];
                    var addresses = {};
                    var address;
                    for (var i in pkg.channels) {
                        for (var n in pkg.channels[i].streams) {
                            address = '/' + pkg.channels[i].title;
                            address += pkg.channels[i].streams[n].group ? '/' + pkg.channels[i].streams[n].group : '';
                            if (!addresses[address]) {
                                addresses[address] = [];
                            }
                            if (pkg.channels[i].streams[n].frames[$scope.data.frame]) {
                                if ($scope.data.streamStatus[pkg.channels[i].streams[n].uuid] === true
                                    && (!pkg.channels[i].streams[n].group || $scope.data.groupStatus[pkg.channels[i].streams[n].group] === true)) {
                                    addresses[address].push(pkg.channels[i].streams[n].frames[$scope.data.frame]);
                                }
                            }
                        }
                        for (address in addresses) {
                            if (addresses[address].length > 0) {
                                messages.push(osc.createMessage(address, addresses[address]));
                            }
                        }
                    }
                    osc.send(localStorage.getItem('osc-datahost'), parseInt(localStorage.getItem('osc-dataport')), osc.createBundle(messages), function (err) {
                        if (err) {
                            console.log('send error', err);
                        }
                    });
                    $scope.data.frame += 1;
                    if ($scope.data.frame >= $scope.data.totalFrames) {
                        console.log('play took', window.performance.now() - tickStart);
                        $scope.data.frame = 0;
                        tickStart = window.performance.now();
                    }
                };

                var timer = new Tock({
                    interval: Math.round(1000 / $scope.data.fps),
                    callback: tick
                });
                $scope.play = function () {
                    if ($scope.playing) {
                        timer.pause();
                        $scope.playing = false;
                    } else {
                        timer.start();
                        $scope.playing = true;
                    }
                    interfaceTimer.start();
                };
                $scope.rewind = function () {
                    $scope.data.frame = 0;
                    $scope.playprogress = 0;
                    tickStart = window.performance.now();
                };

                $scope.$on('$routeChangeStart', function (next, current) {
                    if (next !== current) {
                        timer.pause();
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