(function () {
    'use strict';
    angular.module('piecemeta-frontend', [
        'ui.bootstrap',
        'ngRoute',
        'cgBusy',
        'btford.markdown',
        'piecemeta-web.directives.helpers'
    ])
        .config(['$routeProvider', '$locationProvider', '$logProvider', function ($routeProvider, $locationProvider, $logProvider) {

            $logProvider.debugEnabled(true);

            var partialsPath = 'partials/';


            //$routeProvider.otherwise({redirectTo: '/'});
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