/* global angular,async,BVH,define */
'use strict';

define([
    'services_api'
], function () {
    return angular.module('piecemeta-web.services.importers.bvh', ['piecemeta-web.services.api']).factory('bvhImportService', ['apiService', function (apiService) {
        return {
            parse: function (fileData, title, callback) {
                var dataPackageResult;
                var motionData;
                async.waterfall([
                    function (cb) {
                        cb(null, BVH.parse(fileData));
                    },
                    function (motion, cb) {
                        motionData = motion;
                        cb(null);
                    },
                    function (cb) {
                        var dataPackage = {
                            title: title
                        };
                        apiService('packages').actions.create(dataPackage, function (err, dataPackage) {
                            cb(err, dataPackage);
                        });
                    },
                    function (dataPackage, cb) {
                        dataPackageResult = dataPackage;
                        dataPackageResult.channels = [];
                        cb(null);
                    },
                    function (cb) {
                        async.eachSeries(motionData.nodeList, function (node, nextNode) {
                                var dataChannel = {
                                    title: node.id,
                                    package_uuid: dataPackageResult.uuid
                                };
                                apiService('channels').create(dataChannel, function (err, dataChannel) {
                                    if (err) {
                                        return nextNode(err);
                                    }
                                    dataPackageResult.channels.push(dataChannel);
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
                                            dataStreams[i].fps = parseFloat((1.0 / motionData.frameTime).toFixed(2));
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
                                                function (err) {
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
                        async.eachSeries(dataPackageResult.channels, function (dataChannel, nextChannel) {
                                var i = 0,
                                    nodes = motionData.nodeList;
                                while (nodes[i].id !== dataChannel.title && i < nodes.length) {
                                    i += 1;
                                }
                                if (nodes[i].parent) {
                                    var n = 0;
                                    while (dataPackageResult.channels[n].title !== nodes[i].parent.id && n < dataPackageResult.channels.length) {
                                        n += 1;
                                    }
                                    dataChannel.parent_channel_uuid = dataPackageResult.channels[n].uuid;
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
                ], callback);
            }
        };
    }]);
});