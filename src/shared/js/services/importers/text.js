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
                        var dataStream = {
                            channel_uuid: meta.selectedChannel.uuid,
                            package_uuid: meta.dataPackage.uuid,
                            fps: meta.fps,
                            labels: [],
                            frames: []
                        };
                        for (var i = 0; i < meta.valLength; i += 1) {
                            if (!meta.valueGroup) {
                                dataStream = {
                                    channel_uuid: meta.selectedChannel.uuid,
                                    package_uuid: meta.dataPackage.uuid,
                                    fps: meta.fps,
                                    labels: [],
                                    frames: []
                                };
                            }
                            dataStream.title = meta.valueGroup || meta.valLabel[i];
                            dataStream.labels.push(meta.valLabel[i]);
                            if (!meta.valueGroup) {
                                dataStreams.push(dataStream);
                            }
                        }
                        if (meta.valueGroup) {
                            dataStreams.push(dataStream);
                        }
                        cb(null);
                    },
                    function (cb) {
                        for (var l = 0; l < lines.length; l += 1) {
                            if (typeof lines[l] === 'string') {
                                var match = null,
                                    values = [];
                                while ((match = meta.regex.exec(lines[l])) !== null) {
                                    values = match;
                                }
                                values.shift();
                                var frame = [];
                                for (var n = 0; n < values.length; n += 1) {
                                    if (typeof values[n] !== 'undefined') {
                                        frame.push(parseFloat(values[n]));
                                    } else {
                                        frame.push(null);
                                    }
                                }
                                if (meta.valueGroup) {
                                    dataStreams[0].frames.push(frame);
                                } else {
                                    dataStreams[n].frames.push(frame);
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