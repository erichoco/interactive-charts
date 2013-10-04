var line_chart;

function initLineChartVar(line) {
    line_chart = line;
}


/* 
 * Update line chart according to bottom chart selections
 */
function updateLineContext(type, cat) {

    var newContext = line_chart.context;

    if (type !== newContext.type) {
        $('input[name=type][value=' + type + ']')[0].checked = true;
        newContext.type = type;
        newContext.cat = [0];
    }
    
    newContext = updateCat(newContext, cat);

    //line_chart.changeContext(newContext);
    line_chart.update(null, newContext);
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