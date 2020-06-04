const WB_DEVICE_ID    = 'mqtt-proxy'
const WB_DEVICE_TITLE = 'MQTT Proxy'

const MQTT_HOST = 'localhost'
const MQTT_PORT = 1883

// TODO: mqtt disconnected
// TODO: Config file

// {
//   "task": "add",
//   "from": "ebusd/370/DisplayedRoomTemp",
//   "to":   "/devices/test22/controls/test1/on"
// }




// var cells = {
// 		test1: 	{ type: "temperature", 	value: 10 },
//   status: 	{ type: "text", 	value: "NOT CONNECTED", forceDefault: true},
// 		fuckme: 	{ type: "pushbutton" },
// 	}
//
// 	defineVirtualDevice("test22", {
// 	  title: "Test 22",
// 	  cells: cells
// 	});
//
// 	defineRule({
//     whenChanged: "test22/test1",
//     then: function (newValue, devName, cellName) {
// 			log("suuuka");
// 		}
// 	});
//
// defineRule({
//     whenChanged: "test22/fuckme",
//     then: function (newValue, devName, cellName) {
// 			log("fuckme");
//
//       		//dev["mqtt2wb"]["config"] = '{ "task": "add", "from": "ebusd/370/DisplayedRoomTemp", "to": "/devices/test22/controls/test1" }';
//       publish("/devices/mqtt2wb/controls/config", '{ "task": "add", "from": "ebusd/370/DisplayedRoomTemp", "to": "/devices/test22/controls/test1" }');
// 		}
// 	});
//
//
//
// setInterval(function(){
//   //  wait service started  //
//   if (dev["mqtt2wb"]["uptime"] === null || dev["mqtt2wb"]["uptime"] === 0 || dev["mqtt2wb"]["uptime"] === "0") return;
//
//   if (dev["test22"]["status"] === "NOT CONNECTED") {
//     dev["mqtt2wb"]["config"] = '{ "task": "add", "from": "ebusd/370/DisplayedRoomTemp", "to": "/devices/test22/controls/test1" }';
//
//     dev["test22"]["status"] = "CONNECTED";
//     log("Test: CONNECTED");
//   }
// }, 1000);



const mqtt = require('mqtt')

//
//  Data  //
//

const proxyMap = []

const proxyMap_isExist = proxyItem => (proxyMap
  .find(item => item.from === proxyItem.from && item.to === proxyItem.to) !== undefined)

//
//  MQTT  //
//

const topic_config = '/devices/' + WB_DEVICE_ID + '/controls/config'
const topic_config_on = topic_config + '/on'

const topic_uptime = '/devices/' + WB_DEVICE_ID + '/controls/uptime'

let connected_ts = -1

const client = mqtt.connect({ host: MQTT_HOST, port: MQTT_PORT })

const mqtt_subscribe = topicStr => {
  client.subscribe(topicStr, (err) => {
    if (!err) console.log('Subscribed: ' + topicStr)
    else console.log('Subscribe ERROR: ', err)
  })
}

client.on('connect', function () {
  console.log('MQTT: Connected')

  connected_ts = Math.floor(Date.now() / 1000)

  client.publish('/devices/' + WB_DEVICE_ID + '/meta/name', WB_DEVICE_TITLE, { retain: true })

  client.publish('/devices/' + WB_DEVICE_ID + '/controls/topics/meta/type', 'value', { retain: true })
  client.publish('/devices/' + WB_DEVICE_ID + '/controls/topics', '0', { retain: true })

  client.publish('/devices/' + WB_DEVICE_ID + '/controls/error/meta/type', 'text', { retain: true })
  client.publish('/devices/' + WB_DEVICE_ID + '/controls/error', '0', { retain: true })

  client.publish('/devices/' + WB_DEVICE_ID + '/controls/uptime/meta/type', 'text', { retain: true })
  client.publish('/devices/' + WB_DEVICE_ID + '/controls/uptime', '0', { retain: true })

  client.publish('/devices/' + WB_DEVICE_ID + '/controls/config/meta/type', 'text', { retain: true })
  client.publish('/devices/' + WB_DEVICE_ID + '/controls/config', '', { retain: true })

  mqtt_subscribe(topic_config)
  mqtt_subscribe(topic_config_on)
})

client.on('message', function (topic, message) {
  if (topic == topic_config || topic == topic_config_on) {
    try {
      const configData = JSON.parse(message.toString())

      if (configData.task === 'add') {
          proxyItem = {
            from: configData.from,
            to:   configData.to
          }

          if (proxyMap_isExist(proxyItem)) return;

          proxyMap.push(proxyItem)
          mqtt_subscribe(proxyItem.from)

          console.log("Proxy list: ")
          console.log(proxyMap)
      }
    } catch(e) {
      console.log('Bad config data')
      client.publish('/devices/' + WB_DEVICE_ID + '/controls/error', 'Bad config data')
    }
  }

  else {
    proxyMap.forEach(item => {
      if (item.from !== topic) return
      client.publish(item.to, message)
    })
  }
})

setInterval(() => {
  if (connected_ts === -1) return;

  const ts = Math.floor(Date.now() / 1000)

  client.publish(topic_uptime, formatTime(ts - connected_ts).toString())
}, 1000)

var formatTime = function (delta) {
		delta = parseInt(delta)

    //  seconds  //
    if (delta < 60) {
      return delta.toString() + ' s';
    }

    //  minutes  //
    else if (delta < 60 * 60) {
      return Math.floor(delta / 60).toString() + ' min'
    }

    //  hours  //
    else if (delta < 24 * 60 * 60) {
      return Math.floor(delta / (60 * 60)).toString() + ' hours'
    }

    //  days  //
    else {
      return Math.floor(delta / (24 * 60 * 60)).toString() + ' days'
    }
  }
