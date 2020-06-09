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

const topics = {
  meta_name: '/devices/' + WB_DEVICE_ID + '/meta/name',

  config:       '/devices/' + WB_DEVICE_ID + '/controls/config',
  config_on:    '/devices/' + WB_DEVICE_ID + '/controls/config/on',
  config_type:  '/devices/' + WB_DEVICE_ID + '/controls/config/meta/type',
  config_ro:    '/devices/' + WB_DEVICE_ID + '/controls/config/meta/readonly',

  uptime:       '/devices/' + WB_DEVICE_ID + '/controls/uptime',
  uptime_type:  '/devices/' + WB_DEVICE_ID + '/controls/uptime/meta/type',
  uptime_ro:    '/devices/' + WB_DEVICE_ID + '/controls/uptime/meta/readonly',

  connected:       '/devices/' + WB_DEVICE_ID + '/controls/connected',
  connected_type:  '/devices/' + WB_DEVICE_ID + '/controls/connected/meta/type',
  connected_ro:    '/devices/' + WB_DEVICE_ID + '/controls/connected/meta/readonly',

  topics:       '/devices/' + WB_DEVICE_ID + '/controls/topics',
  topics_type:  '/devices/' + WB_DEVICE_ID + '/controls/topics/meta/type',
  topics_ro:    '/devices/' + WB_DEVICE_ID + '/controls/topics/meta/readonly',

  error:       '/devices/' + WB_DEVICE_ID + '/controls/error',
  error_type:  '/devices/' + WB_DEVICE_ID + '/controls/error/meta/type',
  error_ro:    '/devices/' + WB_DEVICE_ID + '/controls/error/meta/readonly',
}

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

  // client.publish(topics.meta_name, WB_DEVICE_TITLE, { retain: true })
  //
  // client.publish(topics.topics_type, 'value', { retain: true })
  // client.publish(topics.topics_ro, '0', { retain: true })
  // client.publish(topics.topics, '0', { retain: true })
  //
  // client.publish(topics.error_type, 'text', { retain: true })
  // client.publish(topics.error_ro, '0', { retain: true })
  // client.publish(topics.error, '0', { retain: true })
  //
  // client.publish(topics.uptime_type, 'text', { retain: true })
  // client.publish(topics.uptime_ro,   '0', { retain: true })
  // client.publish(topics.uptime, '0', { retain: true })
  //
  // client.publish(topics.connected_type, 'value', { retain: true })
  // client.publish(topics.connected_ro,   '0', { retain: true })
  // client.publish(topics.connected + '/on', '1')
  //
  // client.publish(topics.config_type, 'text', { retain: true })
  // client.publish(topics.config_ro, '0', { retain: true })
  // client.publish(topics.config, '', { retain: true })

  mqtt_subscribe(topics.config)
  mqtt_subscribe(topics.config_on)

  mqtt_subscribe(topics.connected)
})

client.on('message', function (topic, message) {
  if (topic == topics.connected) {
    // console.log('Connected: ' + message)
    if (message == -1) {
      client.publish(topics.connected + '/on', '1')
    }
  }

  if (topic == topics.config || topic == topics.config_on) {
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

          client.publish(topics.topics + '/on', proxyMap.length.toString())

          console.log("New proxy: ")
          console.log(proxyItem)
      }
    } catch(e) {
      console.log('Bad config data')
      client.publish('/devices/' + WB_DEVICE_ID + '/controls/error/on', 'Bad config data')
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

  client.publish(topics.uptime, formatTime(ts - connected_ts).toString())
}, 1000)

//
//  Format  //
//

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
