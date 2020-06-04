##  create virtual device  ##
wb-rules -> /etc/wb-rules

##  autorun  ##
wirenboard-mqtt-proxy.service -> /etc/systemd/system/

##  cmds  ##
(alias: systemctl enable 	wirenboard-mqtt-proxy)
systemctl start 	wirenboard-mqtt-proxy
systemctl restart 	wirenboard-mqtt-proxy
systemctl status 	wirenboard-mqtt-proxy
systemctl stop 		wirenboard-mqtt-proxy
journalctl -u wirenboard-mqtt-proxy -f


npm root -g
Show global path
