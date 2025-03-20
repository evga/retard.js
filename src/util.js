export function assert(condition, message) {
  if (condition) return;
  throw new Error(message ?? "assert fail");
}

export class Aggregate {
  constructor() {
    this.cnt = 0;
    this.sum = 0;
    this.vmin = null;
    this.vmax = null;
    this.avg = 0;
  }

  counter() {
    this.cnt++;
  }

  update(v) {
    this.cnt++;
    this.sum += v;
    this.vmin = this.vmin === null ? v : Math.min(v, this.vmin);
    this.vmax = this.vmax === null ? v : Math.max(v, this.vmax);
    this.avg = this.cnt > 0 ? this.sum / this.cnt : 0;
  }
}
