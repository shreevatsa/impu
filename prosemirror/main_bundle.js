(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const {EditorState} = require("prosemirror-state")
const {EditorView} = require("prosemirror-view")
const {DOMParser} = require("prosemirror-model")
const {schema} = require("prosemirror-schema-basic")
const {exampleSetup} = require("prosemirror-example-setup")

window.view = new EditorView(document.querySelector("#editor"), {
  state: EditorState.create({
    doc: DOMParser.fromSchema(schema).parse(document.querySelector("#content")),
    plugins: exampleSetup({schema})
  })
})

},{"prosemirror-example-setup":6,"prosemirror-model":12,"prosemirror-schema-basic":13,"prosemirror-state":15,"prosemirror-view":17}],2:[function(require,module,exports){
'use strict';

function crelt() {
  var elt = arguments[0];
  if (typeof elt == "string") elt = document.createElement(elt);
  var i = 1, next = arguments[1];
  if (next && typeof next == "object" && next.nodeType == null && !Array.isArray(next)) {
    for (var name in next) if (Object.prototype.hasOwnProperty.call(next, name)) {
      var value = next[name];
      if (typeof value == "string") elt.setAttribute(name, value);
      else if (value != null) elt[name] = value;
    }
    i++;
  }
  for (; i < arguments.length; i++) add(elt, arguments[i]);
  return elt
}

function add(elt, child) {
  if (typeof child == "string") {
    elt.appendChild(document.createTextNode(child));
  } else if (child == null) ; else if (child.nodeType != null) {
    elt.appendChild(child);
  } else if (Array.isArray(child)) {
    for (var i = 0; i < child.length; i++) add(elt, child[i]);
  } else {
    throw new RangeError("Unsupported child node: " + child)
  }
}

module.exports = crelt;

},{}],3:[function(require,module,exports){
'use strict';

// ::- Persistent data structure representing an ordered mapping from
// strings to values, with some convenient update methods.
function OrderedMap(content) {
  this.content = content;
}

OrderedMap.prototype = {
  constructor: OrderedMap,

  find: function(key) {
    for (var i = 0; i < this.content.length; i += 2)
      if (this.content[i] === key) return i
    return -1
  },

  // :: (string) → ?any
  // Retrieve the value stored under `key`, or return undefined when
  // no such key exists.
  get: function(key) {
    var found = this.find(key);
    return found == -1 ? undefined : this.content[found + 1]
  },

  // :: (string, any, ?string) → OrderedMap
  // Create a new map by replacing the value of `key` with a new
  // value, or adding a binding to the end of the map. If `newKey` is
  // given, the key of the binding will be replaced with that key.
  update: function(key, value, newKey) {
    var self = newKey && newKey != key ? this.remove(newKey) : this;
    var found = self.find(key), content = self.content.slice();
    if (found == -1) {
      content.push(newKey || key, value);
    } else {
      content[found + 1] = value;
      if (newKey) content[found] = newKey;
    }
    return new OrderedMap(content)
  },

  // :: (string) → OrderedMap
  // Return a map with the given key removed, if it existed.
  remove: function(key) {
    var found = this.find(key);
    if (found == -1) return this
    var content = this.content.slice();
    content.splice(found, 2);
    return new OrderedMap(content)
  },

  // :: (string, any) → OrderedMap
  // Add a new key to the start of the map.
  addToStart: function(key, value) {
    return new OrderedMap([key, value].concat(this.remove(key).content))
  },

  // :: (string, any) → OrderedMap
  // Add a new key to the end of the map.
  addToEnd: function(key, value) {
    var content = this.remove(key).content.slice();
    content.push(key, value);
    return new OrderedMap(content)
  },

  // :: (string, string, any) → OrderedMap
  // Add a key after the given key. If `place` is not found, the new
  // key is added to the end.
  addBefore: function(place, key, value) {
    var without = this.remove(key), content = without.content.slice();
    var found = without.find(place);
    content.splice(found == -1 ? content.length : found, 0, key, value);
    return new OrderedMap(content)
  },

  // :: ((key: string, value: any))
  // Call the given function for each key/value pair in the map, in
  // order.
  forEach: function(f) {
    for (var i = 0; i < this.content.length; i += 2)
      f(this.content[i], this.content[i + 1]);
  },

  // :: (union<Object, OrderedMap>) → OrderedMap
  // Create a new map by prepending the keys in this map that don't
  // appear in `map` before the keys in `map`.
  prepend: function(map) {
    map = OrderedMap.from(map);
    if (!map.size) return this
    return new OrderedMap(map.content.concat(this.subtract(map).content))
  },

  // :: (union<Object, OrderedMap>) → OrderedMap
  // Create a new map by appending the keys in this map that don't
  // appear in `map` after the keys in `map`.
  append: function(map) {
    map = OrderedMap.from(map);
    if (!map.size) return this
    return new OrderedMap(this.subtract(map).content.concat(map.content))
  },

  // :: (union<Object, OrderedMap>) → OrderedMap
  // Create a map containing all the keys in this map that don't
  // appear in `map`.
  subtract: function(map) {
    var result = this;
    map = OrderedMap.from(map);
    for (var i = 0; i < map.content.length; i += 2)
      result = result.remove(map.content[i]);
    return result
  },

  // :: number
  // The amount of keys in this map.
  get size() {
    return this.content.length >> 1
  }
};

// :: (?union<Object, OrderedMap>) → OrderedMap
// Return a map with the given content. If null, create an empty
// map. If given an ordered map, return that map itself. If given an
// object, create a map from the object's properties.
OrderedMap.from = function(value) {
  if (value instanceof OrderedMap) return value
  var content = [];
  if (value) for (var prop in value) content.push(prop, value[prop]);
  return new OrderedMap(content)
};

module.exports = OrderedMap;

},{}],4:[function(require,module,exports){
'use strict';

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, '__esModule', {
  value: true
});

var prosemirrorTransform = require('prosemirror-transform');

var prosemirrorModel = require('prosemirror-model');

var prosemirrorState = require('prosemirror-state');

var deleteSelection = function deleteSelection(state, dispatch) {
  if (state.selection.empty) return false;
  if (dispatch) dispatch(state.tr.deleteSelection().scrollIntoView());
  return true;
};

var joinBackward = function joinBackward(state, dispatch, view) {
  var $cursor = state.selection.$cursor;
  if (!$cursor || (view ? !view.endOfTextblock("backward", state) : $cursor.parentOffset > 0)) return false;
  var $cut = findCutBefore($cursor);

  if (!$cut) {
    var range = $cursor.blockRange(),
        target = range && prosemirrorTransform.liftTarget(range);
    if (target == null) return false;
    if (dispatch) dispatch(state.tr.lift(range, target).scrollIntoView());
    return true;
  }

  var before = $cut.nodeBefore;
  if (!before.type.spec.isolating && deleteBarrier(state, $cut, dispatch)) return true;

  if ($cursor.parent.content.size == 0 && (textblockAt(before, "end") || prosemirrorState.NodeSelection.isSelectable(before))) {
    var delStep = prosemirrorTransform.replaceStep(state.doc, $cursor.before(), $cursor.after(), prosemirrorModel.Slice.empty);

    if (delStep && delStep.slice.size < delStep.to - delStep.from) {
      if (dispatch) {
        var tr = state.tr.step(delStep);
        tr.setSelection(textblockAt(before, "end") ? prosemirrorState.Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos, -1)), -1) : prosemirrorState.NodeSelection.create(tr.doc, $cut.pos - before.nodeSize));
        dispatch(tr.scrollIntoView());
      }

      return true;
    }
  }

  if (before.isAtom && $cut.depth == $cursor.depth - 1) {
    if (dispatch) dispatch(state.tr["delete"]($cut.pos - before.nodeSize, $cut.pos).scrollIntoView());
    return true;
  }

  return false;
};

function textblockAt(node, side) {
  var only = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  for (var scan = node; scan; scan = side == "start" ? scan.firstChild : scan.lastChild) {
    if (scan.isTextblock) return true;
    if (only && scan.childCount != 1) return false;
  }

  return false;
}

var selectNodeBackward = function selectNodeBackward(state, dispatch, view) {
  var _state$selection = state.selection,
      $head = _state$selection.$head,
      empty = _state$selection.empty,
      $cut = $head;
  if (!empty) return false;

  if ($head.parent.isTextblock) {
    if (view ? !view.endOfTextblock("backward", state) : $head.parentOffset > 0) return false;
    $cut = findCutBefore($head);
  }

  var node = $cut && $cut.nodeBefore;
  if (!node || !prosemirrorState.NodeSelection.isSelectable(node)) return false;
  if (dispatch) dispatch(state.tr.setSelection(prosemirrorState.NodeSelection.create(state.doc, $cut.pos - node.nodeSize)).scrollIntoView());
  return true;
};

function findCutBefore($pos) {
  if (!$pos.parent.type.spec.isolating) for (var i = $pos.depth - 1; i >= 0; i--) {
    if ($pos.index(i) > 0) return $pos.doc.resolve($pos.before(i + 1));
    if ($pos.node(i).type.spec.isolating) break;
  }
  return null;
}

var joinForward = function joinForward(state, dispatch, view) {
  var $cursor = state.selection.$cursor;
  if (!$cursor || (view ? !view.endOfTextblock("forward", state) : $cursor.parentOffset < $cursor.parent.content.size)) return false;
  var $cut = findCutAfter($cursor);
  if (!$cut) return false;
  var after = $cut.nodeAfter;
  if (deleteBarrier(state, $cut, dispatch)) return true;

  if ($cursor.parent.content.size == 0 && (textblockAt(after, "start") || prosemirrorState.NodeSelection.isSelectable(after))) {
    var delStep = prosemirrorTransform.replaceStep(state.doc, $cursor.before(), $cursor.after(), prosemirrorModel.Slice.empty);

    if (delStep && delStep.slice.size < delStep.to - delStep.from) {
      if (dispatch) {
        var tr = state.tr.step(delStep);
        tr.setSelection(textblockAt(after, "start") ? prosemirrorState.Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos)), 1) : prosemirrorState.NodeSelection.create(tr.doc, tr.mapping.map($cut.pos)));
        dispatch(tr.scrollIntoView());
      }

      return true;
    }
  }

  if (after.isAtom && $cut.depth == $cursor.depth - 1) {
    if (dispatch) dispatch(state.tr["delete"]($cut.pos, $cut.pos + after.nodeSize).scrollIntoView());
    return true;
  }

  return false;
};

var selectNodeForward = function selectNodeForward(state, dispatch, view) {
  var _state$selection2 = state.selection,
      $head = _state$selection2.$head,
      empty = _state$selection2.empty,
      $cut = $head;
  if (!empty) return false;

  if ($head.parent.isTextblock) {
    if (view ? !view.endOfTextblock("forward", state) : $head.parentOffset < $head.parent.content.size) return false;
    $cut = findCutAfter($head);
  }

  var node = $cut && $cut.nodeAfter;
  if (!node || !prosemirrorState.NodeSelection.isSelectable(node)) return false;
  if (dispatch) dispatch(state.tr.setSelection(prosemirrorState.NodeSelection.create(state.doc, $cut.pos)).scrollIntoView());
  return true;
};

function findCutAfter($pos) {
  if (!$pos.parent.type.spec.isolating) for (var i = $pos.depth - 1; i >= 0; i--) {
    var parent = $pos.node(i);
    if ($pos.index(i) + 1 < parent.childCount) return $pos.doc.resolve($pos.after(i + 1));
    if (parent.type.spec.isolating) break;
  }
  return null;
}

var joinUp = function joinUp(state, dispatch) {
  var sel = state.selection,
      nodeSel = sel instanceof prosemirrorState.NodeSelection,
      point;

  if (nodeSel) {
    if (sel.node.isTextblock || !prosemirrorTransform.canJoin(state.doc, sel.from)) return false;
    point = sel.from;
  } else {
    point = prosemirrorTransform.joinPoint(state.doc, sel.from, -1);
    if (point == null) return false;
  }

  if (dispatch) {
    var tr = state.tr.join(point);
    if (nodeSel) tr.setSelection(prosemirrorState.NodeSelection.create(tr.doc, point - state.doc.resolve(point).nodeBefore.nodeSize));
    dispatch(tr.scrollIntoView());
  }

  return true;
};

var joinDown = function joinDown(state, dispatch) {
  var sel = state.selection,
      point;

  if (sel instanceof prosemirrorState.NodeSelection) {
    if (sel.node.isTextblock || !prosemirrorTransform.canJoin(state.doc, sel.to)) return false;
    point = sel.to;
  } else {
    point = prosemirrorTransform.joinPoint(state.doc, sel.to, 1);
    if (point == null) return false;
  }

  if (dispatch) dispatch(state.tr.join(point).scrollIntoView());
  return true;
};

var lift = function lift(state, dispatch) {
  var _state$selection3 = state.selection,
      $from = _state$selection3.$from,
      $to = _state$selection3.$to;
  var range = $from.blockRange($to),
      target = range && prosemirrorTransform.liftTarget(range);
  if (target == null) return false;
  if (dispatch) dispatch(state.tr.lift(range, target).scrollIntoView());
  return true;
};

var newlineInCode = function newlineInCode(state, dispatch) {
  var _state$selection4 = state.selection,
      $head = _state$selection4.$head,
      $anchor = _state$selection4.$anchor;
  if (!$head.parent.type.spec.code || !$head.sameParent($anchor)) return false;
  if (dispatch) dispatch(state.tr.insertText("\n").scrollIntoView());
  return true;
};

function defaultBlockAt(match) {
  for (var i = 0; i < match.edgeCount; i++) {
    var _match$edge = match.edge(i),
        type = _match$edge.type;

    if (type.isTextblock && !type.hasRequiredAttrs()) return type;
  }

  return null;
}

var exitCode = function exitCode(state, dispatch) {
  var _state$selection5 = state.selection,
      $head = _state$selection5.$head,
      $anchor = _state$selection5.$anchor;
  if (!$head.parent.type.spec.code || !$head.sameParent($anchor)) return false;
  var above = $head.node(-1),
      after = $head.indexAfter(-1),
      type = defaultBlockAt(above.contentMatchAt(after));
  if (!type || !above.canReplaceWith(after, after, type)) return false;

  if (dispatch) {
    var pos = $head.after(),
        tr = state.tr.replaceWith(pos, pos, type.createAndFill());
    tr.setSelection(prosemirrorState.Selection.near(tr.doc.resolve(pos), 1));
    dispatch(tr.scrollIntoView());
  }

  return true;
};

var createParagraphNear = function createParagraphNear(state, dispatch) {
  var sel = state.selection,
      $from = sel.$from,
      $to = sel.$to;
  if (sel instanceof prosemirrorState.AllSelection || $from.parent.inlineContent || $to.parent.inlineContent) return false;
  var type = defaultBlockAt($to.parent.contentMatchAt($to.indexAfter()));
  if (!type || !type.isTextblock) return false;

  if (dispatch) {
    var side = (!$from.parentOffset && $to.index() < $to.parent.childCount ? $from : $to).pos;
    var tr = state.tr.insert(side, type.createAndFill());
    tr.setSelection(prosemirrorState.TextSelection.create(tr.doc, side + 1));
    dispatch(tr.scrollIntoView());
  }

  return true;
};

var liftEmptyBlock = function liftEmptyBlock(state, dispatch) {
  var $cursor = state.selection.$cursor;
  if (!$cursor || $cursor.parent.content.size) return false;

  if ($cursor.depth > 1 && $cursor.after() != $cursor.end(-1)) {
    var before = $cursor.before();

    if (prosemirrorTransform.canSplit(state.doc, before)) {
      if (dispatch) dispatch(state.tr.split(before).scrollIntoView());
      return true;
    }
  }

  var range = $cursor.blockRange(),
      target = range && prosemirrorTransform.liftTarget(range);
  if (target == null) return false;
  if (dispatch) dispatch(state.tr.lift(range, target).scrollIntoView());
  return true;
};

var splitBlock = function splitBlock(state, dispatch) {
  var _state$selection6 = state.selection,
      $from = _state$selection6.$from,
      $to = _state$selection6.$to;

  if (state.selection instanceof prosemirrorState.NodeSelection && state.selection.node.isBlock) {
    if (!$from.parentOffset || !prosemirrorTransform.canSplit(state.doc, $from.pos)) return false;
    if (dispatch) dispatch(state.tr.split($from.pos).scrollIntoView());
    return true;
  }

  if (!$from.parent.isBlock) return false;

  if (dispatch) {
    var atEnd = $to.parentOffset == $to.parent.content.size;
    var tr = state.tr;
    if (state.selection instanceof prosemirrorState.TextSelection || state.selection instanceof prosemirrorState.AllSelection) tr.deleteSelection();
    var deflt = $from.depth == 0 ? null : defaultBlockAt($from.node(-1).contentMatchAt($from.indexAfter(-1)));
    var types = atEnd && deflt ? [{
      type: deflt
    }] : undefined;
    var can = prosemirrorTransform.canSplit(tr.doc, tr.mapping.map($from.pos), 1, types);

    if (!types && !can && prosemirrorTransform.canSplit(tr.doc, tr.mapping.map($from.pos), 1, deflt ? [{
      type: deflt
    }] : undefined)) {
      if (deflt) types = [{
        type: deflt
      }];
      can = true;
    }

    if (can) {
      tr.split(tr.mapping.map($from.pos), 1, types);

      if (!atEnd && !$from.parentOffset && $from.parent.type != deflt) {
        var first = tr.mapping.map($from.before()),
            $first = tr.doc.resolve(first);
        if (deflt && $from.node(-1).canReplaceWith($first.index(), $first.index() + 1, deflt)) tr.setNodeMarkup(tr.mapping.map($from.before()), deflt);
      }
    }

    dispatch(tr.scrollIntoView());
  }

  return true;
};

var splitBlockKeepMarks = function splitBlockKeepMarks(state, dispatch) {
  return splitBlock(state, dispatch && function (tr) {
    var marks = state.storedMarks || state.selection.$to.parentOffset && state.selection.$from.marks();
    if (marks) tr.ensureMarks(marks);
    dispatch(tr);
  });
};

var selectParentNode = function selectParentNode(state, dispatch) {
  var _state$selection7 = state.selection,
      $from = _state$selection7.$from,
      to = _state$selection7.to,
      pos;
  var same = $from.sharedDepth(to);
  if (same == 0) return false;
  pos = $from.before(same);
  if (dispatch) dispatch(state.tr.setSelection(prosemirrorState.NodeSelection.create(state.doc, pos)));
  return true;
};

var selectAll = function selectAll(state, dispatch) {
  if (dispatch) dispatch(state.tr.setSelection(new prosemirrorState.AllSelection(state.doc)));
  return true;
};

function joinMaybeClear(state, $pos, dispatch) {
  var before = $pos.nodeBefore,
      after = $pos.nodeAfter,
      index = $pos.index();
  if (!before || !after || !before.type.compatibleContent(after.type)) return false;

  if (!before.content.size && $pos.parent.canReplace(index - 1, index)) {
    if (dispatch) dispatch(state.tr["delete"]($pos.pos - before.nodeSize, $pos.pos).scrollIntoView());
    return true;
  }

  if (!$pos.parent.canReplace(index, index + 1) || !(after.isTextblock || prosemirrorTransform.canJoin(state.doc, $pos.pos))) return false;
  if (dispatch) dispatch(state.tr.clearIncompatible($pos.pos, before.type, before.contentMatchAt(before.childCount)).join($pos.pos).scrollIntoView());
  return true;
}

function deleteBarrier(state, $cut, dispatch) {
  var before = $cut.nodeBefore,
      after = $cut.nodeAfter,
      conn,
      match;
  if (before.type.spec.isolating || after.type.spec.isolating) return false;
  if (joinMaybeClear(state, $cut, dispatch)) return true;
  var canDelAfter = $cut.parent.canReplace($cut.index(), $cut.index() + 1);

  if (canDelAfter && (conn = (match = before.contentMatchAt(before.childCount)).findWrapping(after.type)) && match.matchType(conn[0] || after.type).validEnd) {
    if (dispatch) {
      var end = $cut.pos + after.nodeSize,
          wrap = prosemirrorModel.Fragment.empty;

      for (var i = conn.length - 1; i >= 0; i--) {
        wrap = prosemirrorModel.Fragment.from(conn[i].create(null, wrap));
      }

      wrap = prosemirrorModel.Fragment.from(before.copy(wrap));
      var tr = state.tr.step(new prosemirrorTransform.ReplaceAroundStep($cut.pos - 1, end, $cut.pos, end, new prosemirrorModel.Slice(wrap, 1, 0), conn.length, true));
      var joinAt = end + 2 * conn.length;
      if (prosemirrorTransform.canJoin(tr.doc, joinAt)) tr.join(joinAt);
      dispatch(tr.scrollIntoView());
    }

    return true;
  }

  var selAfter = prosemirrorState.Selection.findFrom($cut, 1);
  var range = selAfter && selAfter.$from.blockRange(selAfter.$to),
      target = range && prosemirrorTransform.liftTarget(range);

  if (target != null && target >= $cut.depth) {
    if (dispatch) dispatch(state.tr.lift(range, target).scrollIntoView());
    return true;
  }

  if (canDelAfter && textblockAt(after, "start", true) && textblockAt(before, "end")) {
    var at = before,
        _wrap = [];

    for (;;) {
      _wrap.push(at);

      if (at.isTextblock) break;
      at = at.lastChild;
    }

    var afterText = after,
        afterDepth = 1;

    for (; !afterText.isTextblock; afterText = afterText.firstChild) {
      afterDepth++;
    }

    if (at.canReplace(at.childCount, at.childCount, afterText.content)) {
      if (dispatch) {
        var _end = prosemirrorModel.Fragment.empty;

        for (var _i = _wrap.length - 1; _i >= 0; _i--) {
          _end = prosemirrorModel.Fragment.from(_wrap[_i].copy(_end));
        }

        var _tr = state.tr.step(new prosemirrorTransform.ReplaceAroundStep($cut.pos - _wrap.length, $cut.pos + after.nodeSize, $cut.pos + afterDepth, $cut.pos + after.nodeSize - afterDepth, new prosemirrorModel.Slice(_end, _wrap.length, 0), 0, true));

        dispatch(_tr.scrollIntoView());
      }

      return true;
    }
  }

  return false;
}

function selectTextblockSide(side) {
  return function (state, dispatch) {
    var sel = state.selection,
        $pos = side < 0 ? sel.$from : sel.$to;
    var depth = $pos.depth;

    while ($pos.node(depth).isInline) {
      if (!depth) return false;
      depth--;
    }

    if (!$pos.node(depth).isTextblock) return false;
    if (dispatch) dispatch(state.tr.setSelection(prosemirrorState.TextSelection.create(state.doc, side < 0 ? $pos.start(depth) : $pos.end(depth))));
    return true;
  };
}

var selectTextblockStart = selectTextblockSide(-1);
var selectTextblockEnd = selectTextblockSide(1);

function wrapIn(nodeType) {
  var attrs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  return function (state, dispatch) {
    var _state$selection8 = state.selection,
        $from = _state$selection8.$from,
        $to = _state$selection8.$to;
    var range = $from.blockRange($to),
        wrapping = range && prosemirrorTransform.findWrapping(range, nodeType, attrs);
    if (!wrapping) return false;
    if (dispatch) dispatch(state.tr.wrap(range, wrapping).scrollIntoView());
    return true;
  };
}

function setBlockType(nodeType) {
  var attrs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  return function (state, dispatch) {
    var _state$selection9 = state.selection,
        from = _state$selection9.from,
        to = _state$selection9.to;
    var applicable = false;
    state.doc.nodesBetween(from, to, function (node, pos) {
      if (applicable) return false;
      if (!node.isTextblock || node.hasMarkup(nodeType, attrs)) return;

      if (node.type == nodeType) {
        applicable = true;
      } else {
        var $pos = state.doc.resolve(pos),
            index = $pos.index();
        applicable = $pos.parent.canReplaceWith(index, index + 1, nodeType);
      }
    });
    if (!applicable) return false;
    if (dispatch) dispatch(state.tr.setBlockType(from, to, nodeType, attrs).scrollIntoView());
    return true;
  };
}

function markApplies(doc, ranges, type) {
  var _loop = function _loop(i) {
    var _ranges$i = ranges[i],
        $from = _ranges$i.$from,
        $to = _ranges$i.$to;
    var can = $from.depth == 0 ? doc.type.allowsMarkType(type) : false;
    doc.nodesBetween($from.pos, $to.pos, function (node) {
      if (can) return false;
      can = node.inlineContent && node.type.allowsMarkType(type);
    });
    if (can) return {
      v: true
    };
  };

  for (var i = 0; i < ranges.length; i++) {
    var _ret = _loop(i);

    if (_typeof(_ret) === "object") return _ret.v;
  }

  return false;
}

function toggleMark(markType) {
  var attrs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  return function (state, dispatch) {
    var _state$selection10 = state.selection,
        empty = _state$selection10.empty,
        $cursor = _state$selection10.$cursor,
        ranges = _state$selection10.ranges;
    if (empty && !$cursor || !markApplies(state.doc, ranges, markType)) return false;

    if (dispatch) {
      if ($cursor) {
        if (markType.isInSet(state.storedMarks || $cursor.marks())) dispatch(state.tr.removeStoredMark(markType));else dispatch(state.tr.addStoredMark(markType.create(attrs)));
      } else {
        var has = false,
            tr = state.tr;

        for (var i = 0; !has && i < ranges.length; i++) {
          var _ranges$i2 = ranges[i],
              $from = _ranges$i2.$from,
              $to = _ranges$i2.$to;
          has = state.doc.rangeHasMark($from.pos, $to.pos, markType);
        }

        for (var _i2 = 0; _i2 < ranges.length; _i2++) {
          var _ranges$_i = ranges[_i2],
              _$from = _ranges$_i.$from,
              _$to = _ranges$_i.$to;

          if (has) {
            tr.removeMark(_$from.pos, _$to.pos, markType);
          } else {
            var from = _$from.pos,
                to = _$to.pos,
                start = _$from.nodeAfter,
                end = _$to.nodeBefore;
            var spaceStart = start && start.isText ? /^\s*/.exec(start.text)[0].length : 0;
            var spaceEnd = end && end.isText ? /\s*$/.exec(end.text)[0].length : 0;

            if (from + spaceStart < to) {
              from += spaceStart;
              to -= spaceEnd;
            }

            tr.addMark(from, to, markType.create(attrs));
          }
        }

        dispatch(tr.scrollIntoView());
      }
    }

    return true;
  };
}

function wrapDispatchForJoin(dispatch, isJoinable) {
  return function (tr) {
    if (!tr.isGeneric) return dispatch(tr);
    var ranges = [];

    for (var i = 0; i < tr.mapping.maps.length; i++) {
      var map = tr.mapping.maps[i];

      for (var j = 0; j < ranges.length; j++) {
        ranges[j] = map.map(ranges[j]);
      }

      map.forEach(function (_s, _e, from, to) {
        return ranges.push(from, to);
      });
    }

    var joinable = [];

    for (var _i3 = 0; _i3 < ranges.length; _i3 += 2) {
      var from = ranges[_i3],
          to = ranges[_i3 + 1];
      var $from = tr.doc.resolve(from),
          depth = $from.sharedDepth(to),
          parent = $from.node(depth);

      for (var index = $from.indexAfter(depth), pos = $from.after(depth + 1); pos <= to; ++index) {
        var after = parent.maybeChild(index);
        if (!after) break;

        if (index && joinable.indexOf(pos) == -1) {
          var before = parent.child(index - 1);
          if (before.type == after.type && isJoinable(before, after)) joinable.push(pos);
        }

        pos += after.nodeSize;
      }
    }

    joinable.sort(function (a, b) {
      return a - b;
    });

    for (var _i4 = joinable.length - 1; _i4 >= 0; _i4--) {
      if (prosemirrorTransform.canJoin(tr.doc, joinable[_i4])) tr.join(joinable[_i4]);
    }

    dispatch(tr);
  };
}

function autoJoin(command, isJoinable) {
  var canJoin = Array.isArray(isJoinable) ? function (node) {
    return isJoinable.indexOf(node.type.name) > -1;
  } : isJoinable;
  return function (state, dispatch, view) {
    return command(state, dispatch && wrapDispatchForJoin(dispatch, canJoin), view);
  };
}

function chainCommands() {
  for (var _len = arguments.length, commands = new Array(_len), _key = 0; _key < _len; _key++) {
    commands[_key] = arguments[_key];
  }

  return function (state, dispatch, view) {
    for (var i = 0; i < commands.length; i++) {
      if (commands[i](state, dispatch, view)) return true;
    }

    return false;
  };
}

var backspace = chainCommands(deleteSelection, joinBackward, selectNodeBackward);
var del = chainCommands(deleteSelection, joinForward, selectNodeForward);
var pcBaseKeymap = {
  "Enter": chainCommands(newlineInCode, createParagraphNear, liftEmptyBlock, splitBlock),
  "Mod-Enter": exitCode,
  "Backspace": backspace,
  "Mod-Backspace": backspace,
  "Shift-Backspace": backspace,
  "Delete": del,
  "Mod-Delete": del,
  "Mod-a": selectAll
};
var macBaseKeymap = {
  "Ctrl-h": pcBaseKeymap["Backspace"],
  "Alt-Backspace": pcBaseKeymap["Mod-Backspace"],
  "Ctrl-d": pcBaseKeymap["Delete"],
  "Ctrl-Alt-Backspace": pcBaseKeymap["Mod-Delete"],
  "Alt-Delete": pcBaseKeymap["Mod-Delete"],
  "Alt-d": pcBaseKeymap["Mod-Delete"],
  "Ctrl-a": selectTextblockStart,
  "Ctrl-e": selectTextblockEnd
};

for (var key in pcBaseKeymap) {
  macBaseKeymap[key] = pcBaseKeymap[key];
}

var mac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : typeof os != "undefined" && os.platform ? os.platform() == "darwin" : false;
var baseKeymap = mac ? macBaseKeymap : pcBaseKeymap;
exports.autoJoin = autoJoin;
exports.baseKeymap = baseKeymap;
exports.chainCommands = chainCommands;
exports.createParagraphNear = createParagraphNear;
exports.deleteSelection = deleteSelection;
exports.exitCode = exitCode;
exports.joinBackward = joinBackward;
exports.joinDown = joinDown;
exports.joinForward = joinForward;
exports.joinUp = joinUp;
exports.lift = lift;
exports.liftEmptyBlock = liftEmptyBlock;
exports.macBaseKeymap = macBaseKeymap;
exports.newlineInCode = newlineInCode;
exports.pcBaseKeymap = pcBaseKeymap;
exports.selectAll = selectAll;
exports.selectNodeBackward = selectNodeBackward;
exports.selectNodeForward = selectNodeForward;
exports.selectParentNode = selectParentNode;
exports.selectTextblockEnd = selectTextblockEnd;
exports.selectTextblockStart = selectTextblockStart;
exports.setBlockType = setBlockType;
exports.splitBlock = splitBlock;
exports.splitBlockKeepMarks = splitBlockKeepMarks;
exports.toggleMark = toggleMark;
exports.wrapIn = wrapIn;

},{"prosemirror-model":12,"prosemirror-state":15,"prosemirror-transform":16}],5:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

Object.defineProperty(exports, '__esModule', {
  value: true
});

var prosemirrorState = require('prosemirror-state');

var prosemirrorTransform = require('prosemirror-transform');

function dropCursor() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return new prosemirrorState.Plugin({
    view: function view(editorView) {
      return new DropCursorView(editorView, options);
    }
  });
}

var DropCursorView = function () {
  function DropCursorView(editorView, options) {
    var _this = this;

    _classCallCheck(this, DropCursorView);

    this.editorView = editorView;
    this.cursorPos = null;
    this.element = null;
    this.timeout = -1;
    this.width = options.width || 1;
    this.color = options.color || "black";
    this["class"] = options["class"];
    this.handlers = ["dragover", "dragend", "drop", "dragleave"].map(function (name) {
      var handler = function handler(e) {
        _this[name](e);
      };

      editorView.dom.addEventListener(name, handler);
      return {
        name: name,
        handler: handler
      };
    });
  }

  _createClass(DropCursorView, [{
    key: "destroy",
    value: function destroy() {
      var _this2 = this;

      this.handlers.forEach(function (_ref) {
        var name = _ref.name,
            handler = _ref.handler;
        return _this2.editorView.dom.removeEventListener(name, handler);
      });
    }
  }, {
    key: "update",
    value: function update(editorView, prevState) {
      if (this.cursorPos != null && prevState.doc != editorView.state.doc) {
        if (this.cursorPos > editorView.state.doc.content.size) this.setCursor(null);else this.updateOverlay();
      }
    }
  }, {
    key: "setCursor",
    value: function setCursor(pos) {
      if (pos == this.cursorPos) return;
      this.cursorPos = pos;

      if (pos == null) {
        this.element.parentNode.removeChild(this.element);
        this.element = null;
      } else {
        this.updateOverlay();
      }
    }
  }, {
    key: "updateOverlay",
    value: function updateOverlay() {
      var $pos = this.editorView.state.doc.resolve(this.cursorPos),
          rect;

      if (!$pos.parent.inlineContent) {
        var before = $pos.nodeBefore,
            after = $pos.nodeAfter;

        if (before || after) {
          var nodeRect = this.editorView.nodeDOM(this.cursorPos - (before ? before.nodeSize : 0)).getBoundingClientRect();
          var top = before ? nodeRect.bottom : nodeRect.top;
          if (before && after) top = (top + this.editorView.nodeDOM(this.cursorPos).getBoundingClientRect().top) / 2;
          rect = {
            left: nodeRect.left,
            right: nodeRect.right,
            top: top - this.width / 2,
            bottom: top + this.width / 2
          };
        }
      }

      if (!rect) {
        var coords = this.editorView.coordsAtPos(this.cursorPos);
        rect = {
          left: coords.left - this.width / 2,
          right: coords.left + this.width / 2,
          top: coords.top,
          bottom: coords.bottom
        };
      }

      var parent = this.editorView.dom.offsetParent;

      if (!this.element) {
        this.element = parent.appendChild(document.createElement("div"));
        if (this["class"]) this.element.className = this["class"];
        this.element.style.cssText = "position: absolute; z-index: 50; pointer-events: none; background-color: " + this.color;
      }

      var parentLeft, parentTop;

      if (!parent || parent == document.body && getComputedStyle(parent).position == "static") {
        parentLeft = -pageXOffset;
        parentTop = -pageYOffset;
      } else {
        var _rect = parent.getBoundingClientRect();

        parentLeft = _rect.left - parent.scrollLeft;
        parentTop = _rect.top - parent.scrollTop;
      }

      this.element.style.left = rect.left - parentLeft + "px";
      this.element.style.top = rect.top - parentTop + "px";
      this.element.style.width = rect.right - rect.left + "px";
      this.element.style.height = rect.bottom - rect.top + "px";
    }
  }, {
    key: "scheduleRemoval",
    value: function scheduleRemoval(timeout) {
      var _this3 = this;

      clearTimeout(this.timeout);
      this.timeout = setTimeout(function () {
        return _this3.setCursor(null);
      }, timeout);
    }
  }, {
    key: "dragover",
    value: function dragover(event) {
      if (!this.editorView.editable) return;
      var pos = this.editorView.posAtCoords({
        left: event.clientX,
        top: event.clientY
      });
      var node = pos && pos.inside >= 0 && this.editorView.state.doc.nodeAt(pos.inside);
      var disableDropCursor = node && node.type.spec.disableDropCursor;
      var disabled = typeof disableDropCursor == "function" ? disableDropCursor(this.editorView, pos, event) : disableDropCursor;

      if (pos && !disabled) {
        var target = pos.pos;

        if (this.editorView.dragging && this.editorView.dragging.slice) {
          target = prosemirrorTransform.dropPoint(this.editorView.state.doc, target, this.editorView.dragging.slice);
          if (target == null) return this.setCursor(null);
        }

        this.setCursor(target);
        this.scheduleRemoval(5000);
      }
    }
  }, {
    key: "dragend",
    value: function dragend() {
      this.scheduleRemoval(20);
    }
  }, {
    key: "drop",
    value: function drop() {
      this.scheduleRemoval(20);
    }
  }, {
    key: "dragleave",
    value: function dragleave(event) {
      if (event.target == this.editorView.dom || !this.editorView.dom.contains(event.relatedTarget)) this.setCursor(null);
    }
  }]);

  return DropCursorView;
}();

exports.dropCursor = dropCursor;

},{"prosemirror-state":15,"prosemirror-transform":16}],6:[function(require,module,exports){
'use strict';

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

Object.defineProperty(exports, '__esModule', {
  value: true
});

var prosemirrorKeymap = require('prosemirror-keymap');

var prosemirrorHistory = require('prosemirror-history');

var prosemirrorCommands = require('prosemirror-commands');

var prosemirrorState = require('prosemirror-state');

var prosemirrorDropcursor = require('prosemirror-dropcursor');

var prosemirrorGapcursor = require('prosemirror-gapcursor');

var prosemirrorMenu = require('prosemirror-menu');

var prosemirrorSchemaList = require('prosemirror-schema-list');

var prosemirrorInputrules = require('prosemirror-inputrules');

var prefix = "ProseMirror-prompt";

function openPrompt(options) {
  var wrapper = document.body.appendChild(document.createElement("div"));
  wrapper.className = prefix;

  var mouseOutside = function mouseOutside(e) {
    if (!wrapper.contains(e.target)) close();
  };

  setTimeout(function () {
    return window.addEventListener("mousedown", mouseOutside);
  }, 50);

  var close = function close() {
    window.removeEventListener("mousedown", mouseOutside);
    if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
  };

  var domFields = [];

  for (var name in options.fields) {
    domFields.push(options.fields[name].render());
  }

  var submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = prefix + "-submit";
  submitButton.textContent = "OK";
  var cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = prefix + "-cancel";
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", close);
  var form = wrapper.appendChild(document.createElement("form"));
  if (options.title) form.appendChild(document.createElement("h5")).textContent = options.title;
  domFields.forEach(function (field) {
    form.appendChild(document.createElement("div")).appendChild(field);
  });
  var buttons = form.appendChild(document.createElement("div"));
  buttons.className = prefix + "-buttons";
  buttons.appendChild(submitButton);
  buttons.appendChild(document.createTextNode(" "));
  buttons.appendChild(cancelButton);
  var box = wrapper.getBoundingClientRect();
  wrapper.style.top = (window.innerHeight - box.height) / 2 + "px";
  wrapper.style.left = (window.innerWidth - box.width) / 2 + "px";

  var submit = function submit() {
    var params = getValues(options.fields, domFields);

    if (params) {
      close();
      options.callback(params);
    }
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    submit();
  });
  form.addEventListener("keydown", function (e) {
    if (e.keyCode == 27) {
      e.preventDefault();
      close();
    } else if (e.keyCode == 13 && !(e.ctrlKey || e.metaKey || e.shiftKey)) {
      e.preventDefault();
      submit();
    } else if (e.keyCode == 9) {
      window.setTimeout(function () {
        if (!wrapper.contains(document.activeElement)) close();
      }, 500);
    }
  });
  var input = form.elements[0];
  if (input) input.focus();
}

function getValues(fields, domFields) {
  var result = Object.create(null),
      i = 0;

  for (var name in fields) {
    var field = fields[name],
        dom = domFields[i++];
    var value = field.read(dom),
        bad = field.validate(value);

    if (bad) {
      reportInvalid(dom, bad);
      return null;
    }

    result[name] = field.clean(value);
  }

  return result;
}

function reportInvalid(dom, message) {
  var parent = dom.parentNode;
  var msg = parent.appendChild(document.createElement("div"));
  msg.style.left = dom.offsetLeft + dom.offsetWidth + 2 + "px";
  msg.style.top = dom.offsetTop - 5 + "px";
  msg.className = "ProseMirror-invalid";
  msg.textContent = message;
  setTimeout(function () {
    return parent.removeChild(msg);
  }, 1500);
}

var Field = function () {
  function Field(options) {
    _classCallCheck(this, Field);

    this.options = options;
  }

  _createClass(Field, [{
    key: "read",
    value: function read(dom) {
      return dom.value;
    }
  }, {
    key: "validateType",
    value: function validateType(value) {
      return null;
    }
  }, {
    key: "validate",
    value: function validate(value) {
      if (!value && this.options.required) return "Required field";
      return this.validateType(value) || (this.options.validate ? this.options.validate(value) : null);
    }
  }, {
    key: "clean",
    value: function clean(value) {
      return this.options.clean ? this.options.clean(value) : value;
    }
  }]);

  return Field;
}();

var TextField = function (_Field) {
  _inherits(TextField, _Field);

  var _super = _createSuper(TextField);

  function TextField() {
    _classCallCheck(this, TextField);

    return _super.apply(this, arguments);
  }

  _createClass(TextField, [{
    key: "render",
    value: function render() {
      var input = document.createElement("input");
      input.type = "text";
      input.placeholder = this.options.label;
      input.value = this.options.value || "";
      input.autocomplete = "off";
      return input;
    }
  }]);

  return TextField;
}(Field);

function canInsert(state, nodeType) {
  var $from = state.selection.$from;

  for (var d = $from.depth; d >= 0; d--) {
    var index = $from.index(d);
    if ($from.node(d).canReplaceWith(index, index, nodeType)) return true;
  }

  return false;
}

function insertImageItem(nodeType) {
  return new prosemirrorMenu.MenuItem({
    title: "Insert image",
    label: "Image",
    enable: function enable(state) {
      return canInsert(state, nodeType);
    },
    run: function run(state, _, view) {
      var _state$selection = state.selection,
          from = _state$selection.from,
          to = _state$selection.to,
          attrs = null;
      if (state.selection instanceof prosemirrorState.NodeSelection && state.selection.node.type == nodeType) attrs = state.selection.node.attrs;
      openPrompt({
        title: "Insert image",
        fields: {
          src: new TextField({
            label: "Location",
            required: true,
            value: attrs && attrs.src
          }),
          title: new TextField({
            label: "Title",
            value: attrs && attrs.title
          }),
          alt: new TextField({
            label: "Description",
            value: attrs ? attrs.alt : state.doc.textBetween(from, to, " ")
          })
        },
        callback: function callback(attrs) {
          view.dispatch(view.state.tr.replaceSelectionWith(nodeType.createAndFill(attrs)));
          view.focus();
        }
      });
    }
  });
}

function cmdItem(cmd, options) {
  var passedOptions = {
    label: options.title,
    run: cmd
  };

  for (var prop in options) {
    passedOptions[prop] = options[prop];
  }

  if (!options.enable && !options.select) passedOptions[options.enable ? "enable" : "select"] = function (state) {
    return cmd(state);
  };
  return new prosemirrorMenu.MenuItem(passedOptions);
}

function markActive(state, type) {
  var _state$selection2 = state.selection,
      from = _state$selection2.from,
      $from = _state$selection2.$from,
      to = _state$selection2.to,
      empty = _state$selection2.empty;
  if (empty) return !!type.isInSet(state.storedMarks || $from.marks());else return state.doc.rangeHasMark(from, to, type);
}

function markItem(markType, options) {
  var passedOptions = {
    active: function active(state) {
      return markActive(state, markType);
    }
  };

  for (var prop in options) {
    passedOptions[prop] = options[prop];
  }

  return cmdItem(prosemirrorCommands.toggleMark(markType), passedOptions);
}

function linkItem(markType) {
  return new prosemirrorMenu.MenuItem({
    title: "Add or remove link",
    icon: prosemirrorMenu.icons.link,
    active: function active(state) {
      return markActive(state, markType);
    },
    enable: function enable(state) {
      return !state.selection.empty;
    },
    run: function run(state, dispatch, view) {
      if (markActive(state, markType)) {
        prosemirrorCommands.toggleMark(markType)(state, dispatch);
        return true;
      }

      openPrompt({
        title: "Create a link",
        fields: {
          href: new TextField({
            label: "Link target",
            required: true
          }),
          title: new TextField({
            label: "Title"
          })
        },
        callback: function callback(attrs) {
          prosemirrorCommands.toggleMark(markType, attrs)(view.state, view.dispatch);
          view.focus();
        }
      });
    }
  });
}

function wrapListItem(nodeType, options) {
  return cmdItem(prosemirrorSchemaList.wrapInList(nodeType, options.attrs), options);
}

function buildMenuItems(schema) {
  var r = {};
  var mark;
  if (mark = schema.marks.strong) r.toggleStrong = markItem(mark, {
    title: "Toggle strong style",
    icon: prosemirrorMenu.icons.strong
  });
  if (mark = schema.marks.em) r.toggleEm = markItem(mark, {
    title: "Toggle emphasis",
    icon: prosemirrorMenu.icons.em
  });
  if (mark = schema.marks.code) r.toggleCode = markItem(mark, {
    title: "Toggle code font",
    icon: prosemirrorMenu.icons.code
  });
  if (mark = schema.marks.link) r.toggleLink = linkItem(mark);
  var node;
  if (node = schema.nodes.image) r.insertImage = insertImageItem(node);
  if (node = schema.nodes.bullet_list) r.wrapBulletList = wrapListItem(node, {
    title: "Wrap in bullet list",
    icon: prosemirrorMenu.icons.bulletList
  });
  if (node = schema.nodes.ordered_list) r.wrapOrderedList = wrapListItem(node, {
    title: "Wrap in ordered list",
    icon: prosemirrorMenu.icons.orderedList
  });
  if (node = schema.nodes.blockquote) r.wrapBlockQuote = prosemirrorMenu.wrapItem(node, {
    title: "Wrap in block quote",
    icon: prosemirrorMenu.icons.blockquote
  });
  if (node = schema.nodes.paragraph) r.makeParagraph = prosemirrorMenu.blockTypeItem(node, {
    title: "Change to paragraph",
    label: "Plain"
  });
  if (node = schema.nodes.code_block) r.makeCodeBlock = prosemirrorMenu.blockTypeItem(node, {
    title: "Change to code block",
    label: "Code"
  });
  if (node = schema.nodes.heading) for (var i = 1; i <= 10; i++) {
    r["makeHead" + i] = prosemirrorMenu.blockTypeItem(node, {
      title: "Change to heading " + i,
      label: "Level " + i,
      attrs: {
        level: i
      }
    });
  }

  if (node = schema.nodes.horizontal_rule) {
    var hr = node;
    r.insertHorizontalRule = new prosemirrorMenu.MenuItem({
      title: "Insert horizontal rule",
      label: "Horizontal rule",
      enable: function enable(state) {
        return canInsert(state, hr);
      },
      run: function run(state, dispatch) {
        dispatch(state.tr.replaceSelectionWith(hr.create()));
      }
    });
  }

  var cut = function cut(arr) {
    return arr.filter(function (x) {
      return x;
    });
  };

  r.insertMenu = new prosemirrorMenu.Dropdown(cut([r.insertImage, r.insertHorizontalRule]), {
    label: "Insert"
  });
  r.typeMenu = new prosemirrorMenu.Dropdown(cut([r.makeParagraph, r.makeCodeBlock, r.makeHead1 && new prosemirrorMenu.DropdownSubmenu(cut([r.makeHead1, r.makeHead2, r.makeHead3, r.makeHead4, r.makeHead5, r.makeHead6]), {
    label: "Heading"
  })]), {
    label: "Type..."
  });
  r.inlineMenu = [cut([r.toggleStrong, r.toggleEm, r.toggleCode, r.toggleLink])];
  r.blockMenu = [cut([r.wrapBulletList, r.wrapOrderedList, r.wrapBlockQuote, prosemirrorMenu.joinUpItem, prosemirrorMenu.liftItem, prosemirrorMenu.selectParentNodeItem])];
  r.fullMenu = r.inlineMenu.concat([[r.insertMenu, r.typeMenu]], [[prosemirrorMenu.undoItem, prosemirrorMenu.redoItem]], r.blockMenu);
  return r;
}

var mac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false;

function buildKeymap(schema, mapKeys) {
  var keys = {},
      type;

  function bind(key, cmd) {
    if (mapKeys) {
      var mapped = mapKeys[key];
      if (mapped === false) return;
      if (mapped) key = mapped;
    }

    keys[key] = cmd;
  }

  bind("Mod-z", prosemirrorHistory.undo);
  bind("Shift-Mod-z", prosemirrorHistory.redo);
  bind("Backspace", prosemirrorInputrules.undoInputRule);
  if (!mac) bind("Mod-y", prosemirrorHistory.redo);
  bind("Alt-ArrowUp", prosemirrorCommands.joinUp);
  bind("Alt-ArrowDown", prosemirrorCommands.joinDown);
  bind("Mod-BracketLeft", prosemirrorCommands.lift);
  bind("Escape", prosemirrorCommands.selectParentNode);

  if (type = schema.marks.strong) {
    bind("Mod-b", prosemirrorCommands.toggleMark(type));
    bind("Mod-B", prosemirrorCommands.toggleMark(type));
  }

  if (type = schema.marks.em) {
    bind("Mod-i", prosemirrorCommands.toggleMark(type));
    bind("Mod-I", prosemirrorCommands.toggleMark(type));
  }

  if (type = schema.marks.code) bind("Mod-`", prosemirrorCommands.toggleMark(type));
  if (type = schema.nodes.bullet_list) bind("Shift-Ctrl-8", prosemirrorSchemaList.wrapInList(type));
  if (type = schema.nodes.ordered_list) bind("Shift-Ctrl-9", prosemirrorSchemaList.wrapInList(type));
  if (type = schema.nodes.blockquote) bind("Ctrl->", prosemirrorCommands.wrapIn(type));

  if (type = schema.nodes.hard_break) {
    var br = type,
        cmd = prosemirrorCommands.chainCommands(prosemirrorCommands.exitCode, function (state, dispatch) {
      if (dispatch) dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
      return true;
    });
    bind("Mod-Enter", cmd);
    bind("Shift-Enter", cmd);
    if (mac) bind("Ctrl-Enter", cmd);
  }

  if (type = schema.nodes.list_item) {
    bind("Enter", prosemirrorSchemaList.splitListItem(type));
    bind("Mod-[", prosemirrorSchemaList.liftListItem(type));
    bind("Mod-]", prosemirrorSchemaList.sinkListItem(type));
  }

  if (type = schema.nodes.paragraph) bind("Shift-Ctrl-0", prosemirrorCommands.setBlockType(type));
  if (type = schema.nodes.code_block) bind("Shift-Ctrl-\\", prosemirrorCommands.setBlockType(type));
  if (type = schema.nodes.heading) for (var i = 1; i <= 6; i++) {
    bind("Shift-Ctrl-" + i, prosemirrorCommands.setBlockType(type, {
      level: i
    }));
  }

  if (type = schema.nodes.horizontal_rule) {
    var hr = type;
    bind("Mod-_", function (state, dispatch) {
      if (dispatch) dispatch(state.tr.replaceSelectionWith(hr.create()).scrollIntoView());
      return true;
    });
  }

  return keys;
}

function blockQuoteRule(nodeType) {
  return prosemirrorInputrules.wrappingInputRule(/^\s*>\s$/, nodeType);
}

function orderedListRule(nodeType) {
  return prosemirrorInputrules.wrappingInputRule(/^(\d+)\.\s$/, nodeType, function (match) {
    return {
      order: +match[1]
    };
  }, function (match, node) {
    return node.childCount + node.attrs.order == +match[1];
  });
}

function bulletListRule(nodeType) {
  return prosemirrorInputrules.wrappingInputRule(/^\s*([-+*])\s$/, nodeType);
}

function codeBlockRule(nodeType) {
  return prosemirrorInputrules.textblockTypeInputRule(/^```$/, nodeType);
}

function headingRule(nodeType, maxLevel) {
  return prosemirrorInputrules.textblockTypeInputRule(new RegExp("^(#{1," + maxLevel + "})\\s$"), nodeType, function (match) {
    return {
      level: match[1].length
    };
  });
}

function buildInputRules(schema) {
  var rules = prosemirrorInputrules.smartQuotes.concat(prosemirrorInputrules.ellipsis, prosemirrorInputrules.emDash),
      type;
  if (type = schema.nodes.blockquote) rules.push(blockQuoteRule(type));
  if (type = schema.nodes.ordered_list) rules.push(orderedListRule(type));
  if (type = schema.nodes.bullet_list) rules.push(bulletListRule(type));
  if (type = schema.nodes.code_block) rules.push(codeBlockRule(type));
  if (type = schema.nodes.heading) rules.push(headingRule(type, 6));
  return prosemirrorInputrules.inputRules({
    rules: rules
  });
}

function exampleSetup(options) {
  var plugins = [buildInputRules(options.schema), prosemirrorKeymap.keymap(buildKeymap(options.schema, options.mapKeys)), prosemirrorKeymap.keymap(prosemirrorCommands.baseKeymap), prosemirrorDropcursor.dropCursor(), prosemirrorGapcursor.gapCursor()];
  if (options.menuBar !== false) plugins.push(prosemirrorMenu.menuBar({
    floating: options.floatingMenu !== false,
    content: options.menuContent || buildMenuItems(options.schema).fullMenu
  }));
  if (options.history !== false) plugins.push(prosemirrorHistory.history());
  return plugins.concat(new prosemirrorState.Plugin({
    props: {
      attributes: {
        "class": "ProseMirror-example-setup-style"
      }
    }
  }));
}

exports.buildInputRules = buildInputRules;
exports.buildKeymap = buildKeymap;
exports.buildMenuItems = buildMenuItems;
exports.exampleSetup = exampleSetup;

},{"prosemirror-commands":4,"prosemirror-dropcursor":5,"prosemirror-gapcursor":7,"prosemirror-history":8,"prosemirror-inputrules":9,"prosemirror-keymap":10,"prosemirror-menu":11,"prosemirror-schema-list":14,"prosemirror-state":15}],7:[function(require,module,exports){
'use strict';

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

Object.defineProperty(exports, '__esModule', {
  value: true
});

var prosemirrorKeymap = require('prosemirror-keymap');

var prosemirrorState = require('prosemirror-state');

var prosemirrorModel = require('prosemirror-model');

var prosemirrorView = require('prosemirror-view');

var GapCursor = function (_prosemirrorState$Sel) {
  _inherits(GapCursor, _prosemirrorState$Sel);

  var _super = _createSuper(GapCursor);

  function GapCursor($pos) {
    _classCallCheck(this, GapCursor);

    return _super.call(this, $pos, $pos);
  }

  _createClass(GapCursor, [{
    key: "map",
    value: function map(doc, mapping) {
      var $pos = doc.resolve(mapping.map(this.head));
      return GapCursor.valid($pos) ? new GapCursor($pos) : prosemirrorState.Selection.near($pos);
    }
  }, {
    key: "content",
    value: function content() {
      return prosemirrorModel.Slice.empty;
    }
  }, {
    key: "eq",
    value: function eq(other) {
      return other instanceof GapCursor && other.head == this.head;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return {
        type: "gapcursor",
        pos: this.head
      };
    }
  }, {
    key: "getBookmark",
    value: function getBookmark() {
      return new GapBookmark(this.anchor);
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(doc, json) {
      if (typeof json.pos != "number") throw new RangeError("Invalid input for GapCursor.fromJSON");
      return new GapCursor(doc.resolve(json.pos));
    }
  }, {
    key: "valid",
    value: function valid($pos) {
      var parent = $pos.parent;
      if (parent.isTextblock || !closedBefore($pos) || !closedAfter($pos)) return false;
      var override = parent.type.spec.allowGapCursor;
      if (override != null) return override;
      var deflt = parent.contentMatchAt($pos.index()).defaultType;
      return deflt && deflt.isTextblock;
    }
  }, {
    key: "findGapCursorFrom",
    value: function findGapCursorFrom($pos, dir) {
      var mustMove = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      search: for (;;) {
        if (!mustMove && GapCursor.valid($pos)) return $pos;
        var pos = $pos.pos,
            next = null;

        for (var d = $pos.depth;; d--) {
          var parent = $pos.node(d);

          if (dir > 0 ? $pos.indexAfter(d) < parent.childCount : $pos.index(d) > 0) {
            next = parent.child(dir > 0 ? $pos.indexAfter(d) : $pos.index(d) - 1);
            break;
          } else if (d == 0) {
            return null;
          }

          pos += dir;
          var $cur = $pos.doc.resolve(pos);
          if (GapCursor.valid($cur)) return $cur;
        }

        for (;;) {
          var inside = dir > 0 ? next.firstChild : next.lastChild;

          if (!inside) {
            if (next.isAtom && !next.isText && !prosemirrorState.NodeSelection.isSelectable(next)) {
              $pos = $pos.doc.resolve(pos + next.nodeSize * dir);
              mustMove = false;
              continue search;
            }

            break;
          }

          next = inside;
          pos += dir;

          var _$cur = $pos.doc.resolve(pos);

          if (GapCursor.valid(_$cur)) return _$cur;
        }

        return null;
      }
    }
  }]);

  return GapCursor;
}(prosemirrorState.Selection);

GapCursor.prototype.visible = false;
GapCursor.findFrom = GapCursor.findGapCursorFrom;
prosemirrorState.Selection.jsonID("gapcursor", GapCursor);

var GapBookmark = function () {
  function GapBookmark(pos) {
    _classCallCheck(this, GapBookmark);

    this.pos = pos;
  }

  _createClass(GapBookmark, [{
    key: "map",
    value: function map(mapping) {
      return new GapBookmark(mapping.map(this.pos));
    }
  }, {
    key: "resolve",
    value: function resolve(doc) {
      var $pos = doc.resolve(this.pos);
      return GapCursor.valid($pos) ? new GapCursor($pos) : prosemirrorState.Selection.near($pos);
    }
  }]);

  return GapBookmark;
}();

function closedBefore($pos) {
  for (var d = $pos.depth; d >= 0; d--) {
    var index = $pos.index(d),
        parent = $pos.node(d);

    if (index == 0) {
      if (parent.type.spec.isolating) return true;
      continue;
    }

    for (var before = parent.child(index - 1);; before = before.lastChild) {
      if (before.childCount == 0 && !before.inlineContent || before.isAtom || before.type.spec.isolating) return true;
      if (before.inlineContent) return false;
    }
  }

  return true;
}

function closedAfter($pos) {
  for (var d = $pos.depth; d >= 0; d--) {
    var index = $pos.indexAfter(d),
        parent = $pos.node(d);

    if (index == parent.childCount) {
      if (parent.type.spec.isolating) return true;
      continue;
    }

    for (var after = parent.child(index);; after = after.firstChild) {
      if (after.childCount == 0 && !after.inlineContent || after.isAtom || after.type.spec.isolating) return true;
      if (after.inlineContent) return false;
    }
  }

  return true;
}

function gapCursor() {
  return new prosemirrorState.Plugin({
    props: {
      decorations: drawGapCursor,
      createSelectionBetween: function createSelectionBetween(_view, $anchor, $head) {
        return $anchor.pos == $head.pos && GapCursor.valid($head) ? new GapCursor($head) : null;
      },
      handleClick: handleClick,
      handleKeyDown: handleKeyDown,
      handleDOMEvents: {
        beforeinput: beforeinput
      }
    }
  });
}

var handleKeyDown = prosemirrorKeymap.keydownHandler({
  "ArrowLeft": arrow("horiz", -1),
  "ArrowRight": arrow("horiz", 1),
  "ArrowUp": arrow("vert", -1),
  "ArrowDown": arrow("vert", 1)
});

function arrow(axis, dir) {
  var dirStr = axis == "vert" ? dir > 0 ? "down" : "up" : dir > 0 ? "right" : "left";
  return function (state, dispatch, view) {
    var sel = state.selection;
    var $start = dir > 0 ? sel.$to : sel.$from,
        mustMove = sel.empty;

    if (sel instanceof prosemirrorState.TextSelection) {
      if (!view.endOfTextblock(dirStr) || $start.depth == 0) return false;
      mustMove = false;
      $start = state.doc.resolve(dir > 0 ? $start.after() : $start.before());
    }

    var $found = GapCursor.findGapCursorFrom($start, dir, mustMove);
    if (!$found) return false;
    if (dispatch) dispatch(state.tr.setSelection(new GapCursor($found)));
    return true;
  };
}

function handleClick(view, pos, event) {
  if (!view || !view.editable) return false;
  var $pos = view.state.doc.resolve(pos);
  if (!GapCursor.valid($pos)) return false;
  var clickPos = view.posAtCoords({
    left: event.clientX,
    top: event.clientY
  });
  if (clickPos && clickPos.inside > -1 && prosemirrorState.NodeSelection.isSelectable(view.state.doc.nodeAt(clickPos.inside))) return false;
  view.dispatch(view.state.tr.setSelection(new GapCursor($pos)));
  return true;
}

function beforeinput(view, event) {
  if (event.inputType != "insertCompositionText" || !(view.state.selection instanceof GapCursor)) return false;
  var $from = view.state.selection.$from;
  var insert = $from.parent.contentMatchAt($from.index()).findWrapping(view.state.schema.nodes.text);
  if (!insert) return false;
  var frag = prosemirrorModel.Fragment.empty;

  for (var i = insert.length - 1; i >= 0; i--) {
    frag = prosemirrorModel.Fragment.from(insert[i].createAndFill(null, frag));
  }

  var tr = view.state.tr.replace($from.pos, $from.pos, new prosemirrorModel.Slice(frag, 0, 0));
  tr.setSelection(prosemirrorState.TextSelection.near(tr.doc.resolve($from.pos + 1)));
  view.dispatch(tr);
  return false;
}

function drawGapCursor(state) {
  if (!(state.selection instanceof GapCursor)) return null;
  var node = document.createElement("div");
  node.className = "ProseMirror-gapcursor";
  return prosemirrorView.DecorationSet.create(state.doc, [prosemirrorView.Decoration.widget(state.selection.head, node, {
    key: "gapcursor"
  })]);
}

exports.GapCursor = GapCursor;
exports.gapCursor = gapCursor;

},{"prosemirror-keymap":10,"prosemirror-model":12,"prosemirror-state":15,"prosemirror-view":17}],8:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, '__esModule', {
  value: true
});

var RopeSequence = require('rope-sequence');

var prosemirrorTransform = require('prosemirror-transform');

var prosemirrorState = require('prosemirror-state');

function _interopDefaultLegacy(e) {
  return e && _typeof(e) === 'object' && 'default' in e ? e : {
    'default': e
  };
}

var RopeSequence__default = _interopDefaultLegacy(RopeSequence);

var max_empty_items = 500;

var Branch = function () {
  function Branch(items, eventCount) {
    _classCallCheck(this, Branch);

    this.items = items;
    this.eventCount = eventCount;
  }

  _createClass(Branch, [{
    key: "popEvent",
    value: function popEvent(state, preserveItems) {
      var _this = this;

      if (this.eventCount == 0) return null;
      var end = this.items.length;

      for (;; end--) {
        var next = this.items.get(end - 1);

        if (next.selection) {
          --end;
          break;
        }
      }

      var remap, mapFrom;

      if (preserveItems) {
        remap = this.remapping(end, this.items.length);
        mapFrom = remap.maps.length;
      }

      var transform = state.tr;
      var selection, remaining;
      var addAfter = [],
          addBefore = [];
      this.items.forEach(function (item, i) {
        if (!item.step) {
          if (!remap) {
            remap = _this.remapping(end, i + 1);
            mapFrom = remap.maps.length;
          }

          mapFrom--;
          addBefore.push(item);
          return;
        }

        if (remap) {
          addBefore.push(new Item(item.map));
          var step = item.step.map(remap.slice(mapFrom)),
              map;

          if (step && transform.maybeStep(step).doc) {
            map = transform.mapping.maps[transform.mapping.maps.length - 1];
            addAfter.push(new Item(map, undefined, undefined, addAfter.length + addBefore.length));
          }

          mapFrom--;
          if (map) remap.appendMap(map, mapFrom);
        } else {
          transform.maybeStep(item.step);
        }

        if (item.selection) {
          selection = remap ? item.selection.map(remap.slice(mapFrom)) : item.selection;
          remaining = new Branch(_this.items.slice(0, end).append(addBefore.reverse().concat(addAfter)), _this.eventCount - 1);
          return false;
        }
      }, this.items.length, 0);
      return {
        remaining: remaining,
        transform: transform,
        selection: selection
      };
    }
  }, {
    key: "addTransform",
    value: function addTransform(transform, selection, histOptions, preserveItems) {
      var newItems = [],
          eventCount = this.eventCount;
      var oldItems = this.items,
          lastItem = !preserveItems && oldItems.length ? oldItems.get(oldItems.length - 1) : null;

      for (var i = 0; i < transform.steps.length; i++) {
        var step = transform.steps[i].invert(transform.docs[i]);
        var item = new Item(transform.mapping.maps[i], step, selection),
            merged = void 0;

        if (merged = lastItem && lastItem.merge(item)) {
          item = merged;
          if (i) newItems.pop();else oldItems = oldItems.slice(0, oldItems.length - 1);
        }

        newItems.push(item);

        if (selection) {
          eventCount++;
          selection = undefined;
        }

        if (!preserveItems) lastItem = item;
      }

      var overflow = eventCount - histOptions.depth;

      if (overflow > DEPTH_OVERFLOW) {
        oldItems = cutOffEvents(oldItems, overflow);
        eventCount -= overflow;
      }

      return new Branch(oldItems.append(newItems), eventCount);
    }
  }, {
    key: "remapping",
    value: function remapping(from, to) {
      var maps = new prosemirrorTransform.Mapping();
      this.items.forEach(function (item, i) {
        var mirrorPos = item.mirrorOffset != null && i - item.mirrorOffset >= from ? maps.maps.length - item.mirrorOffset : undefined;
        maps.appendMap(item.map, mirrorPos);
      }, from, to);
      return maps;
    }
  }, {
    key: "addMaps",
    value: function addMaps(array) {
      if (this.eventCount == 0) return this;
      return new Branch(this.items.append(array.map(function (map) {
        return new Item(map);
      })), this.eventCount);
    }
  }, {
    key: "rebased",
    value: function rebased(rebasedTransform, rebasedCount) {
      if (!this.eventCount) return this;
      var rebasedItems = [],
          start = Math.max(0, this.items.length - rebasedCount);
      var mapping = rebasedTransform.mapping;
      var newUntil = rebasedTransform.steps.length;
      var eventCount = this.eventCount;
      this.items.forEach(function (item) {
        if (item.selection) eventCount--;
      }, start);
      var iRebased = rebasedCount;
      this.items.forEach(function (item) {
        var pos = mapping.getMirror(--iRebased);
        if (pos == null) return;
        newUntil = Math.min(newUntil, pos);
        var map = mapping.maps[pos];

        if (item.step) {
          var step = rebasedTransform.steps[pos].invert(rebasedTransform.docs[pos]);
          var selection = item.selection && item.selection.map(mapping.slice(iRebased + 1, pos));
          if (selection) eventCount++;
          rebasedItems.push(new Item(map, step, selection));
        } else {
          rebasedItems.push(new Item(map));
        }
      }, start);
      var newMaps = [];

      for (var i = rebasedCount; i < newUntil; i++) {
        newMaps.push(new Item(mapping.maps[i]));
      }

      var items = this.items.slice(0, start).append(newMaps).append(rebasedItems);
      var branch = new Branch(items, eventCount);
      if (branch.emptyItemCount() > max_empty_items) branch = branch.compress(this.items.length - rebasedItems.length);
      return branch;
    }
  }, {
    key: "emptyItemCount",
    value: function emptyItemCount() {
      var count = 0;
      this.items.forEach(function (item) {
        if (!item.step) count++;
      });
      return count;
    }
  }, {
    key: "compress",
    value: function compress() {
      var upto = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.items.length;
      var remap = this.remapping(0, upto),
          mapFrom = remap.maps.length;
      var items = [],
          events = 0;
      this.items.forEach(function (item, i) {
        if (i >= upto) {
          items.push(item);
          if (item.selection) events++;
        } else if (item.step) {
          var step = item.step.map(remap.slice(mapFrom)),
              map = step && step.getMap();
          mapFrom--;
          if (map) remap.appendMap(map, mapFrom);

          if (step) {
            var selection = item.selection && item.selection.map(remap.slice(mapFrom));
            if (selection) events++;
            var newItem = new Item(map.invert(), step, selection),
                merged,
                last = items.length - 1;
            if (merged = items.length && items[last].merge(newItem)) items[last] = merged;else items.push(newItem);
          }
        } else if (item.map) {
          mapFrom--;
        }
      }, this.items.length, 0);
      return new Branch(RopeSequence__default["default"].from(items.reverse()), events);
    }
  }]);

  return Branch;
}();

Branch.empty = new Branch(RopeSequence__default["default"].empty, 0);

function cutOffEvents(items, n) {
  var cutPoint;
  items.forEach(function (item, i) {
    if (item.selection && n-- == 0) {
      cutPoint = i;
      return false;
    }
  });
  return items.slice(cutPoint);
}

var Item = function () {
  function Item(map, step, selection, mirrorOffset) {
    _classCallCheck(this, Item);

    this.map = map;
    this.step = step;
    this.selection = selection;
    this.mirrorOffset = mirrorOffset;
  }

  _createClass(Item, [{
    key: "merge",
    value: function merge(other) {
      if (this.step && other.step && !other.selection) {
        var step = other.step.merge(this.step);
        if (step) return new Item(step.getMap().invert(), step, this.selection);
      }
    }
  }]);

  return Item;
}();

var HistoryState = _createClass(function HistoryState(done, undone, prevRanges, prevTime) {
  _classCallCheck(this, HistoryState);

  this.done = done;
  this.undone = undone;
  this.prevRanges = prevRanges;
  this.prevTime = prevTime;
});

var DEPTH_OVERFLOW = 20;

function applyTransaction(history, state, tr, options) {
  var historyTr = tr.getMeta(historyKey),
      rebased;
  if (historyTr) return historyTr.historyState;
  if (tr.getMeta(closeHistoryKey)) history = new HistoryState(history.done, history.undone, null, 0);
  var appended = tr.getMeta("appendedTransaction");

  if (tr.steps.length == 0) {
    return history;
  } else if (appended && appended.getMeta(historyKey)) {
    if (appended.getMeta(historyKey).redo) return new HistoryState(history.done.addTransform(tr, undefined, options, mustPreserveItems(state)), history.undone, rangesFor(tr.mapping.maps[tr.steps.length - 1]), history.prevTime);else return new HistoryState(history.done, history.undone.addTransform(tr, undefined, options, mustPreserveItems(state)), null, history.prevTime);
  } else if (tr.getMeta("addToHistory") !== false && !(appended && appended.getMeta("addToHistory") === false)) {
    var newGroup = history.prevTime == 0 || !appended && (history.prevTime < (tr.time || 0) - options.newGroupDelay || !isAdjacentTo(tr, history.prevRanges));
    var prevRanges = appended ? mapRanges(history.prevRanges, tr.mapping) : rangesFor(tr.mapping.maps[tr.steps.length - 1]);
    return new HistoryState(history.done.addTransform(tr, newGroup ? state.selection.getBookmark() : undefined, options, mustPreserveItems(state)), Branch.empty, prevRanges, tr.time);
  } else if (rebased = tr.getMeta("rebased")) {
    return new HistoryState(history.done.rebased(tr, rebased), history.undone.rebased(tr, rebased), mapRanges(history.prevRanges, tr.mapping), history.prevTime);
  } else {
    return new HistoryState(history.done.addMaps(tr.mapping.maps), history.undone.addMaps(tr.mapping.maps), mapRanges(history.prevRanges, tr.mapping), history.prevTime);
  }
}

function isAdjacentTo(transform, prevRanges) {
  if (!prevRanges) return false;
  if (!transform.docChanged) return true;
  var adjacent = false;
  transform.mapping.maps[0].forEach(function (start, end) {
    for (var i = 0; i < prevRanges.length; i += 2) {
      if (start <= prevRanges[i + 1] && end >= prevRanges[i]) adjacent = true;
    }
  });
  return adjacent;
}

function rangesFor(map) {
  var result = [];
  map.forEach(function (_from, _to, from, to) {
    return result.push(from, to);
  });
  return result;
}

function mapRanges(ranges, mapping) {
  if (!ranges) return null;
  var result = [];

  for (var i = 0; i < ranges.length; i += 2) {
    var from = mapping.map(ranges[i], 1),
        to = mapping.map(ranges[i + 1], -1);
    if (from <= to) result.push(from, to);
  }

  return result;
}

function histTransaction(history, state, dispatch, redo) {
  var preserveItems = mustPreserveItems(state);
  var histOptions = historyKey.get(state).spec.config;
  var pop = (redo ? history.undone : history.done).popEvent(state, preserveItems);
  if (!pop) return;
  var selection = pop.selection.resolve(pop.transform.doc);
  var added = (redo ? history.done : history.undone).addTransform(pop.transform, state.selection.getBookmark(), histOptions, preserveItems);
  var newHist = new HistoryState(redo ? added : pop.remaining, redo ? pop.remaining : added, null, 0);
  dispatch(pop.transform.setSelection(selection).setMeta(historyKey, {
    redo: redo,
    historyState: newHist
  }).scrollIntoView());
}

var cachedPreserveItems = false,
    cachedPreserveItemsPlugins = null;

function mustPreserveItems(state) {
  var plugins = state.plugins;

  if (cachedPreserveItemsPlugins != plugins) {
    cachedPreserveItems = false;
    cachedPreserveItemsPlugins = plugins;

    for (var i = 0; i < plugins.length; i++) {
      if (plugins[i].spec.historyPreserveItems) {
        cachedPreserveItems = true;
        break;
      }
    }
  }

  return cachedPreserveItems;
}

function closeHistory(tr) {
  return tr.setMeta(closeHistoryKey, true);
}

var historyKey = new prosemirrorState.PluginKey("history");
var closeHistoryKey = new prosemirrorState.PluginKey("closeHistory");

function history() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  config = {
    depth: config.depth || 100,
    newGroupDelay: config.newGroupDelay || 500
  };
  return new prosemirrorState.Plugin({
    key: historyKey,
    state: {
      init: function init() {
        return new HistoryState(Branch.empty, Branch.empty, null, 0);
      },
      apply: function apply(tr, hist, state) {
        return applyTransaction(hist, state, tr, config);
      }
    },
    config: config,
    props: {
      handleDOMEvents: {
        beforeinput: function beforeinput(view, e) {
          var inputType = e.inputType;
          var command = inputType == "historyUndo" ? undo : inputType == "historyRedo" ? redo : null;
          if (!command) return false;
          e.preventDefault();
          return command(view.state, view.dispatch);
        }
      }
    }
  });
}

var undo = function undo(state, dispatch) {
  var hist = historyKey.getState(state);
  if (!hist || hist.done.eventCount == 0) return false;
  if (dispatch) histTransaction(hist, state, dispatch, false);
  return true;
};

var redo = function redo(state, dispatch) {
  var hist = historyKey.getState(state);
  if (!hist || hist.undone.eventCount == 0) return false;
  if (dispatch) histTransaction(hist, state, dispatch, true);
  return true;
};

function undoDepth(state) {
  var hist = historyKey.getState(state);
  return hist ? hist.done.eventCount : 0;
}

function redoDepth(state) {
  var hist = historyKey.getState(state);
  return hist ? hist.undone.eventCount : 0;
}

exports.closeHistory = closeHistory;
exports.history = history;
exports.redo = redo;
exports.redoDepth = redoDepth;
exports.undo = undo;
exports.undoDepth = undoDepth;

},{"prosemirror-state":15,"prosemirror-transform":16,"rope-sequence":18}],9:[function(require,module,exports){
'use strict';

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, '__esModule', {
  value: true
});

var prosemirrorState = require('prosemirror-state');

var prosemirrorTransform = require('prosemirror-transform');

var InputRule = _createClass(function InputRule(match, handler) {
  _classCallCheck(this, InputRule);

  this.match = match;
  this.match = match;
  this.handler = typeof handler == "string" ? stringHandler(handler) : handler;
});

function stringHandler(string) {
  return function (state, match, start, end) {
    var insert = string;

    if (match[1]) {
      var offset = match[0].lastIndexOf(match[1]);
      insert += match[0].slice(offset + match[1].length);
      start += offset;
      var cutOff = start - end;

      if (cutOff > 0) {
        insert = match[0].slice(offset - cutOff, offset) + insert;
        start = end;
      }
    }

    return state.tr.insertText(insert, start, end);
  };
}

var MAX_MATCH = 500;

function inputRules(_ref) {
  var rules = _ref.rules;
  var plugin = new prosemirrorState.Plugin({
    state: {
      init: function init() {
        return null;
      },
      apply: function apply(tr, prev) {
        var stored = tr.getMeta(this);
        if (stored) return stored;
        return tr.selectionSet || tr.docChanged ? null : prev;
      }
    },
    props: {
      handleTextInput: function handleTextInput(view, from, to, text) {
        return run(view, from, to, text, rules, plugin);
      },
      handleDOMEvents: {
        compositionend: function compositionend(view) {
          setTimeout(function () {
            var $cursor = view.state.selection.$cursor;
            if ($cursor) run(view, $cursor.pos, $cursor.pos, "", rules, plugin);
          });
        }
      }
    },
    isInputRules: true
  });
  return plugin;
}

function run(view, from, to, text, rules, plugin) {
  if (view.composing) return false;
  var state = view.state,
      $from = state.doc.resolve(from);
  if ($from.parent.type.spec.code) return false;
  var textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - MAX_MATCH), $from.parentOffset, null, "\uFFFC") + text;

  for (var i = 0; i < rules.length; i++) {
    var match = rules[i].match.exec(textBefore);
    var tr = match && rules[i].handler(state, match, from - (match[0].length - text.length), to);
    if (!tr) continue;
    view.dispatch(tr.setMeta(plugin, {
      transform: tr,
      from: from,
      to: to,
      text: text
    }));
    return true;
  }

  return false;
}

var undoInputRule = function undoInputRule(state, dispatch) {
  var plugins = state.plugins;

  for (var i = 0; i < plugins.length; i++) {
    var plugin = plugins[i],
        undoable = void 0;

    if (plugin.spec.isInputRules && (undoable = plugin.getState(state))) {
      if (dispatch) {
        var tr = state.tr,
            toUndo = undoable.transform;

        for (var j = toUndo.steps.length - 1; j >= 0; j--) {
          tr.step(toUndo.steps[j].invert(toUndo.docs[j]));
        }

        if (undoable.text) {
          var marks = tr.doc.resolve(undoable.from).marks();
          tr.replaceWith(undoable.from, undoable.to, state.schema.text(undoable.text, marks));
        } else {
          tr["delete"](undoable.from, undoable.to);
        }

        dispatch(tr);
      }

      return true;
    }
  }

  return false;
};

var emDash = new InputRule(/--$/, "—");
var ellipsis = new InputRule(/\.\.\.$/, "…");
var openDoubleQuote = new InputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/, "“");
var closeDoubleQuote = new InputRule(/"$/, "”");
var openSingleQuote = new InputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/, "‘");
var closeSingleQuote = new InputRule(/'$/, "’");
var smartQuotes = [openDoubleQuote, closeDoubleQuote, openSingleQuote, closeSingleQuote];

function wrappingInputRule(regexp, nodeType) {
  var getAttrs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var joinPredicate = arguments.length > 3 ? arguments[3] : undefined;
  return new InputRule(regexp, function (state, match, start, end) {
    var attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
    var tr = state.tr["delete"](start, end);
    var $start = tr.doc.resolve(start),
        range = $start.blockRange(),
        wrapping = range && prosemirrorTransform.findWrapping(range, nodeType, attrs);
    if (!wrapping) return null;
    tr.wrap(range, wrapping);
    var before = tr.doc.resolve(start - 1).nodeBefore;
    if (before && before.type == nodeType && prosemirrorTransform.canJoin(tr.doc, start - 1) && (!joinPredicate || joinPredicate(match, before))) tr.join(start - 1);
    return tr;
  });
}

function textblockTypeInputRule(regexp, nodeType) {
  var getAttrs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  return new InputRule(regexp, function (state, match, start, end) {
    var $start = state.doc.resolve(start);
    var attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
    if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType)) return null;
    return state.tr["delete"](start, end).setBlockType(start, start, nodeType, attrs);
  });
}

exports.InputRule = InputRule;
exports.closeDoubleQuote = closeDoubleQuote;
exports.closeSingleQuote = closeSingleQuote;
exports.ellipsis = ellipsis;
exports.emDash = emDash;
exports.inputRules = inputRules;
exports.openDoubleQuote = openDoubleQuote;
exports.openSingleQuote = openSingleQuote;
exports.smartQuotes = smartQuotes;
exports.textblockTypeInputRule = textblockTypeInputRule;
exports.undoInputRule = undoInputRule;
exports.wrappingInputRule = wrappingInputRule;

},{"prosemirror-state":15,"prosemirror-transform":16}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var w3cKeyname = require('w3c-keyname');

var prosemirrorState = require('prosemirror-state');

var mac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false;

function normalizeKeyName(name) {
  var parts = name.split(/-(?!$)/),
      result = parts[parts.length - 1];
  if (result == "Space") result = " ";
  var alt, ctrl, shift, meta;

  for (var i = 0; i < parts.length - 1; i++) {
    var mod = parts[i];
    if (/^(cmd|meta|m)$/i.test(mod)) meta = true;else if (/^a(lt)?$/i.test(mod)) alt = true;else if (/^(c|ctrl|control)$/i.test(mod)) ctrl = true;else if (/^s(hift)?$/i.test(mod)) shift = true;else if (/^mod$/i.test(mod)) {
      if (mac) meta = true;else ctrl = true;
    } else throw new Error("Unrecognized modifier name: " + mod);
  }

  if (alt) result = "Alt-" + result;
  if (ctrl) result = "Ctrl-" + result;
  if (meta) result = "Meta-" + result;
  if (shift) result = "Shift-" + result;
  return result;
}

function normalize(map) {
  var copy = Object.create(null);

  for (var prop in map) {
    copy[normalizeKeyName(prop)] = map[prop];
  }

  return copy;
}

function modifiers(name, event, shift) {
  if (event.altKey) name = "Alt-" + name;
  if (event.ctrlKey) name = "Ctrl-" + name;
  if (event.metaKey) name = "Meta-" + name;
  if (shift !== false && event.shiftKey) name = "Shift-" + name;
  return name;
}

function keymap(bindings) {
  return new prosemirrorState.Plugin({
    props: {
      handleKeyDown: keydownHandler(bindings)
    }
  });
}

function keydownHandler(bindings) {
  var map = normalize(bindings);
  return function (view, event) {
    var name = w3cKeyname.keyName(event),
        isChar = name.length == 1 && name != " ",
        baseName;
    var direct = map[modifiers(name, event, !isChar)];
    if (direct && direct(view.state, view.dispatch, view)) return true;

    if (isChar && (event.shiftKey || event.altKey || event.metaKey || name.charCodeAt(0) > 127) && (baseName = w3cKeyname.base[event.keyCode]) && baseName != name) {
      var fromCode = map[modifiers(baseName, event, true)];
      if (fromCode && fromCode(view.state, view.dispatch, view)) return true;
    } else if (isChar && event.shiftKey) {
      var withShift = map[modifiers(name, event, true)];
      if (withShift && withShift(view.state, view.dispatch, view)) return true;
    }

    return false;
  };
}

exports.keydownHandler = keydownHandler;
exports.keymap = keymap;

},{"prosemirror-state":15,"w3c-keyname":19}],11:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, '__esModule', {
  value: true
});

var crel = require('crelt');

var prosemirrorCommands = require('prosemirror-commands');

var prosemirrorHistory = require('prosemirror-history');

var prosemirrorState = require('prosemirror-state');

function _interopDefaultLegacy(e) {
  return e && _typeof(e) === 'object' && 'default' in e ? e : {
    'default': e
  };
}

var crel__default = _interopDefaultLegacy(crel);

var SVG = "http://www.w3.org/2000/svg";
var XLINK = "http://www.w3.org/1999/xlink";
var prefix$2 = "ProseMirror-icon";

function hashPath(path) {
  var hash = 0;

  for (var i = 0; i < path.length; i++) {
    hash = (hash << 5) - hash + path.charCodeAt(i) | 0;
  }

  return hash;
}

function getIcon(icon) {
  var node = document.createElement("div");
  node.className = prefix$2;

  if (icon.path) {
    var path = icon.path,
        width = icon.width,
        height = icon.height;
    var name = "pm-icon-" + hashPath(path).toString(16);
    if (!document.getElementById(name)) buildSVG(name, icon);
    var svg = node.appendChild(document.createElementNS(SVG, "svg"));
    svg.style.width = width / height + "em";
    var use = svg.appendChild(document.createElementNS(SVG, "use"));
    use.setAttributeNS(XLINK, "href", /([^#]*)/.exec(document.location.toString())[1] + "#" + name);
  } else if (icon.dom) {
    node.appendChild(icon.dom.cloneNode(true));
  } else {
    var text = icon.text,
        css = icon.css;
    node.appendChild(document.createElement("span")).textContent = text || '';
    if (css) node.firstChild.style.cssText = css;
  }

  return node;
}

function buildSVG(name, data) {
  var collection = document.getElementById(prefix$2 + "-collection");

  if (!collection) {
    collection = document.createElementNS(SVG, "svg");
    collection.id = prefix$2 + "-collection";
    collection.style.display = "none";
    document.body.insertBefore(collection, document.body.firstChild);
  }

  var sym = document.createElementNS(SVG, "symbol");
  sym.id = name;
  sym.setAttribute("viewBox", "0 0 " + data.width + " " + data.height);
  var path = sym.appendChild(document.createElementNS(SVG, "path"));
  path.setAttribute("d", data.path);
  collection.appendChild(sym);
}

var prefix$1 = "ProseMirror-menu";

var MenuItem = function () {
  function MenuItem(spec) {
    _classCallCheck(this, MenuItem);

    this.spec = spec;
  }

  _createClass(MenuItem, [{
    key: "render",
    value: function render(view) {
      var spec = this.spec;
      var dom = spec.render ? spec.render(view) : spec.icon ? getIcon(spec.icon) : spec.label ? crel__default["default"]("div", null, translate(view, spec.label)) : null;
      if (!dom) throw new RangeError("MenuItem without icon or label property");

      if (spec.title) {
        var title = typeof spec.title === "function" ? spec.title(view.state) : spec.title;
        dom.setAttribute("title", translate(view, title));
      }

      if (spec["class"]) dom.classList.add(spec["class"]);
      if (spec.css) dom.style.cssText += spec.css;
      dom.addEventListener("mousedown", function (e) {
        e.preventDefault();
        if (!dom.classList.contains(prefix$1 + "-disabled")) spec.run(view.state, view.dispatch, view, e);
      });

      function update(state) {
        if (spec.select) {
          var selected = spec.select(state);
          dom.style.display = selected ? "" : "none";
          if (!selected) return false;
        }

        var enabled = true;

        if (spec.enable) {
          enabled = spec.enable(state) || false;
          setClass(dom, prefix$1 + "-disabled", !enabled);
        }

        if (spec.active) {
          var active = enabled && spec.active(state) || false;
          setClass(dom, prefix$1 + "-active", active);
        }

        return true;
      }

      return {
        dom: dom,
        update: update
      };
    }
  }]);

  return MenuItem;
}();

function translate(view, text) {
  return view._props.translate ? view._props.translate(text) : text;
}

var lastMenuEvent = {
  time: 0,
  node: null
};

function markMenuEvent(e) {
  lastMenuEvent.time = Date.now();
  lastMenuEvent.node = e.target;
}

function isMenuEvent(wrapper) {
  return Date.now() - 100 < lastMenuEvent.time && lastMenuEvent.node && wrapper.contains(lastMenuEvent.node);
}

var Dropdown = function () {
  function Dropdown(content) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Dropdown);

    this.options = options;
    this.options = options || {};
    this.content = Array.isArray(content) ? content : [content];
  }

  _createClass(Dropdown, [{
    key: "render",
    value: function render(view) {
      var _this = this;

      var content = renderDropdownItems(this.content, view);
      var label = crel__default["default"]("div", {
        "class": prefix$1 + "-dropdown " + (this.options["class"] || ""),
        style: this.options.css
      }, translate(view, this.options.label || ""));
      if (this.options.title) label.setAttribute("title", translate(view, this.options.title));
      var wrap = crel__default["default"]("div", {
        "class": prefix$1 + "-dropdown-wrap"
      }, label);
      var open = null;
      var listeningOnClose = null;

      var close = function close() {
        if (open && open.close()) {
          open = null;
          window.removeEventListener("mousedown", listeningOnClose);
        }
      };

      label.addEventListener("mousedown", function (e) {
        e.preventDefault();
        markMenuEvent(e);

        if (open) {
          close();
        } else {
          open = _this.expand(wrap, content.dom);
          window.addEventListener("mousedown", listeningOnClose = function listeningOnClose() {
            if (!isMenuEvent(wrap)) close();
          });
        }
      });

      function update(state) {
        var inner = content.update(state);
        wrap.style.display = inner ? "" : "none";
        return inner;
      }

      return {
        dom: wrap,
        update: update
      };
    }
  }, {
    key: "expand",
    value: function expand(dom, items) {
      var menuDOM = crel__default["default"]("div", {
        "class": prefix$1 + "-dropdown-menu " + (this.options["class"] || "")
      }, items);
      var done = false;

      function close() {
        if (done) return;
        done = true;
        dom.removeChild(menuDOM);
        return true;
      }

      dom.appendChild(menuDOM);
      return {
        close: close,
        node: menuDOM
      };
    }
  }]);

  return Dropdown;
}();

function renderDropdownItems(items, view) {
  var rendered = [],
      updates = [];

  for (var i = 0; i < items.length; i++) {
    var _items$i$render = items[i].render(view),
        dom = _items$i$render.dom,
        update = _items$i$render.update;

    rendered.push(crel__default["default"]("div", {
      "class": prefix$1 + "-dropdown-item"
    }, dom));
    updates.push(update);
  }

  return {
    dom: rendered,
    update: combineUpdates(updates, rendered)
  };
}

function combineUpdates(updates, nodes) {
  return function (state) {
    var something = false;

    for (var i = 0; i < updates.length; i++) {
      var up = updates[i](state);
      nodes[i].style.display = up ? "" : "none";
      if (up) something = true;
    }

    return something;
  };
}

var DropdownSubmenu = function () {
  function DropdownSubmenu(content) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, DropdownSubmenu);

    this.options = options;
    this.content = Array.isArray(content) ? content : [content];
  }

  _createClass(DropdownSubmenu, [{
    key: "render",
    value: function render(view) {
      var items = renderDropdownItems(this.content, view);
      var label = crel__default["default"]("div", {
        "class": prefix$1 + "-submenu-label"
      }, translate(view, this.options.label || ""));
      var wrap = crel__default["default"]("div", {
        "class": prefix$1 + "-submenu-wrap"
      }, label, crel__default["default"]("div", {
        "class": prefix$1 + "-submenu"
      }, items.dom));
      var _listeningOnClose = null;
      label.addEventListener("mousedown", function (e) {
        e.preventDefault();
        markMenuEvent(e);
        setClass(wrap, prefix$1 + "-submenu-wrap-active", false);
        if (!_listeningOnClose) window.addEventListener("mousedown", _listeningOnClose = function listeningOnClose() {
          if (!isMenuEvent(wrap)) {
            wrap.classList.remove(prefix$1 + "-submenu-wrap-active");
            window.removeEventListener("mousedown", _listeningOnClose);
            _listeningOnClose = null;
          }
        });
      });

      function update(state) {
        var inner = items.update(state);
        wrap.style.display = inner ? "" : "none";
        return inner;
      }

      return {
        dom: wrap,
        update: update
      };
    }
  }]);

  return DropdownSubmenu;
}();

function renderGrouped(view, content) {
  var result = document.createDocumentFragment();
  var updates = [],
      separators = [];

  for (var i = 0; i < content.length; i++) {
    var items = content[i],
        localUpdates = [],
        localNodes = [];

    for (var j = 0; j < items.length; j++) {
      var _items$j$render = items[j].render(view),
          dom = _items$j$render.dom,
          _update = _items$j$render.update;

      var span = crel__default["default"]("span", {
        "class": prefix$1 + "item"
      }, dom);
      result.appendChild(span);
      localNodes.push(span);
      localUpdates.push(_update);
    }

    if (localUpdates.length) {
      updates.push(combineUpdates(localUpdates, localNodes));
      if (i < content.length - 1) separators.push(result.appendChild(separator()));
    }
  }

  function update(state) {
    var something = false,
        needSep = false;

    for (var _i = 0; _i < updates.length; _i++) {
      var hasContent = updates[_i](state);

      if (_i) separators[_i - 1].style.display = needSep && hasContent ? "" : "none";
      needSep = hasContent;
      if (hasContent) something = true;
    }

    return something;
  }

  return {
    dom: result,
    update: update
  };
}

function separator() {
  return crel__default["default"]("span", {
    "class": prefix$1 + "separator"
  });
}

var icons = {
  join: {
    width: 800,
    height: 900,
    path: "M0 75h800v125h-800z M0 825h800v-125h-800z M250 400h100v-100h100v100h100v100h-100v100h-100v-100h-100z"
  },
  lift: {
    width: 1024,
    height: 1024,
    path: "M219 310v329q0 7-5 12t-12 5q-8 0-13-5l-164-164q-5-5-5-13t5-13l164-164q5-5 13-5 7 0 12 5t5 12zM1024 749v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12zM1024 530v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 310v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 91v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12z"
  },
  selectParentNode: {
    text: "\u2B1A",
    css: "font-weight: bold"
  },
  undo: {
    width: 1024,
    height: 1024,
    path: "M761 1024c113-206 132-520-313-509v253l-384-384 384-384v248c534-13 594 472 313 775z"
  },
  redo: {
    width: 1024,
    height: 1024,
    path: "M576 248v-248l384 384-384 384v-253c-446-10-427 303-313 509-280-303-221-789 313-775z"
  },
  strong: {
    width: 805,
    height: 1024,
    path: "M317 869q42 18 80 18 214 0 214-191 0-65-23-102-15-25-35-42t-38-26-46-14-48-6-54-1q-41 0-57 5 0 30-0 90t-0 90q0 4-0 38t-0 55 2 47 6 38zM309 442q24 4 62 4 46 0 81-7t62-25 42-51 14-81q0-40-16-70t-45-46-61-24-70-8q-28 0-74 7 0 28 2 86t2 86q0 15-0 45t-0 45q0 26 0 39zM0 950l1-53q8-2 48-9t60-15q4-6 7-15t4-19 3-18 1-21 0-19v-37q0-561-12-585-2-4-12-8t-25-6-28-4-27-2-17-1l-2-47q56-1 194-6t213-5q13 0 39 0t38 0q40 0 78 7t73 24 61 40 42 59 16 78q0 29-9 54t-22 41-36 32-41 25-48 22q88 20 146 76t58 141q0 57-20 102t-53 74-78 48-93 27-100 8q-25 0-75-1t-75-1q-60 0-175 6t-132 6z"
  },
  em: {
    width: 585,
    height: 1024,
    path: "M0 949l9-48q3-1 46-12t63-21q16-20 23-57 0-4 35-165t65-310 29-169v-14q-13-7-31-10t-39-4-33-3l10-58q18 1 68 3t85 4 68 1q27 0 56-1t69-4 56-3q-2 22-10 50-17 5-58 16t-62 19q-4 10-8 24t-5 22-4 26-3 24q-15 84-50 239t-44 203q-1 5-7 33t-11 51-9 47-3 32l0 10q9 2 105 17-1 25-9 56-6 0-18 0t-18 0q-16 0-49-5t-49-5q-78-1-117-1-29 0-81 5t-69 6z"
  },
  code: {
    width: 896,
    height: 1024,
    path: "M608 192l-96 96 224 224-224 224 96 96 288-320-288-320zM288 192l-288 320 288 320 96-96-224-224 224-224-96-96z"
  },
  link: {
    width: 951,
    height: 1024,
    path: "M832 694q0-22-16-38l-118-118q-16-16-38-16-24 0-41 18 1 1 10 10t12 12 8 10 7 14 2 15q0 22-16 38t-38 16q-8 0-15-2t-14-7-10-8-12-12-10-10q-18 17-18 41 0 22 16 38l117 118q15 15 38 15 22 0 38-14l84-83q16-16 16-38zM430 292q0-22-16-38l-117-118q-16-16-38-16-22 0-38 15l-84 83q-16 16-16 38 0 22 16 38l118 118q15 15 38 15 24 0 41-17-1-1-10-10t-12-12-8-10-7-14-2-15q0-22 16-38t38-16q8 0 15 2t14 7 10 8 12 12 10 10q18-17 18-41zM941 694q0 68-48 116l-84 83q-47 47-116 47-69 0-116-48l-117-118q-47-47-47-116 0-70 50-119l-50-50q-49 50-118 50-68 0-116-48l-118-118q-48-48-48-116t48-116l84-83q47-47 116-47 69 0 116 48l117 118q47 47 47 116 0 70-50 119l50 50q49-50 118-50 68 0 116 48l118 118q48 48 48 116z"
  },
  bulletList: {
    width: 768,
    height: 896,
    path: "M0 512h128v-128h-128v128zM0 256h128v-128h-128v128zM0 768h128v-128h-128v128zM256 512h512v-128h-512v128zM256 256h512v-128h-512v128zM256 768h512v-128h-512v128z"
  },
  orderedList: {
    width: 768,
    height: 896,
    path: "M320 512h448v-128h-448v128zM320 768h448v-128h-448v128zM320 128v128h448v-128h-448zM79 384h78v-256h-36l-85 23v50l43-2v185zM189 590c0-36-12-78-96-78-33 0-64 6-83 16l1 66c21-10 42-15 67-15s32 11 32 28c0 26-30 58-110 112v50h192v-67l-91 2c49-30 87-66 87-113l1-1z"
  },
  blockquote: {
    width: 640,
    height: 896,
    path: "M0 448v256h256v-256h-128c0 0 0-128 128-128v-128c0 0-256 0-256 256zM640 320v-128c0 0-256 0-256 256v256h256v-256h-128c0 0 0-128 128-128z"
  }
};
var joinUpItem = new MenuItem({
  title: "Join with above block",
  run: prosemirrorCommands.joinUp,
  select: function select(state) {
    return prosemirrorCommands.joinUp(state);
  },
  icon: icons.join
});
var liftItem = new MenuItem({
  title: "Lift out of enclosing block",
  run: prosemirrorCommands.lift,
  select: function select(state) {
    return prosemirrorCommands.lift(state);
  },
  icon: icons.lift
});
var selectParentNodeItem = new MenuItem({
  title: "Select parent node",
  run: prosemirrorCommands.selectParentNode,
  select: function select(state) {
    return prosemirrorCommands.selectParentNode(state);
  },
  icon: icons.selectParentNode
});
var undoItem = new MenuItem({
  title: "Undo last change",
  run: prosemirrorHistory.undo,
  enable: function enable(state) {
    return prosemirrorHistory.undo(state);
  },
  icon: icons.undo
});
var redoItem = new MenuItem({
  title: "Redo last undone change",
  run: prosemirrorHistory.redo,
  enable: function enable(state) {
    return prosemirrorHistory.redo(state);
  },
  icon: icons.redo
});

function wrapItem(nodeType, options) {
  var passedOptions = {
    run: function run(state, dispatch) {
      return prosemirrorCommands.wrapIn(nodeType, options.attrs)(state, dispatch);
    },
    select: function select(state) {
      return prosemirrorCommands.wrapIn(nodeType, options.attrs)(state);
    }
  };

  for (var prop in options) {
    passedOptions[prop] = options[prop];
  }

  return new MenuItem(passedOptions);
}

function blockTypeItem(nodeType, options) {
  var command = prosemirrorCommands.setBlockType(nodeType, options.attrs);
  var passedOptions = {
    run: command,
    enable: function enable(state) {
      return command(state);
    },
    active: function active(state) {
      var _state$selection = state.selection,
          $from = _state$selection.$from,
          to = _state$selection.to,
          node = _state$selection.node;
      if (node) return node.hasMarkup(nodeType, options.attrs);
      return to <= $from.end() && $from.parent.hasMarkup(nodeType, options.attrs);
    }
  };

  for (var prop in options) {
    passedOptions[prop] = options[prop];
  }

  return new MenuItem(passedOptions);
}

function setClass(dom, cls, on) {
  if (on) dom.classList.add(cls);else dom.classList.remove(cls);
}

var prefix = "ProseMirror-menubar";

function isIOS() {
  if (typeof navigator == "undefined") return false;
  var agent = navigator.userAgent;
  return !/Edge\/\d/.test(agent) && /AppleWebKit/.test(agent) && /Mobile\/\w+/.test(agent);
}

function menuBar(options) {
  return new prosemirrorState.Plugin({
    view: function view(editorView) {
      return new MenuBarView(editorView, options);
    }
  });
}

var MenuBarView = function () {
  function MenuBarView(editorView, options) {
    var _this2 = this;

    _classCallCheck(this, MenuBarView);

    this.editorView = editorView;
    this.options = options;
    this.spacer = null;
    this.maxHeight = 0;
    this.widthForMaxHeight = 0;
    this.floating = false;
    this.scrollHandler = null;
    this.wrapper = crel__default["default"]("div", {
      "class": prefix + "-wrapper"
    });
    this.menu = this.wrapper.appendChild(crel__default["default"]("div", {
      "class": prefix
    }));
    this.menu.className = prefix;
    if (editorView.dom.parentNode) editorView.dom.parentNode.replaceChild(this.wrapper, editorView.dom);
    this.wrapper.appendChild(editorView.dom);

    var _renderGrouped = renderGrouped(this.editorView, this.options.content),
        dom = _renderGrouped.dom,
        update = _renderGrouped.update;

    this.contentUpdate = update;
    this.menu.appendChild(dom);
    this.update();

    if (options.floating && !isIOS()) {
      this.updateFloat();
      var potentialScrollers = getAllWrapping(this.wrapper);

      this.scrollHandler = function (e) {
        var root = _this2.editorView.root;
        if (!(root.body || root).contains(_this2.wrapper)) potentialScrollers.forEach(function (el) {
          return el.removeEventListener("scroll", _this2.scrollHandler);
        });else _this2.updateFloat(e.target.getBoundingClientRect ? e.target : undefined);
      };

      potentialScrollers.forEach(function (el) {
        return el.addEventListener('scroll', _this2.scrollHandler);
      });
    }
  }

  _createClass(MenuBarView, [{
    key: "update",
    value: function update() {
      this.contentUpdate(this.editorView.state);

      if (this.floating) {
        this.updateScrollCursor();
      } else {
        if (this.menu.offsetWidth != this.widthForMaxHeight) {
          this.widthForMaxHeight = this.menu.offsetWidth;
          this.maxHeight = 0;
        }

        if (this.menu.offsetHeight > this.maxHeight) {
          this.maxHeight = this.menu.offsetHeight;
          this.menu.style.minHeight = this.maxHeight + "px";
        }
      }
    }
  }, {
    key: "updateScrollCursor",
    value: function updateScrollCursor() {
      var selection = this.editorView.root.getSelection();
      if (!selection.focusNode) return;
      var rects = selection.getRangeAt(0).getClientRects();
      var selRect = rects[selectionIsInverted(selection) ? 0 : rects.length - 1];
      if (!selRect) return;
      var menuRect = this.menu.getBoundingClientRect();

      if (selRect.top < menuRect.bottom && selRect.bottom > menuRect.top) {
        var scrollable = findWrappingScrollable(this.wrapper);
        if (scrollable) scrollable.scrollTop -= menuRect.bottom - selRect.top;
      }
    }
  }, {
    key: "updateFloat",
    value: function updateFloat(scrollAncestor) {
      var parent = this.wrapper,
          editorRect = parent.getBoundingClientRect(),
          top = scrollAncestor ? Math.max(0, scrollAncestor.getBoundingClientRect().top) : 0;

      if (this.floating) {
        if (editorRect.top >= top || editorRect.bottom < this.menu.offsetHeight + 10) {
          this.floating = false;
          this.menu.style.position = this.menu.style.left = this.menu.style.top = this.menu.style.width = "";
          this.menu.style.display = "";
          this.spacer.parentNode.removeChild(this.spacer);
          this.spacer = null;
        } else {
          var border = (parent.offsetWidth - parent.clientWidth) / 2;
          this.menu.style.left = editorRect.left + border + "px";
          this.menu.style.display = editorRect.top > window.innerHeight ? "none" : "";
          if (scrollAncestor) this.menu.style.top = top + "px";
        }
      } else {
        if (editorRect.top < top && editorRect.bottom >= this.menu.offsetHeight + 10) {
          this.floating = true;
          var menuRect = this.menu.getBoundingClientRect();
          this.menu.style.left = menuRect.left + "px";
          this.menu.style.width = menuRect.width + "px";
          if (scrollAncestor) this.menu.style.top = top + "px";
          this.menu.style.position = "fixed";
          this.spacer = crel__default["default"]("div", {
            "class": prefix + "-spacer",
            style: "height: ".concat(menuRect.height, "px")
          });
          parent.insertBefore(this.spacer, this.menu);
        }
      }
    }
  }, {
    key: "destroy",
    value: function destroy() {
      if (this.wrapper.parentNode) this.wrapper.parentNode.replaceChild(this.editorView.dom, this.wrapper);
    }
  }]);

  return MenuBarView;
}();

function selectionIsInverted(selection) {
  if (selection.anchorNode == selection.focusNode) return selection.anchorOffset > selection.focusOffset;
  return selection.anchorNode.compareDocumentPosition(selection.focusNode) == Node.DOCUMENT_POSITION_FOLLOWING;
}

function findWrappingScrollable(node) {
  for (var cur = node.parentNode; cur; cur = cur.parentNode) {
    if (cur.scrollHeight > cur.clientHeight) return cur;
  }
}

function getAllWrapping(node) {
  var res = [window];

  for (var cur = node.parentNode; cur; cur = cur.parentNode) {
    res.push(cur);
  }

  return res;
}

exports.Dropdown = Dropdown;
exports.DropdownSubmenu = DropdownSubmenu;
exports.MenuItem = MenuItem;
exports.blockTypeItem = blockTypeItem;
exports.icons = icons;
exports.joinUpItem = joinUpItem;
exports.liftItem = liftItem;
exports.menuBar = menuBar;
exports.redoItem = redoItem;
exports.renderGrouped = renderGrouped;
exports.selectParentNodeItem = selectParentNodeItem;
exports.undoItem = undoItem;
exports.wrapItem = wrapItem;

},{"crelt":2,"prosemirror-commands":4,"prosemirror-history":8,"prosemirror-state":15}],12:[function(require,module,exports){
'use strict';

function _get() { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(arguments.length < 3 ? target : receiver); } return desc.value; }; } return _get.apply(this, arguments); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function _construct(Parent, args, Class) { if (_isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, '__esModule', {
  value: true
});

var OrderedMap = require('orderedmap');

function _interopDefaultLegacy(e) {
  return e && _typeof(e) === 'object' && 'default' in e ? e : {
    'default': e
  };
}

var OrderedMap__default = _interopDefaultLegacy(OrderedMap);

function _findDiffStart(a, b, pos) {
  for (var i = 0;; i++) {
    if (i == a.childCount || i == b.childCount) return a.childCount == b.childCount ? null : pos;
    var childA = a.child(i),
        childB = b.child(i);

    if (childA == childB) {
      pos += childA.nodeSize;
      continue;
    }

    if (!childA.sameMarkup(childB)) return pos;

    if (childA.isText && childA.text != childB.text) {
      for (var j = 0; childA.text[j] == childB.text[j]; j++) {
        pos++;
      }

      return pos;
    }

    if (childA.content.size || childB.content.size) {
      var inner = _findDiffStart(childA.content, childB.content, pos + 1);

      if (inner != null) return inner;
    }

    pos += childA.nodeSize;
  }
}

function _findDiffEnd(a, b, posA, posB) {
  for (var iA = a.childCount, iB = b.childCount;;) {
    if (iA == 0 || iB == 0) return iA == iB ? null : {
      a: posA,
      b: posB
    };
    var childA = a.child(--iA),
        childB = b.child(--iB),
        size = childA.nodeSize;

    if (childA == childB) {
      posA -= size;
      posB -= size;
      continue;
    }

    if (!childA.sameMarkup(childB)) return {
      a: posA,
      b: posB
    };

    if (childA.isText && childA.text != childB.text) {
      var same = 0,
          minSize = Math.min(childA.text.length, childB.text.length);

      while (same < minSize && childA.text[childA.text.length - same - 1] == childB.text[childB.text.length - same - 1]) {
        same++;
        posA--;
        posB--;
      }

      return {
        a: posA,
        b: posB
      };
    }

    if (childA.content.size || childB.content.size) {
      var inner = _findDiffEnd(childA.content, childB.content, posA - 1, posB - 1);

      if (inner) return inner;
    }

    posA -= size;
    posB -= size;
  }
}

var Fragment = function () {
  function Fragment(content, size) {
    _classCallCheck(this, Fragment);

    this.content = content;
    this.size = size || 0;
    if (size == null) for (var i = 0; i < content.length; i++) {
      this.size += content[i].nodeSize;
    }
  }

  _createClass(Fragment, [{
    key: "nodesBetween",
    value: function nodesBetween(from, to, f) {
      var nodeStart = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var parent = arguments.length > 4 ? arguments[4] : undefined;

      for (var i = 0, pos = 0; pos < to; i++) {
        var child = this.content[i],
            end = pos + child.nodeSize;

        if (end > from && f(child, nodeStart + pos, parent || null, i) !== false && child.content.size) {
          var start = pos + 1;
          child.nodesBetween(Math.max(0, from - start), Math.min(child.content.size, to - start), f, nodeStart + start);
        }

        pos = end;
      }
    }
  }, {
    key: "descendants",
    value: function descendants(f) {
      this.nodesBetween(0, this.size, f);
    }
  }, {
    key: "textBetween",
    value: function textBetween(from, to, blockSeparator, leafText) {
      var text = "",
          separated = true;
      this.nodesBetween(from, to, function (node, pos) {
        if (node.isText) {
          text += node.text.slice(Math.max(from, pos) - pos, to - pos);
          separated = !blockSeparator;
        } else if (node.isLeaf) {
          if (leafText) {
            text += typeof leafText === "function" ? leafText(node) : leafText;
          } else if (node.type.spec.leafText) {
            text += node.type.spec.leafText(node);
          }

          separated = !blockSeparator;
        } else if (!separated && node.isBlock) {
          text += blockSeparator;
          separated = true;
        }
      }, 0);
      return text;
    }
  }, {
    key: "append",
    value: function append(other) {
      if (!other.size) return this;
      if (!this.size) return other;
      var last = this.lastChild,
          first = other.firstChild,
          content = this.content.slice(),
          i = 0;

      if (last.isText && last.sameMarkup(first)) {
        content[content.length - 1] = last.withText(last.text + first.text);
        i = 1;
      }

      for (; i < other.content.length; i++) {
        content.push(other.content[i]);
      }

      return new Fragment(content, this.size + other.size);
    }
  }, {
    key: "cut",
    value: function cut(from) {
      var to = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.size;
      if (from == 0 && to == this.size) return this;
      var result = [],
          size = 0;
      if (to > from) for (var i = 0, pos = 0; pos < to; i++) {
        var child = this.content[i],
            end = pos + child.nodeSize;

        if (end > from) {
          if (pos < from || end > to) {
            if (child.isText) child = child.cut(Math.max(0, from - pos), Math.min(child.text.length, to - pos));else child = child.cut(Math.max(0, from - pos - 1), Math.min(child.content.size, to - pos - 1));
          }

          result.push(child);
          size += child.nodeSize;
        }

        pos = end;
      }
      return new Fragment(result, size);
    }
  }, {
    key: "cutByIndex",
    value: function cutByIndex(from, to) {
      if (from == to) return Fragment.empty;
      if (from == 0 && to == this.content.length) return this;
      return new Fragment(this.content.slice(from, to));
    }
  }, {
    key: "replaceChild",
    value: function replaceChild(index, node) {
      var current = this.content[index];
      if (current == node) return this;
      var copy = this.content.slice();
      var size = this.size + node.nodeSize - current.nodeSize;
      copy[index] = node;
      return new Fragment(copy, size);
    }
  }, {
    key: "addToStart",
    value: function addToStart(node) {
      return new Fragment([node].concat(this.content), this.size + node.nodeSize);
    }
  }, {
    key: "addToEnd",
    value: function addToEnd(node) {
      return new Fragment(this.content.concat(node), this.size + node.nodeSize);
    }
  }, {
    key: "eq",
    value: function eq(other) {
      if (this.content.length != other.content.length) return false;

      for (var i = 0; i < this.content.length; i++) {
        if (!this.content[i].eq(other.content[i])) return false;
      }

      return true;
    }
  }, {
    key: "firstChild",
    get: function get() {
      return this.content.length ? this.content[0] : null;
    }
  }, {
    key: "lastChild",
    get: function get() {
      return this.content.length ? this.content[this.content.length - 1] : null;
    }
  }, {
    key: "childCount",
    get: function get() {
      return this.content.length;
    }
  }, {
    key: "child",
    value: function child(index) {
      var found = this.content[index];
      if (!found) throw new RangeError("Index " + index + " out of range for " + this);
      return found;
    }
  }, {
    key: "maybeChild",
    value: function maybeChild(index) {
      return this.content[index] || null;
    }
  }, {
    key: "forEach",
    value: function forEach(f) {
      for (var i = 0, p = 0; i < this.content.length; i++) {
        var child = this.content[i];
        f(child, p, i);
        p += child.nodeSize;
      }
    }
  }, {
    key: "findDiffStart",
    value: function findDiffStart(other) {
      var pos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      return _findDiffStart(this, other, pos);
    }
  }, {
    key: "findDiffEnd",
    value: function findDiffEnd(other) {
      var pos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.size;
      var otherPos = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : other.size;
      return _findDiffEnd(this, other, pos, otherPos);
    }
  }, {
    key: "findIndex",
    value: function findIndex(pos) {
      var round = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;
      if (pos == 0) return retIndex(0, pos);
      if (pos == this.size) return retIndex(this.content.length, pos);
      if (pos > this.size || pos < 0) throw new RangeError("Position ".concat(pos, " outside of fragment (").concat(this, ")"));

      for (var i = 0, curPos = 0;; i++) {
        var cur = this.child(i),
            end = curPos + cur.nodeSize;

        if (end >= pos) {
          if (end == pos || round > 0) return retIndex(i + 1, end);
          return retIndex(i, curPos);
        }

        curPos = end;
      }
    }
  }, {
    key: "toString",
    value: function toString() {
      return "<" + this.toStringInner() + ">";
    }
  }, {
    key: "toStringInner",
    value: function toStringInner() {
      return this.content.join(", ");
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.content.length ? this.content.map(function (n) {
        return n.toJSON();
      }) : null;
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(schema, value) {
      if (!value) return Fragment.empty;
      if (!Array.isArray(value)) throw new RangeError("Invalid input for Fragment.fromJSON");
      return new Fragment(value.map(schema.nodeFromJSON));
    }
  }, {
    key: "fromArray",
    value: function fromArray(array) {
      if (!array.length) return Fragment.empty;
      var joined,
          size = 0;

      for (var i = 0; i < array.length; i++) {
        var node = array[i];
        size += node.nodeSize;

        if (i && node.isText && array[i - 1].sameMarkup(node)) {
          if (!joined) joined = array.slice(0, i);
          joined[joined.length - 1] = node.withText(joined[joined.length - 1].text + node.text);
        } else if (joined) {
          joined.push(node);
        }
      }

      return new Fragment(joined || array, size);
    }
  }, {
    key: "from",
    value: function from(nodes) {
      if (!nodes) return Fragment.empty;
      if (nodes instanceof Fragment) return nodes;
      if (Array.isArray(nodes)) return this.fromArray(nodes);
      if (nodes.attrs) return new Fragment([nodes], nodes.nodeSize);
      throw new RangeError("Can not convert " + nodes + " to a Fragment" + (nodes.nodesBetween ? " (looks like multiple versions of prosemirror-model were loaded)" : ""));
    }
  }]);

  return Fragment;
}();

Fragment.empty = new Fragment([], 0);
var found = {
  index: 0,
  offset: 0
};

function retIndex(index, offset) {
  found.index = index;
  found.offset = offset;
  return found;
}

function compareDeep(a, b) {
  if (a === b) return true;
  if (!(a && _typeof(a) == "object") || !(b && _typeof(b) == "object")) return false;
  var array = Array.isArray(a);
  if (Array.isArray(b) != array) return false;

  if (array) {
    if (a.length != b.length) return false;

    for (var i = 0; i < a.length; i++) {
      if (!compareDeep(a[i], b[i])) return false;
    }
  } else {
    for (var p in a) {
      if (!(p in b) || !compareDeep(a[p], b[p])) return false;
    }

    for (var _p in b) {
      if (!(_p in a)) return false;
    }
  }

  return true;
}

var Mark = function () {
  function Mark(type, attrs) {
    _classCallCheck(this, Mark);

    this.type = type;
    this.attrs = attrs;
  }

  _createClass(Mark, [{
    key: "addToSet",
    value: function addToSet(set) {
      var copy,
          placed = false;

      for (var i = 0; i < set.length; i++) {
        var other = set[i];
        if (this.eq(other)) return set;

        if (this.type.excludes(other.type)) {
          if (!copy) copy = set.slice(0, i);
        } else if (other.type.excludes(this.type)) {
          return set;
        } else {
          if (!placed && other.type.rank > this.type.rank) {
            if (!copy) copy = set.slice(0, i);
            copy.push(this);
            placed = true;
          }

          if (copy) copy.push(other);
        }
      }

      if (!copy) copy = set.slice();
      if (!placed) copy.push(this);
      return copy;
    }
  }, {
    key: "removeFromSet",
    value: function removeFromSet(set) {
      for (var i = 0; i < set.length; i++) {
        if (this.eq(set[i])) return set.slice(0, i).concat(set.slice(i + 1));
      }

      return set;
    }
  }, {
    key: "isInSet",
    value: function isInSet(set) {
      for (var i = 0; i < set.length; i++) {
        if (this.eq(set[i])) return true;
      }

      return false;
    }
  }, {
    key: "eq",
    value: function eq(other) {
      return this == other || this.type == other.type && compareDeep(this.attrs, other.attrs);
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var obj = {
        type: this.type.name
      };

      for (var _ in this.attrs) {
        obj.attrs = this.attrs;
        break;
      }

      return obj;
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(schema, json) {
      if (!json) throw new RangeError("Invalid input for Mark.fromJSON");
      var type = schema.marks[json.type];
      if (!type) throw new RangeError("There is no mark type ".concat(json.type, " in this schema"));
      return type.create(json.attrs);
    }
  }, {
    key: "sameSet",
    value: function sameSet(a, b) {
      if (a == b) return true;
      if (a.length != b.length) return false;

      for (var i = 0; i < a.length; i++) {
        if (!a[i].eq(b[i])) return false;
      }

      return true;
    }
  }, {
    key: "setFrom",
    value: function setFrom(marks) {
      if (!marks || Array.isArray(marks) && marks.length == 0) return Mark.none;
      if (marks instanceof Mark) return [marks];
      var copy = marks.slice();
      copy.sort(function (a, b) {
        return a.type.rank - b.type.rank;
      });
      return copy;
    }
  }]);

  return Mark;
}();

Mark.none = [];

var ReplaceError = function (_Error) {
  _inherits(ReplaceError, _Error);

  var _super = _createSuper(ReplaceError);

  function ReplaceError() {
    _classCallCheck(this, ReplaceError);

    return _super.apply(this, arguments);
  }

  return _createClass(ReplaceError);
}(_wrapNativeSuper(Error));

var Slice = function () {
  function Slice(content, openStart, openEnd) {
    _classCallCheck(this, Slice);

    this.content = content;
    this.openStart = openStart;
    this.openEnd = openEnd;
  }

  _createClass(Slice, [{
    key: "size",
    get: function get() {
      return this.content.size - this.openStart - this.openEnd;
    }
  }, {
    key: "insertAt",
    value: function insertAt(pos, fragment) {
      var content = insertInto(this.content, pos + this.openStart, fragment);
      return content && new Slice(content, this.openStart, this.openEnd);
    }
  }, {
    key: "removeBetween",
    value: function removeBetween(from, to) {
      return new Slice(removeRange(this.content, from + this.openStart, to + this.openStart), this.openStart, this.openEnd);
    }
  }, {
    key: "eq",
    value: function eq(other) {
      return this.content.eq(other.content) && this.openStart == other.openStart && this.openEnd == other.openEnd;
    }
  }, {
    key: "toString",
    value: function toString() {
      return this.content + "(" + this.openStart + "," + this.openEnd + ")";
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      if (!this.content.size) return null;
      var json = {
        content: this.content.toJSON()
      };
      if (this.openStart > 0) json.openStart = this.openStart;
      if (this.openEnd > 0) json.openEnd = this.openEnd;
      return json;
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(schema, json) {
      if (!json) return Slice.empty;
      var openStart = json.openStart || 0,
          openEnd = json.openEnd || 0;
      if (typeof openStart != "number" || typeof openEnd != "number") throw new RangeError("Invalid input for Slice.fromJSON");
      return new Slice(Fragment.fromJSON(schema, json.content), openStart, openEnd);
    }
  }, {
    key: "maxOpen",
    value: function maxOpen(fragment) {
      var openIsolating = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var openStart = 0,
          openEnd = 0;

      for (var n = fragment.firstChild; n && !n.isLeaf && (openIsolating || !n.type.spec.isolating); n = n.firstChild) {
        openStart++;
      }

      for (var _n = fragment.lastChild; _n && !_n.isLeaf && (openIsolating || !_n.type.spec.isolating); _n = _n.lastChild) {
        openEnd++;
      }

      return new Slice(fragment, openStart, openEnd);
    }
  }]);

  return Slice;
}();

Slice.empty = new Slice(Fragment.empty, 0, 0);

function removeRange(content, from, to) {
  var _content$findIndex = content.findIndex(from),
      index = _content$findIndex.index,
      offset = _content$findIndex.offset,
      child = content.maybeChild(index);

  var _content$findIndex2 = content.findIndex(to),
      indexTo = _content$findIndex2.index,
      offsetTo = _content$findIndex2.offset;

  if (offset == from || child.isText) {
    if (offsetTo != to && !content.child(indexTo).isText) throw new RangeError("Removing non-flat range");
    return content.cut(0, from).append(content.cut(to));
  }

  if (index != indexTo) throw new RangeError("Removing non-flat range");
  return content.replaceChild(index, child.copy(removeRange(child.content, from - offset - 1, to - offset - 1)));
}

function insertInto(content, dist, insert, parent) {
  var _content$findIndex3 = content.findIndex(dist),
      index = _content$findIndex3.index,
      offset = _content$findIndex3.offset,
      child = content.maybeChild(index);

  if (offset == dist || child.isText) {
    if (parent && !parent.canReplace(index, index, insert)) return null;
    return content.cut(0, dist).append(insert).append(content.cut(dist));
  }

  var inner = insertInto(child.content, dist - offset - 1, insert);
  return inner && content.replaceChild(index, child.copy(inner));
}

function _replace($from, $to, slice) {
  if (slice.openStart > $from.depth) throw new ReplaceError("Inserted content deeper than insertion position");
  if ($from.depth - slice.openStart != $to.depth - slice.openEnd) throw new ReplaceError("Inconsistent open depths");
  return replaceOuter($from, $to, slice, 0);
}

function replaceOuter($from, $to, slice, depth) {
  var index = $from.index(depth),
      node = $from.node(depth);

  if (index == $to.index(depth) && depth < $from.depth - slice.openStart) {
    var inner = replaceOuter($from, $to, slice, depth + 1);
    return node.copy(node.content.replaceChild(index, inner));
  } else if (!slice.content.size) {
    return close(node, replaceTwoWay($from, $to, depth));
  } else if (!slice.openStart && !slice.openEnd && $from.depth == depth && $to.depth == depth) {
    var parent = $from.parent,
        content = parent.content;
    return close(parent, content.cut(0, $from.parentOffset).append(slice.content).append(content.cut($to.parentOffset)));
  } else {
    var _prepareSliceForRepla = prepareSliceForReplace(slice, $from),
        start = _prepareSliceForRepla.start,
        end = _prepareSliceForRepla.end;

    return close(node, replaceThreeWay($from, start, end, $to, depth));
  }
}

function checkJoin(main, sub) {
  if (!sub.type.compatibleContent(main.type)) throw new ReplaceError("Cannot join " + sub.type.name + " onto " + main.type.name);
}

function joinable($before, $after, depth) {
  var node = $before.node(depth);
  checkJoin(node, $after.node(depth));
  return node;
}

function addNode(child, target) {
  var last = target.length - 1;
  if (last >= 0 && child.isText && child.sameMarkup(target[last])) target[last] = child.withText(target[last].text + child.text);else target.push(child);
}

function addRange($start, $end, depth, target) {
  var node = ($end || $start).node(depth);
  var startIndex = 0,
      endIndex = $end ? $end.index(depth) : node.childCount;

  if ($start) {
    startIndex = $start.index(depth);

    if ($start.depth > depth) {
      startIndex++;
    } else if ($start.textOffset) {
      addNode($start.nodeAfter, target);
      startIndex++;
    }
  }

  for (var i = startIndex; i < endIndex; i++) {
    addNode(node.child(i), target);
  }

  if ($end && $end.depth == depth && $end.textOffset) addNode($end.nodeBefore, target);
}

function close(node, content) {
  if (!node.type.validContent(content)) throw new ReplaceError("Invalid content for node " + node.type.name);
  return node.copy(content);
}

function replaceThreeWay($from, $start, $end, $to, depth) {
  var openStart = $from.depth > depth && joinable($from, $start, depth + 1);
  var openEnd = $to.depth > depth && joinable($end, $to, depth + 1);
  var content = [];
  addRange(null, $from, depth, content);

  if (openStart && openEnd && $start.index(depth) == $end.index(depth)) {
    checkJoin(openStart, openEnd);
    addNode(close(openStart, replaceThreeWay($from, $start, $end, $to, depth + 1)), content);
  } else {
    if (openStart) addNode(close(openStart, replaceTwoWay($from, $start, depth + 1)), content);
    addRange($start, $end, depth, content);
    if (openEnd) addNode(close(openEnd, replaceTwoWay($end, $to, depth + 1)), content);
  }

  addRange($to, null, depth, content);
  return new Fragment(content);
}

function replaceTwoWay($from, $to, depth) {
  var content = [];
  addRange(null, $from, depth, content);

  if ($from.depth > depth) {
    var type = joinable($from, $to, depth + 1);
    addNode(close(type, replaceTwoWay($from, $to, depth + 1)), content);
  }

  addRange($to, null, depth, content);
  return new Fragment(content);
}

function prepareSliceForReplace(slice, $along) {
  var extra = $along.depth - slice.openStart,
      parent = $along.node(extra);
  var node = parent.copy(slice.content);

  for (var i = extra - 1; i >= 0; i--) {
    node = $along.node(i).copy(Fragment.from(node));
  }

  return {
    start: node.resolveNoCache(slice.openStart + extra),
    end: node.resolveNoCache(node.content.size - slice.openEnd - extra)
  };
}

var ResolvedPos = function () {
  function ResolvedPos(pos, path, parentOffset) {
    _classCallCheck(this, ResolvedPos);

    this.pos = pos;
    this.path = path;
    this.parentOffset = parentOffset;
    this.depth = path.length / 3 - 1;
  }

  _createClass(ResolvedPos, [{
    key: "resolveDepth",
    value: function resolveDepth(val) {
      if (val == null) return this.depth;
      if (val < 0) return this.depth + val;
      return val;
    }
  }, {
    key: "parent",
    get: function get() {
      return this.node(this.depth);
    }
  }, {
    key: "doc",
    get: function get() {
      return this.node(0);
    }
  }, {
    key: "node",
    value: function node(depth) {
      return this.path[this.resolveDepth(depth) * 3];
    }
  }, {
    key: "index",
    value: function index(depth) {
      return this.path[this.resolveDepth(depth) * 3 + 1];
    }
  }, {
    key: "indexAfter",
    value: function indexAfter(depth) {
      depth = this.resolveDepth(depth);
      return this.index(depth) + (depth == this.depth && !this.textOffset ? 0 : 1);
    }
  }, {
    key: "start",
    value: function start(depth) {
      depth = this.resolveDepth(depth);
      return depth == 0 ? 0 : this.path[depth * 3 - 1] + 1;
    }
  }, {
    key: "end",
    value: function end(depth) {
      depth = this.resolveDepth(depth);
      return this.start(depth) + this.node(depth).content.size;
    }
  }, {
    key: "before",
    value: function before(depth) {
      depth = this.resolveDepth(depth);
      if (!depth) throw new RangeError("There is no position before the top-level node");
      return depth == this.depth + 1 ? this.pos : this.path[depth * 3 - 1];
    }
  }, {
    key: "after",
    value: function after(depth) {
      depth = this.resolveDepth(depth);
      if (!depth) throw new RangeError("There is no position after the top-level node");
      return depth == this.depth + 1 ? this.pos : this.path[depth * 3 - 1] + this.path[depth * 3].nodeSize;
    }
  }, {
    key: "textOffset",
    get: function get() {
      return this.pos - this.path[this.path.length - 1];
    }
  }, {
    key: "nodeAfter",
    get: function get() {
      var parent = this.parent,
          index = this.index(this.depth);
      if (index == parent.childCount) return null;
      var dOff = this.pos - this.path[this.path.length - 1],
          child = parent.child(index);
      return dOff ? parent.child(index).cut(dOff) : child;
    }
  }, {
    key: "nodeBefore",
    get: function get() {
      var index = this.index(this.depth);
      var dOff = this.pos - this.path[this.path.length - 1];
      if (dOff) return this.parent.child(index).cut(0, dOff);
      return index == 0 ? null : this.parent.child(index - 1);
    }
  }, {
    key: "posAtIndex",
    value: function posAtIndex(index, depth) {
      depth = this.resolveDepth(depth);
      var node = this.path[depth * 3],
          pos = depth == 0 ? 0 : this.path[depth * 3 - 1] + 1;

      for (var i = 0; i < index; i++) {
        pos += node.child(i).nodeSize;
      }

      return pos;
    }
  }, {
    key: "marks",
    value: function marks() {
      var parent = this.parent,
          index = this.index();
      if (parent.content.size == 0) return Mark.none;
      if (this.textOffset) return parent.child(index).marks;
      var main = parent.maybeChild(index - 1),
          other = parent.maybeChild(index);

      if (!main) {
        var tmp = main;
        main = other;
        other = tmp;
      }

      var marks = main.marks;

      for (var i = 0; i < marks.length; i++) {
        if (marks[i].type.spec.inclusive === false && (!other || !marks[i].isInSet(other.marks))) marks = marks[i--].removeFromSet(marks);
      }

      return marks;
    }
  }, {
    key: "marksAcross",
    value: function marksAcross($end) {
      var after = this.parent.maybeChild(this.index());
      if (!after || !after.isInline) return null;
      var marks = after.marks,
          next = $end.parent.maybeChild($end.index());

      for (var i = 0; i < marks.length; i++) {
        if (marks[i].type.spec.inclusive === false && (!next || !marks[i].isInSet(next.marks))) marks = marks[i--].removeFromSet(marks);
      }

      return marks;
    }
  }, {
    key: "sharedDepth",
    value: function sharedDepth(pos) {
      for (var depth = this.depth; depth > 0; depth--) {
        if (this.start(depth) <= pos && this.end(depth) >= pos) return depth;
      }

      return 0;
    }
  }, {
    key: "blockRange",
    value: function blockRange() {
      var other = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this;
      var pred = arguments.length > 1 ? arguments[1] : undefined;
      if (other.pos < this.pos) return other.blockRange(this);

      for (var d = this.depth - (this.parent.inlineContent || this.pos == other.pos ? 1 : 0); d >= 0; d--) {
        if (other.pos <= this.end(d) && (!pred || pred(this.node(d)))) return new NodeRange(this, other, d);
      }

      return null;
    }
  }, {
    key: "sameParent",
    value: function sameParent(other) {
      return this.pos - this.parentOffset == other.pos - other.parentOffset;
    }
  }, {
    key: "max",
    value: function max(other) {
      return other.pos > this.pos ? other : this;
    }
  }, {
    key: "min",
    value: function min(other) {
      return other.pos < this.pos ? other : this;
    }
  }, {
    key: "toString",
    value: function toString() {
      var str = "";

      for (var i = 1; i <= this.depth; i++) {
        str += (str ? "/" : "") + this.node(i).type.name + "_" + this.index(i - 1);
      }

      return str + ":" + this.parentOffset;
    }
  }], [{
    key: "resolve",
    value: function resolve(doc, pos) {
      if (!(pos >= 0 && pos <= doc.content.size)) throw new RangeError("Position " + pos + " out of range");
      var path = [];
      var start = 0,
          parentOffset = pos;

      for (var node = doc;;) {
        var _node$content$findInd = node.content.findIndex(parentOffset),
            index = _node$content$findInd.index,
            offset = _node$content$findInd.offset;

        var rem = parentOffset - offset;
        path.push(node, index, start + offset);
        if (!rem) break;
        node = node.child(index);
        if (node.isText) break;
        parentOffset = rem - 1;
        start += offset + 1;
      }

      return new ResolvedPos(pos, path, parentOffset);
    }
  }, {
    key: "resolveCached",
    value: function resolveCached(doc, pos) {
      for (var i = 0; i < resolveCache.length; i++) {
        var cached = resolveCache[i];
        if (cached.pos == pos && cached.doc == doc) return cached;
      }

      var result = resolveCache[resolveCachePos] = ResolvedPos.resolve(doc, pos);
      resolveCachePos = (resolveCachePos + 1) % resolveCacheSize;
      return result;
    }
  }]);

  return ResolvedPos;
}();

var resolveCache = [],
    resolveCachePos = 0,
    resolveCacheSize = 12;

var NodeRange = function () {
  function NodeRange($from, $to, depth) {
    _classCallCheck(this, NodeRange);

    this.$from = $from;
    this.$to = $to;
    this.depth = depth;
  }

  _createClass(NodeRange, [{
    key: "start",
    get: function get() {
      return this.$from.before(this.depth + 1);
    }
  }, {
    key: "end",
    get: function get() {
      return this.$to.after(this.depth + 1);
    }
  }, {
    key: "parent",
    get: function get() {
      return this.$from.node(this.depth);
    }
  }, {
    key: "startIndex",
    get: function get() {
      return this.$from.index(this.depth);
    }
  }, {
    key: "endIndex",
    get: function get() {
      return this.$to.indexAfter(this.depth);
    }
  }]);

  return NodeRange;
}();

var emptyAttrs = Object.create(null);

var Node = function () {
  function Node(type, attrs, content) {
    var marks = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : Mark.none;

    _classCallCheck(this, Node);

    this.type = type;
    this.attrs = attrs;
    this.marks = marks;
    this.content = content || Fragment.empty;
  }

  _createClass(Node, [{
    key: "nodeSize",
    get: function get() {
      return this.isLeaf ? 1 : 2 + this.content.size;
    }
  }, {
    key: "childCount",
    get: function get() {
      return this.content.childCount;
    }
  }, {
    key: "child",
    value: function child(index) {
      return this.content.child(index);
    }
  }, {
    key: "maybeChild",
    value: function maybeChild(index) {
      return this.content.maybeChild(index);
    }
  }, {
    key: "forEach",
    value: function forEach(f) {
      this.content.forEach(f);
    }
  }, {
    key: "nodesBetween",
    value: function nodesBetween(from, to, f) {
      var startPos = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      this.content.nodesBetween(from, to, f, startPos, this);
    }
  }, {
    key: "descendants",
    value: function descendants(f) {
      this.nodesBetween(0, this.content.size, f);
    }
  }, {
    key: "textContent",
    get: function get() {
      return this.isLeaf && this.type.spec.leafText ? this.type.spec.leafText(this) : this.textBetween(0, this.content.size, "");
    }
  }, {
    key: "textBetween",
    value: function textBetween(from, to, blockSeparator, leafText) {
      return this.content.textBetween(from, to, blockSeparator, leafText);
    }
  }, {
    key: "firstChild",
    get: function get() {
      return this.content.firstChild;
    }
  }, {
    key: "lastChild",
    get: function get() {
      return this.content.lastChild;
    }
  }, {
    key: "eq",
    value: function eq(other) {
      return this == other || this.sameMarkup(other) && this.content.eq(other.content);
    }
  }, {
    key: "sameMarkup",
    value: function sameMarkup(other) {
      return this.hasMarkup(other.type, other.attrs, other.marks);
    }
  }, {
    key: "hasMarkup",
    value: function hasMarkup(type, attrs, marks) {
      return this.type == type && compareDeep(this.attrs, attrs || type.defaultAttrs || emptyAttrs) && Mark.sameSet(this.marks, marks || Mark.none);
    }
  }, {
    key: "copy",
    value: function copy() {
      var content = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      if (content == this.content) return this;
      return new Node(this.type, this.attrs, content, this.marks);
    }
  }, {
    key: "mark",
    value: function mark(marks) {
      return marks == this.marks ? this : new Node(this.type, this.attrs, this.content, marks);
    }
  }, {
    key: "cut",
    value: function cut(from) {
      var to = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.content.size;
      if (from == 0 && to == this.content.size) return this;
      return this.copy(this.content.cut(from, to));
    }
  }, {
    key: "slice",
    value: function slice(from) {
      var to = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.content.size;
      var includeParents = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      if (from == to) return Slice.empty;
      var $from = this.resolve(from),
          $to = this.resolve(to);
      var depth = includeParents ? 0 : $from.sharedDepth(to);
      var start = $from.start(depth),
          node = $from.node(depth);
      var content = node.content.cut($from.pos - start, $to.pos - start);
      return new Slice(content, $from.depth - depth, $to.depth - depth);
    }
  }, {
    key: "replace",
    value: function replace(from, to, slice) {
      return _replace(this.resolve(from), this.resolve(to), slice);
    }
  }, {
    key: "nodeAt",
    value: function nodeAt(pos) {
      for (var node = this;;) {
        var _node$content$findInd2 = node.content.findIndex(pos),
            index = _node$content$findInd2.index,
            offset = _node$content$findInd2.offset;

        node = node.maybeChild(index);
        if (!node) return null;
        if (offset == pos || node.isText) return node;
        pos -= offset + 1;
      }
    }
  }, {
    key: "childAfter",
    value: function childAfter(pos) {
      var _this$content$findInd = this.content.findIndex(pos),
          index = _this$content$findInd.index,
          offset = _this$content$findInd.offset;

      return {
        node: this.content.maybeChild(index),
        index: index,
        offset: offset
      };
    }
  }, {
    key: "childBefore",
    value: function childBefore(pos) {
      if (pos == 0) return {
        node: null,
        index: 0,
        offset: 0
      };

      var _this$content$findInd2 = this.content.findIndex(pos),
          index = _this$content$findInd2.index,
          offset = _this$content$findInd2.offset;

      if (offset < pos) return {
        node: this.content.child(index),
        index: index,
        offset: offset
      };
      var node = this.content.child(index - 1);
      return {
        node: node,
        index: index - 1,
        offset: offset - node.nodeSize
      };
    }
  }, {
    key: "resolve",
    value: function resolve(pos) {
      return ResolvedPos.resolveCached(this, pos);
    }
  }, {
    key: "resolveNoCache",
    value: function resolveNoCache(pos) {
      return ResolvedPos.resolve(this, pos);
    }
  }, {
    key: "rangeHasMark",
    value: function rangeHasMark(from, to, type) {
      var found = false;
      if (to > from) this.nodesBetween(from, to, function (node) {
        if (type.isInSet(node.marks)) found = true;
        return !found;
      });
      return found;
    }
  }, {
    key: "isBlock",
    get: function get() {
      return this.type.isBlock;
    }
  }, {
    key: "isTextblock",
    get: function get() {
      return this.type.isTextblock;
    }
  }, {
    key: "inlineContent",
    get: function get() {
      return this.type.inlineContent;
    }
  }, {
    key: "isInline",
    get: function get() {
      return this.type.isInline;
    }
  }, {
    key: "isText",
    get: function get() {
      return this.type.isText;
    }
  }, {
    key: "isLeaf",
    get: function get() {
      return this.type.isLeaf;
    }
  }, {
    key: "isAtom",
    get: function get() {
      return this.type.isAtom;
    }
  }, {
    key: "toString",
    value: function toString() {
      if (this.type.spec.toDebugString) return this.type.spec.toDebugString(this);
      var name = this.type.name;
      if (this.content.size) name += "(" + this.content.toStringInner() + ")";
      return wrapMarks(this.marks, name);
    }
  }, {
    key: "contentMatchAt",
    value: function contentMatchAt(index) {
      var match = this.type.contentMatch.matchFragment(this.content, 0, index);
      if (!match) throw new Error("Called contentMatchAt on a node with invalid content");
      return match;
    }
  }, {
    key: "canReplace",
    value: function canReplace(from, to) {
      var replacement = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Fragment.empty;
      var start = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var end = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : replacement.childCount;
      var one = this.contentMatchAt(from).matchFragment(replacement, start, end);
      var two = one && one.matchFragment(this.content, to);
      if (!two || !two.validEnd) return false;

      for (var i = start; i < end; i++) {
        if (!this.type.allowsMarks(replacement.child(i).marks)) return false;
      }

      return true;
    }
  }, {
    key: "canReplaceWith",
    value: function canReplaceWith(from, to, type, marks) {
      if (marks && !this.type.allowsMarks(marks)) return false;
      var start = this.contentMatchAt(from).matchType(type);
      var end = start && start.matchFragment(this.content, to);
      return end ? end.validEnd : false;
    }
  }, {
    key: "canAppend",
    value: function canAppend(other) {
      if (other.content.size) return this.canReplace(this.childCount, this.childCount, other.content);else return this.type.compatibleContent(other.type);
    }
  }, {
    key: "check",
    value: function check() {
      if (!this.type.validContent(this.content)) throw new RangeError("Invalid content for node ".concat(this.type.name, ": ").concat(this.content.toString().slice(0, 50)));
      var copy = Mark.none;

      for (var i = 0; i < this.marks.length; i++) {
        copy = this.marks[i].addToSet(copy);
      }

      if (!Mark.sameSet(copy, this.marks)) throw new RangeError("Invalid collection of marks for node ".concat(this.type.name, ": ").concat(this.marks.map(function (m) {
        return m.type.name;
      })));
      this.content.forEach(function (node) {
        return node.check();
      });
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var obj = {
        type: this.type.name
      };

      for (var _ in this.attrs) {
        obj.attrs = this.attrs;
        break;
      }

      if (this.content.size) obj.content = this.content.toJSON();
      if (this.marks.length) obj.marks = this.marks.map(function (n) {
        return n.toJSON();
      });
      return obj;
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(schema, json) {
      if (!json) throw new RangeError("Invalid input for Node.fromJSON");
      var marks = null;

      if (json.marks) {
        if (!Array.isArray(json.marks)) throw new RangeError("Invalid mark data for Node.fromJSON");
        marks = json.marks.map(schema.markFromJSON);
      }

      if (json.type == "text") {
        if (typeof json.text != "string") throw new RangeError("Invalid text node in JSON");
        return schema.text(json.text, marks);
      }

      var content = Fragment.fromJSON(schema, json.content);
      return schema.nodeType(json.type).create(json.attrs, content, marks);
    }
  }]);

  return Node;
}();

Node.prototype.text = undefined;

var TextNode = function (_Node) {
  _inherits(TextNode, _Node);

  var _super2 = _createSuper(TextNode);

  function TextNode(type, attrs, content, marks) {
    var _this;

    _classCallCheck(this, TextNode);

    _this = _super2.call(this, type, attrs, null, marks);
    if (!content) throw new RangeError("Empty text nodes are not allowed");
    _this.text = content;
    return _this;
  }

  _createClass(TextNode, [{
    key: "toString",
    value: function toString() {
      if (this.type.spec.toDebugString) return this.type.spec.toDebugString(this);
      return wrapMarks(this.marks, JSON.stringify(this.text));
    }
  }, {
    key: "textContent",
    get: function get() {
      return this.text;
    }
  }, {
    key: "textBetween",
    value: function textBetween(from, to) {
      return this.text.slice(from, to);
    }
  }, {
    key: "nodeSize",
    get: function get() {
      return this.text.length;
    }
  }, {
    key: "mark",
    value: function mark(marks) {
      return marks == this.marks ? this : new TextNode(this.type, this.attrs, this.text, marks);
    }
  }, {
    key: "withText",
    value: function withText(text) {
      if (text == this.text) return this;
      return new TextNode(this.type, this.attrs, text, this.marks);
    }
  }, {
    key: "cut",
    value: function cut() {
      var from = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var to = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.text.length;
      if (from == 0 && to == this.text.length) return this;
      return this.withText(this.text.slice(from, to));
    }
  }, {
    key: "eq",
    value: function eq(other) {
      return this.sameMarkup(other) && this.text == other.text;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var base = _get(_getPrototypeOf(TextNode.prototype), "toJSON", this).call(this);

      base.text = this.text;
      return base;
    }
  }]);

  return TextNode;
}(Node);

function wrapMarks(marks, str) {
  for (var i = marks.length - 1; i >= 0; i--) {
    str = marks[i].type.name + "(" + str + ")";
  }

  return str;
}

var ContentMatch = function () {
  function ContentMatch(validEnd) {
    _classCallCheck(this, ContentMatch);

    this.validEnd = validEnd;
    this.next = [];
    this.wrapCache = [];
  }

  _createClass(ContentMatch, [{
    key: "matchType",
    value: function matchType(type) {
      for (var i = 0; i < this.next.length; i++) {
        if (this.next[i].type == type) return this.next[i].next;
      }

      return null;
    }
  }, {
    key: "matchFragment",
    value: function matchFragment(frag) {
      var start = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var end = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : frag.childCount;
      var cur = this;

      for (var i = start; cur && i < end; i++) {
        cur = cur.matchType(frag.child(i).type);
      }

      return cur;
    }
  }, {
    key: "inlineContent",
    get: function get() {
      return this.next.length && this.next[0].type.isInline;
    }
  }, {
    key: "defaultType",
    get: function get() {
      for (var i = 0; i < this.next.length; i++) {
        var type = this.next[i].type;
        if (!(type.isText || type.hasRequiredAttrs())) return type;
      }

      return null;
    }
  }, {
    key: "compatible",
    value: function compatible(other) {
      for (var i = 0; i < this.next.length; i++) {
        for (var j = 0; j < other.next.length; j++) {
          if (this.next[i].type == other.next[j].type) return true;
        }
      }

      return false;
    }
  }, {
    key: "fillBefore",
    value: function fillBefore(after) {
      var toEnd = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var startIndex = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var seen = [this];

      function search(match, types) {
        var finished = match.matchFragment(after, startIndex);
        if (finished && (!toEnd || finished.validEnd)) return Fragment.from(types.map(function (tp) {
          return tp.createAndFill();
        }));

        for (var i = 0; i < match.next.length; i++) {
          var _match$next$i = match.next[i],
              type = _match$next$i.type,
              next = _match$next$i.next;

          if (!(type.isText || type.hasRequiredAttrs()) && seen.indexOf(next) == -1) {
            seen.push(next);

            var _found = search(next, types.concat(type));

            if (_found) return _found;
          }
        }

        return null;
      }

      return search(this, []);
    }
  }, {
    key: "findWrapping",
    value: function findWrapping(target) {
      for (var i = 0; i < this.wrapCache.length; i += 2) {
        if (this.wrapCache[i] == target) return this.wrapCache[i + 1];
      }

      var computed = this.computeWrapping(target);
      this.wrapCache.push(target, computed);
      return computed;
    }
  }, {
    key: "computeWrapping",
    value: function computeWrapping(target) {
      var seen = Object.create(null),
          active = [{
        match: this,
        type: null,
        via: null
      }];

      while (active.length) {
        var current = active.shift(),
            match = current.match;

        if (match.matchType(target)) {
          var result = [];

          for (var obj = current; obj.type; obj = obj.via) {
            result.push(obj.type);
          }

          return result.reverse();
        }

        for (var i = 0; i < match.next.length; i++) {
          var _match$next$i2 = match.next[i],
              type = _match$next$i2.type,
              next = _match$next$i2.next;

          if (!type.isLeaf && !type.hasRequiredAttrs() && !(type.name in seen) && (!current.type || next.validEnd)) {
            active.push({
              match: type.contentMatch,
              type: type,
              via: current
            });
            seen[type.name] = true;
          }
        }
      }

      return null;
    }
  }, {
    key: "edgeCount",
    get: function get() {
      return this.next.length;
    }
  }, {
    key: "edge",
    value: function edge(n) {
      if (n >= this.next.length) throw new RangeError("There's no ".concat(n, "th edge in this content match"));
      return this.next[n];
    }
  }, {
    key: "toString",
    value: function toString() {
      var seen = [];

      function scan(m) {
        seen.push(m);

        for (var i = 0; i < m.next.length; i++) {
          if (seen.indexOf(m.next[i].next) == -1) scan(m.next[i].next);
        }
      }

      scan(this);
      return seen.map(function (m, i) {
        var out = i + (m.validEnd ? "*" : " ") + " ";

        for (var _i = 0; _i < m.next.length; _i++) {
          out += (_i ? ", " : "") + m.next[_i].type.name + "->" + seen.indexOf(m.next[_i].next);
        }

        return out;
      }).join("\n");
    }
  }], [{
    key: "parse",
    value: function parse(string, nodeTypes) {
      var stream = new TokenStream(string, nodeTypes);
      if (stream.next == null) return ContentMatch.empty;
      var expr = parseExpr(stream);
      if (stream.next) stream.err("Unexpected trailing text");
      var match = dfa(nfa(expr));
      checkForDeadEnds(match, stream);
      return match;
    }
  }]);

  return ContentMatch;
}();

ContentMatch.empty = new ContentMatch(true);

var TokenStream = function () {
  function TokenStream(string, nodeTypes) {
    _classCallCheck(this, TokenStream);

    this.string = string;
    this.nodeTypes = nodeTypes;
    this.inline = null;
    this.pos = 0;
    this.tokens = string.split(/\s*(?=\b|\W|$)/);
    if (this.tokens[this.tokens.length - 1] == "") this.tokens.pop();
    if (this.tokens[0] == "") this.tokens.shift();
  }

  _createClass(TokenStream, [{
    key: "next",
    get: function get() {
      return this.tokens[this.pos];
    }
  }, {
    key: "eat",
    value: function eat(tok) {
      return this.next == tok && (this.pos++ || true);
    }
  }, {
    key: "err",
    value: function err(str) {
      throw new SyntaxError(str + " (in content expression '" + this.string + "')");
    }
  }]);

  return TokenStream;
}();

function parseExpr(stream) {
  var exprs = [];

  do {
    exprs.push(parseExprSeq(stream));
  } while (stream.eat("|"));

  return exprs.length == 1 ? exprs[0] : {
    type: "choice",
    exprs: exprs
  };
}

function parseExprSeq(stream) {
  var exprs = [];

  do {
    exprs.push(parseExprSubscript(stream));
  } while (stream.next && stream.next != ")" && stream.next != "|");

  return exprs.length == 1 ? exprs[0] : {
    type: "seq",
    exprs: exprs
  };
}

function parseExprSubscript(stream) {
  var expr = parseExprAtom(stream);

  for (;;) {
    if (stream.eat("+")) expr = {
      type: "plus",
      expr: expr
    };else if (stream.eat("*")) expr = {
      type: "star",
      expr: expr
    };else if (stream.eat("?")) expr = {
      type: "opt",
      expr: expr
    };else if (stream.eat("{")) expr = parseExprRange(stream, expr);else break;
  }

  return expr;
}

function parseNum(stream) {
  if (/\D/.test(stream.next)) stream.err("Expected number, got '" + stream.next + "'");
  var result = Number(stream.next);
  stream.pos++;
  return result;
}

function parseExprRange(stream, expr) {
  var min = parseNum(stream),
      max = min;

  if (stream.eat(",")) {
    if (stream.next != "}") max = parseNum(stream);else max = -1;
  }

  if (!stream.eat("}")) stream.err("Unclosed braced range");
  return {
    type: "range",
    min: min,
    max: max,
    expr: expr
  };
}

function resolveName(stream, name) {
  var types = stream.nodeTypes,
      type = types[name];
  if (type) return [type];
  var result = [];

  for (var typeName in types) {
    var _type = types[typeName];
    if (_type.groups.indexOf(name) > -1) result.push(_type);
  }

  if (result.length == 0) stream.err("No node type or group '" + name + "' found");
  return result;
}

function parseExprAtom(stream) {
  if (stream.eat("(")) {
    var expr = parseExpr(stream);
    if (!stream.eat(")")) stream.err("Missing closing paren");
    return expr;
  } else if (!/\W/.test(stream.next)) {
    var exprs = resolveName(stream, stream.next).map(function (type) {
      if (stream.inline == null) stream.inline = type.isInline;else if (stream.inline != type.isInline) stream.err("Mixing inline and block content");
      return {
        type: "name",
        value: type
      };
    });
    stream.pos++;
    return exprs.length == 1 ? exprs[0] : {
      type: "choice",
      exprs: exprs
    };
  } else {
    stream.err("Unexpected token '" + stream.next + "'");
  }
}

function nfa(expr) {
  var nfa = [[]];
  connect(compile(expr, 0), node());
  return nfa;

  function node() {
    return nfa.push([]) - 1;
  }

  function edge(from, to, term) {
    var edge = {
      term: term,
      to: to
    };
    nfa[from].push(edge);
    return edge;
  }

  function connect(edges, to) {
    edges.forEach(function (edge) {
      return edge.to = to;
    });
  }

  function compile(expr, from) {
    if (expr.type == "choice") {
      return expr.exprs.reduce(function (out, expr) {
        return out.concat(compile(expr, from));
      }, []);
    } else if (expr.type == "seq") {
      for (var i = 0;; i++) {
        var next = compile(expr.exprs[i], from);
        if (i == expr.exprs.length - 1) return next;
        connect(next, from = node());
      }
    } else if (expr.type == "star") {
      var loop = node();
      edge(from, loop);
      connect(compile(expr.expr, loop), loop);
      return [edge(loop)];
    } else if (expr.type == "plus") {
      var _loop = node();

      connect(compile(expr.expr, from), _loop);
      connect(compile(expr.expr, _loop), _loop);
      return [edge(_loop)];
    } else if (expr.type == "opt") {
      return [edge(from)].concat(compile(expr.expr, from));
    } else if (expr.type == "range") {
      var cur = from;

      for (var _i2 = 0; _i2 < expr.min; _i2++) {
        var _next = node();

        connect(compile(expr.expr, cur), _next);
        cur = _next;
      }

      if (expr.max == -1) {
        connect(compile(expr.expr, cur), cur);
      } else {
        for (var _i3 = expr.min; _i3 < expr.max; _i3++) {
          var _next2 = node();

          edge(cur, _next2);
          connect(compile(expr.expr, cur), _next2);
          cur = _next2;
        }
      }

      return [edge(cur)];
    } else if (expr.type == "name") {
      return [edge(from, undefined, expr.value)];
    } else {
      throw new Error("Unknown expr type");
    }
  }
}

function cmp(a, b) {
  return b - a;
}

function nullFrom(nfa, node) {
  var result = [];
  scan(node);
  return result.sort(cmp);

  function scan(node) {
    var edges = nfa[node];
    if (edges.length == 1 && !edges[0].term) return scan(edges[0].to);
    result.push(node);

    for (var i = 0; i < edges.length; i++) {
      var _edges$i = edges[i],
          term = _edges$i.term,
          to = _edges$i.to;
      if (!term && result.indexOf(to) == -1) scan(to);
    }
  }
}

function dfa(nfa) {
  var labeled = Object.create(null);
  return explore(nullFrom(nfa, 0));

  function explore(states) {
    var out = [];
    states.forEach(function (node) {
      nfa[node].forEach(function (_ref) {
        var term = _ref.term,
            to = _ref.to;
        if (!term) return;
        var set;

        for (var i = 0; i < out.length; i++) {
          if (out[i][0] == term) set = out[i][1];
        }

        nullFrom(nfa, to).forEach(function (node) {
          if (!set) out.push([term, set = []]);
          if (set.indexOf(node) == -1) set.push(node);
        });
      });
    });
    var state = labeled[states.join(",")] = new ContentMatch(states.indexOf(nfa.length - 1) > -1);

    for (var i = 0; i < out.length; i++) {
      var _states = out[i][1].sort(cmp);

      state.next.push({
        type: out[i][0],
        next: labeled[_states.join(",")] || explore(_states)
      });
    }

    return state;
  }
}

function checkForDeadEnds(match, stream) {
  for (var i = 0, work = [match]; i < work.length; i++) {
    var state = work[i],
        dead = !state.validEnd,
        nodes = [];

    for (var j = 0; j < state.next.length; j++) {
      var _state$next$j = state.next[j],
          type = _state$next$j.type,
          next = _state$next$j.next;
      nodes.push(type.name);
      if (dead && !(type.isText || type.hasRequiredAttrs())) dead = false;
      if (work.indexOf(next) == -1) work.push(next);
    }

    if (dead) stream.err("Only non-generatable nodes (" + nodes.join(", ") + ") in a required position (see https://prosemirror.net/docs/guide/#generatable)");
  }
}

function defaultAttrs(attrs) {
  var defaults = Object.create(null);

  for (var attrName in attrs) {
    var attr = attrs[attrName];
    if (!attr.hasDefault) return null;
    defaults[attrName] = attr["default"];
  }

  return defaults;
}

function _computeAttrs(attrs, value) {
  var built = Object.create(null);

  for (var name in attrs) {
    var given = value && value[name];

    if (given === undefined) {
      var attr = attrs[name];
      if (attr.hasDefault) given = attr["default"];else throw new RangeError("No value supplied for attribute " + name);
    }

    built[name] = given;
  }

  return built;
}

function initAttrs(attrs) {
  var result = Object.create(null);
  if (attrs) for (var name in attrs) {
    result[name] = new Attribute(attrs[name]);
  }
  return result;
}

var NodeType = function () {
  function NodeType(name, schema, spec) {
    _classCallCheck(this, NodeType);

    this.name = name;
    this.schema = schema;
    this.spec = spec;
    this.markSet = null;
    this.groups = spec.group ? spec.group.split(" ") : [];
    this.attrs = initAttrs(spec.attrs);
    this.defaultAttrs = defaultAttrs(this.attrs);
    this.contentMatch = null;
    this.inlineContent = null;
    this.isBlock = !(spec.inline || name == "text");
    this.isText = name == "text";
  }

  _createClass(NodeType, [{
    key: "isInline",
    get: function get() {
      return !this.isBlock;
    }
  }, {
    key: "isTextblock",
    get: function get() {
      return this.isBlock && this.inlineContent;
    }
  }, {
    key: "isLeaf",
    get: function get() {
      return this.contentMatch == ContentMatch.empty;
    }
  }, {
    key: "isAtom",
    get: function get() {
      return this.isLeaf || !!this.spec.atom;
    }
  }, {
    key: "whitespace",
    get: function get() {
      return this.spec.whitespace || (this.spec.code ? "pre" : "normal");
    }
  }, {
    key: "hasRequiredAttrs",
    value: function hasRequiredAttrs() {
      for (var n in this.attrs) {
        if (this.attrs[n].isRequired) return true;
      }

      return false;
    }
  }, {
    key: "compatibleContent",
    value: function compatibleContent(other) {
      return this == other || this.contentMatch.compatible(other.contentMatch);
    }
  }, {
    key: "computeAttrs",
    value: function computeAttrs(attrs) {
      if (!attrs && this.defaultAttrs) return this.defaultAttrs;else return _computeAttrs(this.attrs, attrs);
    }
  }, {
    key: "create",
    value: function create() {
      var attrs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var content = arguments.length > 1 ? arguments[1] : undefined;
      var marks = arguments.length > 2 ? arguments[2] : undefined;
      if (this.isText) throw new Error("NodeType.create can't construct text nodes");
      return new Node(this, this.computeAttrs(attrs), Fragment.from(content), Mark.setFrom(marks));
    }
  }, {
    key: "createChecked",
    value: function createChecked() {
      var attrs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var content = arguments.length > 1 ? arguments[1] : undefined;
      var marks = arguments.length > 2 ? arguments[2] : undefined;
      content = Fragment.from(content);
      if (!this.validContent(content)) throw new RangeError("Invalid content for node " + this.name);
      return new Node(this, this.computeAttrs(attrs), content, Mark.setFrom(marks));
    }
  }, {
    key: "createAndFill",
    value: function createAndFill() {
      var attrs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var content = arguments.length > 1 ? arguments[1] : undefined;
      var marks = arguments.length > 2 ? arguments[2] : undefined;
      attrs = this.computeAttrs(attrs);
      content = Fragment.from(content);

      if (content.size) {
        var before = this.contentMatch.fillBefore(content);
        if (!before) return null;
        content = before.append(content);
      }

      var matched = this.contentMatch.matchFragment(content);
      var after = matched && matched.fillBefore(Fragment.empty, true);
      if (!after) return null;
      return new Node(this, attrs, content.append(after), Mark.setFrom(marks));
    }
  }, {
    key: "validContent",
    value: function validContent(content) {
      var result = this.contentMatch.matchFragment(content);
      if (!result || !result.validEnd) return false;

      for (var i = 0; i < content.childCount; i++) {
        if (!this.allowsMarks(content.child(i).marks)) return false;
      }

      return true;
    }
  }, {
    key: "allowsMarkType",
    value: function allowsMarkType(markType) {
      return this.markSet == null || this.markSet.indexOf(markType) > -1;
    }
  }, {
    key: "allowsMarks",
    value: function allowsMarks(marks) {
      if (this.markSet == null) return true;

      for (var i = 0; i < marks.length; i++) {
        if (!this.allowsMarkType(marks[i].type)) return false;
      }

      return true;
    }
  }, {
    key: "allowedMarks",
    value: function allowedMarks(marks) {
      if (this.markSet == null) return marks;
      var copy;

      for (var i = 0; i < marks.length; i++) {
        if (!this.allowsMarkType(marks[i].type)) {
          if (!copy) copy = marks.slice(0, i);
        } else if (copy) {
          copy.push(marks[i]);
        }
      }

      return !copy ? marks : copy.length ? copy : Mark.none;
    }
  }], [{
    key: "compile",
    value: function compile(nodes, schema) {
      var result = Object.create(null);
      nodes.forEach(function (name, spec) {
        return result[name] = new NodeType(name, schema, spec);
      });
      var topType = schema.spec.topNode || "doc";
      if (!result[topType]) throw new RangeError("Schema is missing its top node type ('" + topType + "')");
      if (!result.text) throw new RangeError("Every schema needs a 'text' type");

      for (var _ in result.text.attrs) {
        throw new RangeError("The text node type should not have attributes");
      }

      return result;
    }
  }]);

  return NodeType;
}();

var Attribute = function () {
  function Attribute(options) {
    _classCallCheck(this, Attribute);

    this.hasDefault = Object.prototype.hasOwnProperty.call(options, "default");
    this["default"] = options["default"];
  }

  _createClass(Attribute, [{
    key: "isRequired",
    get: function get() {
      return !this.hasDefault;
    }
  }]);

  return Attribute;
}();

var MarkType = function () {
  function MarkType(name, rank, schema, spec) {
    _classCallCheck(this, MarkType);

    this.name = name;
    this.rank = rank;
    this.schema = schema;
    this.spec = spec;
    this.attrs = initAttrs(spec.attrs);
    this.excluded = null;
    var defaults = defaultAttrs(this.attrs);
    this.instance = defaults ? new Mark(this, defaults) : null;
  }

  _createClass(MarkType, [{
    key: "create",
    value: function create() {
      var attrs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      if (!attrs && this.instance) return this.instance;
      return new Mark(this, _computeAttrs(this.attrs, attrs));
    }
  }, {
    key: "removeFromSet",
    value: function removeFromSet(set) {
      for (var i = 0; i < set.length; i++) {
        if (set[i].type == this) {
          set = set.slice(0, i).concat(set.slice(i + 1));
          i--;
        }
      }

      return set;
    }
  }, {
    key: "isInSet",
    value: function isInSet(set) {
      for (var i = 0; i < set.length; i++) {
        if (set[i].type == this) return set[i];
      }
    }
  }, {
    key: "excludes",
    value: function excludes(other) {
      return this.excluded.indexOf(other) > -1;
    }
  }], [{
    key: "compile",
    value: function compile(marks, schema) {
      var result = Object.create(null),
          rank = 0;
      marks.forEach(function (name, spec) {
        return result[name] = new MarkType(name, rank++, schema, spec);
      });
      return result;
    }
  }]);

  return MarkType;
}();

var Schema = function () {
  function Schema(spec) {
    _classCallCheck(this, Schema);

    this.cached = Object.create(null);
    this.spec = {
      nodes: OrderedMap__default["default"].from(spec.nodes),
      marks: OrderedMap__default["default"].from(spec.marks || {}),
      topNode: spec.topNode
    };
    this.nodes = NodeType.compile(this.spec.nodes, this);
    this.marks = MarkType.compile(this.spec.marks, this);
    var contentExprCache = Object.create(null);

    for (var prop in this.nodes) {
      if (prop in this.marks) throw new RangeError(prop + " can not be both a node and a mark");
      var type = this.nodes[prop],
          contentExpr = type.spec.content || "",
          markExpr = type.spec.marks;
      type.contentMatch = contentExprCache[contentExpr] || (contentExprCache[contentExpr] = ContentMatch.parse(contentExpr, this.nodes));
      type.inlineContent = type.contentMatch.inlineContent;
      type.markSet = markExpr == "_" ? null : markExpr ? gatherMarks(this, markExpr.split(" ")) : markExpr == "" || !type.inlineContent ? [] : null;
    }

    for (var _prop in this.marks) {
      var _type2 = this.marks[_prop],
          excl = _type2.spec.excludes;
      _type2.excluded = excl == null ? [_type2] : excl == "" ? [] : gatherMarks(this, excl.split(" "));
    }

    this.nodeFromJSON = this.nodeFromJSON.bind(this);
    this.markFromJSON = this.markFromJSON.bind(this);
    this.topNodeType = this.nodes[this.spec.topNode || "doc"];
    this.cached.wrappings = Object.create(null);
  }

  _createClass(Schema, [{
    key: "node",
    value: function node(type) {
      var attrs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var content = arguments.length > 2 ? arguments[2] : undefined;
      var marks = arguments.length > 3 ? arguments[3] : undefined;
      if (typeof type == "string") type = this.nodeType(type);else if (!(type instanceof NodeType)) throw new RangeError("Invalid node type: " + type);else if (type.schema != this) throw new RangeError("Node type from different schema used (" + type.name + ")");
      return type.createChecked(attrs, content, marks);
    }
  }, {
    key: "text",
    value: function text(_text, marks) {
      var type = this.nodes.text;
      return new TextNode(type, type.defaultAttrs, _text, Mark.setFrom(marks));
    }
  }, {
    key: "mark",
    value: function mark(type, attrs) {
      if (typeof type == "string") type = this.marks[type];
      return type.create(attrs);
    }
  }, {
    key: "nodeFromJSON",
    value: function nodeFromJSON(json) {
      return Node.fromJSON(this, json);
    }
  }, {
    key: "markFromJSON",
    value: function markFromJSON(json) {
      return Mark.fromJSON(this, json);
    }
  }, {
    key: "nodeType",
    value: function nodeType(name) {
      var found = this.nodes[name];
      if (!found) throw new RangeError("Unknown node type: " + name);
      return found;
    }
  }]);

  return Schema;
}();

function gatherMarks(schema, marks) {
  var found = [];

  for (var i = 0; i < marks.length; i++) {
    var name = marks[i],
        mark = schema.marks[name],
        ok = mark;

    if (mark) {
      found.push(mark);
    } else {
      for (var prop in schema.marks) {
        var _mark = schema.marks[prop];
        if (name == "_" || _mark.spec.group && _mark.spec.group.split(" ").indexOf(name) > -1) found.push(ok = _mark);
      }
    }

    if (!ok) throw new SyntaxError("Unknown mark type: '" + marks[i] + "'");
  }

  return found;
}

var DOMParser = function () {
  function DOMParser(schema, rules) {
    var _this2 = this;

    _classCallCheck(this, DOMParser);

    this.schema = schema;
    this.rules = rules;
    this.tags = [];
    this.styles = [];
    rules.forEach(function (rule) {
      if (rule.tag) _this2.tags.push(rule);else if (rule.style) _this2.styles.push(rule);
    });
    this.normalizeLists = !this.tags.some(function (r) {
      if (!/^(ul|ol)\b/.test(r.tag) || !r.node) return false;
      var node = schema.nodes[r.node];
      return node.contentMatch.matchType(node);
    });
  }

  _createClass(DOMParser, [{
    key: "parse",
    value: function parse(dom) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var context = new ParseContext(this, options, false);
      context.addAll(dom, options.from, options.to);
      return context.finish();
    }
  }, {
    key: "parseSlice",
    value: function parseSlice(dom) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var context = new ParseContext(this, options, true);
      context.addAll(dom, options.from, options.to);
      return Slice.maxOpen(context.finish());
    }
  }, {
    key: "matchTag",
    value: function matchTag(dom, context, after) {
      for (var i = after ? this.tags.indexOf(after) + 1 : 0; i < this.tags.length; i++) {
        var rule = this.tags[i];

        if (matches(dom, rule.tag) && (rule.namespace === undefined || dom.namespaceURI == rule.namespace) && (!rule.context || context.matchesContext(rule.context))) {
          if (rule.getAttrs) {
            var result = rule.getAttrs(dom);
            if (result === false) continue;
            rule.attrs = result || undefined;
          }

          return rule;
        }
      }
    }
  }, {
    key: "matchStyle",
    value: function matchStyle(prop, value, context, after) {
      for (var i = after ? this.styles.indexOf(after) + 1 : 0; i < this.styles.length; i++) {
        var rule = this.styles[i],
            style = rule.style;
        if (style.indexOf(prop) != 0 || rule.context && !context.matchesContext(rule.context) || style.length > prop.length && (style.charCodeAt(prop.length) != 61 || style.slice(prop.length + 1) != value)) continue;

        if (rule.getAttrs) {
          var result = rule.getAttrs(value);
          if (result === false) continue;
          rule.attrs = result || undefined;
        }

        return rule;
      }
    }
  }], [{
    key: "schemaRules",
    value: function schemaRules(schema) {
      var result = [];

      function insert(rule) {
        var priority = rule.priority == null ? 50 : rule.priority,
            i = 0;

        for (; i < result.length; i++) {
          var next = result[i],
              nextPriority = next.priority == null ? 50 : next.priority;
          if (nextPriority < priority) break;
        }

        result.splice(i, 0, rule);
      }

      var _loop2 = function _loop2(name) {
        var rules = schema.marks[name].spec.parseDOM;
        if (rules) rules.forEach(function (rule) {
          insert(rule = copy(rule));
          rule.mark = name;
        });
      };

      for (var name in schema.marks) {
        _loop2(name);
      }

      var _loop3 = function _loop3(_name) {
        var rules = schema.nodes[_name].spec.parseDOM;
        if (rules) rules.forEach(function (rule) {
          insert(rule = copy(rule));
          rule.node = _name;
        });
      };

      for (var _name in schema.nodes) {
        _loop3(_name);
      }

      return result;
    }
  }, {
    key: "fromSchema",
    value: function fromSchema(schema) {
      return schema.cached.domParser || (schema.cached.domParser = new DOMParser(schema, DOMParser.schemaRules(schema)));
    }
  }]);

  return DOMParser;
}();

var blockTags = {
  address: true,
  article: true,
  aside: true,
  blockquote: true,
  canvas: true,
  dd: true,
  div: true,
  dl: true,
  fieldset: true,
  figcaption: true,
  figure: true,
  footer: true,
  form: true,
  h1: true,
  h2: true,
  h3: true,
  h4: true,
  h5: true,
  h6: true,
  header: true,
  hgroup: true,
  hr: true,
  li: true,
  noscript: true,
  ol: true,
  output: true,
  p: true,
  pre: true,
  section: true,
  table: true,
  tfoot: true,
  ul: true
};
var ignoreTags = {
  head: true,
  noscript: true,
  object: true,
  script: true,
  style: true,
  title: true
};
var listTags = {
  ol: true,
  ul: true
};
var OPT_PRESERVE_WS = 1,
    OPT_PRESERVE_WS_FULL = 2,
    OPT_OPEN_LEFT = 4;

function wsOptionsFor(type, preserveWhitespace, base) {
  if (preserveWhitespace != null) return (preserveWhitespace ? OPT_PRESERVE_WS : 0) | (preserveWhitespace === "full" ? OPT_PRESERVE_WS_FULL : 0);
  return type && type.whitespace == "pre" ? OPT_PRESERVE_WS | OPT_PRESERVE_WS_FULL : base & ~OPT_OPEN_LEFT;
}

var NodeContext = function () {
  function NodeContext(type, attrs, marks, pendingMarks, solid, match, options) {
    _classCallCheck(this, NodeContext);

    this.type = type;
    this.attrs = attrs;
    this.marks = marks;
    this.pendingMarks = pendingMarks;
    this.solid = solid;
    this.options = options;
    this.content = [];
    this.activeMarks = Mark.none;
    this.stashMarks = [];
    this.match = match || (options & OPT_OPEN_LEFT ? null : type.contentMatch);
  }

  _createClass(NodeContext, [{
    key: "findWrapping",
    value: function findWrapping(node) {
      if (!this.match) {
        if (!this.type) return [];
        var fill = this.type.contentMatch.fillBefore(Fragment.from(node));

        if (fill) {
          this.match = this.type.contentMatch.matchFragment(fill);
        } else {
          var start = this.type.contentMatch,
              wrap;

          if (wrap = start.findWrapping(node.type)) {
            this.match = start;
            return wrap;
          } else {
            return null;
          }
        }
      }

      return this.match.findWrapping(node.type);
    }
  }, {
    key: "finish",
    value: function finish(openEnd) {
      if (!(this.options & OPT_PRESERVE_WS)) {
        var last = this.content[this.content.length - 1],
            m;

        if (last && last.isText && (m = /[ \t\r\n\u000c]+$/.exec(last.text))) {
          var text = last;
          if (last.text.length == m[0].length) this.content.pop();else this.content[this.content.length - 1] = text.withText(text.text.slice(0, text.text.length - m[0].length));
        }
      }

      var content = Fragment.from(this.content);
      if (!openEnd && this.match) content = content.append(this.match.fillBefore(Fragment.empty, true));
      return this.type ? this.type.create(this.attrs, content, this.marks) : content;
    }
  }, {
    key: "popFromStashMark",
    value: function popFromStashMark(mark) {
      for (var i = this.stashMarks.length - 1; i >= 0; i--) {
        if (mark.eq(this.stashMarks[i])) return this.stashMarks.splice(i, 1)[0];
      }
    }
  }, {
    key: "applyPending",
    value: function applyPending(nextType) {
      for (var i = 0, pending = this.pendingMarks; i < pending.length; i++) {
        var mark = pending[i];

        if ((this.type ? this.type.allowsMarkType(mark.type) : markMayApply(mark.type, nextType)) && !mark.isInSet(this.activeMarks)) {
          this.activeMarks = mark.addToSet(this.activeMarks);
          this.pendingMarks = mark.removeFromSet(this.pendingMarks);
        }
      }
    }
  }, {
    key: "inlineContext",
    value: function inlineContext(node) {
      if (this.type) return this.type.inlineContent;
      if (this.content.length) return this.content[0].isInline;
      return node.parentNode && !blockTags.hasOwnProperty(node.parentNode.nodeName.toLowerCase());
    }
  }]);

  return NodeContext;
}();

var ParseContext = function () {
  function ParseContext(parser, options, isOpen) {
    _classCallCheck(this, ParseContext);

    this.parser = parser;
    this.options = options;
    this.isOpen = isOpen;
    this.open = 0;
    var topNode = options.topNode,
        topContext;
    var topOptions = wsOptionsFor(null, options.preserveWhitespace, 0) | (isOpen ? OPT_OPEN_LEFT : 0);
    if (topNode) topContext = new NodeContext(topNode.type, topNode.attrs, Mark.none, Mark.none, true, options.topMatch || topNode.type.contentMatch, topOptions);else if (isOpen) topContext = new NodeContext(null, null, Mark.none, Mark.none, true, null, topOptions);else topContext = new NodeContext(parser.schema.topNodeType, null, Mark.none, Mark.none, true, null, topOptions);
    this.nodes = [topContext];
    this.find = options.findPositions;
    this.needsBlock = false;
  }

  _createClass(ParseContext, [{
    key: "top",
    get: function get() {
      return this.nodes[this.open];
    }
  }, {
    key: "addDOM",
    value: function addDOM(dom) {
      if (dom.nodeType == 3) {
        this.addTextNode(dom);
      } else if (dom.nodeType == 1) {
        var style = dom.getAttribute("style");
        var marks = style ? this.readStyles(parseStyles(style)) : null,
            top = this.top;
        if (marks != null) for (var i = 0; i < marks.length; i++) {
          this.addPendingMark(marks[i]);
        }
        this.addElement(dom);
        if (marks != null) for (var _i4 = 0; _i4 < marks.length; _i4++) {
          this.removePendingMark(marks[_i4], top);
        }
      }
    }
  }, {
    key: "addTextNode",
    value: function addTextNode(dom) {
      var value = dom.nodeValue;
      var top = this.top;

      if (top.options & OPT_PRESERVE_WS_FULL || top.inlineContext(dom) || /[^ \t\r\n\u000c]/.test(value)) {
        if (!(top.options & OPT_PRESERVE_WS)) {
          value = value.replace(/[ \t\r\n\u000c]+/g, " ");

          if (/^[ \t\r\n\u000c]/.test(value) && this.open == this.nodes.length - 1) {
            var nodeBefore = top.content[top.content.length - 1];
            var domNodeBefore = dom.previousSibling;
            if (!nodeBefore || domNodeBefore && domNodeBefore.nodeName == 'BR' || nodeBefore.isText && /[ \t\r\n\u000c]$/.test(nodeBefore.text)) value = value.slice(1);
          }
        } else if (!(top.options & OPT_PRESERVE_WS_FULL)) {
          value = value.replace(/\r?\n|\r/g, " ");
        } else {
          value = value.replace(/\r\n?/g, "\n");
        }

        if (value) this.insertNode(this.parser.schema.text(value));
        this.findInText(dom);
      } else {
        this.findInside(dom);
      }
    }
  }, {
    key: "addElement",
    value: function addElement(dom, matchAfter) {
      var name = dom.nodeName.toLowerCase(),
          ruleID;
      if (listTags.hasOwnProperty(name) && this.parser.normalizeLists) normalizeList(dom);
      var rule = this.options.ruleFromNode && this.options.ruleFromNode(dom) || (ruleID = this.parser.matchTag(dom, this, matchAfter));

      if (rule ? rule.ignore : ignoreTags.hasOwnProperty(name)) {
        this.findInside(dom);
        this.ignoreFallback(dom);
      } else if (!rule || rule.skip || rule.closeParent) {
        if (rule && rule.closeParent) this.open = Math.max(0, this.open - 1);else if (rule && rule.skip.nodeType) dom = rule.skip;
        var sync,
            top = this.top,
            oldNeedsBlock = this.needsBlock;

        if (blockTags.hasOwnProperty(name)) {
          sync = true;
          if (!top.type) this.needsBlock = true;
        } else if (!dom.firstChild) {
          this.leafFallback(dom);
          return;
        }

        this.addAll(dom);
        if (sync) this.sync(top);
        this.needsBlock = oldNeedsBlock;
      } else {
        this.addElementByRule(dom, rule, rule.consuming === false ? ruleID : undefined);
      }
    }
  }, {
    key: "leafFallback",
    value: function leafFallback(dom) {
      if (dom.nodeName == "BR" && this.top.type && this.top.type.inlineContent) this.addTextNode(dom.ownerDocument.createTextNode("\n"));
    }
  }, {
    key: "ignoreFallback",
    value: function ignoreFallback(dom) {
      if (dom.nodeName == "BR" && (!this.top.type || !this.top.type.inlineContent)) this.findPlace(this.parser.schema.text("-"));
    }
  }, {
    key: "readStyles",
    value: function readStyles(styles) {
      var marks = Mark.none;

      style: for (var i = 0; i < styles.length; i += 2) {
        for (var after = undefined;;) {
          var rule = this.parser.matchStyle(styles[i], styles[i + 1], this, after);
          if (!rule) continue style;
          if (rule.ignore) return null;
          marks = this.parser.schema.marks[rule.mark].create(rule.attrs).addToSet(marks);
          if (rule.consuming === false) after = rule;else break;
        }
      }

      return marks;
    }
  }, {
    key: "addElementByRule",
    value: function addElementByRule(dom, rule, continueAfter) {
      var _this3 = this;

      var sync, nodeType, mark;

      if (rule.node) {
        nodeType = this.parser.schema.nodes[rule.node];

        if (!nodeType.isLeaf) {
          sync = this.enter(nodeType, rule.attrs || null, rule.preserveWhitespace);
        } else if (!this.insertNode(nodeType.create(rule.attrs))) {
          this.leafFallback(dom);
        }
      } else {
        var markType = this.parser.schema.marks[rule.mark];
        mark = markType.create(rule.attrs);
        this.addPendingMark(mark);
      }

      var startIn = this.top;

      if (nodeType && nodeType.isLeaf) {
        this.findInside(dom);
      } else if (continueAfter) {
        this.addElement(dom, continueAfter);
      } else if (rule.getContent) {
        this.findInside(dom);
        rule.getContent(dom, this.parser.schema).forEach(function (node) {
          return _this3.insertNode(node);
        });
      } else {
        var contentDOM = dom;
        if (typeof rule.contentElement == "string") contentDOM = dom.querySelector(rule.contentElement);else if (typeof rule.contentElement == "function") contentDOM = rule.contentElement(dom);else if (rule.contentElement) contentDOM = rule.contentElement;
        this.findAround(dom, contentDOM, true);
        this.addAll(contentDOM);
      }

      if (sync && this.sync(startIn)) this.open--;
      if (mark) this.removePendingMark(mark, startIn);
    }
  }, {
    key: "addAll",
    value: function addAll(parent, startIndex, endIndex) {
      var index = startIndex || 0;

      for (var dom = startIndex ? parent.childNodes[startIndex] : parent.firstChild, end = endIndex == null ? null : parent.childNodes[endIndex]; dom != end; dom = dom.nextSibling, ++index) {
        this.findAtPoint(parent, index);
        this.addDOM(dom);
      }

      this.findAtPoint(parent, index);
    }
  }, {
    key: "findPlace",
    value: function findPlace(node) {
      var route, sync;

      for (var depth = this.open; depth >= 0; depth--) {
        var cx = this.nodes[depth];

        var _found2 = cx.findWrapping(node);

        if (_found2 && (!route || route.length > _found2.length)) {
          route = _found2;
          sync = cx;
          if (!_found2.length) break;
        }

        if (cx.solid) break;
      }

      if (!route) return false;
      this.sync(sync);

      for (var i = 0; i < route.length; i++) {
        this.enterInner(route[i], null, false);
      }

      return true;
    }
  }, {
    key: "insertNode",
    value: function insertNode(node) {
      if (node.isInline && this.needsBlock && !this.top.type) {
        var block = this.textblockFromContext();
        if (block) this.enterInner(block);
      }

      if (this.findPlace(node)) {
        this.closeExtra();
        var top = this.top;
        top.applyPending(node.type);
        if (top.match) top.match = top.match.matchType(node.type);
        var marks = top.activeMarks;

        for (var i = 0; i < node.marks.length; i++) {
          if (!top.type || top.type.allowsMarkType(node.marks[i].type)) marks = node.marks[i].addToSet(marks);
        }

        top.content.push(node.mark(marks));
        return true;
      }

      return false;
    }
  }, {
    key: "enter",
    value: function enter(type, attrs, preserveWS) {
      var ok = this.findPlace(type.create(attrs));
      if (ok) this.enterInner(type, attrs, true, preserveWS);
      return ok;
    }
  }, {
    key: "enterInner",
    value: function enterInner(type) {
      var attrs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var solid = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var preserveWS = arguments.length > 3 ? arguments[3] : undefined;
      this.closeExtra();
      var top = this.top;
      top.applyPending(type);
      top.match = top.match && top.match.matchType(type);
      var options = wsOptionsFor(type, preserveWS, top.options);
      if (top.options & OPT_OPEN_LEFT && top.content.length == 0) options |= OPT_OPEN_LEFT;
      this.nodes.push(new NodeContext(type, attrs, top.activeMarks, top.pendingMarks, solid, null, options));
      this.open++;
    }
  }, {
    key: "closeExtra",
    value: function closeExtra() {
      var openEnd = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      var i = this.nodes.length - 1;

      if (i > this.open) {
        for (; i > this.open; i--) {
          this.nodes[i - 1].content.push(this.nodes[i].finish(openEnd));
        }

        this.nodes.length = this.open + 1;
      }
    }
  }, {
    key: "finish",
    value: function finish() {
      this.open = 0;
      this.closeExtra(this.isOpen);
      return this.nodes[0].finish(this.isOpen || this.options.topOpen);
    }
  }, {
    key: "sync",
    value: function sync(to) {
      for (var i = this.open; i >= 0; i--) {
        if (this.nodes[i] == to) {
          this.open = i;
          return true;
        }
      }

      return false;
    }
  }, {
    key: "currentPos",
    get: function get() {
      this.closeExtra();
      var pos = 0;

      for (var i = this.open; i >= 0; i--) {
        var content = this.nodes[i].content;

        for (var j = content.length - 1; j >= 0; j--) {
          pos += content[j].nodeSize;
        }

        if (i) pos++;
      }

      return pos;
    }
  }, {
    key: "findAtPoint",
    value: function findAtPoint(parent, offset) {
      if (this.find) for (var i = 0; i < this.find.length; i++) {
        if (this.find[i].node == parent && this.find[i].offset == offset) this.find[i].pos = this.currentPos;
      }
    }
  }, {
    key: "findInside",
    value: function findInside(parent) {
      if (this.find) for (var i = 0; i < this.find.length; i++) {
        if (this.find[i].pos == null && parent.nodeType == 1 && parent.contains(this.find[i].node)) this.find[i].pos = this.currentPos;
      }
    }
  }, {
    key: "findAround",
    value: function findAround(parent, content, before) {
      if (parent != content && this.find) for (var i = 0; i < this.find.length; i++) {
        if (this.find[i].pos == null && parent.nodeType == 1 && parent.contains(this.find[i].node)) {
          var pos = content.compareDocumentPosition(this.find[i].node);
          if (pos & (before ? 2 : 4)) this.find[i].pos = this.currentPos;
        }
      }
    }
  }, {
    key: "findInText",
    value: function findInText(textNode) {
      if (this.find) for (var i = 0; i < this.find.length; i++) {
        if (this.find[i].node == textNode) this.find[i].pos = this.currentPos - (textNode.nodeValue.length - this.find[i].offset);
      }
    }
  }, {
    key: "matchesContext",
    value: function matchesContext(context) {
      var _this4 = this;

      if (context.indexOf("|") > -1) return context.split(/\s*\|\s*/).some(this.matchesContext, this);
      var parts = context.split("/");
      var option = this.options.context;
      var useRoot = !this.isOpen && (!option || option.parent.type == this.nodes[0].type);
      var minDepth = -(option ? option.depth + 1 : 0) + (useRoot ? 0 : 1);

      var match = function match(i, depth) {
        for (; i >= 0; i--) {
          var part = parts[i];

          if (part == "") {
            if (i == parts.length - 1 || i == 0) continue;

            for (; depth >= minDepth; depth--) {
              if (match(i - 1, depth)) return true;
            }

            return false;
          } else {
            var next = depth > 0 || depth == 0 && useRoot ? _this4.nodes[depth].type : option && depth >= minDepth ? option.node(depth - minDepth).type : null;
            if (!next || next.name != part && next.groups.indexOf(part) == -1) return false;
            depth--;
          }
        }

        return true;
      };

      return match(parts.length - 1, this.open);
    }
  }, {
    key: "textblockFromContext",
    value: function textblockFromContext() {
      var $context = this.options.context;
      if ($context) for (var d = $context.depth; d >= 0; d--) {
        var deflt = $context.node(d).contentMatchAt($context.indexAfter(d)).defaultType;
        if (deflt && deflt.isTextblock && deflt.defaultAttrs) return deflt;
      }

      for (var name in this.parser.schema.nodes) {
        var type = this.parser.schema.nodes[name];
        if (type.isTextblock && type.defaultAttrs) return type;
      }
    }
  }, {
    key: "addPendingMark",
    value: function addPendingMark(mark) {
      var found = findSameMarkInSet(mark, this.top.pendingMarks);
      if (found) this.top.stashMarks.push(found);
      this.top.pendingMarks = mark.addToSet(this.top.pendingMarks);
    }
  }, {
    key: "removePendingMark",
    value: function removePendingMark(mark, upto) {
      for (var depth = this.open; depth >= 0; depth--) {
        var level = this.nodes[depth];

        var _found3 = level.pendingMarks.lastIndexOf(mark);

        if (_found3 > -1) {
          level.pendingMarks = mark.removeFromSet(level.pendingMarks);
        } else {
          level.activeMarks = mark.removeFromSet(level.activeMarks);
          var stashMark = level.popFromStashMark(mark);
          if (stashMark && level.type && level.type.allowsMarkType(stashMark.type)) level.activeMarks = stashMark.addToSet(level.activeMarks);
        }

        if (level == upto) break;
      }
    }
  }]);

  return ParseContext;
}();

function normalizeList(dom) {
  for (var child = dom.firstChild, prevItem = null; child; child = child.nextSibling) {
    var name = child.nodeType == 1 ? child.nodeName.toLowerCase() : null;

    if (name && listTags.hasOwnProperty(name) && prevItem) {
      prevItem.appendChild(child);
      child = prevItem;
    } else if (name == "li") {
      prevItem = child;
    } else if (name) {
      prevItem = null;
    }
  }
}

function matches(dom, selector) {
  return (dom.matches || dom.msMatchesSelector || dom.webkitMatchesSelector || dom.mozMatchesSelector).call(dom, selector);
}

function parseStyles(style) {
  var re = /\s*([\w-]+)\s*:\s*([^;]+)/g,
      m,
      result = [];

  while (m = re.exec(style)) {
    result.push(m[1], m[2].trim());
  }

  return result;
}

function copy(obj) {
  var copy = {};

  for (var prop in obj) {
    copy[prop] = obj[prop];
  }

  return copy;
}

function markMayApply(markType, nodeType) {
  var nodes = nodeType.schema.nodes;

  var _loop4 = function _loop4(name) {
    var parent = nodes[name];
    if (!parent.allowsMarkType(markType)) return "continue";

    var seen = [],
        scan = function scan(match) {
      seen.push(match);

      for (var i = 0; i < match.edgeCount; i++) {
        var _match$edge = match.edge(i),
            type = _match$edge.type,
            next = _match$edge.next;

        if (type == nodeType) return true;
        if (seen.indexOf(next) < 0 && scan(next)) return true;
      }
    };

    if (scan(parent.contentMatch)) return {
      v: true
    };
  };

  for (var name in nodes) {
    var _ret = _loop4(name);

    if (_ret === "continue") continue;
    if (_typeof(_ret) === "object") return _ret.v;
  }
}

function findSameMarkInSet(mark, set) {
  for (var i = 0; i < set.length; i++) {
    if (mark.eq(set[i])) return set[i];
  }
}

var DOMSerializer = function () {
  function DOMSerializer(nodes, marks) {
    _classCallCheck(this, DOMSerializer);

    this.nodes = nodes;
    this.marks = marks;
  }

  _createClass(DOMSerializer, [{
    key: "serializeFragment",
    value: function serializeFragment(fragment) {
      var _this5 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var target = arguments.length > 2 ? arguments[2] : undefined;
      if (!target) target = doc(options).createDocumentFragment();
      var top = target,
          active = [];
      fragment.forEach(function (node) {
        if (active.length || node.marks.length) {
          var keep = 0,
              rendered = 0;

          while (keep < active.length && rendered < node.marks.length) {
            var next = node.marks[rendered];

            if (!_this5.marks[next.type.name]) {
              rendered++;
              continue;
            }

            if (!next.eq(active[keep][0]) || next.type.spec.spanning === false) break;
            keep++;
            rendered++;
          }

          while (keep < active.length) {
            top = active.pop()[1];
          }

          while (rendered < node.marks.length) {
            var add = node.marks[rendered++];

            var markDOM = _this5.serializeMark(add, node.isInline, options);

            if (markDOM) {
              active.push([add, top]);
              top.appendChild(markDOM.dom);
              top = markDOM.contentDOM || markDOM.dom;
            }
          }
        }

        top.appendChild(_this5.serializeNodeInner(node, options));
      });
      return target;
    }
  }, {
    key: "serializeNodeInner",
    value: function serializeNodeInner(node, options) {
      var _DOMSerializer$render = DOMSerializer.renderSpec(doc(options), this.nodes[node.type.name](node)),
          dom = _DOMSerializer$render.dom,
          contentDOM = _DOMSerializer$render.contentDOM;

      if (contentDOM) {
        if (node.isLeaf) throw new RangeError("Content hole not allowed in a leaf node spec");
        this.serializeFragment(node.content, options, contentDOM);
      }

      return dom;
    }
  }, {
    key: "serializeNode",
    value: function serializeNode(node) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var dom = this.serializeNodeInner(node, options);

      for (var i = node.marks.length - 1; i >= 0; i--) {
        var wrap = this.serializeMark(node.marks[i], node.isInline, options);

        if (wrap) {
          (wrap.contentDOM || wrap.dom).appendChild(dom);
          dom = wrap.dom;
        }
      }

      return dom;
    }
  }, {
    key: "serializeMark",
    value: function serializeMark(mark, inline) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var toDOM = this.marks[mark.type.name];
      return toDOM && DOMSerializer.renderSpec(doc(options), toDOM(mark, inline));
    }
  }], [{
    key: "renderSpec",
    value: function renderSpec(doc, structure) {
      var xmlNS = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      if (typeof structure == "string") return {
        dom: doc.createTextNode(structure)
      };
      if (structure.nodeType != null) return {
        dom: structure
      };
      if (structure.dom && structure.dom.nodeType != null) return structure;
      var tagName = structure[0],
          space = tagName.indexOf(" ");

      if (space > 0) {
        xmlNS = tagName.slice(0, space);
        tagName = tagName.slice(space + 1);
      }

      var contentDOM;
      var dom = xmlNS ? doc.createElementNS(xmlNS, tagName) : doc.createElement(tagName);
      var attrs = structure[1],
          start = 1;

      if (attrs && _typeof(attrs) == "object" && attrs.nodeType == null && !Array.isArray(attrs)) {
        start = 2;

        for (var name in attrs) {
          if (attrs[name] != null) {
            var _space = name.indexOf(" ");

            if (_space > 0) dom.setAttributeNS(name.slice(0, _space), name.slice(_space + 1), attrs[name]);else dom.setAttribute(name, attrs[name]);
          }
        }
      }

      for (var i = start; i < structure.length; i++) {
        var child = structure[i];

        if (child === 0) {
          if (i < structure.length - 1 || i > start) throw new RangeError("Content hole must be the only child of its parent node");
          return {
            dom: dom,
            contentDOM: dom
          };
        } else {
          var _DOMSerializer$render2 = DOMSerializer.renderSpec(doc, child, xmlNS),
              inner = _DOMSerializer$render2.dom,
              innerContent = _DOMSerializer$render2.contentDOM;

          dom.appendChild(inner);

          if (innerContent) {
            if (contentDOM) throw new RangeError("Multiple content holes");
            contentDOM = innerContent;
          }
        }
      }

      return {
        dom: dom,
        contentDOM: contentDOM
      };
    }
  }, {
    key: "fromSchema",
    value: function fromSchema(schema) {
      return schema.cached.domSerializer || (schema.cached.domSerializer = new DOMSerializer(this.nodesFromSchema(schema), this.marksFromSchema(schema)));
    }
  }, {
    key: "nodesFromSchema",
    value: function nodesFromSchema(schema) {
      var result = gatherToDOM(schema.nodes);
      if (!result.text) result.text = function (node) {
        return node.text;
      };
      return result;
    }
  }, {
    key: "marksFromSchema",
    value: function marksFromSchema(schema) {
      return gatherToDOM(schema.marks);
    }
  }]);

  return DOMSerializer;
}();

function gatherToDOM(obj) {
  var result = {};

  for (var name in obj) {
    var toDOM = obj[name].spec.toDOM;
    if (toDOM) result[name] = toDOM;
  }

  return result;
}

function doc(options) {
  return options.document || window.document;
}

exports.ContentMatch = ContentMatch;
exports.DOMParser = DOMParser;
exports.DOMSerializer = DOMSerializer;
exports.Fragment = Fragment;
exports.Mark = Mark;
exports.MarkType = MarkType;
exports.Node = Node;
exports.NodeRange = NodeRange;
exports.NodeType = NodeType;
exports.ReplaceError = ReplaceError;
exports.ResolvedPos = ResolvedPos;
exports.Schema = Schema;
exports.Slice = Slice;

},{"orderedmap":3}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var prosemirrorModel = require('prosemirror-model');

var pDOM = ["p", 0],
    blockquoteDOM = ["blockquote", 0],
    hrDOM = ["hr"],
    preDOM = ["pre", ["code", 0]],
    brDOM = ["br"];
var nodes = {
  doc: {
    content: "block+"
  },
  paragraph: {
    content: "inline*",
    group: "block",
    parseDOM: [{
      tag: "p"
    }],
    toDOM: function toDOM() {
      return pDOM;
    }
  },
  blockquote: {
    content: "block+",
    group: "block",
    defining: true,
    parseDOM: [{
      tag: "blockquote"
    }],
    toDOM: function toDOM() {
      return blockquoteDOM;
    }
  },
  horizontal_rule: {
    group: "block",
    parseDOM: [{
      tag: "hr"
    }],
    toDOM: function toDOM() {
      return hrDOM;
    }
  },
  heading: {
    attrs: {
      level: {
        "default": 1
      }
    },
    content: "inline*",
    group: "block",
    defining: true,
    parseDOM: [{
      tag: "h1",
      attrs: {
        level: 1
      }
    }, {
      tag: "h2",
      attrs: {
        level: 2
      }
    }, {
      tag: "h3",
      attrs: {
        level: 3
      }
    }, {
      tag: "h4",
      attrs: {
        level: 4
      }
    }, {
      tag: "h5",
      attrs: {
        level: 5
      }
    }, {
      tag: "h6",
      attrs: {
        level: 6
      }
    }],
    toDOM: function toDOM(node) {
      return ["h" + node.attrs.level, 0];
    }
  },
  code_block: {
    content: "text*",
    marks: "",
    group: "block",
    code: true,
    defining: true,
    parseDOM: [{
      tag: "pre",
      preserveWhitespace: "full"
    }],
    toDOM: function toDOM() {
      return preDOM;
    }
  },
  text: {
    group: "inline"
  },
  image: {
    inline: true,
    attrs: {
      src: {},
      alt: {
        "default": null
      },
      title: {
        "default": null
      }
    },
    group: "inline",
    draggable: true,
    parseDOM: [{
      tag: "img[src]",
      getAttrs: function getAttrs(dom) {
        return {
          src: dom.getAttribute("src"),
          title: dom.getAttribute("title"),
          alt: dom.getAttribute("alt")
        };
      }
    }],
    toDOM: function toDOM(node) {
      var _node$attrs = node.attrs,
          src = _node$attrs.src,
          alt = _node$attrs.alt,
          title = _node$attrs.title;
      return ["img", {
        src: src,
        alt: alt,
        title: title
      }];
    }
  },
  hard_break: {
    inline: true,
    group: "inline",
    selectable: false,
    parseDOM: [{
      tag: "br"
    }],
    toDOM: function toDOM() {
      return brDOM;
    }
  }
};
var emDOM = ["em", 0],
    strongDOM = ["strong", 0],
    codeDOM = ["code", 0];
var marks = {
  link: {
    attrs: {
      href: {},
      title: {
        "default": null
      }
    },
    inclusive: false,
    parseDOM: [{
      tag: "a[href]",
      getAttrs: function getAttrs(dom) {
        return {
          href: dom.getAttribute("href"),
          title: dom.getAttribute("title")
        };
      }
    }],
    toDOM: function toDOM(node) {
      var _node$attrs2 = node.attrs,
          href = _node$attrs2.href,
          title = _node$attrs2.title;
      return ["a", {
        href: href,
        title: title
      }, 0];
    }
  },
  em: {
    parseDOM: [{
      tag: "i"
    }, {
      tag: "em"
    }, {
      style: "font-style=italic"
    }],
    toDOM: function toDOM() {
      return emDOM;
    }
  },
  strong: {
    parseDOM: [{
      tag: "strong"
    }, {
      tag: "b",
      getAttrs: function getAttrs(node) {
        return node.style.fontWeight != "normal" && null;
      }
    }, {
      style: "font-weight",
      getAttrs: function getAttrs(value) {
        return /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null;
      }
    }],
    toDOM: function toDOM() {
      return strongDOM;
    }
  },
  code: {
    parseDOM: [{
      tag: "code"
    }],
    toDOM: function toDOM() {
      return codeDOM;
    }
  }
};
var schema = new prosemirrorModel.Schema({
  nodes: nodes,
  marks: marks
});
exports.marks = marks;
exports.nodes = nodes;
exports.schema = schema;

},{"prosemirror-model":12}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var prosemirrorTransform = require('prosemirror-transform');

var prosemirrorModel = require('prosemirror-model');

var prosemirrorState = require('prosemirror-state');

var olDOM = ["ol", 0],
    ulDOM = ["ul", 0],
    liDOM = ["li", 0];
var orderedList = {
  attrs: {
    order: {
      "default": 1
    }
  },
  parseDOM: [{
    tag: "ol",
    getAttrs: function getAttrs(dom) {
      return {
        order: dom.hasAttribute("start") ? +dom.getAttribute("start") : 1
      };
    }
  }],
  toDOM: function toDOM(node) {
    return node.attrs.order == 1 ? olDOM : ["ol", {
      start: node.attrs.order
    }, 0];
  }
};
var bulletList = {
  parseDOM: [{
    tag: "ul"
  }],
  toDOM: function toDOM() {
    return ulDOM;
  }
};
var listItem = {
  parseDOM: [{
    tag: "li"
  }],
  toDOM: function toDOM() {
    return liDOM;
  },
  defining: true
};

function add(obj, props) {
  var copy = {};

  for (var prop in obj) {
    copy[prop] = obj[prop];
  }

  for (var _prop in props) {
    copy[_prop] = props[_prop];
  }

  return copy;
}

function addListNodes(nodes, itemContent, listGroup) {
  return nodes.append({
    ordered_list: add(orderedList, {
      content: "list_item+",
      group: listGroup
    }),
    bullet_list: add(bulletList, {
      content: "list_item+",
      group: listGroup
    }),
    list_item: add(listItem, {
      content: itemContent
    })
  });
}

function wrapInList(listType) {
  var attrs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  return function (state, dispatch) {
    var _state$selection = state.selection,
        $from = _state$selection.$from,
        $to = _state$selection.$to;
    var range = $from.blockRange($to),
        doJoin = false,
        outerRange = range;
    if (!range) return false;

    if (range.depth >= 2 && $from.node(range.depth - 1).type.compatibleContent(listType) && range.startIndex == 0) {
      if ($from.index(range.depth - 1) == 0) return false;
      var $insert = state.doc.resolve(range.start - 2);
      outerRange = new prosemirrorModel.NodeRange($insert, $insert, range.depth);
      if (range.endIndex < range.parent.childCount) range = new prosemirrorModel.NodeRange($from, state.doc.resolve($to.end(range.depth)), range.depth);
      doJoin = true;
    }

    var wrap = prosemirrorTransform.findWrapping(outerRange, listType, attrs, range);
    if (!wrap) return false;
    if (dispatch) dispatch(doWrapInList(state.tr, range, wrap, doJoin, listType).scrollIntoView());
    return true;
  };
}

function doWrapInList(tr, range, wrappers, joinBefore, listType) {
  var content = prosemirrorModel.Fragment.empty;

  for (var i = wrappers.length - 1; i >= 0; i--) {
    content = prosemirrorModel.Fragment.from(wrappers[i].type.create(wrappers[i].attrs, content));
  }

  tr.step(new prosemirrorTransform.ReplaceAroundStep(range.start - (joinBefore ? 2 : 0), range.end, range.start, range.end, new prosemirrorModel.Slice(content, 0, 0), wrappers.length, true));
  var found = 0;

  for (var _i = 0; _i < wrappers.length; _i++) {
    if (wrappers[_i].type == listType) found = _i + 1;
  }

  var splitDepth = wrappers.length - found;
  var splitPos = range.start + wrappers.length - (joinBefore ? 2 : 0),
      parent = range.parent;

  for (var _i2 = range.startIndex, e = range.endIndex, first = true; _i2 < e; _i2++, first = false) {
    if (!first && prosemirrorTransform.canSplit(tr.doc, splitPos, splitDepth)) {
      tr.split(splitPos, splitDepth);
      splitPos += 2 * splitDepth;
    }

    splitPos += parent.child(_i2).nodeSize;
  }

  return tr;
}

function splitListItem(itemType) {
  return function (state, dispatch) {
    var _state$selection2 = state.selection,
        $from = _state$selection2.$from,
        $to = _state$selection2.$to,
        node = _state$selection2.node;
    if (node && node.isBlock || $from.depth < 2 || !$from.sameParent($to)) return false;
    var grandParent = $from.node(-1);
    if (grandParent.type != itemType) return false;

    if ($from.parent.content.size == 0 && $from.node(-1).childCount == $from.indexAfter(-1)) {
      if ($from.depth == 3 || $from.node(-3).type != itemType || $from.index(-2) != $from.node(-2).childCount - 1) return false;

      if (dispatch) {
        var wrap = prosemirrorModel.Fragment.empty;
        var depthBefore = $from.index(-1) ? 1 : $from.index(-2) ? 2 : 3;

        for (var d = $from.depth - depthBefore; d >= $from.depth - 3; d--) {
          wrap = prosemirrorModel.Fragment.from($from.node(d).copy(wrap));
        }

        var depthAfter = $from.indexAfter(-1) < $from.node(-2).childCount ? 1 : $from.indexAfter(-2) < $from.node(-3).childCount ? 2 : 3;
        wrap = wrap.append(prosemirrorModel.Fragment.from(itemType.createAndFill()));
        var start = $from.before($from.depth - (depthBefore - 1));

        var _tr = state.tr.replace(start, $from.after(-depthAfter), new prosemirrorModel.Slice(wrap, 4 - depthBefore, 0));

        var sel = -1;

        _tr.doc.nodesBetween(start, _tr.doc.content.size, function (node, pos) {
          if (sel > -1) return false;
          if (node.isTextblock && node.content.size == 0) sel = pos + 1;
        });

        if (sel > -1) _tr.setSelection(prosemirrorState.Selection.near(_tr.doc.resolve(sel)));
        dispatch(_tr.scrollIntoView());
      }

      return true;
    }

    var nextType = $to.pos == $from.end() ? grandParent.contentMatchAt(0).defaultType : null;
    var tr = state.tr["delete"]($from.pos, $to.pos);
    var types = nextType ? [null, {
      type: nextType
    }] : undefined;
    if (!prosemirrorTransform.canSplit(tr.doc, $from.pos, 2, types)) return false;
    if (dispatch) dispatch(tr.split($from.pos, 2, types).scrollIntoView());
    return true;
  };
}

function liftListItem(itemType) {
  return function (state, dispatch) {
    var _state$selection3 = state.selection,
        $from = _state$selection3.$from,
        $to = _state$selection3.$to;
    var range = $from.blockRange($to, function (node) {
      return node.childCount > 0 && node.firstChild.type == itemType;
    });
    if (!range) return false;
    if (!dispatch) return true;
    if ($from.node(range.depth - 1).type == itemType) return liftToOuterList(state, dispatch, itemType, range);else return liftOutOfList(state, dispatch, range);
  };
}

function liftToOuterList(state, dispatch, itemType, range) {
  var tr = state.tr,
      end = range.end,
      endOfList = range.$to.end(range.depth);

  if (end < endOfList) {
    tr.step(new prosemirrorTransform.ReplaceAroundStep(end - 1, endOfList, end, endOfList, new prosemirrorModel.Slice(prosemirrorModel.Fragment.from(itemType.create(null, range.parent.copy())), 1, 0), 1, true));
    range = new prosemirrorModel.NodeRange(tr.doc.resolve(range.$from.pos), tr.doc.resolve(endOfList), range.depth);
  }

  var target = prosemirrorTransform.liftTarget(range);
  if (target == null) return false;
  dispatch(tr.lift(range, target).scrollIntoView());
  return true;
}

function liftOutOfList(state, dispatch, range) {
  var tr = state.tr,
      list = range.parent;

  for (var pos = range.end, i = range.endIndex - 1, e = range.startIndex; i > e; i--) {
    pos -= list.child(i).nodeSize;
    tr["delete"](pos - 1, pos + 1);
  }

  var $start = tr.doc.resolve(range.start),
      item = $start.nodeAfter;
  if (tr.mapping.map(range.end) != range.start + $start.nodeAfter.nodeSize) return false;
  var atStart = range.startIndex == 0,
      atEnd = range.endIndex == list.childCount;
  var parent = $start.node(-1),
      indexBefore = $start.index(-1);
  if (!parent.canReplace(indexBefore + (atStart ? 0 : 1), indexBefore + 1, item.content.append(atEnd ? prosemirrorModel.Fragment.empty : prosemirrorModel.Fragment.from(list)))) return false;
  var start = $start.pos,
      end = start + item.nodeSize;
  tr.step(new prosemirrorTransform.ReplaceAroundStep(start - (atStart ? 1 : 0), end + (atEnd ? 1 : 0), start + 1, end - 1, new prosemirrorModel.Slice((atStart ? prosemirrorModel.Fragment.empty : prosemirrorModel.Fragment.from(list.copy(prosemirrorModel.Fragment.empty))).append(atEnd ? prosemirrorModel.Fragment.empty : prosemirrorModel.Fragment.from(list.copy(prosemirrorModel.Fragment.empty))), atStart ? 0 : 1, atEnd ? 0 : 1), atStart ? 0 : 1));
  dispatch(tr.scrollIntoView());
  return true;
}

function sinkListItem(itemType) {
  return function (state, dispatch) {
    var _state$selection4 = state.selection,
        $from = _state$selection4.$from,
        $to = _state$selection4.$to;
    var range = $from.blockRange($to, function (node) {
      return node.childCount > 0 && node.firstChild.type == itemType;
    });
    if (!range) return false;
    var startIndex = range.startIndex;
    if (startIndex == 0) return false;
    var parent = range.parent,
        nodeBefore = parent.child(startIndex - 1);
    if (nodeBefore.type != itemType) return false;

    if (dispatch) {
      var nestedBefore = nodeBefore.lastChild && nodeBefore.lastChild.type == parent.type;
      var inner = prosemirrorModel.Fragment.from(nestedBefore ? itemType.create() : null);
      var slice = new prosemirrorModel.Slice(prosemirrorModel.Fragment.from(itemType.create(null, prosemirrorModel.Fragment.from(parent.type.create(null, inner)))), nestedBefore ? 3 : 1, 0);
      var before = range.start,
          after = range.end;
      dispatch(state.tr.step(new prosemirrorTransform.ReplaceAroundStep(before - (nestedBefore ? 3 : 1), after, before, after, slice, 1, true)).scrollIntoView());
    }

    return true;
  };
}

exports.addListNodes = addListNodes;
exports.bulletList = bulletList;
exports.liftListItem = liftListItem;
exports.listItem = listItem;
exports.orderedList = orderedList;
exports.sinkListItem = sinkListItem;
exports.splitListItem = splitListItem;
exports.wrapInList = wrapInList;

},{"prosemirror-model":12,"prosemirror-state":15,"prosemirror-transform":16}],15:[function(require,module,exports){
'use strict';

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _get() { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(arguments.length < 3 ? target : receiver); } return desc.value; }; } return _get.apply(this, arguments); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

Object.defineProperty(exports, '__esModule', {
  value: true
});

var prosemirrorModel = require('prosemirror-model');

var prosemirrorTransform = require('prosemirror-transform');

var classesById = Object.create(null);

var Selection = function () {
  function Selection($anchor, $head, ranges) {
    _classCallCheck(this, Selection);

    this.$anchor = $anchor;
    this.$head = $head;
    this.ranges = ranges || [new SelectionRange($anchor.min($head), $anchor.max($head))];
  }

  _createClass(Selection, [{
    key: "anchor",
    get: function get() {
      return this.$anchor.pos;
    }
  }, {
    key: "head",
    get: function get() {
      return this.$head.pos;
    }
  }, {
    key: "from",
    get: function get() {
      return this.$from.pos;
    }
  }, {
    key: "to",
    get: function get() {
      return this.$to.pos;
    }
  }, {
    key: "$from",
    get: function get() {
      return this.ranges[0].$from;
    }
  }, {
    key: "$to",
    get: function get() {
      return this.ranges[0].$to;
    }
  }, {
    key: "empty",
    get: function get() {
      var ranges = this.ranges;

      for (var i = 0; i < ranges.length; i++) {
        if (ranges[i].$from.pos != ranges[i].$to.pos) return false;
      }

      return true;
    }
  }, {
    key: "content",
    value: function content() {
      return this.$from.doc.slice(this.from, this.to, true);
    }
  }, {
    key: "replace",
    value: function replace(tr) {
      var content = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : prosemirrorModel.Slice.empty;
      var lastNode = content.content.lastChild,
          lastParent = null;

      for (var i = 0; i < content.openEnd; i++) {
        lastParent = lastNode;
        lastNode = lastNode.lastChild;
      }

      var mapFrom = tr.steps.length,
          ranges = this.ranges;

      for (var _i = 0; _i < ranges.length; _i++) {
        var _ranges$_i = ranges[_i],
            $from = _ranges$_i.$from,
            $to = _ranges$_i.$to,
            mapping = tr.mapping.slice(mapFrom);
        tr.replaceRange(mapping.map($from.pos), mapping.map($to.pos), _i ? prosemirrorModel.Slice.empty : content);
        if (_i == 0) selectionToInsertionEnd(tr, mapFrom, (lastNode ? lastNode.isInline : lastParent && lastParent.isTextblock) ? -1 : 1);
      }
    }
  }, {
    key: "replaceWith",
    value: function replaceWith(tr, node) {
      var mapFrom = tr.steps.length,
          ranges = this.ranges;

      for (var i = 0; i < ranges.length; i++) {
        var _ranges$i = ranges[i],
            $from = _ranges$i.$from,
            $to = _ranges$i.$to,
            mapping = tr.mapping.slice(mapFrom);
        var from = mapping.map($from.pos),
            to = mapping.map($to.pos);

        if (i) {
          tr.deleteRange(from, to);
        } else {
          tr.replaceRangeWith(from, to, node);
          selectionToInsertionEnd(tr, mapFrom, node.isInline ? -1 : 1);
        }
      }
    }
  }, {
    key: "getBookmark",
    value: function getBookmark() {
      return TextSelection.between(this.$anchor, this.$head).getBookmark();
    }
  }], [{
    key: "findFrom",
    value: function findFrom($pos, dir) {
      var textOnly = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var inner = $pos.parent.inlineContent ? new TextSelection($pos) : findSelectionIn($pos.node(0), $pos.parent, $pos.pos, $pos.index(), dir, textOnly);
      if (inner) return inner;

      for (var depth = $pos.depth - 1; depth >= 0; depth--) {
        var found = dir < 0 ? findSelectionIn($pos.node(0), $pos.node(depth), $pos.before(depth + 1), $pos.index(depth), dir, textOnly) : findSelectionIn($pos.node(0), $pos.node(depth), $pos.after(depth + 1), $pos.index(depth) + 1, dir, textOnly);
        if (found) return found;
      }

      return null;
    }
  }, {
    key: "near",
    value: function near($pos) {
      var bias = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      return this.findFrom($pos, bias) || this.findFrom($pos, -bias) || new AllSelection($pos.node(0));
    }
  }, {
    key: "atStart",
    value: function atStart(doc) {
      return findSelectionIn(doc, doc, 0, 0, 1) || new AllSelection(doc);
    }
  }, {
    key: "atEnd",
    value: function atEnd(doc) {
      return findSelectionIn(doc, doc, doc.content.size, doc.childCount, -1) || new AllSelection(doc);
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(doc, json) {
      if (!json || !json.type) throw new RangeError("Invalid input for Selection.fromJSON");
      var cls = classesById[json.type];
      if (!cls) throw new RangeError("No selection type ".concat(json.type, " defined"));
      return cls.fromJSON(doc, json);
    }
  }, {
    key: "jsonID",
    value: function jsonID(id, selectionClass) {
      if (id in classesById) throw new RangeError("Duplicate use of selection JSON ID " + id);
      classesById[id] = selectionClass;
      selectionClass.prototype.jsonID = id;
      return selectionClass;
    }
  }]);

  return Selection;
}();

Selection.prototype.visible = true;

var SelectionRange = _createClass(function SelectionRange($from, $to) {
  _classCallCheck(this, SelectionRange);

  this.$from = $from;
  this.$to = $to;
});

var warnedAboutTextSelection = false;

function checkTextSelection($pos) {
  if (!warnedAboutTextSelection && !$pos.parent.inlineContent) {
    warnedAboutTextSelection = true;
    console["warn"]("TextSelection endpoint not pointing into a node with inline content (" + $pos.parent.type.name + ")");
  }
}

var TextSelection = function (_Selection) {
  _inherits(TextSelection, _Selection);

  var _super = _createSuper(TextSelection);

  function TextSelection($anchor) {
    var $head = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : $anchor;

    _classCallCheck(this, TextSelection);

    checkTextSelection($anchor);
    checkTextSelection($head);
    return _super.call(this, $anchor, $head);
  }

  _createClass(TextSelection, [{
    key: "$cursor",
    get: function get() {
      return this.$anchor.pos == this.$head.pos ? this.$head : null;
    }
  }, {
    key: "map",
    value: function map(doc, mapping) {
      var $head = doc.resolve(mapping.map(this.head));
      if (!$head.parent.inlineContent) return Selection.near($head);
      var $anchor = doc.resolve(mapping.map(this.anchor));
      return new TextSelection($anchor.parent.inlineContent ? $anchor : $head, $head);
    }
  }, {
    key: "replace",
    value: function replace(tr) {
      var content = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : prosemirrorModel.Slice.empty;

      _get(_getPrototypeOf(TextSelection.prototype), "replace", this).call(this, tr, content);

      if (content == prosemirrorModel.Slice.empty) {
        var marks = this.$from.marksAcross(this.$to);
        if (marks) tr.ensureMarks(marks);
      }
    }
  }, {
    key: "eq",
    value: function eq(other) {
      return other instanceof TextSelection && other.anchor == this.anchor && other.head == this.head;
    }
  }, {
    key: "getBookmark",
    value: function getBookmark() {
      return new TextBookmark(this.anchor, this.head);
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return {
        type: "text",
        anchor: this.anchor,
        head: this.head
      };
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(doc, json) {
      if (typeof json.anchor != "number" || typeof json.head != "number") throw new RangeError("Invalid input for TextSelection.fromJSON");
      return new TextSelection(doc.resolve(json.anchor), doc.resolve(json.head));
    }
  }, {
    key: "create",
    value: function create(doc, anchor) {
      var head = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : anchor;
      var $anchor = doc.resolve(anchor);
      return new this($anchor, head == anchor ? $anchor : doc.resolve(head));
    }
  }, {
    key: "between",
    value: function between($anchor, $head, bias) {
      var dPos = $anchor.pos - $head.pos;
      if (!bias || dPos) bias = dPos >= 0 ? 1 : -1;

      if (!$head.parent.inlineContent) {
        var found = Selection.findFrom($head, bias, true) || Selection.findFrom($head, -bias, true);
        if (found) $head = found.$head;else return Selection.near($head, bias);
      }

      if (!$anchor.parent.inlineContent) {
        if (dPos == 0) {
          $anchor = $head;
        } else {
          $anchor = (Selection.findFrom($anchor, -bias, true) || Selection.findFrom($anchor, bias, true)).$anchor;
          if ($anchor.pos < $head.pos != dPos < 0) $anchor = $head;
        }
      }

      return new TextSelection($anchor, $head);
    }
  }]);

  return TextSelection;
}(Selection);

Selection.jsonID("text", TextSelection);

var TextBookmark = function () {
  function TextBookmark(anchor, head) {
    _classCallCheck(this, TextBookmark);

    this.anchor = anchor;
    this.head = head;
  }

  _createClass(TextBookmark, [{
    key: "map",
    value: function map(mapping) {
      return new TextBookmark(mapping.map(this.anchor), mapping.map(this.head));
    }
  }, {
    key: "resolve",
    value: function resolve(doc) {
      return TextSelection.between(doc.resolve(this.anchor), doc.resolve(this.head));
    }
  }]);

  return TextBookmark;
}();

var NodeSelection = function (_Selection2) {
  _inherits(NodeSelection, _Selection2);

  var _super2 = _createSuper(NodeSelection);

  function NodeSelection($pos) {
    var _this;

    _classCallCheck(this, NodeSelection);

    var node = $pos.nodeAfter;
    var $end = $pos.node(0).resolve($pos.pos + node.nodeSize);
    _this = _super2.call(this, $pos, $end);
    _this.node = node;
    return _this;
  }

  _createClass(NodeSelection, [{
    key: "map",
    value: function map(doc, mapping) {
      var _mapping$mapResult = mapping.mapResult(this.anchor),
          deleted = _mapping$mapResult.deleted,
          pos = _mapping$mapResult.pos;

      var $pos = doc.resolve(pos);
      if (deleted) return Selection.near($pos);
      return new NodeSelection($pos);
    }
  }, {
    key: "content",
    value: function content() {
      return new prosemirrorModel.Slice(prosemirrorModel.Fragment.from(this.node), 0, 0);
    }
  }, {
    key: "eq",
    value: function eq(other) {
      return other instanceof NodeSelection && other.anchor == this.anchor;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return {
        type: "node",
        anchor: this.anchor
      };
    }
  }, {
    key: "getBookmark",
    value: function getBookmark() {
      return new NodeBookmark(this.anchor);
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(doc, json) {
      if (typeof json.anchor != "number") throw new RangeError("Invalid input for NodeSelection.fromJSON");
      return new NodeSelection(doc.resolve(json.anchor));
    }
  }, {
    key: "create",
    value: function create(doc, from) {
      return new NodeSelection(doc.resolve(from));
    }
  }, {
    key: "isSelectable",
    value: function isSelectable(node) {
      return !node.isText && node.type.spec.selectable !== false;
    }
  }]);

  return NodeSelection;
}(Selection);

NodeSelection.prototype.visible = false;
Selection.jsonID("node", NodeSelection);

var NodeBookmark = function () {
  function NodeBookmark(anchor) {
    _classCallCheck(this, NodeBookmark);

    this.anchor = anchor;
  }

  _createClass(NodeBookmark, [{
    key: "map",
    value: function map(mapping) {
      var _mapping$mapResult2 = mapping.mapResult(this.anchor),
          deleted = _mapping$mapResult2.deleted,
          pos = _mapping$mapResult2.pos;

      return deleted ? new TextBookmark(pos, pos) : new NodeBookmark(pos);
    }
  }, {
    key: "resolve",
    value: function resolve(doc) {
      var $pos = doc.resolve(this.anchor),
          node = $pos.nodeAfter;
      if (node && NodeSelection.isSelectable(node)) return new NodeSelection($pos);
      return Selection.near($pos);
    }
  }]);

  return NodeBookmark;
}();

var AllSelection = function (_Selection3) {
  _inherits(AllSelection, _Selection3);

  var _super3 = _createSuper(AllSelection);

  function AllSelection(doc) {
    _classCallCheck(this, AllSelection);

    return _super3.call(this, doc.resolve(0), doc.resolve(doc.content.size));
  }

  _createClass(AllSelection, [{
    key: "replace",
    value: function replace(tr) {
      var content = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : prosemirrorModel.Slice.empty;

      if (content == prosemirrorModel.Slice.empty) {
        tr["delete"](0, tr.doc.content.size);
        var sel = Selection.atStart(tr.doc);
        if (!sel.eq(tr.selection)) tr.setSelection(sel);
      } else {
        _get(_getPrototypeOf(AllSelection.prototype), "replace", this).call(this, tr, content);
      }
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return {
        type: "all"
      };
    }
  }, {
    key: "map",
    value: function map(doc) {
      return new AllSelection(doc);
    }
  }, {
    key: "eq",
    value: function eq(other) {
      return other instanceof AllSelection;
    }
  }, {
    key: "getBookmark",
    value: function getBookmark() {
      return AllBookmark;
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(doc) {
      return new AllSelection(doc);
    }
  }]);

  return AllSelection;
}(Selection);

Selection.jsonID("all", AllSelection);
var AllBookmark = {
  map: function map() {
    return this;
  },
  resolve: function resolve(doc) {
    return new AllSelection(doc);
  }
};

function findSelectionIn(doc, node, pos, index, dir) {
  var text = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
  if (node.inlineContent) return TextSelection.create(doc, pos);

  for (var i = index - (dir > 0 ? 0 : 1); dir > 0 ? i < node.childCount : i >= 0; i += dir) {
    var child = node.child(i);

    if (!child.isAtom) {
      var inner = findSelectionIn(doc, child, pos + dir, dir < 0 ? child.childCount : 0, dir, text);
      if (inner) return inner;
    } else if (!text && NodeSelection.isSelectable(child)) {
      return NodeSelection.create(doc, pos - (dir < 0 ? child.nodeSize : 0));
    }

    pos += child.nodeSize * dir;
  }

  return null;
}

function selectionToInsertionEnd(tr, startLen, bias) {
  var last = tr.steps.length - 1;
  if (last < startLen) return;
  var step = tr.steps[last];
  if (!(step instanceof prosemirrorTransform.ReplaceStep || step instanceof prosemirrorTransform.ReplaceAroundStep)) return;
  var map = tr.mapping.maps[last],
      end;
  map.forEach(function (_from, _to, _newFrom, newTo) {
    if (end == null) end = newTo;
  });
  tr.setSelection(Selection.near(tr.doc.resolve(end), bias));
}

var UPDATED_SEL = 1,
    UPDATED_MARKS = 2,
    UPDATED_SCROLL = 4;

var Transaction = function (_prosemirrorTransform) {
  _inherits(Transaction, _prosemirrorTransform);

  var _super4 = _createSuper(Transaction);

  function Transaction(state) {
    var _this2;

    _classCallCheck(this, Transaction);

    _this2 = _super4.call(this, state.doc);
    _this2.curSelectionFor = 0;
    _this2.updated = 0;
    _this2.meta = Object.create(null);
    _this2.time = Date.now();
    _this2.curSelection = state.selection;
    _this2.storedMarks = state.storedMarks;
    return _this2;
  }

  _createClass(Transaction, [{
    key: "selection",
    get: function get() {
      if (this.curSelectionFor < this.steps.length) {
        this.curSelection = this.curSelection.map(this.doc, this.mapping.slice(this.curSelectionFor));
        this.curSelectionFor = this.steps.length;
      }

      return this.curSelection;
    }
  }, {
    key: "setSelection",
    value: function setSelection(selection) {
      if (selection.$from.doc != this.doc) throw new RangeError("Selection passed to setSelection must point at the current document");
      this.curSelection = selection;
      this.curSelectionFor = this.steps.length;
      this.updated = (this.updated | UPDATED_SEL) & ~UPDATED_MARKS;
      this.storedMarks = null;
      return this;
    }
  }, {
    key: "selectionSet",
    get: function get() {
      return (this.updated & UPDATED_SEL) > 0;
    }
  }, {
    key: "setStoredMarks",
    value: function setStoredMarks(marks) {
      this.storedMarks = marks;
      this.updated |= UPDATED_MARKS;
      return this;
    }
  }, {
    key: "ensureMarks",
    value: function ensureMarks(marks) {
      if (!prosemirrorModel.Mark.sameSet(this.storedMarks || this.selection.$from.marks(), marks)) this.setStoredMarks(marks);
      return this;
    }
  }, {
    key: "addStoredMark",
    value: function addStoredMark(mark) {
      return this.ensureMarks(mark.addToSet(this.storedMarks || this.selection.$head.marks()));
    }
  }, {
    key: "removeStoredMark",
    value: function removeStoredMark(mark) {
      return this.ensureMarks(mark.removeFromSet(this.storedMarks || this.selection.$head.marks()));
    }
  }, {
    key: "storedMarksSet",
    get: function get() {
      return (this.updated & UPDATED_MARKS) > 0;
    }
  }, {
    key: "addStep",
    value: function addStep(step, doc) {
      _get(_getPrototypeOf(Transaction.prototype), "addStep", this).call(this, step, doc);

      this.updated = this.updated & ~UPDATED_MARKS;
      this.storedMarks = null;
    }
  }, {
    key: "setTime",
    value: function setTime(time) {
      this.time = time;
      return this;
    }
  }, {
    key: "replaceSelection",
    value: function replaceSelection(slice) {
      this.selection.replace(this, slice);
      return this;
    }
  }, {
    key: "replaceSelectionWith",
    value: function replaceSelectionWith(node) {
      var inheritMarks = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var selection = this.selection;
      if (inheritMarks) node = node.mark(this.storedMarks || (selection.empty ? selection.$from.marks() : selection.$from.marksAcross(selection.$to) || prosemirrorModel.Mark.none));
      selection.replaceWith(this, node);
      return this;
    }
  }, {
    key: "deleteSelection",
    value: function deleteSelection() {
      this.selection.replace(this);
      return this;
    }
  }, {
    key: "insertText",
    value: function insertText(text, from, to) {
      var schema = this.doc.type.schema;

      if (from == null) {
        if (!text) return this.deleteSelection();
        return this.replaceSelectionWith(schema.text(text), true);
      } else {
        if (to == null) to = from;
        to = to == null ? from : to;
        if (!text) return this.deleteRange(from, to);
        var marks = this.storedMarks;

        if (!marks) {
          var $from = this.doc.resolve(from);
          marks = to == from ? $from.marks() : $from.marksAcross(this.doc.resolve(to));
        }

        this.replaceRangeWith(from, to, schema.text(text, marks));
        if (!this.selection.empty) this.setSelection(Selection.near(this.selection.$to));
        return this;
      }
    }
  }, {
    key: "setMeta",
    value: function setMeta(key, value) {
      this.meta[typeof key == "string" ? key : key.key] = value;
      return this;
    }
  }, {
    key: "getMeta",
    value: function getMeta(key) {
      return this.meta[typeof key == "string" ? key : key.key];
    }
  }, {
    key: "isGeneric",
    get: function get() {
      for (var _ in this.meta) {
        return false;
      }

      return true;
    }
  }, {
    key: "scrollIntoView",
    value: function scrollIntoView() {
      this.updated |= UPDATED_SCROLL;
      return this;
    }
  }, {
    key: "scrolledIntoView",
    get: function get() {
      return (this.updated & UPDATED_SCROLL) > 0;
    }
  }]);

  return Transaction;
}(prosemirrorTransform.Transform);

function bind(f, self) {
  return !self || !f ? f : f.bind(self);
}

var FieldDesc = _createClass(function FieldDesc(name, desc, self) {
  _classCallCheck(this, FieldDesc);

  this.name = name;
  this.init = bind(desc.init, self);
  this.apply = bind(desc.apply, self);
});

var baseFields = [new FieldDesc("doc", {
  init: function init(config) {
    return config.doc || config.schema.topNodeType.createAndFill();
  },
  apply: function apply(tr) {
    return tr.doc;
  }
}), new FieldDesc("selection", {
  init: function init(config, instance) {
    return config.selection || Selection.atStart(instance.doc);
  },
  apply: function apply(tr) {
    return tr.selection;
  }
}), new FieldDesc("storedMarks", {
  init: function init(config) {
    return config.storedMarks || null;
  },
  apply: function apply(tr, _marks, _old, state) {
    return state.selection.$cursor ? tr.storedMarks : null;
  }
}), new FieldDesc("scrollToSelection", {
  init: function init() {
    return 0;
  },
  apply: function apply(tr, prev) {
    return tr.scrolledIntoView ? prev + 1 : prev;
  }
})];

var Configuration = _createClass(function Configuration(schema, plugins) {
  var _this3 = this;

  _classCallCheck(this, Configuration);

  this.schema = schema;
  this.plugins = [];
  this.pluginsByKey = Object.create(null);
  this.fields = baseFields.slice();
  if (plugins) plugins.forEach(function (plugin) {
    if (_this3.pluginsByKey[plugin.key]) throw new RangeError("Adding different instances of a keyed plugin (" + plugin.key + ")");

    _this3.plugins.push(plugin);

    _this3.pluginsByKey[plugin.key] = plugin;
    if (plugin.spec.state) _this3.fields.push(new FieldDesc(plugin.key, plugin.spec.state, plugin));
  });
});

var EditorState = function () {
  function EditorState(config) {
    _classCallCheck(this, EditorState);

    this.config = config;
  }

  _createClass(EditorState, [{
    key: "schema",
    get: function get() {
      return this.config.schema;
    }
  }, {
    key: "plugins",
    get: function get() {
      return this.config.plugins;
    }
  }, {
    key: "apply",
    value: function apply(tr) {
      return this.applyTransaction(tr).state;
    }
  }, {
    key: "filterTransaction",
    value: function filterTransaction(tr) {
      var ignore = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;

      for (var i = 0; i < this.config.plugins.length; i++) {
        if (i != ignore) {
          var plugin = this.config.plugins[i];
          if (plugin.spec.filterTransaction && !plugin.spec.filterTransaction.call(plugin, tr, this)) return false;
        }
      }

      return true;
    }
  }, {
    key: "applyTransaction",
    value: function applyTransaction(rootTr) {
      if (!this.filterTransaction(rootTr)) return {
        state: this,
        transactions: []
      };
      var trs = [rootTr],
          newState = this.applyInner(rootTr),
          seen = null;

      for (;;) {
        var haveNew = false;

        for (var i = 0; i < this.config.plugins.length; i++) {
          var plugin = this.config.plugins[i];

          if (plugin.spec.appendTransaction) {
            var n = seen ? seen[i].n : 0,
                oldState = seen ? seen[i].state : this;
            var tr = n < trs.length && plugin.spec.appendTransaction.call(plugin, n ? trs.slice(n) : trs, oldState, newState);

            if (tr && newState.filterTransaction(tr, i)) {
              tr.setMeta("appendedTransaction", rootTr);

              if (!seen) {
                seen = [];

                for (var j = 0; j < this.config.plugins.length; j++) {
                  seen.push(j < i ? {
                    state: newState,
                    n: trs.length
                  } : {
                    state: this,
                    n: 0
                  });
                }
              }

              trs.push(tr);
              newState = newState.applyInner(tr);
              haveNew = true;
            }

            if (seen) seen[i] = {
              state: newState,
              n: trs.length
            };
          }
        }

        if (!haveNew) return {
          state: newState,
          transactions: trs
        };
      }
    }
  }, {
    key: "applyInner",
    value: function applyInner(tr) {
      if (!tr.before.eq(this.doc)) throw new RangeError("Applying a mismatched transaction");
      var newInstance = new EditorState(this.config),
          fields = this.config.fields;

      for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        newInstance[field.name] = field.apply(tr, this[field.name], this, newInstance);
      }

      return newInstance;
    }
  }, {
    key: "tr",
    get: function get() {
      return new Transaction(this);
    }
  }, {
    key: "reconfigure",
    value: function reconfigure(config) {
      var $config = new Configuration(this.schema, config.plugins);
      var fields = $config.fields,
          instance = new EditorState($config);

      for (var i = 0; i < fields.length; i++) {
        var name = fields[i].name;
        instance[name] = this.hasOwnProperty(name) ? this[name] : fields[i].init(config, instance);
      }

      return instance;
    }
  }, {
    key: "toJSON",
    value: function toJSON(pluginFields) {
      var result = {
        doc: this.doc.toJSON(),
        selection: this.selection.toJSON()
      };
      if (this.storedMarks) result.storedMarks = this.storedMarks.map(function (m) {
        return m.toJSON();
      });
      if (pluginFields && _typeof(pluginFields) == 'object') for (var prop in pluginFields) {
        if (prop == "doc" || prop == "selection") throw new RangeError("The JSON fields `doc` and `selection` are reserved");
        var plugin = pluginFields[prop],
            state = plugin.spec.state;
        if (state && state.toJSON) result[prop] = state.toJSON.call(plugin, this[plugin.key]);
      }
      return result;
    }
  }], [{
    key: "create",
    value: function create(config) {
      var $config = new Configuration(config.doc ? config.doc.type.schema : config.schema, config.plugins);
      var instance = new EditorState($config);

      for (var i = 0; i < $config.fields.length; i++) {
        instance[$config.fields[i].name] = $config.fields[i].init(config, instance);
      }

      return instance;
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(config, json, pluginFields) {
      if (!json) throw new RangeError("Invalid input for EditorState.fromJSON");
      if (!config.schema) throw new RangeError("Required config field 'schema' missing");
      var $config = new Configuration(config.schema, config.plugins);
      var instance = new EditorState($config);
      $config.fields.forEach(function (field) {
        if (field.name == "doc") {
          instance.doc = prosemirrorModel.Node.fromJSON(config.schema, json.doc);
        } else if (field.name == "selection") {
          instance.selection = Selection.fromJSON(instance.doc, json.selection);
        } else if (field.name == "storedMarks") {
          if (json.storedMarks) instance.storedMarks = json.storedMarks.map(config.schema.markFromJSON);
        } else {
          if (pluginFields) for (var prop in pluginFields) {
            var plugin = pluginFields[prop],
                state = plugin.spec.state;

            if (plugin.key == field.name && state && state.fromJSON && Object.prototype.hasOwnProperty.call(json, prop)) {
              instance[field.name] = state.fromJSON.call(plugin, config, json[prop], instance);
              return;
            }
          }
          instance[field.name] = field.init(config, instance);
        }
      });
      return instance;
    }
  }]);

  return EditorState;
}();

function bindProps(obj, self, target) {
  for (var prop in obj) {
    var val = obj[prop];
    if (val instanceof Function) val = val.bind(self);else if (prop == "handleDOMEvents") val = bindProps(val, self, {});
    target[prop] = val;
  }

  return target;
}

var Plugin = function () {
  function Plugin(spec) {
    _classCallCheck(this, Plugin);

    this.spec = spec;
    this.props = {};
    if (spec.props) bindProps(spec.props, this, this.props);
    this.key = spec.key ? spec.key.key : createKey("plugin");
  }

  _createClass(Plugin, [{
    key: "getState",
    value: function getState(state) {
      return state[this.key];
    }
  }]);

  return Plugin;
}();

var keys = Object.create(null);

function createKey(name) {
  if (name in keys) return name + "$" + ++keys[name];
  keys[name] = 0;
  return name + "$";
}

var PluginKey = function () {
  function PluginKey() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "key";

    _classCallCheck(this, PluginKey);

    this.key = createKey(name);
  }

  _createClass(PluginKey, [{
    key: "get",
    value: function get(state) {
      return state.config.pluginsByKey[this.key];
    }
  }, {
    key: "getState",
    value: function getState(state) {
      return state[this.key];
    }
  }]);

  return PluginKey;
}();

exports.AllSelection = AllSelection;
exports.EditorState = EditorState;
exports.NodeSelection = NodeSelection;
exports.Plugin = Plugin;
exports.PluginKey = PluginKey;
exports.Selection = Selection;
exports.SelectionRange = SelectionRange;
exports.TextSelection = TextSelection;
exports.Transaction = Transaction;

},{"prosemirror-model":12,"prosemirror-transform":16}],16:[function(require,module,exports){
'use strict';

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function _construct(Parent, args, Class) { if (_isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

Object.defineProperty(exports, '__esModule', {
  value: true
});

var prosemirrorModel = require('prosemirror-model');

var lower16 = 0xffff;
var factor16 = Math.pow(2, 16);

function makeRecover(index, offset) {
  return index + offset * factor16;
}

function recoverIndex(value) {
  return value & lower16;
}

function recoverOffset(value) {
  return (value - (value & lower16)) / factor16;
}

var DEL_BEFORE = 1,
    DEL_AFTER = 2,
    DEL_ACROSS = 4,
    DEL_SIDE = 8;

var MapResult = function () {
  function MapResult(pos, delInfo, recover) {
    _classCallCheck(this, MapResult);

    this.pos = pos;
    this.delInfo = delInfo;
    this.recover = recover;
  }

  _createClass(MapResult, [{
    key: "deleted",
    get: function get() {
      return (this.delInfo & DEL_SIDE) > 0;
    }
  }, {
    key: "deletedBefore",
    get: function get() {
      return (this.delInfo & (DEL_BEFORE | DEL_ACROSS)) > 0;
    }
  }, {
    key: "deletedAfter",
    get: function get() {
      return (this.delInfo & (DEL_AFTER | DEL_ACROSS)) > 0;
    }
  }, {
    key: "deletedAcross",
    get: function get() {
      return (this.delInfo & DEL_ACROSS) > 0;
    }
  }]);

  return MapResult;
}();

var StepMap = function () {
  function StepMap(ranges) {
    var inverted = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    _classCallCheck(this, StepMap);

    this.ranges = ranges;
    this.inverted = inverted;
    if (!ranges.length && StepMap.empty) return StepMap.empty;
  }

  _createClass(StepMap, [{
    key: "recover",
    value: function recover(value) {
      var diff = 0,
          index = recoverIndex(value);
      if (!this.inverted) for (var i = 0; i < index; i++) {
        diff += this.ranges[i * 3 + 2] - this.ranges[i * 3 + 1];
      }
      return this.ranges[index * 3] + diff + recoverOffset(value);
    }
  }, {
    key: "mapResult",
    value: function mapResult(pos) {
      var assoc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      return this._map(pos, assoc, false);
    }
  }, {
    key: "map",
    value: function map(pos) {
      var assoc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      return this._map(pos, assoc, true);
    }
  }, {
    key: "_map",
    value: function _map(pos, assoc, simple) {
      var diff = 0,
          oldIndex = this.inverted ? 2 : 1,
          newIndex = this.inverted ? 1 : 2;

      for (var i = 0; i < this.ranges.length; i += 3) {
        var start = this.ranges[i] - (this.inverted ? diff : 0);
        if (start > pos) break;
        var oldSize = this.ranges[i + oldIndex],
            newSize = this.ranges[i + newIndex],
            end = start + oldSize;

        if (pos <= end) {
          var side = !oldSize ? assoc : pos == start ? -1 : pos == end ? 1 : assoc;
          var result = start + diff + (side < 0 ? 0 : newSize);
          if (simple) return result;
          var recover = pos == (assoc < 0 ? start : end) ? null : makeRecover(i / 3, pos - start);
          var del = pos == start ? DEL_AFTER : pos == end ? DEL_BEFORE : DEL_ACROSS;
          if (assoc < 0 ? pos != start : pos != end) del |= DEL_SIDE;
          return new MapResult(result, del, recover);
        }

        diff += newSize - oldSize;
      }

      return simple ? pos + diff : new MapResult(pos + diff, 0, null);
    }
  }, {
    key: "touches",
    value: function touches(pos, recover) {
      var diff = 0,
          index = recoverIndex(recover);
      var oldIndex = this.inverted ? 2 : 1,
          newIndex = this.inverted ? 1 : 2;

      for (var i = 0; i < this.ranges.length; i += 3) {
        var start = this.ranges[i] - (this.inverted ? diff : 0);
        if (start > pos) break;
        var oldSize = this.ranges[i + oldIndex],
            end = start + oldSize;
        if (pos <= end && i == index * 3) return true;
        diff += this.ranges[i + newIndex] - oldSize;
      }

      return false;
    }
  }, {
    key: "forEach",
    value: function forEach(f) {
      var oldIndex = this.inverted ? 2 : 1,
          newIndex = this.inverted ? 1 : 2;

      for (var i = 0, diff = 0; i < this.ranges.length; i += 3) {
        var start = this.ranges[i],
            oldStart = start - (this.inverted ? diff : 0),
            newStart = start + (this.inverted ? 0 : diff);
        var oldSize = this.ranges[i + oldIndex],
            newSize = this.ranges[i + newIndex];
        f(oldStart, oldStart + oldSize, newStart, newStart + newSize);
        diff += newSize - oldSize;
      }
    }
  }, {
    key: "invert",
    value: function invert() {
      return new StepMap(this.ranges, !this.inverted);
    }
  }, {
    key: "toString",
    value: function toString() {
      return (this.inverted ? "-" : "") + JSON.stringify(this.ranges);
    }
  }], [{
    key: "offset",
    value: function offset(n) {
      return n == 0 ? StepMap.empty : new StepMap(n < 0 ? [0, -n, 0] : [0, 0, n]);
    }
  }]);

  return StepMap;
}();

StepMap.empty = new StepMap([]);

var Mapping = function () {
  function Mapping() {
    var maps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var mirror = arguments.length > 1 ? arguments[1] : undefined;
    var from = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var to = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : maps.length;

    _classCallCheck(this, Mapping);

    this.maps = maps;
    this.mirror = mirror;
    this.from = from;
    this.to = to;
  }

  _createClass(Mapping, [{
    key: "slice",
    value: function slice() {
      var from = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var to = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.maps.length;
      return new Mapping(this.maps, this.mirror, from, to);
    }
  }, {
    key: "copy",
    value: function copy() {
      return new Mapping(this.maps.slice(), this.mirror && this.mirror.slice(), this.from, this.to);
    }
  }, {
    key: "appendMap",
    value: function appendMap(map, mirrors) {
      this.to = this.maps.push(map);
      if (mirrors != null) this.setMirror(this.maps.length - 1, mirrors);
    }
  }, {
    key: "appendMapping",
    value: function appendMapping(mapping) {
      for (var i = 0, startSize = this.maps.length; i < mapping.maps.length; i++) {
        var mirr = mapping.getMirror(i);
        this.appendMap(mapping.maps[i], mirr != null && mirr < i ? startSize + mirr : undefined);
      }
    }
  }, {
    key: "getMirror",
    value: function getMirror(n) {
      if (this.mirror) for (var i = 0; i < this.mirror.length; i++) {
        if (this.mirror[i] == n) return this.mirror[i + (i % 2 ? -1 : 1)];
      }
    }
  }, {
    key: "setMirror",
    value: function setMirror(n, m) {
      if (!this.mirror) this.mirror = [];
      this.mirror.push(n, m);
    }
  }, {
    key: "appendMappingInverted",
    value: function appendMappingInverted(mapping) {
      for (var i = mapping.maps.length - 1, totalSize = this.maps.length + mapping.maps.length; i >= 0; i--) {
        var mirr = mapping.getMirror(i);
        this.appendMap(mapping.maps[i].invert(), mirr != null && mirr > i ? totalSize - mirr - 1 : undefined);
      }
    }
  }, {
    key: "invert",
    value: function invert() {
      var inverse = new Mapping();
      inverse.appendMappingInverted(this);
      return inverse;
    }
  }, {
    key: "map",
    value: function map(pos) {
      var assoc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      if (this.mirror) return this._map(pos, assoc, true);

      for (var i = this.from; i < this.to; i++) {
        pos = this.maps[i].map(pos, assoc);
      }

      return pos;
    }
  }, {
    key: "mapResult",
    value: function mapResult(pos) {
      var assoc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      return this._map(pos, assoc, false);
    }
  }, {
    key: "_map",
    value: function _map(pos, assoc, simple) {
      var delInfo = 0;

      for (var i = this.from; i < this.to; i++) {
        var map = this.maps[i],
            result = map.mapResult(pos, assoc);

        if (result.recover != null) {
          var corr = this.getMirror(i);

          if (corr != null && corr > i && corr < this.to) {
            i = corr;
            pos = this.maps[corr].recover(result.recover);
            continue;
          }
        }

        delInfo |= result.delInfo;
        pos = result.pos;
      }

      return simple ? pos : new MapResult(pos, delInfo, null);
    }
  }]);

  return Mapping;
}();

var stepsByID = Object.create(null);

var Step = function () {
  function Step() {
    _classCallCheck(this, Step);
  }

  _createClass(Step, [{
    key: "getMap",
    value: function getMap() {
      return StepMap.empty;
    }
  }, {
    key: "merge",
    value: function merge(other) {
      return null;
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(schema, json) {
      if (!json || !json.stepType) throw new RangeError("Invalid input for Step.fromJSON");
      var type = stepsByID[json.stepType];
      if (!type) throw new RangeError("No step type ".concat(json.stepType, " defined"));
      return type.fromJSON(schema, json);
    }
  }, {
    key: "jsonID",
    value: function jsonID(id, stepClass) {
      if (id in stepsByID) throw new RangeError("Duplicate use of step JSON ID " + id);
      stepsByID[id] = stepClass;
      stepClass.prototype.jsonID = id;
      return stepClass;
    }
  }]);

  return Step;
}();

var StepResult = function () {
  function StepResult(doc, failed) {
    _classCallCheck(this, StepResult);

    this.doc = doc;
    this.failed = failed;
  }

  _createClass(StepResult, null, [{
    key: "ok",
    value: function ok(doc) {
      return new StepResult(doc, null);
    }
  }, {
    key: "fail",
    value: function fail(message) {
      return new StepResult(null, message);
    }
  }, {
    key: "fromReplace",
    value: function fromReplace(doc, from, to, slice) {
      try {
        return StepResult.ok(doc.replace(from, to, slice));
      } catch (e) {
        if (e instanceof prosemirrorModel.ReplaceError) return StepResult.fail(e.message);
        throw e;
      }
    }
  }]);

  return StepResult;
}();

function mapFragment(fragment, f, parent) {
  var mapped = [];

  for (var i = 0; i < fragment.childCount; i++) {
    var child = fragment.child(i);
    if (child.content.size) child = child.copy(mapFragment(child.content, f, child));
    if (child.isInline) child = f(child, parent, i);
    mapped.push(child);
  }

  return prosemirrorModel.Fragment.fromArray(mapped);
}

var AddMarkStep = function (_Step) {
  _inherits(AddMarkStep, _Step);

  var _super = _createSuper(AddMarkStep);

  function AddMarkStep(from, to, mark) {
    var _this;

    _classCallCheck(this, AddMarkStep);

    _this = _super.call(this);
    _this.from = from;
    _this.to = to;
    _this.mark = mark;
    return _this;
  }

  _createClass(AddMarkStep, [{
    key: "apply",
    value: function apply(doc) {
      var _this2 = this;

      var oldSlice = doc.slice(this.from, this.to),
          $from = doc.resolve(this.from);
      var parent = $from.node($from.sharedDepth(this.to));
      var slice = new prosemirrorModel.Slice(mapFragment(oldSlice.content, function (node, parent) {
        if (!node.isAtom || !parent.type.allowsMarkType(_this2.mark.type)) return node;
        return node.mark(_this2.mark.addToSet(node.marks));
      }, parent), oldSlice.openStart, oldSlice.openEnd);
      return StepResult.fromReplace(doc, this.from, this.to, slice);
    }
  }, {
    key: "invert",
    value: function invert() {
      return new RemoveMarkStep(this.from, this.to, this.mark);
    }
  }, {
    key: "map",
    value: function map(mapping) {
      var from = mapping.mapResult(this.from, 1),
          to = mapping.mapResult(this.to, -1);
      if (from.deleted && to.deleted || from.pos >= to.pos) return null;
      return new AddMarkStep(from.pos, to.pos, this.mark);
    }
  }, {
    key: "merge",
    value: function merge(other) {
      if (other instanceof AddMarkStep && other.mark.eq(this.mark) && this.from <= other.to && this.to >= other.from) return new AddMarkStep(Math.min(this.from, other.from), Math.max(this.to, other.to), this.mark);
      return null;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return {
        stepType: "addMark",
        mark: this.mark.toJSON(),
        from: this.from,
        to: this.to
      };
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number") throw new RangeError("Invalid input for AddMarkStep.fromJSON");
      return new AddMarkStep(json.from, json.to, schema.markFromJSON(json.mark));
    }
  }]);

  return AddMarkStep;
}(Step);

Step.jsonID("addMark", AddMarkStep);

var RemoveMarkStep = function (_Step2) {
  _inherits(RemoveMarkStep, _Step2);

  var _super2 = _createSuper(RemoveMarkStep);

  function RemoveMarkStep(from, to, mark) {
    var _this3;

    _classCallCheck(this, RemoveMarkStep);

    _this3 = _super2.call(this);
    _this3.from = from;
    _this3.to = to;
    _this3.mark = mark;
    return _this3;
  }

  _createClass(RemoveMarkStep, [{
    key: "apply",
    value: function apply(doc) {
      var _this4 = this;

      var oldSlice = doc.slice(this.from, this.to);
      var slice = new prosemirrorModel.Slice(mapFragment(oldSlice.content, function (node) {
        return node.mark(_this4.mark.removeFromSet(node.marks));
      }, doc), oldSlice.openStart, oldSlice.openEnd);
      return StepResult.fromReplace(doc, this.from, this.to, slice);
    }
  }, {
    key: "invert",
    value: function invert() {
      return new AddMarkStep(this.from, this.to, this.mark);
    }
  }, {
    key: "map",
    value: function map(mapping) {
      var from = mapping.mapResult(this.from, 1),
          to = mapping.mapResult(this.to, -1);
      if (from.deleted && to.deleted || from.pos >= to.pos) return null;
      return new RemoveMarkStep(from.pos, to.pos, this.mark);
    }
  }, {
    key: "merge",
    value: function merge(other) {
      if (other instanceof RemoveMarkStep && other.mark.eq(this.mark) && this.from <= other.to && this.to >= other.from) return new RemoveMarkStep(Math.min(this.from, other.from), Math.max(this.to, other.to), this.mark);
      return null;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return {
        stepType: "removeMark",
        mark: this.mark.toJSON(),
        from: this.from,
        to: this.to
      };
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number") throw new RangeError("Invalid input for RemoveMarkStep.fromJSON");
      return new RemoveMarkStep(json.from, json.to, schema.markFromJSON(json.mark));
    }
  }]);

  return RemoveMarkStep;
}(Step);

Step.jsonID("removeMark", RemoveMarkStep);

var ReplaceStep = function (_Step3) {
  _inherits(ReplaceStep, _Step3);

  var _super3 = _createSuper(ReplaceStep);

  function ReplaceStep(from, to, slice) {
    var _this5;

    var structure = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    _classCallCheck(this, ReplaceStep);

    _this5 = _super3.call(this);
    _this5.from = from;
    _this5.to = to;
    _this5.slice = slice;
    _this5.structure = structure;
    return _this5;
  }

  _createClass(ReplaceStep, [{
    key: "apply",
    value: function apply(doc) {
      if (this.structure && contentBetween(doc, this.from, this.to)) return StepResult.fail("Structure replace would overwrite content");
      return StepResult.fromReplace(doc, this.from, this.to, this.slice);
    }
  }, {
    key: "getMap",
    value: function getMap() {
      return new StepMap([this.from, this.to - this.from, this.slice.size]);
    }
  }, {
    key: "invert",
    value: function invert(doc) {
      return new ReplaceStep(this.from, this.from + this.slice.size, doc.slice(this.from, this.to));
    }
  }, {
    key: "map",
    value: function map(mapping) {
      var from = mapping.mapResult(this.from, 1),
          to = mapping.mapResult(this.to, -1);
      if (from.deletedAcross && to.deletedAcross) return null;
      return new ReplaceStep(from.pos, Math.max(from.pos, to.pos), this.slice);
    }
  }, {
    key: "merge",
    value: function merge(other) {
      if (!(other instanceof ReplaceStep) || other.structure || this.structure) return null;

      if (this.from + this.slice.size == other.from && !this.slice.openEnd && !other.slice.openStart) {
        var slice = this.slice.size + other.slice.size == 0 ? prosemirrorModel.Slice.empty : new prosemirrorModel.Slice(this.slice.content.append(other.slice.content), this.slice.openStart, other.slice.openEnd);
        return new ReplaceStep(this.from, this.to + (other.to - other.from), slice, this.structure);
      } else if (other.to == this.from && !this.slice.openStart && !other.slice.openEnd) {
        var _slice = this.slice.size + other.slice.size == 0 ? prosemirrorModel.Slice.empty : new prosemirrorModel.Slice(other.slice.content.append(this.slice.content), other.slice.openStart, this.slice.openEnd);

        return new ReplaceStep(other.from, this.to, _slice, this.structure);
      } else {
        return null;
      }
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var json = {
        stepType: "replace",
        from: this.from,
        to: this.to
      };
      if (this.slice.size) json.slice = this.slice.toJSON();
      if (this.structure) json.structure = true;
      return json;
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number") throw new RangeError("Invalid input for ReplaceStep.fromJSON");
      return new ReplaceStep(json.from, json.to, prosemirrorModel.Slice.fromJSON(schema, json.slice), !!json.structure);
    }
  }]);

  return ReplaceStep;
}(Step);

Step.jsonID("replace", ReplaceStep);

var ReplaceAroundStep = function (_Step4) {
  _inherits(ReplaceAroundStep, _Step4);

  var _super4 = _createSuper(ReplaceAroundStep);

  function ReplaceAroundStep(from, to, gapFrom, gapTo, slice, insert) {
    var _this6;

    var structure = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;

    _classCallCheck(this, ReplaceAroundStep);

    _this6 = _super4.call(this);
    _this6.from = from;
    _this6.to = to;
    _this6.gapFrom = gapFrom;
    _this6.gapTo = gapTo;
    _this6.slice = slice;
    _this6.insert = insert;
    _this6.structure = structure;
    return _this6;
  }

  _createClass(ReplaceAroundStep, [{
    key: "apply",
    value: function apply(doc) {
      if (this.structure && (contentBetween(doc, this.from, this.gapFrom) || contentBetween(doc, this.gapTo, this.to))) return StepResult.fail("Structure gap-replace would overwrite content");
      var gap = doc.slice(this.gapFrom, this.gapTo);
      if (gap.openStart || gap.openEnd) return StepResult.fail("Gap is not a flat range");
      var inserted = this.slice.insertAt(this.insert, gap.content);
      if (!inserted) return StepResult.fail("Content does not fit in gap");
      return StepResult.fromReplace(doc, this.from, this.to, inserted);
    }
  }, {
    key: "getMap",
    value: function getMap() {
      return new StepMap([this.from, this.gapFrom - this.from, this.insert, this.gapTo, this.to - this.gapTo, this.slice.size - this.insert]);
    }
  }, {
    key: "invert",
    value: function invert(doc) {
      var gap = this.gapTo - this.gapFrom;
      return new ReplaceAroundStep(this.from, this.from + this.slice.size + gap, this.from + this.insert, this.from + this.insert + gap, doc.slice(this.from, this.to).removeBetween(this.gapFrom - this.from, this.gapTo - this.from), this.gapFrom - this.from, this.structure);
    }
  }, {
    key: "map",
    value: function map(mapping) {
      var from = mapping.mapResult(this.from, 1),
          to = mapping.mapResult(this.to, -1);
      var gapFrom = mapping.map(this.gapFrom, -1),
          gapTo = mapping.map(this.gapTo, 1);
      if (from.deletedAcross && to.deletedAcross || gapFrom < from.pos || gapTo > to.pos) return null;
      return new ReplaceAroundStep(from.pos, to.pos, gapFrom, gapTo, this.slice, this.insert, this.structure);
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var json = {
        stepType: "replaceAround",
        from: this.from,
        to: this.to,
        gapFrom: this.gapFrom,
        gapTo: this.gapTo,
        insert: this.insert
      };
      if (this.slice.size) json.slice = this.slice.toJSON();
      if (this.structure) json.structure = true;
      return json;
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number" || typeof json.gapFrom != "number" || typeof json.gapTo != "number" || typeof json.insert != "number") throw new RangeError("Invalid input for ReplaceAroundStep.fromJSON");
      return new ReplaceAroundStep(json.from, json.to, json.gapFrom, json.gapTo, prosemirrorModel.Slice.fromJSON(schema, json.slice), json.insert, !!json.structure);
    }
  }]);

  return ReplaceAroundStep;
}(Step);

Step.jsonID("replaceAround", ReplaceAroundStep);

function contentBetween(doc, from, to) {
  var $from = doc.resolve(from),
      dist = to - from,
      depth = $from.depth;

  while (dist > 0 && depth > 0 && $from.indexAfter(depth) == $from.node(depth).childCount) {
    depth--;
    dist--;
  }

  if (dist > 0) {
    var next = $from.node(depth).maybeChild($from.indexAfter(depth));

    while (dist > 0) {
      if (!next || next.isLeaf) return true;
      next = next.firstChild;
      dist--;
    }
  }

  return false;
}

function _addMark(tr, from, to, mark) {
  var removed = [],
      added = [];
  var removing, adding;
  tr.doc.nodesBetween(from, to, function (node, pos, parent) {
    if (!node.isInline) return;
    var marks = node.marks;

    if (!mark.isInSet(marks) && parent.type.allowsMarkType(mark.type)) {
      var start = Math.max(pos, from),
          end = Math.min(pos + node.nodeSize, to);
      var newSet = mark.addToSet(marks);

      for (var i = 0; i < marks.length; i++) {
        if (!marks[i].isInSet(newSet)) {
          if (removing && removing.to == start && removing.mark.eq(marks[i])) removing.to = end;else removed.push(removing = new RemoveMarkStep(start, end, marks[i]));
        }
      }

      if (adding && adding.to == start) adding.to = end;else added.push(adding = new AddMarkStep(start, end, mark));
    }
  });
  removed.forEach(function (s) {
    return tr.step(s);
  });
  added.forEach(function (s) {
    return tr.step(s);
  });
}

function _removeMark(tr, from, to, mark) {
  var matched = [],
      step = 0;
  tr.doc.nodesBetween(from, to, function (node, pos) {
    if (!node.isInline) return;
    step++;
    var toRemove = null;

    if (mark instanceof prosemirrorModel.MarkType) {
      var set = node.marks,
          found;

      while (found = mark.isInSet(set)) {
        (toRemove || (toRemove = [])).push(found);
        set = found.removeFromSet(set);
      }
    } else if (mark) {
      if (mark.isInSet(node.marks)) toRemove = [mark];
    } else {
      toRemove = node.marks;
    }

    if (toRemove && toRemove.length) {
      var end = Math.min(pos + node.nodeSize, to);

      for (var i = 0; i < toRemove.length; i++) {
        var style = toRemove[i],
            _found = void 0;

        for (var j = 0; j < matched.length; j++) {
          var m = matched[j];
          if (m.step == step - 1 && style.eq(matched[j].style)) _found = m;
        }

        if (_found) {
          _found.to = end;
          _found.step = step;
        } else {
          matched.push({
            style: style,
            from: Math.max(pos, from),
            to: end,
            step: step
          });
        }
      }
    }
  });
  matched.forEach(function (m) {
    return tr.step(new RemoveMarkStep(m.from, m.to, m.style));
  });
}

function _clearIncompatible(tr, pos, parentType) {
  var match = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : parentType.contentMatch;
  var node = tr.doc.nodeAt(pos);
  var delSteps = [],
      cur = pos + 1;

  for (var i = 0; i < node.childCount; i++) {
    var child = node.child(i),
        end = cur + child.nodeSize;
    var allowed = match.matchType(child.type);

    if (!allowed) {
      delSteps.push(new ReplaceStep(cur, end, prosemirrorModel.Slice.empty));
    } else {
      match = allowed;

      for (var j = 0; j < child.marks.length; j++) {
        if (!parentType.allowsMarkType(child.marks[j].type)) tr.step(new RemoveMarkStep(cur, end, child.marks[j]));
      }
    }

    cur = end;
  }

  if (!match.validEnd) {
    var fill = match.fillBefore(prosemirrorModel.Fragment.empty, true);
    tr.replace(cur, cur, new prosemirrorModel.Slice(fill, 0, 0));
  }

  for (var _i = delSteps.length - 1; _i >= 0; _i--) {
    tr.step(delSteps[_i]);
  }
}

function canCut(node, start, end) {
  return (start == 0 || node.canReplace(start, node.childCount)) && (end == node.childCount || node.canReplace(0, end));
}

function liftTarget(range) {
  var parent = range.parent;
  var content = parent.content.cutByIndex(range.startIndex, range.endIndex);

  for (var depth = range.depth;; --depth) {
    var node = range.$from.node(depth);
    var index = range.$from.index(depth),
        endIndex = range.$to.indexAfter(depth);
    if (depth < range.depth && node.canReplace(index, endIndex, content)) return depth;
    if (depth == 0 || node.type.spec.isolating || !canCut(node, index, endIndex)) break;
  }

  return null;
}

function _lift(tr, range, target) {
  var $from = range.$from,
      $to = range.$to,
      depth = range.depth;
  var gapStart = $from.before(depth + 1),
      gapEnd = $to.after(depth + 1);
  var start = gapStart,
      end = gapEnd;
  var before = prosemirrorModel.Fragment.empty,
      openStart = 0;

  for (var d = depth, splitting = false; d > target; d--) {
    if (splitting || $from.index(d) > 0) {
      splitting = true;
      before = prosemirrorModel.Fragment.from($from.node(d).copy(before));
      openStart++;
    } else {
      start--;
    }
  }

  var after = prosemirrorModel.Fragment.empty,
      openEnd = 0;

  for (var _d = depth, _splitting = false; _d > target; _d--) {
    if (_splitting || $to.after(_d + 1) < $to.end(_d)) {
      _splitting = true;
      after = prosemirrorModel.Fragment.from($to.node(_d).copy(after));
      openEnd++;
    } else {
      end++;
    }
  }

  tr.step(new ReplaceAroundStep(start, end, gapStart, gapEnd, new prosemirrorModel.Slice(before.append(after), openStart, openEnd), before.size - openStart, true));
}

function findWrapping(range, nodeType) {
  var attrs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var innerRange = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : range;
  var around = findWrappingOutside(range, nodeType);
  var inner = around && findWrappingInside(innerRange, nodeType);
  if (!inner) return null;
  return around.map(withAttrs).concat({
    type: nodeType,
    attrs: attrs
  }).concat(inner.map(withAttrs));
}

function withAttrs(type) {
  return {
    type: type,
    attrs: null
  };
}

function findWrappingOutside(range, type) {
  var parent = range.parent,
      startIndex = range.startIndex,
      endIndex = range.endIndex;
  var around = parent.contentMatchAt(startIndex).findWrapping(type);
  if (!around) return null;
  var outer = around.length ? around[0] : type;
  return parent.canReplaceWith(startIndex, endIndex, outer) ? around : null;
}

function findWrappingInside(range, type) {
  var parent = range.parent,
      startIndex = range.startIndex,
      endIndex = range.endIndex;
  var inner = parent.child(startIndex);
  var inside = type.contentMatch.findWrapping(inner.type);
  if (!inside) return null;
  var lastType = inside.length ? inside[inside.length - 1] : type;
  var innerMatch = lastType.contentMatch;

  for (var i = startIndex; innerMatch && i < endIndex; i++) {
    innerMatch = innerMatch.matchType(parent.child(i).type);
  }

  if (!innerMatch || !innerMatch.validEnd) return null;
  return inside;
}

function _wrap2(tr, range, wrappers) {
  var content = prosemirrorModel.Fragment.empty;

  for (var i = wrappers.length - 1; i >= 0; i--) {
    if (content.size) {
      var match = wrappers[i].type.contentMatch.matchFragment(content);
      if (!match || !match.validEnd) throw new RangeError("Wrapper type given to Transform.wrap does not form valid content of its parent wrapper");
    }

    content = prosemirrorModel.Fragment.from(wrappers[i].type.create(wrappers[i].attrs, content));
  }

  var start = range.start,
      end = range.end;
  tr.step(new ReplaceAroundStep(start, end, start, end, new prosemirrorModel.Slice(content, 0, 0), wrappers.length, true));
}

function _setBlockType(tr, from, to, type, attrs) {
  if (!type.isTextblock) throw new RangeError("Type given to setBlockType should be a textblock");
  var mapFrom = tr.steps.length;
  tr.doc.nodesBetween(from, to, function (node, pos) {
    if (node.isTextblock && !node.hasMarkup(type, attrs) && canChangeType(tr.doc, tr.mapping.slice(mapFrom).map(pos), type)) {
      tr.clearIncompatible(tr.mapping.slice(mapFrom).map(pos, 1), type);
      var mapping = tr.mapping.slice(mapFrom);
      var startM = mapping.map(pos, 1),
          endM = mapping.map(pos + node.nodeSize, 1);
      tr.step(new ReplaceAroundStep(startM, endM, startM + 1, endM - 1, new prosemirrorModel.Slice(prosemirrorModel.Fragment.from(type.create(attrs, null, node.marks)), 0, 0), 1, true));
      return false;
    }
  });
}

function canChangeType(doc, pos, type) {
  var $pos = doc.resolve(pos),
      index = $pos.index();
  return $pos.parent.canReplaceWith(index, index + 1, type);
}

function _setNodeMarkup(tr, pos, type, attrs, marks) {
  var node = tr.doc.nodeAt(pos);
  if (!node) throw new RangeError("No node at given position");
  if (!type) type = node.type;
  var newNode = type.create(attrs, null, marks || node.marks);
  if (node.isLeaf) return tr.replaceWith(pos, pos + node.nodeSize, newNode);
  if (!type.validContent(node.content)) throw new RangeError("Invalid content for node type " + type.name);
  tr.step(new ReplaceAroundStep(pos, pos + node.nodeSize, pos + 1, pos + node.nodeSize - 1, new prosemirrorModel.Slice(prosemirrorModel.Fragment.from(newNode), 0, 0), 1, true));
}

function canSplit(doc, pos) {
  var depth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
  var typesAfter = arguments.length > 3 ? arguments[3] : undefined;
  var $pos = doc.resolve(pos),
      base = $pos.depth - depth;
  var innerType = typesAfter && typesAfter[typesAfter.length - 1] || $pos.parent;
  if (base < 0 || $pos.parent.type.spec.isolating || !$pos.parent.canReplace($pos.index(), $pos.parent.childCount) || !innerType.type.validContent($pos.parent.content.cutByIndex($pos.index(), $pos.parent.childCount))) return false;

  for (var d = $pos.depth - 1, i = depth - 2; d > base; d--, i--) {
    var node = $pos.node(d),
        _index = $pos.index(d);

    if (node.type.spec.isolating) return false;
    var rest = node.content.cutByIndex(_index, node.childCount);
    var after = typesAfter && typesAfter[i] || node;
    if (after != node) rest = rest.replaceChild(0, after.type.create(after.attrs));
    if (!node.canReplace(_index + 1, node.childCount) || !after.type.validContent(rest)) return false;
  }

  var index = $pos.indexAfter(base);
  var baseType = typesAfter && typesAfter[0];
  return $pos.node(base).canReplaceWith(index, index, baseType ? baseType.type : $pos.node(base + 1).type);
}

function _split(tr, pos) {
  var depth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
  var typesAfter = arguments.length > 3 ? arguments[3] : undefined;
  var $pos = tr.doc.resolve(pos),
      before = prosemirrorModel.Fragment.empty,
      after = prosemirrorModel.Fragment.empty;

  for (var d = $pos.depth, e = $pos.depth - depth, i = depth - 1; d > e; d--, i--) {
    before = prosemirrorModel.Fragment.from($pos.node(d).copy(before));
    var typeAfter = typesAfter && typesAfter[i];
    after = prosemirrorModel.Fragment.from(typeAfter ? typeAfter.type.create(typeAfter.attrs, after) : $pos.node(d).copy(after));
  }

  tr.step(new ReplaceStep(pos, pos, new prosemirrorModel.Slice(before.append(after), depth, depth), true));
}

function canJoin(doc, pos) {
  var $pos = doc.resolve(pos),
      index = $pos.index();
  return joinable($pos.nodeBefore, $pos.nodeAfter) && $pos.parent.canReplace(index, index + 1);
}

function joinable(a, b) {
  return !!(a && b && !a.isLeaf && a.canAppend(b));
}

function joinPoint(doc, pos) {
  var dir = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;
  var $pos = doc.resolve(pos);

  for (var d = $pos.depth;; d--) {
    var before = void 0,
        after = void 0,
        index = $pos.index(d);

    if (d == $pos.depth) {
      before = $pos.nodeBefore;
      after = $pos.nodeAfter;
    } else if (dir > 0) {
      before = $pos.node(d + 1);
      index++;
      after = $pos.node(d).maybeChild(index);
    } else {
      before = $pos.node(d).maybeChild(index - 1);
      after = $pos.node(d + 1);
    }

    if (before && !before.isTextblock && joinable(before, after) && $pos.node(d).canReplace(index, index + 1)) return pos;
    if (d == 0) break;
    pos = dir < 0 ? $pos.before(d) : $pos.after(d);
  }
}

function _join(tr, pos, depth) {
  var step = new ReplaceStep(pos - depth, pos + depth, prosemirrorModel.Slice.empty, true);
  tr.step(step);
}

function insertPoint(doc, pos, nodeType) {
  var $pos = doc.resolve(pos);
  if ($pos.parent.canReplaceWith($pos.index(), $pos.index(), nodeType)) return pos;
  if ($pos.parentOffset == 0) for (var d = $pos.depth - 1; d >= 0; d--) {
    var index = $pos.index(d);
    if ($pos.node(d).canReplaceWith(index, index, nodeType)) return $pos.before(d + 1);
    if (index > 0) return null;
  }
  if ($pos.parentOffset == $pos.parent.content.size) for (var _d2 = $pos.depth - 1; _d2 >= 0; _d2--) {
    var _index2 = $pos.indexAfter(_d2);

    if ($pos.node(_d2).canReplaceWith(_index2, _index2, nodeType)) return $pos.after(_d2 + 1);
    if (_index2 < $pos.node(_d2).childCount) return null;
  }
  return null;
}

function dropPoint(doc, pos, slice) {
  var $pos = doc.resolve(pos);
  if (!slice.content.size) return pos;
  var content = slice.content;

  for (var i = 0; i < slice.openStart; i++) {
    content = content.firstChild.content;
  }

  for (var pass = 1; pass <= (slice.openStart == 0 && slice.size ? 2 : 1); pass++) {
    for (var d = $pos.depth; d >= 0; d--) {
      var bias = d == $pos.depth ? 0 : $pos.pos <= ($pos.start(d + 1) + $pos.end(d + 1)) / 2 ? -1 : 1;
      var insertPos = $pos.index(d) + (bias > 0 ? 1 : 0);
      var parent = $pos.node(d),
          fits = false;

      if (pass == 1) {
        fits = parent.canReplace(insertPos, insertPos, content);
      } else {
        var wrapping = parent.contentMatchAt(insertPos).findWrapping(content.firstChild.type);
        fits = wrapping && parent.canReplaceWith(insertPos, insertPos, wrapping[0]);
      }

      if (fits) return bias == 0 ? $pos.pos : bias < 0 ? $pos.before(d + 1) : $pos.after(d + 1);
    }
  }

  return null;
}

function replaceStep(doc, from) {
  var to = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : from;
  var slice = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : prosemirrorModel.Slice.empty;
  if (from == to && !slice.size) return null;
  var $from = doc.resolve(from),
      $to = doc.resolve(to);
  if (fitsTrivially($from, $to, slice)) return new ReplaceStep(from, to, slice);
  return new Fitter($from, $to, slice).fit();
}

function fitsTrivially($from, $to, slice) {
  return !slice.openStart && !slice.openEnd && $from.start() == $to.start() && $from.parent.canReplace($from.index(), $to.index(), slice.content);
}

var Fitter = function () {
  function Fitter($from, $to, unplaced) {
    _classCallCheck(this, Fitter);

    this.$from = $from;
    this.$to = $to;
    this.unplaced = unplaced;
    this.frontier = [];
    this.placed = prosemirrorModel.Fragment.empty;

    for (var i = 0; i <= $from.depth; i++) {
      var node = $from.node(i);
      this.frontier.push({
        type: node.type,
        match: node.contentMatchAt($from.indexAfter(i))
      });
    }

    for (var _i2 = $from.depth; _i2 > 0; _i2--) {
      this.placed = prosemirrorModel.Fragment.from($from.node(_i2).copy(this.placed));
    }
  }

  _createClass(Fitter, [{
    key: "depth",
    get: function get() {
      return this.frontier.length - 1;
    }
  }, {
    key: "fit",
    value: function fit() {
      while (this.unplaced.size) {
        var fit = this.findFittable();
        if (fit) this.placeNodes(fit);else this.openMore() || this.dropNode();
      }

      var moveInline = this.mustMoveInline(),
          placedSize = this.placed.size - this.depth - this.$from.depth;
      var $from = this.$from,
          $to = this.close(moveInline < 0 ? this.$to : $from.doc.resolve(moveInline));
      if (!$to) return null;
      var content = this.placed,
          openStart = $from.depth,
          openEnd = $to.depth;

      while (openStart && openEnd && content.childCount == 1) {
        content = content.firstChild.content;
        openStart--;
        openEnd--;
      }

      var slice = new prosemirrorModel.Slice(content, openStart, openEnd);
      if (moveInline > -1) return new ReplaceAroundStep($from.pos, moveInline, this.$to.pos, this.$to.end(), slice, placedSize);
      if (slice.size || $from.pos != this.$to.pos) return new ReplaceStep($from.pos, $to.pos, slice);
      return null;
    }
  }, {
    key: "findFittable",
    value: function findFittable() {
      for (var pass = 1; pass <= 2; pass++) {
        for (var sliceDepth = this.unplaced.openStart; sliceDepth >= 0; sliceDepth--) {
          var fragment = void 0,
              parent = null;

          if (sliceDepth) {
            parent = contentAt(this.unplaced.content, sliceDepth - 1).firstChild;
            fragment = parent.content;
          } else {
            fragment = this.unplaced.content;
          }

          var first = fragment.firstChild;

          for (var frontierDepth = this.depth; frontierDepth >= 0; frontierDepth--) {
            var _this$frontier$fronti = this.frontier[frontierDepth],
                type = _this$frontier$fronti.type,
                match = _this$frontier$fronti.match,
                _wrap = void 0,
                inject = null;

            if (pass == 1 && (first ? match.matchType(first.type) || (inject = match.fillBefore(prosemirrorModel.Fragment.from(first), false)) : parent && type.compatibleContent(parent.type))) return {
              sliceDepth: sliceDepth,
              frontierDepth: frontierDepth,
              parent: parent,
              inject: inject
            };else if (pass == 2 && first && (_wrap = match.findWrapping(first.type))) return {
              sliceDepth: sliceDepth,
              frontierDepth: frontierDepth,
              parent: parent,
              wrap: _wrap
            };
            if (parent && match.matchType(parent.type)) break;
          }
        }
      }
    }
  }, {
    key: "openMore",
    value: function openMore() {
      var _this$unplaced = this.unplaced,
          content = _this$unplaced.content,
          openStart = _this$unplaced.openStart,
          openEnd = _this$unplaced.openEnd;
      var inner = contentAt(content, openStart);
      if (!inner.childCount || inner.firstChild.isLeaf) return false;
      this.unplaced = new prosemirrorModel.Slice(content, openStart + 1, Math.max(openEnd, inner.size + openStart >= content.size - openEnd ? openStart + 1 : 0));
      return true;
    }
  }, {
    key: "dropNode",
    value: function dropNode() {
      var _this$unplaced2 = this.unplaced,
          content = _this$unplaced2.content,
          openStart = _this$unplaced2.openStart,
          openEnd = _this$unplaced2.openEnd;
      var inner = contentAt(content, openStart);

      if (inner.childCount <= 1 && openStart > 0) {
        var openAtEnd = content.size - openStart <= openStart + inner.size;
        this.unplaced = new prosemirrorModel.Slice(dropFromFragment(content, openStart - 1, 1), openStart - 1, openAtEnd ? openStart - 1 : openEnd);
      } else {
        this.unplaced = new prosemirrorModel.Slice(dropFromFragment(content, openStart, 1), openStart, openEnd);
      }
    }
  }, {
    key: "placeNodes",
    value: function placeNodes(_ref) {
      var sliceDepth = _ref.sliceDepth,
          frontierDepth = _ref.frontierDepth,
          parent = _ref.parent,
          inject = _ref.inject,
          wrap = _ref.wrap;

      while (this.depth > frontierDepth) {
        this.closeFrontierNode();
      }

      if (wrap) for (var i = 0; i < wrap.length; i++) {
        this.openFrontierNode(wrap[i]);
      }
      var slice = this.unplaced,
          fragment = parent ? parent.content : slice.content;
      var openStart = slice.openStart - sliceDepth;
      var taken = 0,
          add = [];
      var _this$frontier$fronti2 = this.frontier[frontierDepth],
          match = _this$frontier$fronti2.match,
          type = _this$frontier$fronti2.type;

      if (inject) {
        for (var i = 0; i < inject.childCount; i++) {
          add.push(inject.child(i));
        }

        match = match.matchFragment(inject);
      }

      var openEndCount = fragment.size + sliceDepth - (slice.content.size - slice.openEnd);

      while (taken < fragment.childCount) {
        var next = fragment.child(taken),
            matches = match.matchType(next.type);
        if (!matches) break;
        taken++;

        if (taken > 1 || openStart == 0 || next.content.size) {
          match = matches;
          add.push(closeNodeStart(next.mark(type.allowedMarks(next.marks)), taken == 1 ? openStart : 0, taken == fragment.childCount ? openEndCount : -1));
        }
      }

      var toEnd = taken == fragment.childCount;
      if (!toEnd) openEndCount = -1;
      this.placed = addToFragment(this.placed, frontierDepth, prosemirrorModel.Fragment.from(add));
      this.frontier[frontierDepth].match = match;
      if (toEnd && openEndCount < 0 && parent && parent.type == this.frontier[this.depth].type && this.frontier.length > 1) this.closeFrontierNode();

      for (var _i3 = 0, cur = fragment; _i3 < openEndCount; _i3++) {
        var node = cur.lastChild;
        this.frontier.push({
          type: node.type,
          match: node.contentMatchAt(node.childCount)
        });
        cur = node.content;
      }

      this.unplaced = !toEnd ? new prosemirrorModel.Slice(dropFromFragment(slice.content, sliceDepth, taken), slice.openStart, slice.openEnd) : sliceDepth == 0 ? prosemirrorModel.Slice.empty : new prosemirrorModel.Slice(dropFromFragment(slice.content, sliceDepth - 1, 1), sliceDepth - 1, openEndCount < 0 ? slice.openEnd : sliceDepth - 1);
    }
  }, {
    key: "mustMoveInline",
    value: function mustMoveInline() {
      if (!this.$to.parent.isTextblock) return -1;
      var top = this.frontier[this.depth],
          level;
      if (!top.type.isTextblock || !contentAfterFits(this.$to, this.$to.depth, top.type, top.match, false) || this.$to.depth == this.depth && (level = this.findCloseLevel(this.$to)) && level.depth == this.depth) return -1;
      var depth = this.$to.depth,
          after = this.$to.after(depth);

      while (depth > 1 && after == this.$to.end(--depth)) {
        ++after;
      }

      return after;
    }
  }, {
    key: "findCloseLevel",
    value: function findCloseLevel($to) {
      scan: for (var i = Math.min(this.depth, $to.depth); i >= 0; i--) {
        var _this$frontier$i = this.frontier[i],
            match = _this$frontier$i.match,
            type = _this$frontier$i.type;
        var dropInner = i < $to.depth && $to.end(i + 1) == $to.pos + ($to.depth - (i + 1));
        var fit = contentAfterFits($to, i, type, match, dropInner);
        if (!fit) continue;

        for (var d = i - 1; d >= 0; d--) {
          var _this$frontier$d = this.frontier[d],
              _match = _this$frontier$d.match,
              _type = _this$frontier$d.type;
          var matches = contentAfterFits($to, d, _type, _match, true);
          if (!matches || matches.childCount) continue scan;
        }

        return {
          depth: i,
          fit: fit,
          move: dropInner ? $to.doc.resolve($to.after(i + 1)) : $to
        };
      }
    }
  }, {
    key: "close",
    value: function close($to) {
      var close = this.findCloseLevel($to);
      if (!close) return null;

      while (this.depth > close.depth) {
        this.closeFrontierNode();
      }

      if (close.fit.childCount) this.placed = addToFragment(this.placed, close.depth, close.fit);
      $to = close.move;

      for (var d = close.depth + 1; d <= $to.depth; d++) {
        var node = $to.node(d),
            add = node.type.contentMatch.fillBefore(node.content, true, $to.index(d));
        this.openFrontierNode(node.type, node.attrs, add);
      }

      return $to;
    }
  }, {
    key: "openFrontierNode",
    value: function openFrontierNode(type) {
      var attrs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var content = arguments.length > 2 ? arguments[2] : undefined;
      var top = this.frontier[this.depth];
      top.match = top.match.matchType(type);
      this.placed = addToFragment(this.placed, this.depth, prosemirrorModel.Fragment.from(type.create(attrs, content)));
      this.frontier.push({
        type: type,
        match: type.contentMatch
      });
    }
  }, {
    key: "closeFrontierNode",
    value: function closeFrontierNode() {
      var open = this.frontier.pop();
      var add = open.match.fillBefore(prosemirrorModel.Fragment.empty, true);
      if (add.childCount) this.placed = addToFragment(this.placed, this.frontier.length, add);
    }
  }]);

  return Fitter;
}();

function dropFromFragment(fragment, depth, count) {
  if (depth == 0) return fragment.cutByIndex(count, fragment.childCount);
  return fragment.replaceChild(0, fragment.firstChild.copy(dropFromFragment(fragment.firstChild.content, depth - 1, count)));
}

function addToFragment(fragment, depth, content) {
  if (depth == 0) return fragment.append(content);
  return fragment.replaceChild(fragment.childCount - 1, fragment.lastChild.copy(addToFragment(fragment.lastChild.content, depth - 1, content)));
}

function contentAt(fragment, depth) {
  for (var i = 0; i < depth; i++) {
    fragment = fragment.firstChild.content;
  }

  return fragment;
}

function closeNodeStart(node, openStart, openEnd) {
  if (openStart <= 0) return node;
  var frag = node.content;
  if (openStart > 1) frag = frag.replaceChild(0, closeNodeStart(frag.firstChild, openStart - 1, frag.childCount == 1 ? openEnd - 1 : 0));

  if (openStart > 0) {
    frag = node.type.contentMatch.fillBefore(frag).append(frag);
    if (openEnd <= 0) frag = frag.append(node.type.contentMatch.matchFragment(frag).fillBefore(prosemirrorModel.Fragment.empty, true));
  }

  return node.copy(frag);
}

function contentAfterFits($to, depth, type, match, open) {
  var node = $to.node(depth),
      index = open ? $to.indexAfter(depth) : $to.index(depth);
  if (index == node.childCount && !type.compatibleContent(node.type)) return null;
  var fit = match.fillBefore(node.content, true, index);
  return fit && !invalidMarks(type, node.content, index) ? fit : null;
}

function invalidMarks(type, fragment, start) {
  for (var i = start; i < fragment.childCount; i++) {
    if (!type.allowsMarks(fragment.child(i).marks)) return true;
  }

  return false;
}

function definesContent(type) {
  return type.spec.defining || type.spec.definingForContent;
}

function _replaceRange(tr, from, to, slice) {
  if (!slice.size) return tr.deleteRange(from, to);
  var $from = tr.doc.resolve(from),
      $to = tr.doc.resolve(to);
  if (fitsTrivially($from, $to, slice)) return tr.step(new ReplaceStep(from, to, slice));
  var targetDepths = coveredDepths($from, tr.doc.resolve(to));
  if (targetDepths[targetDepths.length - 1] == 0) targetDepths.pop();
  var preferredTarget = -($from.depth + 1);
  targetDepths.unshift(preferredTarget);

  for (var d = $from.depth, pos = $from.pos - 1; d > 0; d--, pos--) {
    var spec = $from.node(d).type.spec;
    if (spec.defining || spec.definingAsContext || spec.isolating) break;
    if (targetDepths.indexOf(d) > -1) preferredTarget = d;else if ($from.before(d) == pos) targetDepths.splice(1, 0, -d);
  }

  var preferredTargetIndex = targetDepths.indexOf(preferredTarget);
  var leftNodes = [],
      preferredDepth = slice.openStart;

  for (var content = slice.content, i = 0;; i++) {
    var node = content.firstChild;
    leftNodes.push(node);
    if (i == slice.openStart) break;
    content = node.content;
  }

  for (var _d3 = preferredDepth - 1; _d3 >= 0; _d3--) {
    var type = leftNodes[_d3].type,
        def = definesContent(type);
    if (def && $from.node(preferredTargetIndex).type != type) preferredDepth = _d3;else if (def || !type.isTextblock) break;
  }

  for (var j = slice.openStart; j >= 0; j--) {
    var openDepth = (j + preferredDepth + 1) % (slice.openStart + 1);
    var insert = leftNodes[openDepth];
    if (!insert) continue;

    for (var _i4 = 0; _i4 < targetDepths.length; _i4++) {
      var targetDepth = targetDepths[(_i4 + preferredTargetIndex) % targetDepths.length],
          expand = true;

      if (targetDepth < 0) {
        expand = false;
        targetDepth = -targetDepth;
      }

      var parent = $from.node(targetDepth - 1),
          index = $from.index(targetDepth - 1);
      if (parent.canReplaceWith(index, index, insert.type, insert.marks)) return tr.replace($from.before(targetDepth), expand ? $to.after(targetDepth) : to, new prosemirrorModel.Slice(closeFragment(slice.content, 0, slice.openStart, openDepth), openDepth, slice.openEnd));
    }
  }

  var startSteps = tr.steps.length;

  for (var _i5 = targetDepths.length - 1; _i5 >= 0; _i5--) {
    tr.replace(from, to, slice);
    if (tr.steps.length > startSteps) break;
    var depth = targetDepths[_i5];
    if (depth < 0) continue;
    from = $from.before(depth);
    to = $to.after(depth);
  }
}

function closeFragment(fragment, depth, oldOpen, newOpen, parent) {
  if (depth < oldOpen) {
    var first = fragment.firstChild;
    fragment = fragment.replaceChild(0, first.copy(closeFragment(first.content, depth + 1, oldOpen, newOpen, first)));
  }

  if (depth > newOpen) {
    var match = parent.contentMatchAt(0);
    var start = match.fillBefore(fragment).append(fragment);
    fragment = start.append(match.matchFragment(start).fillBefore(prosemirrorModel.Fragment.empty, true));
  }

  return fragment;
}

function _replaceRangeWith(tr, from, to, node) {
  if (!node.isInline && from == to && tr.doc.resolve(from).parent.content.size) {
    var point = insertPoint(tr.doc, from, node.type);
    if (point != null) from = to = point;
  }

  tr.replaceRange(from, to, new prosemirrorModel.Slice(prosemirrorModel.Fragment.from(node), 0, 0));
}

function _deleteRange(tr, from, to) {
  var $from = tr.doc.resolve(from),
      $to = tr.doc.resolve(to);
  var covered = coveredDepths($from, $to);

  for (var i = 0; i < covered.length; i++) {
    var depth = covered[i],
        last = i == covered.length - 1;
    if (last && depth == 0 || $from.node(depth).type.contentMatch.validEnd) return tr["delete"]($from.start(depth), $to.end(depth));
    if (depth > 0 && (last || $from.node(depth - 1).canReplace($from.index(depth - 1), $to.indexAfter(depth - 1)))) return tr["delete"]($from.before(depth), $to.after(depth));
  }

  for (var d = 1; d <= $from.depth && d <= $to.depth; d++) {
    if (from - $from.start(d) == $from.depth - d && to > $from.end(d) && $to.end(d) - to != $to.depth - d) return tr["delete"]($from.before(d), to);
  }

  tr["delete"](from, to);
}

function coveredDepths($from, $to) {
  var result = [],
      minDepth = Math.min($from.depth, $to.depth);

  for (var d = minDepth; d >= 0; d--) {
    var start = $from.start(d);
    if (start < $from.pos - ($from.depth - d) || $to.end(d) > $to.pos + ($to.depth - d) || $from.node(d).type.spec.isolating || $to.node(d).type.spec.isolating) break;
    if (start == $to.start(d) || d == $from.depth && d == $to.depth && $from.parent.inlineContent && $to.parent.inlineContent && d && $to.start(d - 1) == start - 1) result.push(d);
  }

  return result;
}

exports.TransformError = function (_Error) {
  _inherits(_class, _Error);

  var _super5 = _createSuper(_class);

  function _class() {
    _classCallCheck(this, _class);

    return _super5.apply(this, arguments);
  }

  return _createClass(_class);
}(_wrapNativeSuper(Error));

exports.TransformError = function TransformError(message) {
  var err = Error.call(this, message);
  err.__proto__ = TransformError.prototype;
  return err;
};

exports.TransformError.prototype = Object.create(Error.prototype);
exports.TransformError.prototype.constructor = exports.TransformError;
exports.TransformError.prototype.name = "TransformError";

var Transform = function () {
  function Transform(doc) {
    _classCallCheck(this, Transform);

    this.doc = doc;
    this.steps = [];
    this.docs = [];
    this.mapping = new Mapping();
  }

  _createClass(Transform, [{
    key: "before",
    get: function get() {
      return this.docs.length ? this.docs[0] : this.doc;
    }
  }, {
    key: "step",
    value: function step(_step) {
      var result = this.maybeStep(_step);
      if (result.failed) throw new exports.TransformError(result.failed);
      return this;
    }
  }, {
    key: "maybeStep",
    value: function maybeStep(step) {
      var result = step.apply(this.doc);
      if (!result.failed) this.addStep(step, result.doc);
      return result;
    }
  }, {
    key: "docChanged",
    get: function get() {
      return this.steps.length > 0;
    }
  }, {
    key: "addStep",
    value: function addStep(step, doc) {
      this.docs.push(this.doc);
      this.steps.push(step);
      this.mapping.appendMap(step.getMap());
      this.doc = doc;
    }
  }, {
    key: "replace",
    value: function replace(from) {
      var to = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : from;
      var slice = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : prosemirrorModel.Slice.empty;
      var step = replaceStep(this.doc, from, to, slice);
      if (step) this.step(step);
      return this;
    }
  }, {
    key: "replaceWith",
    value: function replaceWith(from, to, content) {
      return this.replace(from, to, new prosemirrorModel.Slice(prosemirrorModel.Fragment.from(content), 0, 0));
    }
  }, {
    key: "delete",
    value: function _delete(from, to) {
      return this.replace(from, to, prosemirrorModel.Slice.empty);
    }
  }, {
    key: "insert",
    value: function insert(pos, content) {
      return this.replaceWith(pos, pos, content);
    }
  }, {
    key: "replaceRange",
    value: function replaceRange(from, to, slice) {
      _replaceRange(this, from, to, slice);

      return this;
    }
  }, {
    key: "replaceRangeWith",
    value: function replaceRangeWith(from, to, node) {
      _replaceRangeWith(this, from, to, node);

      return this;
    }
  }, {
    key: "deleteRange",
    value: function deleteRange(from, to) {
      _deleteRange(this, from, to);

      return this;
    }
  }, {
    key: "lift",
    value: function lift(range, target) {
      _lift(this, range, target);

      return this;
    }
  }, {
    key: "join",
    value: function join(pos) {
      var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

      _join(this, pos, depth);

      return this;
    }
  }, {
    key: "wrap",
    value: function wrap(range, wrappers) {
      _wrap2(this, range, wrappers);

      return this;
    }
  }, {
    key: "setBlockType",
    value: function setBlockType(from) {
      var to = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : from;
      var type = arguments.length > 2 ? arguments[2] : undefined;
      var attrs = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

      _setBlockType(this, from, to, type, attrs);

      return this;
    }
  }, {
    key: "setNodeMarkup",
    value: function setNodeMarkup(pos, type) {
      var attrs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      var marks = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

      _setNodeMarkup(this, pos, type, attrs, marks);

      return this;
    }
  }, {
    key: "split",
    value: function split(pos) {
      var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      var typesAfter = arguments.length > 2 ? arguments[2] : undefined;

      _split(this, pos, depth, typesAfter);

      return this;
    }
  }, {
    key: "addMark",
    value: function addMark(from, to, mark) {
      _addMark(this, from, to, mark);

      return this;
    }
  }, {
    key: "removeMark",
    value: function removeMark(from, to, mark) {
      _removeMark(this, from, to, mark);

      return this;
    }
  }, {
    key: "clearIncompatible",
    value: function clearIncompatible(pos, parentType, match) {
      _clearIncompatible(this, pos, parentType, match);

      return this;
    }
  }]);

  return Transform;
}();

exports.AddMarkStep = AddMarkStep;
exports.MapResult = MapResult;
exports.Mapping = Mapping;
exports.RemoveMarkStep = RemoveMarkStep;
exports.ReplaceAroundStep = ReplaceAroundStep;
exports.ReplaceStep = ReplaceStep;
exports.Step = Step;
exports.StepMap = StepMap;
exports.StepResult = StepResult;
exports.Transform = Transform;
exports.canJoin = canJoin;
exports.canSplit = canSplit;
exports.dropPoint = dropPoint;
exports.findWrapping = findWrapping;
exports.insertPoint = insertPoint;
exports.joinPoint = joinPoint;
exports.liftTarget = liftTarget;
exports.replaceStep = replaceStep;

},{"prosemirror-model":12}],17:[function(require,module,exports){
'use strict';

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _get() { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(arguments.length < 3 ? target : receiver); } return desc.value; }; } return _get.apply(this, arguments); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

Object.defineProperty(exports, '__esModule', {
  value: true
});

var prosemirrorState = require('prosemirror-state');

var prosemirrorModel = require('prosemirror-model');

var prosemirrorTransform = require('prosemirror-transform');

var nav = typeof navigator != "undefined" ? navigator : null;
var doc = typeof document != "undefined" ? document : null;
var agent = nav && nav.userAgent || "";
var ie_edge = /Edge\/(\d+)/.exec(agent);
var ie_upto10 = /MSIE \d/.exec(agent);
var ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(agent);
var ie = !!(ie_upto10 || ie_11up || ie_edge);
var ie_version = ie_upto10 ? document.documentMode : ie_11up ? +ie_11up[1] : ie_edge ? +ie_edge[1] : 0;
var gecko = !ie && /gecko\/(\d+)/i.test(agent);
gecko && +(/Firefox\/(\d+)/.exec(agent) || [0, 0])[1];

var _chrome = !ie && /Chrome\/(\d+)/.exec(agent);

var chrome = !!_chrome;
var chrome_version = _chrome ? +_chrome[1] : 0;
var safari = !ie && !!nav && /Apple Computer/.test(nav.vendor);
var ios = safari && (/Mobile\/\w+/.test(agent) || !!nav && nav.maxTouchPoints > 2);
var mac = ios || (nav ? /Mac/.test(nav.platform) : false);
var android = /Android \d/.test(agent);
var webkit = !!doc && "webkitFontSmoothing" in doc.documentElement.style;
var webkit_version = webkit ? +(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1] : 0;

var domIndex = function domIndex(node) {
  for (var index = 0;; index++) {
    node = node.previousSibling;
    if (!node) return index;
  }
};

var parentNode = function parentNode(node) {
  var parent = node.assignedSlot || node.parentNode;
  return parent && parent.nodeType == 11 ? parent.host : parent;
};

var reusedRange = null;

var textRange = function textRange(node, from, to) {
  var range = reusedRange || (reusedRange = document.createRange());
  range.setEnd(node, to == null ? node.nodeValue.length : to);
  range.setStart(node, from || 0);
  return range;
};

var isEquivalentPosition = function isEquivalentPosition(node, off, targetNode, targetOff) {
  return targetNode && (scanFor(node, off, targetNode, targetOff, -1) || scanFor(node, off, targetNode, targetOff, 1));
};

var atomElements = /^(img|br|input|textarea|hr)$/i;

function scanFor(node, off, targetNode, targetOff, dir) {
  for (;;) {
    if (node == targetNode && off == targetOff) return true;

    if (off == (dir < 0 ? 0 : nodeSize(node))) {
      var parent = node.parentNode;
      if (!parent || parent.nodeType != 1 || hasBlockDesc(node) || atomElements.test(node.nodeName) || node.contentEditable == "false") return false;
      off = domIndex(node) + (dir < 0 ? 0 : 1);
      node = parent;
    } else if (node.nodeType == 1) {
      node = node.childNodes[off + (dir < 0 ? -1 : 0)];
      if (node.contentEditable == "false") return false;
      off = dir < 0 ? nodeSize(node) : 0;
    } else {
      return false;
    }
  }
}

function nodeSize(node) {
  return node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length;
}

function isOnEdge(node, offset, parent) {
  for (var atStart = offset == 0, atEnd = offset == nodeSize(node); atStart || atEnd;) {
    if (node == parent) return true;
    var index = domIndex(node);
    node = node.parentNode;
    if (!node) return false;
    atStart = atStart && index == 0;
    atEnd = atEnd && index == nodeSize(node);
  }
}

function hasBlockDesc(dom) {
  var desc;

  for (var cur = dom; cur; cur = cur.parentNode) {
    if (desc = cur.pmViewDesc) break;
  }

  return desc && desc.node && desc.node.isBlock && (desc.dom == dom || desc.contentDOM == dom);
}

var selectionCollapsed = function selectionCollapsed(domSel) {
  var collapsed = domSel.isCollapsed;
  if (collapsed && chrome && domSel.rangeCount && !domSel.getRangeAt(0).collapsed) collapsed = false;
  return collapsed;
};

function keyEvent(keyCode, key) {
  var event = document.createEvent("Event");
  event.initEvent("keydown", true, true);
  event.keyCode = keyCode;
  event.key = event.code = key;
  return event;
}

function windowRect(doc) {
  return {
    left: 0,
    right: doc.documentElement.clientWidth,
    top: 0,
    bottom: doc.documentElement.clientHeight
  };
}

function getSide(value, side) {
  return typeof value == "number" ? value : value[side];
}

function clientRect(node) {
  var rect = node.getBoundingClientRect();
  var scaleX = rect.width / node.offsetWidth || 1;
  var scaleY = rect.height / node.offsetHeight || 1;
  return {
    left: rect.left,
    right: rect.left + node.clientWidth * scaleX,
    top: rect.top,
    bottom: rect.top + node.clientHeight * scaleY
  };
}

function scrollRectIntoView(view, rect, startDOM) {
  var scrollThreshold = view.someProp("scrollThreshold") || 0,
      scrollMargin = view.someProp("scrollMargin") || 5;
  var doc = view.dom.ownerDocument;

  for (var parent = startDOM || view.dom;; parent = parentNode(parent)) {
    if (!parent) break;
    if (parent.nodeType != 1) continue;
    var elt = parent;
    var atTop = elt == doc.body;
    var bounding = atTop ? windowRect(doc) : clientRect(elt);
    var moveX = 0,
        moveY = 0;
    if (rect.top < bounding.top + getSide(scrollThreshold, "top")) moveY = -(bounding.top - rect.top + getSide(scrollMargin, "top"));else if (rect.bottom > bounding.bottom - getSide(scrollThreshold, "bottom")) moveY = rect.bottom - bounding.bottom + getSide(scrollMargin, "bottom");
    if (rect.left < bounding.left + getSide(scrollThreshold, "left")) moveX = -(bounding.left - rect.left + getSide(scrollMargin, "left"));else if (rect.right > bounding.right - getSide(scrollThreshold, "right")) moveX = rect.right - bounding.right + getSide(scrollMargin, "right");

    if (moveX || moveY) {
      if (atTop) {
        doc.defaultView.scrollBy(moveX, moveY);
      } else {
        var startX = elt.scrollLeft,
            startY = elt.scrollTop;
        if (moveY) elt.scrollTop += moveY;
        if (moveX) elt.scrollLeft += moveX;
        var dX = elt.scrollLeft - startX,
            dY = elt.scrollTop - startY;
        rect = {
          left: rect.left - dX,
          top: rect.top - dY,
          right: rect.right - dX,
          bottom: rect.bottom - dY
        };
      }
    }

    if (atTop) break;
  }
}

function storeScrollPos(view) {
  var rect = view.dom.getBoundingClientRect(),
      startY = Math.max(0, rect.top);
  var refDOM, refTop;

  for (var x = (rect.left + rect.right) / 2, y = startY + 1; y < Math.min(innerHeight, rect.bottom); y += 5) {
    var dom = view.root.elementFromPoint(x, y);
    if (!dom || dom == view.dom || !view.dom.contains(dom)) continue;
    var localRect = dom.getBoundingClientRect();

    if (localRect.top >= startY - 20) {
      refDOM = dom;
      refTop = localRect.top;
      break;
    }
  }

  return {
    refDOM: refDOM,
    refTop: refTop,
    stack: scrollStack(view.dom)
  };
}

function scrollStack(dom) {
  var stack = [],
      doc = dom.ownerDocument;

  for (var cur = dom; cur; cur = parentNode(cur)) {
    stack.push({
      dom: cur,
      top: cur.scrollTop,
      left: cur.scrollLeft
    });
    if (dom == doc) break;
  }

  return stack;
}

function resetScrollPos(_ref) {
  var refDOM = _ref.refDOM,
      refTop = _ref.refTop,
      stack = _ref.stack;
  var newRefTop = refDOM ? refDOM.getBoundingClientRect().top : 0;
  restoreScrollStack(stack, newRefTop == 0 ? 0 : newRefTop - refTop);
}

function restoreScrollStack(stack, dTop) {
  for (var i = 0; i < stack.length; i++) {
    var _stack$i = stack[i],
        dom = _stack$i.dom,
        top = _stack$i.top,
        left = _stack$i.left;
    if (dom.scrollTop != top + dTop) dom.scrollTop = top + dTop;
    if (dom.scrollLeft != left) dom.scrollLeft = left;
  }
}

var preventScrollSupported = null;

function focusPreventScroll(dom) {
  if (dom.setActive) return dom.setActive();
  if (preventScrollSupported) return dom.focus(preventScrollSupported);
  var stored = scrollStack(dom);
  dom.focus(preventScrollSupported == null ? {
    get preventScroll() {
      preventScrollSupported = {
        preventScroll: true
      };
      return true;
    }

  } : undefined);

  if (!preventScrollSupported) {
    preventScrollSupported = false;
    restoreScrollStack(stored, 0);
  }
}

function findOffsetInNode(node, coords) {
  var closest,
      dxClosest = 2e8,
      coordsClosest,
      offset = 0;
  var rowBot = coords.top,
      rowTop = coords.top;

  for (var child = node.firstChild, childIndex = 0; child; child = child.nextSibling, childIndex++) {
    var rects = void 0;
    if (child.nodeType == 1) rects = child.getClientRects();else if (child.nodeType == 3) rects = textRange(child).getClientRects();else continue;

    for (var i = 0; i < rects.length; i++) {
      var rect = rects[i];

      if (rect.top <= rowBot && rect.bottom >= rowTop) {
        rowBot = Math.max(rect.bottom, rowBot);
        rowTop = Math.min(rect.top, rowTop);
        var dx = rect.left > coords.left ? rect.left - coords.left : rect.right < coords.left ? coords.left - rect.right : 0;

        if (dx < dxClosest) {
          closest = child;
          dxClosest = dx;
          coordsClosest = dx && closest.nodeType == 3 ? {
            left: rect.right < coords.left ? rect.right : rect.left,
            top: coords.top
          } : coords;
          if (child.nodeType == 1 && dx) offset = childIndex + (coords.left >= (rect.left + rect.right) / 2 ? 1 : 0);
          continue;
        }
      }

      if (!closest && (coords.left >= rect.right && coords.top >= rect.top || coords.left >= rect.left && coords.top >= rect.bottom)) offset = childIndex + 1;
    }
  }

  if (closest && closest.nodeType == 3) return findOffsetInText(closest, coordsClosest);
  if (!closest || dxClosest && closest.nodeType == 1) return {
    node: node,
    offset: offset
  };
  return findOffsetInNode(closest, coordsClosest);
}

function findOffsetInText(node, coords) {
  var len = node.nodeValue.length;
  var range = document.createRange();

  for (var i = 0; i < len; i++) {
    range.setEnd(node, i + 1);
    range.setStart(node, i);
    var rect = singleRect(range, 1);
    if (rect.top == rect.bottom) continue;
    if (inRect(coords, rect)) return {
      node: node,
      offset: i + (coords.left >= (rect.left + rect.right) / 2 ? 1 : 0)
    };
  }

  return {
    node: node,
    offset: 0
  };
}

function inRect(coords, rect) {
  return coords.left >= rect.left - 1 && coords.left <= rect.right + 1 && coords.top >= rect.top - 1 && coords.top <= rect.bottom + 1;
}

function targetKludge(dom, coords) {
  var parent = dom.parentNode;
  if (parent && /^li$/i.test(parent.nodeName) && coords.left < dom.getBoundingClientRect().left) return parent;
  return dom;
}

function posFromElement(view, elt, coords) {
  var _findOffsetInNode = findOffsetInNode(elt, coords),
      node = _findOffsetInNode.node,
      offset = _findOffsetInNode.offset,
      bias = -1;

  if (node.nodeType == 1 && !node.firstChild) {
    var rect = node.getBoundingClientRect();
    bias = rect.left != rect.right && coords.left > (rect.left + rect.right) / 2 ? 1 : -1;
  }

  return view.docView.posFromDOM(node, offset, bias);
}

function posFromCaret(view, node, offset, coords) {
  var outside = -1;

  for (var cur = node;;) {
    if (cur == view.dom) break;
    var desc = view.docView.nearestDesc(cur, true);
    if (!desc) return null;

    if (desc.node.isBlock && desc.parent) {
      var rect = desc.dom.getBoundingClientRect();
      if (rect.left > coords.left || rect.top > coords.top) outside = desc.posBefore;else if (rect.right < coords.left || rect.bottom < coords.top) outside = desc.posAfter;else break;
    }

    cur = desc.dom.parentNode;
  }

  return outside > -1 ? outside : view.docView.posFromDOM(node, offset, 1);
}

function elementFromPoint(element, coords, box) {
  var len = element.childNodes.length;

  if (len && box.top < box.bottom) {
    for (var startI = Math.max(0, Math.min(len - 1, Math.floor(len * (coords.top - box.top) / (box.bottom - box.top)) - 2)), i = startI;;) {
      var child = element.childNodes[i];

      if (child.nodeType == 1) {
        var rects = child.getClientRects();

        for (var j = 0; j < rects.length; j++) {
          var rect = rects[j];
          if (inRect(coords, rect)) return elementFromPoint(child, coords, rect);
        }
      }

      if ((i = (i + 1) % len) == startI) break;
    }
  }

  return element;
}

function _posAtCoords(view, coords) {
  var doc = view.dom.ownerDocument,
      node,
      offset = 0;

  if (doc.caretPositionFromPoint) {
    try {
      var _pos = doc.caretPositionFromPoint(coords.left, coords.top);

      if (_pos) {
        node = _pos.offsetNode;
        offset = _pos.offset;
      }
    } catch (_) {}
  }

  if (!node && doc.caretRangeFromPoint) {
    var range = doc.caretRangeFromPoint(coords.left, coords.top);

    if (range) {
      node = range.startContainer;
      offset = range.startOffset;
    }
  }

  var elt = (view.root.elementFromPoint ? view.root : doc).elementFromPoint(coords.left, coords.top);
  var pos;

  if (!elt || !view.dom.contains(elt.nodeType != 1 ? elt.parentNode : elt)) {
    var box = view.dom.getBoundingClientRect();
    if (!inRect(coords, box)) return null;
    elt = elementFromPoint(view.dom, coords, box);
    if (!elt) return null;
  }

  if (safari) {
    for (var p = elt; node && p; p = parentNode(p)) {
      if (p.draggable) node = undefined;
    }
  }

  elt = targetKludge(elt, coords);

  if (node) {
    if (gecko && node.nodeType == 1) {
      offset = Math.min(offset, node.childNodes.length);

      if (offset < node.childNodes.length) {
        var next = node.childNodes[offset],
            _box;

        if (next.nodeName == "IMG" && (_box = next.getBoundingClientRect()).right <= coords.left && _box.bottom > coords.top) offset++;
      }
    }

    if (node == view.dom && offset == node.childNodes.length - 1 && node.lastChild.nodeType == 1 && coords.top > node.lastChild.getBoundingClientRect().bottom) pos = view.state.doc.content.size;else if (offset == 0 || node.nodeType != 1 || node.childNodes[offset - 1].nodeName != "BR") pos = posFromCaret(view, node, offset, coords);
  }

  if (pos == null) pos = posFromElement(view, elt, coords);
  var desc = view.docView.nearestDesc(elt, true);
  return {
    pos: pos,
    inside: desc ? desc.posAtStart - desc.border : -1
  };
}

function singleRect(target, bias) {
  var rects = target.getClientRects();
  return !rects.length ? target.getBoundingClientRect() : rects[bias < 0 ? 0 : rects.length - 1];
}

var BIDI = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;

function _coordsAtPos(view, pos, side) {
  var _view$docView$domFrom = view.docView.domFromPos(pos, side < 0 ? -1 : 1),
      node = _view$docView$domFrom.node,
      offset = _view$docView$domFrom.offset,
      atom = _view$docView$domFrom.atom;

  var supportEmptyRange = webkit || gecko;

  if (node.nodeType == 3) {
    if (supportEmptyRange && (BIDI.test(node.nodeValue) || (side < 0 ? !offset : offset == node.nodeValue.length))) {
      var rect = singleRect(textRange(node, offset, offset), side);

      if (gecko && offset && /\s/.test(node.nodeValue[offset - 1]) && offset < node.nodeValue.length) {
        var rectBefore = singleRect(textRange(node, offset - 1, offset - 1), -1);

        if (rectBefore.top == rect.top) {
          var rectAfter = singleRect(textRange(node, offset, offset + 1), -1);
          if (rectAfter.top != rect.top) return flattenV(rectAfter, rectAfter.left < rectBefore.left);
        }
      }

      return rect;
    } else {
      var from = offset,
          to = offset,
          takeSide = side < 0 ? 1 : -1;

      if (side < 0 && !offset) {
        to++;
        takeSide = -1;
      } else if (side >= 0 && offset == node.nodeValue.length) {
        from--;
        takeSide = 1;
      } else if (side < 0) {
        from--;
      } else {
        to++;
      }

      return flattenV(singleRect(textRange(node, from, to), takeSide), takeSide < 0);
    }
  }

  var $dom = view.state.doc.resolve(pos - (atom || 0));

  if (!$dom.parent.inlineContent) {
    if (atom == null && offset && (side < 0 || offset == nodeSize(node))) {
      var before = node.childNodes[offset - 1];
      if (before.nodeType == 1) return flattenH(before.getBoundingClientRect(), false);
    }

    if (atom == null && offset < nodeSize(node)) {
      var after = node.childNodes[offset];
      if (after.nodeType == 1) return flattenH(after.getBoundingClientRect(), true);
    }

    return flattenH(node.getBoundingClientRect(), side >= 0);
  }

  if (atom == null && offset && (side < 0 || offset == nodeSize(node))) {
    var _before = node.childNodes[offset - 1];
    var target = _before.nodeType == 3 ? textRange(_before, nodeSize(_before) - (supportEmptyRange ? 0 : 1)) : _before.nodeType == 1 && (_before.nodeName != "BR" || !_before.nextSibling) ? _before : null;
    if (target) return flattenV(singleRect(target, 1), false);
  }

  if (atom == null && offset < nodeSize(node)) {
    var _after = node.childNodes[offset];

    while (_after.pmViewDesc && _after.pmViewDesc.ignoreForCoords) {
      _after = _after.nextSibling;
    }

    var _target = !_after ? null : _after.nodeType == 3 ? textRange(_after, 0, supportEmptyRange ? 0 : 1) : _after.nodeType == 1 ? _after : null;

    if (_target) return flattenV(singleRect(_target, -1), true);
  }

  return flattenV(singleRect(node.nodeType == 3 ? textRange(node) : node, -side), side >= 0);
}

function flattenV(rect, left) {
  if (rect.width == 0) return rect;
  var x = left ? rect.left : rect.right;
  return {
    top: rect.top,
    bottom: rect.bottom,
    left: x,
    right: x
  };
}

function flattenH(rect, top) {
  if (rect.height == 0) return rect;
  var y = top ? rect.top : rect.bottom;
  return {
    top: y,
    bottom: y,
    left: rect.left,
    right: rect.right
  };
}

function withFlushedState(view, state, f) {
  var viewState = view.state,
      active = view.root.activeElement;
  if (viewState != state) view.updateState(state);
  if (active != view.dom) view.focus();

  try {
    return f();
  } finally {
    if (viewState != state) view.updateState(viewState);
    if (active != view.dom && active) active.focus();
  }
}

function endOfTextblockVertical(view, state, dir) {
  var sel = state.selection;
  var $pos = dir == "up" ? sel.$from : sel.$to;
  return withFlushedState(view, state, function () {
    var _view$docView$domFrom2 = view.docView.domFromPos($pos.pos, dir == "up" ? -1 : 1),
        dom = _view$docView$domFrom2.node;

    for (;;) {
      var nearest = view.docView.nearestDesc(dom, true);
      if (!nearest) break;

      if (nearest.node.isBlock) {
        dom = nearest.dom;
        break;
      }

      dom = nearest.dom.parentNode;
    }

    var coords = _coordsAtPos(view, $pos.pos, 1);

    for (var child = dom.firstChild; child; child = child.nextSibling) {
      var boxes = void 0;
      if (child.nodeType == 1) boxes = child.getClientRects();else if (child.nodeType == 3) boxes = textRange(child, 0, child.nodeValue.length).getClientRects();else continue;

      for (var i = 0; i < boxes.length; i++) {
        var box = boxes[i];
        if (box.bottom > box.top + 1 && (dir == "up" ? coords.top - box.top > (box.bottom - coords.top) * 2 : box.bottom - coords.bottom > (coords.bottom - box.top) * 2)) return false;
      }
    }

    return true;
  });
}

var maybeRTL = /[\u0590-\u08ac]/;

function endOfTextblockHorizontal(view, state, dir) {
  var $head = state.selection.$head;
  if (!$head.parent.isTextblock) return false;
  var offset = $head.parentOffset,
      atStart = !offset,
      atEnd = offset == $head.parent.content.size;
  var sel = view.domSelection();
  if (!maybeRTL.test($head.parent.textContent) || !sel.modify) return dir == "left" || dir == "backward" ? atStart : atEnd;
  return withFlushedState(view, state, function () {
    var oldRange = sel.getRangeAt(0),
        oldNode = sel.focusNode,
        oldOff = sel.focusOffset;
    var oldBidiLevel = sel.caretBidiLevel;
    sel.modify("move", dir, "character");
    var parentDOM = $head.depth ? view.docView.domAfterPos($head.before()) : view.dom;
    var result = !parentDOM.contains(sel.focusNode.nodeType == 1 ? sel.focusNode : sel.focusNode.parentNode) || oldNode == sel.focusNode && oldOff == sel.focusOffset;
    sel.removeAllRanges();
    sel.addRange(oldRange);
    if (oldBidiLevel != null) sel.caretBidiLevel = oldBidiLevel;
    return result;
  });
}

var cachedState = null;
var cachedDir = null;
var cachedResult = false;

function _endOfTextblock(view, state, dir) {
  if (cachedState == state && cachedDir == dir) return cachedResult;
  cachedState = state;
  cachedDir = dir;
  return cachedResult = dir == "up" || dir == "down" ? endOfTextblockVertical(view, state, dir) : endOfTextblockHorizontal(view, state, dir);
}

var NOT_DIRTY = 0,
    CHILD_DIRTY = 1,
    CONTENT_DIRTY = 2,
    NODE_DIRTY = 3;

var ViewDesc = function () {
  function ViewDesc(parent, children, dom, contentDOM) {
    _classCallCheck(this, ViewDesc);

    this.parent = parent;
    this.children = children;
    this.dom = dom;
    this.contentDOM = contentDOM;
    this.dirty = NOT_DIRTY;
    dom.pmViewDesc = this;
  }

  _createClass(ViewDesc, [{
    key: "matchesWidget",
    value: function matchesWidget(widget) {
      return false;
    }
  }, {
    key: "matchesMark",
    value: function matchesMark(mark) {
      return false;
    }
  }, {
    key: "matchesNode",
    value: function matchesNode(node, outerDeco, innerDeco) {
      return false;
    }
  }, {
    key: "matchesHack",
    value: function matchesHack(nodeName) {
      return false;
    }
  }, {
    key: "parseRule",
    value: function parseRule() {
      return null;
    }
  }, {
    key: "stopEvent",
    value: function stopEvent(event) {
      return false;
    }
  }, {
    key: "size",
    get: function get() {
      var size = 0;

      for (var i = 0; i < this.children.length; i++) {
        size += this.children[i].size;
      }

      return size;
    }
  }, {
    key: "border",
    get: function get() {
      return 0;
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.parent = undefined;
      if (this.dom.pmViewDesc == this) this.dom.pmViewDesc = undefined;

      for (var i = 0; i < this.children.length; i++) {
        this.children[i].destroy();
      }
    }
  }, {
    key: "posBeforeChild",
    value: function posBeforeChild(child) {
      for (var i = 0, pos = this.posAtStart;; i++) {
        var cur = this.children[i];
        if (cur == child) return pos;
        pos += cur.size;
      }
    }
  }, {
    key: "posBefore",
    get: function get() {
      return this.parent.posBeforeChild(this);
    }
  }, {
    key: "posAtStart",
    get: function get() {
      return this.parent ? this.parent.posBeforeChild(this) + this.border : 0;
    }
  }, {
    key: "posAfter",
    get: function get() {
      return this.posBefore + this.size;
    }
  }, {
    key: "posAtEnd",
    get: function get() {
      return this.posAtStart + this.size - 2 * this.border;
    }
  }, {
    key: "localPosFromDOM",
    value: function localPosFromDOM(dom, offset, bias) {
      if (this.contentDOM && this.contentDOM.contains(dom.nodeType == 1 ? dom : dom.parentNode)) {
        if (bias < 0) {
          var domBefore, desc;

          if (dom == this.contentDOM) {
            domBefore = dom.childNodes[offset - 1];
          } else {
            while (dom.parentNode != this.contentDOM) {
              dom = dom.parentNode;
            }

            domBefore = dom.previousSibling;
          }

          while (domBefore && !((desc = domBefore.pmViewDesc) && desc.parent == this)) {
            domBefore = domBefore.previousSibling;
          }

          return domBefore ? this.posBeforeChild(desc) + desc.size : this.posAtStart;
        } else {
          var domAfter, _desc;

          if (dom == this.contentDOM) {
            domAfter = dom.childNodes[offset];
          } else {
            while (dom.parentNode != this.contentDOM) {
              dom = dom.parentNode;
            }

            domAfter = dom.nextSibling;
          }

          while (domAfter && !((_desc = domAfter.pmViewDesc) && _desc.parent == this)) {
            domAfter = domAfter.nextSibling;
          }

          return domAfter ? this.posBeforeChild(_desc) : this.posAtEnd;
        }
      }

      var atEnd;

      if (dom == this.dom && this.contentDOM) {
        atEnd = offset > domIndex(this.contentDOM);
      } else if (this.contentDOM && this.contentDOM != this.dom && this.dom.contains(this.contentDOM)) {
        atEnd = dom.compareDocumentPosition(this.contentDOM) & 2;
      } else if (this.dom.firstChild) {
        if (offset == 0) for (var search = dom;; search = search.parentNode) {
          if (search == this.dom) {
            atEnd = false;
            break;
          }

          if (search.previousSibling) break;
        }
        if (atEnd == null && offset == dom.childNodes.length) for (var _search = dom;; _search = _search.parentNode) {
          if (_search == this.dom) {
            atEnd = true;
            break;
          }

          if (_search.nextSibling) break;
        }
      }

      return (atEnd == null ? bias > 0 : atEnd) ? this.posAtEnd : this.posAtStart;
    }
  }, {
    key: "nearestDesc",
    value: function nearestDesc(dom) {
      var onlyNodes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      for (var first = true, cur = dom; cur; cur = cur.parentNode) {
        var desc = this.getDesc(cur),
            nodeDOM = void 0;

        if (desc && (!onlyNodes || desc.node)) {
          if (first && (nodeDOM = desc.nodeDOM) && !(nodeDOM.nodeType == 1 ? nodeDOM.contains(dom.nodeType == 1 ? dom : dom.parentNode) : nodeDOM == dom)) first = false;else return desc;
        }
      }
    }
  }, {
    key: "getDesc",
    value: function getDesc(dom) {
      var desc = dom.pmViewDesc;

      for (var cur = desc; cur; cur = cur.parent) {
        if (cur == this) return desc;
      }
    }
  }, {
    key: "posFromDOM",
    value: function posFromDOM(dom, offset, bias) {
      for (var scan = dom; scan; scan = scan.parentNode) {
        var desc = this.getDesc(scan);
        if (desc) return desc.localPosFromDOM(dom, offset, bias);
      }

      return -1;
    }
  }, {
    key: "descAt",
    value: function descAt(pos) {
      for (var i = 0, offset = 0; i < this.children.length; i++) {
        var child = this.children[i],
            end = offset + child.size;

        if (offset == pos && end != offset) {
          while (!child.border && child.children.length) {
            child = child.children[0];
          }

          return child;
        }

        if (pos < end) return child.descAt(pos - offset - child.border);
        offset = end;
      }
    }
  }, {
    key: "domFromPos",
    value: function domFromPos(pos, side) {
      if (!this.contentDOM) return {
        node: this.dom,
        offset: 0,
        atom: pos + 1
      };
      var i = 0,
          offset = 0;

      for (var curPos = 0; i < this.children.length; i++) {
        var child = this.children[i],
            end = curPos + child.size;

        if (end > pos || child instanceof TrailingHackViewDesc) {
          offset = pos - curPos;
          break;
        }

        curPos = end;
      }

      if (offset) return this.children[i].domFromPos(offset - this.children[i].border, side);

      for (var prev; i && !(prev = this.children[i - 1]).size && prev instanceof WidgetViewDesc && prev.side >= 0; i--) {}

      if (side <= 0) {
        var _prev,
            enter = true;

        for (;; i--, enter = false) {
          _prev = i ? this.children[i - 1] : null;
          if (!_prev || _prev.dom.parentNode == this.contentDOM) break;
        }

        if (_prev && side && enter && !_prev.border && !_prev.domAtom) return _prev.domFromPos(_prev.size, side);
        return {
          node: this.contentDOM,
          offset: _prev ? domIndex(_prev.dom) + 1 : 0
        };
      } else {
        var next,
            _enter = true;

        for (;; i++, _enter = false) {
          next = i < this.children.length ? this.children[i] : null;
          if (!next || next.dom.parentNode == this.contentDOM) break;
        }

        if (next && _enter && !next.border && !next.domAtom) return next.domFromPos(0, side);
        return {
          node: this.contentDOM,
          offset: next ? domIndex(next.dom) : this.contentDOM.childNodes.length
        };
      }
    }
  }, {
    key: "parseRange",
    value: function parseRange(from, to) {
      var base = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      if (this.children.length == 0) return {
        node: this.contentDOM,
        from: from,
        to: to,
        fromOffset: 0,
        toOffset: this.contentDOM.childNodes.length
      };
      var fromOffset = -1,
          toOffset = -1;

      for (var offset = base, i = 0;; i++) {
        var child = this.children[i],
            end = offset + child.size;

        if (fromOffset == -1 && from <= end) {
          var childBase = offset + child.border;
          if (from >= childBase && to <= end - child.border && child.node && child.contentDOM && this.contentDOM.contains(child.contentDOM)) return child.parseRange(from, to, childBase);
          from = offset;

          for (var j = i; j > 0; j--) {
            var prev = this.children[j - 1];

            if (prev.size && prev.dom.parentNode == this.contentDOM && !prev.emptyChildAt(1)) {
              fromOffset = domIndex(prev.dom) + 1;
              break;
            }

            from -= prev.size;
          }

          if (fromOffset == -1) fromOffset = 0;
        }

        if (fromOffset > -1 && (end > to || i == this.children.length - 1)) {
          to = end;

          for (var _j = i + 1; _j < this.children.length; _j++) {
            var next = this.children[_j];

            if (next.size && next.dom.parentNode == this.contentDOM && !next.emptyChildAt(-1)) {
              toOffset = domIndex(next.dom);
              break;
            }

            to += next.size;
          }

          if (toOffset == -1) toOffset = this.contentDOM.childNodes.length;
          break;
        }

        offset = end;
      }

      return {
        node: this.contentDOM,
        from: from,
        to: to,
        fromOffset: fromOffset,
        toOffset: toOffset
      };
    }
  }, {
    key: "emptyChildAt",
    value: function emptyChildAt(side) {
      if (this.border || !this.contentDOM || !this.children.length) return false;
      var child = this.children[side < 0 ? 0 : this.children.length - 1];
      return child.size == 0 || child.emptyChildAt(side);
    }
  }, {
    key: "domAfterPos",
    value: function domAfterPos(pos) {
      var _this$domFromPos = this.domFromPos(pos, 0),
          node = _this$domFromPos.node,
          offset = _this$domFromPos.offset;

      if (node.nodeType != 1 || offset == node.childNodes.length) throw new RangeError("No node after pos " + pos);
      return node.childNodes[offset];
    }
  }, {
    key: "setSelection",
    value: function setSelection(anchor, head, root) {
      var force = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      var from = Math.min(anchor, head),
          to = Math.max(anchor, head);

      for (var i = 0, offset = 0; i < this.children.length; i++) {
        var child = this.children[i],
            end = offset + child.size;
        if (from > offset && to < end) return child.setSelection(anchor - offset - child.border, head - offset - child.border, root, force);
        offset = end;
      }

      var anchorDOM = this.domFromPos(anchor, anchor ? -1 : 1);
      var headDOM = head == anchor ? anchorDOM : this.domFromPos(head, head ? -1 : 1);
      var domSel = root.getSelection();
      var brKludge = false;

      if ((gecko || safari) && anchor == head) {
        var _anchorDOM = anchorDOM,
            node = _anchorDOM.node,
            _offset = _anchorDOM.offset;

        if (node.nodeType == 3) {
          brKludge = !!(_offset && node.nodeValue[_offset - 1] == "\n");

          if (brKludge && _offset == node.nodeValue.length) {
            for (var scan = node, after; scan; scan = scan.parentNode) {
              if (after = scan.nextSibling) {
                if (after.nodeName == "BR") anchorDOM = headDOM = {
                  node: after.parentNode,
                  offset: domIndex(after) + 1
                };
                break;
              }

              var desc = scan.pmViewDesc;
              if (desc && desc.node && desc.node.isBlock) break;
            }
          }
        } else {
          var prev = node.childNodes[_offset - 1];
          brKludge = prev && (prev.nodeName == "BR" || prev.contentEditable == "false");
        }
      }

      if (gecko && domSel.focusNode && domSel.focusNode != headDOM.node && domSel.focusNode.nodeType == 1) {
        var _after2 = domSel.focusNode.childNodes[domSel.focusOffset];
        if (_after2 && _after2.contentEditable == "false") force = true;
      }

      if (!(force || brKludge && safari) && isEquivalentPosition(anchorDOM.node, anchorDOM.offset, domSel.anchorNode, domSel.anchorOffset) && isEquivalentPosition(headDOM.node, headDOM.offset, domSel.focusNode, domSel.focusOffset)) return;
      var domSelExtended = false;

      if ((domSel.extend || anchor == head) && !brKludge) {
        domSel.collapse(anchorDOM.node, anchorDOM.offset);

        try {
          if (anchor != head) domSel.extend(headDOM.node, headDOM.offset);
          domSelExtended = true;
        } catch (err) {
          if (!(err instanceof DOMException)) throw err;
        }
      }

      if (!domSelExtended) {
        if (anchor > head) {
          var tmp = anchorDOM;
          anchorDOM = headDOM;
          headDOM = tmp;
        }

        var range = document.createRange();
        range.setEnd(headDOM.node, headDOM.offset);
        range.setStart(anchorDOM.node, anchorDOM.offset);
        domSel.removeAllRanges();
        domSel.addRange(range);
      }
    }
  }, {
    key: "ignoreMutation",
    value: function ignoreMutation(mutation) {
      return !this.contentDOM && mutation.type != "selection";
    }
  }, {
    key: "contentLost",
    get: function get() {
      return this.contentDOM && this.contentDOM != this.dom && !this.dom.contains(this.contentDOM);
    }
  }, {
    key: "markDirty",
    value: function markDirty(from, to) {
      for (var offset = 0, i = 0; i < this.children.length; i++) {
        var child = this.children[i],
            end = offset + child.size;

        if (offset == end ? from <= end && to >= offset : from < end && to > offset) {
          var startInside = offset + child.border,
              endInside = end - child.border;

          if (from >= startInside && to <= endInside) {
            this.dirty = from == offset || to == end ? CONTENT_DIRTY : CHILD_DIRTY;
            if (from == startInside && to == endInside && (child.contentLost || child.dom.parentNode != this.contentDOM)) child.dirty = NODE_DIRTY;else child.markDirty(from - startInside, to - startInside);
            return;
          } else {
            child.dirty = child.dom == child.contentDOM && child.dom.parentNode == this.contentDOM && !child.children.length ? CONTENT_DIRTY : NODE_DIRTY;
          }
        }

        offset = end;
      }

      this.dirty = CONTENT_DIRTY;
    }
  }, {
    key: "markParentsDirty",
    value: function markParentsDirty() {
      var level = 1;

      for (var node = this.parent; node; node = node.parent, level++) {
        var dirty = level == 1 ? CONTENT_DIRTY : CHILD_DIRTY;
        if (node.dirty < dirty) node.dirty = dirty;
      }
    }
  }, {
    key: "domAtom",
    get: function get() {
      return false;
    }
  }, {
    key: "ignoreForCoords",
    get: function get() {
      return false;
    }
  }]);

  return ViewDesc;
}();

var WidgetViewDesc = function (_ViewDesc) {
  _inherits(WidgetViewDesc, _ViewDesc);

  var _super = _createSuper(WidgetViewDesc);

  function WidgetViewDesc(parent, widget, view, pos) {
    var _this;

    _classCallCheck(this, WidgetViewDesc);

    var self,
        dom = widget.type.toDOM;
    if (typeof dom == "function") dom = dom(view, function () {
      if (!self) return pos;
      if (self.parent) return self.parent.posBeforeChild(self);
    });

    if (!widget.type.spec.raw) {
      if (dom.nodeType != 1) {
        var wrap = document.createElement("span");
        wrap.appendChild(dom);
        dom = wrap;
      }

      dom.contentEditable = "false";
      dom.classList.add("ProseMirror-widget");
    }

    _this = _super.call(this, parent, [], dom, null);
    _this.widget = widget;
    _this.widget = widget;
    self = _assertThisInitialized(_this);
    return _this;
  }

  _createClass(WidgetViewDesc, [{
    key: "matchesWidget",
    value: function matchesWidget(widget) {
      return this.dirty == NOT_DIRTY && widget.type.eq(this.widget.type);
    }
  }, {
    key: "parseRule",
    value: function parseRule() {
      return {
        ignore: true
      };
    }
  }, {
    key: "stopEvent",
    value: function stopEvent(event) {
      var stop = this.widget.spec.stopEvent;
      return stop ? stop(event) : false;
    }
  }, {
    key: "ignoreMutation",
    value: function ignoreMutation(mutation) {
      return mutation.type != "selection" || this.widget.spec.ignoreSelection;
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.widget.type.destroy(this.dom);

      _get(_getPrototypeOf(WidgetViewDesc.prototype), "destroy", this).call(this);
    }
  }, {
    key: "domAtom",
    get: function get() {
      return true;
    }
  }, {
    key: "side",
    get: function get() {
      return this.widget.type.side;
    }
  }]);

  return WidgetViewDesc;
}(ViewDesc);

var CompositionViewDesc = function (_ViewDesc2) {
  _inherits(CompositionViewDesc, _ViewDesc2);

  var _super2 = _createSuper(CompositionViewDesc);

  function CompositionViewDesc(parent, dom, textDOM, text) {
    var _this2;

    _classCallCheck(this, CompositionViewDesc);

    _this2 = _super2.call(this, parent, [], dom, null);
    _this2.textDOM = textDOM;
    _this2.text = text;
    return _this2;
  }

  _createClass(CompositionViewDesc, [{
    key: "size",
    get: function get() {
      return this.text.length;
    }
  }, {
    key: "localPosFromDOM",
    value: function localPosFromDOM(dom, offset) {
      if (dom != this.textDOM) return this.posAtStart + (offset ? this.size : 0);
      return this.posAtStart + offset;
    }
  }, {
    key: "domFromPos",
    value: function domFromPos(pos) {
      return {
        node: this.textDOM,
        offset: pos
      };
    }
  }, {
    key: "ignoreMutation",
    value: function ignoreMutation(mut) {
      return mut.type === 'characterData' && mut.target.nodeValue == mut.oldValue;
    }
  }]);

  return CompositionViewDesc;
}(ViewDesc);

var MarkViewDesc = function (_ViewDesc3) {
  _inherits(MarkViewDesc, _ViewDesc3);

  var _super3 = _createSuper(MarkViewDesc);

  function MarkViewDesc(parent, mark, dom, contentDOM) {
    var _this3;

    _classCallCheck(this, MarkViewDesc);

    _this3 = _super3.call(this, parent, [], dom, contentDOM);
    _this3.mark = mark;
    return _this3;
  }

  _createClass(MarkViewDesc, [{
    key: "parseRule",
    value: function parseRule() {
      if (this.dirty & NODE_DIRTY || this.mark.type.spec.reparseInView) return null;
      return {
        mark: this.mark.type.name,
        attrs: this.mark.attrs,
        contentElement: this.contentDOM || undefined
      };
    }
  }, {
    key: "matchesMark",
    value: function matchesMark(mark) {
      return this.dirty != NODE_DIRTY && this.mark.eq(mark);
    }
  }, {
    key: "markDirty",
    value: function markDirty(from, to) {
      _get(_getPrototypeOf(MarkViewDesc.prototype), "markDirty", this).call(this, from, to);

      if (this.dirty != NOT_DIRTY) {
        var parent = this.parent;

        while (!parent.node) {
          parent = parent.parent;
        }

        if (parent.dirty < this.dirty) parent.dirty = this.dirty;
        this.dirty = NOT_DIRTY;
      }
    }
  }, {
    key: "slice",
    value: function slice(from, to, view) {
      var copy = MarkViewDesc.create(this.parent, this.mark, true, view);
      var nodes = this.children,
          size = this.size;
      if (to < size) nodes = replaceNodes(nodes, to, size, view);
      if (from > 0) nodes = replaceNodes(nodes, 0, from, view);

      for (var i = 0; i < nodes.length; i++) {
        nodes[i].parent = copy;
      }

      copy.children = nodes;
      return copy;
    }
  }], [{
    key: "create",
    value: function create(parent, mark, inline, view) {
      var custom = view.nodeViews[mark.type.name];
      var spec = custom && custom(mark, view, inline);
      if (!spec || !spec.dom) spec = prosemirrorModel.DOMSerializer.renderSpec(document, mark.type.spec.toDOM(mark, inline));
      return new MarkViewDesc(parent, mark, spec.dom, spec.contentDOM || spec.dom);
    }
  }]);

  return MarkViewDesc;
}(ViewDesc);

var NodeViewDesc = function (_ViewDesc4) {
  _inherits(NodeViewDesc, _ViewDesc4);

  var _super4 = _createSuper(NodeViewDesc);

  function NodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, view, pos) {
    var _this4;

    _classCallCheck(this, NodeViewDesc);

    _this4 = _super4.call(this, parent, [], dom, contentDOM);
    _this4.node = node;
    _this4.outerDeco = outerDeco;
    _this4.innerDeco = innerDeco;
    _this4.nodeDOM = nodeDOM;
    if (contentDOM) _this4.updateChildren(view, pos);
    return _this4;
  }

  _createClass(NodeViewDesc, [{
    key: "parseRule",
    value: function parseRule() {
      var _this5 = this;

      if (this.node.type.spec.reparseInView) return null;
      var rule = {
        node: this.node.type.name,
        attrs: this.node.attrs
      };
      if (this.node.type.whitespace == "pre") rule.preserveWhitespace = "full";

      if (!this.contentDOM) {
        rule.getContent = function () {
          return _this5.node.content;
        };
      } else if (!this.contentLost) {
        rule.contentElement = this.contentDOM;
      } else {
        for (var i = this.children.length - 1; i >= 0; i--) {
          var child = this.children[i];

          if (this.dom.contains(child.dom.parentNode)) {
            rule.contentElement = child.dom.parentNode;
            break;
          }
        }

        if (!rule.contentElement) rule.getContent = function () {
          return prosemirrorModel.Fragment.empty;
        };
      }

      return rule;
    }
  }, {
    key: "matchesNode",
    value: function matchesNode(node, outerDeco, innerDeco) {
      return this.dirty == NOT_DIRTY && node.eq(this.node) && sameOuterDeco(outerDeco, this.outerDeco) && innerDeco.eq(this.innerDeco);
    }
  }, {
    key: "size",
    get: function get() {
      return this.node.nodeSize;
    }
  }, {
    key: "border",
    get: function get() {
      return this.node.isLeaf ? 0 : 1;
    }
  }, {
    key: "updateChildren",
    value: function updateChildren(view, pos) {
      var _this6 = this;

      var inline = this.node.inlineContent,
          off = pos;
      var composition = view.composing ? this.localCompositionInfo(view, pos) : null;
      var localComposition = composition && composition.pos > -1 ? composition : null;
      var compositionInChild = composition && composition.pos < 0;
      var updater = new ViewTreeUpdater(this, localComposition && localComposition.node);
      iterDeco(this.node, this.innerDeco, function (widget, i, insideNode) {
        if (widget.spec.marks) updater.syncToMarks(widget.spec.marks, inline, view);else if (widget.type.side >= 0 && !insideNode) updater.syncToMarks(i == _this6.node.childCount ? prosemirrorModel.Mark.none : _this6.node.child(i).marks, inline, view);
        updater.placeWidget(widget, view, off);
      }, function (child, outerDeco, innerDeco, i) {
        updater.syncToMarks(child.marks, inline, view);
        var compIndex;
        if (updater.findNodeMatch(child, outerDeco, innerDeco, i)) ;else if (compositionInChild && view.state.selection.from > off && view.state.selection.to < off + child.nodeSize && (compIndex = updater.findIndexWithChild(composition.node)) > -1 && updater.updateNodeAt(child, outerDeco, innerDeco, compIndex, view)) ;else if (updater.updateNextNode(child, outerDeco, innerDeco, view, i)) ;else {
          updater.addNode(child, outerDeco, innerDeco, view, off);
        }
        off += child.nodeSize;
      });
      updater.syncToMarks([], inline, view);
      if (this.node.isTextblock) updater.addTextblockHacks();
      updater.destroyRest();

      if (updater.changed || this.dirty == CONTENT_DIRTY) {
        if (localComposition) this.protectLocalComposition(view, localComposition);
        renderDescs(this.contentDOM, this.children, view);
        if (ios) iosHacks(this.dom);
      }
    }
  }, {
    key: "localCompositionInfo",
    value: function localCompositionInfo(view, pos) {
      var _view$state$selection = view.state.selection,
          from = _view$state$selection.from,
          to = _view$state$selection.to;
      if (!(view.state.selection instanceof prosemirrorState.TextSelection) || from < pos || to > pos + this.node.content.size) return null;
      var sel = view.domSelection();
      var textNode = nearbyTextNode(sel.focusNode, sel.focusOffset);
      if (!textNode || !this.dom.contains(textNode.parentNode)) return null;

      if (this.node.inlineContent) {
        var text = textNode.nodeValue;
        var textPos = findTextInFragment(this.node.content, text, from - pos, to - pos);
        return textPos < 0 ? null : {
          node: textNode,
          pos: textPos,
          text: text
        };
      } else {
        return {
          node: textNode,
          pos: -1,
          text: ""
        };
      }
    }
  }, {
    key: "protectLocalComposition",
    value: function protectLocalComposition(view, _ref2) {
      var node = _ref2.node,
          pos = _ref2.pos,
          text = _ref2.text;
      if (this.getDesc(node)) return;
      var topNode = node;

      for (;; topNode = topNode.parentNode) {
        if (topNode.parentNode == this.contentDOM) break;

        while (topNode.previousSibling) {
          topNode.parentNode.removeChild(topNode.previousSibling);
        }

        while (topNode.nextSibling) {
          topNode.parentNode.removeChild(topNode.nextSibling);
        }

        if (topNode.pmViewDesc) topNode.pmViewDesc = undefined;
      }

      var desc = new CompositionViewDesc(this, topNode, node, text);
      view.input.compositionNodes.push(desc);
      this.children = replaceNodes(this.children, pos, pos + text.length, view, desc);
    }
  }, {
    key: "update",
    value: function update(node, outerDeco, innerDeco, view) {
      if (this.dirty == NODE_DIRTY || !node.sameMarkup(this.node)) return false;
      this.updateInner(node, outerDeco, innerDeco, view);
      return true;
    }
  }, {
    key: "updateInner",
    value: function updateInner(node, outerDeco, innerDeco, view) {
      this.updateOuterDeco(outerDeco);
      this.node = node;
      this.innerDeco = innerDeco;
      if (this.contentDOM) this.updateChildren(view, this.posAtStart);
      this.dirty = NOT_DIRTY;
    }
  }, {
    key: "updateOuterDeco",
    value: function updateOuterDeco(outerDeco) {
      if (sameOuterDeco(outerDeco, this.outerDeco)) return;
      var needsWrap = this.nodeDOM.nodeType != 1;
      var oldDOM = this.dom;
      this.dom = patchOuterDeco(this.dom, this.nodeDOM, computeOuterDeco(this.outerDeco, this.node, needsWrap), computeOuterDeco(outerDeco, this.node, needsWrap));

      if (this.dom != oldDOM) {
        oldDOM.pmViewDesc = undefined;
        this.dom.pmViewDesc = this;
      }

      this.outerDeco = outerDeco;
    }
  }, {
    key: "selectNode",
    value: function selectNode() {
      if (this.nodeDOM.nodeType == 1) this.nodeDOM.classList.add("ProseMirror-selectednode");
      if (this.contentDOM || !this.node.type.spec.draggable) this.dom.draggable = true;
    }
  }, {
    key: "deselectNode",
    value: function deselectNode() {
      if (this.nodeDOM.nodeType == 1) this.nodeDOM.classList.remove("ProseMirror-selectednode");
      if (this.contentDOM || !this.node.type.spec.draggable) this.dom.removeAttribute("draggable");
    }
  }, {
    key: "domAtom",
    get: function get() {
      return this.node.isAtom;
    }
  }], [{
    key: "create",
    value: function create(parent, node, outerDeco, innerDeco, view, pos) {
      var custom = view.nodeViews[node.type.name],
          descObj;
      var spec = custom && custom(node, view, function () {
        if (!descObj) return pos;
        if (descObj.parent) return descObj.parent.posBeforeChild(descObj);
      }, outerDeco, innerDeco);
      var dom = spec && spec.dom,
          contentDOM = spec && spec.contentDOM;

      if (node.isText) {
        if (!dom) dom = document.createTextNode(node.text);else if (dom.nodeType != 3) throw new RangeError("Text must be rendered as a DOM text node");
      } else if (!dom) {
        var _prosemirrorModel$DOM = prosemirrorModel.DOMSerializer.renderSpec(document, node.type.spec.toDOM(node));

        dom = _prosemirrorModel$DOM.dom;
        contentDOM = _prosemirrorModel$DOM.contentDOM;
      }

      if (!contentDOM && !node.isText && dom.nodeName != "BR") {
        if (!dom.hasAttribute("contenteditable")) dom.contentEditable = "false";
        if (node.type.spec.draggable) dom.draggable = true;
      }

      var nodeDOM = dom;
      dom = applyOuterDeco(dom, outerDeco, node);
      if (spec) return descObj = new CustomNodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM || null, nodeDOM, spec, view, pos + 1);else if (node.isText) return new TextViewDesc(parent, node, outerDeco, innerDeco, dom, nodeDOM, view);else return new NodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM || null, nodeDOM, view, pos + 1);
    }
  }]);

  return NodeViewDesc;
}(ViewDesc);

function docViewDesc(doc, outerDeco, innerDeco, dom, view) {
  applyOuterDeco(dom, outerDeco, doc);
  return new NodeViewDesc(undefined, doc, outerDeco, innerDeco, dom, dom, dom, view, 0);
}

var TextViewDesc = function (_NodeViewDesc) {
  _inherits(TextViewDesc, _NodeViewDesc);

  var _super5 = _createSuper(TextViewDesc);

  function TextViewDesc(parent, node, outerDeco, innerDeco, dom, nodeDOM, view) {
    _classCallCheck(this, TextViewDesc);

    return _super5.call(this, parent, node, outerDeco, innerDeco, dom, null, nodeDOM, view, 0);
  }

  _createClass(TextViewDesc, [{
    key: "parseRule",
    value: function parseRule() {
      var skip = this.nodeDOM.parentNode;

      while (skip && skip != this.dom && !skip.pmIsDeco) {
        skip = skip.parentNode;
      }

      return {
        skip: skip || true
      };
    }
  }, {
    key: "update",
    value: function update(node, outerDeco, innerDeco, view) {
      if (this.dirty == NODE_DIRTY || this.dirty != NOT_DIRTY && !this.inParent() || !node.sameMarkup(this.node)) return false;
      this.updateOuterDeco(outerDeco);

      if ((this.dirty != NOT_DIRTY || node.text != this.node.text) && node.text != this.nodeDOM.nodeValue) {
        this.nodeDOM.nodeValue = node.text;
        if (view.trackWrites == this.nodeDOM) view.trackWrites = null;
      }

      this.node = node;
      this.dirty = NOT_DIRTY;
      return true;
    }
  }, {
    key: "inParent",
    value: function inParent() {
      var parentDOM = this.parent.contentDOM;

      for (var n = this.nodeDOM; n; n = n.parentNode) {
        if (n == parentDOM) return true;
      }

      return false;
    }
  }, {
    key: "domFromPos",
    value: function domFromPos(pos) {
      return {
        node: this.nodeDOM,
        offset: pos
      };
    }
  }, {
    key: "localPosFromDOM",
    value: function localPosFromDOM(dom, offset, bias) {
      if (dom == this.nodeDOM) return this.posAtStart + Math.min(offset, this.node.text.length);
      return _get(_getPrototypeOf(TextViewDesc.prototype), "localPosFromDOM", this).call(this, dom, offset, bias);
    }
  }, {
    key: "ignoreMutation",
    value: function ignoreMutation(mutation) {
      return mutation.type != "characterData" && mutation.type != "selection";
    }
  }, {
    key: "slice",
    value: function slice(from, to, view) {
      var node = this.node.cut(from, to),
          dom = document.createTextNode(node.text);
      return new TextViewDesc(this.parent, node, this.outerDeco, this.innerDeco, dom, dom, view);
    }
  }, {
    key: "markDirty",
    value: function markDirty(from, to) {
      _get(_getPrototypeOf(TextViewDesc.prototype), "markDirty", this).call(this, from, to);

      if (this.dom != this.nodeDOM && (from == 0 || to == this.nodeDOM.nodeValue.length)) this.dirty = NODE_DIRTY;
    }
  }, {
    key: "domAtom",
    get: function get() {
      return false;
    }
  }]);

  return TextViewDesc;
}(NodeViewDesc);

var TrailingHackViewDesc = function (_ViewDesc5) {
  _inherits(TrailingHackViewDesc, _ViewDesc5);

  var _super6 = _createSuper(TrailingHackViewDesc);

  function TrailingHackViewDesc() {
    _classCallCheck(this, TrailingHackViewDesc);

    return _super6.apply(this, arguments);
  }

  _createClass(TrailingHackViewDesc, [{
    key: "parseRule",
    value: function parseRule() {
      return {
        ignore: true
      };
    }
  }, {
    key: "matchesHack",
    value: function matchesHack(nodeName) {
      return this.dirty == NOT_DIRTY && this.dom.nodeName == nodeName;
    }
  }, {
    key: "domAtom",
    get: function get() {
      return true;
    }
  }, {
    key: "ignoreForCoords",
    get: function get() {
      return this.dom.nodeName == "IMG";
    }
  }]);

  return TrailingHackViewDesc;
}(ViewDesc);

var CustomNodeViewDesc = function (_NodeViewDesc2) {
  _inherits(CustomNodeViewDesc, _NodeViewDesc2);

  var _super7 = _createSuper(CustomNodeViewDesc);

  function CustomNodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, spec, view, pos) {
    var _this7;

    _classCallCheck(this, CustomNodeViewDesc);

    _this7 = _super7.call(this, parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, view, pos);
    _this7.spec = spec;
    return _this7;
  }

  _createClass(CustomNodeViewDesc, [{
    key: "update",
    value: function update(node, outerDeco, innerDeco, view) {
      if (this.dirty == NODE_DIRTY) return false;

      if (this.spec.update) {
        var result = this.spec.update(node, outerDeco, innerDeco);
        if (result) this.updateInner(node, outerDeco, innerDeco, view);
        return result;
      } else if (!this.contentDOM && !node.isLeaf) {
        return false;
      } else {
        return _get(_getPrototypeOf(CustomNodeViewDesc.prototype), "update", this).call(this, node, outerDeco, innerDeco, view);
      }
    }
  }, {
    key: "selectNode",
    value: function selectNode() {
      this.spec.selectNode ? this.spec.selectNode() : _get(_getPrototypeOf(CustomNodeViewDesc.prototype), "selectNode", this).call(this);
    }
  }, {
    key: "deselectNode",
    value: function deselectNode() {
      this.spec.deselectNode ? this.spec.deselectNode() : _get(_getPrototypeOf(CustomNodeViewDesc.prototype), "deselectNode", this).call(this);
    }
  }, {
    key: "setSelection",
    value: function setSelection(anchor, head, root, force) {
      this.spec.setSelection ? this.spec.setSelection(anchor, head, root) : _get(_getPrototypeOf(CustomNodeViewDesc.prototype), "setSelection", this).call(this, anchor, head, root, force);
    }
  }, {
    key: "destroy",
    value: function destroy() {
      if (this.spec.destroy) this.spec.destroy();

      _get(_getPrototypeOf(CustomNodeViewDesc.prototype), "destroy", this).call(this);
    }
  }, {
    key: "stopEvent",
    value: function stopEvent(event) {
      return this.spec.stopEvent ? this.spec.stopEvent(event) : false;
    }
  }, {
    key: "ignoreMutation",
    value: function ignoreMutation(mutation) {
      return this.spec.ignoreMutation ? this.spec.ignoreMutation(mutation) : _get(_getPrototypeOf(CustomNodeViewDesc.prototype), "ignoreMutation", this).call(this, mutation);
    }
  }]);

  return CustomNodeViewDesc;
}(NodeViewDesc);

function renderDescs(parentDOM, descs, view) {
  var dom = parentDOM.firstChild,
      written = false;

  for (var i = 0; i < descs.length; i++) {
    var desc = descs[i],
        childDOM = desc.dom;

    if (childDOM.parentNode == parentDOM) {
      while (childDOM != dom) {
        dom = rm(dom);
        written = true;
      }

      dom = dom.nextSibling;
    } else {
      written = true;
      parentDOM.insertBefore(childDOM, dom);
    }

    if (desc instanceof MarkViewDesc) {
      var pos = dom ? dom.previousSibling : parentDOM.lastChild;
      renderDescs(desc.contentDOM, desc.children, view);
      dom = pos ? pos.nextSibling : parentDOM.firstChild;
    }
  }

  while (dom) {
    dom = rm(dom);
    written = true;
  }

  if (written && view.trackWrites == parentDOM) view.trackWrites = null;
}

var OuterDecoLevel = function OuterDecoLevel(nodeName) {
  if (nodeName) this.nodeName = nodeName;
};

OuterDecoLevel.prototype = Object.create(null);
var noDeco = [new OuterDecoLevel()];

function computeOuterDeco(outerDeco, node, needsWrap) {
  if (outerDeco.length == 0) return noDeco;
  var top = needsWrap ? noDeco[0] : new OuterDecoLevel(),
      result = [top];

  for (var i = 0; i < outerDeco.length; i++) {
    var attrs = outerDeco[i].type.attrs;
    if (!attrs) continue;
    if (attrs.nodeName) result.push(top = new OuterDecoLevel(attrs.nodeName));

    for (var name in attrs) {
      var val = attrs[name];
      if (val == null) continue;
      if (needsWrap && result.length == 1) result.push(top = new OuterDecoLevel(node.isInline ? "span" : "div"));
      if (name == "class") top["class"] = (top["class"] ? top["class"] + " " : "") + val;else if (name == "style") top.style = (top.style ? top.style + ";" : "") + val;else if (name != "nodeName") top[name] = val;
    }
  }

  return result;
}

function patchOuterDeco(outerDOM, nodeDOM, prevComputed, curComputed) {
  if (prevComputed == noDeco && curComputed == noDeco) return nodeDOM;
  var curDOM = nodeDOM;

  for (var i = 0; i < curComputed.length; i++) {
    var deco = curComputed[i],
        prev = prevComputed[i];

    if (i) {
      var parent = void 0;

      if (prev && prev.nodeName == deco.nodeName && curDOM != outerDOM && (parent = curDOM.parentNode) && parent.nodeName.toLowerCase() == deco.nodeName) {
        curDOM = parent;
      } else {
        parent = document.createElement(deco.nodeName);
        parent.pmIsDeco = true;
        parent.appendChild(curDOM);
        prev = noDeco[0];
        curDOM = parent;
      }
    }

    patchAttributes(curDOM, prev || noDeco[0], deco);
  }

  return curDOM;
}

function patchAttributes(dom, prev, cur) {
  for (var name in prev) {
    if (name != "class" && name != "style" && name != "nodeName" && !(name in cur)) dom.removeAttribute(name);
  }

  for (var _name in cur) {
    if (_name != "class" && _name != "style" && _name != "nodeName" && cur[_name] != prev[_name]) dom.setAttribute(_name, cur[_name]);
  }

  if (prev["class"] != cur["class"]) {
    var prevList = prev["class"] ? prev["class"].split(" ").filter(Boolean) : [];
    var curList = cur["class"] ? cur["class"].split(" ").filter(Boolean) : [];

    for (var i = 0; i < prevList.length; i++) {
      if (curList.indexOf(prevList[i]) == -1) dom.classList.remove(prevList[i]);
    }

    for (var _i = 0; _i < curList.length; _i++) {
      if (prevList.indexOf(curList[_i]) == -1) dom.classList.add(curList[_i]);
    }

    if (dom.classList.length == 0) dom.removeAttribute("class");
  }

  if (prev.style != cur.style) {
    if (prev.style) {
      var prop = /\s*([\w\-\xa1-\uffff]+)\s*:(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\(.*?\)|[^;])*/g,
          m;

      while (m = prop.exec(prev.style)) {
        dom.style.removeProperty(m[1]);
      }
    }

    if (cur.style) dom.style.cssText += cur.style;
  }
}

function applyOuterDeco(dom, deco, node) {
  return patchOuterDeco(dom, dom, noDeco, computeOuterDeco(deco, node, dom.nodeType != 1));
}

function sameOuterDeco(a, b) {
  if (a.length != b.length) return false;

  for (var i = 0; i < a.length; i++) {
    if (!a[i].type.eq(b[i].type)) return false;
  }

  return true;
}

function rm(dom) {
  var next = dom.nextSibling;
  dom.parentNode.removeChild(dom);
  return next;
}

var ViewTreeUpdater = function () {
  function ViewTreeUpdater(top, lock) {
    _classCallCheck(this, ViewTreeUpdater);

    this.lock = lock;
    this.index = 0;
    this.stack = [];
    this.changed = false;
    this.top = top;
    this.preMatch = preMatch(top.node.content, top);
  }

  _createClass(ViewTreeUpdater, [{
    key: "destroyBetween",
    value: function destroyBetween(start, end) {
      if (start == end) return;

      for (var i = start; i < end; i++) {
        this.top.children[i].destroy();
      }

      this.top.children.splice(start, end - start);
      this.changed = true;
    }
  }, {
    key: "destroyRest",
    value: function destroyRest() {
      this.destroyBetween(this.index, this.top.children.length);
    }
  }, {
    key: "syncToMarks",
    value: function syncToMarks(marks, inline, view) {
      var keep = 0,
          depth = this.stack.length >> 1;
      var maxKeep = Math.min(depth, marks.length);

      while (keep < maxKeep && (keep == depth - 1 ? this.top : this.stack[keep + 1 << 1]).matchesMark(marks[keep]) && marks[keep].type.spec.spanning !== false) {
        keep++;
      }

      while (keep < depth) {
        this.destroyRest();
        this.top.dirty = NOT_DIRTY;
        this.index = this.stack.pop();
        this.top = this.stack.pop();
        depth--;
      }

      while (depth < marks.length) {
        this.stack.push(this.top, this.index + 1);
        var found = -1;

        for (var i = this.index; i < Math.min(this.index + 3, this.top.children.length); i++) {
          if (this.top.children[i].matchesMark(marks[depth])) {
            found = i;
            break;
          }
        }

        if (found > -1) {
          if (found > this.index) {
            this.changed = true;
            this.destroyBetween(this.index, found);
          }

          this.top = this.top.children[this.index];
        } else {
          var markDesc = MarkViewDesc.create(this.top, marks[depth], inline, view);
          this.top.children.splice(this.index, 0, markDesc);
          this.top = markDesc;
          this.changed = true;
        }

        this.index = 0;
        depth++;
      }
    }
  }, {
    key: "findNodeMatch",
    value: function findNodeMatch(node, outerDeco, innerDeco, index) {
      var found = -1,
          targetDesc;

      if (index >= this.preMatch.index && (targetDesc = this.preMatch.matches[index - this.preMatch.index]).parent == this.top && targetDesc.matchesNode(node, outerDeco, innerDeco)) {
        found = this.top.children.indexOf(targetDesc, this.index);
      } else {
        for (var i = this.index, e = Math.min(this.top.children.length, i + 5); i < e; i++) {
          var child = this.top.children[i];

          if (child.matchesNode(node, outerDeco, innerDeco) && !this.preMatch.matched.has(child)) {
            found = i;
            break;
          }
        }
      }

      if (found < 0) return false;
      this.destroyBetween(this.index, found);
      this.index++;
      return true;
    }
  }, {
    key: "updateNodeAt",
    value: function updateNodeAt(node, outerDeco, innerDeco, index, view) {
      var child = this.top.children[index];
      if (child.dirty == NODE_DIRTY && child.dom == child.contentDOM) child.dirty = CONTENT_DIRTY;
      if (!child.update(node, outerDeco, innerDeco, view)) return false;
      this.destroyBetween(this.index, index);
      this.index++;
      return true;
    }
  }, {
    key: "findIndexWithChild",
    value: function findIndexWithChild(domNode) {
      for (;;) {
        var parent = domNode.parentNode;
        if (!parent) return -1;

        if (parent == this.top.contentDOM) {
          var desc = domNode.pmViewDesc;
          if (desc) for (var i = this.index; i < this.top.children.length; i++) {
            if (this.top.children[i] == desc) return i;
          }
          return -1;
        }

        domNode = parent;
      }
    }
  }, {
    key: "updateNextNode",
    value: function updateNextNode(node, outerDeco, innerDeco, view, index) {
      for (var i = this.index; i < this.top.children.length; i++) {
        var next = this.top.children[i];

        if (next instanceof NodeViewDesc) {
          var _preMatch = this.preMatch.matched.get(next);

          if (_preMatch != null && _preMatch != index) return false;
          var nextDOM = next.dom;
          var locked = this.lock && (nextDOM == this.lock || nextDOM.nodeType == 1 && nextDOM.contains(this.lock.parentNode)) && !(node.isText && next.node && next.node.isText && next.nodeDOM.nodeValue == node.text && next.dirty != NODE_DIRTY && sameOuterDeco(outerDeco, next.outerDeco));

          if (!locked && next.update(node, outerDeco, innerDeco, view)) {
            this.destroyBetween(this.index, i);
            if (next.dom != nextDOM) this.changed = true;
            this.index++;
            return true;
          }

          break;
        }
      }

      return false;
    }
  }, {
    key: "addNode",
    value: function addNode(node, outerDeco, innerDeco, view, pos) {
      this.top.children.splice(this.index++, 0, NodeViewDesc.create(this.top, node, outerDeco, innerDeco, view, pos));
      this.changed = true;
    }
  }, {
    key: "placeWidget",
    value: function placeWidget(widget, view, pos) {
      var next = this.index < this.top.children.length ? this.top.children[this.index] : null;

      if (next && next.matchesWidget(widget) && (widget == next.widget || !next.widget.type.toDOM.parentNode)) {
        this.index++;
      } else {
        var desc = new WidgetViewDesc(this.top, widget, view, pos);
        this.top.children.splice(this.index++, 0, desc);
        this.changed = true;
      }
    }
  }, {
    key: "addTextblockHacks",
    value: function addTextblockHacks() {
      var lastChild = this.top.children[this.index - 1],
          parent = this.top;

      while (lastChild instanceof MarkViewDesc) {
        parent = lastChild;
        lastChild = parent.children[parent.children.length - 1];
      }

      if (!lastChild || !(lastChild instanceof TextViewDesc) || /\n$/.test(lastChild.node.text)) {
        if ((safari || chrome) && lastChild && lastChild.dom.contentEditable == "false") this.addHackNode("IMG", parent);
        this.addHackNode("BR", this.top);
      }
    }
  }, {
    key: "addHackNode",
    value: function addHackNode(nodeName, parent) {
      if (parent == this.top && this.index < parent.children.length && parent.children[this.index].matchesHack(nodeName)) {
        this.index++;
      } else {
        var dom = document.createElement(nodeName);

        if (nodeName == "IMG") {
          dom.className = "ProseMirror-separator";
          dom.alt = "";
        }

        if (nodeName == "BR") dom.className = "ProseMirror-trailingBreak";
        var hack = new TrailingHackViewDesc(this.top, [], dom, null);
        if (parent != this.top) parent.children.push(hack);else parent.children.splice(this.index++, 0, hack);
        this.changed = true;
      }
    }
  }]);

  return ViewTreeUpdater;
}();

function preMatch(frag, parentDesc) {
  var curDesc = parentDesc,
      descI = curDesc.children.length;
  var fI = frag.childCount,
      matched = new Map(),
      matches = [];

  outer: while (fI > 0) {
    var desc = void 0;

    for (;;) {
      if (descI) {
        var next = curDesc.children[descI - 1];

        if (next instanceof MarkViewDesc) {
          curDesc = next;
          descI = next.children.length;
        } else {
          desc = next;
          descI--;
          break;
        }
      } else if (curDesc == parentDesc) {
        break outer;
      } else {
        descI = curDesc.parent.children.indexOf(curDesc);
        curDesc = curDesc.parent;
      }
    }

    var node = desc.node;
    if (!node) continue;
    if (node != frag.child(fI - 1)) break;
    --fI;
    matched.set(desc, fI);
    matches.push(desc);
  }

  return {
    index: fI,
    matched: matched,
    matches: matches.reverse()
  };
}

function compareSide(a, b) {
  return a.type.side - b.type.side;
}

function iterDeco(parent, deco, onWidget, onNode) {
  var locals = deco.locals(parent),
      offset = 0;

  if (locals.length == 0) {
    for (var i = 0; i < parent.childCount; i++) {
      var child = parent.child(i);
      onNode(child, locals, deco.forChild(offset, child), i);
      offset += child.nodeSize;
    }

    return;
  }

  var decoIndex = 0,
      active = [],
      restNode = null;

  for (var parentIndex = 0;;) {
    if (decoIndex < locals.length && locals[decoIndex].to == offset) {
      var widget = locals[decoIndex++],
          widgets = void 0;

      while (decoIndex < locals.length && locals[decoIndex].to == offset) {
        (widgets || (widgets = [widget])).push(locals[decoIndex++]);
      }

      if (widgets) {
        widgets.sort(compareSide);

        for (var _i2 = 0; _i2 < widgets.length; _i2++) {
          onWidget(widgets[_i2], parentIndex, !!restNode);
        }
      } else {
        onWidget(widget, parentIndex, !!restNode);
      }
    }

    var _child = void 0,
        index = void 0;

    if (restNode) {
      index = -1;
      _child = restNode;
      restNode = null;
    } else if (parentIndex < parent.childCount) {
      index = parentIndex;
      _child = parent.child(parentIndex++);
    } else {
      break;
    }

    for (var _i3 = 0; _i3 < active.length; _i3++) {
      if (active[_i3].to <= offset) active.splice(_i3--, 1);
    }

    while (decoIndex < locals.length && locals[decoIndex].from <= offset && locals[decoIndex].to > offset) {
      active.push(locals[decoIndex++]);
    }

    var end = offset + _child.nodeSize;

    if (_child.isText) {
      var cutAt = end;
      if (decoIndex < locals.length && locals[decoIndex].from < cutAt) cutAt = locals[decoIndex].from;

      for (var _i4 = 0; _i4 < active.length; _i4++) {
        if (active[_i4].to < cutAt) cutAt = active[_i4].to;
      }

      if (cutAt < end) {
        restNode = _child.cut(cutAt - offset);
        _child = _child.cut(0, cutAt - offset);
        end = cutAt;
        index = -1;
      }
    }

    var outerDeco = _child.isInline && !_child.isLeaf ? active.filter(function (d) {
      return !d.inline;
    }) : active.slice();
    onNode(_child, outerDeco, deco.forChild(offset, _child), index);
    offset = end;
  }
}

function iosHacks(dom) {
  if (dom.nodeName == "UL" || dom.nodeName == "OL") {
    var oldCSS = dom.style.cssText;
    dom.style.cssText = oldCSS + "; list-style: square !important";
    window.getComputedStyle(dom).listStyle;
    dom.style.cssText = oldCSS;
  }
}

function nearbyTextNode(node, offset) {
  for (;;) {
    if (node.nodeType == 3) return node;

    if (node.nodeType == 1 && offset > 0) {
      if (node.childNodes.length > offset && node.childNodes[offset].nodeType == 3) return node.childNodes[offset];
      node = node.childNodes[offset - 1];
      offset = nodeSize(node);
    } else if (node.nodeType == 1 && offset < node.childNodes.length) {
      node = node.childNodes[offset];
      offset = 0;
    } else {
      return null;
    }
  }
}

function findTextInFragment(frag, text, from, to) {
  for (var i = 0, pos = 0; i < frag.childCount && pos <= to;) {
    var child = frag.child(i++),
        childStart = pos;
    pos += child.nodeSize;
    if (!child.isText) continue;
    var str = child.text;

    while (i < frag.childCount) {
      var next = frag.child(i++);
      pos += next.nodeSize;
      if (!next.isText) break;
      str += next.text;
    }

    if (pos >= from) {
      var found = childStart < to ? str.lastIndexOf(text, to - childStart - 1) : -1;
      if (found >= 0 && found + text.length + childStart >= from) return childStart + found;
      if (from == to && str.length >= to + text.length - childStart && str.slice(to - childStart, to - childStart + text.length) == text) return to;
    }
  }

  return -1;
}

function replaceNodes(nodes, from, to, view, replacement) {
  var result = [];

  for (var i = 0, off = 0; i < nodes.length; i++) {
    var child = nodes[i],
        start = off,
        end = off += child.size;

    if (start >= to || end <= from) {
      result.push(child);
    } else {
      if (start < from) result.push(child.slice(0, from - start, view));

      if (replacement) {
        result.push(replacement);
        replacement = undefined;
      }

      if (end > to) result.push(child.slice(to - start, child.size, view));
    }
  }

  return result;
}

function selectionFromDOM(view) {
  var origin = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var domSel = view.domSelection(),
      doc = view.state.doc;
  if (!domSel.focusNode) return null;
  var nearestDesc = view.docView.nearestDesc(domSel.focusNode),
      inWidget = nearestDesc && nearestDesc.size == 0;
  var head = view.docView.posFromDOM(domSel.focusNode, domSel.focusOffset, 1);
  if (head < 0) return null;
  var $head = doc.resolve(head),
      $anchor,
      selection;

  if (selectionCollapsed(domSel)) {
    $anchor = $head;

    while (nearestDesc && !nearestDesc.node) {
      nearestDesc = nearestDesc.parent;
    }

    var nearestDescNode = nearestDesc.node;

    if (nearestDesc && nearestDescNode.isAtom && prosemirrorState.NodeSelection.isSelectable(nearestDescNode) && nearestDesc.parent && !(nearestDescNode.isInline && isOnEdge(domSel.focusNode, domSel.focusOffset, nearestDesc.dom))) {
      var pos = nearestDesc.posBefore;
      selection = new prosemirrorState.NodeSelection(head == pos ? $head : doc.resolve(pos));
    }
  } else {
    var anchor = view.docView.posFromDOM(domSel.anchorNode, domSel.anchorOffset, 1);
    if (anchor < 0) return null;
    $anchor = doc.resolve(anchor);
  }

  if (!selection) {
    var bias = origin == "pointer" || view.state.selection.head < $head.pos && !inWidget ? 1 : -1;
    selection = selectionBetween(view, $anchor, $head, bias);
  }

  return selection;
}

function editorOwnsSelection(view) {
  return view.editable ? view.hasFocus() : hasSelection(view) && document.activeElement && document.activeElement.contains(view.dom);
}

function selectionToDOM(view) {
  var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var sel = view.state.selection;
  syncNodeSelection(view, sel);
  if (!editorOwnsSelection(view)) return;

  if (!force && view.input.mouseDown && view.input.mouseDown.allowDefault && chrome) {
    var domSel = view.domSelection(),
        curSel = view.domObserver.currentSelection;

    if (domSel.anchorNode && curSel.anchorNode && isEquivalentPosition(domSel.anchorNode, domSel.anchorOffset, curSel.anchorNode, curSel.anchorOffset)) {
      view.input.mouseDown.delayedSelectionSync = true;
      view.domObserver.setCurSelection();
      return;
    }
  }

  view.domObserver.disconnectSelection();

  if (view.cursorWrapper) {
    selectCursorWrapper(view);
  } else {
    var anchor = sel.anchor,
        head = sel.head,
        resetEditableFrom,
        resetEditableTo;

    if (brokenSelectBetweenUneditable && !(sel instanceof prosemirrorState.TextSelection)) {
      if (!sel.$from.parent.inlineContent) resetEditableFrom = temporarilyEditableNear(view, sel.from);
      if (!sel.empty && !sel.$from.parent.inlineContent) resetEditableTo = temporarilyEditableNear(view, sel.to);
    }

    view.docView.setSelection(anchor, head, view.root, force);

    if (brokenSelectBetweenUneditable) {
      if (resetEditableFrom) resetEditable(resetEditableFrom);
      if (resetEditableTo) resetEditable(resetEditableTo);
    }

    if (sel.visible) {
      view.dom.classList.remove("ProseMirror-hideselection");
    } else {
      view.dom.classList.add("ProseMirror-hideselection");
      if ("onselectionchange" in document) removeClassOnSelectionChange(view);
    }
  }

  view.domObserver.setCurSelection();
  view.domObserver.connectSelection();
}

var brokenSelectBetweenUneditable = safari || chrome && chrome_version < 63;

function temporarilyEditableNear(view, pos) {
  var _view$docView$domFrom3 = view.docView.domFromPos(pos, 0),
      node = _view$docView$domFrom3.node,
      offset = _view$docView$domFrom3.offset;

  var after = offset < node.childNodes.length ? node.childNodes[offset] : null;
  var before = offset ? node.childNodes[offset - 1] : null;
  if (safari && after && after.contentEditable == "false") return setEditable(after);

  if ((!after || after.contentEditable == "false") && (!before || before.contentEditable == "false")) {
    if (after) return setEditable(after);else if (before) return setEditable(before);
  }
}

function setEditable(element) {
  element.contentEditable = "true";

  if (safari && element.draggable) {
    element.draggable = false;
    element.wasDraggable = true;
  }

  return element;
}

function resetEditable(element) {
  element.contentEditable = "false";

  if (element.wasDraggable) {
    element.draggable = true;
    element.wasDraggable = null;
  }
}

function removeClassOnSelectionChange(view) {
  var doc = view.dom.ownerDocument;
  doc.removeEventListener("selectionchange", view.input.hideSelectionGuard);
  var domSel = view.domSelection();
  var node = domSel.anchorNode,
      offset = domSel.anchorOffset;
  doc.addEventListener("selectionchange", view.input.hideSelectionGuard = function () {
    if (domSel.anchorNode != node || domSel.anchorOffset != offset) {
      doc.removeEventListener("selectionchange", view.input.hideSelectionGuard);
      setTimeout(function () {
        if (!editorOwnsSelection(view) || view.state.selection.visible) view.dom.classList.remove("ProseMirror-hideselection");
      }, 20);
    }
  });
}

function selectCursorWrapper(view) {
  var domSel = view.domSelection(),
      range = document.createRange();
  var node = view.cursorWrapper.dom,
      img = node.nodeName == "IMG";
  if (img) range.setEnd(node.parentNode, domIndex(node) + 1);else range.setEnd(node, 0);
  range.collapse(false);
  domSel.removeAllRanges();
  domSel.addRange(range);

  if (!img && !view.state.selection.visible && ie && ie_version <= 11) {
    node.disabled = true;
    node.disabled = false;
  }
}

function syncNodeSelection(view, sel) {
  if (sel instanceof prosemirrorState.NodeSelection) {
    var desc = view.docView.descAt(sel.from);

    if (desc != view.lastSelectedViewDesc) {
      clearNodeSelection(view);
      if (desc) desc.selectNode();
      view.lastSelectedViewDesc = desc;
    }
  } else {
    clearNodeSelection(view);
  }
}

function clearNodeSelection(view) {
  if (view.lastSelectedViewDesc) {
    if (view.lastSelectedViewDesc.parent) view.lastSelectedViewDesc.deselectNode();
    view.lastSelectedViewDesc = undefined;
  }
}

function selectionBetween(view, $anchor, $head, bias) {
  return view.someProp("createSelectionBetween", function (f) {
    return f(view, $anchor, $head);
  }) || prosemirrorState.TextSelection.between($anchor, $head, bias);
}

function hasFocusAndSelection(view) {
  if (view.editable && view.root.activeElement != view.dom) return false;
  return hasSelection(view);
}

function hasSelection(view) {
  var sel = view.domSelection();
  if (!sel.anchorNode) return false;

  try {
    return view.dom.contains(sel.anchorNode.nodeType == 3 ? sel.anchorNode.parentNode : sel.anchorNode) && (view.editable || view.dom.contains(sel.focusNode.nodeType == 3 ? sel.focusNode.parentNode : sel.focusNode));
  } catch (_) {
    return false;
  }
}

function anchorInRightPlace(view) {
  var anchorDOM = view.docView.domFromPos(view.state.selection.anchor, 0);
  var domSel = view.domSelection();
  return isEquivalentPosition(anchorDOM.node, anchorDOM.offset, domSel.anchorNode, domSel.anchorOffset);
}

function moveSelectionBlock(state, dir) {
  var _state$selection = state.selection,
      $anchor = _state$selection.$anchor,
      $head = _state$selection.$head;
  var $side = dir > 0 ? $anchor.max($head) : $anchor.min($head);
  var $start = !$side.parent.inlineContent ? $side : $side.depth ? state.doc.resolve(dir > 0 ? $side.after() : $side.before()) : null;
  return $start && prosemirrorState.Selection.findFrom($start, dir);
}

function apply(view, sel) {
  view.dispatch(view.state.tr.setSelection(sel).scrollIntoView());
  return true;
}

function selectHorizontally(view, dir, mods) {
  var sel = view.state.selection;

  if (sel instanceof prosemirrorState.TextSelection) {
    if (!sel.empty || mods.indexOf("s") > -1) {
      return false;
    } else if (view.endOfTextblock(dir > 0 ? "right" : "left")) {
      var next = moveSelectionBlock(view.state, dir);
      if (next && next instanceof prosemirrorState.NodeSelection) return apply(view, next);
      return false;
    } else if (!(mac && mods.indexOf("m") > -1)) {
      var $head = sel.$head,
          node = $head.textOffset ? null : dir < 0 ? $head.nodeBefore : $head.nodeAfter,
          desc;
      if (!node || node.isText) return false;
      var nodePos = dir < 0 ? $head.pos - node.nodeSize : $head.pos;
      if (!(node.isAtom || (desc = view.docView.descAt(nodePos)) && !desc.contentDOM)) return false;

      if (prosemirrorState.NodeSelection.isSelectable(node)) {
        return apply(view, new prosemirrorState.NodeSelection(dir < 0 ? view.state.doc.resolve($head.pos - node.nodeSize) : $head));
      } else if (webkit) {
        return apply(view, new prosemirrorState.TextSelection(view.state.doc.resolve(dir < 0 ? nodePos : nodePos + node.nodeSize)));
      } else {
        return false;
      }
    }
  } else if (sel instanceof prosemirrorState.NodeSelection && sel.node.isInline) {
    return apply(view, new prosemirrorState.TextSelection(dir > 0 ? sel.$to : sel.$from));
  } else {
    var _next = moveSelectionBlock(view.state, dir);

    if (_next) return apply(view, _next);
    return false;
  }
}

function nodeLen(node) {
  return node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length;
}

function isIgnorable(dom) {
  var desc = dom.pmViewDesc;
  return desc && desc.size == 0 && (dom.nextSibling || dom.nodeName != "BR");
}

function skipIgnoredNodesLeft(view) {
  var sel = view.domSelection();
  var node = sel.focusNode,
      offset = sel.focusOffset;
  if (!node) return;
  var moveNode,
      moveOffset,
      force = false;
  if (gecko && node.nodeType == 1 && offset < nodeLen(node) && isIgnorable(node.childNodes[offset])) force = true;

  for (;;) {
    if (offset > 0) {
      if (node.nodeType != 1) {
        break;
      } else {
        var before = node.childNodes[offset - 1];

        if (isIgnorable(before)) {
          moveNode = node;
          moveOffset = --offset;
        } else if (before.nodeType == 3) {
          node = before;
          offset = node.nodeValue.length;
        } else break;
      }
    } else if (isBlockNode(node)) {
      break;
    } else {
      var prev = node.previousSibling;

      while (prev && isIgnorable(prev)) {
        moveNode = node.parentNode;
        moveOffset = domIndex(prev);
        prev = prev.previousSibling;
      }

      if (!prev) {
        node = node.parentNode;
        if (node == view.dom) break;
        offset = 0;
      } else {
        node = prev;
        offset = nodeLen(node);
      }
    }
  }

  if (force) setSelFocus(view, sel, node, offset);else if (moveNode) setSelFocus(view, sel, moveNode, moveOffset);
}

function skipIgnoredNodesRight(view) {
  var sel = view.domSelection();
  var node = sel.focusNode,
      offset = sel.focusOffset;
  if (!node) return;
  var len = nodeLen(node);
  var moveNode, moveOffset;

  for (;;) {
    if (offset < len) {
      if (node.nodeType != 1) break;
      var after = node.childNodes[offset];

      if (isIgnorable(after)) {
        moveNode = node;
        moveOffset = ++offset;
      } else break;
    } else if (isBlockNode(node)) {
      break;
    } else {
      var next = node.nextSibling;

      while (next && isIgnorable(next)) {
        moveNode = next.parentNode;
        moveOffset = domIndex(next) + 1;
        next = next.nextSibling;
      }

      if (!next) {
        node = node.parentNode;
        if (node == view.dom) break;
        offset = len = 0;
      } else {
        node = next;
        offset = 0;
        len = nodeLen(node);
      }
    }
  }

  if (moveNode) setSelFocus(view, sel, moveNode, moveOffset);
}

function isBlockNode(dom) {
  var desc = dom.pmViewDesc;
  return desc && desc.node && desc.node.isBlock;
}

function setSelFocus(view, sel, node, offset) {
  if (selectionCollapsed(sel)) {
    var range = document.createRange();
    range.setEnd(node, offset);
    range.setStart(node, offset);
    sel.removeAllRanges();
    sel.addRange(range);
  } else if (sel.extend) {
    sel.extend(node, offset);
  }

  view.domObserver.setCurSelection();
  var state = view.state;
  setTimeout(function () {
    if (view.state == state) selectionToDOM(view);
  }, 50);
}

function selectVertically(view, dir, mods) {
  var sel = view.state.selection;
  if (sel instanceof prosemirrorState.TextSelection && !sel.empty || mods.indexOf("s") > -1) return false;
  if (mac && mods.indexOf("m") > -1) return false;
  var $from = sel.$from,
      $to = sel.$to;

  if (!$from.parent.inlineContent || view.endOfTextblock(dir < 0 ? "up" : "down")) {
    var next = moveSelectionBlock(view.state, dir);
    if (next && next instanceof prosemirrorState.NodeSelection) return apply(view, next);
  }

  if (!$from.parent.inlineContent) {
    var side = dir < 0 ? $from : $to;
    var beyond = sel instanceof prosemirrorState.AllSelection ? prosemirrorState.Selection.near(side, dir) : prosemirrorState.Selection.findFrom(side, dir);
    return beyond ? apply(view, beyond) : false;
  }

  return false;
}

function stopNativeHorizontalDelete(view, dir) {
  if (!(view.state.selection instanceof prosemirrorState.TextSelection)) return true;
  var _view$state$selection2 = view.state.selection,
      $head = _view$state$selection2.$head,
      $anchor = _view$state$selection2.$anchor,
      empty = _view$state$selection2.empty;
  if (!$head.sameParent($anchor)) return true;
  if (!empty) return false;
  if (view.endOfTextblock(dir > 0 ? "forward" : "backward")) return true;
  var nextNode = !$head.textOffset && (dir < 0 ? $head.nodeBefore : $head.nodeAfter);

  if (nextNode && !nextNode.isText) {
    var tr = view.state.tr;
    if (dir < 0) tr["delete"]($head.pos - nextNode.nodeSize, $head.pos);else tr["delete"]($head.pos, $head.pos + nextNode.nodeSize);
    view.dispatch(tr);
    return true;
  }

  return false;
}

function switchEditable(view, node, state) {
  view.domObserver.stop();
  node.contentEditable = state;
  view.domObserver.start();
}

function safariDownArrowBug(view) {
  if (!safari || view.state.selection.$head.parentOffset > 0) return false;

  var _view$domSelection = view.domSelection(),
      focusNode = _view$domSelection.focusNode,
      focusOffset = _view$domSelection.focusOffset;

  if (focusNode && focusNode.nodeType == 1 && focusOffset == 0 && focusNode.firstChild && focusNode.firstChild.contentEditable == "false") {
    var child = focusNode.firstChild;
    switchEditable(view, child, "true");
    setTimeout(function () {
      return switchEditable(view, child, "false");
    }, 20);
  }

  return false;
}

function getMods(event) {
  var result = "";
  if (event.ctrlKey) result += "c";
  if (event.metaKey) result += "m";
  if (event.altKey) result += "a";
  if (event.shiftKey) result += "s";
  return result;
}

function captureKeyDown(view, event) {
  var code = event.keyCode,
      mods = getMods(event);

  if (code == 8 || mac && code == 72 && mods == "c") {
    return stopNativeHorizontalDelete(view, -1) || skipIgnoredNodesLeft(view);
  } else if (code == 46 || mac && code == 68 && mods == "c") {
    return stopNativeHorizontalDelete(view, 1) || skipIgnoredNodesRight(view);
  } else if (code == 13 || code == 27) {
    return true;
  } else if (code == 37 || mac && code == 66 && mods == "c") {
    return selectHorizontally(view, -1, mods) || skipIgnoredNodesLeft(view);
  } else if (code == 39 || mac && code == 70 && mods == "c") {
    return selectHorizontally(view, 1, mods) || skipIgnoredNodesRight(view);
  } else if (code == 38 || mac && code == 80 && mods == "c") {
    return selectVertically(view, -1, mods) || skipIgnoredNodesLeft(view);
  } else if (code == 40 || mac && code == 78 && mods == "c") {
    return safariDownArrowBug(view) || selectVertically(view, 1, mods) || skipIgnoredNodesRight(view);
  } else if (mods == (mac ? "m" : "c") && (code == 66 || code == 73 || code == 89 || code == 90)) {
    return true;
  }

  return false;
}

function serializeForClipboard(view, slice) {
  var context = [],
      content = slice.content,
      openStart = slice.openStart,
      openEnd = slice.openEnd;

  while (openStart > 1 && openEnd > 1 && content.childCount == 1 && content.firstChild.childCount == 1) {
    openStart--;
    openEnd--;
    var node = content.firstChild;
    context.push(node.type.name, node.attrs != node.type.defaultAttrs ? node.attrs : null);
    content = node.content;
  }

  var serializer = view.someProp("clipboardSerializer") || prosemirrorModel.DOMSerializer.fromSchema(view.state.schema);
  var doc = detachedDoc(),
      wrap = doc.createElement("div");
  wrap.appendChild(serializer.serializeFragment(content, {
    document: doc
  }));
  var firstChild = wrap.firstChild,
      needsWrap,
      wrappers = 0;

  while (firstChild && firstChild.nodeType == 1 && (needsWrap = wrapMap[firstChild.nodeName.toLowerCase()])) {
    for (var i = needsWrap.length - 1; i >= 0; i--) {
      var wrapper = doc.createElement(needsWrap[i]);

      while (wrap.firstChild) {
        wrapper.appendChild(wrap.firstChild);
      }

      wrap.appendChild(wrapper);
      wrappers++;
    }

    firstChild = wrap.firstChild;
  }

  if (firstChild && firstChild.nodeType == 1) firstChild.setAttribute("data-pm-slice", "".concat(openStart, " ").concat(openEnd).concat(wrappers ? " -".concat(wrappers) : "", " ").concat(JSON.stringify(context)));
  var text = view.someProp("clipboardTextSerializer", function (f) {
    return f(slice);
  }) || slice.content.textBetween(0, slice.content.size, "\n\n");
  return {
    dom: wrap,
    text: text
  };
}

function parseFromClipboard(view, text, html, plainText, $context) {
  var inCode = $context.parent.type.spec.code;
  var dom, slice;
  if (!html && !text) return null;
  var asText = text && (plainText || inCode || !html);

  if (asText) {
    view.someProp("transformPastedText", function (f) {
      text = f(text, inCode || plainText);
    });
    if (inCode) return text ? new prosemirrorModel.Slice(prosemirrorModel.Fragment.from(view.state.schema.text(text.replace(/\r\n?/g, "\n"))), 0, 0) : prosemirrorModel.Slice.empty;
    var parsed = view.someProp("clipboardTextParser", function (f) {
      return f(text, $context, plainText);
    });

    if (parsed) {
      slice = parsed;
    } else {
      var marks = $context.marks();
      var schema = view.state.schema,
          serializer = prosemirrorModel.DOMSerializer.fromSchema(schema);
      dom = document.createElement("div");
      text.split(/(?:\r\n?|\n)+/).forEach(function (block) {
        var p = dom.appendChild(document.createElement("p"));
        if (block) p.appendChild(serializer.serializeNode(schema.text(block, marks)));
      });
    }
  } else {
    view.someProp("transformPastedHTML", function (f) {
      html = f(html);
    });
    dom = readHTML(html);
    if (webkit) restoreReplacedSpaces(dom);
  }

  var contextNode = dom && dom.querySelector("[data-pm-slice]");
  var sliceData = contextNode && /^(\d+) (\d+)(?: -(\d+))? (.*)/.exec(contextNode.getAttribute("data-pm-slice") || "");
  if (sliceData && sliceData[3]) for (var i = +sliceData[3]; i > 0 && dom.firstChild; i--) {
    dom = dom.firstChild;
  }

  if (!slice) {
    var parser = view.someProp("clipboardParser") || view.someProp("domParser") || prosemirrorModel.DOMParser.fromSchema(view.state.schema);
    slice = parser.parseSlice(dom, {
      preserveWhitespace: !!(asText || sliceData),
      context: $context,
      ruleFromNode: function ruleFromNode(dom) {
        if (dom.nodeName == "BR" && !dom.nextSibling && dom.parentNode && !inlineParents.test(dom.parentNode.nodeName)) return {
          ignore: true
        };
        return null;
      }
    });
  }

  if (sliceData) {
    slice = addContext(closeSlice(slice, +sliceData[1], +sliceData[2]), sliceData[4]);
  } else {
    slice = prosemirrorModel.Slice.maxOpen(normalizeSiblings(slice.content, $context), true);

    if (slice.openStart || slice.openEnd) {
      var openStart = 0,
          openEnd = 0;

      for (var node = slice.content.firstChild; openStart < slice.openStart && !node.type.spec.isolating; openStart++, node = node.firstChild) {}

      for (var _node = slice.content.lastChild; openEnd < slice.openEnd && !_node.type.spec.isolating; openEnd++, _node = _node.lastChild) {}

      slice = closeSlice(slice, openStart, openEnd);
    }
  }

  view.someProp("transformPasted", function (f) {
    slice = f(slice);
  });
  return slice;
}

var inlineParents = /^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var)$/i;

function normalizeSiblings(fragment, $context) {
  if (fragment.childCount < 2) return fragment;

  var _loop = function _loop(d) {
    var parent = $context.node(d);
    var match = parent.contentMatchAt($context.index(d));
    var lastWrap = void 0,
        result = [];
    fragment.forEach(function (node) {
      if (!result) return;
      var wrap = match.findWrapping(node.type),
          inLast;
      if (!wrap) return result = null;

      if (inLast = result.length && lastWrap.length && addToSibling(wrap, lastWrap, node, result[result.length - 1], 0)) {
        result[result.length - 1] = inLast;
      } else {
        if (result.length) result[result.length - 1] = closeRight(result[result.length - 1], lastWrap.length);
        var wrapped = withWrappers(node, wrap);
        result.push(wrapped);
        match = match.matchType(wrapped.type);
        lastWrap = wrap;
      }
    });
    if (result) return {
      v: prosemirrorModel.Fragment.from(result)
    };
  };

  for (var d = $context.depth; d >= 0; d--) {
    var _ret = _loop(d);

    if (_typeof(_ret) === "object") return _ret.v;
  }

  return fragment;
}

function withWrappers(node, wrap) {
  var from = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  for (var i = wrap.length - 1; i >= from; i--) {
    node = wrap[i].create(null, prosemirrorModel.Fragment.from(node));
  }

  return node;
}

function addToSibling(wrap, lastWrap, node, sibling, depth) {
  if (depth < wrap.length && depth < lastWrap.length && wrap[depth] == lastWrap[depth]) {
    var inner = addToSibling(wrap, lastWrap, node, sibling.lastChild, depth + 1);
    if (inner) return sibling.copy(sibling.content.replaceChild(sibling.childCount - 1, inner));
    var match = sibling.contentMatchAt(sibling.childCount);
    if (match.matchType(depth == wrap.length - 1 ? node.type : wrap[depth + 1])) return sibling.copy(sibling.content.append(prosemirrorModel.Fragment.from(withWrappers(node, wrap, depth + 1))));
  }
}

function closeRight(node, depth) {
  if (depth == 0) return node;
  var fragment = node.content.replaceChild(node.childCount - 1, closeRight(node.lastChild, depth - 1));
  var fill = node.contentMatchAt(node.childCount).fillBefore(prosemirrorModel.Fragment.empty, true);
  return node.copy(fragment.append(fill));
}

function closeRange(fragment, side, from, to, depth, openEnd) {
  var node = side < 0 ? fragment.firstChild : fragment.lastChild,
      inner = node.content;
  if (depth < to - 1) inner = closeRange(inner, side, from, to, depth + 1, openEnd);
  if (depth >= from) inner = side < 0 ? node.contentMatchAt(0).fillBefore(inner, fragment.childCount > 1 || openEnd <= depth).append(inner) : inner.append(node.contentMatchAt(node.childCount).fillBefore(prosemirrorModel.Fragment.empty, true));
  return fragment.replaceChild(side < 0 ? 0 : fragment.childCount - 1, node.copy(inner));
}

function closeSlice(slice, openStart, openEnd) {
  if (openStart < slice.openStart) slice = new prosemirrorModel.Slice(closeRange(slice.content, -1, openStart, slice.openStart, 0, slice.openEnd), openStart, slice.openEnd);
  if (openEnd < slice.openEnd) slice = new prosemirrorModel.Slice(closeRange(slice.content, 1, openEnd, slice.openEnd, 0, 0), slice.openStart, openEnd);
  return slice;
}

var wrapMap = {
  thead: ["table"],
  tbody: ["table"],
  tfoot: ["table"],
  caption: ["table"],
  colgroup: ["table"],
  col: ["table", "colgroup"],
  tr: ["table", "tbody"],
  td: ["table", "tbody", "tr"],
  th: ["table", "tbody", "tr"]
};
var _detachedDoc = null;

function detachedDoc() {
  return _detachedDoc || (_detachedDoc = document.implementation.createHTMLDocument("title"));
}

function readHTML(html) {
  var metas = /^(\s*<meta [^>]*>)*/.exec(html);
  if (metas) html = html.slice(metas[0].length);
  var elt = detachedDoc().createElement("div");
  var firstTag = /<([a-z][^>\s]+)/i.exec(html),
      wrap;
  if (wrap = firstTag && wrapMap[firstTag[1].toLowerCase()]) html = wrap.map(function (n) {
    return "<" + n + ">";
  }).join("") + html + wrap.map(function (n) {
    return "</" + n + ">";
  }).reverse().join("");
  elt.innerHTML = html;
  if (wrap) for (var i = 0; i < wrap.length; i++) {
    elt = elt.querySelector(wrap[i]) || elt;
  }
  return elt;
}

function restoreReplacedSpaces(dom) {
  var nodes = dom.querySelectorAll(chrome ? "span:not([class]):not([style])" : "span.Apple-converted-space");

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (node.childNodes.length == 1 && node.textContent == "\xA0" && node.parentNode) node.parentNode.replaceChild(dom.ownerDocument.createTextNode(" "), node);
  }
}

function addContext(slice, context) {
  if (!slice.size) return slice;
  var schema = slice.content.firstChild.type.schema,
      array;

  try {
    array = JSON.parse(context);
  } catch (e) {
    return slice;
  }

  var content = slice.content,
      openStart = slice.openStart,
      openEnd = slice.openEnd;

  for (var i = array.length - 2; i >= 0; i -= 2) {
    var type = schema.nodes[array[i]];
    if (!type || type.hasRequiredAttrs()) break;
    content = prosemirrorModel.Fragment.from(type.create(array[i + 1], content));
    openStart++;
    openEnd++;
  }

  return new prosemirrorModel.Slice(content, openStart, openEnd);
}

var handlers = {};
var editHandlers = {};

var InputState = _createClass(function InputState() {
  _classCallCheck(this, InputState);

  this.shiftKey = false;
  this.mouseDown = null;
  this.lastKeyCode = null;
  this.lastKeyCodeTime = 0;
  this.lastClick = {
    time: 0,
    x: 0,
    y: 0,
    type: ""
  };
  this.lastSelectionOrigin = null;
  this.lastSelectionTime = 0;
  this.lastIOSEnter = 0;
  this.lastIOSEnterFallbackTimeout = -1;
  this.lastAndroidDelete = 0;
  this.composing = false;
  this.composingTimeout = -1;
  this.compositionNodes = [];
  this.compositionEndedAt = -2e8;
  this.domChangeCount = 0;
  this.eventHandlers = Object.create(null);
  this.hideSelectionGuard = null;
});

function initInput(view) {
  var _loop2 = function _loop2(event) {
    var handler = handlers[event];
    view.dom.addEventListener(event, view.input.eventHandlers[event] = function (event) {
      if (eventBelongsToView(view, event) && !runCustomHandler(view, event) && (view.editable || !(event.type in editHandlers))) handler(view, event);
    });
  };

  for (var event in handlers) {
    _loop2(event);
  }

  if (safari) view.dom.addEventListener("input", function () {
    return null;
  });
  ensureListeners(view);
}

function setSelectionOrigin(view, origin) {
  view.input.lastSelectionOrigin = origin;
  view.input.lastSelectionTime = Date.now();
}

function destroyInput(view) {
  view.domObserver.stop();

  for (var type in view.input.eventHandlers) {
    view.dom.removeEventListener(type, view.input.eventHandlers[type]);
  }

  clearTimeout(view.input.composingTimeout);
  clearTimeout(view.input.lastIOSEnterFallbackTimeout);
}

function ensureListeners(view) {
  view.someProp("handleDOMEvents", function (currentHandlers) {
    for (var type in currentHandlers) {
      if (!view.input.eventHandlers[type]) view.dom.addEventListener(type, view.input.eventHandlers[type] = function (event) {
        return runCustomHandler(view, event);
      });
    }
  });
}

function runCustomHandler(view, event) {
  return view.someProp("handleDOMEvents", function (handlers) {
    var handler = handlers[event.type];
    return handler ? handler(view, event) || event.defaultPrevented : false;
  });
}

function eventBelongsToView(view, event) {
  if (!event.bubbles) return true;
  if (event.defaultPrevented) return false;

  for (var node = event.target; node != view.dom; node = node.parentNode) {
    if (!node || node.nodeType == 11 || node.pmViewDesc && node.pmViewDesc.stopEvent(event)) return false;
  }

  return true;
}

function _dispatchEvent(view, event) {
  if (!runCustomHandler(view, event) && handlers[event.type] && (view.editable || !(event.type in editHandlers))) handlers[event.type](view, event);
}

editHandlers.keydown = function (view, _event) {
  var event = _event;
  view.input.shiftKey = event.keyCode == 16 || event.shiftKey;
  if (inOrNearComposition(view, event)) return;
  view.input.lastKeyCode = event.keyCode;
  view.input.lastKeyCodeTime = Date.now();
  if (android && chrome && event.keyCode == 13) return;
  if (event.keyCode != 229) view.domObserver.forceFlush();

  if (ios && event.keyCode == 13 && !event.ctrlKey && !event.altKey && !event.metaKey) {
    var now = Date.now();
    view.input.lastIOSEnter = now;
    view.input.lastIOSEnterFallbackTimeout = setTimeout(function () {
      if (view.input.lastIOSEnter == now) {
        view.someProp("handleKeyDown", function (f) {
          return f(view, keyEvent(13, "Enter"));
        });
        view.input.lastIOSEnter = 0;
      }
    }, 200);
  } else if (view.someProp("handleKeyDown", function (f) {
    return f(view, event);
  }) || captureKeyDown(view, event)) {
    event.preventDefault();
  } else {
    setSelectionOrigin(view, "key");
  }
};

editHandlers.keyup = function (view, event) {
  if (event.keyCode == 16) view.input.shiftKey = false;
};

editHandlers.keypress = function (view, _event) {
  var event = _event;
  if (inOrNearComposition(view, event) || !event.charCode || event.ctrlKey && !event.altKey || mac && event.metaKey) return;

  if (view.someProp("handleKeyPress", function (f) {
    return f(view, event);
  })) {
    event.preventDefault();
    return;
  }

  var sel = view.state.selection;

  if (!(sel instanceof prosemirrorState.TextSelection) || !sel.$from.sameParent(sel.$to)) {
    var text = String.fromCharCode(event.charCode);
    if (!view.someProp("handleTextInput", function (f) {
      return f(view, sel.$from.pos, sel.$to.pos, text);
    })) view.dispatch(view.state.tr.insertText(text).scrollIntoView());
    event.preventDefault();
  }
};

function eventCoords(event) {
  return {
    left: event.clientX,
    top: event.clientY
  };
}

function isNear(event, click) {
  var dx = click.x - event.clientX,
      dy = click.y - event.clientY;
  return dx * dx + dy * dy < 100;
}

function runHandlerOnContext(view, propName, pos, inside, event) {
  if (inside == -1) return false;
  var $pos = view.state.doc.resolve(inside);

  var _loop3 = function _loop3(i) {
    if (view.someProp(propName, function (f) {
      return i > $pos.depth ? f(view, pos, $pos.nodeAfter, $pos.before(i), event, true) : f(view, pos, $pos.node(i), $pos.before(i), event, false);
    })) return {
      v: true
    };
  };

  for (var i = $pos.depth + 1; i > 0; i--) {
    var _ret2 = _loop3(i);

    if (_typeof(_ret2) === "object") return _ret2.v;
  }

  return false;
}

function updateSelection(view, selection, origin) {
  if (!view.focused) view.focus();
  var tr = view.state.tr.setSelection(selection);
  if (origin == "pointer") tr.setMeta("pointer", true);
  view.dispatch(tr);
}

function selectClickedLeaf(view, inside) {
  if (inside == -1) return false;
  var $pos = view.state.doc.resolve(inside),
      node = $pos.nodeAfter;

  if (node && node.isAtom && prosemirrorState.NodeSelection.isSelectable(node)) {
    updateSelection(view, new prosemirrorState.NodeSelection($pos), "pointer");
    return true;
  }

  return false;
}

function selectClickedNode(view, inside) {
  if (inside == -1) return false;
  var sel = view.state.selection,
      selectedNode,
      selectAt;
  if (sel instanceof prosemirrorState.NodeSelection) selectedNode = sel.node;
  var $pos = view.state.doc.resolve(inside);

  for (var i = $pos.depth + 1; i > 0; i--) {
    var node = i > $pos.depth ? $pos.nodeAfter : $pos.node(i);

    if (prosemirrorState.NodeSelection.isSelectable(node)) {
      if (selectedNode && sel.$from.depth > 0 && i >= sel.$from.depth && $pos.before(sel.$from.depth + 1) == sel.$from.pos) selectAt = $pos.before(sel.$from.depth);else selectAt = $pos.before(i);
      break;
    }
  }

  if (selectAt != null) {
    updateSelection(view, prosemirrorState.NodeSelection.create(view.state.doc, selectAt), "pointer");
    return true;
  } else {
    return false;
  }
}

function handleSingleClick(view, pos, inside, event, selectNode) {
  return runHandlerOnContext(view, "handleClickOn", pos, inside, event) || view.someProp("handleClick", function (f) {
    return f(view, pos, event);
  }) || (selectNode ? selectClickedNode(view, inside) : selectClickedLeaf(view, inside));
}

function handleDoubleClick(view, pos, inside, event) {
  return runHandlerOnContext(view, "handleDoubleClickOn", pos, inside, event) || view.someProp("handleDoubleClick", function (f) {
    return f(view, pos, event);
  });
}

function handleTripleClick(view, pos, inside, event) {
  return runHandlerOnContext(view, "handleTripleClickOn", pos, inside, event) || view.someProp("handleTripleClick", function (f) {
    return f(view, pos, event);
  }) || defaultTripleClick(view, inside, event);
}

function defaultTripleClick(view, inside, event) {
  if (event.button != 0) return false;
  var doc = view.state.doc;

  if (inside == -1) {
    if (doc.inlineContent) {
      updateSelection(view, prosemirrorState.TextSelection.create(doc, 0, doc.content.size), "pointer");
      return true;
    }

    return false;
  }

  var $pos = doc.resolve(inside);

  for (var i = $pos.depth + 1; i > 0; i--) {
    var node = i > $pos.depth ? $pos.nodeAfter : $pos.node(i);
    var nodePos = $pos.before(i);
    if (node.inlineContent) updateSelection(view, prosemirrorState.TextSelection.create(doc, nodePos + 1, nodePos + 1 + node.content.size), "pointer");else if (prosemirrorState.NodeSelection.isSelectable(node)) updateSelection(view, prosemirrorState.NodeSelection.create(doc, nodePos), "pointer");else continue;
    return true;
  }
}

function forceDOMFlush(view) {
  return endComposition(view);
}

var selectNodeModifier = mac ? "metaKey" : "ctrlKey";

handlers.mousedown = function (view, _event) {
  var event = _event;
  view.input.shiftKey = event.shiftKey;
  var flushed = forceDOMFlush(view);
  var now = Date.now(),
      type = "singleClick";

  if (now - view.input.lastClick.time < 500 && isNear(event, view.input.lastClick) && !event[selectNodeModifier]) {
    if (view.input.lastClick.type == "singleClick") type = "doubleClick";else if (view.input.lastClick.type == "doubleClick") type = "tripleClick";
  }

  view.input.lastClick = {
    time: now,
    x: event.clientX,
    y: event.clientY,
    type: type
  };
  var pos = view.posAtCoords(eventCoords(event));
  if (!pos) return;

  if (type == "singleClick") {
    if (view.input.mouseDown) view.input.mouseDown.done();
    view.input.mouseDown = new MouseDown(view, pos, event, !!flushed);
  } else if ((type == "doubleClick" ? handleDoubleClick : handleTripleClick)(view, pos.pos, pos.inside, event)) {
    event.preventDefault();
  } else {
    setSelectionOrigin(view, "pointer");
  }
};

var MouseDown = function () {
  function MouseDown(view, pos, event, flushed) {
    var _this8 = this;

    _classCallCheck(this, MouseDown);

    this.view = view;
    this.pos = pos;
    this.event = event;
    this.flushed = flushed;
    this.delayedSelectionSync = false;
    this.mightDrag = null;
    this.startDoc = view.state.doc;
    this.selectNode = !!event[selectNodeModifier];
    this.allowDefault = event.shiftKey;
    var targetNode, targetPos;

    if (pos.inside > -1) {
      targetNode = view.state.doc.nodeAt(pos.inside);
      targetPos = pos.inside;
    } else {
      var $pos = view.state.doc.resolve(pos.pos);
      targetNode = $pos.parent;
      targetPos = $pos.depth ? $pos.before() : 0;
    }

    var target = flushed ? null : event.target;
    var targetDesc = target ? view.docView.nearestDesc(target, true) : null;
    this.target = targetDesc ? targetDesc.dom : null;
    var selection = view.state.selection;
    if (event.button == 0 && targetNode.type.spec.draggable && targetNode.type.spec.selectable !== false || selection instanceof prosemirrorState.NodeSelection && selection.from <= targetPos && selection.to > targetPos) this.mightDrag = {
      node: targetNode,
      pos: targetPos,
      addAttr: !!(this.target && !this.target.draggable),
      setUneditable: !!(this.target && gecko && !this.target.hasAttribute("contentEditable"))
    };

    if (this.target && this.mightDrag && (this.mightDrag.addAttr || this.mightDrag.setUneditable)) {
      this.view.domObserver.stop();
      if (this.mightDrag.addAttr) this.target.draggable = true;
      if (this.mightDrag.setUneditable) setTimeout(function () {
        if (_this8.view.input.mouseDown == _this8) _this8.target.setAttribute("contentEditable", "false");
      }, 20);
      this.view.domObserver.start();
    }

    view.root.addEventListener("mouseup", this.up = this.up.bind(this));
    view.root.addEventListener("mousemove", this.move = this.move.bind(this));
    setSelectionOrigin(view, "pointer");
  }

  _createClass(MouseDown, [{
    key: "done",
    value: function done() {
      var _this9 = this;

      this.view.root.removeEventListener("mouseup", this.up);
      this.view.root.removeEventListener("mousemove", this.move);

      if (this.mightDrag && this.target) {
        this.view.domObserver.stop();
        if (this.mightDrag.addAttr) this.target.removeAttribute("draggable");
        if (this.mightDrag.setUneditable) this.target.removeAttribute("contentEditable");
        this.view.domObserver.start();
      }

      if (this.delayedSelectionSync) setTimeout(function () {
        return selectionToDOM(_this9.view);
      });
      this.view.input.mouseDown = null;
    }
  }, {
    key: "up",
    value: function up(event) {
      this.done();
      if (!this.view.dom.contains(event.target)) return;
      var pos = this.pos;
      if (this.view.state.doc != this.startDoc) pos = this.view.posAtCoords(eventCoords(event));

      if (this.allowDefault || !pos) {
        setSelectionOrigin(this.view, "pointer");
      } else if (handleSingleClick(this.view, pos.pos, pos.inside, event, this.selectNode)) {
        event.preventDefault();
      } else if (event.button == 0 && (this.flushed || safari && this.mightDrag && !this.mightDrag.node.isAtom || chrome && !(this.view.state.selection instanceof prosemirrorState.TextSelection) && Math.min(Math.abs(pos.pos - this.view.state.selection.from), Math.abs(pos.pos - this.view.state.selection.to)) <= 2)) {
        updateSelection(this.view, prosemirrorState.Selection.near(this.view.state.doc.resolve(pos.pos)), "pointer");
        event.preventDefault();
      } else {
        setSelectionOrigin(this.view, "pointer");
      }
    }
  }, {
    key: "move",
    value: function move(event) {
      if (!this.allowDefault && (Math.abs(this.event.x - event.clientX) > 4 || Math.abs(this.event.y - event.clientY) > 4)) this.allowDefault = true;
      setSelectionOrigin(this.view, "pointer");
      if (event.buttons == 0) this.done();
    }
  }]);

  return MouseDown;
}();

handlers.touchdown = function (view) {
  forceDOMFlush(view);
  setSelectionOrigin(view, "pointer");
};

handlers.contextmenu = function (view) {
  return forceDOMFlush(view);
};

function inOrNearComposition(view, event) {
  if (view.composing) return true;

  if (safari && Math.abs(event.timeStamp - view.input.compositionEndedAt) < 500) {
    view.input.compositionEndedAt = -2e8;
    return true;
  }

  return false;
}

var timeoutComposition = android ? 5000 : -1;

editHandlers.compositionstart = editHandlers.compositionupdate = function (view) {
  if (!view.composing) {
    view.domObserver.flush();
    var state = view.state,
        $pos = state.selection.$from;

    if (state.selection.empty && (state.storedMarks || !$pos.textOffset && $pos.parentOffset && $pos.nodeBefore.marks.some(function (m) {
      return m.type.spec.inclusive === false;
    }))) {
      view.markCursor = view.state.storedMarks || $pos.marks();
      endComposition(view, true);
      view.markCursor = null;
    } else {
      endComposition(view);

      if (gecko && state.selection.empty && $pos.parentOffset && !$pos.textOffset && $pos.nodeBefore.marks.length) {
        var sel = view.domSelection();

        for (var node = sel.focusNode, offset = sel.focusOffset; node && node.nodeType == 1 && offset != 0;) {
          var before = offset < 0 ? node.lastChild : node.childNodes[offset - 1];
          if (!before) break;

          if (before.nodeType == 3) {
            sel.collapse(before, before.nodeValue.length);
            break;
          } else {
            node = before;
            offset = -1;
          }
        }
      }
    }

    view.input.composing = true;
  }

  scheduleComposeEnd(view, timeoutComposition);
};

editHandlers.compositionend = function (view, event) {
  if (view.composing) {
    view.input.composing = false;
    view.input.compositionEndedAt = event.timeStamp;
    scheduleComposeEnd(view, 20);
  }
};

function scheduleComposeEnd(view, delay) {
  clearTimeout(view.input.composingTimeout);
  if (delay > -1) view.input.composingTimeout = setTimeout(function () {
    return endComposition(view);
  }, delay);
}

function clearComposition(view) {
  if (view.composing) {
    view.input.composing = false;
    view.input.compositionEndedAt = timestampFromCustomEvent();
  }

  while (view.input.compositionNodes.length > 0) {
    view.input.compositionNodes.pop().markParentsDirty();
  }
}

function timestampFromCustomEvent() {
  var event = document.createEvent("Event");
  event.initEvent("event", true, true);
  return event.timeStamp;
}

function endComposition(view) {
  var forceUpdate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  if (android && view.domObserver.flushingSoon >= 0) return;
  view.domObserver.forceFlush();
  clearComposition(view);

  if (forceUpdate || view.docView && view.docView.dirty) {
    var sel = selectionFromDOM(view);
    if (sel && !sel.eq(view.state.selection)) view.dispatch(view.state.tr.setSelection(sel));else view.updateState(view.state);
    return true;
  }

  return false;
}

function captureCopy(view, dom) {
  if (!view.dom.parentNode) return;
  var wrap = view.dom.parentNode.appendChild(document.createElement("div"));
  wrap.appendChild(dom);
  wrap.style.cssText = "position: fixed; left: -10000px; top: 10px";
  var sel = getSelection(),
      range = document.createRange();
  range.selectNodeContents(dom);
  view.dom.blur();
  sel.removeAllRanges();
  sel.addRange(range);
  setTimeout(function () {
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    view.focus();
  }, 50);
}

var brokenClipboardAPI = ie && ie_version < 15 || ios && webkit_version < 604;

handlers.copy = editHandlers.cut = function (view, _event) {
  var event = _event;
  var sel = view.state.selection,
      cut = event.type == "cut";
  if (sel.empty) return;
  var data = brokenClipboardAPI ? null : event.clipboardData;

  var slice = sel.content(),
      _serializeForClipboar = serializeForClipboard(view, slice),
      dom = _serializeForClipboar.dom,
      text = _serializeForClipboar.text;

  if (data) {
    event.preventDefault();
    data.clearData();
    data.setData("text/html", dom.innerHTML);
    data.setData("text/plain", text);
  } else {
    captureCopy(view, dom);
  }

  if (cut) view.dispatch(view.state.tr.deleteSelection().scrollIntoView().setMeta("uiEvent", "cut"));
};

function sliceSingleNode(slice) {
  return slice.openStart == 0 && slice.openEnd == 0 && slice.content.childCount == 1 ? slice.content.firstChild : null;
}

function capturePaste(view, event) {
  if (!view.dom.parentNode) return;
  var plainText = view.input.shiftKey || view.state.selection.$from.parent.type.spec.code;
  var target = view.dom.parentNode.appendChild(document.createElement(plainText ? "textarea" : "div"));
  if (!plainText) target.contentEditable = "true";
  target.style.cssText = "position: fixed; left: -10000px; top: 10px";
  target.focus();
  setTimeout(function () {
    view.focus();
    if (target.parentNode) target.parentNode.removeChild(target);
    if (plainText) doPaste(view, target.value, null, event);else doPaste(view, target.textContent, target.innerHTML, event);
  }, 50);
}

function doPaste(view, text, html, event) {
  var slice = parseFromClipboard(view, text, html, view.input.shiftKey, view.state.selection.$from);
  if (view.someProp("handlePaste", function (f) {
    return f(view, event, slice || prosemirrorModel.Slice.empty);
  })) return true;
  if (!slice) return false;
  var singleNode = sliceSingleNode(slice);
  var tr = singleNode ? view.state.tr.replaceSelectionWith(singleNode, view.input.shiftKey) : view.state.tr.replaceSelection(slice);
  view.dispatch(tr.scrollIntoView().setMeta("paste", true).setMeta("uiEvent", "paste"));
  return true;
}

editHandlers.paste = function (view, _event) {
  var event = _event;
  if (view.composing && !android) return;
  var data = brokenClipboardAPI ? null : event.clipboardData;
  if (data && doPaste(view, data.getData("text/plain"), data.getData("text/html"), event)) event.preventDefault();else capturePaste(view, event);
};

var Dragging = _createClass(function Dragging(slice, move) {
  _classCallCheck(this, Dragging);

  this.slice = slice;
  this.move = move;
});

var dragCopyModifier = mac ? "altKey" : "ctrlKey";

handlers.dragstart = function (view, _event) {
  var event = _event;
  var mouseDown = view.input.mouseDown;
  if (mouseDown) mouseDown.done();
  if (!event.dataTransfer) return;
  var sel = view.state.selection;
  var pos = sel.empty ? null : view.posAtCoords(eventCoords(event));
  if (pos && pos.pos >= sel.from && pos.pos <= (sel instanceof prosemirrorState.NodeSelection ? sel.to - 1 : sel.to)) ;else if (mouseDown && mouseDown.mightDrag) {
    view.dispatch(view.state.tr.setSelection(prosemirrorState.NodeSelection.create(view.state.doc, mouseDown.mightDrag.pos)));
  } else if (event.target && event.target.nodeType == 1) {
    var desc = view.docView.nearestDesc(event.target, true);
    if (desc && desc.node.type.spec.draggable && desc != view.docView) view.dispatch(view.state.tr.setSelection(prosemirrorState.NodeSelection.create(view.state.doc, desc.posBefore)));
  }

  var slice = view.state.selection.content(),
      _serializeForClipboar2 = serializeForClipboard(view, slice),
      dom = _serializeForClipboar2.dom,
      text = _serializeForClipboar2.text;

  event.dataTransfer.clearData();
  event.dataTransfer.setData(brokenClipboardAPI ? "Text" : "text/html", dom.innerHTML);
  event.dataTransfer.effectAllowed = "copyMove";
  if (!brokenClipboardAPI) event.dataTransfer.setData("text/plain", text);
  view.dragging = new Dragging(slice, !event[dragCopyModifier]);
};

handlers.dragend = function (view) {
  var dragging = view.dragging;
  window.setTimeout(function () {
    if (view.dragging == dragging) view.dragging = null;
  }, 50);
};

editHandlers.dragover = editHandlers.dragenter = function (_, e) {
  return e.preventDefault();
};

editHandlers.drop = function (view, _event) {
  var event = _event;
  var dragging = view.dragging;
  view.dragging = null;
  if (!event.dataTransfer) return;
  var eventPos = view.posAtCoords(eventCoords(event));
  if (!eventPos) return;
  var $mouse = view.state.doc.resolve(eventPos.pos);
  if (!$mouse) return;
  var slice = dragging && dragging.slice;

  if (slice) {
    view.someProp("transformPasted", function (f) {
      slice = f(slice);
    });
  } else {
    slice = parseFromClipboard(view, event.dataTransfer.getData(brokenClipboardAPI ? "Text" : "text/plain"), brokenClipboardAPI ? null : event.dataTransfer.getData("text/html"), false, $mouse);
  }

  var move = !!(dragging && !event[dragCopyModifier]);

  if (view.someProp("handleDrop", function (f) {
    return f(view, event, slice || prosemirrorModel.Slice.empty, move);
  })) {
    event.preventDefault();
    return;
  }

  if (!slice) return;
  event.preventDefault();
  var insertPos = slice ? prosemirrorTransform.dropPoint(view.state.doc, $mouse.pos, slice) : $mouse.pos;
  if (insertPos == null) insertPos = $mouse.pos;
  var tr = view.state.tr;
  if (move) tr.deleteSelection();
  var pos = tr.mapping.map(insertPos);
  var isNode = slice.openStart == 0 && slice.openEnd == 0 && slice.content.childCount == 1;
  var beforeInsert = tr.doc;
  if (isNode) tr.replaceRangeWith(pos, pos, slice.content.firstChild);else tr.replaceRange(pos, pos, slice);
  if (tr.doc.eq(beforeInsert)) return;
  var $pos = tr.doc.resolve(pos);

  if (isNode && prosemirrorState.NodeSelection.isSelectable(slice.content.firstChild) && $pos.nodeAfter && $pos.nodeAfter.sameMarkup(slice.content.firstChild)) {
    tr.setSelection(new prosemirrorState.NodeSelection($pos));
  } else {
    var end = tr.mapping.map(insertPos);
    tr.mapping.maps[tr.mapping.maps.length - 1].forEach(function (_from, _to, _newFrom, newTo) {
      return end = newTo;
    });
    tr.setSelection(selectionBetween(view, $pos, tr.doc.resolve(end)));
  }

  view.focus();
  view.dispatch(tr.setMeta("uiEvent", "drop"));
};

handlers.focus = function (view) {
  if (!view.focused) {
    view.domObserver.stop();
    view.dom.classList.add("ProseMirror-focused");
    view.domObserver.start();
    view.focused = true;
    setTimeout(function () {
      if (view.docView && view.hasFocus() && !view.domObserver.currentSelection.eq(view.domSelection())) selectionToDOM(view);
    }, 20);
  }
};

handlers.blur = function (view, _event) {
  var event = _event;

  if (view.focused) {
    view.domObserver.stop();
    view.dom.classList.remove("ProseMirror-focused");
    view.domObserver.start();
    if (event.relatedTarget && view.dom.contains(event.relatedTarget)) view.domObserver.currentSelection.clear();
    view.focused = false;
  }
};

handlers.beforeinput = function (view, _event) {
  var event = _event;

  if (chrome && android && event.inputType == "deleteContentBackward") {
    view.domObserver.flushSoon();
    var domChangeCount = view.input.domChangeCount;
    setTimeout(function () {
      if (view.input.domChangeCount != domChangeCount) return;
      view.dom.blur();
      view.focus();
      if (view.someProp("handleKeyDown", function (f) {
        return f(view, keyEvent(8, "Backspace"));
      })) return;
      var $cursor = view.state.selection.$cursor;
      if ($cursor && $cursor.pos > 0) view.dispatch(view.state.tr["delete"]($cursor.pos - 1, $cursor.pos).scrollIntoView());
    }, 50);
  }
};

for (var prop in editHandlers) {
  handlers[prop] = editHandlers[prop];
}

function compareObjs(a, b) {
  if (a == b) return true;

  for (var p in a) {
    if (a[p] !== b[p]) return false;
  }

  for (var _p in b) {
    if (!(_p in a)) return false;
  }

  return true;
}

var WidgetType = function () {
  function WidgetType(toDOM, spec) {
    _classCallCheck(this, WidgetType);

    this.toDOM = toDOM;
    this.spec = spec || noSpec;
    this.side = this.spec.side || 0;
  }

  _createClass(WidgetType, [{
    key: "map",
    value: function map(mapping, span, offset, oldOffset) {
      var _mapping$mapResult = mapping.mapResult(span.from + oldOffset, this.side < 0 ? -1 : 1),
          pos = _mapping$mapResult.pos,
          deleted = _mapping$mapResult.deleted;

      return deleted ? null : new Decoration(pos - offset, pos - offset, this);
    }
  }, {
    key: "valid",
    value: function valid() {
      return true;
    }
  }, {
    key: "eq",
    value: function eq(other) {
      return this == other || other instanceof WidgetType && (this.spec.key && this.spec.key == other.spec.key || this.toDOM == other.toDOM && compareObjs(this.spec, other.spec));
    }
  }, {
    key: "destroy",
    value: function destroy(node) {
      if (this.spec.destroy) this.spec.destroy(node);
    }
  }]);

  return WidgetType;
}();

var InlineType = function () {
  function InlineType(attrs, spec) {
    _classCallCheck(this, InlineType);

    this.attrs = attrs;
    this.spec = spec || noSpec;
  }

  _createClass(InlineType, [{
    key: "map",
    value: function map(mapping, span, offset, oldOffset) {
      var from = mapping.map(span.from + oldOffset, this.spec.inclusiveStart ? -1 : 1) - offset;
      var to = mapping.map(span.to + oldOffset, this.spec.inclusiveEnd ? 1 : -1) - offset;
      return from >= to ? null : new Decoration(from, to, this);
    }
  }, {
    key: "valid",
    value: function valid(_, span) {
      return span.from < span.to;
    }
  }, {
    key: "eq",
    value: function eq(other) {
      return this == other || other instanceof InlineType && compareObjs(this.attrs, other.attrs) && compareObjs(this.spec, other.spec);
    }
  }, {
    key: "destroy",
    value: function destroy() {}
  }], [{
    key: "is",
    value: function is(span) {
      return span.type instanceof InlineType;
    }
  }]);

  return InlineType;
}();

var NodeType = function () {
  function NodeType(attrs, spec) {
    _classCallCheck(this, NodeType);

    this.attrs = attrs;
    this.spec = spec || noSpec;
  }

  _createClass(NodeType, [{
    key: "map",
    value: function map(mapping, span, offset, oldOffset) {
      var from = mapping.mapResult(span.from + oldOffset, 1);
      if (from.deleted) return null;
      var to = mapping.mapResult(span.to + oldOffset, -1);
      if (to.deleted || to.pos <= from.pos) return null;
      return new Decoration(from.pos - offset, to.pos - offset, this);
    }
  }, {
    key: "valid",
    value: function valid(node, span) {
      var _node$content$findInd = node.content.findIndex(span.from),
          index = _node$content$findInd.index,
          offset = _node$content$findInd.offset,
          child;

      return offset == span.from && !(child = node.child(index)).isText && offset + child.nodeSize == span.to;
    }
  }, {
    key: "eq",
    value: function eq(other) {
      return this == other || other instanceof NodeType && compareObjs(this.attrs, other.attrs) && compareObjs(this.spec, other.spec);
    }
  }, {
    key: "destroy",
    value: function destroy() {}
  }]);

  return NodeType;
}();

var Decoration = function () {
  function Decoration(from, to, type) {
    _classCallCheck(this, Decoration);

    this.from = from;
    this.to = to;
    this.type = type;
  }

  _createClass(Decoration, [{
    key: "copy",
    value: function copy(from, to) {
      return new Decoration(from, to, this.type);
    }
  }, {
    key: "eq",
    value: function eq(other) {
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      return this.type.eq(other.type) && this.from + offset == other.from && this.to + offset == other.to;
    }
  }, {
    key: "map",
    value: function map(mapping, offset, oldOffset) {
      return this.type.map(mapping, this, offset, oldOffset);
    }
  }, {
    key: "spec",
    get: function get() {
      return this.type.spec;
    }
  }, {
    key: "inline",
    get: function get() {
      return this.type instanceof InlineType;
    }
  }], [{
    key: "widget",
    value: function widget(pos, toDOM, spec) {
      return new Decoration(pos, pos, new WidgetType(toDOM, spec));
    }
  }, {
    key: "inline",
    value: function inline(from, to, attrs, spec) {
      return new Decoration(from, to, new InlineType(attrs, spec));
    }
  }, {
    key: "node",
    value: function node(from, to, attrs, spec) {
      return new Decoration(from, to, new NodeType(attrs, spec));
    }
  }]);

  return Decoration;
}();

var none = [],
    noSpec = {};

var DecorationSet = function () {
  function DecorationSet(local, children) {
    _classCallCheck(this, DecorationSet);

    this.local = local.length ? local : none;
    this.children = children.length ? children : none;
  }

  _createClass(DecorationSet, [{
    key: "find",
    value: function find(start, end, predicate) {
      var result = [];
      this.findInner(start == null ? 0 : start, end == null ? 1e9 : end, result, 0, predicate);
      return result;
    }
  }, {
    key: "findInner",
    value: function findInner(start, end, result, offset, predicate) {
      for (var i = 0; i < this.local.length; i++) {
        var span = this.local[i];
        if (span.from <= end && span.to >= start && (!predicate || predicate(span.spec))) result.push(span.copy(span.from + offset, span.to + offset));
      }

      for (var _i5 = 0; _i5 < this.children.length; _i5 += 3) {
        if (this.children[_i5] < end && this.children[_i5 + 1] > start) {
          var childOff = this.children[_i5] + 1;

          this.children[_i5 + 2].findInner(start - childOff, end - childOff, result, offset + childOff, predicate);
        }
      }
    }
  }, {
    key: "map",
    value: function map(mapping, doc, options) {
      if (this == empty || mapping.maps.length == 0) return this;
      return this.mapInner(mapping, doc, 0, 0, options || noSpec);
    }
  }, {
    key: "mapInner",
    value: function mapInner(mapping, node, offset, oldOffset, options) {
      var newLocal;

      for (var i = 0; i < this.local.length; i++) {
        var mapped = this.local[i].map(mapping, offset, oldOffset);
        if (mapped && mapped.type.valid(node, mapped)) (newLocal || (newLocal = [])).push(mapped);else if (options.onRemove) options.onRemove(this.local[i].spec);
      }

      if (this.children.length) return mapChildren(this.children, newLocal || [], mapping, node, offset, oldOffset, options);else return newLocal ? new DecorationSet(newLocal.sort(byPos), none) : empty;
    }
  }, {
    key: "add",
    value: function add(doc, decorations) {
      if (!decorations.length) return this;
      if (this == empty) return DecorationSet.create(doc, decorations);
      return this.addInner(doc, decorations, 0);
    }
  }, {
    key: "addInner",
    value: function addInner(doc, decorations, offset) {
      var _this10 = this;

      var children,
          childIndex = 0;
      doc.forEach(function (childNode, childOffset) {
        var baseOffset = childOffset + offset,
            found;
        if (!(found = takeSpansForNode(decorations, childNode, baseOffset))) return;
        if (!children) children = _this10.children.slice();

        while (childIndex < children.length && children[childIndex] < childOffset) {
          childIndex += 3;
        }

        if (children[childIndex] == childOffset) children[childIndex + 2] = children[childIndex + 2].addInner(childNode, found, baseOffset + 1);else children.splice(childIndex, 0, childOffset, childOffset + childNode.nodeSize, buildTree(found, childNode, baseOffset + 1, noSpec));
        childIndex += 3;
      });
      var local = moveSpans(childIndex ? withoutNulls(decorations) : decorations, -offset);

      for (var i = 0; i < local.length; i++) {
        if (!local[i].type.valid(doc, local[i])) local.splice(i--, 1);
      }

      return new DecorationSet(local.length ? this.local.concat(local).sort(byPos) : this.local, children || this.children);
    }
  }, {
    key: "remove",
    value: function remove(decorations) {
      if (decorations.length == 0 || this == empty) return this;
      return this.removeInner(decorations, 0);
    }
  }, {
    key: "removeInner",
    value: function removeInner(decorations, offset) {
      var children = this.children,
          local = this.local;

      for (var i = 0; i < children.length; i += 3) {
        var found = void 0;
        var from = children[i] + offset,
            to = children[i + 1] + offset;

        for (var j = 0, span; j < decorations.length; j++) {
          if (span = decorations[j]) {
            if (span.from > from && span.to < to) {
              decorations[j] = null;
              (found || (found = [])).push(span);
            }
          }
        }

        if (!found) continue;
        if (children == this.children) children = this.children.slice();
        var removed = children[i + 2].removeInner(found, from + 1);

        if (removed != empty) {
          children[i + 2] = removed;
        } else {
          children.splice(i, 3);
          i -= 3;
        }
      }

      if (local.length) for (var _i6 = 0, _span; _i6 < decorations.length; _i6++) {
        if (_span = decorations[_i6]) {
          for (var _j2 = 0; _j2 < local.length; _j2++) {
            if (local[_j2].eq(_span, offset)) {
              if (local == this.local) local = this.local.slice();
              local.splice(_j2--, 1);
            }
          }
        }
      }
      if (children == this.children && local == this.local) return this;
      return local.length || children.length ? new DecorationSet(local, children) : empty;
    }
  }, {
    key: "forChild",
    value: function forChild(offset, node) {
      if (this == empty) return this;
      if (node.isLeaf) return DecorationSet.empty;
      var child, local;

      for (var i = 0; i < this.children.length; i += 3) {
        if (this.children[i] >= offset) {
          if (this.children[i] == offset) child = this.children[i + 2];
          break;
        }
      }

      var start = offset + 1,
          end = start + node.content.size;

      for (var _i7 = 0; _i7 < this.local.length; _i7++) {
        var dec = this.local[_i7];

        if (dec.from < end && dec.to > start && dec.type instanceof InlineType) {
          var from = Math.max(start, dec.from) - start,
              to = Math.min(end, dec.to) - start;
          if (from < to) (local || (local = [])).push(dec.copy(from, to));
        }
      }

      if (local) {
        var localSet = new DecorationSet(local.sort(byPos), none);
        return child ? new DecorationGroup([localSet, child]) : localSet;
      }

      return child || empty;
    }
  }, {
    key: "eq",
    value: function eq(other) {
      if (this == other) return true;
      if (!(other instanceof DecorationSet) || this.local.length != other.local.length || this.children.length != other.children.length) return false;

      for (var i = 0; i < this.local.length; i++) {
        if (!this.local[i].eq(other.local[i])) return false;
      }

      for (var _i8 = 0; _i8 < this.children.length; _i8 += 3) {
        if (this.children[_i8] != other.children[_i8] || this.children[_i8 + 1] != other.children[_i8 + 1] || !this.children[_i8 + 2].eq(other.children[_i8 + 2])) return false;
      }

      return true;
    }
  }, {
    key: "locals",
    value: function locals(node) {
      return removeOverlap(this.localsInner(node));
    }
  }, {
    key: "localsInner",
    value: function localsInner(node) {
      if (this == empty) return none;
      if (node.inlineContent || !this.local.some(InlineType.is)) return this.local;
      var result = [];

      for (var i = 0; i < this.local.length; i++) {
        if (!(this.local[i].type instanceof InlineType)) result.push(this.local[i]);
      }

      return result;
    }
  }], [{
    key: "create",
    value: function create(doc, decorations) {
      return decorations.length ? buildTree(decorations, doc, 0, noSpec) : empty;
    }
  }]);

  return DecorationSet;
}();

DecorationSet.empty = new DecorationSet([], []);
DecorationSet.removeOverlap = removeOverlap;
var empty = DecorationSet.empty;

var DecorationGroup = function () {
  function DecorationGroup(members) {
    _classCallCheck(this, DecorationGroup);

    this.members = members;
  }

  _createClass(DecorationGroup, [{
    key: "map",
    value: function map(mapping, doc) {
      var mappedDecos = this.members.map(function (member) {
        return member.map(mapping, doc, noSpec);
      });
      return DecorationGroup.from(mappedDecos);
    }
  }, {
    key: "forChild",
    value: function forChild(offset, child) {
      if (child.isLeaf) return DecorationSet.empty;
      var found = [];

      for (var i = 0; i < this.members.length; i++) {
        var result = this.members[i].forChild(offset, child);
        if (result == empty) continue;
        if (result instanceof DecorationGroup) found = found.concat(result.members);else found.push(result);
      }

      return DecorationGroup.from(found);
    }
  }, {
    key: "eq",
    value: function eq(other) {
      if (!(other instanceof DecorationGroup) || other.members.length != this.members.length) return false;

      for (var i = 0; i < this.members.length; i++) {
        if (!this.members[i].eq(other.members[i])) return false;
      }

      return true;
    }
  }, {
    key: "locals",
    value: function locals(node) {
      var result,
          sorted = true;

      for (var i = 0; i < this.members.length; i++) {
        var locals = this.members[i].localsInner(node);
        if (!locals.length) continue;

        if (!result) {
          result = locals;
        } else {
          if (sorted) {
            result = result.slice();
            sorted = false;
          }

          for (var j = 0; j < locals.length; j++) {
            result.push(locals[j]);
          }
        }
      }

      return result ? removeOverlap(sorted ? result : result.sort(byPos)) : none;
    }
  }], [{
    key: "from",
    value: function from(members) {
      switch (members.length) {
        case 0:
          return empty;

        case 1:
          return members[0];

        default:
          return new DecorationGroup(members);
      }
    }
  }]);

  return DecorationGroup;
}();

function mapChildren(oldChildren, newLocal, mapping, node, offset, oldOffset, options) {
  var children = oldChildren.slice();

  var shift = function shift(oldStart, oldEnd, newStart, newEnd) {
    for (var i = 0; i < children.length; i += 3) {
      var end = children[i + 1],
          dSize = void 0;
      if (end < 0 || oldStart > end + oldOffset) continue;
      var start = children[i] + oldOffset;

      if (oldEnd >= start) {
        children[i + 1] = oldStart <= start ? -2 : -1;
      } else if (newStart >= offset && (dSize = newEnd - newStart - (oldEnd - oldStart))) {
        children[i] += dSize;
        children[i + 1] += dSize;
      }
    }
  };

  for (var i = 0; i < mapping.maps.length; i++) {
    mapping.maps[i].forEach(shift);
  }

  var mustRebuild = false;

  for (var _i9 = 0; _i9 < children.length; _i9 += 3) {
    if (children[_i9 + 1] < 0) {
      if (children[_i9 + 1] == -2) {
        mustRebuild = true;
        children[_i9 + 1] = -1;
        continue;
      }

      var from = mapping.map(oldChildren[_i9] + oldOffset),
          fromLocal = from - offset;

      if (fromLocal < 0 || fromLocal >= node.content.size) {
        mustRebuild = true;
        continue;
      }

      var to = mapping.map(oldChildren[_i9 + 1] + oldOffset, -1),
          toLocal = to - offset;

      var _node$content$findInd2 = node.content.findIndex(fromLocal),
          index = _node$content$findInd2.index,
          childOffset = _node$content$findInd2.offset;

      var childNode = node.maybeChild(index);

      if (childNode && childOffset == fromLocal && childOffset + childNode.nodeSize == toLocal) {
        var mapped = children[_i9 + 2].mapInner(mapping, childNode, from + 1, oldChildren[_i9] + oldOffset + 1, options);

        if (mapped != empty) {
          children[_i9] = fromLocal;
          children[_i9 + 1] = toLocal;
          children[_i9 + 2] = mapped;
        } else {
          children[_i9 + 1] = -2;
          mustRebuild = true;
        }
      } else {
        mustRebuild = true;
      }
    }
  }

  if (mustRebuild) {
    var decorations = mapAndGatherRemainingDecorations(children, oldChildren, newLocal, mapping, offset, oldOffset, options);
    var built = buildTree(decorations, node, 0, options);
    newLocal = built.local;

    for (var _i10 = 0; _i10 < children.length; _i10 += 3) {
      if (children[_i10 + 1] < 0) {
        children.splice(_i10, 3);
        _i10 -= 3;
      }
    }

    for (var _i11 = 0, j = 0; _i11 < built.children.length; _i11 += 3) {
      var _from2 = built.children[_i11];

      while (j < children.length && children[j] < _from2) {
        j += 3;
      }

      children.splice(j, 0, built.children[_i11], built.children[_i11 + 1], built.children[_i11 + 2]);
    }
  }

  return new DecorationSet(newLocal.sort(byPos), children);
}

function moveSpans(spans, offset) {
  if (!offset || !spans.length) return spans;
  var result = [];

  for (var i = 0; i < spans.length; i++) {
    var span = spans[i];
    result.push(new Decoration(span.from + offset, span.to + offset, span.type));
  }

  return result;
}

function mapAndGatherRemainingDecorations(children, oldChildren, decorations, mapping, offset, oldOffset, options) {
  function gather(set, oldOffset) {
    for (var i = 0; i < set.local.length; i++) {
      var mapped = set.local[i].map(mapping, offset, oldOffset);
      if (mapped) decorations.push(mapped);else if (options.onRemove) options.onRemove(set.local[i].spec);
    }

    for (var _i12 = 0; _i12 < set.children.length; _i12 += 3) {
      gather(set.children[_i12 + 2], set.children[_i12] + oldOffset + 1);
    }
  }

  for (var i = 0; i < children.length; i += 3) {
    if (children[i + 1] == -1) gather(children[i + 2], oldChildren[i] + oldOffset + 1);
  }

  return decorations;
}

function takeSpansForNode(spans, node, offset) {
  if (node.isLeaf) return null;
  var end = offset + node.nodeSize,
      found = null;

  for (var i = 0, span; i < spans.length; i++) {
    if ((span = spans[i]) && span.from > offset && span.to < end) {
      (found || (found = [])).push(span);
      spans[i] = null;
    }
  }

  return found;
}

function withoutNulls(array) {
  var result = [];

  for (var i = 0; i < array.length; i++) {
    if (array[i] != null) result.push(array[i]);
  }

  return result;
}

function buildTree(spans, node, offset, options) {
  var children = [],
      hasNulls = false;
  node.forEach(function (childNode, localStart) {
    var found = takeSpansForNode(spans, childNode, localStart + offset);

    if (found) {
      hasNulls = true;
      var subtree = buildTree(found, childNode, offset + localStart + 1, options);
      if (subtree != empty) children.push(localStart, localStart + childNode.nodeSize, subtree);
    }
  });
  var locals = moveSpans(hasNulls ? withoutNulls(spans) : spans, -offset).sort(byPos);

  for (var i = 0; i < locals.length; i++) {
    if (!locals[i].type.valid(node, locals[i])) {
      if (options.onRemove) options.onRemove(locals[i].spec);
      locals.splice(i--, 1);
    }
  }

  return locals.length || children.length ? new DecorationSet(locals, children) : empty;
}

function byPos(a, b) {
  return a.from - b.from || a.to - b.to;
}

function removeOverlap(spans) {
  var working = spans;

  for (var i = 0; i < working.length - 1; i++) {
    var span = working[i];
    if (span.from != span.to) for (var j = i + 1; j < working.length; j++) {
      var next = working[j];

      if (next.from == span.from) {
        if (next.to != span.to) {
          if (working == spans) working = spans.slice();
          working[j] = next.copy(next.from, span.to);
          insertAhead(working, j + 1, next.copy(span.to, next.to));
        }

        continue;
      } else {
        if (next.from < span.to) {
          if (working == spans) working = spans.slice();
          working[i] = span.copy(span.from, next.from);
          insertAhead(working, j, span.copy(next.from, span.to));
        }

        break;
      }
    }
  }

  return working;
}

function insertAhead(array, i, deco) {
  while (i < array.length && byPos(deco, array[i]) > 0) {
    i++;
  }

  array.splice(i, 0, deco);
}

function viewDecorations(view) {
  var found = [];
  view.someProp("decorations", function (f) {
    var result = f(view.state);
    if (result && result != empty) found.push(result);
  });
  if (view.cursorWrapper) found.push(DecorationSet.create(view.state.doc, [view.cursorWrapper.deco]));
  return DecorationGroup.from(found);
}

var observeOptions = {
  childList: true,
  characterData: true,
  characterDataOldValue: true,
  attributes: true,
  attributeOldValue: true,
  subtree: true
};
var useCharData = ie && ie_version <= 11;

var SelectionState = function () {
  function SelectionState() {
    _classCallCheck(this, SelectionState);

    this.anchorNode = null;
    this.anchorOffset = 0;
    this.focusNode = null;
    this.focusOffset = 0;
  }

  _createClass(SelectionState, [{
    key: "set",
    value: function set(sel) {
      this.anchorNode = sel.anchorNode;
      this.anchorOffset = sel.anchorOffset;
      this.focusNode = sel.focusNode;
      this.focusOffset = sel.focusOffset;
    }
  }, {
    key: "clear",
    value: function clear() {
      this.anchorNode = this.focusNode = null;
    }
  }, {
    key: "eq",
    value: function eq(sel) {
      return sel.anchorNode == this.anchorNode && sel.anchorOffset == this.anchorOffset && sel.focusNode == this.focusNode && sel.focusOffset == this.focusOffset;
    }
  }]);

  return SelectionState;
}();

var DOMObserver = function () {
  function DOMObserver(view, handleDOMChange) {
    var _this11 = this;

    _classCallCheck(this, DOMObserver);

    this.view = view;
    this.handleDOMChange = handleDOMChange;
    this.queue = [];
    this.flushingSoon = -1;
    this.observer = null;
    this.currentSelection = new SelectionState();
    this.onCharData = null;
    this.suppressingSelectionUpdates = false;
    this.observer = window.MutationObserver && new window.MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        _this11.queue.push(mutations[i]);
      }

      if (ie && ie_version <= 11 && mutations.some(function (m) {
        return m.type == "childList" && m.removedNodes.length || m.type == "characterData" && m.oldValue.length > m.target.nodeValue.length;
      })) _this11.flushSoon();else _this11.flush();
    });

    if (useCharData) {
      this.onCharData = function (e) {
        _this11.queue.push({
          target: e.target,
          type: "characterData",
          oldValue: e.prevValue
        });

        _this11.flushSoon();
      };
    }

    this.onSelectionChange = this.onSelectionChange.bind(this);
  }

  _createClass(DOMObserver, [{
    key: "flushSoon",
    value: function flushSoon() {
      var _this12 = this;

      if (this.flushingSoon < 0) this.flushingSoon = window.setTimeout(function () {
        _this12.flushingSoon = -1;

        _this12.flush();
      }, 20);
    }
  }, {
    key: "forceFlush",
    value: function forceFlush() {
      if (this.flushingSoon > -1) {
        window.clearTimeout(this.flushingSoon);
        this.flushingSoon = -1;
        this.flush();
      }
    }
  }, {
    key: "start",
    value: function start() {
      if (this.observer) {
        this.observer.takeRecords();
        this.observer.observe(this.view.dom, observeOptions);
      }

      if (this.onCharData) this.view.dom.addEventListener("DOMCharacterDataModified", this.onCharData);
      this.connectSelection();
    }
  }, {
    key: "stop",
    value: function stop() {
      var _this13 = this;

      if (this.observer) {
        var take = this.observer.takeRecords();

        if (take.length) {
          for (var i = 0; i < take.length; i++) {
            this.queue.push(take[i]);
          }

          window.setTimeout(function () {
            return _this13.flush();
          }, 20);
        }

        this.observer.disconnect();
      }

      if (this.onCharData) this.view.dom.removeEventListener("DOMCharacterDataModified", this.onCharData);
      this.disconnectSelection();
    }
  }, {
    key: "connectSelection",
    value: function connectSelection() {
      this.view.dom.ownerDocument.addEventListener("selectionchange", this.onSelectionChange);
    }
  }, {
    key: "disconnectSelection",
    value: function disconnectSelection() {
      this.view.dom.ownerDocument.removeEventListener("selectionchange", this.onSelectionChange);
    }
  }, {
    key: "suppressSelectionUpdates",
    value: function suppressSelectionUpdates() {
      var _this14 = this;

      this.suppressingSelectionUpdates = true;
      setTimeout(function () {
        return _this14.suppressingSelectionUpdates = false;
      }, 50);
    }
  }, {
    key: "onSelectionChange",
    value: function onSelectionChange() {
      if (!hasFocusAndSelection(this.view)) return;
      if (this.suppressingSelectionUpdates) return selectionToDOM(this.view);

      if (ie && ie_version <= 11 && !this.view.state.selection.empty) {
        var sel = this.view.domSelection();
        if (sel.focusNode && isEquivalentPosition(sel.focusNode, sel.focusOffset, sel.anchorNode, sel.anchorOffset)) return this.flushSoon();
      }

      this.flush();
    }
  }, {
    key: "setCurSelection",
    value: function setCurSelection() {
      this.currentSelection.set(this.view.domSelection());
    }
  }, {
    key: "ignoreSelectionChange",
    value: function ignoreSelectionChange(sel) {
      if (sel.rangeCount == 0) return true;
      var container = sel.getRangeAt(0).commonAncestorContainer;
      var desc = this.view.docView.nearestDesc(container);

      if (desc && desc.ignoreMutation({
        type: "selection",
        target: container.nodeType == 3 ? container.parentNode : container
      })) {
        this.setCurSelection();
        return true;
      }
    }
  }, {
    key: "flush",
    value: function flush() {
      if (!this.view.docView || this.flushingSoon > -1) return;
      var mutations = this.observer ? this.observer.takeRecords() : [];

      if (this.queue.length) {
        mutations = this.queue.concat(mutations);
        this.queue.length = 0;
      }

      var sel = this.view.domSelection();
      var newSel = !this.suppressingSelectionUpdates && !this.currentSelection.eq(sel) && hasFocusAndSelection(this.view) && !this.ignoreSelectionChange(sel);
      var from = -1,
          to = -1,
          typeOver = false,
          added = [];

      if (this.view.editable) {
        for (var i = 0; i < mutations.length; i++) {
          var result = this.registerMutation(mutations[i], added);

          if (result) {
            from = from < 0 ? result.from : Math.min(result.from, from);
            to = to < 0 ? result.to : Math.max(result.to, to);
            if (result.typeOver) typeOver = true;
          }
        }
      }

      if (gecko && added.length > 1) {
        var brs = added.filter(function (n) {
          return n.nodeName == "BR";
        });

        if (brs.length == 2) {
          var a = brs[0],
              b = brs[1];
          if (a.parentNode && a.parentNode.parentNode == b.parentNode) b.remove();else a.remove();
        }
      }

      if (from > -1 || newSel) {
        if (from > -1) {
          this.view.docView.markDirty(from, to);
          checkCSS(this.view);
        }

        this.handleDOMChange(from, to, typeOver, added);
        if (this.view.docView && this.view.docView.dirty) this.view.updateState(this.view.state);else if (!this.currentSelection.eq(sel)) selectionToDOM(this.view);
        this.currentSelection.set(sel);
      }
    }
  }, {
    key: "registerMutation",
    value: function registerMutation(mut, added) {
      if (added.indexOf(mut.target) > -1) return null;
      var desc = this.view.docView.nearestDesc(mut.target);
      if (mut.type == "attributes" && (desc == this.view.docView || mut.attributeName == "contenteditable" || mut.attributeName == "style" && !mut.oldValue && !mut.target.getAttribute("style"))) return null;
      if (!desc || desc.ignoreMutation(mut)) return null;

      if (mut.type == "childList") {
        for (var i = 0; i < mut.addedNodes.length; i++) {
          added.push(mut.addedNodes[i]);
        }

        if (desc.contentDOM && desc.contentDOM != desc.dom && !desc.contentDOM.contains(mut.target)) return {
          from: desc.posBefore,
          to: desc.posAfter
        };
        var prev = mut.previousSibling,
            next = mut.nextSibling;

        if (ie && ie_version <= 11 && mut.addedNodes.length) {
          for (var _i13 = 0; _i13 < mut.addedNodes.length; _i13++) {
            var _mut$addedNodes$_i = mut.addedNodes[_i13],
                previousSibling = _mut$addedNodes$_i.previousSibling,
                nextSibling = _mut$addedNodes$_i.nextSibling;
            if (!previousSibling || Array.prototype.indexOf.call(mut.addedNodes, previousSibling) < 0) prev = previousSibling;
            if (!nextSibling || Array.prototype.indexOf.call(mut.addedNodes, nextSibling) < 0) next = nextSibling;
          }
        }

        var fromOffset = prev && prev.parentNode == mut.target ? domIndex(prev) + 1 : 0;
        var from = desc.localPosFromDOM(mut.target, fromOffset, -1);
        var toOffset = next && next.parentNode == mut.target ? domIndex(next) : mut.target.childNodes.length;
        var to = desc.localPosFromDOM(mut.target, toOffset, 1);
        return {
          from: from,
          to: to
        };
      } else if (mut.type == "attributes") {
        return {
          from: desc.posAtStart - desc.border,
          to: desc.posAtEnd + desc.border
        };
      } else {
        return {
          from: desc.posAtStart,
          to: desc.posAtEnd,
          typeOver: mut.target.nodeValue == mut.oldValue
        };
      }
    }
  }]);

  return DOMObserver;
}();

var cssChecked = false;

function checkCSS(view) {
  if (cssChecked) return;
  cssChecked = true;
  if (getComputedStyle(view.dom).whiteSpace == "normal") console["warn"]("ProseMirror expects the CSS white-space property to be set, preferably to 'pre-wrap'. It is recommended to load style/prosemirror.css from the prosemirror-view package.");
}

function parseBetween(view, from_, to_) {
  var _view$docView$parseRa = view.docView.parseRange(from_, to_),
      parent = _view$docView$parseRa.node,
      fromOffset = _view$docView$parseRa.fromOffset,
      toOffset = _view$docView$parseRa.toOffset,
      from = _view$docView$parseRa.from,
      to = _view$docView$parseRa.to;

  var domSel = view.domSelection();
  var find;
  var anchor = domSel.anchorNode;

  if (anchor && view.dom.contains(anchor.nodeType == 1 ? anchor : anchor.parentNode)) {
    find = [{
      node: anchor,
      offset: domSel.anchorOffset
    }];
    if (!selectionCollapsed(domSel)) find.push({
      node: domSel.focusNode,
      offset: domSel.focusOffset
    });
  }

  if (chrome && view.input.lastKeyCode === 8) {
    for (var off = toOffset; off > fromOffset; off--) {
      var node = parent.childNodes[off - 1],
          desc = node.pmViewDesc;

      if (node.nodeName == "BR" && !desc) {
        toOffset = off;
        break;
      }

      if (!desc || desc.size) break;
    }
  }

  var startDoc = view.state.doc;
  var parser = view.someProp("domParser") || prosemirrorModel.DOMParser.fromSchema(view.state.schema);
  var $from = startDoc.resolve(from);
  var sel = null,
      doc = parser.parse(parent, {
    topNode: $from.parent,
    topMatch: $from.parent.contentMatchAt($from.index()),
    topOpen: true,
    from: fromOffset,
    to: toOffset,
    preserveWhitespace: $from.parent.type.whitespace == "pre" ? "full" : true,
    findPositions: find,
    ruleFromNode: ruleFromNode,
    context: $from
  });

  if (find && find[0].pos != null) {
    var _anchor = find[0].pos,
        head = find[1] && find[1].pos;
    if (head == null) head = _anchor;
    sel = {
      anchor: _anchor + from,
      head: head + from
    };
  }

  return {
    doc: doc,
    sel: sel,
    from: from,
    to: to
  };
}

function ruleFromNode(dom) {
  var desc = dom.pmViewDesc;

  if (desc) {
    return desc.parseRule();
  } else if (dom.nodeName == "BR" && dom.parentNode) {
    if (safari && /^(ul|ol)$/i.test(dom.parentNode.nodeName)) {
      var skip = document.createElement("div");
      skip.appendChild(document.createElement("li"));
      return {
        skip: skip
      };
    } else if (dom.parentNode.lastChild == dom || safari && /^(tr|table)$/i.test(dom.parentNode.nodeName)) {
      return {
        ignore: true
      };
    }
  } else if (dom.nodeName == "IMG" && dom.getAttribute("mark-placeholder")) {
    return {
      ignore: true
    };
  }

  return null;
}

function readDOMChange(view, from, to, typeOver, addedNodes) {
  if (from < 0) {
    var origin = view.input.lastSelectionTime > Date.now() - 50 ? view.input.lastSelectionOrigin : null;
    var newSel = selectionFromDOM(view, origin);

    if (newSel && !view.state.selection.eq(newSel)) {
      var _tr = view.state.tr.setSelection(newSel);

      if (origin == "pointer") _tr.setMeta("pointer", true);else if (origin == "key") _tr.scrollIntoView();
      view.dispatch(_tr);
    }

    return;
  }

  var $before = view.state.doc.resolve(from);
  var shared = $before.sharedDepth(to);
  from = $before.before(shared + 1);
  to = view.state.doc.resolve(to).after(shared + 1);
  var sel = view.state.selection;
  var parse = parseBetween(view, from, to);

  if (chrome && view.cursorWrapper && parse.sel && parse.sel.anchor == view.cursorWrapper.deco.from && parse.sel.head == parse.sel.anchor) {
    var text = view.cursorWrapper.deco.type.toDOM.nextSibling;
    var size = text && text.nodeValue ? text.nodeValue.length : 1;
    parse.sel = {
      anchor: parse.sel.anchor + size,
      head: parse.sel.anchor + size
    };
  }

  var doc = view.state.doc,
      compare = doc.slice(parse.from, parse.to);
  var preferredPos, preferredSide;

  if (view.input.lastKeyCode === 8 && Date.now() - 100 < view.input.lastKeyCodeTime) {
    preferredPos = view.state.selection.to;
    preferredSide = "end";
  } else {
    preferredPos = view.state.selection.from;
    preferredSide = "start";
  }

  view.input.lastKeyCode = null;
  var change = findDiff(compare.content, parse.doc.content, parse.from, preferredPos, preferredSide);

  if ((ios && view.input.lastIOSEnter > Date.now() - 225 || android) && addedNodes.some(function (n) {
    return n.nodeName == "DIV" || n.nodeName == "P";
  }) && (!change || change.endA >= change.endB) && view.someProp("handleKeyDown", function (f) {
    return f(view, keyEvent(13, "Enter"));
  })) {
    view.input.lastIOSEnter = 0;
    return;
  }

  if (!change) {
    if (typeOver && sel instanceof prosemirrorState.TextSelection && !sel.empty && sel.$head.sameParent(sel.$anchor) && !view.composing && !(parse.sel && parse.sel.anchor != parse.sel.head)) {
      change = {
        start: sel.from,
        endA: sel.to,
        endB: sel.to
      };
    } else {
      if (parse.sel) {
        var _sel = resolveSelection(view, view.state.doc, parse.sel);

        if (_sel && !_sel.eq(view.state.selection)) view.dispatch(view.state.tr.setSelection(_sel));
      }

      return;
    }
  }

  view.input.domChangeCount++;

  if (view.state.selection.from < view.state.selection.to && change.start == change.endB && view.state.selection instanceof prosemirrorState.TextSelection) {
    if (change.start > view.state.selection.from && change.start <= view.state.selection.from + 2 && view.state.selection.from >= parse.from) {
      change.start = view.state.selection.from;
    } else if (change.endA < view.state.selection.to && change.endA >= view.state.selection.to - 2 && view.state.selection.to <= parse.to) {
      change.endB += view.state.selection.to - change.endA;
      change.endA = view.state.selection.to;
    }
  }

  if (ie && ie_version <= 11 && change.endB == change.start + 1 && change.endA == change.start && change.start > parse.from && parse.doc.textBetween(change.start - parse.from - 1, change.start - parse.from + 1) == " \xA0") {
    change.start--;
    change.endA--;
    change.endB--;
  }

  var $from = parse.doc.resolveNoCache(change.start - parse.from);
  var $to = parse.doc.resolveNoCache(change.endB - parse.from);
  var $fromA = doc.resolve(change.start);
  var inlineChange = $from.sameParent($to) && $from.parent.inlineContent && $fromA.end() >= change.endA;
  var nextSel;

  if ((ios && view.input.lastIOSEnter > Date.now() - 225 && (!inlineChange || addedNodes.some(function (n) {
    return n.nodeName == "DIV" || n.nodeName == "P";
  })) || !inlineChange && $from.pos < parse.doc.content.size && (nextSel = prosemirrorState.Selection.findFrom(parse.doc.resolve($from.pos + 1), 1, true)) && nextSel.head == $to.pos) && view.someProp("handleKeyDown", function (f) {
    return f(view, keyEvent(13, "Enter"));
  })) {
    view.input.lastIOSEnter = 0;
    return;
  }

  if (view.state.selection.anchor > change.start && looksLikeJoin(doc, change.start, change.endA, $from, $to) && view.someProp("handleKeyDown", function (f) {
    return f(view, keyEvent(8, "Backspace"));
  })) {
    if (android && chrome) view.domObserver.suppressSelectionUpdates();
    return;
  }

  if (chrome && android && change.endB == change.start) view.input.lastAndroidDelete = Date.now();

  if (android && !inlineChange && $from.start() != $to.start() && $to.parentOffset == 0 && $from.depth == $to.depth && parse.sel && parse.sel.anchor == parse.sel.head && parse.sel.head == change.endA) {
    change.endB -= 2;
    $to = parse.doc.resolveNoCache(change.endB - parse.from);
    setTimeout(function () {
      view.someProp("handleKeyDown", function (f) {
        return f(view, keyEvent(13, "Enter"));
      });
    }, 20);
  }

  var chFrom = change.start,
      chTo = change.endA;
  var tr, storedMarks, markChange;

  if (inlineChange) {
    if ($from.pos == $to.pos) {
      if (ie && ie_version <= 11 && $from.parentOffset == 0) {
        view.domObserver.suppressSelectionUpdates();
        setTimeout(function () {
          return selectionToDOM(view);
        }, 20);
      }

      tr = view.state.tr["delete"](chFrom, chTo);
      storedMarks = doc.resolve(change.start).marksAcross(doc.resolve(change.endA));
    } else if (change.endA == change.endB && (markChange = isMarkChange($from.parent.content.cut($from.parentOffset, $to.parentOffset), $fromA.parent.content.cut($fromA.parentOffset, change.endA - $fromA.start())))) {
      tr = view.state.tr;
      if (markChange.type == "add") tr.addMark(chFrom, chTo, markChange.mark);else tr.removeMark(chFrom, chTo, markChange.mark);
    } else if ($from.parent.child($from.index()).isText && $from.index() == $to.index() - ($to.textOffset ? 0 : 1)) {
      var _text = $from.parent.textBetween($from.parentOffset, $to.parentOffset);

      if (view.someProp("handleTextInput", function (f) {
        return f(view, chFrom, chTo, _text);
      })) return;
      tr = view.state.tr.insertText(_text, chFrom, chTo);
    }
  }

  if (!tr) tr = view.state.tr.replace(chFrom, chTo, parse.doc.slice(change.start - parse.from, change.endB - parse.from));

  if (parse.sel) {
    var _sel2 = resolveSelection(view, tr.doc, parse.sel);

    if (_sel2 && !(chrome && android && view.composing && _sel2.empty && (change.start != change.endB || view.input.lastAndroidDelete < Date.now() - 100) && (_sel2.head == chFrom || _sel2.head == tr.mapping.map(chTo) - 1) || ie && _sel2.empty && _sel2.head == chFrom)) tr.setSelection(_sel2);
  }

  if (storedMarks) tr.ensureMarks(storedMarks);
  view.dispatch(tr.scrollIntoView());
}

function resolveSelection(view, doc, parsedSel) {
  if (Math.max(parsedSel.anchor, parsedSel.head) > doc.content.size) return null;
  return selectionBetween(view, doc.resolve(parsedSel.anchor), doc.resolve(parsedSel.head));
}

function isMarkChange(cur, prev) {
  var curMarks = cur.firstChild.marks,
      prevMarks = prev.firstChild.marks;
  var added = curMarks,
      removed = prevMarks,
      type,
      mark,
      update;

  for (var i = 0; i < prevMarks.length; i++) {
    added = prevMarks[i].removeFromSet(added);
  }

  for (var _i14 = 0; _i14 < curMarks.length; _i14++) {
    removed = curMarks[_i14].removeFromSet(removed);
  }

  if (added.length == 1 && removed.length == 0) {
    mark = added[0];
    type = "add";

    update = function update(node) {
      return node.mark(mark.addToSet(node.marks));
    };
  } else if (added.length == 0 && removed.length == 1) {
    mark = removed[0];
    type = "remove";

    update = function update(node) {
      return node.mark(mark.removeFromSet(node.marks));
    };
  } else {
    return null;
  }

  var updated = [];

  for (var _i15 = 0; _i15 < prev.childCount; _i15++) {
    updated.push(update(prev.child(_i15)));
  }

  if (prosemirrorModel.Fragment.from(updated).eq(cur)) return {
    mark: mark,
    type: type
  };
}

function looksLikeJoin(old, start, end, $newStart, $newEnd) {
  if (!$newStart.parent.isTextblock || end - start <= $newEnd.pos - $newStart.pos || skipClosingAndOpening($newStart, true, false) < $newEnd.pos) return false;
  var $start = old.resolve(start);
  if ($start.parentOffset < $start.parent.content.size || !$start.parent.isTextblock) return false;
  var $next = old.resolve(skipClosingAndOpening($start, true, true));
  if (!$next.parent.isTextblock || $next.pos > end || skipClosingAndOpening($next, true, false) < end) return false;
  return $newStart.parent.content.cut($newStart.parentOffset).eq($next.parent.content);
}

function skipClosingAndOpening($pos, fromEnd, mayOpen) {
  var depth = $pos.depth,
      end = fromEnd ? $pos.end() : $pos.pos;

  while (depth > 0 && (fromEnd || $pos.indexAfter(depth) == $pos.node(depth).childCount)) {
    depth--;
    end++;
    fromEnd = false;
  }

  if (mayOpen) {
    var next = $pos.node(depth).maybeChild($pos.indexAfter(depth));

    while (next && !next.isLeaf) {
      next = next.firstChild;
      end++;
    }
  }

  return end;
}

function findDiff(a, b, pos, preferredPos, preferredSide) {
  var start = a.findDiffStart(b, pos);
  if (start == null) return null;

  var _a$findDiffEnd = a.findDiffEnd(b, pos + a.size, pos + b.size),
      endA = _a$findDiffEnd.a,
      endB = _a$findDiffEnd.b;

  if (preferredSide == "end") {
    var adjust = Math.max(0, start - Math.min(endA, endB));
    preferredPos -= endA + adjust - start;
  }

  if (endA < start && a.size < b.size) {
    var move = preferredPos <= start && preferredPos >= endA ? start - preferredPos : 0;
    start -= move;
    endB = start + (endB - endA);
    endA = start;
  } else if (endB < start) {
    var _move = preferredPos <= start && preferredPos >= endB ? start - preferredPos : 0;

    start -= _move;
    endA = start + (endA - endB);
    endB = start;
  }

  return {
    start: start,
    endA: endA,
    endB: endB
  };
}

var __serializeForClipboard = serializeForClipboard;
var __parseFromClipboard = parseFromClipboard;
var __endComposition = endComposition;

var EditorView = function () {
  function EditorView(place, props) {
    var _this15 = this;

    _classCallCheck(this, EditorView);

    this._root = null;
    this.focused = false;
    this.trackWrites = null;
    this.mounted = false;
    this.markCursor = null;
    this.cursorWrapper = null;
    this.lastSelectedViewDesc = undefined;
    this.input = new InputState();
    this.prevDirectPlugins = [];
    this.pluginViews = [];
    this.dragging = null;
    this._props = props;
    this.state = props.state;
    this.directPlugins = props.plugins || [];
    this.directPlugins.forEach(checkStateComponent);
    this.dispatch = this.dispatch.bind(this);
    this.dom = place && place.mount || document.createElement("div");

    if (place) {
      if (place.appendChild) place.appendChild(this.dom);else if (typeof place == "function") place(this.dom);else if (place.mount) this.mounted = true;
    }

    this.editable = getEditable(this);
    updateCursorWrapper(this);
    this.nodeViews = buildNodeViews(this);
    this.docView = docViewDesc(this.state.doc, computeDocDeco(this), viewDecorations(this), this.dom, this);
    this.domObserver = new DOMObserver(this, function (from, to, typeOver, added) {
      return readDOMChange(_this15, from, to, typeOver, added);
    });
    this.domObserver.start();
    initInput(this);
    this.updatePluginViews();
  }

  _createClass(EditorView, [{
    key: "composing",
    get: function get() {
      return this.input.composing;
    }
  }, {
    key: "props",
    get: function get() {
      if (this._props.state != this.state) {
        var prev = this._props;
        this._props = {};

        for (var name in prev) {
          this._props[name] = prev[name];
        }

        this._props.state = this.state;
      }

      return this._props;
    }
  }, {
    key: "update",
    value: function update(props) {
      if (props.handleDOMEvents != this._props.handleDOMEvents) ensureListeners(this);
      this._props = props;

      if (props.plugins) {
        props.plugins.forEach(checkStateComponent);
        this.directPlugins = props.plugins;
      }

      this.updateStateInner(props.state, true);
    }
  }, {
    key: "setProps",
    value: function setProps(props) {
      var updated = {};

      for (var name in this._props) {
        updated[name] = this._props[name];
      }

      updated.state = this.state;

      for (var _name2 in props) {
        updated[_name2] = props[_name2];
      }

      this.update(updated);
    }
  }, {
    key: "updateState",
    value: function updateState(state) {
      this.updateStateInner(state, this.state.plugins != state.plugins);
    }
  }, {
    key: "updateStateInner",
    value: function updateStateInner(state, reconfigured) {
      var _this16 = this;

      var prev = this.state,
          redraw = false,
          updateSel = false;

      if (state.storedMarks && this.composing) {
        clearComposition(this);
        updateSel = true;
      }

      this.state = state;

      if (reconfigured) {
        var nodeViews = buildNodeViews(this);

        if (changedNodeViews(nodeViews, this.nodeViews)) {
          this.nodeViews = nodeViews;
          redraw = true;
        }

        ensureListeners(this);
      }

      this.editable = getEditable(this);
      updateCursorWrapper(this);
      var innerDeco = viewDecorations(this),
          outerDeco = computeDocDeco(this);
      var scroll = reconfigured ? "reset" : state.scrollToSelection > prev.scrollToSelection ? "to selection" : "preserve";
      var updateDoc = redraw || !this.docView.matchesNode(state.doc, outerDeco, innerDeco);
      if (updateDoc || !state.selection.eq(prev.selection)) updateSel = true;
      var oldScrollPos = scroll == "preserve" && updateSel && this.dom.style.overflowAnchor == null && storeScrollPos(this);

      if (updateSel) {
        this.domObserver.stop();
        var forceSelUpdate = updateDoc && (ie || chrome) && !this.composing && !prev.selection.empty && !state.selection.empty && selectionContextChanged(prev.selection, state.selection);

        if (updateDoc) {
          var chromeKludge = chrome ? this.trackWrites = this.domSelection().focusNode : null;

          if (redraw || !this.docView.update(state.doc, outerDeco, innerDeco, this)) {
            this.docView.updateOuterDeco([]);
            this.docView.destroy();
            this.docView = docViewDesc(state.doc, outerDeco, innerDeco, this.dom, this);
          }

          if (chromeKludge && !this.trackWrites) forceSelUpdate = true;
        }

        if (forceSelUpdate || !(this.input.mouseDown && this.domObserver.currentSelection.eq(this.domSelection()) && anchorInRightPlace(this))) {
          selectionToDOM(this, forceSelUpdate);
        } else {
          syncNodeSelection(this, state.selection);
          this.domObserver.setCurSelection();
        }

        this.domObserver.start();
      }

      this.updatePluginViews(prev);

      if (scroll == "reset") {
        this.dom.scrollTop = 0;
      } else if (scroll == "to selection") {
        var startDOM = this.domSelection().focusNode;
        if (this.someProp("handleScrollToSelection", function (f) {
          return f(_this16);
        })) ;else if (state.selection instanceof prosemirrorState.NodeSelection) {
          var target = this.docView.domAfterPos(state.selection.from);
          if (target.nodeType == 1) scrollRectIntoView(this, target.getBoundingClientRect(), startDOM);
        } else {
          scrollRectIntoView(this, this.coordsAtPos(state.selection.head, 1), startDOM);
        }
      } else if (oldScrollPos) {
        resetScrollPos(oldScrollPos);
      }
    }
  }, {
    key: "destroyPluginViews",
    value: function destroyPluginViews() {
      var view;

      while (view = this.pluginViews.pop()) {
        if (view.destroy) view.destroy();
      }
    }
  }, {
    key: "updatePluginViews",
    value: function updatePluginViews(prevState) {
      if (!prevState || prevState.plugins != this.state.plugins || this.directPlugins != this.prevDirectPlugins) {
        this.prevDirectPlugins = this.directPlugins;
        this.destroyPluginViews();

        for (var i = 0; i < this.directPlugins.length; i++) {
          var plugin = this.directPlugins[i];
          if (plugin.spec.view) this.pluginViews.push(plugin.spec.view(this));
        }

        for (var _i16 = 0; _i16 < this.state.plugins.length; _i16++) {
          var _plugin = this.state.plugins[_i16];
          if (_plugin.spec.view) this.pluginViews.push(_plugin.spec.view(this));
        }
      } else {
        for (var _i17 = 0; _i17 < this.pluginViews.length; _i17++) {
          var pluginView = this.pluginViews[_i17];
          if (pluginView.update) pluginView.update(this, prevState);
        }
      }
    }
  }, {
    key: "someProp",
    value: function someProp(propName, f) {
      var prop = this._props && this._props[propName],
          value;
      if (prop != null && (value = f ? f(prop) : prop)) return value;

      for (var i = 0; i < this.directPlugins.length; i++) {
        var _prop = this.directPlugins[i].props[propName];
        if (_prop != null && (value = f ? f(_prop) : _prop)) return value;
      }

      var plugins = this.state.plugins;
      if (plugins) for (var _i18 = 0; _i18 < plugins.length; _i18++) {
        var _prop2 = plugins[_i18].props[propName];
        if (_prop2 != null && (value = f ? f(_prop2) : _prop2)) return value;
      }
    }
  }, {
    key: "hasFocus",
    value: function hasFocus() {
      return this.root.activeElement == this.dom;
    }
  }, {
    key: "focus",
    value: function focus() {
      this.domObserver.stop();
      if (this.editable) focusPreventScroll(this.dom);
      selectionToDOM(this);
      this.domObserver.start();
    }
  }, {
    key: "root",
    get: function get() {
      var _this17 = this;

      var cached = this._root;

      if (cached == null) {
        var _loop4 = function _loop4(search) {
          if (search.nodeType == 9 || search.nodeType == 11 && search.host) {
            if (!search.getSelection) Object.getPrototypeOf(search).getSelection = function () {
              return search.ownerDocument.getSelection();
            };
            return {
              v: _this17._root = search
            };
          }
        };

        for (var search = this.dom.parentNode; search; search = search.parentNode) {
          var _ret3 = _loop4(search);

          if (_typeof(_ret3) === "object") return _ret3.v;
        }
      }

      return cached || document;
    }
  }, {
    key: "posAtCoords",
    value: function posAtCoords(coords) {
      return _posAtCoords(this, coords);
    }
  }, {
    key: "coordsAtPos",
    value: function coordsAtPos(pos) {
      var side = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      return _coordsAtPos(this, pos, side);
    }
  }, {
    key: "domAtPos",
    value: function domAtPos(pos) {
      var side = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      return this.docView.domFromPos(pos, side);
    }
  }, {
    key: "nodeDOM",
    value: function nodeDOM(pos) {
      var desc = this.docView.descAt(pos);
      return desc ? desc.nodeDOM : null;
    }
  }, {
    key: "posAtDOM",
    value: function posAtDOM(node, offset) {
      var bias = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;
      var pos = this.docView.posFromDOM(node, offset, bias);
      if (pos == null) throw new RangeError("DOM position not inside the editor");
      return pos;
    }
  }, {
    key: "endOfTextblock",
    value: function endOfTextblock(dir, state) {
      return _endOfTextblock(this, state || this.state, dir);
    }
  }, {
    key: "destroy",
    value: function destroy() {
      if (!this.docView) return;
      destroyInput(this);
      this.destroyPluginViews();

      if (this.mounted) {
        this.docView.update(this.state.doc, [], viewDecorations(this), this);
        this.dom.textContent = "";
      } else if (this.dom.parentNode) {
        this.dom.parentNode.removeChild(this.dom);
      }

      this.docView.destroy();
      this.docView = null;
    }
  }, {
    key: "isDestroyed",
    get: function get() {
      return this.docView == null;
    }
  }, {
    key: "dispatchEvent",
    value: function dispatchEvent(event) {
      return _dispatchEvent(this, event);
    }
  }, {
    key: "dispatch",
    value: function dispatch(tr) {
      var dispatchTransaction = this._props.dispatchTransaction;
      if (dispatchTransaction) dispatchTransaction.call(this, tr);else this.updateState(this.state.apply(tr));
    }
  }, {
    key: "domSelection",
    value: function domSelection() {
      return this.root.getSelection();
    }
  }]);

  return EditorView;
}();

function computeDocDeco(view) {
  var attrs = Object.create(null);
  attrs["class"] = "ProseMirror";
  attrs.contenteditable = String(view.editable);
  attrs.translate = "no";
  view.someProp("attributes", function (value) {
    if (typeof value == "function") value = value(view.state);
    if (value) for (var attr in value) {
      if (attr == "class") attrs["class"] += " " + value[attr];

      if (attr == "style") {
        attrs.style = (attrs.style ? attrs.style + ";" : "") + value[attr];
      } else if (!attrs[attr] && attr != "contenteditable" && attr != "nodeName") attrs[attr] = String(value[attr]);
    }
  });
  return [Decoration.node(0, view.state.doc.content.size, attrs)];
}

function updateCursorWrapper(view) {
  if (view.markCursor) {
    var dom = document.createElement("img");
    dom.className = "ProseMirror-separator";
    dom.setAttribute("mark-placeholder", "true");
    dom.setAttribute("alt", "");
    view.cursorWrapper = {
      dom: dom,
      deco: Decoration.widget(view.state.selection.head, dom, {
        raw: true,
        marks: view.markCursor
      })
    };
  } else {
    view.cursorWrapper = null;
  }
}

function getEditable(view) {
  return !view.someProp("editable", function (value) {
    return value(view.state) === false;
  });
}

function selectionContextChanged(sel1, sel2) {
  var depth = Math.min(sel1.$anchor.sharedDepth(sel1.head), sel2.$anchor.sharedDepth(sel2.head));
  return sel1.$anchor.start(depth) != sel2.$anchor.start(depth);
}

function buildNodeViews(view) {
  var result = Object.create(null);

  function add(obj) {
    for (var _prop3 in obj) {
      if (!Object.prototype.hasOwnProperty.call(result, _prop3)) result[_prop3] = obj[_prop3];
    }
  }

  view.someProp("nodeViews", add);
  view.someProp("markViews", add);
  return result;
}

function changedNodeViews(a, b) {
  var nA = 0,
      nB = 0;

  for (var _prop4 in a) {
    if (a[_prop4] != b[_prop4]) return true;
    nA++;
  }

  for (var _ in b) {
    nB++;
  }

  return nA != nB;
}

function checkStateComponent(plugin) {
  if (plugin.spec.state || plugin.spec.filterTransaction || plugin.spec.appendTransaction) throw new RangeError("Plugins passed directly to the view must not have a state component");
}

exports.Decoration = Decoration;
exports.DecorationSet = DecorationSet;
exports.EditorView = EditorView;
exports.__endComposition = __endComposition;
exports.__parseFromClipboard = __parseFromClipboard;
exports.__serializeForClipboard = __serializeForClipboard;

},{"prosemirror-model":12,"prosemirror-state":15,"prosemirror-transform":16}],18:[function(require,module,exports){
'use strict';

var GOOD_LEAF_SIZE = 200;

// :: class<T> A rope sequence is a persistent sequence data structure
// that supports appending, prepending, and slicing without doing a
// full copy. It is represented as a mostly-balanced tree.
var RopeSequence = function RopeSequence () {};

RopeSequence.prototype.append = function append (other) {
  if (!other.length) { return this }
  other = RopeSequence.from(other);

  return (!this.length && other) ||
    (other.length < GOOD_LEAF_SIZE && this.leafAppend(other)) ||
    (this.length < GOOD_LEAF_SIZE && other.leafPrepend(this)) ||
    this.appendInner(other)
};

// :: (union<[T], RopeSequence<T>>) → RopeSequence<T>
// Prepend an array or other rope to this one, returning a new rope.
RopeSequence.prototype.prepend = function prepend (other) {
  if (!other.length) { return this }
  return RopeSequence.from(other).append(this)
};

RopeSequence.prototype.appendInner = function appendInner (other) {
  return new Append(this, other)
};

// :: (?number, ?number) → RopeSequence<T>
// Create a rope repesenting a sub-sequence of this rope.
RopeSequence.prototype.slice = function slice (from, to) {
    if ( from === void 0 ) from = 0;
    if ( to === void 0 ) to = this.length;

  if (from >= to) { return RopeSequence.empty }
  return this.sliceInner(Math.max(0, from), Math.min(this.length, to))
};

// :: (number) → T
// Retrieve the element at the given position from this rope.
RopeSequence.prototype.get = function get (i) {
  if (i < 0 || i >= this.length) { return undefined }
  return this.getInner(i)
};

// :: ((element: T, index: number) → ?bool, ?number, ?number)
// Call the given function for each element between the given
// indices. This tends to be more efficient than looping over the
// indices and calling `get`, because it doesn't have to descend the
// tree for every element.
RopeSequence.prototype.forEach = function forEach (f, from, to) {
    if ( from === void 0 ) from = 0;
    if ( to === void 0 ) to = this.length;

  if (from <= to)
    { this.forEachInner(f, from, to, 0); }
  else
    { this.forEachInvertedInner(f, from, to, 0); }
};

// :: ((element: T, index: number) → U, ?number, ?number) → [U]
// Map the given functions over the elements of the rope, producing
// a flat array.
RopeSequence.prototype.map = function map (f, from, to) {
    if ( from === void 0 ) from = 0;
    if ( to === void 0 ) to = this.length;

  var result = [];
  this.forEach(function (elt, i) { return result.push(f(elt, i)); }, from, to);
  return result
};

// :: (?union<[T], RopeSequence<T>>) → RopeSequence<T>
// Create a rope representing the given array, or return the rope
// itself if a rope was given.
RopeSequence.from = function from (values) {
  if (values instanceof RopeSequence) { return values }
  return values && values.length ? new Leaf(values) : RopeSequence.empty
};

var Leaf = /*@__PURE__*/(function (RopeSequence) {
  function Leaf(values) {
    RopeSequence.call(this);
    this.values = values;
  }

  if ( RopeSequence ) Leaf.__proto__ = RopeSequence;
  Leaf.prototype = Object.create( RopeSequence && RopeSequence.prototype );
  Leaf.prototype.constructor = Leaf;

  var prototypeAccessors = { length: { configurable: true },depth: { configurable: true } };

  Leaf.prototype.flatten = function flatten () {
    return this.values
  };

  Leaf.prototype.sliceInner = function sliceInner (from, to) {
    if (from == 0 && to == this.length) { return this }
    return new Leaf(this.values.slice(from, to))
  };

  Leaf.prototype.getInner = function getInner (i) {
    return this.values[i]
  };

  Leaf.prototype.forEachInner = function forEachInner (f, from, to, start) {
    for (var i = from; i < to; i++)
      { if (f(this.values[i], start + i) === false) { return false } }
  };

  Leaf.prototype.forEachInvertedInner = function forEachInvertedInner (f, from, to, start) {
    for (var i = from - 1; i >= to; i--)
      { if (f(this.values[i], start + i) === false) { return false } }
  };

  Leaf.prototype.leafAppend = function leafAppend (other) {
    if (this.length + other.length <= GOOD_LEAF_SIZE)
      { return new Leaf(this.values.concat(other.flatten())) }
  };

  Leaf.prototype.leafPrepend = function leafPrepend (other) {
    if (this.length + other.length <= GOOD_LEAF_SIZE)
      { return new Leaf(other.flatten().concat(this.values)) }
  };

  prototypeAccessors.length.get = function () { return this.values.length };

  prototypeAccessors.depth.get = function () { return 0 };

  Object.defineProperties( Leaf.prototype, prototypeAccessors );

  return Leaf;
}(RopeSequence));

// :: RopeSequence
// The empty rope sequence.
RopeSequence.empty = new Leaf([]);

var Append = /*@__PURE__*/(function (RopeSequence) {
  function Append(left, right) {
    RopeSequence.call(this);
    this.left = left;
    this.right = right;
    this.length = left.length + right.length;
    this.depth = Math.max(left.depth, right.depth) + 1;
  }

  if ( RopeSequence ) Append.__proto__ = RopeSequence;
  Append.prototype = Object.create( RopeSequence && RopeSequence.prototype );
  Append.prototype.constructor = Append;

  Append.prototype.flatten = function flatten () {
    return this.left.flatten().concat(this.right.flatten())
  };

  Append.prototype.getInner = function getInner (i) {
    return i < this.left.length ? this.left.get(i) : this.right.get(i - this.left.length)
  };

  Append.prototype.forEachInner = function forEachInner (f, from, to, start) {
    var leftLen = this.left.length;
    if (from < leftLen &&
        this.left.forEachInner(f, from, Math.min(to, leftLen), start) === false)
      { return false }
    if (to > leftLen &&
        this.right.forEachInner(f, Math.max(from - leftLen, 0), Math.min(this.length, to) - leftLen, start + leftLen) === false)
      { return false }
  };

  Append.prototype.forEachInvertedInner = function forEachInvertedInner (f, from, to, start) {
    var leftLen = this.left.length;
    if (from > leftLen &&
        this.right.forEachInvertedInner(f, from - leftLen, Math.max(to, leftLen) - leftLen, start + leftLen) === false)
      { return false }
    if (to < leftLen &&
        this.left.forEachInvertedInner(f, Math.min(from, leftLen), to, start) === false)
      { return false }
  };

  Append.prototype.sliceInner = function sliceInner (from, to) {
    if (from == 0 && to == this.length) { return this }
    var leftLen = this.left.length;
    if (to <= leftLen) { return this.left.slice(from, to) }
    if (from >= leftLen) { return this.right.slice(from - leftLen, to - leftLen) }
    return this.left.slice(from, leftLen).append(this.right.slice(0, to - leftLen))
  };

  Append.prototype.leafAppend = function leafAppend (other) {
    var inner = this.right.leafAppend(other);
    if (inner) { return new Append(this.left, inner) }
  };

  Append.prototype.leafPrepend = function leafPrepend (other) {
    var inner = this.left.leafPrepend(other);
    if (inner) { return new Append(inner, this.right) }
  };

  Append.prototype.appendInner = function appendInner (other) {
    if (this.left.depth >= Math.max(this.right.depth, other.depth) + 1)
      { return new Append(this.left, new Append(this.right, other)) }
    return new Append(this, other)
  };

  return Append;
}(RopeSequence));

var ropeSequence = RopeSequence;

module.exports = ropeSequence;

},{}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var base = {
  8: "Backspace",
  9: "Tab",
  10: "Enter",
  12: "NumLock",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  44: "PrintScreen",
  45: "Insert",
  46: "Delete",
  59: ";",
  61: "=",
  91: "Meta",
  92: "Meta",
  106: "*",
  107: "+",
  108: ",",
  109: "-",
  110: ".",
  111: "/",
  144: "NumLock",
  145: "ScrollLock",
  160: "Shift",
  161: "Shift",
  162: "Control",
  163: "Control",
  164: "Alt",
  165: "Alt",
  173: "-",
  186: ";",
  187: "=",
  188: ",",
  189: "-",
  190: ".",
  191: "/",
  192: "`",
  219: "[",
  220: "\\",
  221: "]",
  222: "'"
};

var shift = {
  48: ")",
  49: "!",
  50: "@",
  51: "#",
  52: "$",
  53: "%",
  54: "^",
  55: "&",
  56: "*",
  57: "(",
  59: ":",
  61: "+",
  173: "_",
  186: ":",
  187: "+",
  188: "<",
  189: "_",
  190: ">",
  191: "?",
  192: "~",
  219: "{",
  220: "|",
  221: "}",
  222: "\""
};

var chrome = typeof navigator != "undefined" && /Chrome\/(\d+)/.exec(navigator.userAgent);
var gecko = typeof navigator != "undefined" && /Gecko\/\d+/.test(navigator.userAgent);
var mac = typeof navigator != "undefined" && /Mac/.test(navigator.platform);
var ie = typeof navigator != "undefined" && /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);
var brokenModifierNames = mac || chrome && +chrome[1] < 57;

// Fill in the digit keys
for (var i = 0; i < 10; i++) base[48 + i] = base[96 + i] = String(i);

// The function keys
for (var i = 1; i <= 24; i++) base[i + 111] = "F" + i;

// And the alphabetic keys
for (var i = 65; i <= 90; i++) {
  base[i] = String.fromCharCode(i + 32);
  shift[i] = String.fromCharCode(i);
}

// For each code that doesn't have a shift-equivalent, copy the base name
for (var code in base) if (!shift.hasOwnProperty(code)) shift[code] = base[code];

function keyName(event) {
  var ignoreKey = brokenModifierNames && (event.ctrlKey || event.altKey || event.metaKey) ||
    ie && event.shiftKey && event.key && event.key.length == 1 ||
    event.key == "Unidentified";
  var name = (!ignoreKey && event.key) ||
    (event.shiftKey ? shift : base)[event.keyCode] ||
    event.key || "Unidentified";
  // Edge sometimes produces wrong names (Issue #3)
  if (name == "Esc") name = "Escape";
  if (name == "Del") name = "Delete";
  // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8860571/
  if (name == "Left") name = "ArrowLeft";
  if (name == "Up") name = "ArrowUp";
  if (name == "Right") name = "ArrowRight";
  if (name == "Down") name = "ArrowDown";
  return name
}

exports.base = base;
exports.keyName = keyName;
exports.shift = shift;

},{}]},{},[1]);
