var TYPE = ['Impressions', 'Clicks', 'CTR'];

// Unit for CTR should be %. Disabled here and let valToText in util.js handle it.
var TYPE_UNIT = ['', '', ''];


var BASE = [ {
        'name': 'platform',
        'cat': ['Total', 'iOS', 'Android'],
        'color': ['#5E5E5E', '#5ab5df', '#A4D247'],
        'stylingClass': ['tol-bg', 'ios-bg', 'and-bg']
    }, {
        'name': 'ad', 
        'cat': [
            'Total',
            'Category 1',
            'Category 2',
            'Category 3',
            'Category 4',
            'Category 5',
            'Category 6'
        ],
        'color': ['#5E5E5E',] // Config rest of the colors in the DonutCharts.js
    }, {
        'name': 'app', 
        'cat': [
            'Total',
            'App 1',
            'App 2',
            'App 3',
            'App 4',
            'App 5',
            'App 6',
            'App 7',
            'App 8',
            'App 9',
            'App 10',
            'App 11',
            'App 12',
            'App 13',
            'App 14',
            'App 15',
            'App 16',
        ],
        'color': ['#5E5E5E',]
    },
];


var COLOR_SCHEME = {
    'platform': ['#5E5E5E', '#5ab5df', '#A4D247'],
    'ad_cat': ['#5E5E5E'],
    'app_cat': ['#5E5E5E']
};