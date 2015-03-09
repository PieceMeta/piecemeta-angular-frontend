(function () {
    'use strict';
    angular.module('piecemeta-frontend', [
        'ui.bootstrap',
        'ngRoute',
        'cgBusy',
        'btford.markdown',
        'piecemeta-web.controllers.osc-player',
        'piecemeta-web.controllers.collections',
        'piecemeta-web.controllers.data-packages',
        'piecemeta-web.controllers.data-channels',
        'piecemeta-web.controllers.data-streams',
        'piecemeta-web.services.db',
        'piecemeta-web.directives.helpers'
    ])
        .config(['$routeProvider', '$locationProvider', '$logProvider', function ($routeProvider, $locationProvider, $logProvider) {

            $logProvider.debugEnabled(true);

            $locationProvider.html5Mode(true).hashPrefix('!');

            var partialsPath = 'partials/';

            $routeProvider.when('/packages/browse', {templateUrl: partialsPath + 'oscplayer_packages_browse.html', controller: 'DataPackages.List'});
            $routeProvider.when('/oscplayer/:uuid/play', {templateUrl: partialsPath + 'oscplayer_play.html', controller: 'OscPlayer.Play'});

            $routeProvider.otherwise({redirectTo: '/packages/browse'});

        }]).run(['$rootScope', '$q', function ($rootScope, $q) {

            var gui = require('nw.gui');
            var win = gui.Window.get();
            var nativeMenuBar = new gui.Menu({ type: 'menubar' });
            try {
                nativeMenuBar.createMacBuiltin('PieceMeta');
                win.menu = nativeMenuBar;
            } catch (e) {
                console.log('failed to setup native menubar', e.message);
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