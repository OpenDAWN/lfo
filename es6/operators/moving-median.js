import BaseLfo from '../core/base-lfo';


export default class MovingMedian extends BaseLfo {
  constructor(options) {
    const defaults = {
      order: 9,
    };

    super(options, defaults);

    if (this.params.order % 2 === 0) {
      throw new Error('order must be an odd number');
    }

    this.queue = new Float32Array(this.params.order);
    this.sorter = [];
  }

  reset() {
    super.reset();

    for (let i = 0, l = this.queue.length; i < l; i++) {
      this.queue[i] = 0;
    }
  }

  process(time, frame, metaData) {
    const outFrame = this.outFrame;
    const frameSize = frame.length;
    const order = this.params.order;
    const pushIndex = this.params.order - 1;
    const medianIndex = Math.floor(order / 2);

    for (let i = 0; i < frameSize; i++) {
      const current = frame[i];
      // update queue
      this.queue.set(this.queue.subarray(1), 0);
      this.queue[pushIndex] = current;
      // get median
      this.sorter = Array.from(this.queue.values());
      this.sorter.sort((a, b) => a - b);

      outFrame[i] = this.sorter[medianIndex];
    }

    this.output(time, outFrame, metaData);
  }
}