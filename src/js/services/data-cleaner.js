/*
var generateCSV = function (req, res, next) {
    var mongoose = require('mongoose'),
        async = require('async'),
        restify = require('restify'),
        Baby = require('babyparse');
    async.waterfall([
        function (cb) {
            mongoose.model('DataChannelModel').find({ data_package_id: req.params.id }, cb);
        },
        function (dataChannels, cb) {
            var result = {};
            async.eachSeries(dataChannels, function (channel, nextChannel) {
                async.waterfall([
                    function (cb) {
                        mongoose.model('DataStreamModel').find({ data_channel_id: channel.id }, cb);
                    },
                    function (streams, cb) {
                        async.eachSeries(streams, function (stream, nextStream) {
                            var streamTitle = channel.title + "/" + stream.title + "/" + streams.indexOf(stream);
                            result[streamTitle] = stream.data_frames;
                            nextStream(null);
                        }, function (err) {
                            cb(err);
                        });
                    }
                ], function (err) {
                    nextChannel(err);
                });
            }, function (err) {
                cb(err, result);
            });
        }
    ], function (err, result) {
        if (err) {
            console.log(err);
            res.send(new restify.InternalError());
            return next();
        }
        var csv = '';
        var count = 0;
        var max = Object.keys(result).length;
        var maxFrames = 0;
        for (var key in result) {
            if (typeof result[key] === 'object') {
                if (maxFrames < result[key].length) {
                    maxFrames = result[key].length;
                }
                csv += key;
                if (count < max - 1) {
                    csv += ',';
                } else {
                    csv += "\r\n";
                }
                count += 1;
            }
        }
        for (var i = 0; i < maxFrames; i += 1) {
            count = 0;
            for (var item in result) {
                if (typeof result[item] === 'object') {
                    csv += result[item][i];
                    if (count < max - 1) {
                        csv += ',';
                    } else {
                        csv += "\r\n";
                    }
                    count += 1;
                }
            }
        }
        console.log(csv, max);
        var fs = require('fs');
        fs.writeFile('/Users/anton/brain.txt', csv, function (err) {
            if (err) {
                console.log(err);
            }
            res.send(200, 'ok');
            next();
        });
    });
};
    */