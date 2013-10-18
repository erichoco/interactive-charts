function LineChart() {
    /*******************
     * private members *
     *******************/

    var chart = d3.select('#line-chart');
    // svg object presenting line chart
    var chart_svg;

    // margin, width and height of the chart 
    // axes spaces are not included in width and height
    var chart_m = {
        top: 50,
        right: 30,
        bottom: 50,
        left: 60
    };
    var chart_w = parseInt(chart.style('width')) * 0.95 - chart_m.left - chart_m.right,
        chart_h = parseInt(chart.style('height')) * 0.9 - chart_m.top - chart_m.bottom;

    var colors;

    var totalHidden = false;

    /* Preperation functions for drawing line */
    // default scale value, will be overwritten later on
    var scale = {
        'x': d3.time.scale()
                .domain([new Date('2012/1/1'), new Date('2012/12/31')])
                .range([0, chart_w]),
        'y': d3.scale.linear()
                .domain([0, 1000])
                .range([chart_h, 0])
    }
    var axis = {
        'x': d3.svg.axis()
                .scale(scale['x'])
                .tickFormat(d3.time.format('%m/%d'))
                .orient('bottom'),
        'y': d3.svg.axis()
                .scale(scale['y'])
                .tickSize(-chart_w)
                .orient('left')
    }
    var line = d3.svg.line()
                .interpolate('linear')
                .x(function(d) {
                    return scale['x'](d[0]);
                })
                .y(function(d) {
                    return scale['y'](d[1].val);
                });
    /* End of preperation functions for drawing line */

    /* 
     * Configure the axis functions. (rescaling)
     */
    var configAxes = function(x_domain, y_domain) {
        scale['x'].domain(x_domain);
        scale['y'].domain(y_domain);
        axis['x'].scale(scale['x']);
        axis['y'].scale(scale['y']);
    }


    /*
     * Add tooltip to dots of the chart
     * refer to static/js/report_js/report_picture.js by Cathy
     */
    var handleTooltip = function(el, context, i, j, show) {

        var offset = $(el[0]).offset();
        var data = el.data()[0];
        var color = colors[context.cat[j]];

        if (show && !$('.tooltip').length) {

            var content = formatDateObj(data[0], context.unit) + ' ' +
                                  TYPE[data[1].type] + ': ' +
                                  valToText(data[1].val);

            createTooltip(offset.top, offset.left, 'tooltip' + i, content, color);

            chart_svg.append('circle')
                .attr('cx', el.attr('cx'))
                .attr('cy', el.attr('cy'))
                .attr('class', 'ring')
                .attr('id', 'r' + i)
                .style('stroke', color)
                .style('opacity', 0.5)
                .transition()
                .duration(200)
                    .attr('r', 5);
        } else {
            $('#tooltip' + i).fadeOut(200, function() {
                this.remove();
            });
            $('#r' + i).fadeOut(200, function() {
                this.remove();
            });
        }
    }


    var updateDomain = function(datum, type, domain) {
        var newDomain = {
            "start": (datum.time < domain.start)? datum.time
                                                : domain.start,
            "end": (datum.time > domain.end)? datum.time
                                            : domain.end,
            "min": (datum.data[type].val < domain.min)?
                                            datum.data[type].val
                                          : domain.min,
            "max": (datum.data[type].val > domain.max)?
                                            datum.data[type].val
                                          : domain.max,
        };
        return newDomain;
    }

    /*
     * Return a set of lines for the line chart, where the number of lines equals
     * to the number of cat in the context.
     * Each line contains a set of coordinates.
     * (Note: if line of total is far from lines of other categories,
     *        line of total will be hidden.)
     */
    var getLineData = function(dataset, context) {
        var totalMin = NaN,
            catMax = NaN;
        var dataLen = dataset.length,
            catLen = context.cat.length;

        var domain = {
            'start': dataset[0].time,
            'end': dataset[0].time,
            'min': 0,
            'max': 0
        };

        var lines = new Array();
        for (var i = 0; i < catLen; i++) {
            lines.push(new Array());
        }

        for (var i = 0; i < catLen; i++) {
            for (var j = 0; j < dataLen; j++) {
                var curData = dataset[j];
                if (curData.cat !== context.cat[i]) {
                    continue;
                }
                var coord = [curData.time, curData.data[context.type]];
                lines[i].push(coord);

                if (0 === context.cat[i]) {
                    totalMin = (totalMin < coord[1].val)? totalMin : coord[1].val;
                } else {
                    catMax = (catMax > coord[1].val)? catMax : coord[1].val;
                }
                domain = updateDomain(curData, context.type, domain);
            }
        }

        if (totalMin - catMax > totalMin * 0.2 && lines.length > 2) {
            lines.shift();
            context.cat.shift();
            domain.max = catMax;
        }
        configAxes([domain.start, domain.end], [domain.min, domain.max]);

        return lines;
    }

    var updateLines = function(lines, context) {

        // Join new data to lines
        var lines = chart_svg.selectAll('.line')
                            .data(lines);

        // Translate existing lines translate
        lines.select('path')
                .transition()
                .attr('d', line)
                .style('stroke', function(d, i) {
                    return colors[context.cat[i]];
                });

        // Add New line(data pairs)
        lines.enter()
                .append('g')
                    .attr('class', 'line')
                .append('svg:path')
                    .attr('class', function(d, i) {
                        //var base_value = this_obj.chart_context['base_value'];
                    })
                    .transition()
                    .attr('d', line)
                    .style('stroke', function(d, i) {
                        return colors[context.cat[i]];
                    });

        // Remove redundant lines
        lines.exit().remove();


        // Join new data to dots
        var dots = lines.selectAll('circle')
                .data(function(d) {
                    return d;
                });

        dots.transition()
            .attr('cx', line.x())
            .attr('cy', line.y())
            .style('fill', function(d, i, j) {
                return colors[context.cat[j]];
            });

        var new_dots = dots.enter()
            .append('svg:circle')
            .attr('class', 'dot')
            .style('fill', function(d, i, j) {
                return colors[context.cat[j]];
            })
            .attr('cx', line.x())
            .attr('cy', line.y())
            .attr('r', 3)
            .on({
                'mouseover': function(d, i, j) {
                    handleTooltip(d3.select(this), context, i, j, true);
                },
                'mouseout': function(d, i, j) {
                    handleTooltip(d3.select(this), context, i, j, false);
                }
            });

        dots.exit().remove();
    }


    /******************
     * public members *
     ******************/
    this.dataset = [];
    this.context = {};

    this.create = function(dataset, context) {
        this.dataset = dataset;
        this.context = context;
        colors = BASE[context.base].color;

        var lines = getLineData(dataset, context);

        /* Creating real svg elements & binding data */
        chart_svg = chart.append('svg')
                        .attr('width', chart_w + chart_m.left + chart_m.right)
                        .attr('height', chart_w + chart_m.top + chart_m.bottom)
                        .append('svg:g')
                        .attr('transform', 'translate(' + chart_m.left + ',' + chart_m.top + ')');

        chart_svg.append('svg:g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + chart_h + ')')
                .call(axis['x'])
                .selectAll('text')
                    .style('text-anchor','end')
                    .attr('transform','rotate(-45)');
        chart_svg.append('g')
                .attr('class', 'y axis')
                .call(axis['y']);

        updateLines(lines, context);
    }

    this.update = function(dataset, context) {
        if (dataset !== null) {
            this.dataset = dataset;
        }
        if (1 === context.cat.length && 0 !== context.cat[0]) {
            context.cat.unshift(0);
            this.context = context;
        }

        colors = BASE[context.base].color;
        var lines = getLineData(this.dataset, context);

        chart_svg.select('.x')
                .call(axis['x'])
                .selectAll('text')
                    .style('text-anchor','end')
                    .attr('transform','rotate(-45)');
        chart_svg.select('.y')
                .call(axis['y']);

        updateLines(lines, context);
    }
};