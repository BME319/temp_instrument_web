angular.module('filters', [])


    .filter('timeFormat', [function() {
        return function(date, format) {
            var d = new Date(date)
            var ret = ''
            if (date == null ||date == '0001-01-01T00:00:00') { return '-' }
            switch (format) {
                case 'YYYY-MM-DD':
                    ret = d.getFullYear() + '-' + (Array(2).join('0') + (d.getMonth() + 1)).slice(-2) + '-' + (Array(2).join('0') + d.getDate()).slice(-2)
                    break
                case 'MM-DD-YYYY':
                    ret = (Array(2).join('0') + (d.getMonth() + 1).slice(-2)) + '-' + (Array(2).join('0') + d.getDate()).slice(-2) + '-' + d.getFullYear()
                    break
                case 'YYYY-MM-DD h:m':
                    ret = d.getFullYear() + '-' + (Array(2).join('0') + (d.getMonth() + 1)).slice(-2) + '-' + (Array(2).join('0') + d.getDate()).slice(-2) + ' ' + (Array(2).join('0') + d.getHours()).slice(-2) + ':' + (Array(2).join('0') + d.getMinutes()).slice(-2)
                    break
                case 'YYYY-MM-DD h:m:s':
                    ret = d.getFullYear() + '-' + (Array(2).join('0') + (d.getMonth() + 1)).slice(-2) + '-' + (Array(2).join('0') + d.getDate()).slice(-2) + ' ' + (Array(2).join('0') + d.getHours()).slice(-2) + ':' + (Array(2).join('0') + d.getMinutes()).slice(-2)+ ':' + (Array(2).join('0') + d.getSeconds()).slice(-2)
                    break
                
            }
            return ret
        }
    }])

    .filter('filterStatus', [function() {
        return function(status) {
            var s = '未开始'
            if (status == 0) { s = '已完成' }
            if (status == 1) { s = '正在进行中' }
            if (status == 2) { s = '未完成' }
            return s
        }
    }])

    .filter('filterTimes', [function() {
        return function(ms) {
            var t = '未开始'
            if (ms < 0) { t = '未开始' }
            if (ms >= 0) {
                var days = Math.floor(ms / (24 * 3600 * 1000))
                var leave1 = ms % (24 * 3600 * 1000)
                var hours = Math.floor(leave1 / (3600 * 1000))
                var leave2 = leave1 % (3600 * 1000) //计算小时数后剩余的毫秒数  
                var minutes = Math.floor(leave2 / (60 * 1000))
                //计算相差秒数  
                var leave3 = leave2 % (60 * 1000) //计算分钟数后剩余的毫秒数  
                var seconds = Math.round(leave3 / 1000)
                t = days + "天 " + hours + "小时 " + minutes + " 分钟"
            }
            return t
        }
    }])