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