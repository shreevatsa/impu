const {Schema, Node} = require("prosemirror-model")
const {EditorView} = require("prosemirror-view")
const {EditorState} = require("prosemirror-state")
const history = require("prosemirror-history")
const {keymap} = require("prosemirror-keymap")
// const {inputRules, allInputRules} = require("prosemirror-inputrules")
const {baseKeymap, toggleMark} = require("prosemirror-commands")
const {menuBar, blockTypeItem, Dropdown, DropdownSubmenu, joinUpItem, liftItem, selectParentNodeItem, undoItem, redoItem, icons, MenuItem} = require("prosemirror-menu")
const {exampleSetup} = require("prosemirror-example-setup")
const {insertPoint} = require("prosemirror-transform")

window.EditorState = EditorState;

// Copied(!) from https://github.com/ProseMirror/prosemirror-example-setup/blob/44a2fd4/src/menu.js
function markActive(state, type) {
  let {from, $from, to, empty} = state.selection
  if (empty) return type.isInSet(state.storedMarks || $from.marks())
  else return state.doc.rangeHasMark(from, to, type)
}

function markItem(markType, options) {
  let passedOptions = {
    active(state) { return markActive(state, markType) }
  }
  for (let prop in options) passedOptions[prop] = options[prop]
  return cmdItem(toggleMark(markType), passedOptions)
}

function cmdItem(cmd, options) {
  let passedOptions = {
    label: options.title,
    run: cmd,
    select(state) { return cmd(state) }
  }
  for (let prop in options) passedOptions[prop] = options[prop]
  return new MenuItem(passedOptions)
}

// Copied(!) from https://github.com/ProseMirror/prosemirror-example-setup/blob/44a2fd4/src/menu.js with some clearly irrelevant bits removed
function buildMenuItems(schema) {
  let r = {}, type
  if (type = schema.marks.strong)
    r.toggleStrong = markItem(type, {title: "Toggle strong style", icon: icons.strong})
  if (type = schema.marks.em)
    r.toggleEm = markItem(type, {title: "Toggle emphasis", icon: icons.em})

  if (type = schema.nodes.bullet_list)
    r.wrapBulletList = wrapListItem(type, {
      title: "Wrap in bullet list",
      icon: icons.bulletList
    })
  if (type = schema.nodes.ordered_list)
    r.wrapOrderedList = wrapListItem(type, {
      title: "Wrap in ordered list",
      icon: icons.orderedList
    })
  if (type = schema.nodes.blockquote)
    r.wrapBlockQuote = wrapItem(type, {
      title: "Wrap in block quote",
      icon: icons.blockquote
    })
  if (type = schema.nodes.paragraph)
    r.makeParagraph = blockTypeItem(type, {
      title: "Change to paragraph",
      label: "Plain"
    })
  if (type = schema.nodes.horizontal_rule) {
    let hr = type
    r.insertHorizontalRule = new MenuItem({
      title: "Insert horizontal rule",
      label: "Horizontal rule",
      select(state) { return canInsert(state, hr) },
      run(state, dispatch) { dispatch(state.tr.replaceSelectionWith(hr.create())) }
    })
  }

  r.makeHeadChapter = blockTypeItem(schema.nodes.heading, {
      title: "Make this a chapter title",
      label: "Chapter",
      attrs: {level: 1},
  })

  r.makeHeadSection = blockTypeItem(schema.nodes.heading, {
      title: "Make this a section heading",
      label: "Section",
      attrs: {level: 2},
  })

  r.makeHeadSubsection = blockTypeItem(schema.nodes.heading, {
      title: "Make this a subsection heading",
      label: "Subsection",
      attrs: {level: 3},
  })

  r.makeHeadSubsubsection = blockTypeItem(schema.nodes.heading, {
      title: "Make this a subsubsection heading",
      label: "Subsubsection",
      attrs: {level: 4},
  })

  let cut = arr => arr.filter(x => x)
  r.insertMenu = new Dropdown(cut([r.insertImage, r.insertHorizontalRule, r.insertTable]), {label: "Insert"})

  r.typeMenu = new Dropdown(cut([r.makeParagraph, r.makeCodeBlock, r.makeHeadChapter, r.makeHeadSection, r.makeHeadSubsection, r.makeHeadSubsubsection]), {label: "Heading level..."})

  let tableItems = cut([r.addRowBefore, r.addRowAfter, r.removeRow, r.addColumnBefore, r.addColumnAfter, r.removeColumn])
  if (tableItems.length)
    r.tableMenu = new Dropdown(tableItems, {label: "Table"})

  r.inlineMenu = [cut([r.toggleStrong, r.toggleEm, r.toggleCode, r.toggleLink]), [r.insertMenu]]
  r.blockMenu = [cut([r.typeMenu, r.tableMenu, r.wrapBulletList, r.wrapOrderedList, r.wrapBlockQuote, joinUpItem,
                      liftItem, selectParentNodeItem])]
  r.fullMenu = r.inlineMenu.concat(r.blockMenu).concat([[undoItem, redoItem]])
  return r
}

// Copied(!) from https://github.com/ProseMirror/website/blob/0522f8a/pages/examples/footnote/example.js
class FootnoteView {
  constructor(node, view, getPos) {
    this.node = node
    this.outerView = view
    this.getPos = getPos

    this.dom = document.createElement("footnote")
    this.open = false
    this.innerView = null
    this.tooltip = null
  }

  selectNode() {
    if (!this.open) {
      this.open = true
      this.dom.classList.add("ProseMirror-selectednode")
      this.tooltip = this.dom.appendChild(document.createElement("div"))
      this.tooltip.className = "footnote-tooltip"
      this.innerView = new EditorView(this.tooltip, {
        state: EditorState.create({doc: this.node}),
        dispatchTransaction: this.dispatchInner.bind(this),
        handleDOMEvents: {
          mousedown: () => {
            // Necessary to prevent strangeness due to the fact that
            // the whole footnote is node-selected (and thus
            // DOM-selected) when the parent editor is focused.
            if (this.outerView.hasFocus()) this.innerView.focus()
          }
        }
      })
    }
  }

  dispatchInner(tr) {
    let {state, transactions} = this.innerView.state.applyTransaction(tr)
    this.innerView.updateState(state)

    if (!tr.getMeta("fromOutside")) {
      let outerTr = this.outerView.state.tr, offset = this.getPos() + 1
      for (let i = 0; i < transactions.length; i++) {
        let steps = transactions[i].steps
        for (let j = 0; j < steps.length; j++)
          outerTr.step(steps[j].offset(offset))
      }
      if (outerTr.docChanged) this.outerView.dispatch(outerTr)
    }
  }

  update(node) {
    if (!node.sameMarkup(this.node)) return false
    this.node = node
    if (this.innerView) {
      let state = this.innerView.state
      let start = node.content.findDiffStart(state.doc.content)
      if (start != null) {
        let {a: endA, b: endB} = node.content.findDiffEnd(state.doc.content)
        let overlap = start - Math.min(endA, endB)
        if (overlap > 0) { endA += overlap; endB += overlap }
        this.innerView.dispatch(
          state.tr.replace(start, endB, node.slice(start, endA)).setMeta("fromOutside", true))
      }
    }
    return true
  }

  deselectNode() {
    if (this.open) {
      this.open = false
      this.dom.classList.remove("ProseMirror-selectednode")
      this.innerView.destroy()
      this.dom.removeChild(this.tooltip)
      this.tooltip = this.innerView = null
    }
  }

  destroy() {
    this.deselectNode()
  }

  stopEvent(event) {
    return this.innerView && this.innerView.dom.contains(event.target)
  }

  ignoreMutation() { return true }
}


window.trivialSchema = new Schema({
    nodes: {
        doc: {content: "block+"},
        paragraph: {
            group: "block",
            content: "text<strong>*",
            toDOM: () => ["p", 0],
        },
        heading: {
            attrs: {level: {default: 100}},
            content: "inline<_>*",
            group: "block",
            defining: true,
            toDOM(node) { return ["h" + node.attrs.level, 0] }
        },

        footnote: {
            group: "inline",
            content: "inline*",
            inline: true,
            draggable: true,
            atom: true,
            toDOM: () => ["footnote", 0],
            parseDOM: [{tag: "footnote"}]
        },

        text: {group: "inline"},
    },
    marks: {
        strong: {
            toDOM() { return ["strong"] },
        },
    },
})

let menu = buildMenuItems(trivialSchema);
menu.insertMenu.content.push(new MenuItem({
  title: "Insert footnote",
  label: "Footnote",
  select(state) {
    return insertPoint(state.doc, state.selection.from, trivialSchema.nodes.footnote) != null
  },
  run(state, dispatch) {
    let {empty, $from, $to} = state.selection, content = Fragment.empty
    if (!empty && $from.sameParent($to) && $from.parent.inlineContent)
      content = $from.parent.content.cut($from.parentOffset, $to.parentOffset)
    dispatch(state.tr.replaceSelectionWith(trivialSchema.nodes.footnote.create(null, content)))
  }
}))

// defaultDoc = window.exportedJSON || {};
// console.log('Default doc is', defaultDoc);

window.view = new EditorView(document.body, {
    state: EditorState.create({
        schema: trivialSchema,
        doc: Node.fromJSON(trivialSchema, window.exportedSaadhane),

        // plugins: exampleSetup({schema: trivialSchema}),
        plugins: [
            // Undo
            history.history(),
            keymap({
            "Mod-z": history.undo,
            "Mod-Shift-z": history.redo
            }),
            // Some common things like Enter to create a new paragraph
            // inputRules({rules: allInputRules}), // emDash, ellipsis, smartQuotes -- not worth it?
            keymap(baseKeymap),
            // A menu bar at the top, with some obvious things populated if present in the schema
            menuBar({floating: true,
                     content: menu.fullMenu}),
        ],
    }),
    nodeViews: {
        footnote(node, view, getPos) { return new FootnoteView(node, view, getPos) }
    },
})
