(function() {
    $(function() {
        var platform_name = ['Total', 'iOS', 'Android'];
        var ad_cat_name = ['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5', 'Category 6'];
        var data_type = ['Impressions', 'Clicks', 'CTR'];

        var jsonSet = new Array();
        for (var i = 0; i < 3; i++) {
            console.log(i);
            jsonSet.push(genJson('daily', i));
        };

        var plat_test_data = gen_fake_data('daily', 'platform');
        var ad_test_data = gen_fake_data('daily', 'ad_cat');
        var app_test_data = gen_fake_data('daily', 'app_cat');

        // Default context
        var chart_context = {
            'unit': jsonSet[0].unit,
            'type': 0, // impression | click | ctr
            'group': jsonSet[0].group,   // platform | app | ad
            'cat': [0]     // must correspond to the order of dataset passed to LineChart obj
        }

        var line_chart;        // shared line chart
        line_chart = new LineChart();
        line_chart.create(jsonSet[0].dataset, chart_context);
        init_line_chart_var(line_chart);


        $('#bottom-slider li').css('width', $('#bottom-slider').width());
        var slider = new Slider($('#bottom-slider ul'), $('#slider-nav'));

        slider.nav.find('button').on('click', function(){
            slider.setCurrent($(this).data('dir'));
            slider.transition();

            // temp work around for kuad
            //var base, data;
            /*switch(slider.current) {
                case 0: 
                    //base = 'platform';
                    data = plat_test_data;
                    break;
                case 1:
                    //base = 'ad_cat';
                    data = ad_test_data;
                    break;
                case 2:
                    //base = 'app_cat';
                    data = app_test_data;
                    break;
            }

            line_chart.chart_data = data[1];*/

            chart_context.group = slider.current;
            line_chart.update(jsonSet[slider.current].dataset, chart_context);
        });

        var donuts = new DonutCharts();


        var bar_charts = new BarCharts();
        bar_charts.create_label(platform_name);
        bar_charts.create(plat_test_data[1], line_chart.chart_context, platform_name, data_type);


/*        var ad_pie_charts = new AdPieCharts();
        ad_pie_charts.create(ad_test_data[1], line_chart.chart_context, ad_cat_name, 3);

        var app_pie_charts = new AppPieCharts();
        var app_data = appPieData();
        console.log(app_data);
        app_pie_charts.create(app_data);*/


        $('#refresh-btn').on('click', refresh_data);
        $('.type_radio').on('click', change_line_type);

        function refresh_data() {
            jsonSet[slider.current] = genJson('daily', slider.current);
            chart_context.unit = jsonSet[slider.current].unit;

            line_chart.update(jsonSet[slider.current].dataset, chart_context);
/*
            bar_charts.update(plat_test_data[1], line_chart.chart_context);
            ad_pie_charts.update(ad_test_data[1], line_chart.chart_context);*/
        }

        function change_line_type() {
            var type_val = $('input[name=type]:checked').val();

            var type_bars = $('.sub-chart div[name*="' + type_val + '"]');
            var base_values = line_chart.chart_context['base_value'];

            for (var i = 0; i < base_values.length; i++) {
                type_bars[base_values[i]].click();
            }
        }
    });
})();