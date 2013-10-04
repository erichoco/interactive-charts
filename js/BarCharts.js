function BarCharts() {
    /*******************
     * private members *
     *******************/
    var base = 0;

    var charts = d3.select('#bar-charts');

    // dimension of a single chart
    var chart_w = $('#line-chart').innerWidth() * 0.8,
        chart_h = $('#line-chart').innerHeight() * 0.2;

    var calBarWidth = function(d, i, j) {
        var scale = d3.scale.linear()
                .domain([0, 100])
                .range([0, chart_w * 0.95]);
        return scale(getBarPer(this)) + 'px';
    }

    var unclickAllHorizBar = function() {
        var horizBars = charts.selectAll('.clicked');
        horizBars.classed('clicked', false);
    }

    var createTotalBars = function() {
        d3.selectAll('.bars').append('div')
            .attr('class', 'total-bar tol-bg')
            .style({
                'width': '0px',
                'height': chart_h * 0.4 + 'px',
                'font-size': chart_h * 0.4 * 0.75 + 'px',
            })
            .on('click', function(d, i) {
                console.log(this);
                unclickAllHorizBar();
                updateLineContext(d.type, 0);
            })
            .transition()
                .style('width', chart_w * 0.95 + 'px')
                .text(function(d) {
                    return valToText(d.total);
                });
    }

    var updateBars = function() {

        var eventObj = {
            'mouseover': function(d, i, j) {
                var horizBars = d3.select(this.parentNode).selectAll('.horiz-bar');
                horizBars.text(function() {
                    return getBarPer(this).toFixed(0) + '%';
                });
            },
            'mouseout': function(d, i) {
                var horizBars = d3.select(this.parentNode).selectAll('.horiz-bar');
                horizBars.text(function(d) {
                    return valToText(d.val);
                });
            },
            'click': function(d, i, j) {
                var thisBars = charts.select('.type' + j);
                if (0 === thisBars.selectAll('.clicked')[0].length) {
                    unclickAllHorizBar();
                }

                var thisHorizBar = d3.select(this);
                var clicked = thisHorizBar.classed('clicked');
                thisHorizBar.classed('clicked', !clicked);

                updateLineContext(j, d.cat);
            }
        };

        var horizBar = d3.selectAll('.bars')
                            .selectAll('.horiz-bar')
                            .data(function(d) {
                                console.log('new d', d);
                                return d.data;
                            });

        horizBar.transition()
            .style('width', calBarWidth)
            .text(function(d) {
                return valToText(d.val);
            });

        horizBar.enter().append('div')
                    .attr('class', function(d, i) {
                        return 'horiz-bar ' + BASE[base].stylingClass[d.cat];
                    })
                    .style({
                        'width': '0px',
                        'height': chart_h * 0.5 + 'px',
                        'font-size': chart_h * 0.5 * 0.75 + 'px',
                        'border-radius': function(d, i) {
                            if (i === 0) {
                                return '5px 0 0 5px';
                            } else if (i === BASE[base].cat.length - 2) {
                                return '0 5px 5px 0';
                            }
                        }
                    })
                    .on(eventObj)
                    .transition()
                        .style('width', calBarWidth)
                        .text(function(d) {
                            return valToText(d.val);
                        });

        horizBar.exit()
            .transition()
            .style('width', '0px')
            .remove();

        d3.selectAll('.total-bar')
            .text(function(d) {
                return valToText(d.total);
            });
    }

    /******************
     * public members *
     ******************/
    this.create = function(dataset) {

        charts.append('svg')
            .attr('class', 'legend')
            .attr('width', '100%')
            .attr('height', 50)
            .attr('transform', 'translate(0, -100)');

        var barWrappers = charts.selectAll('.bars-wrapper')
                            .data(dataset)
                        .enter().append('div')
                            .attr('class', 'bars-wrapper')

        barWrappers.append('p')
            .attr('class', 'bars-title')
            .text(function(d) {
                return TYPE[d.type];
            });

        barWrappers.append('div')
            .attr('class', function(d, i) {
                return 'bars' + ' type' + i;
            })
            .style('width', chart_w + 'px')
            .style('height', chart_h + 'px');

        createLegend(charts, base);
        updateBars();
        createTotalBars();
    }

    this.update = function(dataset) {
        var barWrappers = charts.selectAll('.bars-wrapper')
                            .data(dataset);
        updateBars();
    }

    this.changeType = function(type, cat) {
        var bars = charts.select('.type' + type);
        var horizBars = bars.selectAll('.horiz-bar');
        if (1 === cat.length) {
            console.log($(bars.select('.total-bar')[0]));
            $(bars.select('.total-bar')[0]).click();
        } else {
            for (var j = 1; j < cat.length; j++) {
                $(horizBars.filter(function(d) {
                    return d.cat === cat[j];
                })[0]).click();
            }
        }
    }
};