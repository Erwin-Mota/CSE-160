// asg0.js
 function main() {
 // Retrieve <canvas> element <- (1)
 var canvas = document.getElementById('example');
 if (!canvas) {
 console.log('Failed to retrieve the <canvas> element');
 return;
 }

 // Get the rendering context for 2DCG <- (2)
 var ctx = canvas.getContext('2d');
 // Draw a blue rectangle <- (3)
 ctx.fillStyle = 'rgba(0, 0, 255, 1.0)'; // Set a blue color
 ctx.fillRect(120, 10, 150, 150); 
 
 ctx.clearRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle='black';
 ctx.fillRect(0, 0, canvas.width, canvas.height);
 let v1= new Vector3([1,1,0]);
 drawVector(v1,"red");

 }

 function drawVector(v,color){
    const canvas=document.getElementById('example');
    const ctx= canvas.getContext('2d');
    const scale=20;
    const originX=200;
    const originY=200;

    const x=v.elements[0] * scale;
    const y=v.elements[1] * scale;

    ctx.beginPath();
    ctx.moveTo(originX,originY);
    ctx.lineTo(originX+x, originY-y);
    ctx.strokeStyle=color;
    ctx.stroke();
 }
 function handleDrawEvent(){
   const canvas =document.getElementById('example');
   const ctx=canvas.getContext('2d');

   ctx.clearRect(0,0,canvas.width,canvas.height);

   ctx.fillStyle = "black";
   ctx.fillRect(0, 0, canvas.width, canvas.height);
   let v1x = parseFloat(document.getElementById("v1x").value);
   let v1y = parseFloat(document.getElementById("v1y").value);

   let v2x = parseFloat(document.getElementById("v2x").value);
   let v2y = parseFloat(document.getElementById("v2y").value);

   let v1= new Vector3([v1x,v1y,0]);
   let v2= new Vector3([v2x,v2y,0]);
   drawVector(v1,"red");
   drawVector(v2,"blue");
 }
 function handleDrawOperationEvent() {
  const canvas = document.getElementById('example');
  const ctx = canvas.getContext('2d');

  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);


  let v1x = parseFloat(document.getElementById("v1x").value);
  let v1y = parseFloat(document.getElementById("v1y").value);


  let v2x = parseFloat(document.getElementById("v2x").value);
  let v2y = parseFloat(document.getElementById("v2y").value);

  let v1 = new Vector3([v1x, v1y, 0]);
  let v2 = new Vector3([v2x, v2y, 0]);

  // Draw originals
  drawVector(v1, "red");
  drawVector(v2, "blue");

  let op = document.getElementById("operation").value;
  let scalar = parseFloat(document.getElementById("scalar").value);

  if (op === "add") {
    let v3 = new Vector3(v1.elements);
    v3.add(v2);
    drawVector(v3, "green");

  } else if (op === "sub") {
    let v3 = new Vector3(v1.elements);
    v3.sub(v2);
    drawVector(v3, "green");

  } else if (op === "mul") {
    let v3 = new Vector3(v1.elements);
    let v4 = new Vector3(v2.elements);

    v3.mul(scalar);
    v4.mul(scalar);

    drawVector(v3, "green");
    drawVector(v4, "green");

  } else if (op === "div") {
    let v3 = new Vector3(v1.elements);
    let v4 = new Vector3(v2.elements);

    v3.div(scalar);
    v4.div(scalar);

    drawVector(v3, "green");
    drawVector(v4, "green");
  }
  else if(op==="mag"){
   console.log("Magnitude v1:", v1.magnitude());
   console.log("Magnitude v2:", v2.magnitude());

  }
  else if(op==="norm"){
   let v3= new Vector3(v1.elements);
   let v4= new Vector3(v2.elements);
   v3.normalize();
   v4.normalize();

   drawVector(v3,"green");
   drawVector(v4,"green");

  }
  else if(op==="angle"){
   let angle=angleBetween(v1,v2);
   console.log("Angle between v1 and v2:", angle);
  }
  else if (op === "area") {
  let area = areaTriangle(v1, v2);
  console.log("Area of triangle:", area);
}

  function angleBetween(v1, v2) {
  let dot = Vector3.dot(v1, v2);

  let m1 = v1.magnitude();
  let m2 = v2.magnitude();

  if (m1 === 0 || m2 === 0) {
    return null; // avoid divide by zero
  }
  let cosAlpha= dot/(m1*m2);
  cosAlpha=Math.max(-1,Math.min(1,cosAlpha));
  let angleRad = Math.acos(cosAlpha);
  let angleDeg = angleRad * (180 / Math.PI);

  return angleDeg;
}
function areaTriangle(v1,v2){
   let cross = Vector3.cross(v1, v2);
   let areaParallelogram=cross.magnitude();
   let areaTriangle = areaParallelogram / 2;

  return areaTriangle;

}

 }