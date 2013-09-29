var line_chart;

function init_line_chart_var(line) {
    line_chart = line;
}


/* 
 * Update line chart according to bottom chart selections
 */
function updateLineContext(type, group, cat) {
    if (type !== line_chart.context.type) {
        $('input[name=type][value=' + TYPE[type] + ']')[0].checked = true;
        line_chart.context.type = type;
        //line_chart.reset_to_tol();
    }
    
    line_chart.context = updateCat(cat);

    line_chart.update();

    return line_chart.context;
}

function updateCat(cat) {
    var context = line_chart.context;

    if (0 === cat) {
        context.cat = [0];
        return context;
    }

    var catIdx = context.cat.indexOf(cat);
    if (-1 === catIdx) {
        context.cat.push(cat);
    } else {
        context.cat.splice(catIdx, 1);
    }
    return context;
}