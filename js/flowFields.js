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
    this.#color = [0, 0, 0];
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
  // These instance methods aren't currently being used.
  // Sets the angle while keeping the length the same
  setAngle(angle) {
    let length = this.getLength();
    this.#x = Math.cos(angle) * length;
    this.#y = Math.sin(angle) * length;
  }

  getAngle() {
    return Math.atan2(this.#y, this.#x);
  }
  // Sets the length while keeping the angle the same
  setLength(length) {
    let angle = this.getAngle();
    this.#x = Math.cos(angle) * length;
    this.#y = Math.sin(angle) * length;
  }

  getLength() {
    return Math.sqrt(this.#x * this.#x + this.#y * this.#y);
  }
}

// Javascript implementation of the Turbo color map polynomial approximation from
// https://gist.github.com/mikhailov-work/0d177465a8151eb6ede1768d51d476c7
// more information about Turbo is here
// https://ai.googleblog.com/2019/08/turbo-improved-rainbow-colormap-for.html

const getTurboRGB = function (inputDecimal) {
  // inputDecimal is the variable that determines the color to return (i.e. where on a
  // color ramp from [0,1] the variable value should fall)

  let kRedVec4 = [0.13572138, 4.6153926, -42.66032258, 132.13108234],
    kGreenVec4 = [0.09140261, 2.19418839, 4.84296658, -14.18503333],
    kBlueVec4 = [0.1066733, 12.64194608, -60.58204836, 110.36276771],
    kRedVec2 = [-152.94239396, 59.28637943],
    kGreenVec2 = [4.27729857, 2.82956604],
    kBlueVec2 = [-89.90310912, 27.34824973];
  let colorMapSelection_sat = 0;
  // Implementation of the glsl saturate() function to ensure the colorMapSelection value is
  // within [0,1] (https://developer.download.nvidia.com/cg/saturate.html)
  if (inputDecimal > 1) {
    colorMapSelection_sat = 1;
  } else if (inputDecimal < 0) {
    colorMapSelection_sat = 0;
  } else {
    colorMapSelection_sat = inputDecimal;
  }

  let v4 = [
    1.0,
    colorMapSelection_sat,
    colorMapSelection_sat * colorMapSelection_sat,
    colorMapSelection_sat * colorMapSelection_sat * colorMapSelection_sat,
  ];
  //  Implementation of v4.zw * v4.z GLSL swizzle. Need to cast as array for dotProduct to work correctly below.
  let v2 = [v4[2] * v4[2], v4[3] * v4[2]];

  // function to perform a dot product of 2 input arrays (modified from https://stackoverflow.com/questions/64816766/dot-product-of-two-arrays-in-javascript)
  const dotProduct = function (array1, array2) {
    // When give the map callback 2 parameters, the second is the index value (int) of the
    // currently looped arrayElement
    //console.log("array1");
    //console.log(array1);
    return array1
      .map((arrayElement, arrayIndex) => {
        return array1[arrayIndex] * array2[arrayIndex];
      })
      .reduce((totalValue, currentValue) => {
        return (totalValue += currentValue);
      }, 0);
  };

  //console.log({ v4 });
  //console.log({ kRedVec4 });
  // Color RGB values calculated below are in [0,1], so multiply by 255 here to get ready to use as CSS colors.
  let red = 255 * (dotProduct(v4, kRedVec4) + dotProduct(v2, kRedVec2));
  let green = 255 * (dotProduct(v4, kGreenVec4) + dotProduct(v2, kGreenVec2));
  let blue = 255 * (dotProduct(v4, kBlueVec4) + dotProduct(v2, kBlueVec2));

  let turboRGB = [red, green, blue];
  //console.log(turboRGB);
  return turboRGB;
};

let hexWidth = 900,
  hexHeight = 800,
  //hexCenter = [600, 600],
  ySpacing = 15,
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
  yArrayOffset = [],
  // These 4 arrays will be used to keep track of the x,y coords for both ends of each point's vector every time the mouse moves.
  xArraySide1Offset = [],
  xArraySide2Offset = [],
  yArraySide1Offset = [],
  yArraySide2Offset = [],
  windowWidth,
  windowHeight,
  center,
  xStartPoint,
  yStartPoint,
  // Will be array of point objects, with one point object per point
  flowVectorHolder = [];
// Sets whether to use a glow or not
//glow = false;

window.onload = function () {
  let canvas = document.getElementById("canvas"),
    context = canvas.getContext("2d"),
    currColNum,
    currRowNum,
    currXCoord,
    currYCoord_raw,
    currYCoord_offset,
    currFlowVector_obj,
    glow,
    lineWidth;

  document.querySelector("#glow").addEventListener("change", (event) => {
    console.log(event.currentTarget.checked);
    glow = event.currentTarget.checked;
    console.log({ glow });
    render(lineWidth, glow);
  });

  lineWidth = 6;

  windowWidth = canvas.width = window.innerWidth;
  windowHeight = canvas.height = window.innerHeight;
  center = [windowWidth / 2, windowHeight / 2];
  // The x start point will err to the left
  xStartPoint = center[0] - Math.ceil(numX * xSpacing) / 2;
  // The y start point will err up
  yStartPoint = center[1] - Math.ceil(numY * ySpacing) / 2;

  for (let pointNum = 0; pointNum < numGridPoints; pointNum++) {
    //console.log(pointNum);
    // 0 indexed
    currRowNum = Math.floor(pointNum / numX);
    // 0 indexed
    currColNum = pointNum - currRowNum * numX;
    // Populate the x, y arrays using the row/col nums for calc.
    // Use ceil to make integer number of pixels
    currXCoord = Math.ceil(xStartPoint + currColNum * xSpacing);
    currYCoord_raw = Math.ceil(yStartPoint + currRowNum * ySpacing);

    xArray.push(currXCoord);
    yArrayRaw.push(currYCoord_raw);
    // Offset the yArray values by ySpacing / 2 depending on the col number. Even col #
    // offsets down (on the screen, so add the offset), even col # stay the same.
    if (currColNum % 2 === 0) {
      currYCoord_offset = currYCoord_raw + ySpacing / 2;
    } else {
      currYCoord_offset = currYCoord_raw;
    }
    yArrayOffset.push(currYCoord_offset);
    // Use the x, y coords to set up a new FlowVector object for each coord.
    currFlowVector_obj = new FlowVector(currXCoord, currYCoord_offset);
    flowVectorHolder.push(currFlowVector_obj);

    // This is now handled in the render function.
    // Draw each point to the canvas as it is calculated
    //context.beginPath();
    //context.arc(currXCoord, currYCoord_offset, 10, 0, 2 * Math.PI, false);
    //context.fill();
  }

  // event.clientX and clientY are relative to upper left corner
  let xCursorLoc = 0,
    yCursorLoc = 0,
    rescaleRotateX = 0,
    rescaleRotateY = 0;
  document.body.addEventListener("mousemove", function (event) {
    xCursorLoc = event.clientX;
    yCursorLoc = event.clientY;
    // console.log(xCursorLoc);
    // console.log(yCursorLoc);
    let currXIndex,
      currYIndex,
      currXCursorDist,
      currYCursorDist,
      // The max distance possible on the screen (diagonal)
      maxVectDist = Math.sqrt(
        windowWidth * windowWidth + windowHeight * windowHeight
      ),
      currVectDist,
      currRGB,
      linearDecay,
      logDecay,
      currDistRatio,
      currCursorAngle,
      currLeftDeflectX,
      currLeftDeflectY,
      currRightDeflectX,
      currRightDeflectY,
      // Eventually this will be derived from a formula to allow altering the length based on distance from the cursor.
      //Currently this is the total length of the vector (half is allocated to each side around the center point).
      // If this is the same as the ySpacing, will exactly form closed lines vertically and along diagonals
      deflectLengthFactor = 15;

    for (let currIndex = 0; currIndex < xArray.length; currIndex++) {
      currXIndex = xArray[currIndex];
      currYIndex = yArrayOffset[currIndex];
      // Positive for cursor being to right of the point, negative for being to left
      currXCursorDist = xCursorLoc - currXIndex;
      // Positive for cursor being below the point, negative for being above
      currYCursorDist = yCursorLoc - currYIndex;
      // The current absolute distance between the cursor and the current vector in the hex grid
      currVectDist = Math.sqrt(
        currXCursorDist * currXCursorDist + currYCursorDist * currYCursorDist
      );

      // Get the ratio of the current distance between cursor and vector and the max possible distance. This is used to
      // generate the rgb color vector using the Turbo color map
      // Linear decay (doesn't get to reds quickly)
      linearDecay = currVectDist / maxVectDist;
      // Log decay (doesn't preserve a lot of blues)
      logDecay = 1 - 1 / Math.log10(currVectDist);
      // Modify the color decay with distance by changing the weights below.
      currDistRatio = 0.4 * linearDecay + 0.6 * logDecay;
      currRGB = getTurboRGB(currDistRatio);
      // Set the RGB as the color for the current instance of the FlowVector (to be used for rendering below)
      flowVectorHolder[currIndex].color = currRGB;

      //console.log({ currDistRatio });
      //console.log(currRGB);

      // Get the angle of the line between the point and the cursor in radians
      currCursorAngle = Math.atan2(currYCursorDist, currXCursorDist);
      // calculate the end points of a vector with length deflectLengthFactor that is centered on the point's coordinates
      // and is pointing toward the cursor.
      currLeftDeflectX =
        currXIndex - (deflectLengthFactor / 2) * Math.cos(currCursorAngle);
      currRightDeflectX =
        currXIndex + (deflectLengthFactor / 2) * Math.cos(currCursorAngle);
      currLeftDeflectY =
        currYIndex - (deflectLengthFactor / 2) * Math.sin(currCursorAngle);
      currRightDeflectY =
        currYIndex + (deflectLengthFactor / 2) * Math.sin(currCursorAngle);

      //   console.log("After recent mouse move");
      //   console.log({ xCursorLoc });
      //   console.log({ yCursorLoc });
      //   console.log({ currXIndex });
      //   console.log({ currYIndex });
      //   console.log({ currXCursorDist });
      //   console.log({ currYCursorDist });
      //   console.log({ currCursorAngle });
      //   console.log({ currLeftDeflectX });
      //   console.log({ currRightDeflectX });
      //   console.log({ currLeftDeflectY });
      //   console.log({ currRightDeflectY });

      // Add the calculated x,y points for the vector with an angle pointing to the mouse cursor and a length
      // matching the specifications to the holder arrays (these will get overwritten by index for each vector every
      // time the cursor moves)
      xArraySide1Offset[currIndex] = currLeftDeflectX;
      xArraySide2Offset[currIndex] = currRightDeflectX;
      yArraySide1Offset[currIndex] = currLeftDeflectY;
      yArraySide2Offset[currIndex] = currRightDeflectY;
    }

    // Now need to rotate by the previous angle (used to render the arrow, and used for the x, y coords)
    // console.log(rescaleX);
    // console.log({ x });
    // console.log(rescaleY);
    // console.log({ y });
    // // Rotate axes CW
    // rescaleRotateX =
    //   -1 * rescaleX * Math.cos(angle) + rescaleY * Math.sin(angle);
    // rescaleRotateY = rescaleX * Math.sin(angle) + rescaleY * Math.cos(angle);
    // console.log({ rescaleRotateX });
    // console.log({ rescaleRotateY });

    // dx = rescaleRotateX - x;
    // dy = rescaleRotateY - y;
    // angleTest = 180 - Math.atan2(dy, dx) * (180 / Math.PI);
    // console.log({ angleTest });
    // //angle = Math.atan2(dy, dx);
    // console.log({ dx });
    // console.log({ dy });
    // console.log(angle);
  });

  function render(lineWidth, glow) {
    // comment out to have past vectors persist
    context.clearRect(0, 0, windowWidth, windowHeight);
    let currXvalue,
      currYvalue,
      currXvalue_side1,
      currXvalue_side2,
      currYvalue_side1,
      currYvalue_side2,
      currColorArray;

    //context.clearRect(0, 0, width, height);
    //context.save();
    //context.translate(arrowX, arrowY);
    //context.rotate(angle);
    // Canvas already offset by arrowX and arrowY, so don't need any other offset.
    //x = Math.cos(animateAngle) * radius;
    //y = Math.sin(animateAngle) * radius;

    // Loop through all of the arrays for plotting. The x and y array will be used
    // to plot the center point for each vector, and the x and y arrays for sides 1 and 2 will
    // be used to plot the vector for the point that points to the cursor position (and with a correct,
    //pre-calculated length)
    for (let index = 0; index < xArray.length; index++) {
      currColorArray = flowVectorHolder[index].color;
      //console.log("*******************");
      // console.log(currColorArray[0]);
      // console.log(currColorArray[1]);
      // console.log(currColorArray[2]);
      //context.strokeStyle = "rgb(255,0,0)";
      context.lineWidth = lineWidth;
      context.strokeStyle = `rgb(${currColorArray[0]},${currColorArray[1]},${currColorArray[2]})`;
      //console.log(
      //  `rgb(${currColorArray[0]},${currColorArray[1]},${currColorArray[2]})`
      //);
      context.beginPath();

      //currXvalue = xArray[index];
      //currYvalue = yArrayOffset[index];
      currXvalue = flowVectorHolder[index].x;
      currYvalue = flowVectorHolder[index].y;
      currXvalue_side1 = xArraySide1Offset[index];
      currXvalue_side2 = xArraySide2Offset[index];
      currYvalue_side1 = yArraySide1Offset[index];
      currYvalue_side2 = yArraySide2Offset[index];

      context.moveTo(currXvalue_side1, currYvalue_side1);
      context.lineTo(currXvalue_side2, currYvalue_side2);
      //context.arc(currXvalue, currYvalue, 1, 0, Math.PI * 2, false);
      context.stroke();
      context.fill();

      if (glow) {
        context.lineWidth = 3;
        context.strokeStyle = `rgb(255,255,255,0.8)`;

        // Can't figure out how to have the glow not extend the whole length of each flow vector.
        // All trials have created dual glow vector areas (change to rgb(0,0,0) to see/debug.)
        // Have the glow cover 80% of the line length (so 90% of each side)
        // side 1 is left, side 2 is right.
        // let glowSide1 = new FlowVector(currXvalue_side1, currYvalue_side1);
        // let glowSide2 = new FlowVector(currXvalue_side2, currYvalue_side2);
        // glowSide1.setLength(0.5 * glowSide1.getLength());
        // glowSide2.setLength(0.5 * glowSide2.getLength());

        currXvalue_side1_glow1 = xArraySide1Offset[index];
        currXvalue_side2_glow1 = xArraySide2Offset[index];
        currYvalue_side1_glow1 = yArraySide1Offset[index];
        currYvalue_side2_glow1 = yArraySide2Offset[index];

        context.moveTo(currXvalue_side1_glow1, currYvalue_side1_glow1);
        context.lineTo(currXvalue_side2_glow1, currYvalue_side2_glow1);
        //context.arc(currXvalue, currYvalue, 1, 0, Math.PI * 2, false);
        //console.log(xArraySide1Offset[index]);
        context.stroke();
        context.fill();

        context.lineWidth = 1.5;
        context.strokeStyle = `rgb(255,255,255,1)`;

        // Can't figure out how to have the glow not extend the whole length of each flow vector.
        // All trials have created dual glow vector areas (change to rgb(0,0,0) to see/debug.)
        // Have the glow cover 80% of the line length (so 90% of each side)
        // side 1 is left, side 2 is right.
        // let glowSide1 = new FlowVector(currXvalue_side1, currYvalue_side1);
        // let glowSide2 = new FlowVector(currXvalue_side2, currYvalue_side2);
        // glowSide1.setLength(0.5 * glowSide1.getLength());
        // glowSide2.setLength(0.5 * glowSide2.getLength());

        currXvalue_side1_glow2 = xArraySide1Offset[index];
        currXvalue_side2_glow2 = xArraySide2Offset[index];
        currYvalue_side1_glow2 = yArraySide1Offset[index];
        currYvalue_side2_glow2 = yArraySide2Offset[index];

        context.moveTo(currXvalue_side1_glow2, currYvalue_side1_glow2);
        context.lineTo(currXvalue_side2_glow2, currYvalue_side2_glow2);
        //context.arc(currXvalue, currYvalue, 1, 0, Math.PI * 2, false);
        //console.log(xArraySide1Offset[index]);
        context.stroke();
        context.fill();
      }

      //context.fillRect(0, 0, width, height);
    }
    // For testing animation speeds.
    //prevHolder = animateAngle;
    //animateAngle += speed;
    //console.log(animateAngle - prevHolder);
    //context.restore();
    requestAnimationFrame(() => {
      render(lineWidth, glow);
    });
  }
  render(lineWidth, glow);
};

// document.body.addEventListener("mousemove", function (event) {
//     rescaleX = event.clientX - width / 2;
//     // -1 needed to flip the y axis
//     rescaleY = -1 * (event.clientY - height / 2);
//     // Now need to rotate by the previous angle (used to render the arrow, and used for the x, y coords)
//     console.log(rescaleX);
//     console.log({ x });
//     console.log(rescaleY);
//     console.log({ y });
//     // Rotate axes CW
//     rescaleRotateX =
//       -1 * rescaleX * Math.cos(angle) + rescaleY * Math.sin(angle);
//     rescaleRotateY = rescaleX * Math.sin(angle) + rescaleY * Math.cos(angle);
//     console.log({ rescaleRotateX });
//     console.log({ rescaleRotateY });

//     dx = rescaleRotateX - x;
//     dy = rescaleRotateY - y;
//     angleTest = 180 - Math.atan2(dy, dx) * (180 / Math.PI);
//     console.log({ angleTest });
//     //angle = Math.atan2(dy, dx);
//     console.log({ dx });
//     console.log({ dy });
//     console.log(angle);
//   });

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
