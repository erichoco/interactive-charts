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

    var update_pie = function() {
        var cached_text;

        var text_fnt = function(d) {
            if (d % 1 !== 0) {
                return d.toFixed(2) + '%';
            }
            else {
                return d;
            }
        };

        var set_pie_text = function(parentNode, value, percentage) {

            var value_text = parentNode.select('.value');
            cached_text = value_text.text();

            value_text.text(value);
            parentNode.select('.percentage').text(percentage);
        }

        var event_obj = {

            'mouseover': function(d, i) {

                var this_el = d3.select(this);
                this_el.transition()
                    .attr('d', d3.svg.arc()
                        .innerRadius(chart_r * 0.7)
                        .outerRadius(chart_r * 1.08)
                    );

                var this_el_par = d3.select(this.parentNode);
                set_pie_text(this_el_par, text_fnt(d.data),
                    get_percentage(d.data, this_el_par.data()[0], 2) + '%');
            },
            
            'mouseout': function(d, i) {

                var this_el = d3.select(this);
                if (!this_el.attr('class') || !this_el.attr('class').match('clicked')) {
                    this_el.transition()
                        .duration(500)
                        .ease('bounce')
                        .attr('d', d3.svg.arc()
                            .innerRadius(chart_r * 0.7)
                            .outerRadius(chart_r)
                        );
                }

                var this_el_par = d3.select(this.parentNode);
                set_pie_text(this_el_par, cached_text, '');
            },

            'click': function(d, i) {

                // Since jQuery cannot manipulate class of svg objects,
                // handle manuall here.
                var this_el = d3.select(this);
                var this_classes = this_el.attr('class');

                this_el.attr('class', 
                    (!this_classes)? 'clicked' :
                        (!this_classes.match('clicked'))? this_classes + 'clicked'
                                                        : this_classes.replace('clicked', '')
                );

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

                cur_context = update_line_from_bottom(svg_name, 'ad_cat', i);
            }
        }

        // The data for each svg:svg element is a row of numbers (an array). We pass
        // that to d3.layout.pie to compute the angles for each arc. These start and end
        // angles are passed to d3.svg.arc to draw arcs! Note that the arc radius is
        // specified on the arc, not the layout.
        var pie = d3.layout.pie()
                        .value(function(d) {
                            return d;
                        });

        var chart_g = charts.selectAll('.ad-pie g')
                                .selectAll('path')
                                .data(pie);

        var arc = d3.svg.arc()
                        .innerRadius(chart_r * 0.7)
                        .outerRadius(chart_r);

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
        /*
        for (var i = 0; i < data.length; i++) {
            data_tol[i] = dataset[i][0];
            dataset[i] = dataset[i].slice(1, dataset[i].length);
        }*/

        chart_m = $charts.innerWidth() / data.length / 2 * 0.14;
        chart_r = $charts.innerWidth() / data.length / 2 * 0.85;

        create_legend(cat_name);

        // Insert an svg:svg element (with margin) for each row in our dataset. A
        // child svg:g element translates the origin to the pie center.
        var svg = charts.selectAll(".ad-pie")
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

        // The circle displaying total data.
        svg.append("svg:circle")
            .attr("r", chart_r * 0.6)
            .style("fill", "#E7E7E7")
            .on({
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
            });

        svg.append('text')
                .attr('class', 'pie-text type')
                .attr('y', chart_r * -0.16)
                .attr('text-anchor', 'middle')
                .text(function(d, i) {
                    return TYPE_NAME['type' + i];
                })
        svg.append('text')
                .attr('class', 'pie-text value')
                .attr('text-anchor', 'middle')
                .text(function(d, i) {
                    return (i === 2)? data_tol[i].toFixed(2) + '%'
                                    : data_tol[i];
                })
        svg.append('text')
                .attr('class', 'pie-text percentage')
                .attr('y', chart_r * 0.16)
                .attr('text-anchor', 'middle');
            

        update_pie();
    }

    this.update = function() {

    }
}