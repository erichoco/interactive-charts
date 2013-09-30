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

function type_value_text(d) {
    // Add % for CTR
    if (d % 1 !== 0) {
        return d.toFixed(2) + '%';
    }
    else {
        return d;
    }
};

function valToText(d) {
    // Add % for CTR
    if (d % 1 !== 0) {
        return d.toFixed(2) + '%';
    }
    else {
        return d;
    }
};

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

function gen_fake_data(time_u, data_base) {

    var json = [];

    var time_unit = ['hourly', 'daily', 'weekly', 'monthly'];
    json[0] = time_unit[1];
    //json[0] = time_unit[Math.floor(Math.random()*4)];

    var base_value = {
        'platform': 3,
        'ad_cat': 7,
        'app_cat': 12
    };

    var data = new Array();
    var data_range = Math.random()*100 + 3;
    for (var i = 0, month = 0; i < data_range; i++) {
        if ((i % 25) === 0) {
            month++;
        }
        var total_imp = 0,
            total_click = 0;

        for (var j = 1; j < base_value[data_base]; j++) {
            click = Math.floor(Math.random()*30);
            imp = Math.floor(Math.random()*2000 + 30);
            ctr = click / imp * 100;

            total_imp += imp;
            total_click += click;

            var datum = {
                "data_time": new Date('' + month + '/' + (i % 25 + 1) + '/2012'),
                "click": click,
                "impression": imp,
                "ctr": ctr,
            }
            datum[data_base] = j;
            data.push(datum);
        }

        ctr = total_click / total_imp * 100;
        datum = {
            "data_time": new Date(2012, month - 1, (i % 25 + 1)),
            "click": total_click,
            "impression": total_imp,
            "ctr": ctr,
        }
        datum[data_base] = 0;
        data.push(datum);

    }


    json[1] = data;

    return json;
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


function appPieData() {
    return [
    {
        "name": "Impressions",
        "children": [
        {
            "name": "google",
            "children": [
                { "name": "drive", "val": 1000 },
                { "name": "play", "val": 1000 },
                { "name": "gmail", "val": 1000 },
                { "name": "youtube", "val": 1000 },
                { "name": "android", "val": 1000 },
                { "name": "search", "val": 1000 }
            ]
        },
        {
            "name": "apple",
            "children": [
                { "name": "iphone", "val": 1000 },
                { "name": "mac", "val": 1000 }
            ]
        },
        {
            "name": "MS",
            "children": [
                { "name": "hotmail", "val": 1000 },
                { "name": "hotmail", "val": 1000 },
                { "name": "hotmail", "val": 1000 },
                { "name": "Windows", "val": 1000 }
            ]
        },
        {
            "name": "Facebook",
            "children": [
                { "name": "timeline", "val": 1000 },
                { "name": "timeline", "val": 1000 },
                { "name": "messanger", "val": 1000 }
            ]
        }
        ]
    },
    {
        "name": "Clicks",
        "children": [
        {
            "name": "google",
            "children": [
                { "name": "drive", "val": 1000 },
                { "name": "play", "val": 1000 },
                { "name": "gmail", "val": 1000 },
                { "name": "youtube", "val": 1000 },
                { "name": "android", "val": 1000 },
                { "name": "search", "val": 1000 }
            ]
        },
        {
            "name": "apple",
            "children": [
                { "name": "iphone", "val": 1000 },
                { "name": "mac", "val": 1000 }
            ]
        },
        {
            "name": "MS",
            "children": [
                { "name": "hotmail", "val": 1000 },
                { "name": "hotmail", "val": 1000 },
                { "name": "hotmail", "val": 1000 },
                { "name": "Windows", "val": 1000 }
            ]
        },
        {
            "name": "Facebook",
            "children": [
                { "name": "timeline", "val": 1000 },
                { "name": "timeline", "val": 1000 },
                { "name": "messanger", "val": 1000 }
            ]
        }
        ]
    }, 
    {
        "name": "CTR",
        "children": [
        {
            "name": "google",
            "children": [
                { "name": "drive", "val": 1000 },
                { "name": "play", "val": 1000 },
                { "name": "gmail", "val": 1000 },
                { "name": "youtube", "val": 1000 },
                { "name": "android", "val": 1000 },
                { "name": "search", "val": 1000 }
            ]
        },
        {
            "name": "apple",
            "children": [
                { "name": "iphone", "val": 1000 },
                { "name": "mac", "val": 1000 }
            ]
        },
        {
            "name": "MS",
            "children": [
                { "name": "hotmail", "val": 1000 },
                { "name": "hotmail", "val": 1000 },
                { "name": "hotmail", "val": 1000 },
                { "name": "Windows", "val": 1000 },
                { "name": "hotmail", "val": 1000 },
                { "name": "hotmail", "val": 1000 },
                { "name": "hotmail", "val": 1000 }
            ]
        },
        {
            "name": "Facebook",
            "children": [
                { "name": "timeline", "val": 1000 },
                { "name": "timeline", "val": 1000 },
                { "name": "messanger", "val": 1000 }
            ]
        }
        ]
    } 
    ];
}

