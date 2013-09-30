function AdPieCharts() {
    var charts = d3.select('#ad-pie-charts');

    // Define the margin, radius, and color scale. The color scale will be
    // assigned by index, but if you define your data using objects, you could pass
    // in a named field from the data object instead, such as `d.name`. Colors
    // are assigned lazily, so if you want deterministic behavior, define a domain
    // for the color scale.
    var $charts = $(charts[0]);
    var chart_m,
        chart_r,
        z = d3.scale.category20();

    var cur_context = {};
    var data_tol = [];

    var create_legend = function(cat_name) {
        // Create legend for pie charts
        var legend = charts.append('svg')
                        .attr('class', 'legend')
                        .attr('width', $charts.innerWidth())
                        .attr('height', 50)
                        .attr('transform', 'translate(0, -100)')
                    .selectAll('g')
                        .data(cat_name)
                    .enter().append('g')
                        .attr('transform', function(d, i) {
                            return 'translate(' + (i * 120 + 50) + ', 10)';
                        });

        legend.append('circle')
            .attr('class', 'legend-label')
            .attr('r', 10)
            .style('fill', function(d, i) {
                return z(i);
            });

        legend.append('text')
            .attr('width', function(d, i) {
                return cat_name[i].length * 16;
            })
            .attr('height', 10)
            .attr('dx', '1em')
            .attr('dy', '.3em')
            .text(function(d, i) {
                return cat_name[i];
            });
    }

    var create_center_circle = function(pie) {

        var event_obj = {
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
                    .attr("r", chart_r * 0.6)
            },
            'click': function(d, i) {

                var pathes = charts.selectAll('path');
                path_anim(pathes, 1);
                pathes.classed('clicked', false);

                var svg_par = d3.select(this.parentNode.parentNode);
                var svg_name = svg_par.attr('name');

                // work around version for kuad
                if (svg_name === 'type0') {
                    svg_name = 'impression';
                }
                else if (svg_name === 'type1') {
                    svg_name = 'click';
                }
                else {
                    svg_name = 'ctr';
                }

                // Line chart display tol only
                cur_context = update_line_from_bottom(svg_name, 'ad_cat', 0);
            }
        }

        // The circle displaying total data.
        pie.append("svg:circle")
            .attr("r", chart_r * 0.6)
            .style("fill", "#E7E7E7")
            .on(event_obj);

        pie.append('text')
                .attr('class', 'pie-text type')
                .attr('y', chart_r * -0.16)
                .attr('text-anchor', 'middle')
                .text(function(d, i) {
                    return TYPE_NAME[i];
                })
        pie.append('text')
                .attr('class', 'pie-text value')
                .attr('text-anchor', 'middle')
                .text(function(d, i) {
                    return type_value_text(data_tol[i]);
                })
        pie.append('text')
                .attr('class', 'pie-text percentage')
                .attr('y', chart_r * 0.16)
                .attr('text-anchor', 'middle');
    }

    /*
     * Set only the value and percentage, type name will not be changed
     */
    var set_pie_text = function(parentNode, value, percentage) {

        parentNode.select('.value').text(value);
        parentNode.select('.percentage').text(percentage);
    }

    var path_anim = function(el, dir) {

        switch(dir) {
            case 0:
                el.transition()
                    .attr('d', d3.svg.arc()
                        .innerRadius(chart_r * 0.7)
                        .outerRadius(chart_r * 1.08)
                    );
                break;
            case 1:
                el.transition()
                    .duration(500)
                    .ease('bounce')
                    .attr('d', d3.svg.arc()
                        .innerRadius(chart_r * 0.7)
                        .outerRadius(chart_r)
                    );
                break;
        }
    }

    var update_pie = function() {

        var cached_text;

        var event_obj = {

            'mouseover': function(d, i) {

                path_anim(d3.select(this), 0);

                var this_el_par = d3.select(this.parentNode);
                cached_text = this_el_par.select('.value').text();
                set_pie_text(this_el_par, type_value_text(d.data),
                    get_percentage(d.data, this_el_par.data()[0], 2) + '%');
            },
            
            'mouseout': function(d, i) {

                var this_el = d3.select(this);
                if (!this_el.attr('class') || !this_el.attr('class').match('clicked')) {
                    path_anim(this_el, 1);
                }

                var this_el_par = d3.select(this.parentNode);
                set_pie_text(this_el_par, cached_text, '');
            },

            'click': function(d, i) {

                // Select this' svg parent
                var svg_name = d3.select(this.parentNode.parentNode).attr('name');

                // work around version for kuad
                if (svg_name === 'type0') {
                    svg_name = 'impression';
                }
                else if (svg_name === 'type1') {
                    svg_name = 'click';
                }
                else {
                    svg_name = 'ctr';
                }

                if (svg_name !== cur_context['type']) {
                    var paths = charts.selectAll('path');
                    paths.classed('clicked', false);
                    path_anim(paths, 1);
                }

                // Since jQuery cannot manipulate class of svg objects,
                // handle manuall here.
                var this_el = d3.select(this);
                if (this_el.classed('clicked')) {
                    path_anim(this_el, 1);
                    this_el.classed('clicked', false);
                }
                else {
                    path_anim(this_el, 0);
                    this_el.classed('clicked', true);
                }

                cur_context = update_line_from_bottom(svg_name, 'ad_cat', i + 1);
            }
        }

        // The data for each svg:svg element is a row of numbers (an array). We pass
        // that to d3.layout.pie to compute the angles for each arc. These start and end
        // angles are passed to d3.svg.arc to draw arcs! Note that the arc radius is
        // specified on the arc, not the layout.
        var pie = d3.layout.pie()

        var chart_g = charts.selectAll('.ad-pie g')
                                .selectAll('path')
                                .data(function(d) {
                                    return pie(d);
                                });

        var arc = d3.svg.arc()
                        .innerRadius(chart_r * 0.7)
                        .outerRadius(function() {
                            return (d3.select(this).classed('clicked'))? chart_r * 1.08
                                                                       : chart_r;
                        });

        chart_g
            .transition()
            .duration(1000)
            .attr('d', arc);

        chart_g.enter()
            .append('svg:path')
                .attr('d', arc)
                .style('fill', function(d, i) {
                    return z(i);
                })
                .style('stroke', '#FFFFFF')
                .on(event_obj)

        chart_g.exit().remove();
    }

    this.create = function(raw_data, context, cat_name, type_num) {

        var dataset = prepare_data(raw_data, 'ad_cat');
        cur_context = context;

        var data = [];
        for (k in dataset) {
            data_tol.push(dataset[k][0]);
            data.push(dataset[k].slice(1, dataset[k].length));
        }
        
        for (var i = 0; i < 6; i++) {
            COLOR_SCHEME['ad_cat'].push(z(i));
        };

        chart_m = $charts.innerWidth() / data.length / 2 * 0.14;
        chart_r = $charts.innerWidth() / data.length / 2 * 0.85;

        create_legend(cat_name);

        // Insert an svg:svg element (with margin) for each row in our dataset. A
        // child svg:g element translates the origin to the pie center.
        var new_pie = charts.selectAll(".ad-pie")
                        .data(data)
                    .enter().append("svg:svg")
                        .attr('class', 'ad-pie')
                        .attr('name', function(d, i) {
                            return 'type' + i;
                        })
                        .attr("width", (chart_r + chart_m) * 2)
                        .attr("height", (chart_r + chart_m) * 2)
                    .append("svg:g")
                        .attr("transform", "translate(" + (chart_r + chart_m) + "," + (chart_r + chart_m) + ")");

        create_center_circle(new_pie);

        update_pie();
    }

    this.update = function(new_raw_data, new_context) {

        var dataset = prepare_data(new_raw_data, 'ad_cat');
        cur_context = new_context;

        var data = [];
        data_tol = new Array;
        for (k in dataset) {
            data_tol.push(dataset[k][0]);
            data.push(dataset[k].slice(1, dataset[k].length));
        }

        // Assume no new categ of data enter
        var pie = charts.selectAll(".ad-pie g")
                    .data(data);

        charts.selectAll('.value')
            .text(function(d, i) {
                return type_value_text(data_tol[i]);
            })

        update_pie();

    }
}
