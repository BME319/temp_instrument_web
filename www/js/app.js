'use strict';

angular.module('IntelligentDetector', ['ui.router', 'ui.bootstrap', 'controllers', 'services', 'directives', 'ngTable', 'ngAnimate', 'filters'])

    .config(['$stateProvider', '$urlRouterProvider',
        function($stateProvider, $urlRouterProvider) {

            $urlRouterProvider.otherwise('/login')

            $stateProvider
                // 登录
                .state('login', {
                    url: "/login",
                    templateUrl: "templates/login.html",
                    controller: "LoginCtrl"
                })
                //注册
                .state('register', {
                    url: "/register",
                    templateUrl: "templates/register.html",
                    controller: "RegisterCtrl"
                })
                // 主页面
                .state('main', {
                    url: "/main",
                    templateUrl: "templates/main.html",
                    controller: "MainCtrl"
                })

                // 汇总数据
                .state('main.data', {
                    // abstract: true,
                    url: "/data",
                    templateUrl: 'templates/data.html',
                    controller: "dataCtrl"
                })
                .state('main.data.testResult', {
                    url: "/testResult",
                    templateUrl: 'templates/data/testResult.html',
                    controller: 'testResultCtrl'
                })
                .state('main.data.instrument', {
                    url: "/instrument",
                    templateUrl: 'templates/data/instrument.html',
                    controller: 'instrumentCtrl'
                })
                .state('main.data.reagent', {
                    url: "/reagent",
                    templateUrl: 'templates/data/reagent.html',
                    controller: 'reagentCtrl'
                })
                .state('main.data.sampling', {
                    url: "/sampling",
                    templateUrl: 'templates/data/sampling.html',
                    controller: 'samplingCtrl'
                })

                // 监控
                .state('main.monitors', {
                    // abstract: true,
                    url: "/monitors",
                    templateUrl: 'templates/monitors.html',
                    controller: "monitorsCtrl"

                })

                //字典管理
                .state('main.dictionaries', {
                    // abstract: true,
                    url: "/dictionaries",
                    templateUrl: 'templates/dictionaries.html',
                    controller: "dictionariesCtrl"

                })
                .state('main.dictionaries.operationorder', {
                    url: "/operationorder",
                    templateUrl: 'templates/dictionaries/operationorder.html',
                    controller: 'operationorderCtrl'
                })
                .state('main.dictionaries.operation', {
                    url: "/operation",
                    templateUrl: 'templates/dictionaries/operation.html',
                    controller: "operationCtrl"
                })
                .state('main.dictionaries.samplingtype', {
                    url: "/samplingtype",
                    templateUrl: 'templates/dictionaries/samplingtype.html',
                    controller: 'samplingtypeCtrl'
                })

                //用户管理
                .state('main.users', {
                    // abstract: true,
                    url: "/users",
                    templateUrl: 'templates/users.html',
                    controller: "usersCtrl"

                })
                .state('main.users.allusers', {
                    url: "/allusers",
                    templateUrl: 'templates/users/allusers.html',
                    controller: 'allusersCtrl'
                })

                // 设置
                .state('setPassword', {
                    url: "/setPassword",
                    templateUrl: 'templates/settings/setPassword.html',
                    controller: "SetPasswordCtrl"
                })
                .state('changePassword', {
                    url: "/changePassword",
                    templateUrl: 'templates/settings/changePassword.html',
                    controller: "ChangePasswordCtrl"
                })
                .state('phoneValid', {
                    url: "/phoneValid",
                    templateUrl: 'templates/settings/phoneValid.html',
                    controller: 'phoneValidCtrl'
                })
                .state('userDetail', {
                    url: "/userDetail",
                    templateUrl: 'templates/settings/userdetail.html'
                })
        }

    ])
    .config(function($httpProvider) {
        $httpProvider.interceptors.push(function($q, $location, $rootScope, Storage) {
            return {
                'request': function(config) {
                    config.headers = config.headers || {};
                    var token = Storage.get('TOKEN')
                    if (token && token.length >= 16) {
                        // console.log('token', token)
                        config.headers.Authorization = Storage.get('TOKEN')
                    }
                    return config;
                },
                'responseError': function(response) {
                    if (response.status === 401 || response.status === 403) {
                        //如果之前登陆过

                        $rootScope.$broadcast('unAuthenticed');

                    }
                    return $q.reject(response);
                }
            }
        })
    })