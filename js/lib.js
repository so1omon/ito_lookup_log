var moment=require('moment');
var fs=require('fs');
const xl = require('excel4node');

function jsonize(object){
    return JSON.parse(JSON.stringify(object));
}

const workTypeDict={
    '0010':'시차출퇴근(7~16)', '0011':'시차출퇴근(7:30~16:30)', '0020':'시차출퇴근(8~17)',
    '0021':	'시차출퇴근(8:30~17:30)', '0030':'기본출퇴근(9~18)', '0031':'시차출퇴근(9:30~18:30)',
    '0040':	'시차출퇴근(10~19)', '0050':'평일', '0060':'휴일', '0070':'육아근로단축(7-15)',
    '0080':'육아근로단축(7-14)', '0090':'육아근로단축(7-13)', '0100':'육아근로단축(8-16)',
    '0110':'육아근로단축(8-15)', '0120':'육아근로단축(8-14)', '0130':'육아근로단축(9-17)',
    '0140':'육아근로단축(9-16)', '0150':'육아근로단축(9-15)', '0160':'육아근로단축(10-18)',
    '0170':'육아근로단축(10-17)', '0180':'육아근로단축(10-16)', '0190':'근로단축(7-14)',
    '0200':'근로단축(7-13)', '0210':'근로단축(8-15)', '0220':'근로단축(8-14)',
    '0230':'근로단축(9-16)', '0240':'근로단축(9-15)', '0250':'근로단축(10-17)',
    '0260':'근로단축(10-16)', '0270':'재택근무(7-16)', '0271':'재택근무(7:30~16:30)',
    '0280':'재택근무(8-17)', '0281':'재택근무(8:30~17:30)', '0290':'재택근무(9-18)',
    '0291':'재택근무(9:30-18:30)', '0300':'재택근무(10-19)', '0310':'육아근로단축재택근무(7-15)',
    '0320':'육아근로단축재택근무(7-14)', '0330':'육아근로단축재택근무(7-13)',
    '0340':'육아근로단축재택근무(8-16)', '0350':'육아근로단축재택근무(8-15)',
    '0360':'육아근로단축재택근무(8-14)', '0370':'육아근로단축재택근무(9-17)',
    '0380':'육아근로단축재택근무(9-16)', '0390':'육아근로단축재택근무(9-15)',
    '0400':'육아근로단축재택근무(10-18)', '0410':'육아근로단축재택근무(10-17)',
    '0420':'육아근로단축재택근무(10-16)', '0430':'임신기근로단축(9-16시)',
    '0440':'임신기근로단축(8-15시)', '0450':'임신기근로단축(10-17시)',
    '0460':'임신기근로단축재택근무(9-16시)', '0470':'임신기근로단축재택근무(8-15시)',
    '0480':'임신기근로단축재택근무(10-17시)'
}
const shiftCdDict={
    '0010':	'시차출퇴근(7~16)',
    '0011':	'시차출퇴근(7:30~16:30)',
    '0020':	'시차출퇴근(8~17)',
    '0021':	'시차출퇴근(8:30~17:30)',
    '0030':	'기본출퇴근(9~18)',
    '0031':	'시차출퇴근(9:30~18:30)',
    '0040':	'시차출퇴근(10~19)',
    '0050':	'선택출퇴근제',
    '0060':	'파견직(9~18)',
    '0070':	'육아근로단축(7-15)',
    '0080':	'육아근로단축(7-14)',
    '0090':	'육아근로단축(7-13)',
    '0100':	'육아근로단축(8-16)',
    '0110':	'육아근로단축(8-15)',
    '0120':	'육아근로단축(8-14)',
    '0130':	'육아근로단축(9-17)',
    '0140':	'육아근로단축(9-16)',
    '0150':	'육아근로단축(9-15)',
    '0160':	'육아근로단축(10-18)',
    '0170':	'육아근로단축(10-17)',
    '0180':	'육아근로단축(10-16)',
    '0190':	'근로단축(7-14)',
    '0200':	'근로단축(7-13)',
    '0210':	'근로단축(8-15)',
    '0220':	'근로단축(8-14)',
    '0230':	'근로단축(9-16)',
    '0240':	'근로단축(9-15)',
    '0250':	'근로단축(10-17)',
    '0260':	'근로단축(10-16)',
    '0430':	'임신기근로단축(9-16시)',
    '0440':	'임신기근로단축(8-15시)',
    '0450':	'임신기근로단축(10-17시)'

}
const commuteTypeDict={
    '0010':	'시차출퇴근',
    '0011':	'시차출퇴근',
    '0020':	'시차출퇴근',
    '0021':	'시차출퇴근',
    '0030':	'기본출퇴근',
    '0031':	'시차출퇴근',
    '0040':	'시차출퇴근',
    '0050':	'시차출퇴근',
    '0060':	'파견직출퇴근',
    '0070':	'육아근로단축(7시간)',
    '0080':	'육아근로단축(6시간)',
    '0090':	'육아근로단축(5시간)',
    '0100':	'육아근로단축(7시간)',
    '0110':	'육아근로단축(6시간)',
    '0120':	'육아근로단축(5시간)',
    '0130':	'육아근로단축(7시간)',
    '0140':	'육아근로단축(6시간)',
    '0150':	'육아근로단축(5시간)',
    '0160':	'육아근로단축(7시간)',
    '0170':	'육아근로단축(6시간)',
    '0180':	'육아근로단축(5시간)',
    '0190':	'근로단축(6시간)',
    '0200':	'근로단축(5시간)',
    '0210':	'근로단축(6시간)',
    '0220':	'근로단축(5시간)',
    '0230':	'근로단축(6시간)',
    '0240':	'근로단축(5시간)',
    '0250':	'근로단축(6시간)',
    '0260':	'근로단축(5시간)',
    '0430':	'임신기근로단축',
    '0440':	'임신기근로단축',
    '0450':	'임신기근로단축'
}

function getInoutPrototype(){
    return new Promise((resolve, reject)=>{
        const wb = new xl.Workbook();
        const ws = wb.addWorksheet('Worksheet Name');
        const style=wb.createStyle({
            alignment:{
            horizontal:"center",
            vertical:"center",
            wrapText: true
            }
        })
        
        ws.cell(1,1,2,1,true).string('No').style(style); //No
        ws.cell(1,2,2,2,true).string('사번').style(style); //사번
        ws.cell(1,3,2,3,true).string('성명').style(style); //성명
        ws.cell(1,4,2,4,true).string('조직').style(style); //조직
        ws.cell(1,5,2,5,true).string('근무일(*)').style(style); //근무일(*)
        ws.cell(1,6,2,6,true).string('요일').style(style); //요일
        ws.cell(1,7,2,7,true).string('근로유형').style(style); //근로유형
        ws.cell(1,8,2,8,true).string('근무조').style(style); //근무조
        ws.cell(1,9,2,9,true).string('근무유형').style(style); //근무유형
        ws.cell(1,10,2,10,true).string('마감 여부').style(style); //마감 여부
        ws.cell(1,11,1,14,true).string('출퇴근계획').style(style); //출퇴근계획
            ws.cell(2,11).string('출근일자').style(style); //출퇴근계획/출근일자
            ws.cell(2,12).string('출근시간').style(style); //출퇴근계획/출근시간
            ws.cell(2,13).string('퇴근일자').style(style); //출퇴근계획/퇴근일자
            ws.cell(2,14).string('퇴근시각').style(style); //출퇴근계획/퇴근시각
        ws.cell(1,15,1,20,true).string('출퇴근기록(본인)').style(style); //출퇴근기록(본인)
            ws.cell(2,15).string('출근일자').style(style); //출퇴근기록(본인)/출근일자
            ws.cell(2,16).string('출근시간').style(style); //출퇴근기록(본인)/출근시간
            ws.cell(2,19).string('출근입력시각').style(style); //출퇴근기록(본인)/출근입력시각
            ws.cell(2,17).string('퇴근일자').style(style); //출퇴근기록(본인)/퇴근일자
            ws.cell(2,18).string('퇴근시각').style(style); //출퇴근기록(본인)/퇴근시각
            ws.cell(2,20).string('퇴근입력시각').style(style); //출퇴근기록(본인)/퇴근입력시각
        ws.cell(1,21,1,24,true).string('출퇴근신청').style(style); //출퇴근신청
            ws.cell(2,21).string('출근일자').style(style); //출퇴근신청/출근일자
            ws.cell(2,22).string('출근시간').style(style); //출퇴근신청/출근시간
            ws.cell(2,23).string('퇴근일자').style(style); //출퇴근신청/출근입력시각
            ws.cell(2,24).string('퇴근시각').style(style); //출퇴근신청/퇴근일자
        ws.cell(1,25,1,28,true).string('출퇴근기록기').style(style); //출퇴근기록기
            ws.cell(2,25).string('출근일자').style(style); //출퇴근기록기/출근일자
            ws.cell(2,26).string('출근시간').style(style); //출퇴근기록기/출근시간
            ws.cell(2,27).string('퇴근일자').style(style); //출퇴근기록기/출근입력시각
            ws.cell(2,28).string('퇴근시각').style(style); //출퇴근기록기/퇴근일자
        ws.cell(1,29,1,32,true).string('확정').style(style); //확정
            ws.cell(2,29).string('출근일자').style(style); //확정/출근일자
            ws.cell(2,30).string('출근시간').style(style); //확정/출근시간
            ws.cell(2,31).string('퇴근일자').style(style); //확정/출근입력시각
            ws.cell(2,32).string('퇴근시각').style(style); //확정/퇴근일자
        ws.cell(1,33,2,33,true).string('비고').style(style); //비고
        ws.cell(1,34,2,34,true).string('수정자').style(style); //수정자
        ws.cell(1,35,2,35,true).string('수정일시').style(style); //수정일시
        resolve(wb);
    });    
}



function addOverTime(list){
    var total=0;
    for(i in list){
        hours=parseInt(list[i].substring(0,2));
        minutes=parseInt(list[i].substring(2));
        totalMinutes=minutes+hours*60;
        total=totalMinutes+total; 
    }
    return total;
}

function addOverTimeTotal(dict){ //딕셔너리로 받아온 초과근무내역 합산해서 그대로 리턴
    for([key, value] of Object.entries(dict)){
        dict[key]=addOverTime(value);
    }
    return dict;
}

function validateInterval(start_day, end_day){ // 기간 유효성 검사
    if(start_day==undefined||end_day==undefined||start_day==''||end_day==''){// 폼이 한쪽이라도 비어있을 때
        return '시작기간과 종료기간을 모두 설정하시기 바랍니다.';
    }else if(start_day>end_day){
        return '종료기간이 시작기간보다 빠릅니다.';
    }else{
        return true;
    }
}

function hhmmToString(time){ // 초과근무 시간정보를 'hh시간 mm분' 문자열 형태로 변환
    time=parseInt(time)
    hour=Math.floor(time/100);
    minute=time%100;
    return hour+'시간 '+minute+'분'
}

function isSession(req, type){ //세션 유효한지 검증
    return new Promise((resolve, reject)=>{
        if(type=='users'){//일반유저
            resolve(req&&req.session&&req.session.data);
        }else if(type=='admin'){//admin유저
            resolve(req&&req.session&&req.session.data&&req.session.isAdmin);
        }else{
            resolve(false);
        }
    })
    
}

const weekOfMonth = function(target_day){
    m=moment(target_day);
    target_week= m.week() - moment(m).startOf('month').week() + 1;
    if (m.day()==0 && target_week!=1){
        target_week=target_week-1;
    }
    return target_week;
}

function dayFormatTranslate(ymd){//'yyyymmdd' to 'yyyy/mm/dd'
    return new Promise((resolve, reject)=>{
        resolve(ymd.substring(0,4)+'/'+ymd.substring(4,6)+'/'+ymd.substring(6))
    })
}

function getDate(ymd){
    var Day=['일','월','화','수','목','금','토'];
    var target_date=new Date(ymd).getDay();
    return Day[target_date];
}

function getNow(){
    const today=moment();
    return (today.format('YYYY-MM-DD hhmmss'))

    // return new Date(+new Date() + 3240 * 10000).toISOString().replace("T", " ").replace(/\..*/, '');
}
async function makeInoutUploadForm(result){ // 출퇴근시각관리 양식 생성
    var noCount=1;
    //result에서 직접 전처리 후 리턴
    
    for (i of result){
        delete i.NO;
        await dayFormatTranslate(i["YMD"])
        .then(function(ymdResult){
            i["NO"]=String(noCount++); // 연번
            i["date"]=getDate(ymdResult);
            i["COMMUTE_TYPE"]=commuteTypeDict[i["SHIFT_CD"]];
            i["SHIFT_CD"]=shiftCdDict[i["SHIFT_CD"]];
            i["WORK_TYPE"]=workTypeDict[i["WORK_TYPE"]];
            /* 
                commute_type:파견직출퇴근(0060), 육아기근로단축(7,6,5시간), 선택출퇴근제, 근로단축(6시간,5시간), 
                임신기근로단축 외에는 모두 시차출퇴근제로 반영
            */
            i["DEL_YN"]="N";      
            return result[i] 
        })
    }
    console.log(result);
    return result;
}

function makeChitLink(result){ // 시간외전표연동 양식 생성

}

function makePersonalWorkPlanEdit(result){ // 개인별근무일정변경 양식 생성

}

async function clean(file){
    fs.unlink(file, function(err){
      if(err) {
        console.log("Error : ", err)
      }
    })
  }

module.exports={
    workTypeDict,
    shiftCdDict,
    addOverTimeTotal,
    validateInterval,
    hhmmToString,
    isSession,
    weekOfMonth,
    makeInoutUploadForm,
    makeChitLink,
    makePersonalWorkPlanEdit,
    jsonize,
    getNow,
    clean,
    getInoutPrototype
}