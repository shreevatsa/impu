const {Schema} = require("prosemirror-model")
const {EditorView} = require("prosemirror-view")
const {EditorState} = require("prosemirror-state")
const history = require("prosemirror-history")
const {keymap} = require("prosemirror-keymap")
// const {inputRules, allInputRules} = require("prosemirror-inputrules")
const {baseKeymap, toggleMark} = require("prosemirror-commands")
const {menuBar, blockTypeItem, Dropdown, DropdownSubmenu, joinUpItem, liftItem, selectParentNodeItem, undoItem, redoItem, icons, MenuItem} = require("prosemirror-menu")
const {exampleSetup} = require("prosemirror-example-setup")

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

const trivialSchema = new Schema({
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
        text: {group: "inline"},
    },
    marks: {
        strong: {
            toDOM() { return ["strong"] },
        },
    },
})

window.view = new EditorView(document.body, {
    state: EditorState.create({
        schema: trivialSchema,
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
                     content: buildMenuItems(trivialSchema).fullMenu}),
        ],
    }),
})
