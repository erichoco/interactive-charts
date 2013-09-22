function BarCharts() {
    /*******************
     * private members *
     *******************/
    var charts = d3.select('#bar-charts');
    var sub_charts = [];
    // dimension of a single chart
    var chart_w = $('#line-chart').innerWidth() * 0.8,
        chart_h = $('#line-chart').innerHeight() * 0.2;
    var platform_class_name = ['tol-bg', 'ios-bg', 'and-bg'];
    var clicked_class_name = ['tol-clicked', 'ios-clicked', 'and-clicked'];

    var cur_context = {};

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

                console.log(cur_context['type']);

                if ($this_bar.attr('name') !== cur_context['type']) {
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

                cur_context = update_line_from_bottom($this_bar.attr('name'), 'platform', i);
            }
        };

        /* Updating Part */

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
    this.create = function(raw_data, context, platform_name, data_type_name) {
        var dataset = set_background(raw_data);
        cur_context = context;

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

    this.update = function(new_raw_data, new_context) {
        var new_dataset = set_background(new_raw_data);
        cur_context = new_context;

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