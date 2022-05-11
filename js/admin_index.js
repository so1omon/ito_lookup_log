document.write("<script src='../js/index_lib.js'></script>");
$(document).ready(function(){

    //부서 list 출력

    // 로그아웃 버튼 
    $('#logout-button').click(function(){
        alert('로그아웃');
        $.ajax({
            type:"GET",
            url:"/admin/logout",
            success:function(data){
                console.log("success");
                location.replace('/users/main');
            }
        })
    })

    //조회버튼
    $('#check-search').on('click',function(){
        alert("조회하기");
        var emp_name = $('#empName').val();
        var emp_id = $('#empID').val();
        var org_nm = $('#select-dept').val();
        var type = 'inout';
        var start_day = $('#admin_datepicker1').val().replace(/\-/g,'');;
        var end_day = $('#admin_datepicker2').val().replace(/\-/g,'');;
        if(!validateInterval(start_day,end_day))
        {
            alert('기간을 다시 설정해주세요.');
            $('#admin_datepicker1').val('');
            $('#admin_datepicker2').val('');
            
        }else{
            $('#check-inout').prop('disabled', true);
            var info = {'emp_name':emp_name,'emp_id':emp_id,'org_nm':org_nm,'start_day':start_day,'end_day':end_day};
            // ajax로 날짜 두개, 사번 드림
            $.ajax({
                type:"GET",
                url:`/admin/ehr/${type}`,
                data:info,
                success:function(result){
                    console.log("success");
                    console.log(result);
                }
            });
        }
    });


    $.datepicker.setDefaults({
        dateFormat: 'yy-mm-dd'
        ,showOtherMonths : true
        ,changeYear:true
        ,changeMonth:true
        ,minDate:"-6M",
        maxDate:"+0D",
        prevText: '이전 달',
        nextText: '다음 달',
        monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
        monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
        dayNames: ['일', '월', '화', '수', '목', '금', '토'],
        dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
        dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'],
        showMonthAfterYear: true,
        yearSuffix: '년'
    });
    $(function() {
        $("#admin_datepicker1, #admin_datepicker2").datepicker();
    });
    var currentYear = (new Date()).getFullYear();
    var currentMonth = (new Date()).getMonth();
    var startYear = currentYear-5;
    var options = {
            startYear: startYear,
            finalYear: currentYear,
            pattern: 'yyyy-mm',
            monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

    };
    $('#admin_monthpicker1').monthpicker(options);
    $('#admin_monthpicker2').monthpicker(options);

    //미래 월은 비활성화시키기
    var months=[];
    for(var i=currentMonth+2,j=0;i<=12;i++){
        months[j++]=i;
    }
    for(var i=0;i<$('#admin_monthpicker1').length;i++){
        $($('#admin_monthpicker1')[i]).monthpicker("disableMonths",months);
        $($('#admin_monthpicker2')[i]).monthpicker("disableMonths",months);
        $($('#admin_monthpicker1')[i]).monthpicker().bind('monthpicker-change-year',function(e,year){
            var item = $(e.currentTarget);
            if(year==currentYear){
                $(item).monthpicker('disableMonths',months);
            }
            else{
                $(item).monthpicker('disableMonths',[]);
            }
        });
        $($('#admin_monthpicker1')[i]).monthpicker().bind('monthpicker-change-year',function(e,year){
            var item = $(e.currentTarget);
            if(year==currentYear){
                $(item).monthpicker('disableMonths',months);
            }
            else{
                $(item).monthpicker('disableMonths',[]);
            }
        });
    }

});
