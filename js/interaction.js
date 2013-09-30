var line_chart;

function init_line_chart_var(line) {
    line_chart = line;
}


/* 
 * Update line chart according to bottom chart selections
 */
function updateLineContext(type, cat) {

    var newContext = line_chart.context;

    if (type !== newContext.type) {
        $('input[name=type][value=' + TYPE[type] + ']')[0].checked = true;
        newContext.type = type;
        newContext.cat = [0];
        //line_chart.reset_to_tol();
    }
    
    newContext = updateCat(newContext, cat);
    console.log('hey')
    line_chart.changeContext(newContext);

    //return line_chart.context;
}

function updateCat(newContext, cat) {

    if (0 === cat) {
        newContext.cat = [0];
        return newContext;
    }

    var catIdx = newContext.cat.indexOf(cat);
    if (-1 === catIdx) {
        newContext.cat.push(cat);
    } else {
        newContext.cat.splice(catIdx, 1);
    }
    return newContext;
}