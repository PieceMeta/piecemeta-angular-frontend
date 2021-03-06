/* global angular,require,console */
(function () {
    'use strict';
    angular.module('piecemeta-frontend', [
        'ui.bootstrap',
        'ngRoute',
        'cgBusy',
        'btford.markdown',
        'piecemeta-nw.controllers.osc-player',
        'piecemeta-web.services.api',
        'piecemeta-web.directives.helpers'
    ])
        .config(['$routeProvider', '$locationProvider', '$logProvider', function ($routeProvider, $locationProvider, $logProvider) {

            $logProvider.debugEnabled(true);

            var os = require('os');


            if (os.platform() !== 'win32') {
                console.log('html5 mode active', os.platform());
                $locationProvider.html5Mode(true).hashPrefix('!');
            }

            var partialsPath = 'partials/';

            $routeProvider.when('/oscplayer/load', {templateUrl: partialsPath + 'oscplayer_packages_browse.html', controller: 'OscPlayer.Load'});
            $routeProvider.when('/oscplayer/settings', {templateUrl: partialsPath + 'oscplayer_settings.html', controller: 'OscPlayer.Settings'});
            $routeProvider.when('/oscplayer/:uuid/play', {templateUrl: partialsPath + 'oscplayer_play.html', controller: 'OscPlayer.Play'});

            $routeProvider.otherwise({redirectTo: '/oscplayer/load'});

        }]).run(['$rootScope', '$q', function ($rootScope, $q) {

            var gui = require('nw.gui');
            var os = require('os');
            var win = gui.Window.get();
            var nativeMenuBar = new gui.Menu({ type: 'menubar' });

            $rootScope.platform = os.platform();

            if (os.platform() === 'darwin') {
                nativeMenuBar.createMacBuiltin('PieceMetaOSC');
                win.menu = nativeMenuBar;
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
}());