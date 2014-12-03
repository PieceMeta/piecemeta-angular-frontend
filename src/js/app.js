(function () {
    'use strict';
    angular.module('piecemeta-web', [
        'ui.bootstrap',
        'ngRoute',
        'cgBusy',
        'btford.markdown',
        'piecemeta-web.controllers.site',
        'piecemeta-web.controllers.users',
        'piecemeta-web.controllers.collections',
        'piecemeta-web.controllers.data-packages',
        'piecemeta-web.controllers.data-channels',
        'piecemeta-web.controllers.data-streams',
        'piecemeta-web.directives.helpers'
    ])
    .config(['$routeProvider', '$locationProvider', '$logProvider', function ($routeProvider, $locationProvider, $logProvider) {

        $logProvider.debugEnabled(true);

        $locationProvider.html5Mode(true).hashPrefix('!');

        var partialsPath = 'dist/html/partials/';

        $routeProvider.when('/', {templateUrl: partialsPath + 'welcome.html', controller: 'Site.Welcome'});
        $routeProvider.when('/about', {templateUrl: partialsPath + 'about.html', controller: 'Site.About'});
        $routeProvider.when('/software', {templateUrl: partialsPath + 'software.html', controller: 'Site.Software'});

        $routeProvider.when('/signup', {templateUrl: partialsPath + 'signup.html', controller: 'Users.Create'});
        $routeProvider.when('/me/account', {templateUrl: partialsPath + 'account.html', controller: 'Users.Edit'});
        $routeProvider.when('/confirm/:single_access_token', {templateUrl: partialsPath + 'confirm', controller: 'Users.Confirm'});
        $routeProvider.when('/login', {templateUrl: partialsPath + 'login.html', controller: 'Users.Login'});
        $routeProvider.when('/logout', {templateUrl: partialsPath + 'logout.html', controller: 'Users.Logout'});

        $routeProvider.when('/packages/browse', {templateUrl: partialsPath + 'packages_browse.html', controller: 'DataPackages.List'});
        $routeProvider.when('/packages/:id/channels/import', {templateUrl: partialsPath+ 'streams_import.html', controller: 'DataStreams.ImportFile'});
        $routeProvider.when('/packages/upload', {templateUrl: partialsPath + 'packages_upload.html', controller: 'DataPackages.ImportBVH'});
        $routeProvider.when('/packages/uploadosc', {templateUrl: partialsPath + 'packages_upload_osc.html', controller: 'DataPackages.ImportOSC'});
        $routeProvider.when('/packages/create', {templateUrl: partialsPath + 'packages_edit.html', controller: 'DataPackages.Create'});
        $routeProvider.when('/packages/:id/edit', {templateUrl: partialsPath + 'packages_edit.html', controller: 'DataPackages.Edit'});
        $routeProvider.when('/packages/:id/show', {templateUrl: partialsPath + 'packages_show.html', controller: 'DataPackages.Show'});

        $routeProvider.when('/collections/create', {templateUrl: partialsPath + 'collections_edit.html', controller: 'Collections.Create'});
        $routeProvider.when('/collections/:id/edit', {templateUrl: partialsPath + 'collections_edit.html', controller: 'Collections.Edit'});

        $routeProvider.when('/channels/:id/streams/create', {templateUrl: partialsPath + 'streams_edit.html', controller: 'DataStreams.Create'});
        $routeProvider.when('/streams/:id/edit', {templateUrl: partialsPath + 'streams_edit.html', controller: 'DataStreams.Edit'});

        $routeProvider.when('/packages/:package_id/channels/create', {templateUrl: partialsPath + 'channels_edit.html', controller: 'DataChannels.Create'});
        $routeProvider.when('/channels/:id/edit', {templateUrl: partialsPath + 'channels_edit.html', controller: 'DataChannels.Edit'});

        $routeProvider.otherwise({redirectTo: '/'});
    }]).run(['$rootScope', '$q', function ($rootScope, $q) {

        if (!Modernizr.localstorage || !Modernizr.canvas || !Modernizr.hashchange || !Modernizr.fontface) {
            window.alert("Your browser is too old or not compatible with this website. It may still work, but most likely won't.");
        }

        $rootScope.$on('$routeChangeStart', function (e, curr, prev) {
            $rootScope.pageDefer = $q.defer();
            $rootScope.pagePromise = $rootScope.pageDefer.promise;
        });
        $rootScope.$on('$routeChangeSuccess', function (e, curr, prev) {
            $rootScope.pageDefer.resolve();
        });
        $rootScope.$on('$routeChangeError', function (e, curr, prev) {
            $rootScope.pageDefer.reject();
        });
    }]);
}());