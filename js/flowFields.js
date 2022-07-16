// Interactive visualization with vectors that turn toward the mouse
// wherever it is on the screen, change color based on how close they are
// to the mouse, and change width based on how fast the mouse is moving and
// how close it is to each point.

// Each flow vector will be an object from the FlowVector class

class FlowVector {
  // x and y coords passed on object creation are stored as private instance variables
  // with getters and setters
  #x;
  #y;
  #color;
  #width;
  constructor(xInput, yInput) {
    this.#x = xInput;
    this.#y = yInput;
    this.#color = "#FFFFFF";
    this.#width = 1;
  }

  get x() {
    return this.#x;
  }

  set x(value) {
    this.#x = value;
  }

  get y() {
    return this.#y;
  }

  set y(value) {
    this.#y = value;
  }

  get color() {
    return this.#color;
  }

  set color(hexString) {
    this.#color = hexString;
  }

  get width() {
    return this.#width;
  }

  set width(value) {
    this.#width = value;
  }
}

let hexWidth = 500,
  hexHeight = 400,
  hexCenter = [600, 600],
  ySpacing = 100,
  // Need to set the x spacing based on the hexagon line angle and the ySpacing so that the hexagons will be regular. This
  // means that the x spacing will be ~0.866 * y
  xSpacing = Math.cos(Math.PI / 6) * ySpacing,
  // Round down for the num x (num cols), and num y (num rows) to keep within the selected bounding box
  numX = Math.floor(hexWidth / xSpacing),
  numY = Math.floor(hexHeight / ySpacing),
  numGridPoints = numX * numY,
  xArray = [],
  // These are the raw y values (a rectangular grid with horizontal rows)
  yArrayRaw = [],
  // These are the y values after the stagger has been applied. X values don't change,
  // so points are still in columns, but alternate rows are each staggered up/down by ySpacing / 2
  yArrayOffset = [];

window.onload = function () {
  let canvas = document.getElementById("canvas"),
    context = canvas.getContext("2d"),
    width = (canvas.width = window.innerWidth),
    height = (canvas.height = window.innerHeight);
};

// import { Vector, Particle } from "./physicsClasses.js";

// // toggle whether using a single point or 'fireworks'
// let singleToggle = false;
// let p;
// window.onload = function () {
//   let canvas = document.getElementById("canvas"),
//     context = canvas.getContext("2d"),
//     width = (canvas.width = window.innerWidth),
//     height = (canvas.height = window.innerHeight),
//     gravity = [],
//     numParticles = 100;
//   if (!singleToggle) {
//     for (let i = 0; i < numParticles; i++) {
//       gravity.push(
//         new Particle(
//           width / 2,
//           height / 2,
//           Math.random() * 4 + 1,
//           Math.random() * Math.PI * 2
//         )
//       );
//     }
//   } else {
//     p = new Particle(100, height, 10, -Math.PI / 2);
//   }

//   // This script imports the Particle class
//   let accel = new Vector(0.07, 0.05);
//   //let position = new Vector(500, 500);
//   //let velocity = new Vector(0, 0);

//   //   velocity.setLength(20);
//   //   velocity.setAngle((3 * Math.PI) / 4);

//   function update() {
//     context.clearRect(0, 0, width, height);

//     if (!singleToggle) {
//       for (let i = 0; i < numParticles; i++) {
//         let p = gravity[i];
//         p.accelerate(accel);
//         p.update();
//         context.beginPath();
//         context.arc(p.position.x, p.position.y, 10, 0, 2 * Math.PI, false);
//         context.fill();
//       }
//     } else {
//       p.accelerate(accel);
//       p.update();
//       //position.addTo(velocity);
//       context.beginPath();
//       context.arc(p.position.x, p.position.y, 10, 0, 2 * Math.PI, false);
//       context.fill();
//     }
//     //}

//     requestAnimationFrame(update);
//   }
//   update();
//   context.fillRect(0, 0, width, height);
// };
