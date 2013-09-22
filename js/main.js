(function() {
        var line_chart;        // shared line chart
        $(function() {
            var testing_data = gen_fake_data();
            console.log('Testing Data', testing_data);

            // Default context
            var chart_context = {
                unit: testing_data[0],
                type: 'impression', // impression | click | ctr
                base: 'platform',   // platform | app | ad
                base_value: [0]     // must correspond to the order of dataset passed to LineChart obj
            }

            var platform_name = ['Total', 'iOS', 'Android'];
            var data_type = ['Impressions', 'Clicks', 'CTR'];

            $('#refresh-btn').on('click', refresh_data);
            $('.type_radio').on('click', change_line_type);

            var data_set = testing_data[1];
            line_chart = new LineChart();
            line_chart.create(data_set, chart_context);
            console.log(line_chart.chart_context);

            var bar_charts = new BarCharts();
            bar_charts.create_label(platform_name);
            bar_charts.create(testing_data[1], platform_name, data_type);

            function refresh_data() {
                var new_test_data = gen_fake_data();
                line_chart.chart_data = new_test_data[1];
                line_chart.update();

                bar_charts.update(new_test_data[1]);
            }

            function change_line_type() {
                var type_val = $('input[name=type]:checked').val();

                var type_bars = $('.sub-chart div[name*="' + type_val + '"]');
                var base_values = line_chart.chart_context['base_value'];

                for (var i = 0; i < base_values.length; i++) {
                    type_bars[base_values[i]].click();
                    console.log('click!');
                }
            }
        });


        var LineChart = function() {
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
                        //.transition()
                        .x(function(d) {
                            return scale['x'](d[0]);
                        })
                        .y(function(d) {
                            return scale['y'](d[1]);
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

            /*
             * Return x, y values set for the line chart.
             * Config axes by the way.
             */
            var set_background = function(raw_data) {
                var data_pairs_set = [];
                var st_date, ed_date;
                var min_val, max_val;
                console.log(line_chart.chart_context);
                for (var i = 0; i < line_chart.chart_context['base_value'].length; i++) {
                    var data_pairs = new Array();
                    //var data = input_set[i];

                    for (var j = 0; j < raw_data.length; j++) {
                        var cur_data = raw_data[j];
                        var pair = [];

                        if (cur_data[line_chart.chart_context['base']] === line_chart.chart_context['base_value'][i]) {
                            pair[0] = cur_data['data_time'];
                            pair[1] = cur_data[line_chart.chart_context['type']];
                            data_pairs.push(pair);

                            update_domain(cur_data);
                        }
                    }

                    config_axes([st_date, ed_date], [0, max_val]); // set min val = 0 temperarily

                    data_pairs_set[i] = data_pairs;
                };

                return data_pairs_set;

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
                        min_val = (data[line_chart.chart_context['type']] < min_val)? data[line_chart.chart_context['type']]
                                                                        : min_val;
                    }
                    else {
                        min_val = data[line_chart.chart_context['type']];
                    }
                    if (max_val) {
                        max_val = (data[line_chart.chart_context['type']] > max_val)? data[line_chart.chart_context['type']]
                                                                        : max_val;
                    }
                    else {
                        max_val = data[line_chart.chart_context['type']];
                    }
                }
            }

            var update_line_dot = function(this_obj, data_pairs_set) {

                // Join new data to lines
                var type_lines = chart_svg.selectAll('.type-line')
                                    .data(data_pairs_set);

                // Translate existing lines translate
                type_lines.select('path')
                        .transition()
                        .attr('d', line);

                // Add New line(data pairs)
                var new_lines = type_lines.enter()
                                    .append('g')
                                        .attr('class', 'type-line')
                                    .append('svg:path')
                                        .attr('class', function(d, i) {
                                            var base_value = this_obj.chart_context['base_value'];
                                            return 'path-line ' + platform_class_name[base_value[i]];
                                        })
                                        .transition()
                                        .attr('d', line);
                // Remove redundant lines
                type_lines.exit().remove();

                // Join new data to dots
                var dots = type_lines.selectAll('circle')
                        .data(function(d) {
                            return d;
                            //return d3.select(this.parentNode).datum();
                        });

                dots.transition()
                    .attr('cx', line.x())
                    .attr('cy', line.y());

                dots.enter()
                    .append('svg:circle')
                    .attr('class', function(d, i) {
                        var line_class = d3.select(this.parentNode.childNodes[0]).attr('class');
                        for (var i = 0; i < platform_class_name.length; i++) {
                            if (line_class.match(platform_class_name[i])) {
                                return 'dot ' + platform_class_name[i];
                            }
                        }
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

            this.create = function(raw_data, context) {
                this.chart_data = raw_data;
                this.chart_context = context;
                var data_pairs_set = set_background(raw_data);

                /* Creating real svg elements & binding data */
                chart_svg = chart.append('svg')
                                //.data([data_pair])
                                .attr('width', chart_w + chart_m.left + chart_m.right)
                                .attr('height', chart_w + chart_m.top + chart_m.bottom)
                                .append('svg:g')
                                .attr('transform', 'translate(' + chart_m.left + ',' + chart_m.top + ')');

                chart_svg.append('svg:g')
                        .attr('class', 'x axis')
                        .attr('transform', 'translate(0,' + chart_h + ')')
                        .call(axis['x']);
                chart_svg.append('g')
                        .attr('class', 'y axis')
                        .call(axis['y']);

                update_line_dot(this, data_pairs_set);
            }

            this.update = function() {
                var data_pairs_set = set_background(this.chart_data);
                //console.log(data_pair);

                chart_svg.select('.x')
                        .call(axis['x']);
                chart_svg.select('.y')
                        .call(axis['y']);

                update_line_dot(this, data_pairs_set);
            }

            this.reset_to_tol = function() {
                this.chart_context['base_value'] = [0];
                this.update();
            }
        };


        var BarCharts = function() {
            /*******************
             * private members *
             *******************/
            var charts = d3.select('#bar-charts');
            var sub_charts = [];
            // dimension of a single chart
            var chart_w = parseInt(charts.style('width')) * 0.8, chart_h = 70;
            var platform_class_name = ['tol-bg', 'ios-bg', 'and-bg'];
            var clicked_class_name = ['tol-clicked', 'ios-clicked', 'and-clicked'];

            /*
             * Update/Add bars in a sub-chart
             * Also, set styles, attributes, events
             */
            var update_bars = function(chart, data) {
                // set scaling function
                var bar_scale = d3.scale.linear()
                                    .domain([0, 100])
                                    .range([0, chart_w * 0.95]);

                var width_fnt = function(d, i) {
                    if (i === 0) {
                        return chart_w * 0.95 + 'px';
                    }
                    else {
                        return bar_scale(get_percentage(d, data.slice(1, data.length), 2)) + 'px';
                    }
                };

                var text_fnt = function(d) {
                    if (d % 1 !== 0) {
                        return d.toFixed(2) + '%';
                    }
                    else {
                        return d;
                    }
                };

                var event_obj = {
                    'mouseover': function(d, i) {
                        if (d % 1 === 0 && i !== 0) {
                            var bars = this.parentNode.childNodes;
                            for (var i = 1; i < bars.length; i++) {
                                d3.select(bars[i]).text(Math.round(d3.select(bars[i]).data() / data[0] * 100) + '%');
                            }
                        }
                    },
                    'mouseout': function(d, i) {
                        if (d % 1 === 0 && i !== 0) {
                            var bars = this.parentNode.childNodes;
                            for (var i = 1; i < bars.length; i++) {
                                d3.select(bars[i]).text(d3.select(bars[i]).data());
                            }
                        }
                    },
                    'click': function(d, i) {
                        var $this_bar = $(this);

                        if ($this_bar.attr('name') !== line_chart.chart_context['type']) {
                            $this_bar.parent().parent()
                                        .siblings()
                                        .find('.clicked').removeClass('clicked');
                        }

                        if (i === 0) {
                            $this_bar.siblings().removeClass('clicked');
                        }
                        else {
                            $this_bar.toggleClass('clicked');
                        }

                        update_line_from_bottom($this_bar.attr('name'), 'platform', i);
                    }
                };

                /*
                 * Return the matched class index for click event. Total = 0, iOS = 1, Android = 2
                 */
                /*function check_matched_class(checked_class) {
                    for (var i = 0; i < platform_class_name.length; i++) {
                        if (checked_class.match(platform_class_name[i])) {
                            return i;
                        }
                    }
                }
                function remove_clicked_class(orig_class) {
                    var classes = orig_class.split(' ');
                    var new_class = '';
                    for (var j = 0; j < classes.length; j++) {
                        if (classes[j].match('clicked')) {
                            continue;
                        }
                        new_class += classes[j] + ' ';
                    }
                    return new_class;
                }*/

                /* Updating Part */
                // join new data
                var horiz_bars = chart.selectAll('div')
                                    .data(data);

                horiz_bars.on(event_obj)
                        .transition()
                            .style('width', function(d, i) {
                                return width_fnt(d, i);
                            })
                            .text(function(d) {
                                return text_fnt(d);
                            });

                // create new element as needed
                horiz_bars.enter().append('div')
                        .attr('class', function(d, i) {
                            return 'horiz-bar ' + platform_class_name[i];
                        })
                        .style({
                            'display': function(d, i) {
                                if (i === 0) {
                                    return 'block';
                                }
                            },
                            'width': '0px',
                            'height': function() {
                                return chart_h / (data.length - 1) * 0.9 + 'px';
                            },
                            'font-size': function() {
                                return chart_h / (data.length - 1) * 0.75 + 'px';
                            }
                        })
                        .on(event_obj)
                        .transition()
                            .style('width', function(d, i) {
                                return width_fnt(d, i);
                            })
                            .text(function(d) {
                                return text_fnt(d);
                            });

                horiz_bars.exit().remove();

                return horiz_bars;

                // In fact, no dynamic data entering/exiting is allowed at this moment.
            }

            /*
             * Return data object in customed data format for bar chart.
             */
            var set_background = function(data) {
                var dataset = {
                    impression: [0, 0, 0], // [total, iOS, Android]
                    click: [0, 0, 0],
                    ctr: [0, 0, 0]
                };

                for (var i = 0; i < data.length; i++) {
                    var cur_data = data[i];

                    if ('platform' in cur_data) {
                        dataset['impression'][cur_data['platform']] += cur_data['impression'];
                        dataset['click'][cur_data['platform']] += cur_data['click'];
                    }
                    else {
                        alert("DEBUG: 'platform' key not found");
                    }
                }

                for (var i = 0; i < dataset['ctr'].length; i++) {
                    dataset['ctr'][i] = dataset['click'][i] / dataset['impression'][i] * 100;
                }

                return dataset;
            }


            /******************
             * public members *
             ******************/
            this.create = function(raw_data, platform_name, data_type_name) {
                //console.log(raw_data);
                var dataset = set_background(raw_data);
                console.log(dataset);

                var i = 0;
                for (var k in dataset) {
                    var chart_wrapper = charts.append('div')
                                            .attr('class', 'chart-wrapper');

                    chart_wrapper.append('p')
                        .attr('class', 'chart-label')
                        .text(data_type_name[i]);

                    sub_charts[i] = chart_wrapper.append('div')
                                        .attr('class', 'sub-chart')
                                        .style('width', chart_w + 'px')
                                        .style('height', chart_h + 'px');
                    i++;
                }

                i = 0;
                for (var k in dataset) {
                    var horiz_bars = update_bars(sub_charts[i++], dataset[k]);
                    horiz_bars.attr('name', k);
                }
            }

            this.update = function(new_raw_data) {
                var new_dataset = set_background(new_raw_data);
                var i = 0;
                for (var k in new_dataset) {
                    update_bars(sub_charts[i++], new_dataset[k]);
                }
            }

            /* Add a div for labels inside #platform-charts. (using jQurery)*/
            this.create_label = function(platform_name) {
                $('#bar-charts').append('<div id="labels-wrapper"></div>');
                var $labels_wrapper = $('#labels-wrapper');
                for (var i = 0; i < platform_name.length; i++) {
                    $labels_wrapper.append('<div class="platform-label ' + platform_class_name[i] + '"></div>')
                                   .append('<div class="platform-name">' + platform_name[i] + '</div>');
                };
            }
        };

        /* 
         * Update line chart according to bottom chart selections
         */
        function update_line_from_bottom(type, base, base_value) {
            if (type === line_chart.chart_context['type']) {
                line_chart.chart_context = update_base_value(base_value);
            }
            else {
                $('input[name=type][value=' + type + ']')[0].checked = true;
                line_chart.chart_context['type'] = type;
                line_chart.reset_to_tol();
                line_chart.chart_context = update_base_value(base_value);
            }
            line_chart.update();
        }
        function update_base_value(base_value) {
            var context = line_chart.chart_context;
            if (base_value === 0) {
                context['base_value'] = [0];
                return context;
            }
            var bv_idx = context['base_value'].indexOf(base_value);
            if (bv_idx === -1) {
                context['base_value'].push(base_value);
            }
            else {
                context['base_value'].splice(bv_idx, 1);
            }
            return context;
        }

        /*
         * get_percentage(1, [1, 1, 1]) -> 33 (round_place becomes undefined)
         * get_percentage(1, [1, 2, 3], 2) -> 16.67
         */
        function get_percentage(data, dataset, round_place) {
            var level = 1;
            for (var i = 0; i < round_place; i++) {
                level *= 10;
            };
            return Math.round(data * 100 * level / d3.sum(dataset)) / level;
        }

        function gen_fake_data() {
            var json = [];

            var time_unit = ['hourly', 'daily', 'weekly', 'monthly'];
            json[0] = time_unit[1];
            //json[0] = time_unit[Math.floor(Math.random()*4)];

            var data = new Array();
            var data_range = Math.random()*100 + 3;
            for (var i = 0, month = 0; i < data_range; i++) {
                if ((i % 25) === 0) {
                    month++;
                }

                var click = Math.floor(Math.random()*10),
                    imp = Math.floor(Math.random()*500 + 10),
                    ctr = click / imp * 100;

                var ios_unit_data = {
                    "data_time": new Date('2012/' + month + '/' + (i % 25 + 1)),
                    "click": click,
                    "impression": imp,
                    "ctr": ctr,
                    "platform": 1 // iOS
                }

                click = Math.floor(Math.random()*30);
                imp = Math.floor(Math.random()*2000 + 30);
                ctr = click / imp * 100;
                var and_unit_data = {
                    "data_time": new Date('' + month + '/' + (i % 25 + 1) + '/2012'),
                    "click": click,
                    "impression": imp,
                    "ctr": ctr,
                    "platform": 2 // android
                }

                click = ios_unit_data['click'] + and_unit_data['click'];
                imp = ios_unit_data['impression'] + and_unit_data['impression'];
                ctr = click / imp * 100;
                var tol_unit_data = {
                    "data_time": new Date(2012, month - 1, (i % 25 + 1)),
                    "click": click,
                    "impression": imp,
                    "ctr": ctr,
                    "platform": 0 // total
                }

                data.push(ios_unit_data);
                data.push(and_unit_data);
                data.push(tol_unit_data);
            }

            json[1] = data;

            return json;
        }
    })();