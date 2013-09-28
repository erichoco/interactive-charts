var line_chart;

function init_line_chart_var(line) {
    line_chart = line;
}


/* 
 * Update line chart according to bottom chart selections
 */
function update_line_from_bottom(type, base, base_value) {
    if (type !== line_chart.chart_context['type']) {
        $('input[name=type][value=' + type + ']')[0].checked = true;
        line_chart.chart_context['type'] = type;
        line_chart.reset_to_tol();
    }

    line_chart.chart_context = update_base_value(base_value);
    console.log(line_chart.chart_context);
    line_chart.update();

    return line_chart.chart_context;
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