(function() {
    $(function() {
        var platform_name = ['Total', 'iOS', 'Android'];
        var ad_cat_name = ['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5', 'Category 6'];
        var data_type = ['Impressions', 'Clicks', 'CTR'];

        console.log(genJson('daily', 0));
        var json = genJson('daily', 0);

        var plat_test_data = gen_fake_data('daily', 'platform');
        var ad_test_data = gen_fake_data('daily', 'ad_cat');
        var app_test_data = gen_fake_data('daily', 'app_cat');

        // Default context
        var chart_context = {
            'unit': json.unit,
            'type': 0, // impression | click | ctr
            'group': json.group,   // platform | app | ad
            'cat': [0]     // must correspond to the order of dataset passed to LineChart obj
        }

        var line_chart;        // shared line chart
        line_chart = new LineChart();
        line_chart.create(json.dataset, chart_context);
        init_line_chart_var(line_chart);


        $('#bottom-slider li').css('width', $('#bottom-slider').width());
        var slider = new Slider($('#bottom-slider ul'), $('#slider-nav'));

        slider.nav.find('button').on('click', function(){
            slider.set_current($(this).data('dir'));
            slider.transition();

            // temp work around for kuad
            var base, data;
            switch(slider.current) {
                case 0: 
                    base = 'platform';
                    data = plat_test_data;
                    break;
                case 1:
                    base = 'ad_cat';
                    data = ad_test_data;
                    break;
                case 2:
                    base = 'app_cat';
                    data = app_test_data;
                    break;
            }
            line_chart.chart_data = data[1];
            line_chart.chart_context['base'] = base;
            console.log('base', base, data);
            line_chart.update();
        });


        var bar_charts = new BarCharts();
        bar_charts.create_label(platform_name);
        bar_charts.create(plat_test_data[1], line_chart.chart_context, platform_name, data_type);


        var ad_pie_charts = new AdPieCharts();
        ad_pie_charts.create(ad_test_data[1], line_chart.chart_context, ad_cat_name, 3);

        var app_pie_charts = new AppPieCharts();
        var app_data = appPieData();
        console.log(app_data);
        app_pie_charts.create(app_data);


        /*slider.set_current('next');
        slider.transition();*/

        $('#refresh-btn').on('click', refresh_data);
        $('.type_radio').on('click', change_line_type);

        function refresh_data() {
            plat_test_data = gen_fake_data('daily', 'platform');
            ad_test_data = gen_fake_data('daily', 'ad_cat');
            app_test_data = gen_fake_data('daily', 'app_cat');

            if (line_chart.chart_context['base'] === 'platform') {
                line_chart.chart_data = plat_test_data[1];
            }
            else if (line_chart.chart_context['base'] === 'ad_cat') {
                line_chart.chart_data = ad_test_data[1];
            }
            else {
                line_chart.chart_data = app_test_data[1];
            }

            line_chart.update();

            bar_charts.update(plat_test_data[1], line_chart.chart_context);
            ad_pie_charts.update(ad_test_data[1], line_chart.chart_context);
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