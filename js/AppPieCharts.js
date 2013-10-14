function AppPieCharts() {
    var charts = d3.select('#app-pie-charts');
    var base = 2;
    var m, r;

    var appPies = new Array();

    this.create = function(dataset) {
        var $charts = $('#app-pie-charts');
        m = $charts.innerWidth() / dataset.length / 2 * 0.14;
        r = $charts.innerWidth() / dataset.length / 2 * 0.85;

        charts.append('svg')
            .attr('class', 'legend')
            .attr('width', '100%')
            .attr('height', 60)
            .attr('transform', 'translate(0, -100)');

        for (var i = 0; i < dataset.length; i++) {
            appPies.push(new AppPie(dataset[i], m, r));
        };
        for (var i = 0; i < appPies.length; i++) {
            appPies[i].create();
        };

        createLegend(charts, base);
    }

    this.update = function(dataset) {
        if (dataset.length !== appPies.length) {
            alert('Error: Data type unmatched');
        }
        for (var i = 0; i < dataset.length; i++) {
            appPies[i].dataset = dataset[i];
            appPies[i].update();
        };
    }

    this.changeType = function(type) {
        var appPie = appPies[type].getThisPie();
        var path = appPie.selectAll('path');

        var invokeClick = function(d_clicked, i_clicked, j_clidk) {
            var pathToClick = path.filter(function(d, i) {
                return d.name === d_clicked.name && 
                       d.depth === d_clicked.depth &&
                      !d3.select(this).classed('clicked');
            });
            $(pathToClick[0]).d3Click();
        }

        var clickedPath = charts.selectAll('.clicked');
        if (0 !== clickedPath[0].length) {
            clickedPath.each(invokeClick);
        } else {
            $(path.filter(function(d, i) {
                return i === 0;
            })[0]).d3Click();
        }
    }

    this.resetCharts = function(type) {
        var appPie = appPies[type].getThisPie();
        $(appPie.selectAll('path').filter(function(d) {
            return 0 === d.depth;
        })[0]).d3Click();
    }
}

function AppPie(data, m, r) {
    /*******************
     * private members *
     *******************/
    var charts = d3.select('#app-pie-charts');
    var appPie;

    var base = 2;

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
        .sort(null)
        .size([2 * Math.PI, r])
        .value(function(d) {
            return d.val;
        });

    // Distort the specified node to 80% of its parent.
    function magnify(node) {
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
        appPie.selectAll('path').transition()
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

    /* Reassign radius (y-coord) of the paths (Fixes default y, dy by the partition layout) */
    var tuneRad = function(d) {
        if(d.depth === 0) {
            d.dy += r * 0.15;
        } else if (d.depth === 1) {
            d.y += r * 0.2;
            d.dy -= r * 0.2;
        }
        d.dy0 = d.dy;
    }

    var initCenterText = function(thisObj) {
        appPie.append('text')
                .attr('class', 'center-txt type')
                .attr('y', thisObj.r * -0.16)
                .text(function(d, i) {
                    return TYPE[d.name];
                });
        appPie.append('text')
                .attr('class', 'center-txt value')
        appPie.append('text')
                .attr('class', 'center-txt percentage')
                .attr('y', thisObj.r * 0.16)
        resetAllCenterText();
    }

    var setCenterText = function() {
        var pieData = appPie.data()[0];
        var clickedData = appPie.selectAll('.clicked').data();
        var returnVal = function(d) {
                            return d.val;
                        };

        var val, per;
        if (2 !== pieData.name) {
            val = d3.sum(clickedData, returnVal);
            per = (val)? val/pieData.total*100 : null;
        } else {
            val = d3.mean(clickedData, returnVal);
            per = null;
        }

        appPie.select('.value')
            .text(function(d) {
                return (val)? valToText(val) + TYPE_UNIT[d.name]
                            : valToText(d.total) + TYPE_UNIT[d.name];
            });
        appPie.select('.percentage').text(function() {
            return (per)? valToText(per) + '%' : '';
        });
    }

    var resetAllCenterText = function() {
        appPie.select('.value')
            .text(function(d) {
                return valToText(d.total) + TYPE_UNIT[d.name];
            });
        appPie.select('.percentage')
            .text('');
    }

     var pathAnim = function(path, dir) {
        var ease, duration, scale;
        switch(dir) {
            case 0:
                ease = 'bounce';
                duration = 500;
                scale = 1;
                break;

            case 1:
                ease = 'cubic-in-out';
                duration = 250;
                scale = 1.2;
                break;
        }
        path.transition()
            .duration(duration)
            .ease(ease)
            .attr('d', d3.svg.arc()
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
                    if (d.dy0 * scale != d.dy) {
                        d.dy = d.dy0 * scale;
                    }
                    return d.y + d.dy;
                })
            );
    }

    var legendAnim = function(pathD, dir) {
        var appCharts = d3.select(appPie.node().parentNode.parentNode);
        var thisLegend = appCharts.selectAll('.legend .legend-icon')
                .filter(function(d, i) {
                    return i === pathD.name - 1;
                });
        thisLegend.transition()
                .duration(300)
                .attr('r', (dir)? 10:6);
    }

    var unclickAllPath = function() {
        var paths = charts.selectAll('.clicked');
        if (0 === paths[0].length) {
            return;
        }
        pathAnim(paths, 0);
        paths.classed('clicked', false);
        resetAllCenterText();
    }

    var eventObj = {
        'mouseover': function(d) {
            if (2 === d.depth) {
                pathAnim(d3.select(this), 1);
                legendAnim(d, 1);
                appPie.select('.value').text(function(app_d) {
                    return valToText(d.val) + TYPE_UNIT[app_d.name];
                });
                appPie.select('.percentage').text(function(app_d) {
                    return (2 === app_d.name)? ''
                                : (d.val/app_d.total*100).toFixed(2) + '%';
                });
            }
        },
        'mouseout': function(d) {
            if (2 === d.depth) {
                var thisPath = d3.select(this);
                if (!thisPath.classed('clicked')) {
                    pathAnim(thisPath, 0);
                }
                legendAnim(d, 0);
            }
            setCenterText();
        },
        'click': function(d) {
            var thisPieClean = (0 === appPie.selectAll('.clicked')[0].length)
            if (0 === d.depth) {
                if (thisPieClean) {
                    magnify(d);
                }
                unclickAllPath();
                updateLineContext(appPie.data()[0].name, 0);
            } else if (1 === d.depth) {
                if (thisPieClean) {
                    unclickAllPath();
                }
                magnify(d);
            } else if (2 === d.depth) {
                if (thisPieClean) {
                    unclickAllPath();
                }
                var thisPath = d3.select(this);
                var clicked = thisPath.classed('clicked');
                pathAnim(thisPath, ~~(!clicked));
                thisPath.classed('clicked', !clicked);
                updateLineContext(appPie.data()[0].name, d.name);
                setCenterText();
            }
        }
    }



    /******************
     * public members *
     ******************/
    this.dataset = data;
    this.m = m;
    this.r = r;

    this.create = function() {

        appPie = d3.select('#app-pie-charts').append("svg:svg")
                        .attr('class', 'app-pie')
                        .attr("width", (this.r + this.m) * 2)
                        .attr("height", (this.r + this.m) * 2)
                    .append("svg:g")
                        .attr("transform", "translate(" + (this.r + this.m) + "," + (this.r + this.m) + ")");
        this.update();
        initCenterText(this);
    };

    this.update = function() {
        var groupCount = 0;
        var colorIdx = 0;
        var groupCol;

        //appPie.data([this.dataset]);
        var path = appPie.data([this.dataset]).selectAll('path')
                .data(partition.nodes);

        path.each(tuneRad)
            .transition()
            .duration(500)
            .attr('d', arc);

        path.enter().append('svg:path')
                .each(tuneRad)
                .attr('d', arc)
                .style('fill', function(d, i) {
                    if (0 === d.depth) {
                        return '#E7E7E7';
                    }
                    if (1 === d.depth) {
                        var childLen = d.children.length;
                        colorIdx = childLen + 2;
                        groupCol = d3.scale.ordinal()
                            .domain([0, childLen+2])
                            .range(colorbrewer[colorSet[groupCount]][colorIdx]);
                        groupCount++;
                        return groupCol(0);
                    }
                    colorIdx--;
                    BASE[base].color[d.name] = groupCol(colorIdx);
                    return groupCol(colorIdx);
                })
                .style('stroke', '#ffffff')
                .on(eventObj)
                .each(stash);

        path.exit().remove();
        resetAllCenterText();
    };

    this.getThisPie = function() {
        return appPie;
    };
}
