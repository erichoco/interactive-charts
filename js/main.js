(function() {
    $(function() {
        /*var platform_name = ['Total', 'iOS', 'Android'];
        var ad_cat_name = ['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5', 'Category 6'];
        var data_type = ['Impressions', 'Clicks', 'CTR'];*/

        var jsonSet = new Array();
        for (var i = 0; i < 3; i++) {
            jsonSet.push(genJson('daily', i));
        };

        /*var plat_test_data = gen_fake_data('daily', 'platform');
        var ad_test_data = gen_fake_data('daily', 'ad_cat');
        var app_test_data = gen_fake_data('daily', 'app_cat');*/

        // Default context
        var lineContext = {
            'unit': jsonSet[0].unit,
            'type': 0, // impression | click | ctr
            'base': jsonSet[0].base,   // platform | app | ad
            'cat': [0]     // must correspond to the order of dataset passed to LineChart obj
        }

        var line_chart;        // shared line chart
        line_chart = new LineChart();
        line_chart.create(jsonSet[0].dataset, lineContext);
        initLineChartVar(line_chart);


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

            var newContext = line_chart.context;
            newContext.base = slider.current;
            line_chart.update(jsonSet[slider.current].dataset, newContext);
        });

        var bars = new BarCharts();
        bars.create(prepareData(jsonSet[0].dataset, 0));


        var donuts = new DonutCharts();
        donuts.create(prepareData(jsonSet[1].dataset, 1));


        var appPies = new AppPieCharts();
        //var appData = appPieData();
        appPies.create(prepareNestedData(jsonSet[2].dataset, 2));

        console.log(prepareNestedData(jsonSet[2].dataset, 2));


        $('#refresh-btn').on('click', refresh_data);
        $('.type_radio').on('click', changeType);

        function refresh_data() {
            jsonSet[slider.current] = genJson('daily', slider.current);
            lineContext.unit = jsonSet[slider.current].unit;

            line_chart.update(jsonSet[slider.current].dataset, lineContext);
/*
            bar_charts.update(plat_test_data[1], line_chart.lineContext);
            ad_pie_charts.update(ad_test_data[1], line_chart.lineContext);*/
        }

        function changeType() {
            var newContext = line_chart.context;
            newContext.type = $('input[name=type]:checked').val();

            var curChart;
            switch(slider.current) {
                case 0: 
                    curChart = bars;
                    break;
                case 1:
                    curChart = donuts;
                    break;
                case 2:
                    break;
            }
            console.log(curChart);
            curChart.changeType(newContext.type, newContext.cat);
/*
            var type_bars = $('.sub-chart div[name*="' + type_val + '"]');
            var clickedCat = line_chart.context.cat;

            for (var i = 0; i < base_values.length; i++) {
                type_bars[base_values[i]].click();
            }*/
        }
    });
})();