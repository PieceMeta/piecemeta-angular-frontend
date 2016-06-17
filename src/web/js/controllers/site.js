/* global angular,define */

'use strict';

define([], function () {
    return angular.module('piecemeta-web.controllers.site', [])
        .controller('Site.Welcome', ['$scope', function ($scope) {
            $scope.$parent.status = 'ready';
        }])
        .controller('Site.About', ['$scope', function ($scope) {
            $scope.$parent.status = 'ready';
        }])
        .controller('Site.Software', ['$scope', function ($scope) {
            $scope.$parent.status = 'ready';
        }]);
});