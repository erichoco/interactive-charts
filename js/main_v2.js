(function() {
    var line_chart;        // shared line chart
    $(function() {

        var platform_name = ['Total', 'iOS', 'Android'];
        var ad_cat_name = ['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5', 'Category 6'];
        var data_type = ['Impressions', 'Clicks', 'CTR'];

        var testing_data = gen_fake_data('daily', 'platform');

        // Default context
        var chart_context = {
            unit: testing_data[0],
            type: 'impression', // impression | click | ctr
            base: 'platform',   // platform | app | ad
            base_value: [0]     // must correspond to the order of dataset passed to LineChart obj
        }


        line_chart = new LineChart();
        line_chart.create(testing_data[1], chart_context);
        init_line_chart_var(line_chart);


        $('#bottom-slider li').css('width', $('#bottom-slider').width());
        var slider = new Slider($('#bottom-slider ul'), $('#slider-nav'));

        slider.nav.find('button').on('click', function(){
            slider.set_current($(this).data('dir'));
            slider.transition();
        });


        var bar_charts = new BarCharts();
        bar_charts.create_label(platform_name);
        bar_charts.create(testing_data[1], line_chart.chart_context, platform_name, data_type);


        var ad_pie_charts = new AdPieCharts();
        ad_pie_charts.create(gen_fake_data('daily', 'ad_cat')[1], line_chart.chart_context, ad_cat_name, 3);


        slider.set_current('next');
        slider.transition();

        $('#refresh-btn').on('click', refresh_data);
        $('.type_radio').on('click', change_line_type);

        function refresh_data() {
            var new_test_data = gen_fake_data('daily', 'platform');
            line_chart.chart_data = new_test_data[1];
            line_chart.update();

            bar_charts.update(new_test_data[1], line_chart.chart_context);

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