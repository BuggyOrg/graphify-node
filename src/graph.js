
function getDeep (graph, property, fn) {
  return (graph[property] || []).concat(flatten((graph.children || []).map((c) => getDeep(c, property))))
}

function flatten (a) {
  return [].concat.apply([], a)
}

function getPorts (graph) {
  return getDeep(graph, 'ports')
}

function getNodes (graph) {
  return getDeep(graph, 'children').concat([graph])
}

function getEdges (graph) {
  return getDeep(graph, 'edges')
}

function getNode (id, graph) {
  if (graph.id === id) {
    return graph
  }

  const node = (graph.children || []).find((n) => n.id === id)
  if (node) {
    return node
  } else {
    for (let i = 0; i < (graph.children || []).length; i++) {
      const result = getNode(id, graph.children[i])
      if (result) {
        return result
      }
    }
  }
}

function hasChildren (node, graph) {
  node = getNode(node.id, graph)
  return node.children && node.children.length > 0
}

function hasEdges (node, graph) {
  node = getNode(node.id, graph)
  return node.edges && node.edges.length > 0
}

function isCompound (node, graph) {
  return hasChildren(node, graph) || hasEdges(node, graph)
}

module.exports = {
  getDeep,
  getPorts,
  getNodes,
  getEdges,
  getNode,
  hasChildren,
  hasEdges,
  isCompound
}
