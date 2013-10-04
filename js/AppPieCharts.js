function AppPieCharts() {
    var charts = d3.select('#app-pie-charts');
    var m, r;

    var appPies = new Array();

    this.create = function(dataset) {
        var $charts = $('#app-pie-charts');
        m = $charts.innerWidth() / dataset.length / 2 * 0.14;
        r = $charts.innerWidth() / dataset.length / 2 * 0.85;

        for (var i = 0; i < dataset.length; i++) {
            appPies.push(new AppPie(dataset[i], m, r));
        };
        for (var i = 0; i < appPies.length; i++) {
            appPies[i].create();
        };
    }
}

function AppPie(data, m, r) {

    var path;

    var color = d3.scale.ordinal()
        .domain([0, 10])
        .range(colorbrewer.RdBu[9]);//category20b();
    var colorSet = ['YlOrBr', 'PuBu', 'RdPu', 'YlGn'];

    /* Region
     * Code by Mike Bistock https://gist.github.com/mbostock/1306365
     */
    var arc = d3.svg.arc()
        .startAngle(function(d) {
            return d.x;
        })
        .endAngle(function(d) {
            return d.x + d.dx;
        })
        .innerRadius(function(d) {
            return d.y;
        })
        .outerRadius(function(d) {
            return d.y + d.dy;
        });
    var partition = d3.layout.partition()
        .size([2 * Math.PI, r])
        .value(function(d) {
            return d.val;
        });

    // Distort the specified node to 80% of its parent.
    function magnify(node) {
      console.log(node, this);
      if (node.depth === 2) return;
      if (parent = node.parent) {
        var parent,
            x = parent.x,
            k = .7;
        parent.children.forEach(function(sibling) {
          x += reposition(sibling, x, sibling === node
              ? parent.dx * k / node.value
              : parent.dx * (1 - k) / (parent.value - node.value));
        });
      } else {
        reposition(node, 0, node.dx / node.value);
      }

      path.transition()
          .duration(750)
          .attrTween("d", arcTween);
    }

    // Recursively reposition the node at position x with scale k.
    function reposition(node, x, k) {
        node.x = x;
        if (node.children && (n = node.children.length)) {
            var i = -1, n;
            while (++i < n) x += reposition(node.children[i], x, k);
        }
        return node.dx = node.value * k;
    }

    // Stash the old values for transition.
    function stash(d) {
        d.x0 = d.x;
        d.dx0 = d.dx;
    }

    // Interpolate the arcs in data space.
    function arcTween(a) {
        var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
        return function(t) {
            var b = i(t);
            a.x0 = b.x;
            a.dx0 = b.dx;
            return arc(b);
        };
    }
    /* End Region
     * Code by Mike Bistock https://gist.github.com/mbostock/1306365 
     */

    function tuneRad(d) {
        if(d.depth === 0) {
            d.dy += r * 0.15;
        } else if (d.depth === 1) {
            d.y += r * 0.2;
            d.dy -= r * 0.2;
        }
     }

    this.dataset = data;
    this.m = m;
    this.r = r;

    this.create = function() {

        var appPie = d3.select('#app-pie-charts').append("svg:svg")
                        .attr('class', 'app-pie')
                        .attr("width", (this.r + this.m) * 2)
                        .attr("height", (this.r + this.m) * 2)
                    .append("svg:g")
                        .attr("transform", "translate(" + (this.r + this.m) + "," + (this.r + this.m) + ")");

        var groupCount = 0;//colorSet.length;
        var itemCount = 0;
        var groupCol;
        path = appPie.data([this.dataset]).selectAll('path')
                .data(partition.nodes)
                .enter().append('svg:path')
                .each(tuneRad)
                .attr('d', arc)
                .style('fill', function(d, i) {
                    if (0 === d.depth) {
                        return '#E7E7E7';
                    }
                    if (1 === d.depth) {
                        var childLen = d.children.length;
                        itemCount = childLen;
                        groupCol = d3.scale.ordinal()
                            .domain([0, childLen+2])
                            .range(colorbrewer[colorSet[groupCount++]][childLen+2]);
                        return groupCol(childLen+2);
                    }
                    console.log(itemCount);
                    itemCount--;
                    return groupCol(itemCount+2);
                })
                .style('stroke', '#ffffff')
                .on('click', magnify)
                .each(stash);
    };
<<<<<<< HEAD
}
=======
}
>>>>>>> proto_v1
