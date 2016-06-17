/* global angular,PIECEMETA_API_HOST,PMApi,define */
'use strict';

define([
    'services_auth'
], function () {
    return angular.module('piecemeta-web.services.api', []).factory('apiService', ['authService', function (authService) {
        return function (resourceName, host, query) {
            var apiClient = new PMApi({
                host: host ? host : PIECEMETA_API_HOST,
                contentType: 'application/json',
                api_key: authService.api_key,
                access_token: authService.access_token
            });
            return {
                client: apiClient,
                actions: {
                    all: function (callback, progress) {
                        apiClient.resource(resourceName, query).action('get', null, callback, progress);
                    },
                    find: function (uuid, callback, progress) {
                        apiClient.resource(resourceName, query).action('get', uuid, callback, progress);
                    },
                    create: function (data, callback, progress) {
                        apiClient.resource(resourceName).action('post', data, callback, progress);
                    },
                    update: function (uuid, data, callback, progress) {
                        data.uuid = uuid;
                        apiClient.resource(resourceName).action('put', data, callback, progress);
                    },
                    remove: function (uuid, callback, progress) {
                        apiClient.resource(resourceName).action('delete', uuid, callback, progress);
                    }
                },
                getCredentials: function (access_token, callback) {
                    apiClient.setToken(access_token);
                    apiClient.getCredentials(function (err, credentials) {
                        if (err) {
                            return callback(err);
                        }
                        if (typeof credentials === 'object') {
                            authService.setCredentials(credentials, access_token);
                            callback(null);
                        } else {
                            callback(new Error('Failed to get credentials'));
                        }
                    });
                },
                authenticate: function (login, password, callback) {
                    apiClient.getToken({email: login, password: password}, function (err, token) {
                        if (err) {
                            return callback(err);
                        }
                        if (typeof token === 'object') {
                            apiClient.getCredentials(function (err, credentials) {
                                if (err) {
                                    return callback(err);
                                }
                                if (typeof credentials === 'object') {
                                    authService.setCredentials(credentials, token);
                                    callback(null);
                                } else {
                                    callback(new Error('Failed to get credentials'));
                                }
                            });
                        } else {
                            callback(new Error('Failed to get token'));
                        }
                    });
                }
            };
        };
    }]);
});