/* global angular,async,Tock */
angular.module('piecemeta-nw.services.player', []).
    factory('playerService', function () {
        'use strict';

        var osc = require('piecemeta-oscplayer'),
            tickStart,
            frame,
            isPlaying,
            config = {
                host: null,
                port: null,
                controlPort: null
            },
            data = {};

        var tick = function () {
            var messages = [];
            var addresses = {};
            var address;
            for (var i in pkg.channels) {
                if (typeof pkg.channels[i] === 'object') {
                    for (var n in pkg.channels[i].streams) {
                        if (typeof pkg.channels[i].streams[n] === 'object') {
                            address = '/' + pkg.channels[i].title;
                            address += pkg.channels[i].streams[n].group ? '/' + pkg.channels[i].streams[n].group : '';
                            if (!addresses[address]) {
                                addresses[address] = [];
                            }
                            if (pkg.channels[i].streams[n].frames[$scope.data.frame]) {
                                if ($scope.data.streamStatus[pkg.channels[i].streams[n].uuid] === true &&
                                    (!pkg.channels[i].streams[n].group || $scope.data.groupStatus[pkg.channels[i].streams[n].group] === true)) {
                                    addresses[address].push(pkg.channels[i].streams[n].frames[$scope.data.frame]);
                                }
                            }
                        }
                    }
                    for (address in addresses) {
                        if (addresses[address].length > 0) {
                            messages.push(osc.createMessage(address, addresses[address]));
                        }
                    }
                }
            }
            osc.send(config.host, config.port, osc.createBundle(messages), function (err) {
                if (err) {
                    console.log('send error', err);
                }
            });
            frame += 1;
            if (frame >= $scope.data.totalFrames) {
                console.log('play took', window.performance.now() - tickStart);
                frame = 0;
                tickStart = window.performance.now();
            }
        };

        var setPlayback = function (status) {
            isPlaying = status;
            if (isPlaying) {
                timer.pause();
            } else {
                timer.start();
            }
        };

        var resetPlayback = function () {
            tickStart = window.performance.now();
        };

        var timer = new Tock({
            interval: Math.round(1000 / $scope.data.fps),
            callback: tick
        });

        return {
            setup: function (host, port, controlPort) {
                config.host = host;
                config.port = port;

                osc.openPort('0.0.0.0', controlPort);
                osc.registerControls(function (err, command, args) {
                    switch (command) {
                        case 'toggle':
                            setPlayback(!isPlaying);
                            break;
                        case 'rewind':
                            resetPlayback();
                            break;
                        case 'frame':
                            if (args && args.length > 0) {
                                frame = parseInt(args[0]);
                            }
                            break;
                    }
                });
            },
            setData: function (pkg) {

            },
            setPlayback: setPlayback,
            resetPlayback: resetPlayback
        };
    });
