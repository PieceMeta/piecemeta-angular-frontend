/* global angular,async */
angular.module('piecemeta-nw.services.filecache', []).
    factory('filecacheService', function () {
        'use strict';

        var fs = require('fs'),
            path = require('path'),
            msgpack = require('msgpack'),
            cachePath = path.join(require('nw.gui').App.dataPath, 'filecache');

        function setup(callback) {
            fs.exists(cachePath, function (exists) {
                if (exists) {
                    callback(null);
                } else {
                    fs.mkdir(cachePath, function (err) {
                        callback(err);
                    });
                }
            });
        }

        return {
            read: function (key, callback) {
                async.waterfall([
                    function (cb) {
                        fs.exists(path.join(cachePath, key + '.msgpack'), function (exists) {
                            if (exists) {
                                cb(null);
                            } else {
                                cb(new Error('cache file not found'));
                            }
                        });
                    },
                    function (cb) {
                        fs.readFile(path.join(cachePath, key + '.msgpack'), cb);
                    },
                    function (fileData, cb) {
                        var result = msgpack.unpack(fileData);
                        cb(null, result);
                    }
                ], function (err, result) {
                    callback(err, result);
                });
            },
            write: function (key, payload, callback) {
                async.waterfall([
                    function (cb) {
                        setup(cb);
                    },
                    function (cb) {
                        var fileData = msgpack.pack(payload);
                        cb(null, fileData);
                    },
                    function (fileData, cb) {
                        fs.writeFile(path.join(cachePath, key + '.msgpack'), fileData, cb);
                    }
                ], function (err) {
                    callback(err);
                });
            }
        };
    });
