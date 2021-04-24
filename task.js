const schedule = require('node-schedule')
const child_process = require('child_process')

let rule = new schedule.RecurrenceRule();
function productMiunteRule(count = 1) {
  const num = 60 / count - 1;
  let arr = [0]
  for (let i = 0; i <= num - 1; i++) {
    arr.push(arr[i] + count)
  }
  return arr
}

// rule.minute = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
rule.minute = productMiunteRule(1);
// rule.second = [0,20,40];
let totalmobileNum = 0, totalPCNum = 0;
let job = schedule.scheduleJob(rule, () => {
  const workerProcess = child_process.spawn('node', ['./index.js'])
  workerProcess.stdout.on('data', function (data) {
    try {
      const { mobileNum, PCNum } = JSON.parse(data)
      totalmobileNum += mobileNum
      totalPCNum += PCNum
      console.log(`pc 次数${totalPCNum}`)
      console.log(`mobile 次数${totalmobileNum}`)
      console.log(`总次数 次数${totalmobileNum + totalPCNum} `+ '\n')
      
      if(totalmobileNum + totalPCNum === 100) {
        process.exit();
      }
    } catch (err) {
      console.log('错误')
    }
    workerProcess.kill()
  });
})
