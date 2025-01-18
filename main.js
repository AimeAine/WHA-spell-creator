var height = window.innerHeight - 20;
var GUIDELINE_OFFSET = 5;

var stage = new Konva.Stage({
  container: 'container',
  width: height,
  height: height,
});
var backgroundLayer = new Konva.Layer()
// then create layer
var layer = new Konva.Layer();
var selectionLayer = new Konva.Layer();

// create our shape
var circle = new Konva.Circle({
  x: stage.width() / 2,
  y: stage.height() / 2,
  radius: stage.height() / 2 - 5,
  stroke: 'black',
  strokeWidth: 4
});
// add the shape to the layer
backgroundLayer.add(circle);

// add the layer to the stage
stage.add(backgroundLayer);
stage.add(layer);
stage.add(selectionLayer);
var tr = new Konva.Transformer();
layer.add(tr);

function addSigilToScene(sigil) {
  Konva.Image.fromURL('./assets/sigils/' + sigil + '.png', function (darthNode) {
    darthNode.setAttrs({
      x: 200,
      y: 50,
      scaleX: 0.5,
      scaleY: 0.5,
      cornerRadius: 20,
      name: 'shape sigil',
    });
    darthNode.draggable(true)
    darthNode.on('dblclick dbltap', function () {
      this.destroy();
    });

    darthNode.on('mouseover', function () {
      document.body.style.cursor = 'pointer';
    });
    darthNode.on('mouseout', function () {
      document.body.style.cursor = 'default';
    });
    layer.add(darthNode);

    tr.nodes([darthNode]);
  });
}

function addSignToScene(sign) {
  Konva.Image.fromURL('./assets/signs/' + sign + '.png', function (darthNode) {
    darthNode.setAttrs({
      x: 200,
      y: 50,
      scaleX: 0.5,
      scaleY: 0.5,
      cornerRadius: 20,
      name: 'shape sign',
    });
    darthNode.draggable(true)
    darthNode.on('dblclick dbltap', function () {
      this.destroy();
    });

    darthNode.on('mouseover', function () {
      document.body.style.cursor = 'pointer';
    });
    darthNode.on('mouseout', function () {
      document.body.style.cursor = 'default';
    });
    layer.add(darthNode);

    tr.nodes([darthNode]);
  });
}

// add a new feature, lets add ability to draw selection rectangle
var selectionRectangle = new Konva.Rect({
  fill: 'rgba(0,0,255,0.5)',
  visible: false,
  // disable events to not interrupt with events
  listening: false,
});
selectionLayer.add(selectionRectangle);

var x1, y1, x2, y2;
var selecting = false
var dragging = false
stage.on('mousedown touchstart', (e) => {
  // do nothing if we mousedown on any shape
  // except if it's the circle
  if (e.target !== stage && e.target !== circle) {
    return;
  }
  e.evt.preventDefault();
  x1 = stage.getPointerPosition().x;
  y1 = stage.getPointerPosition().y;
  x2 = stage.getPointerPosition().x;
  y2 = stage.getPointerPosition().y;

  selectionRectangle.width(0);
  selectionRectangle.height(0);
  selecting = true;
});

stage.on('mousemove touchmove', (e) => {
  // do nothing if we didn't start selection
  if (!selecting) {
    return;
  }
  e.evt.preventDefault();
  x2 = stage.getPointerPosition().x;
  y2 = stage.getPointerPosition().y;

  selectionRectangle.setAttrs({
    visible: true,
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  });
});

stage.on('mouseup touchend', (e) => {
  if (dragging) return

  selecting = false;
  if (!selectionRectangle.visible()) {
  //   if (e.target === stage || e.target === circle) tr.nodes([])
    return;
  }
  e.evt.preventDefault();
  // update visibility in timeout, so we can check it in click event
  selectionRectangle.visible(false);
  var shapes = stage.find('.shape');
  var box = selectionRectangle.getClientRect();
  var selected = shapes.filter((shape) =>
    Konva.Util.haveIntersection(box, shape.getClientRect())
  );
  tr.nodes().forEach((node) => { node.draggable(false) })
  tr.nodes(selected);
  tr.nodes().forEach((node) => { node.draggable(true) })
});

// clicks should select/deselect shapes
stage.on('click tap', function (e) {
  // if we are selecting with rect, do nothing
  if (selectionRectangle.visible()) {
    return;
  }
  
  // if click on empty area - remove all selections
  if (e.target === stage) {
    tr.nodes().forEach((node) => { node.draggable(false) })
    tr.nodes([]);
    return;
  }
  
  // do nothing if clicked NOT on our rectangles
  if (!e.target.hasName('shape')) {
    return;
  }
  
  tr.nodes().forEach((node) => { node.draggable(false) })
  // do we pressed shift or ctrl?
  const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
  const isSelected = tr.nodes().indexOf(e.target) >= 0;

  if (!metaPressed && !isSelected) {
    // if no key pressed and the node is not selected
    // select just one
    tr.nodes([e.target]);
  } else if (metaPressed && isSelected) {
    // if we pressed keys and node was selected
    // we need to remove it from selection:
    const nodes = tr.nodes().slice(); // use slice to have new copy of array
    // remove node from array
    nodes.splice(nodes.indexOf(e.target), 1);
    tr.nodes(nodes);
  } else if (metaPressed && !isSelected) {
    // add the node into selection
    const nodes = tr.nodes().concat([e.target]);
    tr.nodes(nodes);
  }
  tr.nodes().forEach((node) => { node.draggable(true) })
});


// were can we snap our objects?
function getLineGuideStops(skipShape) {
  // we can snap to stage borders and the center of the stage
  var vertical = [0, circle.width() / 2, circle.width()];
  var horizontal = [0, circle.height() / 2, circle.height()];

  // and we snap over edges and center of each object on the canvas
  stage.find('.sigil').forEach((guideItem) => {
    if (guideItem === skipShape || tr.nodes().includes(guideItem)) {
      return;
    }
    var box = guideItem.getClientRect();
    // and we can snap to all edges of shapes
    vertical.push([box.x, box.x + box.width, box.x + box.width / 2]);
    horizontal.push([box.y, box.y + box.height, box.y + box.height / 2]);
  });
  return {
    vertical: vertical.flat(),
    horizontal: horizontal.flat(),
  };
}

function getObjectSnappingEdges(node) {
  var box = node.getClientRect();
  var absPos = node.absolutePosition();
  if (tr.nodes().length !== 0) {
    // box = tr.nodes()[0].getClientRect()
    box = tr.getClientRect()
    // box.width -= 5
    box.height += 50
  }

  return {
    vertical: [
      // {
      //   guide: Math.round(box.x),
      //   offset: Math.round(absPos.x - box.x),
      //   snap: 'start',
      // },
      {
        guide: Math.round(box.x + box.width / 2),
        offset: Math.round(absPos.x - box.x - box.width / 2),
        snap: 'center',
      },
      // {
      //   guide: Math.round(box.x + box.width),
      //   offset: Math.round(absPos.x - box.x - box.width),
      //   snap: 'end',
      // },
    ],
    horizontal: [
      // {
      //   guide: Math.round(box.y),
      //   offset: Math.round(absPos.y - box.y),
      //   snap: 'start',
      // },
      {
        guide: Math.round(box.y + box.height / 2),
        offset: Math.round(absPos.y - box.y - box.height / 2),
        snap: 'center',
      },
      // {
      //   guide: Math.round(box.y + box.height),
      //   offset: Math.round(absPos.y - box.y - box.height),
      //   snap: 'end',
      // },
    ],
  };
}

// find all snapping possibilities
function getGuides(lineGuideStops, itemBounds) {
  var resultV = [];
  var resultH = [];

  lineGuideStops.vertical.forEach((lineGuide) => {
    itemBounds.vertical.forEach((itemBound) => {
      var diff = Math.abs(lineGuide - itemBound.guide);
      // if the distance between guild line and object snap point is close we can consider this for snapping
      if (diff < GUIDELINE_OFFSET) {
        resultV.push({
          lineGuide: lineGuide,
          diff: diff,
          snap: itemBound.snap,
          offset: itemBound.offset,
        });
      }
    });
  });

  lineGuideStops.horizontal.forEach((lineGuide) => {
    itemBounds.horizontal.forEach((itemBound) => {
      var diff = Math.abs(lineGuide - itemBound.guide);
      if (diff < GUIDELINE_OFFSET) {
        resultH.push({
          lineGuide: lineGuide,
          diff: diff,
          snap: itemBound.snap,
          offset: itemBound.offset,
        });
      }
    });
  });

  var guides = [];

  // find closest snap
  var minV = resultV.sort((a, b) => a.diff - b.diff)[0];
  var minH = resultH.sort((a, b) => a.diff - b.diff)[0];
  if (minV) {
    guides.push({
      lineGuide: minV.lineGuide,
      offset: minV.offset,
      orientation: 'V',
      snap: minV.snap,
    });
  }
  if (minH) {
    guides.push({
      lineGuide: minH.lineGuide,
      offset: minH.offset,
      orientation: 'H',
      snap: minH.snap,
    });
  }
  return guides;
}

function drawGuides(guides) {
  guides.forEach((lg) => {
    if (lg.orientation === 'H') {
      var line = new Konva.Line({
        points: [-6000, 0, 6000, 0],
        stroke: 'rgb(0, 161, 255)',
        strokeWidth: 1,
        name: 'guid-line',
        dash: [4, 6],
      });
      layer.add(line);
      line.absolutePosition({
        x: 0,
        y: lg.lineGuide,
      });
    } else if (lg.orientation === 'V') {
      var line = new Konva.Line({
        points: [0, -6000, 0, 6000],
        stroke: 'rgb(0, 161, 255)',
        strokeWidth: 1,
        name: 'guid-line',
        dash: [4, 6],
      });
      layer.add(line);
      line.absolutePosition({
        x: lg.lineGuide,
        y: 0,
      });
    }
  });
}

layer.on('dragmove', function (e) {
  // clear all previous lines on the screen
  
  dragging = true
  layer.find('.guid-line').forEach((l) => l.destroy());

  // find possible snapping lines
  var lineGuideStops = getLineGuideStops(e.target);
  // find snapping points of current object
  var itemBounds = getObjectSnappingEdges(e.target);

  // now find where can we snap current object
  var guides = getGuides(lineGuideStops, itemBounds);

  // do nothing of no snapping
  if (!guides.length) {
    return;
  }

  drawGuides(guides);

  var absPos = e.target.absolutePosition();
  // now force object position
  guides.forEach((lg) => {
    switch (lg.orientation) {
      case 'V': {
        absPos.x = lg.lineGuide + lg.offset;
        break;
      }
      case 'H': {
        absPos.y = lg.lineGuide + lg.offset;
        break;
      }
    }
  });
  e.target.absolutePosition(absPos);
});

layer.on('dragend', function (e) {
  dragging = false
  // clear all previous lines on the screen
  layer.find('.guid-line').forEach((l) => l.destroy());
});