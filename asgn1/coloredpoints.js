var VSHADER_SOURCE =
'attribute vec4 a_Position;\n' +
'uniform float u_Size;\n' +
'void main() {\n' +
'  gl_Position = a_Position;\n' +
'  gl_PointSize = u_Size;\n' +
'}\n';

 // Fragment shader program
 var FSHADER_SOURCE =
 'precision mediump float;\n' +
 'uniform vec4 u_FragColor;\n' + // uniform variable <- (1)
 'void main() {\n' +
 ' gl_FragColor = u_FragColor;\n' + 
 '}\n';

 let gl;
 let canvas;
 let a_Position;
 let u_FragColor;

 function drawTriangle(vertices) {
  
  var n = 3; // The number of vertices

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}

 var g_shapesList=[];
 //let g_points=[];
 //let g_colors=[];
 //let g_sizes=[];
 let u_Size;

 function setupWebGL(){
    canvas = document.getElementById('webgl');
    //gl = getWebGLContext(canvas);
    gl=canvas.getContext("webgl", {preserveDrawingBuffer: true})
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
 }

 function connectVariablesToGLSL(){
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log("Shader failed to initialize");
        return;
    }
    // Get the storage location of a_Position variable
     a_Position = gl.getAttribLocation(gl.program, 'a_Position');

 // Get the storage location of u_FragColor variable
     u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
     u_Size = gl.getUniformLocation(gl.program, 'u_Size');
 }

 const POINT=0;
 const TRIANGLE=1;
 const CIRCLE=2;

 let g_selectedColor=[1.0,1.0,1.0,1.0];
 let g_selectedSize=5;
 let g_selectedType=POINT;
 let g_selectedSegments=10;

 function addActionsForHtmlUI(){
    g_selectedColor = [
  document.getElementById('red').value / 100,
  document.getElementById('green').value / 100,
  document.getElementById('blue').value / 100,
  1.0
];

  document.getElementById('red').addEventListener('input', function() {
  g_selectedColor[0] = this.value / 100;
});

document.getElementById('green').addEventListener('input', function() {
  g_selectedColor[1] = this.value / 100;
});

document.getElementById('blue').addEventListener('input', function() {
  g_selectedColor[2] = this.value / 100;
});
document.getElementById('clearButton').onclick= function() {g_shapesList=[]; renderAllShapes()};

document.getElementById('pointButton').onclick= function(){g_selectedType=POINT};
document.getElementById('triButton').onclick= function(){g_selectedType=TRIANGLE};
document.getElementById('circleButton').onclick= function(){g_selectedType=CIRCLE};
document.getElementById('size').addEventListener('input', function() {
  g_selectedSize = this.value;
});
document.getElementById('segments').addEventListener('input', function() {
  g_selectedSegments = this.value;
});
document.getElementById('drawPictureButton').onclick = drawMyPicture;
}
 


 function renderAllShapes(){
    var startTime=performance.now();
    gl.clear(gl.COLOR_BUFFER_BIT);
    //var len = g_points.length;
    var len=g_shapesList.length;

    for(var i = 0; i < len; i++) {
        g_shapesList[i].render();
    }

    var duration = performance.now();
    sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration), "numdot");
 
}
function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}
 function click(ev){
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    let point;
    if(g_selectedType==POINT){
        point=new Point();
    } else if(g_selectedType==TRIANGLE){
        point=new Triangle();
    } else{
        point= new Circle();
    }

    point.position=[x,y];
    point.color=g_selectedColor.slice();
    point.size=g_selectedSize;
    point.segments = g_selectedSegments;
    g_shapesList.push(point);
    
    //g_points.push([x, y]);
    //g_colors.push(g_selectedColor.slice());
     // copy color
    //g_sizes.push(g_selectedSize);
    renderAllShapes();
 }
 function drawMyPicture() {
  g_shapesList = [];

 
  let roof = new Triangle();
  roof.vertices = [
    -0.5, 0.0,
     0.0, 0.6,
     0.5, 0.0
  ];
  roof.color = [0.8, 0.1, 0.1, 1.0];
  roof.size = 10;
  g_shapesList.push(roof);

  
  let wall1 = new Triangle();
  wall1.vertices = [
    -0.4, 0.0,
    -0.4, -0.6,
     0.4, -0.6
  ];
  wall1.color = [0.6, 0.3, 0.1, 1.0];
  wall1.size = 10;
  g_shapesList.push(wall1);

  let wall2 = new Triangle();
  wall2.vertices = [
    -0.4, 0.0,
     0.4, -0.6,
     0.4, 0.0
  ];
  wall2.color = [0.6, 0.3, 0.1, 1.0];
  wall2.size = 10;
  g_shapesList.push(wall2);

  
  let door1 = new Triangle();
  door1.vertices = [
    -0.1, -0.6,
     0.1, -0.6,
     0.1, -0.38
  ];
  door1.color = [0.35, 0.18, 0.08, 1.0];
  g_shapesList.push(door1);

  let door2 = new Triangle();
  door2.vertices = [
    -0.1, -0.6,
     0.1, -0.38,
    -0.1, -0.38
  ];
  door2.color = [0.35, 0.18, 0.08, 1.0];
  g_shapesList.push(door2);

  
  let glassL1 = new Triangle();
  glassL1.vertices = [
    -0.335, -0.285,
    -0.185, -0.285,
    -0.185, -0.135
  ];
  glassL1.color = [0.75, 0.9, 1.0, 1.0];
  g_shapesList.push(glassL1);

  let glassL2 = new Triangle();
  glassL2.vertices = [
    -0.335, -0.285,
    -0.185, -0.135,
    -0.335, -0.135
  ];
  glassL2.color = [0.75, 0.9, 1.0, 1.0];
  g_shapesList.push(glassL2);

  let xL1a = new Triangle();
  xL1a.vertices = [
    -0.3265, -0.1265,
    -0.3435, -0.1435,
    -0.1935, -0.2935
  ];
  xL1a.color = [0.18, 0.12, 0.08, 1.0];
  g_shapesList.push(xL1a);

  let xL1b = new Triangle();
  xL1b.vertices = [
    -0.3265, -0.1265,
    -0.1935, -0.2935,
    -0.1765, -0.2765
  ];
  xL1b.color = [0.18, 0.12, 0.08, 1.0];
  g_shapesList.push(xL1b);

  let xL2a = new Triangle();
  xL2a.vertices = [
    -0.3435, -0.2765,
    -0.3265, -0.2935,
    -0.1935, -0.1435
  ];
  xL2a.color = [0.18, 0.12, 0.08, 1.0];
  g_shapesList.push(xL2a);

  let xL2b = new Triangle();
  xL2b.vertices = [
    -0.3435, -0.2765,
    -0.1765, -0.1435,
    -0.1935, -0.1265
  ];
  xL2b.color = [0.18, 0.12, 0.08, 1.0];
  g_shapesList.push(xL2b);

  let glassR1 = new Triangle();
  glassR1.vertices = [
     0.185, -0.285,
     0.335, -0.285,
     0.335, -0.135
  ];
  glassR1.color = [0.75, 0.9, 1.0, 1.0];
  g_shapesList.push(glassR1);

  let glassR2 = new Triangle();
  glassR2.vertices = [
     0.185, -0.285,
     0.335, -0.135,
     0.185, -0.135
  ];
  glassR2.color = [0.75, 0.9, 1.0, 1.0];
  g_shapesList.push(glassR2);

  let xR1a = new Triangle();
  xR1a.vertices = [
     0.1935, -0.1265,
     0.1765, -0.1435,
     0.3265, -0.2765
  ];
  xR1a.color = [0.18, 0.12, 0.08, 1.0];
  g_shapesList.push(xR1a);

  let xR1b = new Triangle();
  xR1b.vertices = [
     0.1935, -0.1265,
     0.3265, -0.2765,
     0.3435, -0.2935
  ];
  xR1b.color = [0.18, 0.12, 0.08, 1.0];
  g_shapesList.push(xR1b);

  let xR2a = new Triangle();
  xR2a.vertices = [
     0.1765, -0.2765,
     0.1935, -0.2935,
     0.3435, -0.1435
  ];
  xR2a.color = [0.18, 0.12, 0.08, 1.0];
  g_shapesList.push(xR2a);

  let xR2b = new Triangle();
  xR2b.vertices = [
     0.1765, -0.2765,
     0.3435, -0.1435,
     0.3265, -0.1265
  ];
  xR2b.color = [0.18, 0.12, 0.08, 1.0];
  g_shapesList.push(xR2b);

  let trunk1 = new Triangle();
  trunk1.vertices = [
     0.6, -0.2,
     0.6, -0.7,
     0.7, -0.7
  ];
  trunk1.color = [0.4, 0.2, 0.1, 1.0];
  trunk1.size = 10;
  g_shapesList.push(trunk1);

  let trunk2 = new Triangle();
  trunk2.vertices = [
     0.6, -0.2,
     0.7, -0.7,
     0.7, -0.2
  ];
  trunk2.color = [0.4, 0.2, 0.1, 1.0];
  trunk2.size = 10;
  g_shapesList.push(trunk2);

  
  
  let leaf1 = new Triangle();
  leaf1.vertices = [
     0.55, -0.2,
     0.85, -0.2,
     0.70, 0.2
  ];
  leaf1.color = [0.0, 0.7, 0.0, 1.0];
  g_shapesList.push(leaf1);

  let leaf2 = new Triangle();
  leaf2.vertices = [
     0.55, 0.0,
     0.85, 0.0,
     0.70, 0.4
  ];
  leaf2.color = [0.0, 0.8, 0.0, 1.0];
  g_shapesList.push(leaf2);

  let leaf3 = new Triangle();
  leaf3.vertices = [
     0.60, 0.2,
     0.80, 0.2,
     0.70, 0.55
  ];
  leaf3.color = [0.0, 0.6, 0.0, 1.0];
  g_shapesList.push(leaf3);

  let leaf4 = new Triangle();
  leaf4.vertices = [
     0.62, 0.35,
     0.78, 0.35,
     0.70, 0.7
  ];
  leaf4.color = [0.0, 0.75, 0.0, 1.0];
  g_shapesList.push(leaf4);

  
  let sunCenter = [-0.72, 0.72];

  for (let i = 0; i < 12; i++) {
    let angle1 = (i / 12) * 2 * Math.PI;
    let angle2 = ((i + 1) / 12) * 2 * Math.PI;

    let t = new Triangle();
    t.vertices = [
      sunCenter[0], sunCenter[1],
      sunCenter[0] + 0.15 * Math.cos(angle1),
      sunCenter[1] + 0.15 * Math.sin(angle1),
      sunCenter[0] + 0.15 * Math.cos(angle2),
      sunCenter[1] + 0.15 * Math.sin(angle2)
    ];

    t.color = [1.0, 1.0, 0.0, 1.0];
    g_shapesList.push(t);
  }

  renderAllShapes();
}
 
 function main() {
    setupWebGL();
    connectVariablesToGLSL();
    addActionsForHtmlUI();

    canvas.onmousedown = click;
    canvas.onmousemove= function(ev) {if(ev.buttons==1) {click(ev)}};

    renderAllShapes();
    
 }
 
 