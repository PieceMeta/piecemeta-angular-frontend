/* global angular,Papa,async,define */
'use strict';

define([
    'services_api'
], function () {
    return angular.module('piecemeta-web.services.importers.trac', ['piecemeta-web.services.api']).factory('tracImportService', ['apiService', function (apiService) {
        return {
            parse: function (fileData, meta, callback) {
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
                        meta.fps = parseFloat(headerLines[2][0]);
                        meta.frameCount = lines.length;
                        meta.fileLines = lines.slice(Math.abs(parseInt(meta.startFrame)), 10);
                        cb();
                    },
                    function (cb) {
                        var timeStream = {
                            channel_uuid: meta.selectedChannel.uuid,
                            title: labels.shift(),
                            frames: [],
                            fps: meta.fps
                        };
                        meta.dataStreams.push(timeStream);
                        cb();
                    },
                    function (cb) {
                        async.eachSeries(labels, function (label, next) {
                            var xyz = props.splice(0, 3);
                            async.each(xyz, function (streamlabel, nextStreamLabel) {
                                var stream = {
                                    channel_uuid: meta.selectedChannel.uuid,
                                    title: streamlabel.replace(/[0-9]/g, ''),
                                    group: label,
                                    frames: [],
                                    fps: meta.fps
                                };
                                meta.dataStreams.push(stream);
                                nextStreamLabel();
                            }, function (err) {
                                next(err);
                            });
                        }, cb);
                    },
                    function (cb) {
                        for (var i in lines) {
                            if (typeof lines[i] === 'object') {
                                var values = lines[i];
                                // drop framenumber
                                values.splice(0, 1);
                                if (propertyCount !== values.length) {
                                    inconsistencies += 1;
                                }
                                for (var n = 0; n < propertyCount; n += 1) {
                                    if (typeof values[n] === 'undefined') {
                                        meta.dataStreams[n].frames.push(null);
                                    } else {
                                        meta.dataStreams[n].frames.push(parseFloat(values[n]));
                                    }
                                }
                            }
                        }
                        cb();
                    }
                ], function (err) {
                    callback(err, inconsistencies);
                });
            },
            submit: function (meta, callback) {
                async.waterfall([
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
                        async.eachSeries(meta.dataStreams, function (stream, next) {
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
});