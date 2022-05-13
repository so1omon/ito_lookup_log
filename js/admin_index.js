document.write("<script src='../js/index_lib.js'></script>");
$(document).ready(function(){

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

    // EXCEL DOWNLOAD 버튼은 조회버튼을 눌렀을 때만 활성화
    $('.inout-download').prop('disabled', true);
    $('.cal-download').prop('disabled', true);

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

     //출퇴근기록 조회버튼
     $('#check-search').on('click',function(){
        alert("조회하기");
        var emp_name = $('.empName').eq(0).val();
        var emp_id = $('.empID').eq(0).val();
        var org_nm = $('.select-dept').eq(0).val();
        console.log(org_nm);
        var type = 'inout';
        var start_day = $('#admin_datepicker1').val().replace(/\-/g,'');;
        var end_day = $('#admin_datepicker2').val().replace(/\-/g,'');;
        if(!validateInterval(start_day,end_day))
        {
            alert('기간을 다시 설정해주세요.');
            $('#admin_datepicker1').val('');
            $('#admin_datepicker2').val('');
            
        }else{
            $('#check-search').prop('disabled', true);
            var info = {'emp_name':emp_name,'emp_id':emp_id,'org_nm':org_nm,'start_day':start_day,'end_day':end_day};
            // ajax로 날짜 두개, 사번 드림
            $.ajax({
                type:"GET",
                url:`/admin/ehr/${type}`,
                data:info,
                success:function(result){
                    console.log("success");
                    console.log(result);
                    var list =[];
                    for(var i=0;i<result.length;i++)
                    {
                        day = (result[i].YMD).replace(/(\d{4})(\d{2})(\d{2})/g, '$1-$2-$3');
                        var week = ['일', '월', '화', '수', '목', '금', '토'];
                        var dayOfWeek = week[new Date(day).getDay()];

                        list.push({
                            "No":`${i+1}`,
                            "사번":result[i]['EMP_ID'],
                            "이름": result[i].NAME,
                            "날짜": day, 
                            "요일": dayOfWeek,
                            "근무유형":workTypeDict[`${result[i].WORK_TYPE}`],
                            "출입시각":result[i].INOUT,
                            "확정시각":result[i].FIX1,
                            "계획시간":result[i].PLAN1
                        })
                    }
                
                    $(".inout-table").jsGrid({
                        width: "100%",
                        height: "100%",
                        sorting: true,
                        paging: true,
                        data: list,
                        pageSize: 15,
                        pageButtonCount: 5,
                        fields: [
                            { name: "No", type: "text",width:"35px"},
                            { name: "사번", type: "text"},
                            { name: "이름", type: "text"},
                            { name: "날짜", type: "text"},
                            { name: "요일", type: "text"},
                            { name:"근무유형", type:"text"},
                            { name:"출입시각", type:"text"},
                            { name:"확정시각", type:"text"},
                            { name:"계획시간", type:"text"}
            
                        ]
                    })
                    $('a:contains("1")').click();
                    $('a:contains("First")').click();
                    // res로 받은 정보들을 list에 넣음 
                    $('#check-search').prop('disabled', false);
                }
            }).then(()=>{$('.inout-download').prop('disabled', false);});

            
        }
    });

    //급량비 조회버튼 - 기간 관련해서 수정
    $('#check-cal-search').on('click',function(){
        alert("조회하기");
        var emp_name = $('.empName').eq(1).val();
        console.log(emp_name);
        var emp_id = $('.empID').eq(1).val();
        var org_nm = $('.select-dept').eq(1).val();
        var type = 'cal_meal';      //급량비 조회
        var date = $('#admin_monthpicker1').val();
        const year = date.split('-')[0];
        const month = date.split('-')[1];
        var [start_day,end_day] = monthPicktoString(date);

        
        $('#check-cal-search').prop('disabled', true);
        var info = {'emp_name':emp_name,'emp_id':emp_id,'org_nm':org_nm,'start_day':start_day,'end_day':end_day};
        // ajax로 날짜 두개, 사번 드림
        $.ajax({
                type:"GET",
                url:`/admin/ehr/${type}`,
                data:info,
                success:function(result){
                    console.log("cal success");
                    console.log(result);
                    $('.summary-table').css('display','inline-table');
               
                    // table생성 (end_of_week에 따라서)
                    $('.week-tr').html('');
                    $('.week-overtime').html('');
                    $('.week-cal').html('');
                    for(var i=0;i<result.endOfWeek;i++)
                    {
                        $('.week-tr').append(`<th scope="col" class="${i+1}-week">${i+1}주차</th>`)
                        $('.week-overtime').append(`<th scope="col" class="${i+1}-overtime">${i+1}주차</th>`)
                        $('.week-cal').append(`<th scope="col" class="${i+1}-cal">${i+1}주차</th>`)
                    }
                    $('.week-tr').append(`<th scope="col">합산</th>`)
                    $('.week-overtime').append(`<th scope="col" class="over-sum">초과근무합산</th>`)
                    $('.week-cal').append(`<th scope="col" class="cal-sum">급량비합산</th>`)
                    $('.week-tr>.1-week').before(`<th scope="col" class="date"></th>`)
                    $('.week-tr>.date').html(`${year}년 ${month}월`);
                    $('.week-overtime>.1-overtime').before(`<th scope="row" >초과근무</th>`)
                    $('.week-cal>.1-cal').before(`<th scope="row" >급량비</th>`)

                    //각 주차에 대해 overtime,급량비 계산
                    
                    var overtime = {1:[],2:[],3:[],4:[],5:[],6:[]};
                    var cal_meal = {1:0,2:0,3:0,4:0,5:0,6:0};
                    var now_week = result.empInfo[0].WEEK;  //1주차에 대해서
                    for(var m=0;m<result.empInfo.length;m++)
                    {
                        // WEEK에 따라서 나누기
                        //급량비가 1주에 급량비 True몇개인지 * 8000
                        
                        if (result.empInfo[m].WEEK==now_week){
                            overtime[`${now_week}`].push(result.empInfo[m].CAL_OVERTIME);
                            if(result.empInfo[m].CAL_MEAL=="TRUE"){
                                // 트루이면 cal_meal에 넣기
                                cal_meal[`${now_week}`]=cal_meal[`${now_week}`]+1;
                            }
                        }
                        else{
                            now_week = result.empInfo[m].WEEK;
                            overtime[`${now_week}`].push(result.empInfo[m].CAL_OVERTIME);
                            if(result.empInfo[m].CAL_MEAL=="TRUE"){
                                // 트루이면 cal_meal에 넣기
                                cal_meal[`${now_week}`]=cal_meal[`${now_week}`]+1;
                            }
                        }
                    }
                    const overTimeTotal = addOverTimeTotal(overtime);   //분으로 나타내짐
                    var over_sum = 0;    
                    Object.values(overTimeTotal).forEach(function(ele,idx){
                        over_sum=over_sum+parseInt(ele);
                        ele_overtime =  hhmmToString(ele);
                        $(`.${idx+1}-overtime`).html(ele_overtime);
                    });
                    //초과근무 합산
                    over_sum = hhmmToString(over_sum);
                    $('.over-sum').html(over_sum);

                    var cal_sum=0;
                    Object.values(cal_meal).forEach(function(ele,idx){
                        //{'1':0,'2':3,...}
                        cal_count = ele*8000;
                        cal_sum+=cal_count;
                        const cal_string = (cal_count).toLocaleString('ko-KR');
                        $(`.week-cal>.${idx+1}-cal`).html(cal_string);
                    });

                    //급량비 합산
                    $('.week-cal>.cal-sum').html(cal_sum.toLocaleString('ko-KR'));
                    $('#check-overtime').prop('disabled', false);


                    var list =[];
                    for(var i=0;i<result.length;i++)
                    {
                        day = (result[i].YMD).replace(/(\d{4})(\d{2})(\d{2})/g, '$1-$2-$3');
                        var week = ['일', '월', '화', '수', '목', '금', '토'];
                        var dayOfWeek = week[new Date(day).getDay()];

                        list.push({
                            "No":`${i+1}`,
                            "사번":result[i]['EMP_ID'],
                            "이름": result[i].NAME,
                            "부서명":result[i].ORG_NM,
                            "날짜": day, 
                            "요일": dayOfWeek,
                            "초과근무시간": hhmmToString2(result[i].CAL_OVERTIME),
                            "급량비유무": (result[i].CAL_MEAL=="TRUE") ? "O" : "X"
                        });

                    }
                
                    $(".detail-table").jsGrid({
                        width: "100%",
                        height: "100%",
                        sorting: true,
                        paging: true,
                        data: list,
                        pageSize: 15,
                        pageButtonCount: 5,
                        fields: [
                            { name: "No", type: "text",width:"35px"},
                            { name: "사번", type: "text"},
                            { name: "이름", type: "text"},
                            { name: "부서명", type: "text"},
                            { name: "날짜", type: "text"},
                            { name: "요일", type: "text"},
                            { name: "초과근무시간", type: "text"},
                            { name: "급량비유무", type: "text"}
                        ]
                    })
                    $('a:contains("1")').click();
                    $('a:contains("First")').click();
                    // res로 받은 정보들을 list에 넣음 
                    $('#check-cal-search').prop('disabled', false);
                }
            }).then(()=>{$('.inout-download').prop('disabled', false);});
        
    });

});

