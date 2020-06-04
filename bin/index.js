#!/usr/bin/env node

// TODO: Config server using cli
// TODO: Do nothing if it is not wirenboard

const MODULE_NAME = 'wirenboard-mqtt-proxy'

// const SERVER_DIR  = '/etc/' + MODULE_NAME
// const SERVER_FILE = 'server.js'

const SERVICE_DIR   = '/etc/systemd/system'
const SERVICE_FILE  = MODULE_NAME + '.service'

const HELP = `
Available commands:
${MODULE_NAME} enable  - Enable autorun on boot OS
${MODULE_NAME} disable - Disable autorun on boot OS
${MODULE_NAME} start   - Start mqtt proxy
${MODULE_NAME} stop    - Stop mqtt proxy
${MODULE_NAME} restart - Restart mqtt proxy

*All commands using systemctl
systemctl status ${MODULE_NAME} - Show service status
journalctl -u ${MODULE_NAME} -f - Show logs
`

//  CMD  //
const CMD_ENABLE = 'systemctl enable ' + MODULE_NAME
const CMD_DISABLE = 'systemctl disable ' + MODULE_NAME
const CMD_START = 'systemctl start ' + MODULE_NAME
const CMD_STOP = 'systemctl stop ' + MODULE_NAME
const CMD_RESTART = 'systemctl restart ' + MODULE_NAME
// const CMD_STATUS = 'systemctl status ' + MODULE_NAME // TODO: need chunks out
// const CMD_LOGS = `journalctl -u ${MODULE_NAME} -f`   // TODO: need chunks out

const CMD_SYSTEMCTL_RELOAD = 'systemctl daemon-reload' //  use it after .service update

const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')

//  get arguments after first two elements  //
const arguments = process.argv.splice(2)

//
//  Files  //
//

// const copyServerFile = (cb_onDone) => {
//   if (!fs.existsSync(SERVER_DIR)){
//     fs.mkdirSync(SERVER_DIR)
//   }
//
//   fs.copyFile(
//     path.resolve(__dirname, '../lib/' + SERVER_FILE),
//     path.resolve(SERVER_DIR, SERVER_FILE), err => {
//     if (err) throw err
//     cb_onDone()
//   })
// }

const copyServiceFile = (cb_onDone) => {
  fs.copyFile(
    path.resolve(__dirname, '../' + SERVICE_FILE),
    path.resolve(SERVICE_DIR, SERVICE_FILE), err => {
    if (err) throw err
    cb_onDone()
  })
}

const execCommand = (cmd, cb_onDone) => {
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.log('Error: could not execute command: ' + cmd)
      return
    }

    if (stdout) console.log(stdout)
    if (stderr) console.log(stderr)

    cb_onDone()
  })
}

//
//  Main  //
//

switch (arguments[0]) {

  case 'enable':
    // copyServerFile(() => {
      copyServiceFile(() => {
        execCommand(CMD_SYSTEMCTL_RELOAD, () => {
          execCommand(CMD_ENABLE, () => {
            console.log('+ Enabled autorun on boot OS')
          })
        })
      })
    // })
    break

  case 'disable':
    execCommand(CMD_DISABLE, () => {
      console.log('+ Disabled autorun on boot OS')
    })
    break

  case 'start':
    // copyServerFile(() => {
      copyServiceFile(() => {
        execCommand(CMD_SYSTEMCTL_RELOAD, () => {
          execCommand(CMD_START, () => {
            console.log('+ Service started')
          })
        })
      })
    // })
    break

  case 'stop':
    execCommand(CMD_STOP, () => {
      console.log('+ Service stoped')
    })
    break

  case 'restart':
    // copyServerFile(() => {
      copyServiceFile(() => {
        execCommand(CMD_SYSTEMCTL_RELOAD, () => {
          execCommand(CMD_RESTART, () => {
            console.log('+ Service restarted')
          })
        })
      })
    // })
    break

  // case 'status':
  //   execCommand(CMD_STATUS, () => {
  //   })
  //   break
  //
  // case 'logs':
  //   execCommand(CMD_LOGS, () => {
  //   })
  //   break

  default:
    console.log(HELP)
}
