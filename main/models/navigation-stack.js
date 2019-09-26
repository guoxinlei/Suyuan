/**
 * navigation stack
 */

const NavigationStack = {
  stacks: [],
  push(sceneKey) {
    this.stacks.push(sceneKey);
  },
  pop() {
    this.stacks.pop();
    console.log(this.stacks);
  },
  popTop() {
    this.stacks = [];
  }
}

export default NavigationStack;
