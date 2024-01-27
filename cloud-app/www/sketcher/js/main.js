/*
variables
*/
var model;
var model2;
var canvas;
var canvas2;
var tensorCanvas1;
var tensorCanvas2;
var classNames = [];
var coords = [];
var mousePressed = false;
var mode;

/*
prepare the drawing canvas
*/

$(function () {
    canvas = window._canvas = new fabric.Canvas('canvas');
    canvas.backgroundColor = '#ffffff';
    canvas.isDrawingMode = 0;
    canvas.freeDrawingBrush.color = "black";
    canvas.freeDrawingBrush.width = 10;
    canvas.renderAll();
    //setup listeners
    canvas.on('mouse:up', function (e) {
        getFrame();
        mousePressed = false
    });
    canvas.on('mouse:down', function (e) {
        mousePressed = true
    });
    canvas.on('mouse:move', function (e) {
        recordCoor(e)
    });
})

$(function () {
    canvas2 = new fabric.StaticCanvas('canvas2');
})


/*
record the current drawing coordinates
*/
function recordCoor(event) {
    var pointer = canvas.getPointer(event.e);
    var posX = pointer.x;
    var posY = pointer.y;

    if (posX >= 0 && posX <= 300 && posY >= 0 && posY <= 300 && mousePressed) {
        coords.push(pointer)
    }
}

/*
get the best bounding box by trimming around the drawing
*/
function getMinBox() {
    //get coordinates
    var coorX = coords.map(function (p) {
        return p.x
    });
    var coorY = coords.map(function (p) {
        return p.y
    });

    //find top left and bottom right corners

    var min_coords = {
        x: Math.min.apply(null, coorX),
        y: Math.min.apply(null, coorY)
    }
    //keep the bounds within the canvas, even if the held-mouse click travels outside
    if (Math.max.apply(null, coorX) > 300) {
        maxX = 300
    } else {
        maxX = Math.max.apply(null, coorX)
    }
    if (Math.max.apply(null, coorY) > 300) {
        maxY = 300
    } else {
        maxY = Math.max.apply(null, coorY)
    }
    var max_coords = {
        x: maxX,
        y: maxY
    }

    //return as struct
    console.log(min_coords, max_coords)
    return {
        min: min_coords,
        max: max_coords,

    }
}

/*
get the current image data
*/
function getImageData() {
    //get the minimum bounding box around the drawing
    const mbb = getMinBox()
    console.log('minimum bounding box:', mbb)

    //get image data according to dpi
    const dpi = window.devicePixelRatio
    console.log("dpi", dpi)
    const imgData = canvas.contextContainer.getImageData(mbb.min.x * dpi, mbb.min.y * dpi,
        (mbb.max.x - mbb.min.x) * dpi, (mbb.max.y - mbb.min.y) * dpi);
    console.log(imgData)
    return imgData

}

function getTensorImg(imgData) {
    return tf.tidy(() => {
        //convert to a tensor
        let tensor = tf.browser.fromPixels(imgData, numChannels = 1)

        //resize
        const resized = tf.image.resizeBilinear(tensor, [28, 28]).toFloat()

        //normalize
        const offset = tf.scalar(255.0);
        const normalized = tf.scalar(1.0).sub(resized.div(offset));

        return normalized
    })
}

function getTensorImg2(imgData) {
    return tf.tidy(() => {
        //convert to a tensor
        let tensor = tf.browser.fromPixels(imgData, numChannels = 1)

        //resize
        const resized = tf.image.resizeBilinear(tensor, [56, 56]).toFloat()

        //normalize
        const offset = tf.scalar(255.0);
        const normalized = tf.scalar(1.0).sub(resized.div(offset));

        return normalized
    })
}

/*
preprocess the data
*/
function preprocess(imgData) {
    return tf.tidy(() => {
        //convert to a tensor
        let tensor = tf.browser.fromPixels(imgData, numChannels = 1)

        //resize
        const resized = tf.image.resizeBilinear(tensor, [28, 28]).toFloat()

        //normalize
        const offset = tf.scalar(255.0);
        const normalized = tf.scalar(1.0).sub(resized.div(offset));

        //We add a dimension to get a batch shape
        const batched = normalized.expandDims(0)
        return batched
    })
}

function preprocess2(imgData) {
    return tf.tidy(() => {
        //convert to a tensor
        let tensor = tf.browser.fromPixels(imgData, numChannels = 1)

        //resize
        const resized = tf.image.resizeBilinear(tensor, [56, 56]).toFloat()

        //normalize
        const offset = tf.scalar(255.0);
        const normalized = tf.scalar(1.0).sub(resized.div(offset));

        //We add a dimension to get a batch shape
        const batched = normalized.expandDims(0)
        return batched
    })
}

/*
get the class names
*/
function getClassNames(indices) {
    var outp = []
    for (var i = 0; i < indices.length; i++)
        outp[i] = classNames[indices[i]]
    return outp
}

function setTable(top10, probs) {
    //loop over the predictions
    for (var i = 0; i < top10.length; i++) {
        let sym = document.getElementById('sym' + (i + 1))
        let prob = document.getElementById('prob' + (i + 1))
        sym.innerHTML = top10[i]
        prob.innerHTML = Math.round(probs[i] * 100)
    }
    //create the pie
    createPie(".pieID.legend", ".pieID.pie");
}

function setTable2(top102, probs2) {
    //loop over the predictions
    for (var i = 0; i < top102.length; i++) {
        let sym2 = document.getElementById('sym' + (i + 11))
        let prob2 = document.getElementById('prob' + (i + 11))
        sym2.innerHTML = top102[i]
        prob2.innerHTML = Math.round(probs2[i] * 100)
    }
    //create the 2nd pie
    createPie2(".pieID2.legend2", ".pieID2.pie2");
}

/*
get indices of the top probs
*/
function findIndicesOfMax(inp, count) {
    var outp = [];
    for (var i = 0; i < inp.length; i++) {
        outp.push(i); // add index to output array
        if (outp.length > count) {
            outp.sort(function (a, b) {
                return inp[b] - inp[a];
            }); // descending sort the output array
            outp.pop(); // remove the last index (index of smallest element in output array)
        }
    }
    return outp;
}

/*
find the top 10 predictions
*/
function findTopValues(inp, count) {
    var outp = [];
    let indices = findIndicesOfMax(inp, count)
    // show 10 greatest scores
    for (var i = 0; i < indices.length; i++)
        outp[i] = inp[indices[i]]
    return outp
}

/*
get the prediction
*/
function getFrame() {
    //make sure we have at least two recorded coordinates
    if (coords.length >= 2) {

        //get the image data from the canvas
        imgData = getImageData()

        // draw what the model views (a down-sampled version of the image)
        const tensor = getTensorImg(imgData);
        const tensorResized = tf.image.resizeNearestNeighbor(tensor, size = ([300, 300]));


        const canvas1 = document.getElementById("tensorCanvas1");
        tf.browser.toPixels(tensorResized, canvas1).then(() => {
            tensor.dispose();
        });

        const tensor2 = getTensorImg2(imgData);
        const tensorResized2 = tf.image.resizeNearestNeighbor(tensor2, size = ([300, 300]));
        const canvas2 = document.getElementById("tensorCanvas2");
        tf.browser.toPixels(tensorResized2, canvas2).then(() => {
            tensor.dispose();
        });


        //get the prediction
        const pred = model.predict(preprocess(imgData)).dataSync()
        const pred2 = model2.predict(preprocess2(imgData)).dataSync()

        //find the top 10 predictions
        const indices = findIndicesOfMax(pred, 10)
        const probs = findTopValues(pred, 10)
        const names = getClassNames(indices)

        const indices2 = findIndicesOfMax(pred2, 10)
        const probs2 = findTopValues(pred2, 10)
        const names2 = getClassNames(indices2)

        //set the table
        setTable(names, probs)
        setTable2(names2, probs2)
    }

}

/*
load the class names
*/
async function loadDict() {
    loc = 'model2/class_names.txt'

    await $.ajax({
        url: loc,
        dataType: 'text',
    }).done(success);
}

function success(data) {
    const lst = data.split(/\n/)
    for (var i = 0; i < lst.length - 1; i++) {
        let symbol = lst[i]
        classNames[i] = symbol
    }
}

async function setBackground() {
    const background = 'images/Draw_Here.PNG';
    const fetched = await fetch(background);
    const blob = await fetched.blob();

    const imgBitmap = await createImageBitmap(blob);
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    context.drawImage(imgBitmap, 50, 75);
}

/*
load the model
*/
async function start(cur_mode) {

    mode = cur_mode

    //load the model
    model = await tf.loadLayersModel('model/model.json')
    document.getElementById('status').innerHTML = '28x28 Model loaded';
    model2 = await tf.loadLayersModel('model2/model.json')
    document.getElementById('status2').innerHTML = '56x56 Model Loaded';

    setBackground()

    //warm up
    model.predict(tf.zeros([1, 28, 28, 1]))
    model2.predict(tf.zeros([1, 56, 56, 1]))


    //allow drawing on the canvas
    allowDrawing()

    //load the class names
    await loadDict()
}

/*
allow drawing on canvas
*/
function allowDrawing() {
    canvas.isDrawingMode = 1;
    canvas2.isDrawingMode = 1;

    $('button').prop('disabled', false);
    var slider = document.getElementById('myRange');
    slider.oninput = function () {
        canvas.freeDrawingBrush.width = this.value;
    };


    function afterRender() {

        canvas.off('after:render', afterRender);
        //canvas.drawCopyOnCanvas(canvas2);
        setTimeout(() => {
            canvas.on('after:render', afterRender);
        })
    }

    var c2 = document.getElementById('canvas2');
    var ctx2 = c2.getContext('2d');

    function copyThePencil() {
        if (canvas._isCurrentlyDrawing) {
            ctx2.drawImage(canvas.upperCanvasEl, 0, 0);
            ctx2.restore();
            ctx2.save();
        }
    }

    canvas.on('after:render', afterRender);
    canvas.on('mouse:move', copyThePencil);

    /*var c=document.getElementById("canvas2");
    var ctx=c.getContext("2d");
    var fabricHtmlCanvasElement = document.getElementById('canvas');

    canvas.on('mouse:up', function(options) {
        updateCanvas();
    })

    function updateCanvas(){
        ctx.drawImage(fabricHtmlCanvasElement, 0, 0);
    }*/
}


/*
clear the canvas
*/
function erase() {
    delete imgData;
    canvas.clear();
    canvas2.clear();
    canvas.backgroundColor = '#ffffff';
    canvas2.backgroundColor = '#ffffff';
    coords = [];
}

