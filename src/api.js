const defaults = require('lodash/defaults')
const zip = require('lodash/zip')
const klayjs = require('klayjs')
const Graph = require('./graph')

const defaultOptions = {
  measure: {
    marginX: 10,
    marginY: 8,
    portSize: 5.0,
    fontSize: 14,
    font: 'sans-serif',
    padding: {
      left: 10,
      top: 20,
      right: 10,
      bottom: 10
    }
  },
  klay: {
    spacing: 50,
    layoutHierarchy: true,
    direction: 'DOWN',
    edgeRouting: 'ORTHOGONAL',
    nodeLayering: 'NETWORK_SIMPLEX',
    nodePlace: 'BRANDES_KOEPF',
    fixedAlignment: 'NONE',
    crossMin: 'LAYER_SWEEP',
    algorithm: 'de.cau.cs.kieler.klay.layered'
  }
}

function monospace (str, style) {
  return {width: str.length, height: str.split('\n').length}
}

function measureTexts (node, style, measureText) {
  if (Array.isArray(node)) return Promise.all(node.map((n) => measureTexts(n, style, measureText)))
  return Promise.resolve(measureText(node.text, style))
}

function layoutNodes (nodes, options, measureText) {
  return measureTexts(nodes, options, measureText)
  .then((measures) =>
    zip(measures, nodes).forEach((m) => {
      m[1].width = m[0].width + 2 * options.marginX
      m[1].height = m[0].height + 2 * options.marginY
      m[1].textWidth = m[0].width
      m[1].textHeight = m[0].height
      m[1].padding = options.padding
    }))
}

function measureGraph (graph, options, measureText) {
  Graph.getPorts(graph).forEach((p) => {
    p.width = options.portSize
    p.height = options.portSize
  })
  // set text of nodes
  Graph.getNodes(graph).forEach((n) => n.text = (n.labels || [{}])[0].text || '')

  return layoutNodes(Graph.getNodes(graph), options, measureText)
  .then(() => graph)
}

module.exports = {
  layout: function (input, textMeasure, options) {
    if (!textMeasure) throw new Error('[Graphify] The layout method needs a text measure function to calculate text sizes.')
    options = defaults(options, defaultOptions)
    var graph = (typeof (input) === 'string') ? JSON.parse(input) : JSON.parse(JSON.stringify(input))

    return measureGraph(graph, options.measure, textMeasure)
    .then((graph) => new Promise((resolve, reject) => {
      klayjs.layout({
        graph: graph,
        options: options.klay,
        success: resolve,
        error: reject
      })
    }))
  },

  defaults: defaultOptions,
  terminalDefaults: {
    measure: {
      marginX: 2,
      marginY: 1,
      fontSize: 14,
      font: 'sans-serif',
      padding: {}
    },
    klay: {
      spacing: 3,
      layoutHierarchy: true,
      direction: 'DOWN',
      borderSpacing: 2,
      edgeRouting: 'ORTHOGONAL',
      nodeLayering: 'NETWORK_SIMPLEX',
      nodePlace: 'BRANDES_KOEPF',
      fixedAlignment: 'NONE',
      crossMin: 'LAYER_SWEEP',
      algorithm: 'de.cau.cs.kieler.klay.layered'
    }
  }
}