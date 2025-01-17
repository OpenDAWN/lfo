import BaseLfo from '../core/base-lfo';


export default class Framer extends BaseLfo {
  constructor(options) {
    const defaults = {
      frameSize: 512,
      centeredTimeTag: false
    };

    super(options, defaults);

    this.frameIndex = 0;
  }

  configureStream() {
    // defaults to `hopSize` === `frameSize`
    if (!this.params.hopSize) {
      this.params.hopSize = this.params.frameSize;
    }

    this.streamParams.frameSize = this.params.frameSize;
    this.streamParams.frameRate = this.streamParams.sourceSampleRate / this.params.hopSize;
  }

  // @NOTE must be tested
  reset() {
    this.frameIndex = 0;
    super.reset();
  }

  finalize() {
    // @NOTE what about time ?
    // fill the ongoing buffer with 0
    for (let i = this.frameIndex, l = this.outFrame.length; i < l; i++) {
      this.outFrame[i] = 0;
    }
    // output it
    this.output();

    super.finalize();
  }

  process(time, block, metaData) {
    const sampleRate = this.streamParams.sourceSampleRate;
    const samplePeriod = 1 / sampleRate;

    const frameIndex = this.frameIndex;
    const frameSize = this.streamParams.frameSize;
    const blockSize = block.length;
    const blockIndex = 0;
    const hopSize = this.params.hopSize;

    const outFrame = this.outFrame;

    while (blockIndex < blockSize) {
      const numSkip = 0;

      // skip block samples for negative frameIndex
      if (frameIndex < 0) {
        numSkip = -frameIndex;
      }

      if (numSkip < blockSize) {
        blockIndex += numSkip; // skip block segment
        // can copy all the rest of the incoming block
        const numCopy = blockSize - blockIndex;
        // connot copy more than what fits into the frame
        const maxCopy = frameSize - frameIndex;

        if (numCopy >= maxCopy) {
          numCopy = maxCopy;
        }

        // copy block segment into frame
        const copy = block.subarray(blockIndex, blockIndex + numCopy);
        // console.log(blockIndex, frameIndex, numCopy);
        outFrame.set(copy, frameIndex);

        // advance block and frame index
        blockIndex += numCopy;
        frameIndex += numCopy;

        // send frame when completed
        if (frameIndex === frameSize) {
          // define time tag for the outFrame according to configuration
          if (this.params.centeredTimeTag) {
            this.time = time + (blockIndex - frameSize / 2) * samplePeriod;
          } else {
            this.time = time + (blockIndex - frameSize) * samplePeriod;
          }

          // forward metaData ?
          this.metaData = metaData;

          // forward to next nodes
          this.output();

          // shift frame left
          if (hopSize < frameSize) {
            outFrame.set(outFrame.subarray(hopSize, frameSize), 0);
          }

          frameIndex -= hopSize; // hop forward
        }
      } else {
        // skip entire block
        const blockRest = blockSize - blockIndex;
        frameIndex += blockRest;
        blockIndex += blockRest;
      }
    }

    this.frameIndex = frameIndex;
  }
}
