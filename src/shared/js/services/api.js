angular.module('piecemeta-web.services.api', []).
factory('apiService', ['authService', function (authService) {
    'use strict';
    return function (resourceName) {
        var apiClient = PMApi({
            host: PIECEMETA_API_HOST,
            contentType: 'application/json',
            api_key: authService.api_key,
            access_token: authService.access_token
        });
        return {
            client: apiClient,
            actions: {
                all: function (callback, progress) {
                    apiClient.resource(resourceName).action('get', null, callback, progress);
                },
                find: function (uuid, callback, progress) {
                    apiClient.resource(resourceName).action('get', uuid, callback, progress);
                },
                create: function (data, callback, progress) {
                    apiClient.resource(resourceName).action('post', data, callback, progress);
                },
                update: function (uuid, data, callback, progress) {
                    data.uuid = uuid;
                    apiClient.resource(resourceName).action('put', data, callback, progress);
                },
                remove: function (uuid, callback, progress) {
                    apiClient.resource(resourceName).action('delete', { uuid: uuid }, callback, progress);
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
                apiClient.getToken({ email: login, password: password }, function (err, token) {
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

