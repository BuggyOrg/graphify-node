const defaults = require('lodash/defaults')
const zip = require('lodash/zip')
const elkjs = require('elkjs/lib/elk.bundled')
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
    .then((graph) => {
      const elk = new elkjs(options.elk)
      return elk.layout(graph)
    })
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
    elk: {
      'elk.spacing.nodeNode': 3,
      'elk.layoutHierarchy': true,
      'elk.direction': 'DOWN',
      'elk.spacing.componentComponent': 2,
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.layered.nodePlacement.bk.fixedAlignment': 'NONE',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.algorithm': 'layered'
    }
  }
}