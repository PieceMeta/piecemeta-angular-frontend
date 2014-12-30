angular.module('piecemeta-web.services.db', []).
    factory('apiService', function () {
        'use strict';
        return function (resourceName) {
            var Datastore = require('nedb'),
                path = require('path'),
                db = new Datastore({ filename: path.join(require('nw.gui').App.dataPath, resourceName + '.db') });
            return {
                db: db,
                actions: {
                    all: function (callback) {
                        db.find({}, callback);
                    },
                    find: function (uuid, callback) {
                        db.findOne({ uuid: uuid }, callback);
                    },
                    create: function (data, callback) {
                        db.insert(data, callback);
                    },
                    update: function (uuid, data, callback) {
                        data.uuid = uuid;
                        db.update({ uuid: uuid }, data, callback);
                    },
                    remove: function (uuid, callback) {
                        db.remove({ uuid: uuid }, callback);
                    }
                }
            };
        };
    });
