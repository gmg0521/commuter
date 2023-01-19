// COMPLETE
/* 1. 출퇴근 상태 불러와서 UI 조정
  1-1 이미 출근 하면 새로고침해도 퇴근 전까지 이름 input disabled 시키기 [V]
  1-2 오늘 이미 출퇴근이 등록이 되있으면 아예 버튼을 못 누르게해서 출퇴근 관리를 통해 수동 기록할 수 있도록. [V]
      (버튼 잘못 눌러서 시간이 변경 될 수도 있으니.)
2. 출퇴근 캘린더에 자동 등록되게 하기[V]
// 3. 출퇴근 수동 기록 폼 만들기. (대충 폼은 만듦. 예쁜 디자인이 없는거지...) - 이거
// 4. 주 단위, 월 단위 계산 후 표기하기 - 이거
*/

// management.js 132번줄 참고! - 현재 24시간이 넘으면 시간을 기록 못하는 버그가 있음

var commuteStat;
var startTime, stopTime;

// 실시간 시간
function loadClock() {
  let time = dayjs();

  var year = time.$y;
  var month = time.$M;
  var date = time.$D;
  var day = time.$W;
  var week = ["일", "월", "화", "수", "목", "금", "토"];

  var hours = time.$H;
  var minutes = time.$m;
  var seconds = time.$s;

  dayjs();

  target.text(
    `현재시각 : ${year}년 ${month + 1}월 ${date}일 ${week[day]}요일` +
      ` ${hours < 10 ? `0${hours}` : hours}:${
        minutes < 10 ? `0${minutes}` : minutes
      }:${seconds < 10 ? `0${seconds}` : seconds}`
  );
}

// 출퇴근 버튼 함수
function commute() {
  let name = $("#name").val();
  if (commuteStat == "true") {
    gow(name);
  } else {
    gtw(name);
  }
}

//출근 함수
function gtw(mName) {
  if (mName == "") {
    return alert("이름을 입력해주세요");
  }

  if (mName == getCookie("name")) {
    if (
      !confirm(
        "오늘 이미 출근 기록이 존재합니다. 출근 기록을 수정하시겠습니까?"
      )
    ) {
      return;
    }
  }
  // 현재시각 저장
  now = dayjs();

  today = `${now.format("YYYY-MM-DD")}`;
  startTime = `${now.$H < 10 ? `0${now.$H}` : now.$H}:${
    now.$m < 10 ? `0${now.$m}` : now.$m
  }`;

  // ajax로 현재시간과 이름 mongoDB에 저장 요청
  $.ajax({
    type: "POST",
    url: "/commute",
    data: {
      commuteStat: commuteStat,
      name: mName,
      today: today,
      startTime: startTime,
      stopTime: "",
    },
    success: function (response) {
      console.log(response);
      // 출근시간 표시
      $("#gtw").text(`출근시간 :  ${startTime}`);
      $("#gow").text(`퇴근시간 : \u00a0\u00a0\u00a0\u00a0`);
      // 토스트로 알림
      $("#liveToast").removeClass("hide");
      $("#liveToast").addClass("show");

      // 이름 칸 비활성화
      nameInput("출근");

      //버튼 변경
      btnCommute("출근");

      // 출근 상태 변경
      commuteStat = "true";
      setCookie("name", mName, 1);
      setCookie("commuteStat", commuteStat, 1);

      //사용자 표시
      $("#curUser").html(getCookie("name"));
    },
  });
}

function gow(mName) {
  if (mName == "") {
    return alert("알 수 없는 오류!");
  }
  // 현재시각 저장
  now = dayjs();

  today = `${now.format("YYYY-MM-DD")}`;
  stopTime = `${now.$H < 10 ? `0${now.$H}` : now.$H}:${
    now.$m < 10 ? `0${now.$m}` : now.$m
  }`;

  // ajax로 현재시간과 이름 mongoDB에 저장 요청
  $.ajax({
    type: "POST",
    url: "/commute",
    data: {
      name: mName,
      today: today,
      commuteStat: commuteStat,
      startTime: startTime,
      stopTime: stopTime,
    },
    success: function (response) {
      // 출근시간 표시
      $("#gow").text(`퇴근시간 :  ${stopTime}`);
      // 토스트로 알림
      $("#liveToast").removeClass("hide");
      $("#liveToast").addClass("show");
      $("#toastBody").html("퇴근하였습니다! 야호~");

      btnCommute("퇴근");
      nameInput("퇴근");

      commuteStat = "false";
      setCookie("commuteStat", commuteStat, "2");

      //사용자 표시 없애기
      $("#curUser").html("안녕하세요!");
    },
  });
}

// 퇴근 버튼 활성화
function btnCommute(stat) {
  if (stat == "출근") {
    $("#commute").addClass("btn-danger");
    $("#commute").removeClass("btn-primary");
    $("#commute").html("퇴근");
  } else if (stat == "퇴근") {
    $("#commute").addClass("btn-primary");
    $("#commute").removeClass("btn-danger");
    $("#commute").html("출근");
  } else {
    $("#commute").addClass("btn-secondary");
    $("#commute").removeClass("btn-danger");
    $("#commute").html("출근");
  }
}

// 이름 칸 비활성화
function nameInput(stat) {
  if (stat == "출근") {
    $("#name").hide();
    $("#namePH").hide();
  } else {
    $("#name").show();
    $("#namePH").show();
  }
}

// 오늘 출퇴근 시간 표시
function getTime(mName) {
  if (mName == "") {
    $("#name").focus();
    return;
  }

  today = `${dayjs().format("YYYY-MM-DD")}`;

  $.ajax({
    type: "GET",
    url: "/gettime",
    data: {
      today: today,
      name: mName,
    },
    success: function (response) {
      let todayCommute = JSON.parse(response["data"])[0];
      if (todayCommute != undefined) {
        console.log(startTime);
        startTime =
          todayCommute["startTime"] == undefined
            ? `&nbsp;&nbsp;&nbsp;&nbsp;`
            : todayCommute["startTime"];
        console.log(startTime);
        stopTime =
          todayCommute["stopTime"] == undefined
            ? `&nbsp;&nbsp;&nbsp;&nbsp;`
            : todayCommute["stopTime"];

        $("#gtw").html(`출근시간 : ${startTime}`);
        $("#gow").html(`퇴근시간 : ${stopTime}`);
      }
    },
  });
}

// function getCommuteStat(name) {
//   if (name == "") {
//     return "false";
//   } else {
//     today = `${dayjs().format("YYYY-MM-DD")}`;
//     $.ajax({
//       type: "POST",
//       url: "/get_commute_stat",
//       data: {
//         name: name,
//         today: today,
//       },
//       success: function (response) {},
//     });
//   }
// }
