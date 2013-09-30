function DonutCharts() {
    var base = 1;

    var charts = d3.select('#donut-charts');

    var chart_m,
        chart_r,
        color = d3.scale.category20();

    var getCatNames = function(dataset) {
        var catNames = new Array();

        for (var i = 0; i < dataset[0].data.length; i++) {
            catNames.push(BASE[base].cat[dataset[0].data[i].cat]);
        }

        return catNames;
    }

    var unclickAllPath = function() {
        var paths = charts.selectAll('.clicked');
        pathAnim(paths, 0);
        paths.classed('clicked', false);
        resetAllCenterText();
    }

    var createLegend = function(catNames) {
        var legends = charts.select('.legend')
                        .selectAll('g')
                            .data(catNames)
                        .enter().append('g')
                            .attr('transform', function(d, i) {
                                return 'translate(' + (i * 150 + 50) + ', 10)';
                            });

        legends.append('circle')
            .attr('class', 'legend-icon')
            .attr('r', 6)
            .style('fill', function(d, i) {
                return color(i);
            });

        legends.append('text')
            .attr('dx', '1em')
            .attr('dy', '.3em')
            .text(function(d) {
                return d;
            });
    }

    var createCenter = function(pie) {

        var eventObj = {
            'mouseover': function(d, i) {
                d3.select(this)
                    .transition()
                    .attr("r", chart_r * 0.65);
            },

            'mouseout': function(d, i) {
                d3.select(this)
                    .transition()
                    .duration(500)
                    .ease('bounce')
                    .attr("r", chart_r * 0.6);
            },

            'click': function(d, i, j) {
                unclickAllPath();
                updateLineContext(d.type, 0);
            }
        }

        var donuts = d3.selectAll('.donut');

        // The circle displaying total data.
        donuts.append("svg:circle")
            .attr("r", chart_r * 0.6)
            .style("fill", "#E7E7E7")
            .on(eventObj);

        donuts.append('text')
                .attr('class', 'center-txt type')
                .attr('y', chart_r * -0.16)
                .attr('text-anchor', 'middle')
                .style('font-weight', 'bold')
                .text(function(d, i) {
                    return TYPE[d.type];
                });
        donuts.append('text')
                .attr('class', 'center-txt value')
                .attr('text-anchor', 'middle');
        donuts.append('text')
                .attr('class', 'center-txt percentage')
                .attr('y', chart_r * 0.16)
                .attr('text-anchor', 'middle')
                .style('fill', '#A2A2A2');
    }

    var setCenterText = function(thisDonut) {
        var donutData = thisDonut.data()[0];
        var clickedData = thisDonut.selectAll('.clicked').data();
        var returnVal = function(d) {
                            return d.data.val;
                        };

        if (2 !== TYPE[donutData.type]) {
            var val = d3.sum(clickedData, returnVal);
            var per = (val)? val/donutData.total*100
                           : '';
        } else {
            var val = d3.mean(clickedData, returnVal);
            var per = '';
        }

        thisDonut.select('.value')
            .text(function(d) {
                return (val)? valToText(val) + TYPE_UNIT[d.type]
                            : valToText(d.total) + TYPE_UNIT[d.type];
            });
        thisDonut.select('.percentage').text(valToText(per));
    }

    var resetAllCenterText = function() {
        charts.selectAll('.value')
            .text(function(d) {
                return valToText(d.total) + TYPE_UNIT[d.type];
            });
        charts.selectAll('.percentage')
            .text('');
    }

    var pathAnim = function(path, dir) {
        switch(dir) {
            case 0:
                path.transition()
                    .duration(500)
                    .ease('bounce')
                    .attr('d', d3.svg.arc()
                        .innerRadius(chart_r * 0.7)
                        .outerRadius(chart_r)
                    );
                break;

            case 1:
                path.transition()
                    .attr('d', d3.svg.arc()
                        .innerRadius(chart_r * 0.7)
                        .outerRadius(chart_r * 1.08)
                    );
                break;
        }
    }

    var updateDonut = function() {

        var eventObj = {

            'mouseover': function(d, i, j) {
                pathAnim(d3.select(this), 1);

                var thisDonut = charts.select('.type' + j);
                thisDonut.select('.value').text(function(donut_d) {
                    return valToText(d.data.val) + TYPE_UNIT[donut_d.type];
                });
                thisDonut.select('.percentage').text(function(donut_d, donut_i) {
                    return (2 === TYPE[donut_d.type])? ''
                                : (d.data.val/donut_d.total*100).toFixed(2) + '%';
                });
            },
            
            'mouseout': function(d, i, j) {
                var thisPath = d3.select(this);
                if (!thisPath.classed('clicked')) {
                    pathAnim(thisPath, 0);
                }
                var thisDonut = charts.select('.type' + j);
                setCenterText(thisDonut);
            },

            'click': function(d, i, j) {
                var thisDonut = charts.select('.type' + j);

                if (0 === thisDonut.selectAll('.clicked')[0].length) {
                    unclickAllPath();
                }

                var thisPath = d3.select(this);
                var clicked = thisPath.classed('clicked');
                pathAnim(thisPath, ~~(!clicked));
                thisPath.classed('clicked', !clicked);

                setCenterText(thisDonut);

                updateLineContext(j, d.data.cat);
            }
        };

        var pie = d3.layout.pie()
                        .value(function(d) {
                            return d.val;
                        });

        var arc = d3.svg.arc()
                        .innerRadius(chart_r * 0.7)
                        .outerRadius(function() {
                            return (d3.select(this).classed('clicked'))? chart_r * 1.08
                                                                       : chart_r;
                        });

        // Start joining data with paths
        var paths = charts.selectAll('.donut')
                        .selectAll('path')
                        .data(function(d, i) {
                            return pie(d.data);
                        });

        paths
            .transition()
            .duration(1000)
            .attr('d', arc);

        paths.enter()
            .append('svg:path')
                .attr('d', arc)
                .style('fill', function(d, i) {
                    BASE[base].color.push(color(i));
                    return color(i);
                })
                .style('stroke', '#FFFFFF')
                .on(eventObj)

        paths.exit().remove();

        resetAllCenterText();
    }

    this.create = function(dataset) {
        var $charts = $('#donut-charts');
        chart_m = $charts.innerWidth() / dataset.length / 2 * 0.14;
        chart_r = $charts.innerWidth() / dataset.length / 2 * 0.85;

        charts.append('svg')
            .attr('class', 'legend')
            .attr('width', '100%')
            .attr('height', 50)
            .attr('transform', 'translate(0, -100)');

        var donut = charts.selectAll('.donut')
                        .data(dataset)
                    .enter().append('svg:svg')
                        .attr('width', (chart_r + chart_m) * 2)
                        .attr('height', (chart_r + chart_m) * 2)
                    .append('svg:g')
                        .attr('class', function(d, i) {
                            return 'donut type' + i;
                        })
                        .attr('transform', 'translate(' + (chart_r+chart_m) + ',' + (chart_r+chart_m) + ')');

        createLegend(getCatNames(dataset));
        createCenter();

        updateDonut();
    }

    this.update = function(dataset) {
        // Assume no new categ of data enter
        var donut = charts.selectAll(".donut")
                    .data(dataset);

        updateDonut();
    }
}