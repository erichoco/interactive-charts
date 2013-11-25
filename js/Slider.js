function Slider(container, nav) {
    this.container = container;
    this.nav = nav;

    this.charts = this.container.find('.bottom-charts');

    // Since the li wrapping chart div have some padding,
    // we set chart_w equal to the width of li
    this.chart_w = $(this.charts).first()
                        .parent().outerWidth();
    this.chart_len = this.charts.length;

    this.current = 0;
}

Slider.prototype.transition = function(coords) {
    this.container.animate({
        'margin-left': coords || -(this.current * this.chart_w)
    });
};

Slider.prototype.setCurrent = function(dir) {
    var pos = this.current;
    pos += (~~(dir === 'next') || -1);

    this.current = (pos < 0)? this.chart_len - 1 : pos % this.chart_len;
};