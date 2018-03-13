angular.module('filters', [])


    .filter('timeFormat', [function() {
        return function(date, format) {
            var d = new Date(date)
            var ret = ''
            if (date == null) { return '-' }
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
            }
            return ret
        }
    }])

.filter('filterStatus', [function () {
  return function (status) {
    var s = '未开始'
    if (status == 0) { s = '已完成' }
    if (status == 1) { s = '正在进行中' }
    if (status == 2) { s = '未完成' }
    return s
  }
}])