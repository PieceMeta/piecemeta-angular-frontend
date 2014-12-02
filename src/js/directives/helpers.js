angular.module('piecemeta-web.directives.helpers', [
        'piecemeta-web.services.api',
        'piecemeta-web.services.auth'
    ]).
    directive('checkLogin', ['apiService', 'authService', function (apiService, authService) {
        'use strict';
        return {
            link: function (scope) {
                scope.updateUser = function () {
                    if (authService.access_token) {
                        apiService('users').actions.find('me', function (err, res) {
                            if (err) {
                                console.log('error fetching user', err);
                                scope.userSession = null;
                                return;
                            }
                            scope.userSession = res;
                        });
                    }
                };
                scope.updateUser();
            }
        };
    }]).
    directive('getAvatar', function () {
        'use strict';
        return {
            restrict: 'A',
            transclude: true,
            scope : {
                userObject: '=userObject'
            },
            link: function (scope, elem, attrs) {
                scope.$watch('userObject', function () {
                    if (!scope.userObject || !scope.userObject.email) {
                        return;
                    }
                    var hash = scope.userObject.id;
                    if (scope.userObject.avatar === 'robohash') {
                        elem.attr('src', 'http://robohash.org/' + hash + '.jpg');
                    }
                    if (scope.userObject.avatar === 'gravatar') {
                        elem.attr('src', 'http://www.gravatar.com/avatar/' + hash + '?d=mm' + (attrs.width ? '&s=' + attrs.width : ''));
                    }
                    if (scope.userObject.avatar === 'unicornify') {
                        elem.attr('src', 'http://unicornify.appspot.com/avatar/' + hash + (attrs.width ? '?s=' + attrs.width : ''));
                    }
                }, true);
            }
        };
    });