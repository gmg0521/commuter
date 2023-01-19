from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
from bson.json_util import dumps
from datetime import datetime

app = Flask(__name__)
client = MongoClient(
    "mongodb+srv://admin:admin@commute.fwn8ht5.mongodb.net/test")
db = client.nameList

# 공통헤더파일


@app.route('/header')
def header():
    return render_template('header.html')


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/management')
def management():
    return render_template('management.html')


@app.route('/commute', methods=["POST"])
def commute():
    commuteStat = '퇴근' if request.form['commuteStat'] == 'true' else '출근'
    name = request.form['name']
    today = request.form['today']
    startTime = request.form['startTime']
    if commuteStat == '퇴근':
        stopTime = request.form['stopTime']
        recentDayList = list(db[name].find({}, {"_id": False, "today": True}))

        tDiff = str(
            getDiff(recentDayList[-1]['today'], startTime, today, stopTime)).split(':')

        gowText = "[퇴근] " + startTime + "~" + stopTime + \
            " (" + tDiff[0] + "h " + tDiff[1] + "m" + ")"

        userCommute = {
            'commuteStat': commuteStat,
            'stopTime': stopTime,
            'text': gowText}
    else:
        startTime = request.form['startTime']
        userCommute = {
            'commuteStat': commuteStat,
            'today': today,
            'startTime': startTime,
            'stopTime': "",
            'text': '[출근]' + startTime
        }
    db[name].update_one({'today': today}, {"$set": userCommute}, upsert=True)

    return jsonify({'result': 'success', 'msg':  commuteStat + ' 등록 완료'})


@app.route('/gettime', methods=['GET'])
def gettime():
    name = request.args.get('name')
    today = request.args.get('today')
    doc = list(db[name].find({
        'today': today
    }))
    print(doc)

    return jsonify({'data': dumps(doc)})


@app.route('/get_commute_info', methods=['GET'])
def getCommuteInfo():
    name = request.args.get('name')
    month = request.args.get('month')
    print(name)
    doc = list(db[name].find())

    thisMonthList = []

    for today in doc:
        d = today['today']
        m = str(d).split('-')[1]
        if m == month:
            thisMonthList.append({
                'today': d,
                'startTime': today['startTime'],
                'stopTime': today['stopTime'],
                'text': today['text'],
            })

    return jsonify({'data': thisMonthList})


@app.route('/edit_dt', methods=['POST'])
def editDT():
    name = request.form['name']
    startDay = request.form['startDay']
    startTime = request.form['startTime']
    endDay = request.form['endDay']
    stopTime = request.form['stopTime']
    editGtw = request.form['editGtw']

    if (not int(editGtw)):

        tDiff = str(
            getDiff(startDay, startTime, endDay, stopTime)).split(':')

        if (tDiff[0].startswith('(-')):
            return 'false'

        text = "[퇴근] " + startTime + "~" + stopTime + \
            " (" + tDiff[0] + "h " + tDiff[1] + "m" + ")"

        userCommute = {
            'today': startDay,
            'startTime': startTime,
            'stopTime': stopTime,
            'text': text,
            'workTime': tDiff
        }
    else:
        text = '[출근]' + startTime

        userCommute = {
            'today': startDay,
            'startTime': startTime,
            'stopTime': '',
            'text': text,
        }

    db[name].update_one({'today': startDay}, {
                        "$set": userCommute}, upsert=True)

    return jsonify({'result': 'success', 'msg':  '수정 완료!'})


def getDiff(sd, s, ed, e):
    startDate = list(map(int, sd.split('-')))
    endDate = list(map(int, ed.split('-')))
    s1 = list(map(int, s.split(':')))
    e1 = list(map(int, e.split(':')))

    st = datetime(startDate[0], startDate[1], startDate[2], s1[0], s1[1])
    et = datetime(endDate[0], endDate[1], endDate[2], e1[0], e1[1])

    diff = et-st

    return diff


@app.route('/delete', methods=['POST'])
def delete():
    name = request.form['name']
    deleteDay = request.form['deleteDay']
    db[name].delete_one({'today': deleteDay})

    return jsonify({'result': 'success', 'msg': '삭제 완료'})


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
