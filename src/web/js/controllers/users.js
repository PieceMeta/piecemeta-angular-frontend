/* global angular */
(function () {
    'use strict';
    angular.module(
        'piecemeta-web.controllers.users',
        [
            'piecemeta-web.services.api',
            'piecemeta-web.services.auth'
        ])
        .controller('Users.Create', ['$scope', '$q', 'apiService', function ($scope, $q, apiService) {
            $scope.signup_complete = false;
            $scope.alerts = [];
            $scope.user = {
                name : null,
                email : null,
                password : null,
                password_confirm: null
            };
            $scope.closeAlert = function (index) {
                $scope.alerts.splice(index, 1);
            };
            $scope.$parent.status = 'ready';
            $scope.submit = function () {
                var deferred = $q.defer();
                $scope.promiseString = 'Registering...';
                $scope.promise = deferred.promise;
                $scope.$broadcast('show-errors-check-validity');
                if ($scope.signupForm.$invalid) {
                    $scope.alerts = [{
                        type : 'danger',
                        msg : 'Form is still invalid.'
                    }];
                    deferred.reject();
                    return;
                }
                apiService('users').actions.create($scope.user, function (err, res) {
                    if (err) {
                        if (err.status !== 200) {
                            $scope.alerts = [];
                            if (res && res.errors) {
                                for (var field in res.errors) {
                                    if (typeof res.errors[field] === 'object') {
                                        $scope.alerts.push({
                                            type: 'danger',
                                            msg: res.errors[field].message
                                        });
                                    }
                                }
                            } else {
                                $scope.alerts = [
                                    {
                                        type: 'danger',
                                        msg: 'Server returned: ' + err.status + ' - ' + err.code
                                    }
                                ];
                            }
                        }
                        deferred.reject();
                        return;
                    }
                    $scope.alerts = [
                        {
                            type: 'success',
                            msg: 'Your account has been successfully created. Please check your E-Mails to complete the registration.'
                        }
                    ];
                    $scope.signup_complete = true;
                    deferred.resolve();
                });
            };
        }])
        .controller('Users.Edit', ['$scope', '$q', 'apiService', function ($scope, $q, apiService) {
            var deferred = $q.defer();
            $scope.alerts = [];
            $scope.user = {
                name: null,
                email: null,
                avatar: null,
                password: null,
                password_confirm: null
            };
            $scope.closeAlert = function (index) {
                $scope.alerts.splice(index, 1);
            };
            $scope.submit = function () {
                var deferred = $q.defer();
                $scope.promiseString = 'Saving user...';
                $scope.promise = deferred.promise;
                $scope.$broadcast('show-errors-check-validity');
                if ($scope.userForm.$invalid) {
                    $scope.alerts = [
                        {
                            type: 'danger',
                            msg: 'Form is still invalid.'
                        }
                    ];
                    deferred.reject();
                    return;
                }
                if (!$scope.user.password || $scope.user.password.length === 0 || $scope.user.password !== $scope.user.password_confirm) {
                    delete $scope.user.password;
                    delete $scope.user.password_confirm;
                }
                apiService('users').actions.update('me', $scope.user, function (err) {
                    if (err) {
                        var alerts = [];
                        if (err.status === 409) {
                            var messages = JSON.parse(err.message);
                            for (var field in messages) {
                                if (typeof messages[field] === 'object') {
                                    alerts.push({
                                        type: 'danger',
                                        msg: messages[field].message
                                    });
                                }
                            }
                        } else {
                            alerts = [
                                {
                                    type: 'danger',
                                    msg: 'Server returned: ' + err.status + ' - ' + err.code
                                }
                            ];
                        }
                        $scope.alerts = alerts;
                        deferred.reject(err);
                        return;
                    }
                    $scope.user.password = null;
                    $scope.user.password_confirm = null;
                    $scope.updateUser();
                    $scope.alerts = [
                        {
                            type: 'success',
                            msg: 'Your account has been successfully updated.'
                        }
                    ];
                    deferred.resolve();
                });
            };

            $scope.promiseString = 'Loading user...';
            $scope.promise = deferred.promise;
            apiService('users').actions.find('me', function (err, user) {
                if (err) {
                    console.log('unable to get user', err);
                    deferred.reject(err);
                } else {
                    $scope.user = {
                        name: user.name,
                        email: user.email,
                        avatar: user.avatar,
                        password: null,
                        password_confirm: null
                    };
                    deferred.resolve(user);
                }
            });
        }])
        .controller('Users.Confirm', ['$scope', '$q', '$location', '$routeParams', 'apiService', 'authService', function ($scope, $q, $location, $routeParams, apiService, authService) {
            var deferred = $q.defer();
            $scope.promiseString = 'Confirming user...';
            $scope.promise = deferred.promise;
            apiService('users/me/access_tokens').actions.create({ single_access_token: $routeParams.single_access_token },
                function (err, access_token) {
                    if (err) {
                        $scope.alerts = [
                            {
                                type: 'danger',
                                msg: 'Your account could not be confirmed.'
                            }
                        ];
                        deferred.reject(err);
                        return;
                    }
                    apiService().getCredentials(access_token, function (err) {
                        if (err) {
                            $scope.alerts = [
                                {
                                    type: 'danger',
                                    msg: 'Your account could not be confirmed.'
                                }
                            ];
                            deferred.reject(err);
                            return;
                        }
                        $scope.alerts = [
                            {
                                type: 'success',
                                msg: 'Your account has been successfully confirmed.'
                            }
                        ];
                        $scope.updateUser();
                        deferred.resolve();
                    });
                }
            );
        }])
        .controller('Users.Login', ['$scope', '$q', '$location', 'apiService', function ($scope, $q, $location, apiService) {
            $scope.alerts = [];
            $scope.user = {
                email: null,
                password: null
            };
            $scope.$parent.status = 'ready';
            $scope.closeAlert = function (index) {
                $scope.alerts.splice(index, 1);
            };
            $scope.submit = function () {
                var deferred = $q.defer();
                $scope.promiseString = 'Logging in...';
                $scope.promise = deferred.promise;
                apiService().authenticate($scope.user.email, $scope.user.password, function (err) {
                    if (err) {
                        $scope.alerts = [
                            {
                                type: 'danger',
                                msg: 'Login failed.'
                            }
                        ];
                        deferred.reject(err);
                        return;
                    }
                    $scope.updateUser();
                    deferred.resolve();
                    $location.path('/');
                });
            };
        }])
        .controller('Users.Logout', ['$scope', 'authService', function ($scope, authService) {
            authService.clearCredentials();
            window.location = '/';
        }]);
}());