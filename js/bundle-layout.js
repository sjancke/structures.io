
var diameter = 900,
    radius = diameter / 2,
    innerRadius = radius - 200;

var cluster = d3.layout.cluster()
    .size([360, innerRadius])
    .sort(null)
    .value(function(d) { return d.size; });

var bundle = d3.layout.bundle();

var line = d3.svg.line.radial()
    .interpolate("bundle")
    .tension(.85)
    .radius(function(d) { return d.y; })
    .angle(function(d) { return d.x / 180 * Math.PI; });

var svg = d3.select("#graph").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
    .append("g")
    .attr("transform", "translate(" + radius + "," + radius + ")");

var link = svg.append("g").selectAll(".link"),
    node = svg.append("g").selectAll(".node");

var nodes;

d3.json("sampledata/dependencies.json", function(error, classes) {
  if (error) throw error;

  var hash = window.document.location.search;
  var filterNodeName = hash.replace('?', '');
  var filterForNode = find(classes, function(n) { return n.name === filterNodeName; });
  var filtered = [];
  filtered.push(filterForNode);
  //transitive outgoing dependencies
  filterForNode.imports.forEach(function(name) {
    filtered.push({
      name: name,
      imports: []
    });
  });
  //direct incoming dependencies
  classes.forEach(function(node) {
    var incomingDependency = find(node.imports, function(name) {
      return name === filterNodeName;
    });
    if(incomingDependency !== undefined) {
      filtered.push({
        name: node.name,
        //does not contain deps between incoming nodes
        imports: [filterNodeName]//node.imports.filter(function(name) { return filtered })
      });
    }
  });
  //add dependencies between nodes - currently O(n^2)...
  filtered.forEach(function(node) {
    var originalNode = find(classes, function(n) { return n.name === node.name; });
    var imports = originalNode.imports.filter(function(name) { return filtered.some(function(n) { return n.name === name}); })
    node.imports = imports;
  });
  console.log(filtered);

  var classMap = packageHierarchy(filtered);
  nodes = cluster.nodes(classMap);
  var links = packageImports(nodes);


  link = link
      .data(bundle(links))
    .enter().append("path")
      .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
      .attr("class", "link")
      .attr("d", line);

  node = node
      .data(nodes.filter(function(n) { return !n.children; }))
    .enter().append("text")
      .attr("class", "node")
      .attr("dy", ".31em")
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
      .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .style("font-weight", function(d) { return d.text === filterNodeName ? "bold" : "normal"; })
      .text(function(d) { return d.key; })
      .on("mouseover", mouseovered)
      .on("mouseout", mouseouted);

  var highlightNode = find(nodes, function(node) {
    return node.name === filterNodeName;
  })
  if(highlightNode !== undefined) {
    mouseovered(highlightNode);
  }
});

function mouseovered(d) {
  node
      .each(function(n) { n.target = n.source = false; });

  link
      .classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
      .classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
    .filter(function(l) { return l.target === d || l.source === d; })
      .each(function() { this.parentNode.appendChild(this); });

  node
      .classed("node--target", function(n) { return n.target; })
      .classed("node--source", function(n) { return n.source; });
}

function mouseouted(d) {
  link
      .classed("link--target", false)
      .classed("link--source", false);

  node
      .classed("node--target", false)
      .classed("node--source", false);
}

d3.select(self.frameElement).style("height", diameter + "px");

$('#filter').keypress(function (e) {
  var value = $('#filter').val();

  if (e.which == 13) {
    mouseouted(undefined);
    var n = find(nodes, function(n) {
      return n.name.indexOf(value) === 0;
    });
    mouseovered(n);
  }
  else if (e.which == 27) {
    $('#filter').val('');
    mouseouted(undefined);
  }
});

$('#filter_button').click(function (e) {
  var value = $('#filter').val();

  mouseouted(undefined);
  var n = find(nodes, function(n) {
    return n.name.indexOf(value) === 0;
  });
  mouseovered(n);
});


function find(list, predicate) {
    for (var i = 0; i < list.length; i++) {
      value = list[i];
      if (predicate(value)) {
        return value;
      }
    }
    return undefined;
}

// Lazily construct the package hierarchy from class names.
function packageHierarchy(classes) {
  var map = {};

  function find(name, data) {
    var node = map[name], i;
    if (!node) {
      node = map[name] = data || {name: name, children: []};
      if (name.length) {
        node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
        node.parent.children.push(node);
        node.key = name;
      }
    }
    return node;
  }

  classes.forEach(function(d) {
    find(d.name, d);
  });

  return map[""];
}

// Return a list of imports for the given array of nodes.
function packageImports(nodes) {
  var map = {},
      imports = [];

  // Compute a map from name to node.
  nodes.forEach(function(d) {
    map[d.name] = d;
  });

  // For each import, construct a link from the source to target node.
  nodes.forEach(function(d) {
    if (d.imports) d.imports.forEach(function(i) {
      imports.push({source: map[d.name], target: map[i]});
    });
  });

  return imports;
}
