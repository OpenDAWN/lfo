import BaseLfo from '../core/base-lfo';
import { decodeMessage } from '../utils/socket-utils';


// @TODO: handle `start` and `stop`
export default class SocketClient extends BaseLfo {
  constructor(options) {
    var defaults = {
      port: 3031,
      address: window.location.hostname
    };

    super(options, defaults);

    this.socket = null;
    this.initConnection();
  }

  start() {
    this.initialize();
    this.reset();
  }

  configureStream() {
    this.streamParams.frameSize = this.params.frameSize;
    this.streamParams.frameRate = this.params.frameRate;
  }

  initConnection() {
    var socketAddr = 'ws://' + this.params.address + ':' + this.params.port;
    this.socket = new WebSocket(socketAddr);
    this.socket.binaryType = 'arraybuffer';

    // callback to start to when WebSocket is connected
    this.socket.onopen = () => {
      this.start();
    };

    this.socket.onclose = () => {

    };

    this.socket.onmessage = (message) => {
      this.process(message.data);
    };

    this.socket.onerror = (err) => {
      console.error(err);
    };
  }

  process(buffer) {
    var message = decodeMessage(buffer);

    this.time = message.time;
    this.outFrame = message.frame;
    this.metaData = message.metaData;

    this.output();
  }
}
