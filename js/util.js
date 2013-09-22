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


        /*
        data.push({
            "data_time": new Date('2012/' + month + '/' + (i % 25 + 1)),
            "click": click,
            "impression": imp,
            "ctr": ctr,
            "platform": 1 // iOS
        });

        click = Math.floor(Math.random()*30);
        imp = Math.floor(Math.random()*2000 + 30);
        ctr = click / imp * 100;
        data.push({
            "data_time": new Date('' + month + '/' + (i % 25 + 1) + '/2012'),
            "click": click,
            "impression": imp,
            "ctr": ctr,
            "platform": 2 // android
        });

        click = ios_unit_data['click'] + and_unit_data['click'];
        imp = ios_unit_data['impression'] + and_unit_data['impression'];
        ctr = click / imp * 100;
        data.push({
            "data_time": new Date(2012, month - 1, (i % 25 + 1)),
            "click": click,
            "impression": imp,
            "ctr": ctr,
            "platform": 0 // total
        });

        /*data.push(ios_unit_data);
        data.push(and_unit_data);
        data.push(tol_unit_data);*/
    }


    json[1] = data;

    return json;
}


function prepare_data(raw_data, base) {

    var base_value = {
        'platform': 3,
        'ad_cat': 7,
        'app_cat': 12
    };

    var dataset = {
        'impression': new Array,
        'click': new Array,
        'ctr': new Array
    };

    for (var i = 0; i < base_value[base]; i++) {
        for (k in dataset) {
            dataset[k].push(0);
        }
    }

    for (var i = 0; i < raw_data.length; i++) {
        var cur_data = raw_data[i];
/*
        if ('platform' in cur_data) {
            dataset['impression'][cur_data['platform']] += cur_data['impression'];
            dataset['click'][cur_data['platform']] += cur_data['click'];
        }
        else {
            alert("DEBUG: 'platform' key not found");
        }
        */

        dataset['impression'][cur_data[base]] += cur_data['impression'];
        dataset['click'][cur_data[base]] += cur_data['click'];
    }

    for (var i = 0; i < dataset['ctr'].length; i++) {
        dataset['ctr'][i] = dataset['click'][i] / dataset['impression'][i] * 100;
    }

    console.log('prepared data', dataset);
    return dataset;//[dataset['impression'], dataset['click'], dataset['ctr']];
}

