/* global angular,Modernizr,define */

'use strict';

define([
    'config',
    'controllers_site',
    'controllers_users',
    'controllers_packages',
    'controllers_channels',
    'controllers_streams',
    'directives_helpers'
], function () {
    return angular.module('piecemeta-frontend', [
        'ui.bootstrap',
        'ngRoute',
        'cgBusy',
        'btford.markdown',
        'chart.js',
        'piecemeta-web.controllers.site',
        'piecemeta-web.controllers.users',
        'piecemeta-web.controllers.packages',
        'piecemeta-web.controllers.channels',
        'piecemeta-web.controllers.streams',
        'piecemeta-web.directives.helpers'
    ])
    .config(['$routeProvider', '$locationProvider', '$logProvider', 'ChartJsProvider', function ($routeProvider, $locationProvider, $logProvider, ChartJsProvider) {

        ChartJsProvider.setOptions({
            showTooltips: true,
            scaleShowLabels: true,
            animation: false,
            responsive: false,
            pointDot: false,
            bezierCurve: false,
            scaleShowGridLines: true,
            datasetFill: false,
            legend: true,
            offsetGridLines: false,
            datasetStrokeWidth: 1,
            scaleBeginAtZero: false,
            scaleOverride: true,
            maintainAspectRatio: true,
            // TODO: make this configurable
            // Number - The number of steps in a hard coded scale
            scaleSteps: 20,
            // Number - The value jump in the hard coded scale
            scaleStepWidth: 0.02,
            // Number - The scale starting value
            scaleStartValue: -0.2
        });
        ChartJsProvider.setOptions('Line', {
            datasetFill: false,
            datasetStrokeWidth: 1
        });

        $logProvider.debugEnabled(true);

        $locationProvider.html5Mode(true).hashPrefix('!');

        var partialsPath = 'partials/';

        $routeProvider.when('/', {templateUrl: partialsPath + 'welcome.html', controller: 'Site.Welcome'});

        $routeProvider.when('/signup', {templateUrl: partialsPath + 'signup.html', controller: 'Users.Create'});
        $routeProvider.when('/me/account', {templateUrl: partialsPath + 'account.html', controller: 'Users.Edit'});
        $routeProvider.when('/confirm/:single_access_token', {templateUrl: partialsPath + 'confirm', controller: 'Users.Confirm'});
        $routeProvider.when('/login', {templateUrl: partialsPath + 'login.html', controller: 'Users.Login'});
        $routeProvider.when('/logout', {templateUrl: partialsPath + 'logout.html', controller: 'Users.Logout'});

        $routeProvider.when('/packages/browse', {templateUrl: partialsPath + 'packages_browse.html', controller: 'Packages.List'});
        $routeProvider.when('/packages/:uuid/channels/import/csv', {templateUrl: partialsPath+ 'streams_import.html', controller: 'Streams.ImportFile'});
        $routeProvider.when('/packages/:uuid/channels/import/trac', {templateUrl: partialsPath + 'streams_import_trac.html', controller: 'Streams.ImportTrac'});
        $routeProvider.when('/packages/upload', {templateUrl: partialsPath + 'packages_upload.html', controller: 'Packages.ImportBVH'});
        $routeProvider.when('/packages/uploadjson', {templateUrl: partialsPath + 'packages_upload_json.html', controller: 'Packages.ImportJSON'});
        $routeProvider.when('/packages/create', {templateUrl: partialsPath + 'packages_edit.html', controller: 'Packages.Create'});
        $routeProvider.when('/packages/:uuid/edit', {templateUrl: partialsPath + 'packages_edit.html', controller: 'Packages.Edit'});
        $routeProvider.when('/packages/:uuid/show', {templateUrl: partialsPath + 'packages_show.html', controller: 'Packages.Show'});

        $routeProvider.when('/collections/create', {templateUrl: partialsPath + 'collections_edit.html', controller: 'BasicResource.Create'});
        $routeProvider.when('/collections/:uuid/edit', {templateUrl: partialsPath + 'collections_edit.html', controller: 'BasicResource.Edit'});

        $routeProvider.when('/channels/:uuid/streams/create', {templateUrl: partialsPath + 'streams_edit.html', controller: 'Streams.Create'});
        $routeProvider.when('/streams/:uuid/edit', {templateUrl: partialsPath + 'streams_edit.html', controller: 'Streams.Edit'});

        $routeProvider.when('/packages/:package_uuid/channels/create', {templateUrl: partialsPath + 'channels_edit.html', controller: 'Channels.Create'});
        $routeProvider.when('/channels/:uuid/edit', {templateUrl: partialsPath + 'channels_edit.html', controller: 'Channels.Edit'});

        $routeProvider.otherwise({redirectTo: '/'});
    }]).run(['$rootScope', '$q', function ($rootScope, $q) {

        if (!Modernizr.localstorage || !Modernizr.canvas || !Modernizr.hashchange || !Modernizr.fontface) {
            window.alert("Your browser is too old or not compatible with this website. It may still work, but most likely won't.");
        }

        $rootScope.$on('$routeChangeStart', function () {
            $rootScope.pageDefer = $q.defer();
            $rootScope.pagePromise = $rootScope.pageDefer.promise;
        });
        $rootScope.$on('$routeChangeSuccess', function () {
            $rootScope.pageDefer.resolve();
        });
        $rootScope.$on('$routeChangeError', function () {
            $rootScope.pageDefer.reject();
        });
    }]);
});