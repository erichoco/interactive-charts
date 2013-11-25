(function() {
    $(function() {

        $('#refresh-btn').on('click', refresh_data);
        $('.type_radio').on('click', changeType);
        $('#bottom-slider li').css('width', $('#bottom-slider').width());

        var jsonSet = new Array();
        for (var i = 0; i < 3; i++) {
            jsonSet.push(genJson('daily', i));
        };

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


        var bottomCharts = [];

        var slider = new Slider($('#bottom-slider ul'), $('#slider-nav'));

        slider.nav.find('button').on('click', function() {
            sliderSlide($(this).data('dir'));
        }); /*function(){
            bottomCharts[slider.current].resetCharts(lineContext.type);

            slider.setCurrent($(this).data('dir'));
            slider.transition();

            var newContext = line_chart.context;
            newContext.base = slider.current;
            line_chart.update(jsonSet[slider.current].dataset, newContext);
        });*/

        document.onkeydown = function(evt) {
            e = evt || window.event;
            if (37 === e.keyCode) {
                sliderSlide('prev');
            }
            else if (39 === e.keyCode) {
                sliderSlide('next');
            }
        }


        var bars = new BarCharts();
        bars.create(prepareData(jsonSet[0].dataset, 0));
        bottomCharts.push(bars);

        var donuts = new DonutCharts();
        donuts.create(prepareData(jsonSet[1].dataset, 1));
        bottomCharts.push(donuts);

        var appPies = new AppPieCharts();
        appPies.create(prepareNestedData(jsonSet[2].dataset, 2));
        bottomCharts.push(appPies);


        function refresh_data() {
            jsonSet[slider.current] = genJson('daily', slider.current);
            var newDataset;
            if (2 === slider.current) {
                newDataset = prepareNestedData(jsonSet[slider.current].dataset, slider.current);
            } else {
                newDataset = prepareData(jsonSet[slider.current].dataset, slider.current);
            }

            lineContext.unit = jsonSet[slider.current].unit;
            line_chart.update(jsonSet[slider.current].dataset, lineContext);

            console.log(bottomCharts[slider.current]);
            bottomCharts[slider.current].update(newDataset);
        }

        function changeType() {
            var newContext = line_chart.context;
            var newType = $('input[name=type]:checked').val();
            if (newContext.type === parseInt(newType)) {
                return;
            } else {
                newContext.type = newType;
            }

            var curChart = bottomCharts[slider.current];
            curChart.changeType(newContext.type);
        }

        function sliderSlide(dir) {
            bottomCharts[slider.current].resetCharts(lineContext.type);

            slider.setCurrent(dir);
            slider.transition();

            var newContext = line_chart.context;
            newContext.base = slider.current;
            line_chart.update(jsonSet[slider.current].dataset, newContext);
        }
    });
})();