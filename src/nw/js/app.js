(function () {
    'use strict';
    angular.module('piecemeta-frontend', [
        'ui.bootstrap',
        'ngRoute',
        'cgBusy',
        'btford.markdown',
        'piecemeta-nw.controllers.osc-player',
        'piecemeta-web.controllers.collections',
        'piecemeta-web.controllers.data-packages',
        'piecemeta-web.controllers.data-channels',
        'piecemeta-web.controllers.data-streams',
        'piecemeta-web.services.api',
        'piecemeta-web.directives.helpers'
    ])
        .config(['$routeProvider', '$locationProvider', '$logProvider', function ($routeProvider, $locationProvider, $logProvider) {

            $logProvider.debugEnabled(true);

            $locationProvider.html5Mode(true).hashPrefix('!');

            var partialsPath = 'partials/';

            $routeProvider.when('/packages/browse', {templateUrl: partialsPath + 'oscplayer_packages_browse.html', controller: 'DataPackages.List'});
            $routeProvider.when('/oscplayer/settings', {templateUrl: partialsPath + 'oscplayer_settings.html', controller: 'OscPlayer.Settings'});
            $routeProvider.when('/oscplayer/:uuid/play', {templateUrl: partialsPath + 'oscplayer_play.html', controller: 'OscPlayer.Play'});

            $routeProvider.otherwise({redirectTo: '/packages/browse'});

        }]).run(['$rootScope', '$q', function ($rootScope, $q) {

            var gui = require('nw.gui');
            var win = gui.Window.get();
            var nativeMenuBar = new gui.Menu({ type: 'menubar' });
            try {
                nativeMenuBar.createMacBuiltin('PieceMetaOSC');
                win.menu = nativeMenuBar;
            } catch (e) {
                console.log('failed to setup native menubar', e.message);
            }

            // TODO: write a proper settings service
            if (!localStorage.getItem('osc-datahost')) {
                localStorage.setItem('osc-datahost', '127.0.0.1');
            }
            if (!localStorage.getItem('osc-dataport')) {
                localStorage.setItem('osc-dataport', 8000);
            }
            if (!localStorage.getItem('osc-controlport')) {
                localStorage.setItem('osc-controlport', 9999);
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