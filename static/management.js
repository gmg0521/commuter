var appended = false;
var weekHour = 0;
var weekMin = 0;
var monthHour = 0;
var monthMin = 0;
var editGtw = 0;
var flag = 0;
var month = "0";

function selectUser(name, month) {
  if (flag == 1) {
    load(name, month);
  } else {
    $("#nameModal").modal("show");
    $("#nameInput").val(name);
  }
}

function getUser(name) {
  if (name == "") {
    alert("조회하려는 이름이 빈칸입니다!");
  } else {
    let mName = getCookie("name");
    $(window).on("beforeunload", function () {
      setCookie("name", mName, 1);
    });
    setCookie("name", name, 1);
    $("#nameModal").modal("hide");
    load(name, month);
  }
}

function load(tname, month) {
  if (tname == "") {
    selectUser(tname, month);
  } else {
    $("#curUser").html(tname);
    flag = 1;

    calendar.removeAllEvents();

    let thisMonth = month;

    // ajax요청 - 현재 달 출퇴근 시간 확인
    $.ajax({
      type: "GET",
      url: "/get_commute_info",
      data: {
        name: tname,
        month: thisMonth,
      },
      success: function (response) {
        getEvents(response.data);
      },
    });
  }
}

// 출근 기록 불러오기 불러오기

function getEvents(events) {
  $.map(events, function (info) {
    let es = {
      events: [
        {
          title: info["text"],
          start: info["today"] + " " + info["startTime"],
          allDay: true,
        },
      ],
    };
    calendar.addEventSource(es);
  });
  countWeek();
  appended = true;
}

function editDT(startDate, startTime, endDate, endTime) {
  var editFlag = 0;
  if (startDate == "" || endDate == "") {
    editFlag = 1;
  }
  if (startTime == "") {
    editFlag = 2;
  } else if (endTime == "") {
    editFlag = 3;
  }

  switch (editFlag) {
    case 0:
      if (confirm("수정하시겠습니까?")) {
        editGtw = 0;
        editDate(startDate, startTime, endDate, endTime);
      }
      break;
    case 1:
      alert("날짜가 입력되지 않았습니다.");
      return;
      break;
    case 2:
      alert(`출근시간이 입력되지 않았습니다`);
      return;
      break;
    case 3:
      if (
        confirm(
          `퇴근시간이 입력되지 않았습니다. 그래도 진행하시겠습니까?\n(입력하지 않은 기록은 사라집니다.`
        )
      ) {
        editGtw = 1;
        editDate(startDate, startTime, endDate, endTime);
      } else return;
      break;

    default:
      alert("오류띠");
      break;
  }
}

function editDate(startDate, startTime, endDate, endTime) {
  var startDay = dayjs(startDate + startTime);
  var endDay = dayjs(endDate + endTime);

  var dayDiff = endDay.diff(startDay, "d");
  var hourDiff = endDay.diff(startDay, "h");
  var minDiff = endDay.diff(startDay, "m");

  console.log(dayDiff, hourDiff, minDiff);

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // 이 정보를 넘겨줘서 이벤트 만드는 식으로 변경하자

  if (minDiff > 0) {
    $.ajax({
      type: "POST",
      url: "/edit_dt",
      data: {
        name: getCookie("name"),
        startDay: startDate,
        startTime: startTime,
        endDay: endDate,
        stopTime: endTime,
        editGtw: editGtw,
      },
      success: function (response) {
        location.reload();
      },
    });
  } else {
    alert("올바른 시간대가 아닙니다.");
  }
}

function changeDate(info) {
  console.log(info);
  $("#editStartTime").val("");
  $("#editEndTime").val("");
  $("#editStartDate").val(info.dateStr);
  $("#editEndDate").val(info.dateStr);
  // 클릭한 날짜의 이벤트 불러오기
  let titles = $(info.dayEl).find(".fc-event-title");
  $.map(titles, function (title, indexOrKey) {
    let time = $(title).parent().children()[1];
    if ($(title).html() == "출근") {
      $("#editStartTime").val($(time).html());
    } else if ($(title).html() == "퇴근") {
      $("#editEndTime").val($(time).html());
    }
  });
  $("#dateModal").modal("show");
}

function countWeek() {
  if (!appended) {
    var $weekHour = $(
      '<th role="columnheader" class="fc-col-header-cell fc-day"><div class="fc-scrollgrid-sync-inner"><a aria-label="주 누적" class="fc-col-header-cell-cushion">주 누적</a></div></th>'
    );
    $($(".fc-col-header-cell.fc-day.fc-day-sat").parent()).append($weekHour);
  }
  // 주 가져오기 - .splice(3)으로 필요없는 행 제거
  let weeklist = $("table").find("tr").splice(3);
  // 주 마다 기록 뽑기
  $.map(weeklist, function (week) {
    // 그 주에 있는 이벤트 찾기
    if (!$(week).hasClass(".fc-other.day")) {
      eventDays = $(week).find(".fc-event-title");
      // 만약 그 주에 이벤트가 있다면
      if (eventDays.length > 0) {
        for (let i = 0; i < eventDays.length; i++) {
          const event = eventDays[i];
          if (String($(event).html()).startsWith("[퇴")) {
            weekT($(event).html());
          }
          if (i == eventDays.length - 1) {
            let weekText =
              "이번주 누적 시간 - " + weekHour + "시간 " + weekMin + "분";
            days = $(week).children();
            appendThisWeek(weekText, days);
          }
        }
      }
    }

    weekHour = 0;
    weekMin = 0;
  });
  $("#monthHour").html(
    "월 누적 시간 : " + monthHour + "시간 " + monthMin + "분"
  );
  monthHour = 0;
  monthMin = 0;
}

function weekT(info) {
  const result = Array.from(
    info.matchAll("\\((.*?)\\)"),
    (match) => `${match[0]}`
  );

  var timeStr = result[0].slice(1, result[0].length - 1);
  timeStr = timeStr.split(" ");
  hour = parseInt(timeStr[0].slice(0, timeStr[0].length - 1));
  min = parseInt(timeStr[1].slice(0, timeStr[1].length - 1));

  weekHour = weekHour + hour + parseInt(min / 60);
  weekMin = weekMin + (min % 60);
  if (weekMin >= 60) {
    weekHour = weekHour + 1;
    weekMin = weekMin % 60;
  }
  monthHour = monthHour + hour + parseInt(min / 60);
  monthMin = monthMin + (min % 60);
  if (monthMin >= 60) {
    monthHour = monthHour + 1;
    monthMin = monthMin % 60;
  }
}

function appendThisWeek(text, mEvent) {
  // fc-dom 번호 가져오기
  let a = mEvent[mEvent.length - 1];
  if ($(a).hasClass("fc-day-sat")) {
    let b = $(a).attr("aria-labelledby");
    let c = b.split("-");
    let domNum = c[c.length - 1];
    const $weekAppend = `<td aria-labelledby="fc-dom-"+${domNum}+" role="gridcell" class="fc-day fc-daygrid-day"><div class="fc-daygrid-day-frame fc-scrollgrid-sync-inner"><div class="fc-daygrid-day-top"><a id="fc-dom-"+${domNum}+" class="fc-daygrid-day-number">${text}</a></div><div class="fc-daygrid-day-events"><div class="fc-daygrid-day-bottom" style="margin-top: 0px;"></div></div><div class="fc-daygrid-day-bg"></div></div></td>`;
    $(a.parentElement).append($weekAppend);
  }
}

function deleteEvent(info) {
  if (confirm(`출근 기록을 삭제하시겠습니까?`)) {
    let deleteDay = info["event"]["startStr"];
    $.ajax({
      type: "POST",
      url: "/delete",
      data: {
        name: getCookie("name"),
        deleteDay: deleteDay,
      },
      success: function (response) {
        location.reload();
      },
    });
  }
}
