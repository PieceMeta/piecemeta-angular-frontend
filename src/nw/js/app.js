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
        'piecemeta-web.directives.helpers'
    ])
        .config(['$routeProvider', '$locationProvider', '$logProvider', function ($routeProvider, $locationProvider, $logProvider) {

            $logProvider.debugEnabled(true);

            $locationProvider.html5Mode(true).hashPrefix('!');

            var partialsPath = 'partials/';

            $routeProvider.when('/packages/browse', {templateUrl: partialsPath + 'oscplayer_packages_browse.html', controller: 'DataPackages.List'});
            $routeProvider.when('/oscplayer/:id/play', {templateUrl: partialsPath + 'oscplayer_play.html', controller: 'OscPlayer.Play'});

            $routeProvider.otherwise({redirectTo: '/packages/browse'});

        }]).run(['$rootScope', '$q', function ($rootScope, $q) {
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