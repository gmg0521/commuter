// 쿠키 설정 함수
function setCookie(cName, cValue, cDay) {
  var nowTime = dayjs();
  var expire = nowTime.add(cDay, "d");
  cookies = cName + "=" + cValue + ";";
  if (typeof cDay != "undefined") {
    cookies += "expires=" + expire.$d + ";" + "path=/";
    document.cookie = cookies;
  }
}

// 쿠키 가져오기 함수
function getCookie(cName) {
  cName = cName + "=";
  var cookieData = document.cookie;
  var start = cookieData.indexOf(cName);
  var cValue = "";
  if (start != -1) {
    start += cName.length;
    var end = cookieData.indexOf(";", start);
    if (end == -1) end = cookieData.length;
    cValue = cookieData.substring(start, end);
  }
  return cValue;
}
//쿠키삭제
function deleteCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}
