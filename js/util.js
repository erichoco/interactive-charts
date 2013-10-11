
jQuery.fn.d3Click = function () {
  this.each(function (i, e) {
    var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

    e.dispatchEvent(evt);
  });
};

/*
 * get_percentage(1, [1, 1, 1]) -> 33 (round_place becomes undefined)
 * get_percentage(1, [1, 2, 3], 2) -> 16.67
 */
function get_percentage(data, dataset, round_place) {

    var level = 1;
    for (var i = 0; i < round_place; i++) {
        level *= 10;
    };
    return Math.round(data * 100 * level / d3.sum(dataset)) / level;
}


/* 
 * Returns the percentage of this element's data among the same type
 */
function getBarPer(thisEl) {
    var thisData = d3.select(thisEl).data()[0];
    var parData = d3.select(thisEl.parentNode).data()[0];

    if (2 === parData.type) {
        return 100*thisData.val/d3.sum(parData.data,
            function(d) {
                return d.val;
            });
    } else {
        return 100*thisData.val/parData.total;
    }
}

function valToText(d) {
    // Add % for CTR
    if (d % 1 !== 0) {
        return d.toFixed(2);
    }
    else {
        return d;
    }
};

function createLegend(chart, base) {
    var legends = chart.select('.legend')
                .selectAll('g')
                    .data(BASE[base].cat.slice(1, BASE[base].cat.length))
                .enter().append('g')
                    .attr('transform', function(d, i) {
                        if (2 === base) {
                            return 'translate(' + ((i%10)*100 + 50) + ', ' +
                                ((Math.floor(i/10))*30 + 10) + ')';
                        }
                        return 'translate(' + (i * 150 + 50) + ', 10)';
                    });

    legends.append('circle')
        .attr('class', 'legend-icon')
        .attr('r', 6)
        .style('fill', function(d, i) {
            return BASE[base].color[i + 1];
        });

    legends.append('text')
        .attr('dx', '1em')
        .attr('dy', '.3em')
        .text(function(d) {
            return d;
        });
}

function formatDateObj(date, unit) {
    var year = date.getFullYear();
    var mon = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();

    if (hour < 10)
        hour = '0'+ hour.toString();

    if (unit === 'weekly' || unit === 'daily') {
        return year + '/' + mon + '/' + day;
    } else if (unit === 'monthly') {
        return year + '/' + mon;
    } else if (unit === 'hourly') {
        return mon + '/' + day + " " + hour;
    } else {
        console.error('Time unit error');
    }
}

function createTooltip(top, left, id, content, color) {
    $('<div id="' + id + '" class="tooltip">' + content + '</div>').css({
        'padding': '2px',
        'position': 'absolute',
        'display': 'none',
        'top': top - 25 + 'px',
        'left': left + 10 + 'px',
        'border': '1px solid #A9A9A9',
        'background-color': '#FFFFCC',
        'opacity': '0.8'
    }).appendTo('#line-chart').fadeIn(200);
}

function genJson(unit, base) {

    var thisBase = BASE[base];

    var dataset = new Array();
    var imp, click, ctr,
        total_imp, total_click, total_ctr;

    var range = Math.random()*100 + 3;
    for (var i = 0, month = 0; i < range; i++) {
        if ((i % 25) === 0) {
            month++;
        }

        total_imp = 0,
        total_click = 0;

        for (var j = 1; j < thisBase.cat.length; j++) {
            imp = Math.floor(Math.random()*2000 + 30);
            click = Math.floor(Math.random()*30);
            ctr = click / imp * 100;

            total_imp += imp;
            total_click += click;

            var data = {
                "time": new Date(2012, month - 1, (i % 25 + 1)),
                "data": [
                    { "type": 0, "val": imp },
                    { "type": 1, "val": click },
                    { "type": 2, "val": ctr },
                ],
                "cat": j
            }

            dataset.push(data);
        }

        total_ctr = total_click / total_imp * 100;
        var data = {
            "time": new Date(2012, month - 1, (i % 25 + 1)),
            "data": [
                { "type": 0, "val": total_imp },
                { "type": 1, "val": total_click },
                { "type": 2, "val": total_ctr },
            ],
            "cat": 0
        }

        dataset.push(data);
    }

    var json = {
        "unit": unit,
        "base": base,
        "dataset": dataset
    }

    return json;
}


function prepareData(dataset, base) {

    // Initially set up return object.
    var donutDataset = new Array();
    var data = new Array();
    var total = new Array();

    for (var i = 0; i < TYPE.length; i++) {
        data[i] = new Array();
        total[i] = 0;
    }

    // Extract total data.
    for (var i = 0; i < dataset.length; i++) {
        if (0 === dataset[i].cat) {
            for (var j = 0; j < dataset[i].data.length - 1; j++) {
                var curData = dataset[i].data[j];
                total[curData.type] += curData.val;
            }

            // Skip sum in the previous loop for CTR.
            // Recalculate here.
            total[2] = total[1] / total[0] * 100;
        }
    }

    // Extract other categories of data.
    // Start i at 1 in order to skip total data (whose cat = 0).
    for (var i = 1; i < BASE[base].cat.length; i++) {

        // Initial data and value sets for different types in same cat.
        var val = new Array();
        for (var j = 0; j < TYPE.length; j++) {
            val[j] = 0;
        }

        for (var j = 0; j < dataset.length; j++) {

            if (dataset[j].cat !== i) { continue; }

            // Sum value of the same type in same cat. (skip type = CTR)
            for (var k = 0; k < dataset[j].data.length - 1; k++) {
                var curData = dataset[j].data[k];
                // Handle CTR
                val[curData.type] += curData.val;
            }
        }

        val[2] = val[1] / val[0] * 100;

        for (var j = 0; j < TYPE.length; j++) {
            //data[j].push({});
            data[j].push({
                "cat": i,
                "val": val[j]
            });
        }
    }

    for (var i = 0; i < TYPE.length; i++) {
        donutDataset.push({
            "type": i,
            "data": data[i],
            "total": total[i]
        });
    }

    return donutDataset;
}

function prepareNestedData(dataset, base) {
    var resultDataset = new Array();
    var children1 = new Array();
    var children2 = new Array();
    var total = new Array();

    for (var i = 0; i < TYPE.length; i++) {
        children1[i] = new Array();
        children2[i] = new Array();
        total[i] = 0;
    }

    // Extract total data.
    for (var i = 0; i < dataset.length; i++) {
        if (0 === dataset[i].cat) {
            for (var j = 0; j < dataset[i].data.length - 1; j++) {
                var curData = dataset[i].data[j];
                total[curData.type] += curData.val;
            }
            // Skip sum in the previous loop for CTR.
            // Recalculate here.
            total[2] = total[1] / total[0] * 100;
        }
    }

    // Extract other categories of data.
    // Start i at 1 in order to skip total data (whose cat = 0).
    var gpCount = 0;
    for (var i = 1, catIdxOfGp = 1; i < BASE[base].cat.length; i++, catIdxOfGp++) {

        // Initial data and value sets for different types in same cat.
        var val = new Array();
        for (var j = 0; j < TYPE.length; j++) {
            val[j] = 0;
        }

        for (var j = 0; j < dataset.length; j++) {

            if (dataset[j].cat !== i) { continue; }

            // Sum value of the same type in same cat. (skip type = CTR)
            for (var k = 0; k < dataset[j].data.length - 1; k++) {
                var curData = dataset[j].data[k];
                // Handle CTR
                val[curData.type] += curData.val;
            }
        }

        val[2] = val[1] / val[0] * 100;

        for (var j = 0; j < TYPE.length; j++) {
            children2[j].push({
                "name": i,
                "val": val[j]
            });
        }


        if (catIdxOfGp === BASE[base].groupCount[gpCount]) {
            for (var j = 0; j < TYPE.length; j++) {
                children1[j].push({
                    "name": gpCount,
                    "children": children2[j]
                });
                children2[j] = new Array();
            }
            gpCount++;
            catIdxOfGp = 0;
        }
    }

    for (var i = 0; i < TYPE.length; i++) {
        resultDataset.push({
            "name": i,
            "children": children1[i],
            "total": total[i]
        });
    }

    return resultDataset;
}
