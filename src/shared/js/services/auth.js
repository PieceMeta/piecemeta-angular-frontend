/* global angular */
(function () {
    'use strict';
    angular.module('piecemeta-web.services.auth', []).
        factory('authService', ['$http', function () {
            var auth = {
                api_key : null,
                access_token : null,
                getCredentials : function () {
                    auth.api_key = typeof localStorage.api_key === 'string' ? JSON.parse(localStorage.api_key) : null;
                    auth.access_token = typeof localStorage.access_token === 'string' ? JSON.parse(localStorage.access_token) : null;
                },
                setCredentials : function (api_key, access_token) {
                    localStorage.api_key = JSON.stringify(api_key);
                    localStorage.access_token = JSON.stringify(access_token);
                    auth.getCredentials();
                },
                clearCredentials : function () {
                    localStorage.removeItem('api_key');
                    localStorage.removeItem('access_token');
                    auth.getCredentials();
                }
            };
            auth.getCredentials();
            return auth;
        }]);
}());