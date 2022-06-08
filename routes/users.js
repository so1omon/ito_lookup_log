var express = require('express');
var router = express.Router();
var db=require('mysql2-promise')();
var db_config=require('../db_config');
var lib=require('../js/lib');
db.configure(db_config['mysql']);
sql=`SELECT emp_id FROM connect.hr_info WHERE (emp_grade_nm = '4급' AND duty_nm='팀장') 
OR (EMP_GRADE_NM in ('1급', '2급', '3급'))`;

var exception_list;

function get_exception_list(){
  
  db.query(sql).spread(function(rows){ //세션 수 조회
    result=JSON.parse(JSON.stringify(rows));
    for(i in result){
      result[i]=result[i]["emp_id"]
    }
    return result;
  }).then((result)=>{
    exception_list=result;
  }).catch((error)=>{
    console.log(error);
  })
}

get_exception_list();

router.get('/login/:emp_id', async function(req, res){
  /*
    최초 세션 테이블에서 세션 갯수 확인 및 직원 정보가 일치하면 세션 생성해주고
    main page로 redirect
  */
  if((req.header('User-Agent').indexOf('Chrome') || req.header('User-Agent').indexOf('Firefox'))==-1){
    console.log('IE 감지')
    res.redirect('/users/error');
  }else{
    sql='select count(*) as session_num from good.session_lookup_log' 
    db.query(sql).spread(function(rows){ //세션 수 조회
      if(JSON.parse(JSON.stringify(rows))[0]['session_num']>=50){
        // 접속 중인 세션이 5개 이상이면 접속 차단 후 404 error (with msg) 보냄 
        res.status(404).send('접속 중인 사용자가 너무 많습니다. 잠시 후에 시도해주세요.');
      }
    })
    // 넘겨받은 emp_id로 직원 정보 조회
    sql=`select EMP_ID, EMP_NM, ORG_NM from connect.hr_info where emp_id=${req.params.emp_id}`;
    db.query(sql).spread(function(rows){ // 넘겨받은 emp_id로 직원 정보 조회
      if (JSON.parse(JSON.stringify(rows)).length==1){
        console.log(`${req.params.emp_id}님의 직원정보가 존재합니다.`);
        req.session.data=JSON.parse(JSON.stringify(rows));
        req.session.isAdmin=false;
        req.session.save(()=>{
          console.log('세션 생성 완료!');
          /*3. '/user/main/으로 redirect */
          res.redirect('/users/main')
        });
      } else{
        res.send('직원정보가 존재하지 않음'); // 추후 수정
      };
    })
  }
});

router.get('/main', function(req, res) { //
  /*
    메인 페이지
    1. 세션 정보를 페이지단으로 넘겨주기(ejs) 또는 세션정보를 바탕으로 페이지 내부(client)에서 처리
    2. 출퇴근 기록 조회 | 급량비 및 초과근무 기록 조회의 2개의 tab으로 구성
    이후 main page 리턴
  */
  if(req.session.data){ // 세션 정보 있는지 확인
    res.render('main',{list:req.session.data[0]})
  }else res.status(404).send('세션 정보 없음'); //추후 수정
  });

router.post('/inout',function(req, res){
  /*
    출퇴근 기록 조회 
    filter 안에 있는 내용(사번, 부서, interval)을 기반으로 중계DB의 connect.ehr_cal에서 값을 가져오는 쿼리를 실행
    이후 res.json으로 리턴
  */
  if(!req.session.data){ // 세션정보 존재하지 않으면 오류 표출
    res.status(404).send('세션 정보 없음'); //추후 수정
  }

  const {emp_id, start_day, end_day}=req.body; // 넘겨준 데이터를 변수에 저장 (사번, 기간)

  sql='select EMP_ID, NAME, ORG_NM, YMD, WORK_TYPE, FIX1, `INOUT`, PLAN1, ERROR_INFO from connect.ehr_cal ' +
  'where emp_id=? and ymd>=? and ymd<=? order by YMD'; // 특정 기간 내의 직원 출퇴근 기록을 날짜 순으로 정렬

  db.query(sql,[emp_id, start_day, end_day]).spread(function(rows){ // 넘겨받은 emp_id로 직원 정보 조회
    result=JSON.parse(JSON.stringify(rows));
    for(line of result){
      line["INOUT"]=line["INOUT"].split('~').map(str=>{
        if(str==''){
            return '';
        }
        return str.substring(0,2)+':'+str.substring(2)
      }).join('~')
      if(line["FIX1"]!='ERROR'){
        line["FIX1"]=line["FIX1"].split('~').map(str=>{
          if(str==''){
              return '';
          }
          return str.substring(0,2)+':'+str.substring(2)
        }).join('~')
      }else{
        line["FIX1"]='수기 계산 필요';
      }
      if(line["PLAN1"]!='None'){
        line["PLAN1"]=line["PLAN1"].split('~').map(str=>{
          if(str==''){
              return '';
          }
          return str.substring(0,2)+':'+str.substring(2)
        }).join('~')
      }else{
        line["PLAN1"]='~';
      }
      if(line["ERROR_INFO"]=='None'){
        line["ERROR_INFO"]='';
      }
      
    }
    return result;
  }).then(result=>{
    console.log(result);
    res.json(result);
  });
});

router.post('/overtime',async function(req, res){
  /*
    급량비 및 초과근무 기록 조회
    filter 안에 있는 내용(사번, 부서, 연월 정보)을 기반으로 중계DB의 connect.ehr_cal에서 값을 가져오는 쿼리를 실행
    최초에 해당 연월에 해당하는 ehr_cal 데이터 행 수와 날짜를 기준으로 몇주차까지 완전하게 계산가능한지 판별하고
    각 주차별로 초과근무, 급량비 내역 표출 및 월별 합산해서 표출할 수 있는 데이터 set 생성
    이후 res.json으로 리턴
  */ 
  if(!req.session.data){ // 세션정보 존재하지 않으면 오류 표출
    res.status(404).send('세션 정보 없음'); //추후 수정
  }
  const {emp_id, start_day, end_day}=req.body;
  var temp_overtime='0000'; // 임시 초과근무 저장변수 (월별)
  var temp_overtime_week='0000' // 임시 초과근무 저장변수 (주별)
  var temp_week; // 임시 주차 저장변수

  sql='SELECT a.EMP_ID AS EMP_ID, a.`NAME` AS `NAME`, a.YMD AS YMD, a.CAL_OVERTIME AS CAL_OVERTIME, a.CAL_MEAL AS CAL_MEAL,' +
  ' a.`INOUT` AS `INOUT`,'+
  ` b.over_std_time AS over_std_time from connect.ehr_cal a LEFT JOIN (SELECT EMP_ID, over_std_time FROM connect.gw_ehr_con)b`+
  ` ON a.EMP_ID=b.EMP_ID`+
  ` where a.emp_id=? and a.YMD>=? and a.YMD<=? and (a.CAL_OVERTIME!='0000' OR a.CAL_MEAL!='FALSE') order by YMD`;

  db.query(sql,[emp_id, start_day, end_day]).spread(function(rows){ // 넘겨받은 emp_id로 직원 정보 조회
    
    result=JSON.parse(JSON.stringify(rows));
    new_result={
      "empInfo":[], // 일별 데이터
      "endOfWeek": lib.weekOfMonth(end_day) // 마지막 주 정보
    }
    var row=0;
    //over_std_time=0이면 그냥 넘기기

    console.log(exception_list)
    while(row<result.length){
      result[row]['CUTOFF']=false;
      result[row]['EXCEPT']=false;
      result[row]['WEEK']=lib.weekOfMonth(result[row]['YMD']);
      if(row==0){
        temp_week=result[row]['WEEK'];
      }else{
        if(temp_week!=result[row['WEEK']]){
          temp_overtime_week='0000';
          temp_week=result[row]['WEEK'];
        }
      }
    
      if(exception_list.indexOf(result[row]['EMP_ID'])!=-1){
        result[row]['over_std_time']=0;
        result[row]['EXCEPT']=true;
        row++;
        continue;
      }
      if(temp_overtime==(parseInt(result[row]["over_std_time"])*100).toString()){//초과근무 꽉 채우면 모두 drop
        result.splice(row, 1);
        console.log('열 삭제')
        continue;
      }
      
      temp_overtime=lib.addOverTime2(temp_overtime, result[row]["CAL_OVERTIME"]);
      temp_overtime_week=lib.addOverTime2(temp_overtime_week, result[row]["CAL_OVERTIME"]);
      if(temp_overtime_week>`1200`){// (주별 12h) 초과근무 한계 넘어간경우
        console.log('cutoff 발생')
        result[row]['CUTOFF']=true;
        result[row]["CAL_OVERTIME"]=lib.subOverTime(result[row]["CAL_OVERTIME"],lib.subOverTime(temp_overtime_week,`${result[row]["over_std_time"]}00`))
        
        temp_overtime_week='0000';
        //급량비 TRUE이면
        // 주말데이터면 2시간 넘겨야 급량비 TRUE
        // 평일이면 1시간 넘겨야 급량비 TRUE

        if(result[row]["CAL_MEAL"]=="TRUE"){
          if(lib.yyyymmddToDay(result[row]["YMD"])==0 || lib.yyyymmddToDay(result[row]["YMD"])==6){
            if(result[row]["CAL_OVERTIME"]<'0200'){
              result[row]["CAL_MEAL"]="FALSE";
            }
          }else{
            if(result[row]["CAL_OVERTIME"]<'0100'){
              result[row]["CAL_MEAL"]="FALSE";
            }
          }
        }
      }

      if(temp_overtime>`${result[row]["over_std_time"]}00`){// (월별) 초과근무 한계 넘어간경우
        console.log('cutoff 발생')
        result[row]['CUTOFF']=true;
        result[row]["CAL_OVERTIME"]=lib.subOverTime(result[row]["CAL_OVERTIME"],lib.subOverTime(temp_overtime,`${result[row]["over_std_time"]}00`))
        temp_overtime=`${result[row]["over_std_time"]}00`;
        //급량비 TRUE이면
        // 주말데이터면 2시간 넘겨야 급량비 TRUE
        // 평일이면 1시간 넘겨야 급량비 TRUE

        if(result[row]["CAL_MEAL"]=="TRUE"){
          if(lib.yyyymmddToDay(result[row]["YMD"])==0 || lib.yyyymmddToDay(result[row]["YMD"])==6){
            if(result[row]["CAL_OVERTIME"]<'0200'){
              result[row]["CAL_MEAL"]="FALSE";
            }
          }else{
            if(result[row]["CAL_OVERTIME"]<'0100'){
              result[row]["CAL_MEAL"]="FALSE";
            }
          }
        }
      }
      row++;
    }
    new_result["empInfo"]=result

    new_result=JSON.parse(JSON.stringify(new_result));
    
    
    res.json(new_result);
  }).catch((err)=>{
    console.log(err);
  });
});

router.post('/cal_meal',function(req, res){
  /*
    급량비 및 초과근무 기록 조회
    filter 안에 있는 내용(사번, 부서, 연월 정보)을 기반으로 중계DB의 connect.ehr_cal에서 값을 가져오는 쿼리를 실행
    최초에 해당 연월에 해당하는 ehr_cal 데이터 행 수와 날짜를 기준으로 몇주차까지 완전하게 계산가능한지 판별하고
    각 주차별로 초과근무, 급량비 내역 표출 및 월별 합산해서 표출할 수 있는 데이터 set 생성
    이후 res.json으로 리턴
  */ 
  if(!req.session.data){ // 세션정보 존재하지 않으면 오류 표출
    res.status(404).send('세션 정보 없음'); //추후 수정
  }
  const {dept_name, start_day, end_day}=req.body;
  var tempEmpId; // 임시저장사번 
  var temp_overtime='0000'; // 임시저장초과근무시간

  // sql='select EMP_ID, `NAME`, ORG_NM, YMD, CAL_OVERTIME, CAL_MEAL from connect.ehr_cal where org_nm=? and ymd>=? and ymd<=?';
  sql='SELECT a.EMP_ID AS EMP_ID, a.`NAME` AS `NAME`, a.YMD AS YMD, a.CAL_OVERTIME AS CAL_OVERTIME, a.CAL_MEAL AS CAL_MEAL, a.ORG_NM as ORG_NM,' +
  ' a.`INOUT` AS `INOUT`,'+
  ` b.over_std_time AS over_std_time from connect.ehr_cal a LEFT JOIN (SELECT EMP_ID, over_std_time FROM connect.gw_ehr_con)b`+
  ` ON a.EMP_ID=b.EMP_ID`+
  ` where a.ORG_NM=? and a.YMD>=? and a.YMD<=? and (a.CAL_OVERTIME!='0000' OR a.CAL_MEAL!='FALSE') order by YMD`;
  
  db.query(sql,[dept_name, start_day, end_day]).spread(function(rows){ // 넘겨받은 emp_id로 직원 정보 조회
    result=JSON.parse(JSON.stringify(rows));
    console.log(result);
    new_result={
      "empInfo":[], // 일별 데이터
      "endOfWeek": lib.weekOfMonth(end_day) // 마지막 주 정보
    }
    var row=0;
    while(row<result.length){
      result[row]['WEEK']=lib.weekOfMonth(result[row]['YMD']);
      

      if(row==0){// 사번 맨처음 넣기
        tempEmpId=result[row]['EMP_ID'];
      }else if(tempEmpId!=result[row]['EMP_ID']){
        tempEmpId=result[row]['EMP_ID'];
        temp_overtime='0000'
      }
      if(result[row]['over_std_time']==0){
        row++;
        continue;
      }
      if(temp_overtime==(parseInt(result[row]["over_std_time"])*100).toString()){//초과근무 꽉 채우면 모두 drop
        result.splice(row, 1);
        continue;
      }
      temp_overtime=lib.addOverTime2(temp_overtime, result[row]["CAL_OVERTIME"]);
      if(temp_overtime>`${result[row]["over_std_time"]}00`){//초과근무 한계 넘어간경우
        result[row]["CAL_OVERTIME"]=lib.subOverTime(result[row]["CAL_OVERTIME"],lib.subOverTime(temp_overtime,`${result[row]["over_std_time"]}00`))
        temp_overtime=`${result[row]["over_std_time"]}00`;

        if(result[row]["CAL_MEAL"]=="TRUE"){
          if(lib.yyyymmddToDay(result[row]["YMD"])==0 || lib.yyyymmddToDay(result[row]["YMD"])==6){
            if(result[row]["CAL_OVERTIME"]<'0200'){
              result[row]["CAL_MEAL"]="FALSE";
            }
          }else{
            if(result[row]["CAL_OVERTIME"]<'0100'){
              result[row]["CAL_MEAL"]="FALSE";
            }
          }
        }
      }
      row++;
    }
    console.log(result);
    new_result["empInfo"]=result
    new_result=JSON.parse(JSON.stringify(new_result));

    res.json(new_result);
  }).catch((err)=>{
    console.log(err);
  });
});

router.get('/error',function(req,res){
  res.send('<p>Internet Explorer에서 지원하지 않습니다.</p>');
});

module.exports=router;