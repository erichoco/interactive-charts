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

    var platform_class_name = ['tol-bg', 'ios-bg', 'and-bg'];

    var colors;

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
    var config_axes = function(x_domain, y_domain) {
        scale['x'].domain(x_domain);
        scale['y'].domain(y_domain);
        axis['x'].scale(scale['x']);
        axis['y'].scale(scale['y']);
    }

    /*
     * Return the desired color of a line or dot.
     * base_value_idx: determine which base_value in the context
     */
    var set_color = function(this_obj, base_value_idx) {

        var this_context = this_obj.context;
        var this_col_scheme = COLOR_SCHEME[this_context['base']];
        var color = this_col_scheme[this_context['base_value'][base_value_idx]];
        return color;
    }

    /*
     * Add tooltip to dots of the chart
     * refer to static/js/report_js/report_picture.js by Cathy
     */
    var handle_tooltip = function(this_obj, el, data, should_add) {
        function get_x_val(date) {
            date = new Date(date);
            mon = date.getMonth() + 1;
            day = date.getDate();
            hour = date.getHours();
            min = date.getMinutes();
            year = date.getFullYear();

            if (hour < 10)
                hour = '0'+ hour.toString();

            if (min < 10)
                min = '0' + min.toString();

            if (this_obj.chart_context['unit'] === 'weekly' || this_obj.chart_context['unit'] === 'daily') 
                return year + '/' + mon + '/' + day;
            else if (this.chart_context['unit'] === 'monthly') 
                return year + '/' + mon;
            else if (this.chart_context['unit'] === 'hourly') 
                return year + '/' + mon + '/' + day + " " + hour + ':' + min;
        }

        function get_y_val(val) {
            if (this_obj.chart_context['type'] === 'ctr') {
                return val.toFixed(2) + '%';
            }
            else {
                return val;
            }
        }

        function show_tooltip(top, left, content) {
            $('<div id="tooltip">' + content + '</div>').css({
                'padding': '2px',
                'position': 'absolute',
                'display': 'none',
                'top': top - 25 + 'px',
                'left': left + 10 + 'px',
                'border': '1px solid #A9A9A9',
                'background-color': '#CFCFCF',
                'opacity': '0.8'
            }).appendTo('#line-chart').fadeIn(100);
        }

        var el_offset = $(el[0]).offset();
        if (should_add && !$('#tooltip').length) {
            var data_type_name = {
                'impression': 'Impressions',
                'click': 'Clicks',
                'ctr': 'CTR'
            }
            var tooltip_content = get_x_val(data[0]) + ' ' +
                                  data_type_name[this_obj.chart_context['type']] + ': ' +
                                  get_y_val(data[1]);
            show_tooltip(el_offset.top, el_offset.left, tooltip_content);
            chart_svg.append('circle')
                .transition()
                .attr('id', 'ring')
                .attr('cx', el.attr('cx'))
                .attr('cy', el.attr('cy'))
                .attr('r', 5.2);
        }
        else {
            $('#tooltip').fadeOut(200, function() {
                this.remove();
            });
            $('#ring').fadeOut(200, function() {
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
     */
    var set_background = function(dataset, context) {

        var domain = {
            'start': dataset[0].time,
            'end': dataset[0].time,
            'min': 0,
            'max': 0
        };

        var lines = new Array();

        //for (var i = 0; i < this_obj.chart_context['cat'].length; i++) {

            //var line = new Array();
        for (var i = 0; i < context.cat.length; i++) {
            lines.push(new Array());
        }

        for (var i = 0; i < context.cat.length; i++) {

            for (var j = 0; j < dataset.length; j++) {

                var curData = dataset[j];

                if (curData.cat !== context.cat[i]) { continue; }

                var coord = [curData.time, curData.data[context.type]];

                lines[i].push(coord);

                domain = updateDomain(curData, context.type, domain);
            }
        }

        config_axes([domain.start, domain.end], [domain.min, domain.max]);

        return lines;


        function update_domain(data) {

            if (st_date) {
                st_date = (data['data_time'] < st_date)? data['data_time']
                                                       : st_date;
            }
            else {
                st_date = data['data_time'];
            }
            if (ed_date) {
                ed_date = (data['data_time'] > ed_date)? data['data_time']
                                                       : ed_date;
            }
            else {
                ed_date = data['data_time'];
            }

            if (min_val) {
                min_val = (data[this_obj.chart_context['type']] < min_val)? data[this_obj.chart_context['type']]
                                                                : min_val;
            }
            else {
                min_val = data[this_obj.chart_context['type']];
            }
            if (max_val) {
                max_val = (data[this_obj.chart_context['type']] > max_val)? data[this_obj.chart_context['type']]
                                                                : max_val;
            }
            else {
                max_val = data[this_obj.chart_context['type']];
            }
        }
    }

    var update_line_dot = function(this_obj, lines) {

        var exist_color, enter_color;
        // Join new data to lines
        var type_lines = chart_svg.selectAll('.line')
                            .data(lines);

        // Translate existing lines translate
        type_lines.select('path')
                .transition()
                .attr('d', line)
                .style('stroke', function(d, i) {
                    return colors[this_obj.context.cat[i]];
                });

        // Add New line(data pairs)
        var new_lines = type_lines.enter()
                .append('g')
                    .attr('class', 'line')
                .append('svg:path')
                    .attr('class', function(d, i) {
                        var base_value = this_obj.chart_context['base_value'];
                        return 'path-line';
                    })
                    .transition()
                    .attr('d', line)
                    .style('stroke', function(d, i) {
                        return colors[this_obj.context.cat[i]];
                    });

        // Remove redundant lines
        type_lines.exit().remove();


        // Join new data to dots
        var dots = type_lines.selectAll('circle')
                .data(function(d) {
                    return d;
                });

        dots.transition()
            .attr('cx', line.x())
            .attr('cy', line.y())
            .style('fill', function(d, i, j) {
                return set_color(this_obj, j);
            });

        var new_dots = dots.enter()
            .append('svg:circle')
            .attr('class', 'dot')
            .style('fill', function(d, i, j) {
                return set_color(this_obj, j);
            })
            .attr('cx', line.x())
            .attr('cy', line.y())
            .attr('r', 3)
            .on({
                'mouseover': function(d) {
                    handle_tooltip(this_obj, d3.select(this), d, true);
                },
                'mouseout': function(d) {
                    handle_tooltip(this_obj, d3.select(this), d, false);
                }
            });

        dots.exit().remove();
    }


    /******************
     * public members *
     ******************/
    // the type and context of line svg chart presenting
    this.chart_data = [];
    this.chart_context = {};
    this.context = {};

    this.create = function(dataset, context) {
        this.chart_data = dataset;
        this.chart_context = context;
        this.context = context;
        colors = context.group.color;

        var lines = set_background(dataset, context);
        console.log(lines);

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

        update_line_dot(this, lines);
    }

    this.update = function() {
        var data_pairs_set = set_background(this, this.chart_data);

        chart_svg.select('.x')
                .call(axis['x'])
                .selectAll('text')
                    .style('text-anchor','end')
                    .attr('transform','rotate(-45)');
        chart_svg.select('.y')
                .call(axis['y']);

        update_line_dot(this, data_pairs_set);
    }

    this.reset_to_tol = function() {
        this.chart_context['base_value'] = [0];
        this.update();
    }
};