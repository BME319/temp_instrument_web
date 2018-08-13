angular.module('controllers', ['ngResource', 'services'])

    .controller('LoginCtrl', ['UserService', '$scope', '$state', 'Storage', '$timeout', function(UserService, $scope, $state, Storage, $timeout) {

        //捆绑变量
        $scope.logdisable = false;
        $scope.logStatus = "   ";

        // 判断当前本地是否缓存了手机号
        if (Storage.get('PHONENO') != null) { //缓存了手机号 将其显示到输入栏
            $scope.login = {
                phoneno: Storage.get('PHONENO'),
                password: ""
            };
        } else { //否则空白显示
            $scope.login = {
                phoneno: "",
                password: ""
            };
        }
        var count = 0; //记录登录总次数,用于disable button

        // UserService.Login("2323","12345678")

        $scope.LogIn = function(login) {
            //显示登陆的进程
            $scope.logStatus = " ";

            // 如果都输入完全的信息了 开始下一步
            if (login.phoneno != "" && login.password != "") {

                //判断合法手机号
                var phonev = /^1(3|4|5|7|8)\d{9}$/;
                if (!phonev.test(login.phoneno)) {
                    $scope.logStatus = '请输入正确手机号';
                    return
                }

                //从手机号获得 UserId
                var loginInfo = { "PhoneNo": login.phoneno }
                UserService.GetUserByPhoneNo(loginInfo).then(function(data) {
                    data = data.toJSON()
                    t = [];
                    for (i in data) {
                        t = t + data[i];
                    }
                    data = t;

                    if (t != "") { //获得UserId

                        console.log(t);
                        Storage.set("UID", t);
                        // UserService.SetUID(t);
                        //本地暂存
                        var loginInfo2 = {
                            "UserId": t,
                            "InPassword": login.password,
                            "TerminalIP": Storage.get("cip"),
                            "TerminalName": Storage.get("cname"),
                            "revUserId": Storage.get("UID")
                        }
                        UserService.Login(loginInfo2).then(function(data2) { //登陆
                            if (data2.result.indexOf("登录成功") != -1) {

                                var userInfoQuery = {
                                    "UserId": Storage.get('UID'),
                                    "Identify": 0,
                                    "PhoneNo": 0,
                                    "UserName": 1,
                                    "Role": 1,
                                    "Password": 0,
                                    "LastLoginTime": 1,
                                    "RevisionInfo": 0,
                                    "Token": 1,
                                    "LastLogoutTime": 1,
                                };
                                var promise = UserService.GetUserInfo(userInfoQuery);
                                promise.then(function(data3) {
                                    $scope.userInfo = data;
                                    console.log(Storage.get('ROLE'))
                                    Storage.set('ROLE', data.Role)
                                    // console.log($scope.userInfo);
                                }, function(err) {});

                                // console.log(data2.result)
                                var token = data2.result.substring(5)
                                Storage.set('TOKEN', token)
                                console.log("cid : " + returnCitySN.cid);
                                Storage.set('cip', returnCitySN.cip)
                                console.log("cip : " + returnCitySN.cip); //得到IP
                                Storage.set('cname', returnCitySN.cname)
                                console.log("cname : " + returnCitySN.cname); //得到城市

                                $scope.logStatus = " 登录成功";
                                //获得个人信息
                                // UserService.GetUserInfo(login.phoneno).then(function(data){
                                //     console.log(data.result.split('|'))
                                // });
                                // 跳转到主页
                                $timeout(function() { $state.go('main.data.sampling'); }, 0);

                            } else {
                                switch (data2.result) {
                                    case 0:
                                        $scope.logStatus = "用户不存在";
                                        break;
                                    case -1:
                                        $scope.logStatus = "密码错误";
                                        break;
                                    case -2:
                                        $scope.logStatus = "连接数据库失败";
                                        break;
                                    default:
                                        $scope.logStatus = "其他问题";
                                        break;

                                }

                                if (count++ >= 5) { //连续超过五次 禁止登陆60s
                                    $scope.logStatus = "稍后再试";
                                    $scope.logdisable = true;
                                    $timeout(function() {
                                        $scope.logdisable = false;
                                        count = 0;
                                    }, 60000);
                                }
                            }
                        })
                    }

                })

            } else { //否则开始计算点击次数
                if (count++ < 5) { //超过五次 禁止登陆
                    $scope.logStatus = "请输入完整信息";
                } else {
                    $scope.logStatus = "请输入完整信息";
                    $scope.logdisable = true;
                    $timeout(function() {
                        $scope.logdisable = false;
                        count = 0;
                    }, 60000);
                }
            }
        };
        $scope.toRegister = function() { //跳转到注册页面-电话验证

            Storage.set('setPasswordState', 'register');
            $state.go('phoneValid');

        }

        $scope.toReset = function() { //跳转到找回密码页面-电话验证

            Storage.set('setPasswordState', 'reset');
            $state.go('phoneValid');

        }


    }])

    .controller('phoneValidCtrl', ['$scope', '$timeout', '$interval', 'Storage', '$state', 'UserService', function($scope, $timeout, $interval, Storage, $state, UserService) {

        $scope.telnumber = '';
        $scope.validnumber = '';
        $scope.check = '';
        $scope.validStatus = "点击发送验证码";
        $scope.title = " ";
        $scope.if_disabled = false;
        switch (Storage.get('setPasswordState')) {
            case 'register':
                $scope.title = "注册";
                break;
            case 'reset':
                $scope.title = "找回密码";
                break;
            default:
                $scope.title = "注册";
        }

        var uid_valid = /^UID\d{11}/;
        var RegisterNewUser = function(tel) {

            UserService.CreateNewUserId(tel).then(function(data) {
                // 转换成 json
                data = data.toJSON();
                var t = "";
                for (i in data) {
                    t = t + data[i];
                }
                data = t;

                console.log(data);
                if (data == "该手机号已经注册") {
                    $scope.validStatus = "该手机号已经注册";
                    return;
                } else if (uid_valid.test(data)) {
                    $scope.validStatus = "生成新用户ID成功";
                    Storage.set('UID', data);
                    UserService.SetUID(data);
                    UserService.SetPhenoNo(tel);
                } else {
                    $scope.validStatus = "生成新用户ID失败";
                }
            }, function(er) {
                console.log(er)
                $scope.validStatus = "验证失败";
            });
        }

        var ResetPassword = function(tel) {
            //判断手机号是否存在
            UserService.GetUserByPhoneNo(tel).then(function(data) {
                // 转换成 json

                data = data.toJSON();
                var t = "";
                for (i in data) {
                    t = t + data[i];
                }
                data = t;

                if (data == null) {
                    $scope.validStatus = "不存在该用户";
                    return
                } else if (uid_valid.test(data)) {
                    Storage.set("UID", data);
                    UserService.SetUID(data);
                    UserService.SetPhenoNo(tel);
                    $scope.validStatus = "已发送验证";
                }
            })
        };

        $scope.SendMSM = function(tel) {
            if ($scope.if_disabled) return;

            var phonev = /^1(3|4|5|7|8)\d{9}$/;
            if (!phonev.test(tel)) {
                $scope.check = '请输入正确手机号';
                return
            }


            if (Storage.get('setPasswordState') == 'register') {
                RegisterNewUser(tel);
            } else {
                ResetPassword(tel);
            }
            $scope.if_disabled = true;

            //倒计时60s
            $timeout(function() {
                $scope.validStatus = "点击发送验证码";
                $scope.if_disabled = false;
            }, 60000);
            var second = 60;
            timePromise = undefined;

            timePromise = $interval(function() {
                if (second <= 0) {
                    $interval.cancel(timePromise);
                    timePromise = undefined;
                    second = 60;
                    $scope.validStatus = "重发验证码";
                } else {
                    $scope.validStatus = String(second) + "秒后再发送";
                    second--;

                }
            }, 1000, 100);


        };

        $scope.validNext = function(number) {
            var phonev = /^1(3|4|5|7|8)\d{9}$/;
            if (!phonev.test(number)) {
                $scope.check = '请输入正确手机号';
                return
            }
            Storage.set('PhenoNo', number)
            var validNumberReg = /^\d{6}$/;
            if (!validNumberReg.test($scope.validnumber)) {
                $scope.check = '请输入正确验证码';
                return
            }


            //调web Service 判断验证码正不正确


            switch (Storage.get('setPasswordState')) {
                case 'register':
                    $state.go('register');
                    break;
                case 'reset':
                    $state.go('setPassword');
            }
        }

        $scope.onClickCancel = function() {
            Storage.rm("UID");
            $state.go("login");
        }
    }])

    .controller('RegisterCtrl', ['UserService', '$scope', '$state', 'Storage', '$timeout', function(UserService, $scope, $state, Storage, $timeout) {
        //从手机号获得 UserId
        var t = []
        var uidInfo = { "PhoneNo": Storage.get('PhenoNo') }
        UserService.CreateNewUserId(uidInfo).then(function(data) {
            // console.log(data)
            data = data.toJSON()
            for (i in data) {
                t = t + data[i];
            }
            $scope.registerInfo = {
                "PhoneNo": Storage.get('PhenoNo'),
                "UserId": t,
                "UserName": '',
                "Identify": '',
                "Password": '',
                "Role": "",
                "TerminalIP": Storage.get('cip'),
                "TerminalName": Storage.get('cname'),
                "revUserId": Storage.get("UID")
            }
        })
        $scope.status = "";


        $scope.onClickReg = function(registerInfo) {


            if (registerInfo.Role == "") {
                $scope.status = "请选角色";
                $('#error').modal('show')
                $timeout(function() {
                    $('#error').modal('hide')
                }, 1000)
            }

            if (registerInfo.Password != $scope.password_rep) {
                $scope.status = "两次密码不同";
                $('#pass_error').modal('show')
                $timeout(function() {
                    $('#pass_error').modal('hide')
                }, 1000)
            }

            registerInfo.Role = registerInfo.Role[0];
            console.log(registerInfo.Role);
            console.log(registerInfo);

            UserService.Register(registerInfo).then(function(data) {
                console.log(data);
                if (data.result == "注册成功") {
                    $scope.status = "两次密码不同";
                    $('#register_success').modal('show')
                    $timeout(function() {
                        $('#register_success').modal('hide')
                    }, 1000)
                    $timeout(function() { $state.go('main.data.sampling'); }, 2000);
                    $scope.status = "注册成功";
                } else {
                    $scope.status = "注册失败";
                }
            })
        }
    }])

    .controller('SetPasswordCtrl', ['UserService', '$scope', '$state', 'Storage', '$timeout', function(UserService, $scope, $state, Storage, $timeout) {

        $scope.Input = {
            password: '',
            password2: '',
            password_old: ''
        };

        $scope.status = "";

        $scope.onClickCancel = function() {
            Storage.rm("UID");
            $state.go("login");
        };

        $scope.onClickConfirm = function(Input) {


            if (Input.password != Input.password2) {
                $scope.status = "两次密码不同";
                return
            }

            // console.log(Storage.get("UID"));
            // infoIndex = ["UserId","Identify","PhoneNo","UserName","Role"];
            // UserService.GetUserInfo(infoIndex).then(function(data){
            // console.log(Storage.get("UID"));

            // if(data == null) {
            //     $scope.status = "修改失败，请重试";
            //     return;
            // }

            // data = data.toJSON();
            // var t = "";
            // for(i in data){
            //     t = t + data[i];
            // }
            // data = t;
            //
            // data = data.split('|');
            // console.log(data);
            // registerInfo = {
            //     uid:UserService.GetUID(),
            //     username:data[2],
            //     id:data[0],
            //     password:Input.password,
            //     role:data[3]
            // };




            // UserService.RegisterUser(registerInfo).then(function(data){
            //     // console.log(data);
            //     if(data.result == "注册成功"){
            //         $timeout(function(){$state.go('main.data');} , 500);
            //         $scope.status = "修改成功";
            //     }
            //     else{
            //         $scope.status = "修改失败";
            //     }
            // });
            // console.log(data);
            // Input.password_old = data[4];

            UserService.ChangePassword(Input, 1).then(function(res) {
                if (res.result == "修改成功") {
                    $timeout(function() { $state.go('main.data.sampling'); }, 500);
                } else {

                }
                // if(res){
                //     $timeout(function(){$state.go('main.data');} , 500);
                // }
            })

        }
    }])

    .controller('ChangePasswordCtrl', ['UserService', '$scope', '$state', 'Storage', '$timeout', function(UserService, $scope, $state, Storage, $timeout) {


        $scope.Input = {
            password: '',
            password2: '',
            password_old: ''
        };

        $scope.status = "";


        $scope.onClickConfirm = function(Input) {


            if (Input.password != Input.password2) {
                $scope.status = "两次新密码不同";
                return
            }

            UserService.ChangePassword(Input, 0).then(function(res) {
                if (res.result == "修改成功") {
                    $scope.status = "修改成功";
                    $timeout(function() { $state.go('login'); }, 500);
                } else {
                    $scope.status = "修改失败";
                }
            })


        };

        $scope.back = function() {
            $state.go('main.data.sampling');
        }
    }])

    // 主菜单栏(个人信息)--张桠童
    .controller('MainCtrl', ['$scope', 'CONFIG', 'Storage', 'Data', 'UserService', 'NgTableParams', '$state', '$location',
        function($scope, CONFIG, Storage, Data, UserService, NgTableParams, $state, $location) {
            $scope.userInfo = {};
            var userInfoQuery = {
                "UserId": Storage.get('UID'),
                "Identify": 0,
                "PhoneNo": 0,
                "UserName": 1,
                "Role": 1,
                "Password": 0,
                "LastLoginTime": 1,
                "RevisionInfo": 0,
                "Token": 1,
                "LastLogoutTime": 1,
            };
            var promise = UserService.GetUserInfo(userInfoQuery);
            promise.then(function(data) {
                $scope.userInfo = data;

                Storage.set('ROLE', data.Role)
                console.log(Storage.get('ROLE'))
                // console.log($scope.userInfo);

                if (Storage.get('ROLE') == '管理员') {
                    $scope.flagdata = true;
                    $scope.flagmonitors = false;
                    $scope.flagdictionaries = true;
                    $scope.flagusers = true;
                    $state.go('main.data.sampling')
                } else if (Storage.get('ROLE') == '操作员') {
                    $scope.flagdata = true;
                    $scope.flagmonitors = true;
                    $scope.flagdictionaries = false;
                    $scope.flagusers = false;
                    $state.go('main.data.sampling')

                }
            }, function(err) {});

            $scope.toChangePW = function() {
                $state.go('changePassword');
            };
            $scope.ifOut = function() {
                $('#myModal1').modal('show');
            };
            $scope.toLogin = function() {
                $('#myModal1').modal('hide').on('hidden.bs.modal', function() {
                    Storage.rm("UID");
                    $state.go("login");
                });
            };

            var absurl = $location.absUrl();
            if (absurl.indexOf("data") != -1) {
                $scope.myIndex = 0
            } else if (absurl.indexOf("monitors") != -1) {
                $scope.myIndex = 1
            } else if (absurl.indexOf("dictionaries") != -1) {
                $scope.myIndex = 2
            } else if (absurl.indexOf("users") != -1) {
                $scope.myIndex = 3
            }



            $scope.todata = function() {
                $state.go('main.data.testResult')
            }
            $scope.tomonitors = function() {
                $state.go('main.monitors')
            }
            $scope.todictionaries = function() {
                $state.go('main.dictionaries.operationorder')
            }
            $scope.tousers = function() {
                $state.go('main.users.allusers')
            }

        }
    ])

    // 监控部分--阮卓欣
    .controller('monitorsCtrl', ['$interval', 'Operation', 'SocketService', '$timeout', 'UserService', '$scope', 'CONFIG', 'Storage', 'Data', 'ItemInfo', 'NgTableParams', '$state', 'extraInfo', 'Result',
        function($interval, Operation, SocketService, $timeout, UserService, $scope, CONFIG, Storage, Data, ItemInfo, NgTableParams, $state, extraInfo, Result) {


            if (Storage.get('ROLE') == '管理员') {

                $state.go('main.data.sampling')
            }

            $('.datetimepicker').datetimepicker({
                language: 'zh-CN',
                format: 'yyyy-mm-dd hh:ii',
                weekStart: 1,
                todayBtn: 1,
                autoclose: 1,
                todayHighlight: 1,
                startView: 2,
                minView: 0,
                forceParse: 0,
                minuteStep: 1,
                initialDate: new Date()
            })

            $scope.modal_close = function(target) {
                $scope.reagent = {}
                $(target).modal('hide')
            }
            $scope.sampleEntry = function() {
                $('#new_sample').modal('show')
                $scope.sampleuid = Storage.get("UID")
            }
            $scope.reagentEntry = function() {
                $('#new_reagent').modal('show')
            }
            $scope.addtask = function() {
                $('#add_task').modal('show')
                // document.getElementById('confirm').setAttribute("disabled", false)
            }
            // 监听事件(表单清空)
            $('#new_sample').on('hidden.bs.modal', function() {
                $scope.sample = null
            })
            $('#new_reagent').on('hidden.bs.modal', function() {
                $scope.reagent = null
            })
            $('#add_task').on('hidden.bs.modal', function() {
                $scope.task1 = null
                $scope.task2 = null
                $scope.task3 = null
            })
            $('#detail_Pro').on('hidden.bs.modal', function() {
                $interval.cancel(cal_pro)
            })
            $('#detail_Inc').on('hidden.bs.modal', function() {
                $interval.cancel(cal_detailIncu)
            })
            $scope.sample = {};
            var getJsonLength = function(jsonData) {
                var jsonLength = 0;
                for (var item in jsonData) {
                    jsonLength++;
                }
                return jsonLength;
            }
            $scope.newsample = function() {
                $scope.sample.SamplingPeople = $scope.sampleuid
                var formLength = getJsonLength($scope.sample);
                console.log(formLength)
                if (formLength == 7) {
                    $scope.sample.TerminalIP = Storage.get('cip');
                    $scope.sample.TerminalName = Storage.get('cname');
                    $scope.sample.revUserId = Storage.get("UID");
                    console.log($scope.sample);
                    // console.log(formLength);
                    var promise = ItemInfo.SetSampleData($scope.sample);
                    promise.then(function(data) {
                        console.log(data[0]);
                        if (data[0] == "插入成功") {
                            $('#new_sample').modal('hide')
                            $('#tasksuccess').modal('show')
                            $timeout(function() {
                                $('#tasksuccess').modal('hide')
                            }, 1000)
                        }
                    }, function(err) {});
                } else {
                    console.log('sss')
                    $('#signupFail').modal('show')
                    $timeout(function() {
                        $('#signupFail').modal('hide')
                    }, 1000)
                }
            }

            // var promise = UserService.GetReagentType();
            // promise.then(function(data){
            //     // console.log(data);
            //     $scope.reagenttypes = data;
            // },function(err){});

            $scope.newreagent = function() {
                var formLength = getJsonLength($scope.reagent);
                if (formLength == 3) {
                    $scope.reagent.TerminalIP = Storage.get('cip');
                    $scope.reagent.TerminalName = Storage.get('cname');
                    $scope.reagent.revUserId = Storage.get("UID");
                    console.log($scope.reagent)
                    var promise = ItemInfo.SetReagentData($scope.reagent);
                    promise.then(function(data) {
                        console.log(data)
                        if (data.result == "插入成功") {
                            $('#new_reagent').modal('hide')
                            $('#tasksuccess').modal('show')
                            $timeout(function() {
                                $('#tasksuccess').modal('hide')
                            }, 1000)
                        }
                    }, function(err) {})
                } else {
                    $('#signupFail').modal('show')
                    $timeout(function() {
                        $('#signupFail').modal('hide')
                    }, 1000)
                }
            }


            $scope.queryflow1 = function() {
                $scope.iflarge = false
                if ($scope.task1.SampleType == "SOB") {
                    $scope.iflarge = false
                } else {
                    $scope.iflarge = true
                }
                //选择样品
                var sampleQuery_1 = {
                    "ObjectType": $scope.task1.SampleType,
                    "GetObjectName": 1,
                    "GetObjectType": 1,
                    "GetSamplingPeople": 1,
                    "GetSamplingTime": 1,
                    "GetWarning": 1,
                    "GetRevisionInfo": 1,
                    "Status": "untested"
                }
                ItemInfo.GetSamplesInfo(sampleQuery_1).then(function(data) {
                    $scope.Objects_1 = data
                    // console.log(data)
                }, function(err) {});
                //选择试剂
                var ReagentsQuery_1 = {
                    "GetReagentId": 1,
                    "GetReagentName": 1,
                };
                var promise = ItemInfo.GetReagentsInfo(ReagentsQuery_1);
                promise.then(function(data) {
                    $scope.Reagents = data
                    console.log($scope.Reagents)
                }, function(err) {});
            }

            $scope.queryflow2 = function() {
                var sampleQuery_2 = {
                    "ObjectType": $scope.task2.SampleType,
                    "GetObjectName": 1,
                    "GetObjectType": 1,
                    "GetSamplingPeople": 1,
                    "GetSamplingTime": 1,
                    "GetWarning": 1,
                    "GetRevisionInfo": 1,
                    "Status": "untested"
                }
                var promise = ItemInfo.GetSamplesInfo(sampleQuery_2);
                promise.then(function(data) {
                    $scope.Objects_2 = data
                }, function(err) {});
            }
            $scope.queryflow3 = function() {
                var sampleQuery_3 = {
                    "ObjectType": $scope.task3.SampleType,
                    "GetObjectName": 1,
                    "GetObjectType": 1,
                    "GetSamplingPeople": 1,
                    "GetSamplingTime": 1,
                    "GetWarning": 1,
                    "GetRevisionInfo": 1,
                    "Status": "untested"
                }
                var promise = ItemInfo.GetSamplesInfo(sampleQuery_3);
                promise.then(function(data) {
                    $scope.Objects_3 = data
                    console.log(data)
                }, function(err) {});
            }



            // 是否复位确认
            $scope.instrumentreset = function() {
                var promise4 = ItemInfo.GetIsolatorsInfo({
                    "IsolatorId": null,
                    "ProductDayS": null,
                    "ProductDayE": null,
                    "EquipPro": null,
                    "InsDescription": null,
                    "ReDateTimeS": null,
                    "ReDateTimeE": null,
                    "ReTerminalIP": null,
                    "ReTerminalName": null,
                    "ReUserId": null,
                    "ReIdentify": null,
                    "GetProductDay": 1,
                    "GetEquipPro": 1,
                    "GetInsDescription": 1,
                    "GetRevisionInfo": 1
                });
                promise4.then(function(data) {
                    console.log(data)
                    $scope.Isolator_search = data
                }, function(err) {});

                $('#ResetOrNot').modal('show');
            }

            // 培养modal
            $scope.culture = function() {
                $('#culturemodal').modal('show');
                Result.GetResultTubes({
                    "TestId": null,
                    "TubeNo": null,
                    "CultureId": null,
                    "BacterId": null,
                    "OtherRea": null,
                    "IncubatorId": null,
                    "Place": null,
                    "StartTimeS": null,
                    "StartTimeE": null,
                    "EndTimeS": null,
                    "EndTimeE": null,
                    "AnalResult": null,
                    "PutoutTimeE": null,
                    "PutoutTimeS": null,
                    "PutinPeople": null,
                    "PutoutPeople": null,
                    "GetCultureId": 1,
                    "GetBacterId": 1,
                    "GetOtherRea": 1,
                    "GetIncubatorId": 1,
                    "GetStartTime": 1,
                    "GetEndTime": 1,
                    "GetAnalResult": 1
                }).then(function(data) {
                    for (i = 0; i < data.length; i++) {
                        tubeslist.push({
                            "TubeNo": data[i].TestId + data[i].TubeNo,
                            "TestId": data[i].TestId,
                            "CultureId": data[i].CultureId,
                            "BacterId": data[i].BacterId,
                            "OtherRea": data[i].OtherRea,
                            "IncubatorId": data[i].IncubatorId,
                            "StartTime": data[i].StartTime,
                            "EndTime": data[i].EndTime,
                            "AnalResult": data[i].AnalResult
                        })
                    }
                    $scope.tubes = tubeslist
                }, function(err) { console.log(err) })
            }

            $scope.showtubedetail = function(index) {
                for (i = 0; i < tubeslist.length; i++) {
                    if (tubeslist[i].TubeNo == $scope.tube.TubeNo) {
                        $scope.tempTube = tubeslist[i]
                    }
                }
            }


            //主界面--rzx
            // 获取当前日期
            var myDate = new Date();
            var formatDate = function(date) {
                var y = date.getFullYear();
                var m = date.getMonth() + 1;
                m = m < 10 ? '0' + m : m;
                var d = date.getDate();
                d = d < 10 ? ('0' + d) : d;
                var h = date.getHours();
                var mm = date.getMinutes();
                var s = date.getSeconds()
                return y + '-' + m + '-' + d + ' ' + h + ':' + mm + ':' + s;
            };
            var now = formatDate(myDate);
            //加工表
            var realInfo_1 = {
                "ReStatus": 0,
                "GetObjectNo": 1,
                "GetFormerStep": 1,
                "GetNowStep": 1,
                "GetLaterStep": 1,
                "GetObjectName": 1,
                "GetDescription": 1,
                "GetTestType": 1,
                "GetTestEquip": 1,
                "GetTestId": 1
            }
            var handling = function() {
                console.log('handling')
                Result.GetTestResultInfo(realInfo_1).then(function(data) {
                    // console.log(data)
                    $scope.handlingTable = new NgTableParams({
                        count: 50
                    }, {
                        counts: [],
                        dataset: data
                    })
                }, function(err) {})
                $scope.remove_tray = function() {
                    // 获取当前日期
                    var myDate = new Date();
                    Operation.OpEquipmentSetData({
                        "EquipmentId": 'Iso_Process',
                        "OperationTime": myDate,
                        "OperationCode": "OP018",
                        "OperationValue": "1",
                        "OperationResult": "",
                        "TerminalIP": Storage.get("cip"),
                        "TerminalName": Storage.get("cname"),
                        "revUserId": Storage.get("UID")
                    }).then(function(data) {
                            console.log(data)
                            if (data.result == "插入成功") {
                                // 提示成功
                                $('#removetray').modal('show')
                                $timeout(function() {
                                    $('#removetray').modal('hide')
                                }, 1000)
                            }

                        },function(e) {})
                }



            }
            // Result.GetBreakDowns(TestEquip).then(
            //     function(data) {
            //         console.log(data)
            //     },function(e) {});
            //加注表
            var realInfo_2 = {
                "ReStatus": 1,
                "GetObjectNo": 1,
                "GetFormerStep": 1,
                "GetNowStep": 1,
                "GetLaterStep": 1,
                "GetObjectName": 1,
                "GetDescription": 1,
                "GetTestType": 1,
                "GetTestEquip2": 1,
                "GetTestId": 1
            }
            var collect = function() {
                Result.GetTestResultInfo(realInfo_2).then(function(data) {
                    // console.log(data)
                    $scope.CollectTable = new NgTableParams({
                        count: 50
                    }, {
                        counts: [],
                        dataset: data
                    })
                }, function(err) {})
            }
            //培养表            
            var realInfo_3 = {
                "ReStatus": 2,
                "GetObjectNo": 1,
                "GetObjCompany": 1,
                "GetObjIncuSeq": 1,
                "GetTestType": 1,
                "GetTestStand": 1,
                "GetTestEquip": 1,
                "GetTestEquip2": 1,
                "GetDescription": 1,
                "GetProcessStart": 1,
                "GetProcessEnd": 1,
                "GetCollectStart": 1,
                "GetCollectEnd": 1,
                "GetTestTime": 1,
                "GetTestResult": 1,
                "GetTestPeople": 1,
                "GetTestPeople2": 1,
                "GetReStatus": 1,
                "GetRePeople": 1,
                "GetReTime": 1,
                "GetRevisionInfo": 1,
                "GetFormerStep": 1,
                "GetNowStep": 1,
                "GetLaterStep": 1
            }
            var incu = function() {
                var incuresult = new Array()
                var endtime = new Array()
                var ms = new Array()
                Result.GetTestResultInfo(realInfo_3).then(function(data) {
                    incuresult = data
                    console.log(data)
                    for (i = 0; i < data.length; i++) {
                        endtime[i] = new Date(data[i].EndTime)
                        ms[i] = endtime[i] - myDate
                        endtime[i] = formatDate(endtime[i]);
                        console.log(endtime[i] > now)
                        incuresult[i] = Object.assign(incuresult[i], { "Time": ms[i] }, { "now": now }, { "endtime": endtime[i] })
                    }
                    console.log(incuresult)
                    $scope.IncuTable = new NgTableParams({
                        count: 10
                    }, {
                        counts: [],
                        dataset: incuresult
                    })

                }, function(err) {})
            }
            //紧急停止
            $scope.breakpro = false
            $scope.breakcol = false
            document.getElementById("pro").setAttribute("disabled", false)
            document.getElementById("col").setAttribute("disabled", false)
            var breakInfo = {
                "BreakId": null,
                "BreakTimeS": null,
                "BreakTimeE": null,
                "BreakEquip": null,
                "BreakPara": null,
                "BreakValue": null,
                "BreakReason": null,
                "ResponseTimeS": 1,
                "ResponseTimeE": null,
                "GetBreakTime": 1,
                "GetBreakEquip": 1,
                "GetBreakPara": 1,
                "GetBreakValue": 1,
                "GetBreakReason": 1,
                "GetResponseTime": 1
            }
            var breakdowns = function() {
                Result.GetBreakDowns(breakInfo).then(function(data) {
                    console.log(data)
                    for (i = 0; i < data.length; i++) {
                        // console.log(data[i].BreakEquip)
                        if (data[i].BreakEquip == 'Iso_Process') {
                            $scope.breakpro = 1
                            document.getElementById("pro").removeAttribute("disabled")
                            if (data[i].BreakReason != undefined) {
                                $scope.unconpro = data[i].BreakReason
                            }
                        } else if (data[i].BreakEquip == 'Iso_Collect') {
                            $scope.breakcol = 1
                            document.getElementById("col").removeAttribute("disabled")
                            if (data[i].BreakReason != undefined) {
                                $scope.unconcol = data[i].BreakReason
                            }
                        }
                    }
                }, function(err) {})
            }
            $scope.setbreakData = function(equip) {
                console.log(equip)
                Operation.OpEquipmentSetData({
                    "EquipmentId": equip,
                    "OperationTime": now,
                    "OperationCode": "op30",
                    "OperationValue": "1",
                    "OperationResult": "",
                    "TerminalIP": Storage.get("cip"),
                    "TerminalName": Storage.get("cname"),
                    "revUserId": Storage.get("UID")
                }).then(function(data) {
                        console.log(data)
                        if (data.result == "插入成功") {
                            // 提示成功
                            $('#setbreak').modal('show')
                            $timeout(function() {
                                $('#setbreak').modal('hide')
                            }, 1000)
                            breakdowns()
                        }
                    },
                    function(e) {});
            }
            //实时监控--下拉选择 
            var instruments = new Array()
            $scope.instruments = instruments
            var IsolatorsQuery = {
                "GetProductDay": 0,
                "GetEquipPro": 0,
                "GetInsDescription": 0,
                "GetRevisionInfo": 0
            };
            var promise4 = ItemInfo.GetIsolatorsInfo(IsolatorsQuery);
            promise4.then(function(data) {
                for (i = 0; i < data.length; i++) {
                    $scope.instruments.push(data[i].IsolatorId)
                }
            }, function(err) {});
            var IncubatorsQuery = {
                "GetProductDay": 0,
                "GetEquipPro": 0,
                "GetInsDescription": 0,
                "GetRevisionInfo": 0
            };
            var promise5 = ItemInfo.GetIncubatorsInfo(IncubatorsQuery);
            promise5.then(function(data) {
                for (i = 0; i < data.length; i++) {
                    $scope.instruments.push(data[i].IncubatorId)
                }
            }, function(err) {});
            var IncEnv = new Array()
            var IsoColEnv = new Array()
            var IsoProEnv_1 = new Array()
            var IsoProEnv_2 = new Array()
            var IsoProEnv_3 = new Array()
            $scope.pro = true
            $scope.inc = false
            $scope.col = false
            //默认环境显示
            var ProcessEnv_1 = {
                "IsolatorId": "Iso_Process",
                "CabinId": 1
            }
            var ProcessEnv_2 = {
                "IsolatorId": "Iso_Process",
                "CabinId": 2
            }
            var ProcessEnv_3 = {
                "IsolatorId": "Iso_Process",
                "CabinId": 3
            }
            var realtime = function() {
                // console.log('realtime')
                ItemInfo.GetNewIsolatorEnv(ProcessEnv_1).then(function(data) {
                    IsoProEnv_1 = data
                    newEnv()
                }, function(err) {});
                ItemInfo.GetNewIsolatorEnv(ProcessEnv_2).then(function(data) {
                    IsoProEnv_2 = data
                    newEnv()
                }, function(err) {});
                ItemInfo.GetNewIsolatorEnv(ProcessEnv_3).then(function(data) {
                    IsoProEnv_3 = data
                    newEnv()
                }, function(err) {})
            }
            //选项环境刷新
            var CollectEnv = {
                "IsolatorId": 'Iso_Collect',
                "CabinId": 1
            }
            var IncubatorEnv = null
            var recollect = function() {
                // console.log('recollect')
                ItemInfo.GetNewIsolatorEnv(CollectEnv).then(function(data) {
                    IsoColEnv = data
                    newEnv()
                }, function(err) {})
            }
            var reincu = function(env) {
                // console.log('reincu')
                ItemInfo.GetNewIncubatorEnv(env).then(function(data) {
                    IncEnv = data
                    newEnv()
                }, function(err) {});
            }
            //仪器选择 
            var timer = $interval(function() {
                if ($scope.envins != undefined) {
                    $scope.selectInstrument()
                } else {
                    realtime()
                }
            }, 30000)
            $scope.selectInstrument = function() {
                // console.log($scope.envins)
                if ($scope.envins.indexOf("Iso_Collect") != -1) {
                    $scope.inc = false
                    $scope.pro = false
                    $scope.col = true
                    recollect()
                } else if ($scope.envins.indexOf("Incu_") != -1) {
                    IncubatorEnv = {
                        "IncubatorId": $scope.envins,
                    }
                    $scope.pro = false
                    $scope.inc = true
                    $scope.col = false
                    reincu(IncubatorEnv)
                } else {
                    $scope.pro = true
                    $scope.inc = false
                    $scope.col = false
                    realtime()
                }
                Result.GetBreakDowns({
                    "BreakId": null,
                    "BreakTimeS": null,
                    "BreakTimeE": null,
                    "BreakEquip": $scope.envins,
                    "BreakPara": null,
                    "BreakValue": null,
                    "BreakReason": "unconnected",
                    "ResponseTimeS": 1,
                    "ResponseTimeE": null,
                    "GetBreakTime": 1,
                    "GetBreakEquip": 1,
                    "GetBreakPara": 1,
                    "GetBreakValue": 1,
                    "GetBreakReason": 1,
                    "GetResponseTime": 1
                }).then(function(data) {
                    console.log(data[0])
                    if (data[0] == undefined) {
                        $scope.unconnected = 0
                    } else {
                        $scope.unconnected = 1
                    }
                }, function(err) {})
            }
            // if ($scope.inc == true) {
            //     reincu(IncubatorEnv)
            // } else if ($scope.col == true) {
            //     recollect()
            // } else {
            //     realtime()
            // }

            var newEnv = function() {
                $scope.isolator1 = {
                    env_names: ["进料区温度/℃", "进料区湿度", "进料区压力", "进料区过氧化氢浓度高", "进料区过氧化氢浓度低"],
                    env_codes: ["1", "2", "3", "4", "5"],
                    env_status: IsoProEnv_1,
                }
                $scope.isolator2 = {
                    env_names: ["加工区温度/℃", "加工区湿度", "加工区压力", "加工区过氧化氢浓度高", "加工区过氧化氢浓度低"],
                    env_codes: ["1", "2", "3", "4", "5"],
                    env_status: IsoProEnv_2,
                }
                $scope.isolator3 = {
                    env_names: ["出料区温度/℃", "出料区湿度", "出料区压力", "出料区过氧化氢浓度高", "出料区过氧化氢浓度低"],
                    env_codes: ["1", "2", "3", "4", "5"],
                    env_status: IsoProEnv_3,
                }
                $scope.isocollect = {
                    env_names: ["温度/℃", "湿度", "压力", "过氧化氢浓度高", "过氧化氢浓度低"],
                    env_codes: ["1", "2", "3", "4", "5"],
                    env_status: IsoColEnv,
                }
                $scope.incubator = {
                    env_names: ["培养箱温度1/℃", "培养箱温度2/℃", "培养箱温度3/℃"],
                    env_codes: ["1"],
                    env_status: IncEnv,
                }
            }
            //刷新
            handling()
            collect()
            incu()
            breakdowns()
            realtime()
            var cal_handling = $interval(handling, 30000)
            var cal_collect = $interval(collect, 30000)
            var cal_incu = $interval(incu, 30000)
            var cal_breakdowns = $interval(breakdowns, 30000)
            // var cal_realtime = $interval(realtime, 30000)
            // var cal_realtime = $interval(function() {
            //     realtime();
            // }, 30000)
            $scope.$on("$destroy", function() {
                $interval.cancel(cal_handling)
                $interval.cancel(cal_collect)
                $interval.cancel(cal_incu)
                $interval.cancel(cal_breakdowns)
                // $interval.cancel(cal_realtime)
                $interval.cancel(timer)
            })
            //视频
            var videoObject = {
                container: '#video', //“#”代表容器的ID，“.”或“”代表容器的class
                variable: 'player', //该属性必需设置，值等于下面的new chplayer()的对象
                autoplay: true, //自动播放
                live: true, //直播视频形式
                video: 'rtmp://121.43.107.106:1935/live/stream' //视频地址
            };
            var player = new ckplayer(videoObject);
            //添加任务
            $scope.creattask = function() {
                if ($scope.task1.Sample == undefined || $scope.task1.Reagent1 == undefined || $scope.task1.Reagent2 == undefined) {
                    $('#signupFail').modal('show')
                    $timeout(function() {
                        $('#signupFail').modal('hide')
                    }, 1000)
                } else {
                    var taskInfo_1 = {
                        "ObjectNo": $scope.task1.Sample.ObjectNo,
                        "ObjCompany": $scope.task1.Sample.ObjCompany,
                        "ObjIncuSeq": $scope.task1.Sample.ObjIncuSeq,
                        "Reagent1": $scope.task1.Reagent1.ReagentId,
                        "Reagent2": $scope.task1.Reagent2.ReagentId,
                        "ProcessStart": now,
                        "TestPeople": Storage.get('UID'),
                        "TerminalIP": Storage.get('cip'),
                        "TerminalName": Storage.get('cname'),
                        "revUserId": Storage.get("UID")
                    }
                    var updateInfo_1 = {
                        "ObjectNo": $scope.task1.Sample.ObjectNo,
                        "ObjCompany": $scope.task1.Sample.ObjCompany,
                        "NewObjIncuSeq": $scope.task1.Sample.ObjIncuSeq,
                        "SamplingPeople": Storage.get("UID"),
                        "SamplingTime": $scope.task1.Sample.SamplingTime,
                        "Status": "testing",
                        "TerminalIP": Storage.get('cip'),
                        "TerminalName": Storage.get('cname'),
                        "revUserId": Storage.get("UID"),
                    }
                    // console.log(updateInfo_1)
                    var task_1 = Result.CreateResult(taskInfo_1).then(function(data) {
                        // console.log(data.result)
                        if (data.result == "插入成功") {
                            ItemInfo.UpdateSampleInfo(updateInfo_1).then(function(data) {
                                console.log(data)
                            })
                            if ($scope.iflarge == false) {
                                $('#add_task').modal('hide')
                                // 提示成功
                                $('#tasksuccess').modal('show')
                                $timeout(function() {
                                    $('#tasksuccess').modal('hide')
                                }, 1000)
                                $interval(handling, 1000, 1)
                            }
                        }
                    }, function(err) {})
                }
                if ($scope.iflarge == true) {
                    if ($scope.task2.Sample == undefined || $scope.task2.Reagent1 == undefined || $scope.task2.Reagent2 == undefined || $scope.task3.Sample == undefined || $scope.task3.Reagent1 == undefined || $scope.task3.Reagent2 == undefined) {
                        $('#signupFail').modal('show')
                        $timeout(function() {
                            $('#signupFail').modal('hide')
                        }, 1000)
                    } else {
                        var taskInfo_2 = {
                            "ObjectNo": $scope.task2.Sample.ObjectNo,
                            "ObjCompany": $scope.task2.Sample.ObjCompany,
                            "ObjIncuSeq": $scope.task2.Sample.ObjIncuSeq,
                            "Reagent1": $scope.task2.Reagent1.ReagentId,
                            "Reagent2": $scope.task2.Reagent2.ReagentId,
                            "ProcessStart": now,
                            "TestPeople": Storage.get('UID'),
                            "TerminalIP": Storage.get('cip'),
                            "TerminalName": Storage.get('cname'),
                            "revUserId": Storage.get("UID")
                        }
                        var updateInfo_2 = {
                            "ObjectNo": $scope.task2.Sample.ObjectNo,
                            "ObjCompany": $scope.task2.Sample.ObjCompany,
                            "NewObjIncuSeq": $scope.task2.Sample.ObjIncuSeq,
                            "SamplingPeople": Storage.get("UID"),
                            "SamplingTime": $scope.task2.Sample.SamplingTime,
                            "Status": "testing",
                            "TerminalIP": Storage.get('cip'),
                            "TerminalName": Storage.get('cname'),
                            "revUserId": Storage.get("UID"),
                        }
                        var taskInfo_3 = {
                            "ObjectNo": $scope.task3.Sample.ObjectNo,
                            "ObjCompany": $scope.task3.Sample.ObjCompany,
                            "ObjIncuSeq": $scope.task3.Sample.ObjIncuSeq,
                            "Reagent1": $scope.task3.Reagent1.ReagentId,
                            "Reagent2": $scope.task3.Reagent2.ReagentId,
                            "ProcessStart": now,
                            "TestPeople": Storage.get('UID'),
                            "TerminalIP": Storage.get('cip'),
                            "TerminalName": Storage.get('cname'),
                            "revUserId": Storage.get("UID")
                        }
                        var updateInfo_3 = {
                            "ObjectNo": $scope.task3.Sample.ObjectNo,
                            "ObjCompany": $scope.task3.Sample.ObjCompany,
                            "NewObjIncuSeq": $scope.task3.Sample.ObjIncuSeq,
                            "SamplingPeople": Storage.get("UID"),
                            "SamplingTime": $scope.task3.Sample.SamplingTime,
                            "Status": "testing",
                            "TerminalIP": Storage.get('cip'),
                            "TerminalName": Storage.get('cname'),
                            "revUserId": Storage.get("UID"),
                        }
                        Result.CreateResult(taskInfo_2).then(function(data) {
                            console.log('2')
                            console.log(data)
                            if (data.result == "插入成功") {
                                ItemInfo.UpdateSampleInfo(updateInfo_2).then(function(data) {
                                    console.log(data)
                                })
                            }
                        }, function(err) {});
                        Result.CreateResult(taskInfo_3).then(function(data) {
                            console.log('3')
                            console.log(data)
                            if (data.result == "插入成功") {
                                ItemInfo.UpdateSampleInfo(updateInfo_3).then(function(data) {
                                    console.log(data)
                                })
                                $('#add_task').modal('hide')
                                // 提示成功
                                $('#tasksuccess').modal('show')
                                $timeout(function() {
                                    $('#tasksuccess').modal('hide')
                                }, 1000)
                                $interval(handling, 1000, 1)
                            }
                        }, function(err) {});
                    }
                }
            }
            var getflow = function(SampleType, NowStep) {
                console.log(SampleType)
                Operation.GetSampleFlow({ "SampleType": SampleType }).then(function(data) {
                    for (i = 0; i < data.length; i++) {
                        if (data[i].OrderId == NowStep) {
                            var j = i
                            data[i].status = 1
                        }
                    }
                    if (j != undefined) {
                        for (i = 0; i < j; i++) {
                            data[i].status = 0
                        }
                        for (i = j + 1; i < data.length; i++) {
                            data[i].status = 2
                        }
                    }
                    $scope.tabledetail_pro = new NgTableParams({
                        count: 10
                    }, {
                        counts: [],
                        dataset: data
                    })
                }, function(err) {})
            }

            var cal_pro = null
            $scope.detail_pro = function(SampleType, NowStep) {
                // console.log(NowStep)
                $('#detail_Pro').modal('show')
                getflow(SampleType, NowStep)
                cal_pro = $interval(function() {
                    getflow(SampleType, NowStep)
                }, 30000)
            }

            $scope.detail_col = function(SampleType, NowStep) {
                console.log(NowStep)
                var status_col = new Array()
                var promise = Operation.GetSampleFlow({ "SampleType": SampleType })
                promise.then(function(data) {
                    for (i = 0; i < data.length; i++) {
                        if (data[i].OrderId == NowStep) {
                            var j = i
                            data[i].status = 1
                        }
                    }
                    if (j != undefined) {
                        for (i = 0; i < j; i++) {
                            data[i].status = 0
                        }
                        for (i = j + 1; i < data.length; i++) {
                            data[i].status = 2
                        }
                    }
                    $scope.tabledetail_col = new NgTableParams({
                        count: 10
                    }, {
                        counts: [],
                        dataset: data
                    })
                }, function(err) {});
                $('#detail_Col').modal('show')
            }
            var cal_detailIncu = null
            var topanalysis = new Array()
            var selectIncs = new Array()
            $scope.selectIncs = selectIncs
            var getimages = function(topInfo, incInfo) {
                Result.GetTopAnalysis(topInfo).then(function(data) {
                    console.log(data)
                    for (i = 0; i < data.length; i++) {
                        topanalysis[i] = data[i].AnalResult
                    }
                    Result.GetTestPictures(incInfo).then(function(data) {
                        for (i = 0; i < data.length; i++) {
                            data[i].TopResult = topanalysis[i]
                        }
                        console.log(data)
                        $scope.pictureTable = new NgTableParams({
                            count: 3
                        }, {
                            counts: [],
                            dataset: data
                        })
                    }, function(err) {});
                }, function(err) {})
            }
            $scope.detail_inc = function(ObjectNo, ObjectName, TestId) {
                $scope.Number = ObjectNo
                $scope.Name = ObjectName
                $scope.Id = TestId
                var topInfo = {
                    "TestId": $scope.Id,
                    "TubeNo": null,
                    "PictureId": null,
                    "CameraTimeS": null,
                    "CameraTimeE": null,
                    "AnalResult": null,
                    "GetCameraTime": 1,
                    "GetAnalResult": 1
                }
                var incInfo = {
                    "TubeNo": 1,
                    "GetCameraTime": 1,
                    "GetImageAddress": 1,
                    "GetAnalResult": 1,
                    "TestId": $scope.Id
                }
                $('#detail_Inc').modal('show')
                Result.GetResultTubes({
                    "TestId": $scope.Id,
                    "TubeNo": null,
                    "CultureId": null,
                    "BacterId": null,
                    "OtherRea": null,
                    "IncubatorId": null,
                    "Place": null,
                    "StartTimeS": null,
                    "StartTimeE": null,
                    "EndTimeS": null,
                    "EndTimeE": null,
                    "AnalResult": null,
                    "PutoutTimeE": null,
                    "PutoutTimeS": null,
                    "PutinPeople": null,
                    "PutoutPeople": null,
                    "GetCultureId": 1,
                    "GetBacterId": 1,
                    "GetOtherRea": 1,
                    "GetIncubatorId": 1,
                    "GetStartTime": 1,
                    "GetEndTime": 1,
                    "GetAnalResult": 1
                }).then(function(data) {
                    console.log(data)
                    for (i = 0; i < data.length; i++) {
                        $scope.selectIncs[i] = data[i].TubeNo
                    }
                    // console.log(selectIncs)
                }, function(err) {})
                getimages(topInfo, incInfo)
                // cal_detailIncu = $interval(function() {
                //     getimages(topInfo, incInfo)
                // }, 30000)
            }
            //培养详情--下拉选择
            $scope.selectTubeNo = function(TubeNo) {
                var topInfo = {
                    "TestId": $scope.Id,
                    "TubeNo": $scope.TubeNo,
                    "PictureId": null,
                    "CameraTimeS": null,
                    "CameraTimeE": null,
                    "AnalResult": null,
                    "GetCameraTime": 1,
                    "GetAnalResult": 1
                }
                var incInfo = {
                    "TubeNo": $scope.TubeNo,
                    "GetCameraTime": 1,
                    "GetImageAddress": 1,
                    "GetAnalResult": 1,
                    "TestId": $scope.Id
                }
                getimages(topInfo, incInfo)
                cal_detailIncu = $interval(function() {
                    getimages(topInfo, incInfo)
                }, 30000)
            }
            $scope.setanalResult = function(index) {
                console.log(index)
                Result.GetResultTubes({
                    "TestId": index.TestId,
                    "TubeNo": index.TubeNo.replace(/[^0-9]/ig, ""),
                    "PutoutTimeE": null,
                    "PutoutTimeS": null,
                    "PutinPeople": null,
                    "PutoutPeople": null,
                    "GetCultureId": 1,
                    "GetBacterId": 1,
                    "GetOtherRea": 1,
                    "GetIncubatorId": 1,
                    "GetPlace": 1,
                    "GetStartTime": 1,
                    "GetEndTime": 1,
                    "GetAnalResult": 1

                }).then(function(data) {
                    Result.SetResIncubator({
                        "TestId": data[0].TestId,
                        "TubeNo": data[0].TubeNo,
                        "CultureId": data[0].CultureId,
                        "BacterId": data[0].BacterId,
                        "OtherRea": data[0].OtherRea,
                        "IncubatorId": data[0].IncubatorId,
                        "Place": data[0].Place,
                        "StartTime": data[0].StartTime,
                        "EndTime": data[0].EndTime,
                        "AnalResult": "有菌",
                        "PutoutPeople": Storage.get('UID'),
                        "PutoutTime": now
                    }).then(function(data) {
                        console.log(data)
                        if (data.result == "插入成功") {
                            // 提示成功
                            $('#setanalSuccess').modal('show')
                            $timeout(function() {
                                $('#setanalSuccess').modal('hide')
                            }, 1000)
                        }
                    }, function(err) {})
                }, function(e) {});

            }
            $scope.connected = function() {
                console.log($scope.instruments)
            }

            //实时监控
            $scope.status = "No Connection";

            SocketService.on('connect', function() {
                // console.log('Connected');
                $scope.status = "Connected"
            });

            SocketService.on('disconnect', function() {
                $scope.status = "No Connection"
            });

            // SocketService.on('message', function(data) {
            //     // console.log(data);
            //     $scope.status = "Connected";
            //     var myChart = echarts.init(document.getElementById('main'));
            //     myChart.showLoading();
            //     // 指定图表的配置项和数据
            //     var option = {
            //         title: {
            //             text: $scope.text
            //         },
            //         tooltip: {},
            //         legend: {
            //             data: ['params']
            //         },
            //         xAxis: {
            //             data: []
            //         },
            //         yAxis: {},
            //         series: [{
            //             name: '销量',
            //             type: 'line',
            //             data: data.data
            //         }]
            //     };

            //     // 使用刚指定的配置项和数据显示图表。
            //     myChart.setOption(option);
            //     myChart.hideLoading();
            // });




            // $scope.printcode = function(code, name) {
            //     // console.log(code);
            //     SocketService.emit('get params', code);
            //     $scope.text = name;
            // }

            var twoweekslater = new Date();
            twoweekslater.setDate(twoweekslater.getDate() + 14);

            // 取出培养-rh          




            // 选择培养箱的培养器列表change-rh
            // $scope.tubeselect = function(_incubator) {
            //     var _incubatorId = ''
            //     temptubeslist = []
            //     if ((_incubator == null) || (_incubator.IncubatorId == undefined) || (_incubator.IncubatorId == '')) {
            //         _incubatorId = null;
            //     } else {
            //         _incubatorId = _incubator.IncubatorId
            //     }
            //     Result.GetResultTubes({
            //         "TestId": null,
            //         "TubeNo": null,
            //         "CultureId": null,
            //         "BacterId": null,
            //         "OtherRea": null,
            //         "IncubatorId": _incubatorId,
            //         "Place": null,
            //         "StartTimeS": null,
            //         "StartTimeE": null,
            //         "EndTimeS": null,
            //         "EndTimeE": null,
            //         "AnalResult": null,
            //         "GetCultureId": 1,
            //         "GetBacterId": 1,
            //         "GetOtherRea": 1,
            //         "GetIncubatorId": 1,
            //         "GetPlace": 1,
            //         "GetStartTime": 1,
            //         "GetEndTime": 1,
            //         "GetAnalResult": 1
            //     }).then(function(data) {
            //         for (i = 0; i < data.length; i++) {
            //             if ((data[i].Place != 0) & (data[i].IncubatorId != 'Isolator') & (data[i].IncubatorId != '')) {
            //                 temptubeslist.push({
            //                     "TubeNo": data[i].TubeNo,
            //                     "TestId": data[i].TestId,
            //                     "CultureId": data[i].CultureId,
            //                     "BacterId": data[i].BacterId,
            //                     "OtherRea": data[i].OtherRea,
            //                     "IncubatorId": data[i].IncubatorId,
            //                     "Place": data[i].Place,
            //                     "StartTime": data[i].StartTime,
            //                     "EndTime": data[i].EndTime,
            //                     "AnalResult": data[i].AnalResult
            //                 })
            //             }
            //         }
            //         $scope.tubes = temptubeslist
            //         tubeslist = temptubeslist
            //     }, function(err) {})
            //     $scope.tempTube = {}
            // }






            // 取出培养modal的初始化
            $scope.takeoutmodal = function(tempTestId) {
                var tubeslist = new Array()
                var _temptubeslist = new Array()
                // 默认状态下培养器列表
                Result.GetResultTubes({
                    "TestId": tempTestId,
                    "TubeNo": null,
                    "CultureId": null,
                    "BacterId": null,
                    "OtherRea": null,
                    "IncubatorId": 'Incu',
                    "Place": null,
                    "StartTimeS": null,
                    "StartTimeE": null,
                    "EndTimeS": null,
                    "EndTimeE": null,
                    "AnalResult": null,
                    "PutoutTimeE": null,
                    "PutoutTimeS": null,
                    "PutinPeople": null,
                    "PutoutPeople": null,
                    "GetCultureId": 1,
                    "GetBacterId": 1,
                    "GetOtherRea": 1,
                    "GetIncubatorId": 1,
                    "GetPlace": 1,
                    "GetStartTime": 1,
                    "GetEndTime": 1,
                    "GetAnalResult": 1
                }).then(function(data) {
                    $scope.tubes = data
                    $scope.sumtotakeout = $scope.tubes.length
                }, function(err) {})
                $('#takeout').modal('show')
            }

            // 显示培养器具体信息-rh
            $scope.showtubedetail = function(TestIdindex, TubeNoindex) {
                // console.log(TestIdindex, TubeNoindex)
                if ((TestIdindex == null) || (TubeNoindex == null)) { $scope.tempTube = {} }
                for (i = 0; i < $scope.tubes.length; i++) {
                    if (($scope.tubes[i].TubeNo == TubeNoindex) && (($scope.tubes[i].TestId == TestIdindex))) {
                        $scope.tempTube = $scope.tubes[i]
                    }
                }
            }

            // 取出培养-rh
            $scope.totakeout = function(index) {

                Result.SetResIncubator({
                    "TestId": index.TestId,
                    "TubeNo": index.TubeNo.replace(/[^0-9]/ig, ""),
                    "CultureId": index.CultureId,
                    "BacterId": index.BacterId,
                    "OtherRea": index.OtherRea,
                    "IncubatorId": "",
                    "Place": index.Place,
                    "StartTime": index.StartTime,
                    "EndTime": index.EndTime,
                    "AnalResult": index.AnalResult,
                    "PutoutPeople": Storage.get('UID'),
                    "PutoutTime": now
                }).then(function(data) {
                    if (data.result == "插入成功") {
                        // console.log($scope.tubes)
                        for (i = 0; i < $scope.tubes.length; i++) {
                            if ((index.TestId == $scope.tubes[i].TestId) && (index.TubeNo == $scope.tubes[i].TubeNo)) {
                                console.log("yes", i)
                                $scope.tubes.splice(i, 1);
                                break;
                            }
                        }
                        $scope.sumtotakeout = $scope.sumtotakeout - 1
                        if ($scope.sumtotakeout == 0) {
                            // 一个查询
                            Result.GetTestResultInfo({
                                "TestId": index.TestId,
                                "GetObjectNo": 1,
                                "GetObjCompany": 1,
                                "GetObjIncuSeq": 1,
                                "GetTestType": 1,
                                "GetTestStand": 1,
                                "GetTestEquip": 1,
                                "GetTestEquip2": 1,
                                "GetDescription": 1,
                                "GetProcessStart": 1,
                                "GetProcessEnd": 1,
                                "GetCollectStart": 1,
                                "GetCollectEnd": 1,
                                "GetTestTime": 1,
                                "GetTestResult": 1,
                                "GetTestPeople": 1,
                                "GetTestPeople2": 1,
                                "GetReStatus": 1,
                                "GetRePeople": 1,
                                "GetReTime": 1,
                                "GetRevisionInfo": 1,
                                "GetFormerStep": 1,
                                "GetNowStep": 1,
                                "GetLaterStep": 1
                            }).then(function(result) {
                                var tempdata = {
                                    "TestId": result[0].TestId,
                                    "ObjectNo": result[0].ObjectNo,
                                    "ObjCompany": result[0].ObjCompany,
                                    "ObjIncuSeq": result[0].ObjIncuSeq,
                                    "TestType": result[0].TestType,
                                    "TestStand": result[0].TestStand,
                                    "TestEquip": result[0].TestEquip,
                                    "TestEquip2": result[0].TestEquip2,
                                    "Description": result[0].Description,
                                    "ProcessStart": result[0].ProcessStart,
                                    "ProcessEnd": result[0].ProcessEnd,
                                    "CollectStart": result[0].CollectStart,
                                    "CollectEnd": result[0].CollectEnd,
                                    "TestTime": result[0].TestTime,
                                    "TestResult": result[0].TestResult,
                                    "TestPeople": result[0].TestPeople,
                                    "TestPeople2": result[0].TestPeople2,
                                    "ReStatus": 3,
                                    "RePeople": result[0].RePeople,
                                    "ReTime": result[0].ReTime,
                                    "TerminalIP": result[0].TerminalIP,
                                    "TerminalName": result[0].TerminalName,
                                    "revUserId": result[0].revUserId,
                                    "FormerStep": result[0].FormerStep,
                                    "NowStep": result[0].NowStep,
                                    "LaterStep": result[0].LaterStep
                                }
                                console.log(tempdata)
                                // 一个状态修改
                                Result.ResultSetData(tempdata).then(function(data) {
                                    console.log(data)
                                    if (data.result == "插入成功") {
                                        $('#alltakeoutsuccess').modal('show')
                                        $timeout(function() {
                                            $('#alltakeoutsuccess').modal('hide')
                                            $('#takeout').modal('hide')
                                        }, 1000)
                                        window.location.reload();
                                    }
                                }, function(err) {})
                            }, function(err) {})


                        }
                        // 提示成功
                        $('#takeoutsuccess').modal('show')
                        $timeout(function() {
                            $('#takeoutsuccess').modal('hide')
                        }, 1000)
                    }
                }, function(err) {})
            }

            // 放入培养-rh
            var finalplace = ""
            $scope.putinmodal = function(tempTestId) {
                // 放入培养modal的初始化-rh
                var putintubeslist = new Array()

                var _putintemptubeslist = new Array()
                console.log(tempTestId)
                //培养箱列表
                ItemInfo.GetIncubatorsInfo({
                    "IncubatorId": null,
                    "ProductDayS": null,
                    "ProductDayE": null,
                    "EquipPro": null,
                    "InsDescription": null,
                    "ReDateTimeS": null,
                    "ReDateTimeE": null,
                    "ReTerminalIP": null,
                    "ReTerminalName": null,
                    "ReUserId": null,
                    "ReIdentify": null,
                    "GetProductDay": 1,
                    "GetEquipPro": 1,
                    "GetInsDescription": 1,
                    "GetRevisionInfo": 1
                }).then(function(data) {
                    $scope.putinIncubators = data;
                }, function(err) {});

                //培养器列表
                Result.GetResultTubes({
                    "TestId": tempTestId,
                    "TubeNo": null,
                    "CultureId": null,
                    "BacterId": null,
                    "OtherRea": null,
                    "IncubatorId": null,
                    "Place": "ready_to_putin",
                    "StartTimeS": null,
                    "StartTimeE": null,
                    "EndTimeS": null,
                    "EndTimeE": null,
                    "AnalResult": null,
                    "PutoutTimeE": null,
                    "PutoutTimeS": null,
                    "PutinPeople": null,
                    "PutoutPeople": null,
                    "GetCultureId": 1,
                    "GetBacterId": 1,
                    "GetOtherRea": 1,
                    "GetIncubatorId": 1,
                    "GetPlace": 1,
                    "GetStartTime": 1,
                    "GetEndTime": 1,
                    "GetAnalResult": 1
                }).then(function(data) {
                    console.log(data)
                    $scope.sumtoputin = data.length
                    for (i = 0; i < data.length; i++) {
                        _putintemptubeslist.push({
                            "TubeNo": data[i].TubeNo,
                            "TestId": data[i].TestId,
                            "CultureId": data[i].CultureId,
                            "BacterId": data[i].BacterId,
                            "OtherRea": data[i].OtherRea,
                            "IncubatorId": data[i].IncubatorId,
                            "Place": data[i].Place,
                            "StartTime": data[i].StartTime,
                            "EndTime": data[i].EndTime,
                            "AnalResult": data[i].AnalResult
                        })

                    }
                    console.log(_putintemptubeslist)
                    $scope.putintubes = _putintemptubeslist
                    putintubeslist = _putintemptubeslist
                }, function(err) {})


                // 培养箱位置-轮层列表
                $scope.putinclasses = [
                    { id: 'Upper_In_', name: '上轮内层' },
                    { id: 'Upper_out_', name: '上轮外层' },
                    { id: 'Lower_In_', name: '下轮内层' },
                    { id: 'Lower_out_', name: '下轮外层' }
                ]

                // 培养箱位置-编号列表
                $scope.toputinclass = function(index) {
                    finalplacenow = ''
                    finalplace = index
                    $scope.numbers = []
                    if (finalplace != undefined) {
                        if (finalplace.indexOf("In") != -1) {
                            for (i = 1; i <= 15; i++) {
                                $scope.numbers.push(i)
                            }
                        } else if (finalplace.indexOf("out") != -1) {
                            for (i = 1; i <= 28; i++) {
                                $scope.numbers.push(i)
                            }
                        }
                    }
                    Array.prototype.indexOf = function(val) {
                        for (var i = 0; i < this.length; i++) {
                            if (this[i] == val) return i;
                        }
                        return -1;
                    };
                    Array.prototype.remove = function(val) {
                        var index = this.indexOf(val);
                        if (index > -1) {
                            this.splice(index, 1);
                        }
                    };
                    Result.GetResultTubes({
                        "TestId": null,
                        "TubeNo": null,
                        "CultureId": null,
                        "BacterId": null,
                        "OtherRea": null,
                        "IncubatorId": $scope.putincultureinfo.IncubatorId.IncubatorId,
                        "Place": null,
                        "StartTimeS": null,
                        "StartTimeE": null,
                        "EndTimeS": null,
                        "EndTimeE": null,
                        "AnalResult": null,
                        "PutoutTimeE": null,
                        "PutoutTimeS": null,
                        "PutinPeople": null,
                        "PutoutPeople": null,
                        "GetCultureId": 1,
                        "GetBacterId": 1,
                        "GetOtherRea": 1,
                        "GetIncubatorId": 1,
                        "GetPlace": 1,
                        "GetStartTime": 1,
                        "GetEndTime": 1,
                        "GetAnalResult": 1
                    }).then(function(data) {
                        for (i = 0; i < data.length; i++) {
                            if ((data[i].Place.replace(/[0-9]/ig, "")) == index) {
                                $scope.numbers.remove(data[i].Place.replace(/[a-zA-Z_]/ig, ""));
                            }
                        }
                    }, function(err) {})
                }
                $('#putin').modal('show')
            }


            // 显示培养器具体信息-rh
            $scope.putinshowtubedetail = function(TestIdindex, TubeNoindex) {

                if ((TestIdindex == null) || (TubeNoindex == null)) { $scope.putintempTube = {} }
                for (i = 0; i < $scope.putintubes.length; i++) {
                    if (($scope.putintubes[i].TubeNo == TubeNoindex) && (($scope.putintubes[i].TestId == TestIdindex))) {
                        $scope.putintempTube = $scope.putintubes[i]
                    }
                }
            }

            // 确认放入培养
            $scope.toputin = function(index) {
                if (($scope.putinPlaceNo == undefined) || ($scope.putinclass == undefined) || ($scope.putincultureinfo == undefined) || ($scope.putintube == undefined)) {
                    $('#checkfull').modal('show')
                    $timeout(function() {
                        $('#checkfull').modal('hide')
                    }, 1000)
                } else if (finalplace.indexOf("In") != -1) {
                    if (((parseInt($scope.putinPlaceNo) > 15) || (parseInt($scope.putinPlaceNo) < 1))) {
                        $('#checkNo').modal('show')
                        $timeout(function() {
                            $('#checkNo').modal('hide')
                        }, 1000)
                    }
                } else if (finalplace.indexOf("out") != -1) {
                    if (((parseInt($scope.putinPlaceNo) > 28) || (parseInt($scope.putinPlaceNo) < 1))) {
                        $('#checkNo').modal('show')
                        $timeout(function() {
                            $('#checkNo').modal('hide')
                        }, 1000)
                    }
                }


                Result.SetResIncubator({
                    "TestId": index.TestId,
                    "TubeNo": index.TubeNo.replace(/[^0-9]/ig, ""),
                    "CultureId": index.CultureId,
                    "BacterId": index.BacterId,
                    "OtherRea": index.OtherRea,
                    "IncubatorId": $scope.putincultureinfo.IncubatorId.IncubatorId,
                    "Place": finalplace + $scope.putinPlaceNo,
                    "StartTime": now,
                    "EndTime": twoweekslater,
                    "AnalResult": index.AnalResult,
                    "PutinPeople": Storage.get('UID'),
                }).then(function(data) {
                        if (data.result == "插入成功") {
                            console.log($scope.putintubes)
                            for (i = 0; i < $scope.putintubes.length; i++) {
                                if ((index.TestId == $scope.putintubes[i].TestId) && (index.TubeNo == $scope.putintubes[i].TubeNo)) {
                                    $scope.putintubes.splice(i, 1);
                                    break;
                                }
                            }
                            $scope.numbers = []
                            if (finalplace != undefined) {
                                if (finalplace.indexOf("In") != -1) {
                                    for (i = 1; i <= 15; i++) {
                                        $scope.numbers.push(i)
                                    }
                                } else if (finalplace.indexOf("out") != -1) {
                                    for (i = 1; i <= 28; i++) {
                                        $scope.numbers.push(i)
                                    }
                                }
                            }
                            Array.prototype.indexOf = function(val) {
                                for (var i = 0; i < this.length; i++) {
                                    if (this[i] == val) return i;
                                }
                                return -1;
                            };
                            Array.prototype.remove = function(val) {
                                var index = this.indexOf(val);
                                if (index > -1) {
                                    this.splice(index, 1);
                                }
                            };
                            Result.GetResultTubes({
                                "TestId": null,
                                "TubeNo": null,
                                "CultureId": null,
                                "BacterId": null,
                                "OtherRea": null,
                                "IncubatorId": $scope.putincultureinfo.IncubatorId.IncubatorId,
                                "Place": null,
                                "StartTimeS": null,
                                "StartTimeE": null,
                                "EndTimeS": null,
                                "EndTimeE": null,
                                "AnalResult": null,
                                "PutoutTimeE": null,
                                "PutoutTimeS": null,
                                "PutinPeople": null,
                                "PutoutPeople": null,
                                "GetCultureId": 1,
                                "GetBacterId": 1,
                                "GetOtherRea": 1,
                                "GetIncubatorId": 1,
                                "GetPlace": 1,
                                "GetStartTime": 1,
                                "GetEndTime": 1,
                                "GetAnalResult": 1
                            }).then(function(data) {
                                for (i = 0; i < data.length; i++) {
                                    if ((data[i].Place.replace(/[0-9]/ig, "")) == index) {
                                        $scope.numbers.remove(data[i].Place.replace(/[a-zA-Z_]/ig, ""));
                                    }
                                }
                            }, function(err) {})
                        }
                        $scope.sumtoputin = $scope.sumtoputin - 1
                        if ($scope.sumtoputin == 0) {
                            $('#allputinsuccess').modal('show')
                            $timeout(function() {
                                $('#allputinsuccess').modal('hide')
                            }, 1000)

                            $('#putin').modal('hide')
                            window.location.reload();
                        }
                        // 提示成功
                        $('#putinsuccess').modal('show')
                        $timeout(function() {
                            $('#putinsuccess').modal('hide')
                        }, 1000)

                    },
                    function(err) {})
            }


            // 阳性菌加注-茹画
            $scope.posibacInjection = function() {
                $('#new_posibacInjection').modal('show');

                // 菌液列表
                ItemInfo.GetReagentsInfo({
                    "ReagentId": null,
                    "ReagentSource": null,
                    "ReagentName": "菌",
                    "ReDateTimeS": null,
                    "ReDateTimeE": null,
                    "ReTerminalIP": null,
                    "ReTerminalName": null,
                    "ReUserId": null,
                    "ReIdentify": null,
                    "GetReagentSource": 1,
                    "GetReagentName": 1,
                    "GetRevisionInfo": 1
                }).then(
                    function(data) {
                        $scope.Reagent_search = data
                    },
                    function(e) {});


                // 任务列表
                Result.GetTestResultInfo({
                    "TestId": null,
                    "ObjectNo": null,
                    "ObjCompany": null,
                    "ObjIncuSeq": null,
                    "TestType": null,
                    "TestStand": null,
                    "TestEquip": null,
                    "TestEquip2": null,
                    "Description": null,
                    "ProcessStartS": null,
                    "ProcessStartE": null,
                    "ProcessEndS": null,
                    "ProcessEndE": null,
                    "CollectStartS": null,
                    "CollectStartE": null,
                    "CollectEndS": null,
                    "CollectEndE": null,
                    "TestTimeS": null,
                    "TestTimeE": null,
                    "TestResult": null,
                    "TestPeople": null,
                    "TestPeople2": null,
                    "ReStatus": 1,
                    "RePeople": null,
                    "ReTimeS": null,
                    "ReTimeE": null,
                    "ReDateTimeS": null,
                    "ReDateTimeE": null,
                    "ReTerminalIP": null,
                    "ReTerminalName": null,
                    "ReUserId": null,
                    "ReIdentify": null,
                    "FormerStep": null,
                    "NowStep": null,
                    "LaterStep": null,
                    "GetObjectNo": 1,
                    "GetObjCompany": 1,
                    "GetObjIncuSeq": 1,
                    "GetTestType": 1,
                    "GetTestStand": 1,
                    "GetTestEquip": 1,
                    "GetTestEquip2": 1,
                    "GetDescription": 1,
                    "GetProcessStart": 1,
                    "GetProcessEnd": 1,
                    "GetCollectStart": 1,
                    "GetCollectEnd": 1,
                    "GetTestTime": 1,
                    "GetTestResult": 1,
                    "GetTestPeople": 1,
                    "GetTestPeople2": 1,
                    "GetReStatus": 1,
                    "GetRePeople": 1,
                    "GetReTime": 1,
                    "GetRevisionInfo": 1,
                    "GetFormerStep": 1,
                    "GetNowStep": 1,
                    "GetLaterStep": 1
                }).then(
                    function(data) {
                        $scope.Result_search = data
                    },
                    function(e) {});
            }
            $scope.setposibacInjection = function() {
                var result1 = new Array()
                var result2 = new Array()
                var result3 = new Array()

                var tube1 = new Array()
                var tube2 = new Array()
                var tube3 = new Array()

                // console.log($scope.registerInfo.TestId1)
                // console.log($scope.registerInfo.TestId2)
                // console.log($scope.registerInfo.TestId3)
                console.log($scope.registerInfo.ReagentId)
                Result.GetTestResultInfo({
                    "TestId": $scope.registerInfo.TestId1,
                    "GetObjectNo": 1,
                    "GetObjCompany": 1,
                    "GetObjIncuSeq": 1,
                    "GetTestType": 1,
                    "GetTestStand": 1,
                    "GetTestEquip": 1,
                    "GetTestEquip2": 1,
                    "GetDescription": 1,
                    "GetProcessStart": 1,
                    "GetProcessEnd": 1,
                    "GetCollectStart": 1,
                    "GetCollectEnd": 1,
                    "GetTestTime": 1,
                    "GetTestResult": 1,
                    "GetTestPeople": 1,
                    "GetTestPeople2": 1,
                    "GetReStatus": 1,
                    "GetRePeople": 1,
                    "GetReTime": 1,
                    "GetRevisionInfo": 1,
                    "GetFormerStep": 1,
                    "GetNowStep": 1,
                    "GetLaterStep": 1
                }).then(
                    function(data) {
                        // console.log(data)
                        result1 = data
                        result1[0].NowStep = "正在加注中"
                        result1[0].CollectStart = now
                        result1[0].TestEquip2 = "Iso_Collect"
                        result1[0].TestPeople2 = Storage.get('UID')
                        console.log(result1)
                        Result.ResultSetData(result1[0]).then(
                            function(data) {
                                console.log(data)
                            },
                            function(e) {});
                    },
                    function(e) {});
                Result.GetTestResultInfo({
                    "TestId": $scope.registerInfo.TestId2,
                    "GetObjectNo": 1,
                    "GetObjCompany": 1,
                    "GetObjIncuSeq": 1,
                    "GetTestType": 1,
                    "GetTestStand": 1,
                    "GetTestEquip": 1,
                    "GetTestEquip2": 1,
                    "GetDescription": 1,
                    "GetProcessStart": 1,
                    "GetProcessEnd": 1,
                    "GetCollectStart": 1,
                    "GetCollectEnd": 1,
                    "GetTestTime": 1,
                    "GetTestResult": 1,
                    "GetTestPeople": 1,
                    "GetTestPeople2": 1,
                    "GetReStatus": 1,
                    "GetRePeople": 1,
                    "GetReTime": 1,
                    "GetRevisionInfo": 1,
                    "GetFormerStep": 1,
                    "GetNowStep": 1,
                    "GetLaterStep": 1
                }).then(
                    function(data) {
                        result2 = data
                        result2[0].NowStep = "正在加注中"
                        result2[0].CollectStart = now
                        result2[0].TestEquip2 = "Iso_Collect"
                        result2[0].TestPeople2 = Storage.get('UID')
                        Result.ResultSetData(result2[0]).then(
                            function(data) {
                                console.log(data)
                                if (data.result == "插入成功") {
                                    $('#new_posibacInjection').modal('hide')
                                    $('#tasksuccess').modal('show')
                                    $timeout(function() {
                                        $('#tasksuccess').modal('hide')
                                    }, 1000)
                                }
                            },
                            function(e) {});
                    },
                    function(e) {});
                Result.GetTestResultInfo({
                    "TestId": $scope.registerInfo.TestId3,
                    "GetObjectNo": 1,
                    "GetObjCompany": 1,
                    "GetObjIncuSeq": 1,
                    "GetTestType": 1,
                    "GetTestStand": 1,
                    "GetTestEquip": 1,
                    "GetTestEquip2": 1,
                    "GetDescription": 1,
                    "GetProcessStart": 1,
                    "GetProcessEnd": 1,
                    "GetCollectStart": 1,
                    "GetCollectEnd": 1,
                    "GetTestTime": 1,
                    "GetTestResult": 1,
                    "GetTestPeople": 1,
                    "GetTestPeople2": 1,
                    "GetReStatus": 1,
                    "GetRePeople": 1,
                    "GetReTime": 1,
                    "GetRevisionInfo": 1,
                    "GetFormerStep": 1,
                    "GetNowStep": 1,
                    "GetLaterStep": 1
                }).then(
                    function(data) {
                        result3 = data
                        result3[0].NowStep = "正在加注中"
                        result3[0].CollectStart = now
                        result3[0].TestEquip3 = "Iso_Collect"
                        result3[0].TestPeople3 = Storage.get('UID')
                        Result.ResultSetData(result2[0]).then(
                            function(data) {
                                console.log(data)
                                if (data.result == "插入成功") {
                                    $('#new_posibacInjection').modal('hide')
                                    $('#tasksuccess').modal('show')
                                    $timeout(function() {
                                        $('#tasksuccess').modal('hide')
                                    }, 1000)
                                }
                            },
                            function(e) {});
                    },
                    function(e) {});
                Result.GetResultTubes({
                    "TestId": $scope.registerInfo.TestId1,
                    "TubeNo": null,
                    "PutoutTimeE": null,
                    "PutoutTimeS": null,
                    "PutinPeople": null,
                    "PutoutPeople": null,
                    "GetCultureId": 1,
                    "GetBacterId": 1,
                    "GetOtherRea": 1,
                    "GetIncubatorId": 1,
                    "GetPlace": 1,
                    "GetStartTime": 1,
                    "GetEndTime": 1,
                    "GetAnalResult": 1
                }).then(function(data) {
                    console.log(data)
                    tube1 = data
                    tube1[4].BacterId = $scope.registerInfo.ReagentId
                    tube1[5].BacterId = $scope.registerInfo.ReagentId
                    Result.SetResIncubator(tube1[4]).then(
                        function(data) {
                            console.log(data)
                        },
                        function(e) {});
                    Result.SetResIncubator(tube1[5]).then(
                        function(data) {
                            console.log(data)
                        },
                        function(e) {});
                }, function(err) { console.log(err) })
                Result.GetResultTubes({
                    "TestId": $scope.registerInfo.TestId2,
                    "TubeNo": null,
                    "PutoutTimeE": null,
                    "PutoutTimeS": null,
                    "PutinPeople": null,
                    "PutoutPeople": null,
                    "GetCultureId": 1,
                    "GetBacterId": 1,
                    "GetOtherRea": 1,
                    "GetIncubatorId": 1,
                    "GetPlace": 1,
                    "GetStartTime": 1,
                    "GetEndTime": 1,
                    "GetAnalResult": 1
                }).then(function(data) {
                    console.log(data)
                    tube2 = data
                    tube2[4].BacterId = $scope.registerInfo.ReagentId
                    tube2[5].BacterId = $scope.registerInfo.ReagentId
                    Result.SetResIncubator(tube2[4]).then(
                        function(data) {
                            console.log(data)
                        },
                        function(e) {});
                    Result.SetResIncubator(tube2[5]).then(
                        function(data) {
                            console.log(data)
                        },
                        function(e) {});
                }, function(err) { console.log(err) })
                Result.GetResultTubes({
                    "TestId": $scope.registerInfo.TestId3,
                    "TubeNo": null,
                    "PutoutTimeE": null,
                    "PutoutTimeS": null,
                    "PutinPeople": null,
                    "PutoutPeople": null,
                    "GetCultureId": 1,
                    "GetBacterId": 1,
                    "GetOtherRea": 1,
                    "GetIncubatorId": 1,
                    "GetPlace": 1,
                    "GetStartTime": 1,
                    "GetEndTime": 1,
                    "GetAnalResult": 1
                }).then(function(data) {
                    console.log(data)
                    tube3 = data
                    tube3[4].BacterId = $scope.registerInfo.ReagentId
                    tube3[5].BacterId = $scope.registerInfo.ReagentId
                    Result.SetResIncubator(tube3[4]).then(
                        function(data) {
                            console.log(data)
                        },
                        function(e) {});
                    Result.SetResIncubator(tube3[5]).then(
                        function(data) {
                            console.log(data)
                        },
                        function(e) {});
                }, function(err) { console.log(err) })
            }


            // 隔离器复位 - 茹画
            $scope.reset = function(_IsolatorId) {
                // 获取当前日期
                var myDate = new Date();
                $scope.myDate = myDate
                Operation.OpEquipmentSetData({
                    "EquipmentId": _IsolatorId,
                    "OperationTime": myDate,
                    "OperationCode": "R0",
                    "OperationValue": "R0",
                    "OperationResult": "R0",
                    "TerminalIP": Storage.get("cip"),
                    "TerminalName": Storage.get("cname"),
                    "revUserId": Storage.get("UID")
                }).then(
                    function(data) {
                        if (data.result == "插入成功") {
                            $('#ResetOrNot').modal('hide')

                            // 提示成功
                            $('#resetsuccess').modal('show')
                            $timeout(function() {
                                $('#resetsuccess').modal('hide')
                            }, 1000)
                        }

                    },
                    function(e) {});
            }

        }
    ])


    // 数据管理
    .controller('dataCtrl', ['$scope', '$state', 'Storage', function($scope, $state, Storage) {
        Storage.set('Tab', 0)
        $scope.tosampling = function() {
            $state.go('main.data.sampling')
        }
        $scope.totestResult = function() {
            $state.go('main.data.testResult')
        }
        $scope.toreagent = function() {
            $state.go('main.data.reagent')
        }
        $scope.toinstrument = function() {
            $state.go('main.data.instrument')
        }
    }])

    // 数据管理--样品信息表--张桠童
    .controller('samplingCtrl', ['$scope', 'CONFIG', 'Storage', 'Data', 'ItemInfo', 'NgTableParams', '$state', 'extraInfo',
        function($scope, CONFIG, Storage, Data, ItemInfo, NgTableParams, $state, extraInfo) {
            //     console.log(Storage.get('pageflag'))
            // if (Storage.get('pageflag')==1){
            //     console.log(1)
            //     window.location.reload(); 
            //     Storage.set('pageflag',2)
            // }
            var sampleQuery = {
                "ObjectNo": null,
                "ObjCompany": null,
                "ObjIncuSeq": null,
                "ObjectName": null,
                "ObjectType": null,
                "SamplingPeople": null,
                "SamplingTimeS": null,
                "SamplingTimeE": null,
                "SamplingWay": null,
                "SamplingTool": null,
                "SamAmount": null,
                "DevideWay": null,
                "SamContain": null,
                "Warning": null,
                "SamSave": null,
                "ReDateTimeS": null,
                "ReDateTimeE": null,
                "ReTerminalIP": null,
                "ReTerminalName": null,
                "ReUserId": null,
                "ReIdentify": null,
                "GetObjectName": 1,
                "GetObjectType": 1,
                "GetSamplingPeople": 1,
                "GetSamplingTime": 1,
                "GetSamplingWay": 1,
                "GetSamplingTool": 1,
                "GetSamAmount": 1,
                "GetDevideWay": 1,
                "GetSamContain": 1,
                "GetStatus": 1,
                "GetWarning": 1,
                "GetSamSave": 1,
                "GetRevisionInfo": 1
            };
            var promise = ItemInfo.GetSamplesInfo(sampleQuery);
            promise.then(function(data) {
                var sampleInfo = data;
                console.log(sampleInfo);
                $scope.tableParams = new NgTableParams({
                    count: 10
                }, {
                    counts: [],
                    dataset: sampleInfo
                });
            }, function(err) {});
            $scope.toTestResult = function(ObjectNo, ObjCompany, ObjIncuSeq) {
                $state.go('main.data.testResult');
                Storage.set('ObjectNo', ObjectNo);
                Storage.set('ObjCompany', ObjCompany);
                Storage.set('ObjIncuSeq', ObjIncuSeq);
            };
        }
    ])
    // 数据管理--检测结果表--张桠童
    .controller('testResultCtrl', ['$scope', 'CONFIG', 'Storage', 'Data', 'Result', 'NgTableParams', '$timeout', '$state',
        function($scope, CONFIG, Storage, Data, Result, NgTableParams, $timeout, $state) {
            // console.log(Storage.get('ObjectNo'));
            var testResultQuery = {
                "TestId": null,
                "ObjectNo": null,
                "ObjCompany": null,
                "ObjIncuSeq": null,
                "TestType": null,
                "TestStand": null,
                "TestEquip": null,
                "Description": null,
                "CollectStartS": null,
                "CollectStartE": null,
                "CollectEndS": null,
                "CollectEndE": null,
                "TestTimeS": null,
                "TestTimeE": null,
                "TestResult": null,
                "TestPeople": null,
                "ReStatus": null,
                "RePeople": null,
                "ReTimeS": null,
                "ReTimeE": null,
                "ReDateTimeS": null,
                "ReDateTimeE": null,
                "ReTerminalIP": null,
                "ReTerminalName": null,
                "ReUserId": null,
                "ReIdentify": null,
                "GetObjectNo": 1,
                "GetObjCompany": 1,
                "GetObjIncuSeq": 1,
                "GetTestType": 1,
                "GetTestStand": 1,
                "GetTestEquip": 1,
                "GetDescription": 1,
                "GetCollectStart": 1,
                "GetCollectEnd": 1,
                "GetTestTime": 1,
                "GetTestResult": 1,
                "GetTestPeople": 1,
                "GetTestPeople2": 1,
                "GetReStatus": 1,
                "GetRePeople": 1,
                "GetReTime": 1,
                "GetRevisionInfo": 1
            };
            if (Storage.get('ObjectNo') == null) {
                var promise = Result.GetTestResultInfo(testResultQuery);
                promise.then(function(data) {
                    var testResult = data;
                    // console.log(testResult);
                    $scope.tableParams = new NgTableParams({
                        count: 10,
                    }, {
                        counts: [],
                        dataset: testResult
                    });
                }, function(err) {});
            } else {
                var promise = Result.GetTestResultInfo(testResultQuery);
                promise.then(function(data) {
                    var testResult = data;
                    // console.log(testResult);
                    $scope.tableParams = new NgTableParams({
                        count: 10,
                        filter: {
                            ObjectNo: Storage.get('ObjectNo'),
                            ObjCompany: Storage.get('ObjCompany'),
                            ObjIncuSeq: Storage.get('ObjIncuSeq')
                        },
                        sorting: { CollectStart: "desc" }
                        // 升序："asc"；降序："desc"
                    }, {
                        counts: [],
                        dataset: testResult
                    });
                    $timeout(function() {
                        // console.log($scope.tableParams.data.length);
                        if ($scope.tableParams.data.length > 0 && $scope.tableParams.data[0].TestResult == null) {
                            $('#myModal').modal('show');
                        };
                    });
                }, function(err) {});

                $scope.toMonitors = function() {
                    $('#myModal').modal('hide').on('hidden.bs.modal', function() {
                        $state.go('main.monitors');
                    });
                };
            }

            $scope.todetail = function(tempID) {
                testResultQuery.TestId = tempID
                testResultQuery.GetTestEquip2 = 1
                testResultQuery.GetProcessStart = 1
                testResultQuery.GetProcessEnd = 1
                testResultQuery.GetCollectStart = 1
                testResultQuery.GetCollectEnd = 1
                testResultQuery.GetTestTime = 1
                testResultQuery.GetTestResult = 1
                testResultQuery.GetTestPeople = 1
                testResultQuery.GetTestPeople2 = 1
                testResultQuery.GetReStatus = 1
                testResultQuery.GetRePeople = 1
                testResultQuery.GetRevisionInfo = 1
                testResultQuery.GetFormerStep = 1
                testResultQuery.GetNowStep = 1
                testResultQuery.GetLaterStep = 1
                console.log(testResultQuery)
                var promise = Result.GetTestResultInfo(testResultQuery);
                promise.then(function(data) {
                    console.log(data)
                    $scope.userInfo = data[0];
                    $('#detailObject').modal('show')

                }, function(err) {});
                // console.log(tempID)

            }
            // 关闭modal控制
            $scope.modal_close = function(target) {
                $(target).modal('hide')
                $scope.TubeNo = 1
            }

            var selectIncs = new Array()
            var topanalysis = new Array()
            $scope.selectIncs = selectIncs
            var getimages = function(topInfo, incInfo) {
                Result.GetTopAnalysis(topInfo).then(function(data) {
                    console.log(data)
                    for (i = 0; i < data.length; i++) {
                        topanalysis[i] = data[i].AnalResult
                    }
                    Result.GetTestPictures(incInfo).then(function(data) {
                        for (i = 0; i < data.length; i++) {
                            data[i].TopResult = topanalysis[i]
                        }
                        console.log(data)
                        $scope.pictureTable = new NgTableParams({
                            count: 3
                        }, {
                            counts: [],
                            dataset: data
                        })
                    }, function(err) {});
                }, function(err) {})
            }
            //培养详情--下拉选择
            $scope.selectTubeNo = function(TubeNo) {
                var topInfo = {
                    "TestId": $scope.Id,
                    "TubeNo": $scope.TubeNo,
                    "PictureId": null,
                    "CameraTimeS": null,
                    "CameraTimeE": null,
                    "AnalResult": null,
                    "GetCameraTime": 1,
                    "GetAnalResult": 1
                }
                var incInfo = {
                    "TubeNo": $scope.TubeNo,
                    "GetCameraTime": 1,
                    "GetImageAddress": 1,
                    "GetAnalResult": 1,
                    "TestId": $scope.Id
                }
                getimages(topInfo, incInfo)
            }
            $scope.vision = function(ObjectNo, ObjectName, TestId) {
                $scope.Number = ObjectNo
                $scope.Name = ObjectName
                $scope.Id = TestId
                var topInfo = {
                    "TestId": $scope.Id,
                    "TubeNo": null,
                    "PictureId": null,
                    "CameraTimeS": null,
                    "CameraTimeE": null,
                    "AnalResult": null,
                    "GetCameraTime": 1,
                    "GetAnalResult": 1
                }
                var incInfo = {
                    "TubeNo": 1,
                    "GetCameraTime": 1,
                    "GetImageAddress": 1,
                    "GetAnalResult": 1,
                    "TestId": $scope.Id
                }
                $('#detail_vision').modal('show')
                Result.GetResultTubes({
                    "TestId": $scope.Id,
                    "TubeNo": null,
                    "CultureId": null,
                    "BacterId": null,
                    "OtherRea": null,
                    "IncubatorId": null,
                    "Place": null,
                    "StartTimeS": null,
                    "StartTimeE": null,
                    "EndTimeS": null,
                    "EndTimeE": null,
                    "AnalResult": null,
                    "PutoutTimeE": null,
                    "PutoutTimeS": null,
                    "PutinPeople": null,
                    "PutoutPeople": null,
                    "GetCultureId": 1,
                    "GetBacterId": 1,
                    "GetOtherRea": 1,
                    "GetIncubatorId": 1,
                    "GetStartTime": 1,
                    "GetEndTime": 1,
                    "GetAnalResult": 1
                }).then(function(data) {
                    console.log(data)
                    for (i = 0; i < data.length; i++) {
                        $scope.selectIncs[i] = data[i].TubeNo
                    }
                    // console.log(selectIncs)
                }, function(err) {})
                getimages(topInfo, incInfo)
                // cal_detailIncu = $interval(function() {
                //     getimages(topInfo, incInfo)
                // }, 30000)
            }
        }
    ])
    // 数据管理--试剂信息表--张桠童
    .controller('reagentCtrl', ['$scope', 'CONFIG', 'Storage', 'Data', 'ItemInfo', 'NgTableParams',
        function($scope, CONFIG, Storage, Data, ItemInfo, NgTableParams) {
            var ReagentsQuery = {
                "ReagentId": null,
                "ProductDayS": null,
                "ProductDayE": null,
                "ReagentType": null,
                "ExpiryDayS": null,
                "ExpiryDayE": null,
                "ReagentName": null,
                "ReagentTest": null,
                "SaveCondition": null,
                "Description": null,
                "ReDateTimeS": null,
                "ReDateTimeE": null,
                "ReTerminalIP": null,
                "ReTerminalName": null,
                "ReUserId": null,
                "ReIdentify": null,
                "GetProductDay": 1,
                "GetReagentType": 1,
                "GetReagentSource": 1,
                "GetExpiryDay": 1,
                "GetReagentName": 1,
                "GetReagentTest": 1,
                "GetSaveCondition": 1,
                "GetDescription": 1,
                "GetRevisionInfo": 1
            };
            var promise = ItemInfo.GetReagentsInfo(ReagentsQuery);
            promise.then(function(data) {
                var Reagents = data;
                // console.log(Reagents);
                $scope.tableParams = new NgTableParams({
                    count: 10
                }, {
                    counts: [],
                    dataset: Reagents
                });
            }, function(err) {});
        }
    ])
    // 数据管理--仪器信息表--张桠童
    .controller('instrumentCtrl', ['$scope', 'CONFIG', 'Storage', '$timeout', 'Data', 'ItemInfo', 'NgTableParams', 'Operation', 'Result',
        function($scope, CONFIG, Storage, $timeout, Data, ItemInfo, NgTableParams, Operation, Result) {
            var IsolatorsQuery = {
                "IsolatorId": null,
                "ProductDayS": null,
                "ProductDayE": null,
                "EquipPro": null,
                "InsDescription": null,
                "ReDateTimeS": null,
                "ReDateTimeE": null,
                "ReTerminalIP": null,
                "ReTerminalName": null,
                "ReUserId": null,
                "ReIdentify": null,
                "GetProductDay": 1,
                "GetEquipPro": 1,
                "GetInsDescription": 1,
                "GetRevisionInfo": 1
            };
            var promise1 = ItemInfo.GetIsolatorsInfo(IsolatorsQuery);
            promise1.then(function(data) {
                var Isolators = data;
                // console.log(Isolators);
                $scope.tableParams1 = new NgTableParams({
                    count: 10
                }, {
                    counts: [],
                    dataset: Isolators
                });
            }, function(err) {});
            var IncubatorsQuery = {
                "IncubatorId": null,
                "ProductDayS": null,
                "ProductDayE": null,
                "EquipPro": null,
                "InsDescription": null,
                "ReDateTimeS": null,
                "ReDateTimeE": null,
                "ReTerminalIP": null,
                "ReTerminalName": null,
                "ReUserId": null,
                "ReIdentify": null,
                "GetProductDay": 1,
                "GetEquipPro": 1,
                "GetInsDescription": 1,
                "GetRevisionInfo": 1
            };
            var promise2 = ItemInfo.GetIncubatorsInfo(IncubatorsQuery);
            promise2.then(function(data) {
                var Incubators = data;
                console.log(Incubators);
                $scope.tableParams2 = new NgTableParams({
                    count: 10
                }, {
                    counts: [],
                    dataset: Incubators
                });
            }, function(err) {});


            $scope.toenvIsolator = function(_Id) {
                $scope.envisolator = {
                    "IsolatorId": _Id,
                    "CabinId": null,
                    "MeaTimeS": null,
                    "MeaTimeE": null,
                    "IsoCode": null,
                    "IsoValue": null,
                    "ReDateTimeS": null,
                    "ReDateTimeE": null,
                    "ReTerminalIP": null,
                    "ReTerminalName": null,
                    "ReUserId": null,
                    "ReIdentify": null,
                    "GetIsoCode": 1,
                    "GetIsoValue": 1,
                    "GetRevisionInfo": 1
                };
                ItemInfo.GetIsolatorEnv($scope.envisolator).then(
                    function(data) {
                        $scope.envIsolatortableParams = new NgTableParams({
                            count: 10
                        }, {
                            counts: [],
                            dataset: data
                        });
                    },
                    function(e) {

                    });
                $('#env_Isolator').modal('show')
            }

            $scope.toopIsolator = function(_Id) {
                $scope.opequipment = {
                    "EquipmentId": _Id,
                    "OperationNo": null,
                    "OperationTimeS": null,
                    "OperationTimeE": null,
                    "OperationCode": null,
                    "OperationValue": null,
                    "OperationResult": null,
                    "ReDateTimeS": null,
                    "ReDateTimeE": null,
                    "ReTerminalIP": null,
                    "ReTerminalName": null,
                    "ReUserId": null,
                    "ReIdentify": null,
                    "GetOperationTime": 1,
                    "GetOperationCode": 1,
                    "GetOperationValue": 1,
                    "GetOperationResult": 1,
                    "GetRevisionInfo": 1
                };
                Operation.GetEquipmentOps($scope.opequipment).then(
                    function(data) {
                        $scope.opIsolatortableParams = new NgTableParams({
                            count: 10
                        }, {
                            counts: [],
                            dataset: data
                        });
                    },
                    function(e) {

                    });
                $('#op_Isolator').modal('show')
            }

            $scope.tobreakdownIsolator = function(_Id) {
                console.log(_Id)
                $scope.breakdownIsolator = {
                    "BreakId": null,
                    "BreakTimeS": null,
                    "BreakTimeE": null,
                    "BreakEquip": _Id,
                    "BreakPara": null,
                    "BreakValue": null,
                    "BreakReason": null,
                    "ResponseTimeS": null,
                    "ResponseTimeE": null,
                    "GetBreakTime": 1,
                    "GetBreakEquip": 1,
                    "GetBreakPara": 1,
                    "GetBreakValue": 1,
                    "GetBreakReason": 1,
                    "GetResponseTime": 1
                };
                Result.GetBreakDowns($scope.breakdownIsolator).then(
                    function(data) {
                        console.log(data)
                        if ((data == undefined) || (data.length == 0)) {
                            $('#nobreakdown').modal('show');
                            $timeout(function() {
                                $('#nobreakdown').modal('hide');
                            }, 1000);
                        } else {
                            $scope.breakdownIsolatortableParams = new NgTableParams({
                                count: 10
                            }, {
                                counts: [],
                                dataset: data
                            });
                            $('#breakdown_Isolator').modal('show')
                        }

                    },
                    function(e) {

                    });


            }

            $scope.toenvIncubator = function(_Id) {
                $scope.envincubator = {
                    "IncubatorId": _Id,
                    "MeaTimeS": null,
                    "MeaTimeE": null,
                    "Temperature": null,
                    "ReDateTimeS": null,
                    "ReDateTimeE": null,
                    "ReTerminalIP": null,
                    "ReTerminalName": null,
                    "ReUserId": null,
                    "ReIdentify": null,
                    "GetTemperature1": 1,
                    "GetTemperature2": 1,
                    "GetTemperature3": 1,
                    "GetRevisionInfo": 1
                }
                ItemInfo.GetIncubatorEnv($scope.envincubator).then(
                    function(data) {
                        for (i = 0; i < data.length; i++) {
                            data[i] = Object.assign(data[i], { "Temperature": (data[i].Temperature1 + data[i].Temperature2 + data[i].Temperature3) / 3 })
                        }
                        console.log(data)

                        $scope.envIncubatortableParams = new NgTableParams({
                            count: 10
                        }, {
                            counts: [],
                            dataset: data
                        });
                    },
                    function(e) {

                    });
                $('#env_Incubator').modal('show')

            }

            $scope.toopIncubator = function(_Id) {
                $scope.opequipment = {
                    "EquipmentId": _Id,
                    "OperationNo": null,
                    "OperationTimeS": null,
                    "OperationTimeE": null,
                    "OperationCode": null,
                    "OperationValue": null,
                    "OperationResult": null,
                    "ReDateTimeS": null,
                    "ReDateTimeE": null,
                    "ReTerminalIP": null,
                    "ReTerminalName": null,
                    "ReUserId": null,
                    "ReIdentify": null,
                    "GetOperationTime": 1,
                    "GetOperationCode": 1,
                    "GetOperationValue": 1,
                    "GetOperationResult": 1,
                    "GetRevisionInfo": 1
                };
                Operation.GetEquipmentOps($scope.opequipment).then(
                    function(data) {
                        $scope.opIncubatortableParams = new NgTableParams({
                            count: 10
                        }, {
                            counts: [],
                            dataset: data
                        });
                    },
                    function(e) {

                    });
                $('#op_Incubator').modal('show')

            }

            $scope.tobreakdownIncubator = function(_Id) {
                $scope.breakdownIncubator = {
                    "BreakId": null,
                    "BreakTimeS": null,
                    "BreakTimeE": null,
                    "BreakEquip": _Id,
                    "BreakPara": null,
                    "BreakValue": null,
                    "BreakReason": null,
                    "ResponseTimeS": null,
                    "ResponseTimeE": null,
                    "GetBreakTime": 1,
                    "GetBreakEquip": 1,
                    "GetBreakPara": 1,
                    "GetBreakValue": 1,
                    "GetBreakReason": 1,
                    "GetResponseTime": 1
                };
                Result.GetBreakDowns($scope.breakdownIncubator).then(
                    function(data) {
                        if ((data == undefined) || (data.length == 0)) {
                            $('#nobreakdown').modal('show');
                            $timeout(function() {
                                $('#nobreakdown').modal('hide');
                            }, 1000);
                        } else {
                            $scope.breakdownIncubatortableParams = new NgTableParams({
                                count: 10
                            }, {
                                counts: [],
                                dataset: data
                            });
                            $('#breakdown_Incubator').modal('show')

                        }


                    },
                    function(e) {

                    });

            }

            // 关闭modal控制
            $scope.modal_close = function(target) {
                $(target).modal('hide')

            }
        }
    ])

    // 字典管理
    .controller('dictionariesCtrl', ['$scope', '$state', 'Storage', function($scope, $state, Storage) {
        Storage.set('Tab', 2)

        if (Storage.get('ROLE') == '操作员') {

            $state.go('main.data.sampling')
        }

        $scope.tosamplingtype = function() {
            $state.go('main.dictionaries.samplingtype')
        }
        $scope.tooperation = function() {
            $state.go('main.dictionaries.operation')
        }
        $scope.tooperatingprocess = function() {
            $state.go('main.dictionaries.operationorder')
        }
    }])

    // 字典管理--操作流程维护
    .controller('operationorderCtrl', ['$scope', 'Storage', 'Data', 'Operation', '$timeout', 'NgTableParams',
        function($scope, Storage, Data, Operation, $timeout, NgTableParams) {

            var nowdata = new Array()
            var getLists = function(_userlist) {
                console.log(_userlist)
                Operation.GetSampleFlow(_userlist).then(function(_data) {
                    var finaldata = new Array()
                    for (j = 0; j < _data.length; j++) {
                        finaldata.push(_data[j])
                    }
                    $scope.tableParams = new NgTableParams({
                        count: 10
                    }, {
                        counts: [],
                        dataset: finaldata
                    });
                    nowdata = finaldata
                }, function(err) {});
            }

            // 设置可供选择的流程类型
            var tempSampleTypes = new Array()

            Operation.GetAllOpTypes({}).then(function(data) {

                // ng-options改造
                for (i = 0; i < data.length; i++) {
                    tempSampleTypes[i] = {}
                    tempSampleTypes[i].SampleType = data[i];
                }

                // 页面初始化
                $scope.SampleTypenow = tempSampleTypes[0]
                getLists($scope.SampleTypenow);

            }, function(err) {});
            $scope.search_SampleTypes = tempSampleTypes

            // 搜索
            $scope.searchList = function() {
                console.log($scope.SampleTypenow)
                getLists($scope.SampleTypenow)
            }

            // 删除跳转
            var tempOrderId = ''
            $scope.todelete = function(_OrderId) {
                tempOrderId = _OrderId
                $('#DeleteOrNot').modal('show')
            }

            // 删除
            $scope.delete = function() {
                console.log(tempOrderId)
                var nowlength = nowdata.length
                // console.log("删除", nowdata[nowlength - 1].OrderId)
                Operation.DeleteOperationOrder({ OrderId: nowdata[nowlength - 1].OrderId }).then(function(data) {
                    if (data.result == "数据删除成功") {
                        $('#DeleteOrNot').modal('hide')

                        // 提示新建成功
                        $('#deleteSuccess').modal('show')
                        $timeout(function() {
                            $('#deleteSuccess').modal('hide')
                        }, 1000)

                        // 刷新页面
                        $scope.SampleTypenow = tempSampleTypes[0]
                        getLists($scope.SampleTypenow);
                    }
                }, function(err) {});

                for (i = Number(tempOrderId.replace(/[^0-9]/ig, "")); i < nowdata.length; i++) {
                    var datatoadd = nowdata[i]
                    datatoadd.OrderId = tempOrderId.replace(/[^a-zA-Z]/ig, "") + (Array(3).join('0') + i)
                    if (datatoadd.PreviousStep == undefined) { datatoadd.PreviousStep = '' }
                    if (datatoadd.LaterStep == undefined) { datatoadd.LaterStep = '' }
                    if (datatoadd.SampleType == undefined) { datatoadd.SampleType = tempOrderId.replace(/[^a-zA-Z]/ig, "") }
                    // console.log("新增", datatoadd)
                    // 新增
                    Operation.SetOperationOrder(datatoadd).then(function(data) {}, function(err) {})
                }
            }

            // 新增显示
            $scope.tonew = function(_type) {
                $scope.registerInfo = {}
                console.log(_type)
                // 编号
                console.log(Number(_type.OrderId.replace(/[^0-9]/ig, "")))
                // 类型
                console.log(_type.OrderId.replace(/[^a-zA-Z]/ig, ""))

                $scope.registerInfo.SampleType = _type.OrderId.replace(/[^a-zA-Z]/ig, "")
                //  ID
                $scope.registerInfo.OrderId = _type.OrderId.replace(/[^a-zA-Z]/ig, "") + (Array(3).join('0') + Number(_type.OrderId.replace(/[^0-9]/ig, ""))).slice(-3)

                if (Number(_type.OrderId.replace(/[^0-9]/ig, "")) == 1) {
                    $scope.registerInfo.PreviousStep = '无'
                    $scope.registerInfo.LaterStep = _type.OperationId + '，' + _type.OpDescription
                } else {
                    for (i = 0; i <= nowdata.length; i++) {

                        if (Number(nowdata[i].OrderId.replace(/[^0-9]/ig, "")) == (Number(_type.OrderId.replace(/[^0-9]/ig, "")) - 1)) {
                            $scope.registerInfo.PreviousStep = nowdata[i].OperationId + '，' + nowdata[i].OpDescription
                            break;
                        }
                    }
                    $scope.registerInfo.LaterStep = _type.OperationId + '，' + _type.OpDescription
                }
                $('#new_operationorder').modal('show')
            }

            // 新增
            $scope.register = function(_registerInfo) {
                console.log(_registerInfo)
                console.log(nowdata)
                // 该条编号：_registerInfo.OrderId.replace(/[^a-zA-Z]/ig, "")

                console.log(_registerInfo.OrderId.replace(/[^0-9]/ig, ""))
                for (i = nowdata.length + 1; i > _registerInfo.OrderId.replace(/[^0-9]/ig, ""); i--) {
                    var datatoadd = nowdata[i - 2]
                    datatoadd.OrderId = _registerInfo.SampleType + (Array(3).join(0) + i).slice(-3)
                    if (datatoadd.PreviousStep == undefined) { datatoadd.PreviousStep = '' }
                    if (datatoadd.LaterStep == undefined) { datatoadd.LaterStep = '' }
                    if (datatoadd.SampleType == undefined) { datatoadd.SampleType = _registerInfo.SampleType }
                    // console.log("新增", datatoadd)
                    // 新增
                    Operation.SetOperationOrder(datatoadd).then(function(data) {}, function(err) {})
                    //删除
                    // console.log("删除", _registerInfo.SampleType + (Array(3).join(0) + (i - 1)).slice(-3))
                    // Operation.DeleteOperationOrder({ OrderId: _registerInfo.SampleType + (Array(3).join(0) + (i - 1)).slice(-3) }).then(function(data) {}, function(err) {});
                }
                //增加该条
                // console.log("这条", _registerInfo)
                Operation.SetOperationOrder(_registerInfo).then(function(data) {
                    if (data.result == "插入成功") {
                        $('#new_operationorder').modal('hide')

                        // 提示新建成功
                        $('#setSuccess').modal('show')
                        $timeout(function() {
                            $('#setSuccess').modal('hide')
                        }, 1000)

                        // 刷新页面
                        $scope.SampleTypenow = tempSampleTypes[0]
                        getLists($scope.SampleTypenow);
                    }
                }, function(err) {})

            }



            // 关闭modal控制
            $scope.modal_close = function(target) {
                $(target).modal('hide')
            }

            //新建-搜索操作
            $scope.flagsearch = false
            $scope.searchOperation = function(searchname) {
                console.log(searchname);
                if ((searchname == undefined) || (searchname == '')) {
                    $('#nameUndefined').modal('show')
                    $timeout(function() {
                        $('#nameUndefined').modal('hide')
                    }, 1000)
                } else {
                    $scope.flagsearch = true
                    Operation.GetOperationInfo({
                        "OperationId": null,
                        "OperationName": searchname,
                        "OutputCode": null,
                        "GetOperationName": 1,
                        "GetOutputCode": 1
                    }).then(function(data) {
                        $scope.Operation_search = data
                    }, function(err) {});

                }
            }

        }
    ])


    // 字典管理--基本操作维护
    .controller('operationCtrl', ['$scope', 'Storage', 'Data', 'Operation', '$timeout', 'NgTableParams',
        function($scope, Storage, Data, Operation, $timeout, NgTableParams) {
            var input = {
                "OperationId": null,
                "OperationName": null,
                "OutputCode": null,
                "GetOperationName": 1,
                "GetOutputCode": 1
            }

            var getLists = function() {
                Operation.GetOperationInfo(input).then(function(data) {
                    console.log(data)
                    $scope.tableParams = new NgTableParams({
                        count: 10
                    }, {
                        counts: [],
                        dataset: data
                    });
                }, function(err) {});
            }
            getLists();

            $scope.tonew = function() {
                $('#new_operation').modal('show')

            }

            $scope.register = function() {
                Operation.SetOperationInfo($scope.registerInfo).then(function(data) {
                        if (data.result == "插入成功") {
                            // 关闭新建modal
                            $('#new_operation').modal('hide')
                            // 提示新建成功
                            $('#setSuccess').modal('show')
                            $timeout(function() {
                                $('#setSuccess').modal('hide')
                            }, 1000)
                            getLists();
                        }
                    },
                    function(err) {});
            }

            // 监听事件(表单清空)
            $('#new_operation').on('hidden.bs.modal', function() {
                $scope.registerInfo = {}
            })


            var tempOperationId = ''
            $scope.todelete = function(_OperationId) {
                tempOperationId = _OperationId
                $('#DeleteOrNot').modal('show')
            }


            $scope.delete = function() {
                Operation.DeleteOperation({ OperationId: tempOperationId }).then(function(data) {
                    if (data.result == "数据删除成功") {
                        // 关闭是否删除modal
                        $('#DeleteOrNot').modal('hide')
                        // 提示新建成功
                        $('#deleteSuccess').modal('show')
                        $timeout(function() {
                            $('#deleteSuccess').modal('hide')
                        }, 1000)
                        getLists();
                    }
                }, function(err) {});
            }

            var tempeditType = ''
            $scope.toedit = function(type) {
                tempeditType = type
                $scope.editInfo = type
                $('#edit_operation').modal('show')
            }

            $scope.edit = function() {
                Operation.DeleteOperation({ OperationId: tempeditType.OperationId }).then(function(data) {
                    if (data.result == "数据删除成功") {
                        Operation.SetOperationInfo($scope.finaleditInfo).then(function(data) {
                                if (data.result == "插入成功") {
                                    // 关闭修改modal
                                    $('#edit_operation').modal('hide')
                                    // 提示修改成功
                                    $('#editSuccess').modal('show')
                                    $timeout(function() {
                                        $('#editSuccess').modal('hide')
                                    }, 1000)
                                    getLists();
                                }
                            },
                            function(err) {});
                    }
                }, function(err) {});
            }
            $('#edit_operation').on('hidden.bs.modal', function() {
                $scope.editInfo = tempeditType
                $scope.finaleditInfo = {}
            })

            // 关闭modal控制
            $scope.modal_close = function(target) {
                $(target).modal('hide')

            }

        }
    ])

    // 字典管理--样品类型维护
    .controller('samplingtypeCtrl', ['$scope', 'Storage', 'Data', 'UserService', 'NgTableParams', 'ItemInfo', '$timeout',
        function($scope, Storage, Data, UserService, NgTableParams, ItemInfo, $timeout) {

            var getLists = function() {
                UserService.GetReagentType().then(function(data) {
                    $scope.tableParams = new NgTableParams({
                        count: 10
                    }, {
                        counts: [],
                        dataset: data
                    });
                }, function(err) {});
            }

            getLists();

            var tempTypeId
            $scope.todelete = function(_TypeId) {
                tempTypeId = _TypeId
                $('#DeleteOrNot').modal('show')
            }

            $scope.delete = function() {
                ItemInfo.DeleteReagentTypeData({ TypeId: tempTypeId }).then(function(data) {
                    if (data.result == "数据删除成功") {
                        // 关闭是否删除modal
                        $('#DeleteOrNot').modal('hide')
                        // 提示删除成功
                        $('#deleteSuccess').modal('show')
                        $timeout(function() {
                            $('#deleteSuccess').modal('hide')
                        }, 1000)
                        getLists();
                    }
                }, function(err) {});
            }

            var tempeditType
            $scope.toedit = function(type) {
                tempeditType = type
                $scope.editInfo = type
                $('#edit_samplingtype').modal('show')
            }

            $scope.edit = function() {
                ItemInfo.DeleteReagentTypeData({ TypeId: tempeditType.Type }).then(function(data) {
                    if (data.result == "数据删除成功") {
                        ItemInfo.SetReagentTypeData($scope.finaleditInfo).then(function(data) {
                                if (data.result == "插入成功") {
                                    // 关闭修改modal
                                    $('#edit_samplingtype').modal('hide')
                                    // 提示修改成功
                                    $('#editSuccess').modal('show')
                                    $timeout(function() {
                                        $('#editSuccess').modal('hide')
                                    }, 1000)
                                    getLists();
                                }
                            },
                            function(err) {});
                    }
                }, function(err) {});
            }

            $scope.tonew = function() {
                $('#new_samplingtype').modal('show')
            }

            $scope.register = function() {
                ItemInfo.SetReagentTypeData($scope.registerInfo).then(function(data) {
                        console.log(data)
                        if (data.result == "插入成功") {
                            // 关闭新建modal
                            $('#new_samplingtype').modal('hide')
                            // 提示新建成功
                            $('#setSuccess').modal('show')
                            $timeout(function() {
                                $('#setSuccess').modal('hide')
                            }, 1000)
                            getLists();
                        }
                    },
                    function(err) {});
            }

            // 监听事件(表单清空)
            $('#new_samplingtype').on('hidden.bs.modal', function() {
                $scope.registerInfo = {}
            })
            $('#edit_samplingtype').on('hidden.bs.modal', function() {
                $scope.editInfo = tempeditType
                $scope.finaleditInfo = {}

            })

            // 关闭modal控制
            $scope.modal_close = function(target) {
                $(target).modal('hide')

            }
        }
    ])

    // 用户管理
    .controller('usersCtrl', ['$scope', '$state', 'Storage', function($scope, $state, Storage) {
        Storage.set('Tab', 3)

        if (Storage.get('ROLE') == '操作员') {
            $state.go('main.data.sampling')
        }

        $scope.toallusers = function() {
            $state.go('main.users.allusers')
        }

    }])
    // 用户管理--所有用户
    .controller('allusersCtrl', ['$scope', 'CONFIG', 'Storage', 'Data', 'UserService', 'NgTableParams', 'ItemInfo', 'Result',
        function($scope, CONFIG, Storage, Data, UserService, NgTableParams, ItemInfo, Result) {
            var input = {
                "UserId": null,
                "Identify": null,
                "PhoneNo": null,
                "UserName": null,
                "Role": null,
                "Password": null,
                "LastLoginTimeS": null,
                "LastLoginTimeE": null,
                "ReDateTimeS": null,
                "ReDateTimeE": null,
                "ReTerminalIP": null,
                "ReTerminalName": null,
                "ReUserId": null,
                "ReIdentify": null,
                "GetIdentify": 1,
                "GetPhoneNo": 1,
                "GetUserName": 1,
                "GetRole": 1,
                "GetPassword": 1,
                "GetLastLoginTime": 1,
                "GetRevisionInfo": 1
            }

            UserService.GetAllUserInfo(input).then(function(data) {
                $scope.tableParams = new NgTableParams({
                    count: 10
                }, {
                    counts: [],
                    dataset: data
                });
            }, function(err) {});

            $scope.opsampling = true
            ItemInfo.GetSamplesInfo({
                "GetSamplingPeople": 1,
                "GetSamplingTime": 1,
            }).then(function(data) {
                $scope.oplog_sampling = new NgTableParams({
                    count: 10
                }, {
                    counts: [],
                    dataset: data
                });
            }, function(err) {});
            $scope.oplog = function() {
                console.log($scope.op)

                switch ($scope.op) {
                    // 样品录入
                    case "":
                        ItemInfo.GetSamplesInfo({
                            "GetSamplingPeople": 1,
                            "GetSamplingTime": 1,
                        }).then(function(data) {
                            console.log(data)
                            $scope.opsampling = true
                            $scope.oprevision = false
                            $scope.oppro = false
                            $scope.oppos = false
                            $scope.opinout = false
                            $scope.oplog_sampling = new NgTableParams({
                                count: 10
                            }, {
                                counts: [],
                                dataset: data
                            });
                        }, function(err) {});
                        break;
                        // 试剂录入
                    case "1":
                        ItemInfo.GetReagentsInfo({
                            "GetRevisionInfo": 1,
                        }).then(function(data) {
                            console.log(data)
                            $scope.oprevision = true
                            $scope.opsampling = false
                            $scope.oppro = false
                            $scope.oppos = false
                            $scope.opinout = false
                            $scope.oplog_revision = new NgTableParams({
                                count: 10
                            }, {
                                counts: [],
                                dataset: data
                            });
                        }, function(err) {});
                        break;
                        // 培养器加工
                    case "2":
                        Result.GetTestResultInfo({
                            "GetProcessStart": 1,
                            "GetTestPeople": 1,
                        }).then(function(data) {
                            console.log(data)
                            $scope.oprevision = false
                            $scope.opsampling = false
                            $scope.oppro = true
                            $scope.oppos = false
                            $scope.opinout = false
                            $scope.oplog_process = new NgTableParams({
                                count: 10
                            }, {
                                counts: [],
                                dataset: data
                            });
                        }, function(err) {});
                        break;
                        //阳性菌加注
                    case "3":
                        var positive = new Array()
                        Result.GetTestResultInfo({
                            "GetCollectStart": 1,
                            "GetTestPeople2": 1,
                        }).then(function(data) {
                            console.log(data)
                            $scope.oprevision = false
                            $scope.opsampling = false
                            $scope.oppro = false
                            $scope.oppos = true
                            $scope.opinout = false
                            for (i = 0; i < data.length; i++) {
                                if (data[i].TestPeople2 != null) {
                                    positive.push(data[i])
                                }
                            }
                            $scope.oplog_positive = new NgTableParams({
                                count: 10
                            }, {
                                counts: [],
                                dataset: positive
                            });
                        }, function(err) {});
                        break;
                        //培养器的放入与取出
                    case "4":
                        var notnull = new Array()
                        Result.GetResultTubes({
                            "GetStartTime": 1,
                            "GetPutinPeople": 1,
                            "GetPutoutPeople": 1,
                            "GetPutoutTime": 1,
                        }).then(function(data) {
                            console.log(data)
                            $scope.oprevision = false
                            $scope.opsampling = false
                            $scope.oppro = false
                            $scope.oppos = false
                            $scope.opinout = true
                            for (i = 0; i < data.length; i++) {
                                if (data[i].PutinPeople != null) {
                                    notnull.push(data[i])
                                }
                            }
                            $scope.oplog_inout = new NgTableParams({
                                count: 10
                            }, {
                                counts: [],
                                dataset: notnull
                            });
                        }, function(err) {});
                        break;
                }

            }
        }
    ])