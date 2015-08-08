/* global angular,async */
angular.module('piecemeta-nw.services.deck', [
        'piecemeta-nw.services.api',
        'piecemeta-nw.services.filecache'
    ]).
    factory('deckService', ['apiService', 'filecacheService', function (apiService, filecacheService) {
        'use strict';

        return {
            loadLocalDeck: function (uuid, callback) {
                async.waterfall([
                    function (cb) {
                        filecacheService.read('package-' + uuid, function (err, dataPackage) {
                            if (err || !dataPackage) {
                                fetchRemotePackage(uuid, cb);
                            } else {
                                cb(null, dataPackage);
                            }
                        });
                    },
                    function (dataPackage, cb) {
                        filecacheService.read('user-' + dataPackage.user_uuid, function (err, user) {
                            if (err || !user) {
                                apiService('users').actions.find(dataPackage.user_uuid, function (err, user) {
                                    cb(err, dataPackage, user);
                                });
                            } else {
                                cb(null, dataPackage, user);
                            }
                        });
                    },
                    function (dataPackage, user, cb) {
                        filecacheService.read('pkgstreams-' + uuid, function (err, streams) {
                            if (err || !streams) {
                                cb(err, dataPackage, user, null);
                            } else {
                                cb(null, dataPackage, user, streams);
                            }
                        });
                    },
                    function (dataPackage, user, streams, cb) {
                        $scope.dataPackage = dataPackage;
                        $scope.data.dataURL = $scope.data.baseUrl + '/packages/' + dataPackage.uuid;
                        $scope.data.packageAuthor = user;
                        $scope.data.dataPackage.channels = $scope.data.dataPackage.channels.sort(function (a, b) {
                            if (a.title < b.title) {
                                return -1;
                            } else if (a.title > b.title) {
                                return 1;
                            }
                            return 0;
                        });
                        if (typeof streams === 'object') {
                            streamData = streams;
                        }
                        cb(null);
                    },
                    function (cb) {
                        async.eachSeries($scope.data.dataPackage.channels, function (channel, nextChannel) {
                            async.eachSeries($scope.data.dataPackage.channels, function (stream, nextStream) {
                                if (stream.group) {
                                    $scope.data.groupStatus[stream.group] = true;
                                }
                                $scope.data.streamStatus[stream.uuid] = false;
                                nextStream(null);
                            }, nextChannel);
                        }, function (err) {
                            cb(err);
                        });
                    }
                ], function (err) {

                });
            },
            loadRemoteInfo: function (uuid, callback) {

            },
            loadRemoteStream: function (uuid, callback) {

            }
        };
    }]);
