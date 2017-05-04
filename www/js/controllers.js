﻿angular.module('controllers',['ngResource','services'])

.controller('LoginCtrl',['UserService','$scope','$state','Storage', '$timeout', function(UserService,$scope,$state,Storage,$timeout){

    //捆绑变量
    $scope.logdisable = false;
    $scope.logStatus = "   ";

    // 判断当前本地是否缓存了手机号
    if(Storage.get('PHONENO')!=null){ //缓存了手机号 将其显示到输入栏
      $scope.login = { phoneno : Storage.get('PHONENO'),
          password : ""
      };
    }
    else{ //否则空白显示
      $scope.login = { phoneno : "",
          password : ""
      };
    }
    var  count = 0; //记录登录总次数,用于disable button

    // UserService.Login("2323","12345678")

    $scope.LogIn = function(login) {
      //显示登陆的进程
      $scope.logStatus = " ";

      // 如果都输入完全的信息了 开始下一步
      if (login.phoneno != "" && login.password != "") {

          //判断合法手机号
          var phonev = /^1(3|4|5|7|8)\d{9}$/;
          if(!phonev.test(login.phoneno) ){
              $scope.logStatus = '请输入正确手机号';
              return
          }

          //从手机号获得 UserId
          UserService.GetUserByPhoneNo(login.phoneno).then(function(data){

              data = data.toJSON();
              t = [];
              for(i in data){
                  t = t + data[i];
              }
              data = t;

              if(data != ""){ //获得UserId

                  // console.log(data.result);
                  Storage.set("UID",data);
                  UserService.SetUID(data);
                  //本地暂存
                  UserService.Login(data,login.password).then(function(data2){ //登陆
                      if(data2.result =="登录成功"){

                          $scope.logStatus = " 登录成功";
                          //获得个人信息
                          // UserService.GetUserInfo(login.phoneno).then(function(data){
                          //     console.log(data.result.split('|'))
                          // });
                          // 跳转到主页
                          $timeout(function(){$state.go('main.data.sampling');} , 500);

                      }
                      else{
                          switch(data2.result){
                              case 0: $scope.logStatus = "用户不存在";break;
                              case -1: $scope.logStatus = "密码错误";break;
                              case -2: $scope.logStatus = "连接数据库失败";break;
                              default: $scope.logStatus = "其他问题";break;

                          }

                          if(count++ >= 5){ //连续超过五次 禁止登陆60s
                              $scope.logStatus = "稍后再试";
                              $scope.logdisable = true;
                              $timeout(function(){$scope.logdisable=false;count=0;} , 60000);
                          }
                      }
                  })
              }

              }
          )

      }
      else{ //否则开始计算点击次数
          if(count++ <5){   //超过五次 禁止登陆
              $scope.logStatus =  "请输入完整信息";
          }else{
              $scope.logStatus = "请输入完整信息";
              $scope.logdisable = true;
              $timeout(function(){$scope.logdisable=false;count=0;} , 60000);
          }
      }
    };
    $scope.toRegister = function(){ //跳转到注册页面-电话验证

      Storage.set('setPasswordState','register');
      $state.go('phoneValid');

    }

    $scope.toReset = function() {//跳转到找回密码页面-电话验证

      Storage.set('setPasswordState', 'reset');
      $state.go('phoneValid');

    }




}])

.controller('phoneValidCtrl',['$scope','$timeout','$interval','Storage','$state','UserService',function($scope,$timeout,$interval,Storage,$state,UserService){

    $scope.telnumber = '';
    $scope.validnumber = '';
    $scope.check = '';
    $scope.validStatus = "点击发送验证码";
    $scope.title = " ";
    $scope.if_disabled = false;
    switch(Storage.get('setPasswordState')){
        case 'register':  $scope.title = "注册"; break;
        case 'reset': $scope.title = "找回密码"; break;
        default: $scope.title = "注册";
    }

    var uid_valid = /^UID\d{11}/;
    var RegisterNewUser = function(tel){

        UserService.CreateNewUserId(tel).then(function(data){
            // 转换成 json
            data = data.toJSON();
            var t = "";
            for(i in data){
                t = t + data[i];
            }
            data = t;

            // console.log(data);
            if(data == "该手机号已经注册" ){
                $scope.validStatus = "该手机号已经注册";
                return ;
            }
            else if(uid_valid.test(data)){
                $scope.validStatus = "生成新用户ID成功";
                Storage.set('UID', data);
                UserService.SetUID(data);
                UserService.SetPhenoNo(tel);
            }
            else{
                $scope.validStatus = "生成新用户ID失败";
            }
        },function(er){
            console.log(er)
            $scope.validStatus = "验证失败";
        });
    }

    var ResetPassword = function(tel){
        //判断手机号是否存在
        UserService.GetUserByPhoneNo(tel).then(function(data){
            // 转换成 json

            data = data.toJSON();
            var t = "";
            for(i in data){
                t = t + data[i];
            }
            data = t;

            if(data == null){
                $scope.validStatus = "不存在该用户";
                return
            }
            else if(uid_valid.test(data)){
                Storage.set("UID",data);
                UserService.SetUID(data);
                UserService.SetPhenoNo(tel);
                $scope.validStatus = "已发送验证";
            }
        })
    };

    $scope.SendMSM = function(tel){
        if($scope.if_disabled) return;

        var phonev = /^1(3|4|5|7|8)\d{9}$/;
        if(!phonev.test(tel) ){
            $scope.check = '请输入正确手机号';
            return
        }


        if(Storage.get('setPasswordState') == 'register'){
            RegisterNewUser(tel);
        }
        else{
            ResetPassword(tel);
        }
        $scope.if_disabled = true;

        //倒计时60s
        $timeout(function(){$scope.validStatus = "点击发送验证码";$scope.if_disabled = false;} , 60000);
        var second = 60;
        timePromise = undefined;

        timePromise = $interval(function(){
            if(second<=0){
                $interval.cancel(timePromise);
                timePromise = undefined;
                second = 60;
                $scope.validStatus = "重发验证码";
            }else{
                $scope.validStatus = String(second) + "秒后再发送";
                second--;

            }
        },1000,100);


    };

    $scope.validNext = function(number){

        var phonev = /^1(3|4|5|7|8)\d{9}$/;
        if(!phonev.test(number) ){
            $scope.check = '请输入正确手机号';
            return
        }

        var validNumberReg = /^\d{6}$/;
        if(!validNumberReg.test($scope.validnumber)){
            $scope.check = '请输入正确验证码';
            return
        }


        //调web Service 判断验证码正不正确


        switch(Storage.get('setPasswordState')){
            case 'register': $state.go('register');break;
            case 'reset': $state.go('setPassword');
        }
    }

    $scope.onClickCancel = function(){
       Storage.rm("UID");
       $state.go("login");
    }



}])


.controller('RegisterCtrl',['UserService','$scope','$state','Storage', '$timeout', function(UserService,$scope,$state,Storage,$timeout){

    $scope.registerInfo = {
        uid:UserService.GetUID(),
        username:'',
        id:'',
        password:'',
        password_rep:'',
        role:""
    };

    $scope.status = "";


    $scope.onClickReg = function(registerInfo){


        if(registerInfo.role == ""){
            $scope.status = "请选角色";
        }

        if(registerInfo.password != registerInfo.password){
            $scope.status = "两次密码不同";
        }

        registerInfo.role = registerInfo.role[0];
        console.log(registerInfo.role);
        UserService.RegisterUser(registerInfo).then(function(data){
            // console.log(data);
            if(data.result == "注册成功"){
                $timeout(function(){$state.go('main.data.sampling');} , 500);
                $scope.status = "注册成功";
            }
            else{
                $scope.status = "注册失败";
            }
        })
    }
}])

.controller('SetPasswordCtrl',['UserService','$scope','$state','Storage', '$timeout', function(UserService,$scope,$state,Storage,$timeout){

    $scope.Input = {
        password:'',
        password2:'',
        password_old :''
    };

    $scope.status = "";

    $scope.onClickCancel = function(){
        Storage.rm("UID");
        $state.go("login");
    };

    $scope.onClickConfirm = function(Input){


        if(Input.password != Input.password2){
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

            UserService.ChangePassword(Input,1).then(function(res){
                if(res.result == "修改成功"){
                    $timeout(function(){$state.go('main.data.sampling');} , 500);
                }
                else{

                }
                // if(res){
                //     $timeout(function(){$state.go('main.data');} , 500);
                // }
        })

    }

}])


.controller('ChangePasswordCtrl',['UserService','$scope','$state','Storage', '$timeout', function(UserService,$scope,$state,Storage,$timeout){


    $scope.Input = {
        password:'',
        password2:'',
        password_old:''
    };

    $scope.status = "";


    $scope.onClickConfirm = function(Input){


        if(Input.password != Input.password2){
            $scope.status = "两次新密码不同";
            return
        }

        UserService.ChangePassword(Input,0).then(function(res){
            if(res.result == "修改成功"){
                $scope.status = "修改成功";
                $timeout(function(){$state.go('login');} , 500);
            }
            else{
                $scope.status = "修改失败";
            }
        })


    };

    $scope.back = function(){
        $state.go('main.data.sampling');
    }
}])

.controller('RealTimeCtrl',['UserService','$scope','$state','Storage', '$timeout', 'SocketService', function(UserService, $scope, $state, Storage, $timeout, SocketService){


    $scope.status = "No Connection";


    SocketService.on('connect', function(){
        // console.log('Connected');
        $scope.status = "Connected"
    });

    SocketService.on('disconnect',function(){
        $scope.status = "No Connection"
    });

    SocketService.on('message', function(data){
        // console.log(data);
        $scope.status = "Connected";
        var myChart = echarts.init(document.getElementById('main'));
        myChart.showLoading();
        // 指定图表的配置项和数据
        var option = {
            title: {
                text: $scope.text
            },
            tooltip: {},
            legend: {
                data:['params']
            },
            xAxis: {
                data: []
            },
            yAxis: {},
            series: [{
                name: '销量',
                type: 'line',
                data: data.data
            }]
        };

        // 使用刚指定的配置项和数据显示图表。
        myChart.setOption(option);
        myChart.hideLoading();
    });


    $scope.isolator1 = {
        name: "进料区",
        env_names: ["进料区温度","进料区湿度","进料区压力","进料区风速","进料区过氧化氢浓度"],
        env_codes:["1","2","3","4","5"],
        env_status:[1,1,1,1,1],
        instr_names:[
            "进料区灭菌器",

            "进料区与进料待加工区之间的门",
            "进料区导轨"


        ],
        instr_codes:[
            "1","2","3","4","5","6","7","8","9","10","11"
        ],
        instr_status:[
            "1","2","3","4","5","6","7","8","9","10","11"
        ]


    };

    $scope.isolator2 = {
        name: "进料待加工区",
        env_names: ["进料待加工区温度","进料待加工区湿度","进料待加工区压力","进料待加工区风速","进料待加工区过氧化氢浓度"],
        env_codes:["1","2","3","4","5"],
        env_status:[1,1,1,1,1],
        instr_names:[

            "进料待加工区灭菌器",
            "加工区灭菌器",
            "待出料区灭菌器",





        ],
        instr_codes:[
            "1","2","3","4","5","6","7","8","9","10","11"
        ],
        instr_status:[
            "1","2","3","4","5","6","7","8","9","10","11"
        ]


    };

    $scope.isolator3 = {
        name: "加工区",
        env_names: ["加工区温度","加工区湿度","加工区压力","加工区风速","加工区过氧化氢浓度"],
        env_codes:["1","2","3","4","5"],
        env_status:[1,1,1,1,1],
        instr_names:[


            "加工区灭菌器",



            "出料区导轨",
            "待出料区与出料区之间的门"

        ],
        instr_codes:[
            "1","2","3","4","5","6","7","8","9","10","11"
        ],
        instr_status:[
            "1","2","3","4","5","6","7","8","9","10","11"
        ]


    };

    $scope.isolator4 = {
        name: "待出料区",
        env_names: ["待出料区温度","待出料区湿度","待出料区压力","待出料区风速","待出料区过氧化氢浓度"],
        env_codes:["1","2","3","4","5"],
        env_status:[1,1,1,1,1],
        instr_names:[

            "待出料区灭菌器",



            "待出料区与出料区之间的门"

        ],
        instr_codes:[
            "1","2","3","4","5","6","7","8","9","10","11"
        ],
        instr_status:[
            "1","2","3","4","5","6","7","8","9","10","11"
        ]


    };
    $scope.isolator5 = {
        name: "出料区",
        env_names: ["出料区温度","出料区湿度","出料区压力","出料区风速","出料区过氧化氢浓度"],
        env_codes:["1","2","3","4","5"],
        env_status:[1,1,1,1,1],
        instr_names:[

            "出料区灭菌器",


            "出料区导轨"

        ],
        instr_codes:[
            "1","2","3","4","5","6","7","8","9","10","11"
        ],
        instr_status:[
            "1","2","3","4","5","6","7","8","9","10","11"
        ]


    };

    $scope.isolator = {
        name: "出料区",
        env_names: ["温度","湿度","压力","风速","过氧化氢浓度"],
        env_codes:["1","2","3","4","5"],
        env_status:[1,1,1,1,1],
        instr_names:[
            "进料区灭菌器",
            "进料待加工区灭菌器",
            "加工区灭菌器",
            "待出料区灭菌器",
            "出料区灭菌器",
            "进料区与进料待加工区之间的门",
            "进料区导轨",
            "加工区导轨",
            "出料区导轨",
            "待出料区与出料区之间的门",
            "机械臂"
        ],
        instr_codes:[
            "1","2","3","4","5","6","7","8","9","10","11"
        ],
        instr_status:[
            "1","2","3","4","5","6","7","8","9","10","11"
        ]


    };
    $scope.incubator = {
        name: "培养箱",
        env_names: ["培养箱温度"],
        env_codes:["1"],
        env_status: ["35 ℃"],
        instr_names:[
            "培养箱门",
            "上层外圈转盘",
            "上层内圈转盘",
            "下层外圈转盘",
            "下层内圈转盘",
            "顶空电源",
            "视觉光源",
            "工业相机",
            "顶空分析",
            "支架电机"
        ],
        instr_codes:["1","2","3","4","5","6","7","8","9","10"],
        instr_status:[
            "1","2","3","4","5","6","7","8","9","10"
        ]
    };

    $scope.printcode = function(code,name){
        // console.log(code);
        SocketService.emit('get params',code);
        $scope.text = name;
    }


}])


.controller('MonitorCtrl',['UserService','$scope','$state','Storage', '$timeout', 'SocketService', function(UserService, $scope, $state, Storage, $timeout, SocketService){


        $scope.status = "No Connection";
        $scope.flag = false;
        SocketService.on('connect', function(){
            // console.log('Connected');
            $scope.status = "Connected";
            // SocketService.emit("get workflow");
        });

        SocketService.on('disconnect',function(){
            $scope.status = "No Connection"
        });

        SocketService.on('workflow', function(data){

            // $scope.operationName = data.operations;
            // $scope.operationCode = data.operationCode;
            // $scope.instrument = data.instrument;
            // $scope.instrumentCode = data.instrumentCode;
            $scope.data = data;
            console.log("already");
            console.log($scope.data.operationName);
            $scope.flag = true;
        });

        SocketService.on('message', function(data){
            // console.log(data);
            $scope.status = "Connected";
            var myChart = echarts.init(document.getElementById('main'));
            myChart.showLoading();
            // 指定图表的配置项和数据
            var option = {
                title: {
                    text: $scope.text
                },
                tooltip: {},
                legend: {
                    data:['params']
                },
                xAxis: {
                    data: []
                },
                yAxis: {},
                series: [{
                    name: '销量',
                    type: 'line',
                    data: data.data
                }]
            };

            // 使用刚指定的配置项和数据显示图表。
            myChart.setOption(option);
            myChart.hideLoading();
        });


        $scope.isolator = {
            name: "出料区",
            env_names: ["温度","湿度","压力","风速","过氧化氢浓度"],
            env_codes:["1","2","3","4","5"],
            env_status:[1,1,1,1,1],
            instr_names:[
                "进料区灭菌器",
                "进料待加工区灭菌器",
                "加工区灭菌器",
                "待出料区灭菌器",
                "出料区灭菌器",
                "进料区与进料待加工区之间的门",
                "进料区导轨",
                "加工区导轨",
                "出料区导轨",
                "待出料区与出料区之间的门",
                "机械臂"
            ],
            instr_codes:[
                "1","2","3","4","5","6","7","8","9","10","11"
            ],
            instr_status:[
                "1","2","3","4","5","6","7","8","9","10","11"
            ]


        };
        $scope.incubator = {
            name: "培养箱",
            env_names: ["培养箱温度"],
            env_codes:["1"],
            env_status: ["35 ℃"],
            instr_names:[
                "培养箱门",
                "上层外圈转盘",
                "上层内圈转盘",
                "下层外圈转盘",
                "下层内圈转盘",
                "顶空电源",
                "视觉光源",
                "工业相机",
                "顶空分析",
                "支架电机"
            ],
            instr_codes:["1","2","3","4","5","6","7","8","9","10"],
            instr_status:[
                "1","2","3","4","5","6","7","8","9","10"
            ]
        };

        $scope.printcode = function(code,name){
            // console.log(code);
            SocketService.emit('get params',code);
            $scope.text = name;
        }

        $scope.getWorkflow = function(){
            SocketService.emit('get workflow',"1");
            console.log("emited")
        }
    }])

// 主菜单栏(个人信息)--张桠童
.controller('MainCtrl',['$scope','CONFIG','Storage','Data','UserService','NgTableParams','$state',
  function($scope,CONFIG,Storage,Data,UserService,NgTableParams,$state){
    $scope.userInfo = {};
    var userInfoQuery = {
        "UserId": Storage.get('UID'),
        "Identify": 0,
        "PhoneNo": 0,
        "UserName": 1,
        "Role": 1,
        "Password": 0,
        "LastLoginTime": 1,
        "RevisionInfo": 0
    };
    var promise = UserService.GetUserInfo(userInfoQuery);
    promise.then(function(data){
        $scope.userInfo = data;
        // console.log($scope.userInfo);
    },function(err){});
    $scope.toChangePW = function(){
        $state.go('changePassword');
    };
    $scope.ifOut = function(){
        $('#myModal1').modal('show');
    };
    $scope.toLogin = function(){
        $('#myModal1').modal('hide').on('hidden.bs.modal', function () {
            Storage.rm("UID");
            $state.go("login");
        });
    };
}])
// 样品信息表--张桠童
.controller('samplingCtrl',['$scope','CONFIG','Storage','Data','ItemInfo','NgTableParams','$state',
  function($scope,CONFIG,Storage,Data,ItemInfo,NgTableParams,$state){
    var sampleQuery = {"ObjectNo": null,
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
        "GetWarning": 1,
        "GetSamSave": 1,
        "GetRevisionInfo": 1};
    var promise = ItemInfo.GetSamplesInfo(sampleQuery);
    promise.then(function(data){
        var sampleInfo = data;
        // console.log(sampleInfo);
        $scope.tableParams = new NgTableParams({
                count:5
            },
            {   counts:[],
                dataset: sampleInfo
            });
    },function(err){});
    $scope.toTestResult = function(ObjectNo,ObjCompany,ObjIncuSeq){
      $state.go('main.data.testResult');
      Storage.set('ObjectNo', ObjectNo);
      Storage.set('ObjCompany', ObjCompany);
      Storage.set('ObjIncuSeq', ObjIncuSeq);
    }
}])
// 检测结果表--张桠童
.controller('testResultCtrl',['$scope','CONFIG','Storage','Data','Result','NgTableParams','$timeout','$state',
  function($scope,CONFIG,Storage,Data,Result,NgTableParams,$timeout,$state){
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
      "GetReStatus": 1,
      "GetRePeople": 1,
      "GetReTime": 1,
      "GetRevisionInfo": 1
    };
    if (Storage.get('ObjectNo')==null) {
      var promise = Result.GetTestResultInfo(testResultQuery);
      promise.then(function(data){
          var testResult = data;
          // console.log(testResult);
          $scope.tableParams = new NgTableParams({
                count:5,
            },
            {   counts:[],
                dataset: testResult
            });
      },function(err){});
    }
    else{
      var promise = Result.GetTestResultInfo(testResultQuery);
      promise.then(function(data){
          var testResult = data;
          // console.log(testResult);
          $scope.tableParams = new NgTableParams({
                count:5,
                filter:{ ObjectNo: Storage.get('ObjectNo'),
                         ObjCompany: Storage.get('ObjCompany'),
                         ObjIncuSeq: Storage.get('ObjIncuSeq')
                        },
                sorting:{CollectStart:"desc"}
                // 升序："asc"；降序："desc"
            },
            {   counts:[],
                dataset: testResult
            });
          $timeout(function(){
            // console.log($scope.tableParams.data.length);
            if($scope.tableParams.data.length>0 && $scope.tableParams.data[0].TestResult==null){
              $('#myModal').modal('show');
            };
          });
      },function(err){});
      $scope.toMonitors = function(){
        $('#myModal').modal('hide').on('hidden.bs.modal', function () {
            $state.go('main.monitors.realTime');
        });
      };
    }
}])
// 试剂信息表--张桠童
.controller('reagentCtrl',['$scope','CONFIG','Storage','Data','ItemInfo','NgTableParams',
  function($scope,CONFIG,Storage,Data,ItemInfo,NgTableParams){
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
        "GetExpiryDay": 1,
        "GetReagentName": 1,
        "GetReagentTest": 1,
        "GetSaveCondition": 1,
        "GetDescription": 1,
        "GetRevisionInfo": 1
    };
    var promise = ItemInfo.GetReagentsInfo(ReagentsQuery);
    promise.then(function(data){
        var Reagents = data;
        // console.log(Reagents);
        $scope.tableParams = new NgTableParams({
                count:5
            },
            {   counts:[],
                dataset: Reagents
            });
    },function(err){});
}])
// 仪器信息表--张桠童
.controller('instrumentCtrl',['$scope','CONFIG','Storage','Data','ItemInfo','NgTableParams',
  function($scope,CONFIG,Storage,Data,ItemInfo,NgTableParams){
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
    promise1.then(function(data){
        var Isolators = data;
        // console.log(Isolators);
        $scope.tableParams1 = new NgTableParams({
                count:5
            },
            {   counts:[],
                dataset: Isolators
            });
    },function(err){});
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
    promise2.then(function(data){
        var Incubators = data;
        // console.log(Incubators);
        $scope.tableParams2 = new NgTableParams({
                count:5
            },
            {   counts:[],
                dataset: Incubators
            });
    },function(err){});
}])

