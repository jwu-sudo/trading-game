

var params = {date:"", window:10, exhibit:1000},
    account = {Time:0, target:0, total:0, vwap:0, mvwap:0, numOrder:0},
    info = {},
    gameState = {state: 0}; // 0:init, 1:running, 2:error
var stockName = "",
    dateList = [],
    dataList = [],
    chartName = ["open", "high", "close", "low", "volume", "ma5", "ma10", "ma20", "v_ma5", "v_ma10", "v_ma20", "date"],
    tradeName = ['totalvolume', 'totalamount', 'lastprice', 'tradingdate', 'tradingtime', 'selllevelno', 'buylevelno'],
    quotePrice = ["buyprice10", "buyprice09", "buyprice08", "buyprice07", "buyprice06", "buyprice05", "buyprice04", "buyprice03", "buyprice02", "buyprice01", "sellprice01", "sellprice02", "sellprice03", "sellprice04", "sellprice05", "sellprice06", "sellprice07", "sellprice08", "sellprice09", "sellprice10"],
    quoteVolume = ["buyvolume10", "buyvolume09", "buyvolume08", "buyvolume07", "buyvolume06", "buyvolume05", "buyvolume04", "buyvolume03", "buyvolume02", "buyvolume01", "sellvolume01", "sellvolume02", "sellvolume03", "sellvolume04", "sellvolume05", "sellvolume06", "sellvolume07", "sellvolume08", "sellvolume09", "sellvolume10"];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


window.onload = function () {
    homeState()
    var filesList = document.getElementById("files-list");
    filesList.onchange = function (event) {
        var info = "",
            files = event.target.files,
            reader = new FileReader();
        reader.readAsText(files[0], 'gb2312');

        reader.onload = function () {
            var html = reader.result;
            dataList = textToJson(html);
            selectDate();
            // staticPlot(dataList.slice(0,1000));
            // document.write(JSON.stringify(dataList["20201110"], null, "\t"));
        };
    }
    // 将读取的数据转化为data
    function textToJson(data) {

        splitdate = data.split(/\n+/) ;

        var name =splitdate[0].split(",");
        // document.write(JSON.stringify(name, null, "\t"));
        var dataList = [],
            curList = [],
            curdate = "";
        for (var i=1;i<splitdate.length;i++){
            var val =splitdate[i].split(",");
            // document.write(JSON.stringify(val, null, "\t"));
            var json = {};
            for (var j in quotePrice){
                var idx_ = name.indexOf(quotePrice[j]);
                json[name[idx_]] = val[idx_]
            }
            for (var j in quoteVolume){
                var idx_ = name.indexOf(quoteVolume[j]);
                json[name[idx_]] = val[idx_]
            }
            for (var j in tradeName){
                var idx_ = name.indexOf(tradeName[j]);
                json[name[idx_]] = val[idx_]
            }
            if (JSON.stringify(json) === '{}'){
                continue;
            }
            json['mid'] = (parseFloat(json['buyprice01']) + parseFloat(json['sellprice01'])) /2;
            if (json['mid'] == 0){
                continue;
            }
            if (stockName == ""){
                stockName = val[0];
            }
            if (curdate==""){
                curdate = json["tradingdate"];
                dateList.push(curdate);
                curList.push(json);
            }
            else{
                if (curdate == json["tradingdate"]){
                    curList.push(json);
                }
                else{
                    dataList[curdate] = curList;
                    curList = [];
                    curList.push(json);
                    curdate = json["tradingdate"];
                    dateList.push(curdate);
                }
            }
        }
        dataList[curdate] = curList;
        return dataList;
    }

};

function ready(){
    gameState.state = 1;
}

async function startGame(){
    document.getElementById("count").innerText = "Start Trading Stock "+stockName;
    var curdata = dataList[params.date];
    for (var step=2; step<curdata.length; step+=1){
        if (gameState.state==0){
            return;
        }
        info = curdata[step];
        quoteShow(info);
        if (step >= params.exhibit){
            staticPlot(curdata.slice(step - params.exhibit, step));
            await sleep(100);
        }
        else if (step>100){
            staticPlot(curdata.slice(0, step));
            await sleep(200-0.1*step);
        }
        else{
            staticPlot(curdata.slice(0, step));
            await sleep(200);
        }

        var process = document.getElementById("process_table"),
            table = '',
            time = info["tradingtime"].split(' ')[1],
            price = info["mid"],
            mvwap = info["totalamount"]/info["totalvolume"];
        table = '<tr><td width="25%">CurTime</td><td>'+time+'</td><td width="25%">Price</td><td>'+parseFloat(price).toFixed(2)+'</td><td width="25%">Order</td><td>'+String(0)+'</td></tr><tr><td width="25%">Targets</td><td>'+String(account.target)+'</td><td width="25%">MVWAP</td><td>'+parseFloat(mvwap).toFixed(2)+'</td><td width="25%">Deal</td><td >'+String(0)+'</td></tr>';
        process.innerHTML = table;
    }
}

function quoteShow(json){
    var quote = document.getElementById("quote_table")
    var table = '';
    for (var i=19;i>=10;i--){
        table += '<tr><td>卖'+String(i-9)+'</td><td>';
        table += json[quotePrice[i]];
        table += '</td><td>';
        table += json[quoteVolume[i]];
        table += '</td></tr>';
    }
    for (var i=9;i>=0;i--){
        table += '<tr><td>买'+String(10-i)+'</td><td>';
        table += json[quotePrice[i]];
        table += '</td><td>';
        table += json[quoteVolume[i]];
        table += '</td></tr>';
    }
    quote.innerHTML = table;
}

function staticPlot(jsonData){
    var FT = jsonData,
        Price = new Array(),
        Volume = new Array(),
        Time = new Array();
    for (var i = 0; i < FT.length; i+=1) {
        Time.push(FT[i].tradingtime.split(' ')[1]);
        Price.push(parseFloat(FT[i].mid));

        var A3 = 0;
        if (i==0){
            A3 = parseFloat(FT[1].totalvolume) - parseFloat(FT[0].totalvolume)
        }
        else{
            A3 = parseFloat(FT[i].totalvolume) - parseFloat(FT[i-1].totalvolume);
        }
        Volume.push(A3);
    }
    var oMyChart = echarts.init(document.getElementById("chart1"));
    var option = {
        xAxis:
            {
                axisLabel:{
                    rotate: 30,
                    interval:parseInt(Time.length/15)
                },
                axisLine:{
                    lineStyle :{
                        color: '#CECECE'
                    }
                },
                type : 'category',
                boundaryGap : false,
                data:Time
            },
        yAxis :
            {
                min: parseFloat(Math.min(...Price)).toFixed(2),
                max: parseFloat(Math.max(...Price)).toFixed(2),
                interval: parseFloat(parseFloat((Math.max(...Price) - Math.min(...Price))/7).toFixed(2)),
                type : 'value',
                axisLine:{
                    lineStyle :{
                        color: '#CECECE'
                    }
                }
            },
        series:
            {
                name:'close',
                type:'line',
                symbol:'none',
                smooth: 0.2,
                color:['#66AEDE'],
                data:Price
            }
    };
    oMyChart.setOption(option);
    var oMyChart = echarts.init(document.getElementById("chart2"));
    var option = {
        xAxis: {
            data: Time,
            silent: false,
            splitLine: {
                show: false
            },
            splitArea: {
                show: false
            },
            axisLabel: {
                rotate: 30,
                interval: parseInt(Time.length / 15)
            },
            axisLine:{
                lineStyle :{
                    color: '#CECECE'
                }
            }
        },
        yAxis: {
            splitArea: {
                show: false
            },
            axisLine:{
                lineStyle :{
                    color: '#CECECE'
                }
            }
        },
        series: {
            type: 'bar',
            itemStyle: {
                normal: {
                    color: function(params){
                        var colorList = ["rgb(253,16,80)"];
                        for (var i=1; i<Price.length; i++){
                            if (Price[i]>Price[i-1]){
                                colorList.push("rgb(253,16,80)");
                            }
                            else{
                                colorList.push("rgb(13,244,155)");
                            }
                        }
                        return colorList[params.dataIndex];
                    }
                },
            },
            data: Volume,
            // Set `large` for large data amount
            large: true
        }
    };
    oMyChart.setOption(option);
}

function homeState(){
    var data_json = '[{"open": 24.6, "high": 24.78, "close": 23.96, "low": 23.82, "volume": 82175.82, "price_change": -0.76, "p_change": -3.07, "ma5": 24.208, "ma10": 23.237, "ma20": 23.213, "v_ma5": 120159.21, "v_ma10": 84689.28, "v_ma20": 69688.92, "date": "2018-01-09"}, {"open": 24.12, "high": 24.95, "close": 24.71, "low": 24.01, "volume": 109535.76, "price_change": 0.2, "p_change": 0.82, "ma5": 23.9, "ma10": 22.992, "ma20": 23.153, "v_ma5": 112259.6, "v_ma10": 85078.67, "v_ma20": 67644.48, "date": "2018-01-08"}, {"open": 24.0, "high": 25.4, "close": 24.51, "low": 23.7, "volume": 204266.23, "price_change": -0.56, "p_change": -2.23, "ma5": 23.42, "ma10": 22.82, "ma20": 23.048, "v_ma5": 97543.6, "v_ma10": 76964.5, "v_ma20": 64853.8, "date": "2018-01-05"}, {"open": 22.79, "high": 25.07, "close": 25.07, "low": 22.51, "volume": 130131.15, "price_change": 2.28, "p_change": 10.0, "ma5": 22.966, "ma10": 22.69, "ma20": 22.935, "v_ma5": 67939.35, "v_ma10": 59938.43, "v_ma20": 57071.47, "date": "2018-01-04"}, {"open": 22.42, "high": 22.83, "close": 22.79, "low": 22.18, "volume": 74687.1, "price_change": 0.38, "p_change": 1.7, "ma5": 22.378, "ma10": 22.516, "ma20": 22.785, "v_ma5": 51770.82, "v_ma10": 51262.21, "v_ma20": 53198.15, "date": "2018-01-03"}, {"open": 22.3, "high": 22.54, "close": 22.42, "low": 22.05, "volume": 42677.76, "price_change": 0.12, "p_change": 0.54, "ma5": 22.266, "ma10": 22.583, "ma20": 22.73, "v_ma5": 49219.34, "v_ma10": 48100.37, "v_ma20": 53397.23, "date": "2018-01-02"}, {"open": 22.34, "high": 22.46, "close": 22.31, "low": 22.02, "volume": 35955.75, "price_change": 0.08, "p_change": 0.36, "ma5": 22.084, "ma10": 22.654, "ma20": 22.755, "v_ma5": 57897.75, "v_ma10": 46793.59, "v_ma20": 55537.48, "date": "2017-12-29"}, {"open": 22.23, "high": 22.84, "close": 22.24, "low": 22.12, "volume": 56245.01, "price_change": 0.11, "p_change": 0.5, "ma5": 22.22, "ma10": 22.723, "ma20": 22.849, "v_ma5": 56385.4, "v_ma10": 47542.23, "v_ma20": 55915.74, "date": "2017-12-28"}, {"open": 22.25, "high": 22.57, "close": 22.13, "low": 21.8, "volume": 49288.5, "price_change": -0.11, "p_change": -0.49, "ma5": 22.414, "ma10": 22.846, "ma20": 22.949, "v_ma5": 51937.5, "v_ma10": 46423.84, "v_ma20": 55602.16, "date": "2017-12-27"}, {"open": 21.73, "high": 22.66, "close": 22.23, "low": 21.73, "volume": 61929.7, "price_change": 0.72, "p_change": 3.35, "ma5": 22.654, "ma10": 23.014, "ma20": 23.057, "v_ma5": 50753.59, "v_ma10": 48360.9, "v_ma20": 55920.67, "date": "2017-12-26"}, {"open": 22.81, "high": 22.93, "close": 21.51, "low": 21.11, "volume": 86069.77, "price_change": -1.47, "p_change": -6.4, "ma5": 22.9, "ma10": 23.189, "ma20": 23.181, "v_ma5": 46981.39, "v_ma10": 54688.57, "v_ma20": 55274.61, "date": "2017-12-25"}, {"open": 23.21, "high": 23.39, "close": 22.99, "low": 22.9, "volume": 28394.0, "price_change": -0.21, "p_change": -0.91, "ma5": 23.224, "ma10": 23.313, "ma20": 23.316, "v_ma5": 35689.43, "v_ma10": 50210.29, "v_ma20": 53887.77, "date": "2017-12-22"}, {"open": 23.39, "high": 23.5, "close": 23.21, "low": 22.86, "volume": 34005.55, "price_change": -0.11, "p_change": -0.47, "ma5": 23.226, "ma10": 23.275, "ma20": 23.389, "v_ma5": 38699.06, "v_ma10": 52743.1, "v_ma20": 55126.09, "date": "2017-12-21"}, {"open": 23.61, "high": 23.96, "close": 23.33, "low": 23.2, "volume": 43368.92, "price_change": -0.14, "p_change": -0.6, "ma5": 23.278, "ma10": 23.18, "ma20": 23.43, "v_ma5": 40910.18, "v_ma10": 54204.51, "v_ma20": 57245.14, "date": "2017-12-20"}, {"open": 23.23, "high": 23.66, "close": 23.46, "low": 23.23, "volume": 43068.7, "price_change": 0.31, "p_change": 1.34, "ma5": 23.374, "ma10": 23.053, "ma20": 23.526, "v_ma5": 45968.22, "v_ma10": 55134.09, "v_ma20": 58490.17, "date": "2017-12-19"}, {"open": 23.0, "high": 23.49, "close": 23.13, "low": 22.83, "volume": 29610.0, "price_change": 0.12, "p_change": 0.52, "ma5": 23.478, "ma10": 22.877, "ma20": 23.617, "v_ma5": 62395.75, "v_ma10": 58694.09, "v_ma20": 60331.46, "date": "2017-12-18"}, {"open": 23.4, "high": 23.4, "close": 23.0, "low": 22.85, "volume": 43442.15, "price_change": -0.46, "p_change": -1.96, "ma5": 23.402, "ma10": 22.856, "ma20": 23.715, "v_ma5": 64731.15, "v_ma10": 64281.37, "v_ma20": 65134.62, "date": "2017-12-15"}, {"open": 23.65, "high": 23.77, "close": 23.47, "low": 23.22, "volume": 45061.12, "price_change": -0.33, "p_change": -1.39, "ma5": 23.324, "ma10": 22.974, "ma20": 23.869, "v_ma5": 66787.14, "v_ma10": 64289.26, "v_ma20": 71322.17, "date": "2017-12-14"}, {"open": 23.99, "high": 24.38, "close": 23.81, "low": 23.6, "volume": 68659.12, "price_change": -0.15, "p_change": -0.63, "ma5": 23.082, "ma10": 23.052, "ma20": 24.104, "v_ma5": 67498.84, "v_ma10": 64780.47, "v_ma20": 73475.4, "date": "2017-12-13"}, {"open": 22.61, "high": 24.14, "close": 23.98, "low": 22.61, "volume": 125206.36, "price_change": 1.21, "p_change": 5.31, "ma5": 22.732, "ma10": 23.1, "ma20": 24.337, "v_ma5": 64299.97, "v_ma10": 63480.44, "v_ma20": 76113.42, "date": "2017-12-12"}, {"open": 22.61, "high": 22.94, "close": 22.75, "low": 22.5, "volume": 41287.0, "price_change": 0.14, "p_change": 0.62, "ma5": 22.276, "ma10": 23.172, "ma20": 24.605, "v_ma5": 54992.43, "v_ma10": 55860.66, "v_ma20": 82041.76, "date": "2017-12-11"}, {"open": 22.4, "high": 22.9, "close": 22.61, "low": 22.04, "volume": 53722.08, "price_change": 0.35, "p_change": 1.57, "ma5": 22.31, "ma10": 23.318, "ma20": 24.88, "v_ma5": 63831.59, "v_ma10": 57565.25, "v_ma20": 87775.07, "date": "2017-12-08"}, {"open": 21.98, "high": 22.48, "close": 22.26, "low": 21.92, "volume": 48619.64, "price_change": 0.22, "p_change": 1.0, "ma5": 22.624, "ma10": 23.502, "ma20": 25.154, "v_ma5": 61791.38, "v_ma10": 57509.09, "v_ma20": 91369.88, "date": "2017-12-07"}, {"open": 21.66, "high": 22.1, "close": 22.06, "low": 21.51, "volume": 52664.77, "price_change": 0.36, "p_change": 1.66, "ma5": 23.022, "ma10": 23.679, "ma20": 25.459, "v_ma5": 62062.1, "v_ma10": 60285.78, "v_ma20": 98491.69, "date": "2017-12-06"}, {"open": 22.91, "high": 23.26, "close": 21.7, "low": 21.65, "volume": 78668.67, "price_change": -1.22, "p_change": -5.32, "ma5": 23.468, "ma10": 23.999, "ma20": 25.808, "v_ma5": 62660.91, "v_ma10": 61846.25, "v_ma20": 104051.13, "date": "2017-12-05"}, {"open": 23.91, "high": 24.15, "close": 22.92, "low": 22.85, "volume": 85482.8, "price_change": -1.27, "p_change": -5.25, "ma5": 24.068, "ma10": 24.357, "ma20": 26.172, "v_ma5": 56728.88, "v_ma10": 61968.83, "v_ma20": 108773.06, "date": "2017-12-04"}, {"open": 24.04, "high": 24.49, "close": 24.18, "low": 24.04, "volume": 43521.0, "price_change": -0.04, "p_change": -0.17, "ma5": 24.326, "ma10": 24.574, "ma20": 26.435, "v_ma5": 51298.9, "v_ma10": 65987.87, "v_ma20": 112043.75, "date": "2017-12-01"}, {"open": 24.37, "high": 24.76, "close": 24.25, "low": 24.05, "volume": 49973.27, "price_change": -0.05, "p_change": -0.21, "ma5": 24.38, "ma10": 24.764, "ma20": 26.634, "v_ma5": 53226.8, "v_ma10": 78355.09, "v_ma20": 123826.01, "date": "2017-11-30"}, {"open": 24.66, "high": 24.8, "close": 24.29, "low": 23.96, "volume": 55658.83, "price_change": -0.4, "p_change": -1.62, "ma5": 24.336, "ma10": 25.156, "ma20": 26.944, "v_ma5": 58509.45, "v_ma10": 82170.33, "v_ma20": 136951.4, "date": "2017-11-29"}, {"open": 24.01, "high": 24.9, "close": 24.7, "low": 24.0, "volume": 49008.5, "price_change": 0.5, "p_change": 2.07, "ma5": 24.53, "ma10": 25.573, "ma20": 27.421, "v_ma5": 61031.58, "v_ma10": 88746.39, "v_ma20": 145784.73, "date": "2017-11-28"}, {"open": 24.4, "high": 24.95, "close": 24.21, "low": 24.01, "volume": 58332.89, "price_change": -0.23, "p_change": -0.94, "ma5": 24.646, "ma10": 26.037, "ma20": 27.908, "v_ma5": 67208.79, "v_ma10": 108222.87, "v_ma20": 161417.35, "date": "2017-11-27"}, {"open": 24.1, "high": 24.7, "close": 24.45, "low": 24.09, "volume": 53160.52, "price_change": 0.43, "p_change": 1.79, "ma5": 24.822, "ma10": 26.441, "ma20": 28.3, "v_ma5": 80676.85, "v_ma10": 117984.89, "v_ma20": 175389.32, "date": "2017-11-24"}, {"open": 25.3, "high": 25.43, "close": 24.03, "low": 23.98, "volume": 76386.5, "price_change": -1.24, "p_change": -4.91, "ma5": 25.148, "ma10": 26.805, "ma20": 28.733, "v_ma5": 103483.37, "v_ma10": 125230.68, "v_ma20": 189422.51, "date": "2017-11-23"}, {"open": 25.21, "high": 25.9, "close": 25.26, "low": 24.84, "volume": 68269.5, "price_change": -0.03, "p_change": -0.12, "ma5": 25.976, "ma10": 27.239, "ma20": 29.152, "v_ma5": 105831.21, "v_ma10": 136697.6, "v_ma20": 210698.95, "date": "2017-11-22"}, {"open": 24.6, "high": 25.98, "close": 25.28, "low": 24.56, "volume": 79894.52, "price_change": 0.17, "p_change": 0.68, "ma5": 26.616, "ma10": 27.617, "ma20": 29.376, "v_ma5": 116461.2, "v_ma10": 146256.01, "v_ma20": 223732.84, "date": "2017-11-21"}, {"open": 25.55, "high": 25.58, "close": 25.09, "low": 23.46, "volume": 125673.2, "price_change": -0.98, "p_change": -3.76, "ma5": 27.428, "ma10": 27.987, "ma20": 29.514, "v_ma5": 149236.94, "v_ma10": 155577.28, "v_ma20": 235402.64, "date": "2017-11-20"}, {"open": 28.0, "high": 28.15, "close": 26.08, "low": 25.91, "volume": 167193.12, "price_change": -2.09, "p_change": -7.42, "ma5": 28.06, "ma10": 28.296, "ma20": 29.749, "v_ma5": 155292.94, "v_ma10": 158099.63, "v_ma20": 252443.7, "date": "2017-11-17"}, {"open": 28.1, "high": 28.72, "close": 28.17, "low": 28.0, "volume": 88125.71, "price_change": -0.3, "p_change": -1.05, "ma5": 28.462, "ma10": 28.503, "ma20": 29.862, "v_ma5": 146977.99, "v_ma10": 169296.94, "v_ma20": 264662.55, "date": "2017-11-16"}, {"open": 29.3, "high": 29.3, "close": 28.46, "low": 28.3, "volume": 121419.46, "price_change": -0.86, "p_change": -2.93, "ma5": 28.502, "ma10": 28.731, "ma20": 29.811, "v_ma5": 167563.98, "v_ma10": 191732.48, "v_ma20": 269280.79, "date": "2017-11-15"}, {"open": 28.0, "high": 29.89, "close": 29.34, "low": 27.68, "volume": 243773.23, "price_change": 1.1, "p_change": 3.9, "ma5": 28.618, "ma10": 29.268, "ma20": 29.673, "v_ma5": 176050.82, "v_ma10": 202823.06, "v_ma20": 268677.48, "date": "2017-11-14"}, {"open": 28.61, "high": 29.23, "close": 28.25, "low": 28.09, "volume": 155953.17, "price_change": 0.16, "p_change": 0.57, "ma5": 28.546, "ma10": 29.778, "ma20": 29.477, "v_ma5": 161917.62, "v_ma10": 214611.83, "v_ma20": 259871.29, "date": "2017-11-13"}, {"open": 28.78, "high": 28.99, "close": 28.09, "low": 27.88, "volume": 125618.36, "price_change": -0.28, "p_change": -0.99, "ma5": 28.532, "ma10": 30.159, "ma20": 29.324, "v_ma5": 160906.32, "v_ma10": 232793.74, "v_ma20": 257734.07, "date": "2017-11-10"}, {"open": 28.88, "high": 29.09, "close": 28.37, "low": 27.76, "volume": 191055.7, "price_change": -0.67, "p_change": -2.31, "ma5": 28.544, "ma10": 30.661, "ma20": 29.237, "v_ma5": 191615.9, "v_ma10": 253614.34, "v_ma20": 254168.58, "date": "2017-11-09"}, {"open": 28.8, "high": 29.7, "close": 29.04, "low": 28.11, "volume": 163853.66, "price_change": 0.06, "p_change": 0.21, "ma5": 28.96, "ma10": 31.065, "ma20": 29.132, "v_ma5": 215900.97, "v_ma10": 284700.31, "v_ma20": 248910.25, "date": "2017-11-08"}, {"open": 28.6, "high": 29.37, "close": 28.98, "low": 28.42, "volume": 173107.2, "price_change": 0.8, "p_change": 2.84, "ma5": 29.918, "ma10": 31.134, "ma20": 28.995, "v_ma5": 229595.3, "v_ma10": 301209.67, "v_ma20": 247155.94, "date": "2017-11-07"}, {"open": 28.67, "high": 28.74, "close": 28.18, "low": 27.76, "volume": 150896.66, "price_change": 0.03, "p_change": 0.11, "ma5": 31.01, "ma10": 31.041, "ma20": 28.902, "v_ma5": 267306.04, "v_ma10": 315227.99, "v_ma20": 242961.71, "date": "2017-11-06"}, {"open": 28.86, "high": 29.62, "close": 28.15, "low": 28.03, "volume": 279166.28, "price_change": -2.3, "p_change": -7.55, "ma5": 31.786, "ma10": 31.202, "ma20": 28.861, "v_ma5": 304681.17, "v_ma10": 346787.77, "v_ma20": 243949.88, "date": "2017-11-03"}, {"open": 31.8, "high": 31.8, "close": 30.45, "low": 30.45, "volume": 312481.06, "price_change": -3.38, "p_change": -9.99, "ma5": 32.778, "ma10": 31.22, "ma20": 28.843, "v_ma5": 315612.77, "v_ma10": 360028.16, "v_ma20": 237874.8, "date": "2017-11-02"}, {"open": 33.85, "high": 34.34, "close": 33.83, "low": 33.1, "volume": 232325.3, "price_change": -0.61, "p_change": -1.77, "ma5": 33.17, "ma10": 30.891, "ma20": 28.684, "v_ma5": 353499.64, "v_ma10": 346829.1, "v_ma20": 233701.92, "date": "2017-11-01"}, {"open": 32.62, "high": 35.22, "close": 34.44, "low": 32.2, "volume": 361660.88, "price_change": 2.38, "p_change": 7.42, "ma5": 32.35, "ma10": 30.077, "ma20": 28.406, "v_ma5": 372824.04, "v_ma10": 334531.9, "v_ma20": 241075.48, "date": "2017-10-31"}, {"open": 32.56, "high": 34.4, "close": 32.06, "low": 31.85, "volume": 337772.31, "price_change": -1.05, "p_change": -3.17, "ma5": 31.072, "ma10": 29.176, "ma20": 28.01, "v_ma5": 363149.95, "v_ma10": 305130.76, "v_ma20": 231267.29, "date": "2017-10-30"}, {"open": 31.45, "high": 33.2, "close": 33.11, "low": 31.45, "volume": 333824.31, "price_change": 0.7, "p_change": 2.16, "ma5": 30.618, "ma10": 28.489, "ma20": 27.652, "v_ma5": 388894.38, "v_ma10": 282674.4, "v_ma20": 221367.64, "date": "2017-10-27"}, {"open": 29.3, "high": 32.7, "close": 32.41, "low": 28.92, "volume": 501915.41, "price_change": 2.68, "p_change": 9.01, "ma5": 29.662, "ma10": 27.813, "ma20": 27.306, "v_ma5": 404443.54, "v_ma10": 254722.83, "v_ma20": 215395.01, "date": "2017-10-26"}, {"open": 27.86, "high": 30.45, "close": 29.73, "low": 27.54, "volume": 328947.31, "price_change": 1.68, "p_change": 5.99, "ma5": 28.612, "ma10": 27.198, "ma20": 27.072, "v_ma5": 340158.56, "v_ma10": 213120.2, "v_ma20": 208416.55, "date": "2017-10-25"}, {"open": 28.2, "high": 28.75, "close": 28.05, "low": 27.22, "volume": 313290.41, "price_change": -1.74, "p_change": -5.84, "ma5": 27.804, "ma10": 26.856, "ma20": 26.88, "v_ma5": 296239.76, "v_ma10": 193102.21, "v_ma20": 197044.24, "date": "2017-10-24"}, {"open": 29.0, "high": 31.16, "close": 29.79, "low": 28.9, "volume": 466494.47, "price_change": 1.46, "p_change": 5.15, "ma5": 27.28, "ma10": 26.763, "ma20": 26.764, "v_ma5": 247111.56, "v_ma10": 170695.43, "v_ma20": 186873.57, "date": "2017-10-23"}, {"open": 29.2, "high": 29.83, "close": 28.33, "low": 27.85, "volume": 411570.12, "price_change": 1.17, "p_change": 4.31, "ma5": 26.36, "ma10": 26.519, "ma20": 26.572, "v_ma5": 176454.41, "v_ma10": 141111.99, "v_ma20": 171445.99, "date": "2017-10-20"}, {"open": 25.61, "high": 27.2, "close": 27.16, "low": 25.61, "volume": 180490.47, "price_change": 1.47, "p_change": 5.72, "ma5": 25.964, "ma10": 26.465, "ma20": 26.5, "v_ma5": 105002.11, "v_ma10": 115721.45, "v_ma20": 159293.58, "date": "2017-10-19"}, {"open": 25.63, "high": 26.41, "close": 25.69, "low": 25.5, "volume": 109353.35, "price_change": 0.26, "p_change": 1.02, "ma5": 25.784, "ma10": 26.477, "ma20": 26.479, "v_ma5": 86081.84, "v_ma10": 120574.74, "v_ma20": 156028.36, "date": "2017-10-18"}, {"open": 25.3, "high": 25.88, "close": 25.43, "low": 25.23, "volume": 67649.41, "price_change": 0.24, "p_change": 0.95, "ma5": 25.908, "ma10": 26.734, "ma20": 26.542, "v_ma5": 89964.65, "v_ma10": 147619.06, "v_ma20": 159389.25, "date": "2017-10-17"}, {"open": 26.4, "high": 26.48, "close": 25.19, "low": 25.03, "volume": 113208.69, "price_change": -1.16, "p_change": -4.4, "ma5": 26.246, "ma10": 26.843, "ma20": 26.643, "v_ma5": 94279.29, "v_ma10": 157403.83, "v_ma20": 171053.0, "date": "2017-10-16"}, {"open": 26.26, "high": 26.54, "close": 26.35, "low": 26.14, "volume": 54308.65, "price_change": 0.09, "p_change": 0.34, "ma5": 26.678, "ma10": 26.815, "ma20": 26.738, "v_ma5": 105769.58, "v_ma10": 160060.88, "v_ma20": 178294.92, "date": "2017-10-13"}, {"open": 26.28, "high": 26.51, "close": 26.26, "low": 25.92, "volume": 85889.09, "price_change": -0.05, "p_change": -0.19, "ma5": 26.966, "ma10": 26.798, "ma20": 26.767, "v_ma5": 126440.79, "v_ma10": 176067.19, "v_ma20": 192651.51, "date": "2017-10-12"}, {"open": 27.26, "high": 27.37, "close": 26.31, "low": 26.02, "volume": 128767.41, "price_change": -0.81, "p_change": -2.99, "ma5": 27.17, "ma10": 26.945, "ma20": 26.733, "v_ma5": 155067.65, "v_ma10": 203712.91, "v_ma20": 202840.46, "date": "2017-10-11"}, {"open": 27.12, "high": 27.49, "close": 27.12, "low": 26.75, "volume": 89222.62, "price_change": -0.23, "p_change": -0.84, "ma5": 27.56, "ma10": 26.903, "ma20": 26.643, "v_ma5": 205273.46, "v_ma10": 200986.28, "v_ma20": 204488.73, "date": "2017-10-10"}, {"open": 27.8, "high": 28.22, "close": 27.35, "low": 27.0, "volume": 170660.12, "price_change": -0.44, "p_change": -1.58, "ma5": 27.44, "ma10": 26.765, "ma20": 26.484, "v_ma5": 220528.36, "v_ma10": 203051.72, "v_ma20": 206976.96, "date": "2017-10-09"}, {"open": 27.49, "high": 27.88, "close": 27.79, "low": 27.04, "volume": 157664.69, "price_change": 0.51, "p_change": 1.87, "ma5": 26.952, "ma10": 26.625, "ma20": 26.305, "v_ma5": 214352.17, "v_ma10": 201779.99, "v_ma20": 210644.2, "date": "2017-09-29"}, {"open": 27.58, "high": 28.1, "close": 27.28, "low": 27.11, "volume": 229023.39, "price_change": -0.98, "p_change": -3.47, "ma5": 26.63, "ma10": 26.535, "ma20": 26.167, "v_ma5": 225693.6, "v_ma10": 202865.7, "v_ma20": 211476.52, "date": "2017-09-28"}, {"open": 26.52, "high": 29.01, "close": 28.26, "low": 26.52, "volume": 379796.5, "price_change": 1.74, "p_change": 6.56, "ma5": 26.72, "ma10": 26.48, "ma20": 26.084, "v_ma5": 252358.18, "v_ma10": 191481.98, "v_ma20": 212995.67, "date": "2017-09-27"}, {"open": 24.87, "high": 26.66, "close": 26.52, "low": 24.85, "volume": 165497.09, "price_change": 1.61, "p_change": 6.46, "ma5": 26.246, "ma10": 26.349, "ma20": 25.879, "v_ma5": 196699.1, "v_ma10": 171159.43, "v_ma20": 203831.34, "date": "2017-09-26"}, {"open": 25.78, "high": 26.16, "close": 24.91, "low": 24.67, "volume": 139779.2, "price_change": -1.27, "p_change": -4.85, "ma5": 26.09, "ma10": 26.443, "ma20": 25.706, "v_ma5": 185575.07, "v_ma10": 184702.18, "v_ma20": 200104.09, "date": "2017-09-25"}, {"open": 27.0, "high": 27.18, "close": 26.18, "low": 25.87, "volume": 214371.81, "price_change": -1.55, "p_change": -5.59, "ma5": 26.298, "ma10": 26.661, "ma20": 25.635, "v_ma5": 189207.81, "v_ma10": 196528.96, "v_ma20": 199072.47, "date": "2017-09-22"}, {"open": 26.03, "high": 28.48, "close": 27.73, "low": 25.7, "volume": 362346.28, "price_change": 1.84, "p_change": 7.11, "ma5": 26.44, "ma10": 26.736, "ma20": 25.495, "v_ma5": 180037.81, "v_ma10": 209235.84, "v_ma20": 194833.73, "date": "2017-09-21"}, {"open": 25.66, "high": 26.08, "close": 25.89, "low": 25.35, "volume": 101501.12, "price_change": 0.15, "p_change": 0.58, "ma5": 26.24, "ma10": 26.52, "ma20": 25.239, "v_ma5": 130605.78, "v_ma10": 201968.02, "v_ma20": 183411.57, "date": "2017-09-20"}, {"open": 25.95, "high": 26.52, "close": 25.74, "low": 25.53, "volume": 109876.95, "price_change": -0.21, "p_change": -0.81, "ma5": 26.452, "ma10": 26.382, "ma20": 25.098, "v_ma5": 145619.77, "v_ma10": 207991.18, "v_ma20": 191562.46, "date": "2017-09-19"}, {"open": 26.66, "high": 26.66, "close": 25.95, "low": 25.53, "volume": 157942.91, "price_change": -0.94, "p_change": -3.5, "ma5": 26.796, "ma10": 26.203, "ma20": 25.029, "v_ma5": 183829.29, "v_ma10": 210902.21, "v_ma20": 209190.26, "date": "2017-09-18"}, {"open": 26.58, "high": 27.76, "close": 26.89, "low": 26.33, "volume": 168521.77, "price_change": 0.16, "p_change": 0.6, "ma5": 27.024, "ma10": 25.984, "ma20": 24.867, "v_ma5": 203850.1, "v_ma10": 219508.4, "v_ma20": 205704.82, "date": "2017-09-15"}, {"open": 26.7, "high": 27.1, "close": 26.73, "low": 26.42, "volume": 115186.16, "price_change": -0.22, "p_change": -0.82, "ma5": 27.032, "ma10": 25.799, "ma20": 24.642, "v_ma5": 238433.87, "v_ma10": 220087.33, "v_ma20": 204899.57, "date": "2017-09-14"}, {"open": 27.2, "high": 27.85, "close": 26.95, "low": 26.66, "volume": 176571.05, "price_change": -0.51, "p_change": -1.86, "ma5": 26.8, "ma10": 25.688, "ma20": 24.4, "v_ma5": 273330.25, "v_ma10": 234509.37, "v_ma20": 202029.43, "date": "2017-09-13"}, {"open": 27.18, "high": 28.55, "close": 27.46, "low": 26.31, "volume": 300924.56, "price_change": 0.37, "p_change": 1.37, "ma5": 26.312, "ma10": 25.408, "ma20": 24.147, "v_ma5": 270362.6, "v_ma10": 236503.24, "v_ma20": 196693.28, "date": "2017-09-12"}, {"open": 26.9, "high": 27.55, "close": 27.09, "low": 26.56, "volume": 258046.98, "price_change": 0.16, "p_change": 0.59, "ma5": 25.61, "ma10": 24.968, "ma20": 23.846, "v_ma5": 237975.12, "v_ma10": 215506.0, "v_ma20": 183694.65, "date": "2017-09-11"}, {"open": 25.5, "high": 27.47, "close": 26.93, "low": 25.32, "volume": 341440.59, "price_change": 1.36, "p_change": 5.32, "ma5": 24.944, "ma10": 24.609, "ma20": 23.566, "v_ma5": 235166.7, "v_ma10": 201615.98, "v_ma20": 172957.06, "date": "2017-09-08"}, {"open": 24.41, "high": 26.9, "close": 25.57, "low": 24.2, "volume": 289668.06, "price_change": 1.06, "p_change": 4.33, "ma5": 24.566, "ma10": 24.253, "ma20": 23.281, "v_ma5": 201740.8, "v_ma10": 180431.62, "v_ma20": 160218.55, "date": "2017-09-07"}, {"open": 23.51, "high": 24.88, "close": 24.51, "low": 23.38, "volume": 161732.8, "price_change": 0.56, "p_change": 2.34, "ma5": 24.576, "ma10": 23.958, "ma20": 23.105, "v_ma5": 195688.49, "v_ma10": 164855.13, "v_ma20": 150908.43, "date": "2017-09-06"}, {"open": 23.76, "high": 24.32, "close": 23.95, "low": 23.31, "volume": 138987.19, "price_change": 0.19, "p_change": 0.8, "ma5": 24.504, "ma10": 23.814, "ma20": 22.95, "v_ma5": 202643.87, "v_ma10": 175133.74, "v_ma20": 145571.54, "date": "2017-09-05"}, {"open": 24.45, "high": 24.45, "close": 23.76, "low": 23.3, "volume": 244004.84, "price_change": -1.28, "p_change": -5.11, "ma5": 24.326, "ma10": 23.854, "ma20": 22.835, "v_ma5": 193036.87, "v_ma10": 207478.31, "v_ma20": 141090.53, "date": "2017-09-04"}, {"open": 25.33, "high": 25.5, "close": 25.04, "low": 24.78, "volume": 174311.09, "price_change": -0.58, "p_change": -2.26, "ma5": 24.274, "ma10": 23.749, "ma20": 22.732, "v_ma5": 168065.26, "v_ma10": 191901.23, "v_ma20": 130989.34, "date": "2017-09-01"}, {"open": 24.16, "high": 25.88, "close": 25.62, "low": 23.78, "volume": 259406.52, "price_change": 1.47, "p_change": 6.09, "ma5": 23.94, "ma10": 23.485, "ma20": 22.554, "v_ma5": 159122.44, "v_ma10": 189711.82, "v_ma20": 126717.47, "date": "2017-08-31"}, {"open": 23.25, "high": 24.6, "close": 24.15, "low": 23.21, "volume": 196509.73, "price_change": 1.09, "p_change": 4.73, "ma5": 23.34, "ma10": 23.111, "ma20": 22.387, "v_ma5": 134021.77, "v_ma10": 169549.5, "v_ma20": 116718.92, "date": "2017-08-30"}, {"open": 23.45, "high": 23.85, "close": 23.06, "low": 23.04, "volume": 90952.18, "price_change": -0.44, "p_change": -1.87, "ma5": 23.124, "ma10": 22.885, "ma20": 22.274, "v_ma5": 147623.61, "v_ma10": 156883.33, "v_ma20": 110864.84, "date": "2017-08-29"}, {"open": 23.45, "high": 23.7, "close": 23.5, "low": 23.05, "volume": 119146.78, "price_change": 0.13, "p_change": 0.56, "ma5": 23.382, "ma10": 22.723, "ma20": 22.24, "v_ma5": 221919.75, "v_ma10": 151883.31, "v_ma20": 112052.01, "date": "2017-08-28"}, {"open": 22.5, "high": 23.6, "close": 23.37, "low": 22.5, "volume": 129597.0, "price_change": 0.75, "p_change": 3.32, "ma5": 23.224, "ma10": 22.523, "ma20": 22.205, "v_ma5": 215737.21, "v_ma10": 144298.14, "v_ma20": 113275.25, "date": "2017-08-25"}, {"open": 22.87, "high": 23.25, "close": 22.62, "low": 22.47, "volume": 133903.14, "price_change": -0.45, "p_change": -1.95, "ma5": 23.03, "ma10": 22.309, "ma20": 22.187, "v_ma5": 220301.19, "v_ma10": 140005.48, "v_ma20": 111800.14, "date": "2017-08-24"}, {"open": 23.9, "high": 24.06, "close": 23.07, "low": 22.85, "volume": 264518.94, "price_change": -1.28, "p_change": -5.26, "ma5": 22.882, "ma10": 22.252, "ma20": 22.194, "v_ma5": 205077.23, "v_ma10": 136961.73, "v_ma20": 110195.54, "date": "2017-08-23"}, {"open": 22.55, "high": 24.98, "close": 24.35, "low": 22.38, "volume": 462432.88, "price_change": 1.64, "p_change": 7.22, "ma5": 22.646, "ma10": 22.085, "ma20": 22.21, "v_ma5": 166143.05, "v_ma10": 116009.34, "v_ma20": 102483.41, "date": "2017-08-22"}, {"open": 22.6, "high": 22.88, "close": 22.71, "low": 22.14, "volume": 88234.07, "price_change": 0.31, "p_change": 1.38, "ma5": 22.064, "ma10": 21.816, "ma20": 22.178, "v_ma5": 81846.87, "v_ma10": 74702.76, "v_ma20": 87736.24, "date": "2017-08-21"}, {"open": 21.75, "high": 22.98, "close": 22.4, "low": 21.51, "volume": 152416.92, "price_change": 0.52, "p_change": 2.38, "ma5": 21.822, "ma10": 21.714, "ma20": 22.194, "v_ma5": 72859.08, "v_ma10": 70077.44, "v_ma20": 88489.06, "date": "2017-08-18"}, {"open": 21.8, "high": 22.05, "close": 21.88, "low": 21.65, "volume": 57783.36, "price_change": -0.01, "p_change": -0.05, "ma5": 21.588, "ma10": 21.623, "ma20": 22.234, "v_ma5": 59709.77, "v_ma10": 63723.13, "v_ma20": 88923.75, "date": "2017-08-17"}, {"open": 21.37, "high": 22.07, "close": 21.89, "low": 21.35, "volume": 69848.0, "price_change": 0.45, "p_change": 2.1, "ma5": 21.622, "ma10": 21.663, "ma20": 22.273, "v_ma5": 68846.23, "v_ma10": 63888.34, "v_ma20": 91485.69, "date": "2017-08-16"}, {"open": 21.52, "high": 21.68, "close": 21.44, "low": 21.34, "volume": 40952.0, "price_change": -0.06, "p_change": -0.28, "ma5": 21.524, "ma10": 21.663, "ma20": 22.309, "v_ma5": 65875.63, "v_ma10": 64846.36, "v_ma20": 95231.54, "date": "2017-08-15"}, {"open": 21.1, "high": 21.56, "close": 21.5, "low": 20.93, "volume": 43295.1, "price_change": 0.27, "p_change": 1.27, "ma5": 21.568, "ma10": 21.757, "ma20": 22.3, "v_ma5": 67558.65, "v_ma10": 72220.71, "v_ma20": 97943.72, "date": "2017-08-14"}, {"open": 21.85, "high": 22.09, "close": 21.23, "low": 21.1, "volume": 86670.4, "price_change": -0.82, "p_change": -3.72, "ma5": 21.606, "ma10": 21.886, "ma20": 22.274, "v_ma5": 67295.81, "v_ma10": 82252.36, "v_ma20": 104702.04, "date": "2017-08-11"}, {"open": 21.45, "high": 22.2, "close": 22.05, "low": 21.36, "volume": 103465.63, "price_change": 0.65, "p_change": 3.04, "ma5": 21.658, "ma10": 22.064, "ma20": 22.356, "v_ma5": 67736.48, "v_ma10": 83594.81, "v_ma20": 108566.23, "date": "2017-08-10"}, {"open": 21.62, "high": 21.62, "close": 21.4, "low": 21.23, "volume": 54995.01, "price_change": -0.26, "p_change": -1.2, "ma5": 21.704, "ma10": 22.135, "ma20": 22.427, "v_ma5": 58930.45, "v_ma10": 83429.34, "v_ma20": 112174.04, "date": "2017-08-09"}, {"open": 21.62, "high": 21.8, "close": 21.66, "low": 21.49, "volume": 49367.1, "price_change": -0.03, "p_change": -0.14, "ma5": 21.802, "ma10": 22.335, "ma20": 22.547, "v_ma5": 63817.09, "v_ma10": 88957.49, "v_ma20": 122551.57, "date": "2017-08-08"}, {"open": 21.6, "high": 21.97, "close": 21.69, "low": 21.49, "volume": 41980.9, "price_change": 0.2, "p_change": 0.93, "ma5": 21.946, "ma10": 22.539, "ma20": 22.576, "v_ma5": 76882.78, "v_ma10": 100769.73, "v_ma20": 132964.43, "date": "2017-08-07"}, {"open": 22.1, "high": 22.27, "close": 21.49, "low": 21.44, "volume": 88873.78, "price_change": -0.79, "p_change": -3.55, "ma5": 22.166, "ma10": 22.673, "ma20": 22.648, "v_ma5": 97208.92, "v_ma10": 106900.69, "v_ma20": 146038.32, "date": "2017-08-04"}, {"open": 22.18, "high": 22.46, "close": 22.28, "low": 21.99, "volume": 59435.48, "price_change": 0.39, "p_change": 1.78, "ma5": 22.47, "ma10": 22.844, "ma20": 22.639, "v_ma5": 99453.13, "v_ma10": 114124.37, "v_ma20": 147146.25, "date": "2017-08-03"}, {"open": 22.13, "high": 22.49, "close": 21.89, "low": 21.86, "volume": 79428.17, "price_change": -0.49, "p_change": -2.19, "ma5": 22.566, "ma10": 22.883, "ma20": 22.574, "v_ma5": 107928.23, "v_ma10": 119083.05, "v_ma20": 148827.89, "date": "2017-08-02"}, {"open": 22.65, "high": 23.18, "close": 22.38, "low": 22.3, "volume": 114695.56, "price_change": -0.41, "p_change": -1.8, "ma5": 22.868, "ma10": 22.955, "ma20": 22.53, "v_ma5": 114097.89, "v_ma10": 125616.72, "v_ma20": 151033.85, "date": "2017-08-01"}, {"open": 22.78, "high": 22.9, "close": 22.79, "low": 21.84, "volume": 143611.59, "price_change": -0.22, "p_change": -0.96, "ma5": 23.132, "ma10": 22.843, "ma20": 22.45, "v_ma5": 124656.68, "v_ma10": 123666.72, "v_ma20": 154316.35, "date": "2017-07-31"}, {"open": 22.6, "high": 23.36, "close": 23.01, "low": 22.5, "volume": 100094.83, "price_change": 0.25, "p_change": 1.1, "ma5": 23.18, "ma10": 22.661, "ma20": 22.409, "v_ma5": 116592.45, "v_ma10": 127151.72, "v_ma20": 155849.67, "date": "2017-07-28"}, {"open": 23.39, "high": 23.39, "close": 22.76, "low": 22.63, "volume": 101811.01, "price_change": -0.64, "p_change": -2.73, "ma5": 23.218, "ma10": 22.647, "ma20": 22.337, "v_ma5": 128795.61, "v_ma10": 133537.65, "v_ma20": 158236.21, "date": "2017-07-27"}, {"open": 23.53, "high": 23.92, "close": 23.4, "low": 22.85, "volume": 110276.48, "price_change": -0.3, "p_change": -1.27, "ma5": 23.2, "ma10": 22.718, "ma20": 22.286, "v_ma5": 130237.86, "v_ma10": 140918.73, "v_ma20": 160464.67, "date": "2017-07-26"}, {"open": 23.07, "high": 24.2, "close": 23.7, "low": 22.64, "volume": 167489.48, "price_change": 0.67, "p_change": 2.91, "ma5": 23.042, "ma10": 22.759, "ma20": 22.199, "v_ma5": 137135.54, "v_ma10": 156145.65, "v_ma20": 166607.7, "date": "2017-07-25"}, {"open": 22.8, "high": 23.79, "close": 23.03, "low": 22.63, "volume": 103290.47, "price_change": -0.17, "p_change": -0.73, "ma5": 22.554, "ma10": 22.612, "ma20": 22.124, "v_ma5": 122676.77, "v_ma10": 165159.14, "v_ma20": 172661.06, "date": "2017-07-24"}, {"open": 22.75, "high": 23.98, "close": 23.2, "low": 22.75, "volume": 161110.59, "price_change": 0.53, "p_change": 2.34, "ma5": 22.142, "ma10": 22.622, "ma20": 22.136, "v_ma5": 137710.98, "v_ma10": 185175.95, "v_ma20": 181610.12, "date": "2017-07-21"}, {"open": 22.52, "high": 23.1, "close": 22.67, "low": 22.36, "volume": 109022.27, "price_change": 0.06, "p_change": 0.27, "ma5": 22.076, "ma10": 22.433, "ma20": 22.143, "v_ma5": 138279.69, "v_ma10": 180168.13, "v_ma20": 195468.18, "date": "2017-07-20"}, {"open": 21.14, "high": 22.86, "close": 22.61, "low": 20.86, "volume": 144764.88, "price_change": 1.35, "p_change": 6.35, "ma5": 22.236, "ma10": 22.264, "ma20": 22.306, "v_ma5": 151599.61, "v_ma10": 178572.74, "v_ma20": 211100.74, "date": "2017-07-19"}, {"open": 20.63, "high": 21.58, "close": 21.26, "low": 20.63, "volume": 95195.62, "price_change": 0.29, "p_change": 1.38, "ma5": 22.476, "ma10": 22.104, "ma20": 22.354, "v_ma5": 175155.77, "v_ma10": 176450.98, "v_ma20": 214117.38, "date": "2017-07-18"}, {"open": 22.64, "high": 22.66, "close": 20.97, "low": 20.58, "volume": 178461.53, "price_change": -1.9, "p_change": -8.31, "ma5": 22.67, "ma10": 22.056, "ma20": 22.495, "v_ma5": 207641.51, "v_ma10": 184965.98, "v_ma20": 228057.86, "date": "2017-07-17"}, {"open": 23.28, "high": 24.29, "close": 22.87, "low": 22.8, "volume": 163954.17, "price_change": -0.6, "p_change": -2.56, "ma5": 23.102, "ma10": 22.157, "ma20": 22.571, "v_ma5": 232640.92, "v_ma10": 184547.63, "v_ma20": 230585.56, "date": "2017-07-14"}, {"open": 23.6, "high": 23.6, "close": 23.47, "low": 22.81, "volume": 175621.84, "price_change": -0.34, "p_change": -1.43, "ma5": 22.79, "ma10": 22.026, "ma20": 22.468, "v_ma5": 222056.57, "v_ma10": 182934.76, "v_ma20": 228670.24, "date": "2017-07-13"}, {"open": 22.26, "high": 23.95, "close": 23.81, "low": 22.26, "volume": 262545.69, "price_change": 1.58, "p_change": 7.11, "ma5": 22.292, "ma10": 21.853, "ma20": 22.305, "v_ma5": 205545.87, "v_ma10": 180010.6, "v_ma20": 224798.65, "date": "2017-07-12"}, {"open": 22.99, "high": 24.0, "close": 22.23, "low": 21.85, "volume": 257624.34, "price_change": -0.9, "p_change": -3.89, "ma5": 21.732, "ma10": 21.639, "ma20": 22.079, "v_ma5": 177746.19, "v_ma10": 177069.74, "v_ma20": 215196.38, "date": "2017-07-11"}, {"open": 21.11, "high": 23.44, "close": 23.13, "low": 21.06, "volume": 303458.56, "price_change": 1.82, "p_change": 8.54, "ma5": 21.442, "ma10": 21.636, "ma20": 21.924, "v_ma5": 162290.45, "v_ma10": 180162.98, "v_ma20": 205572.5, "date": "2017-07-10"}, {"open": 20.8, "high": 21.44, "close": 21.31, "low": 20.65, "volume": 111032.43, "price_change": 0.33, "p_change": 1.57, "ma5": 21.212, "ma10": 21.649, "ma20": 21.674, "v_ma5": 136454.34, "v_ma10": 178044.29, "v_ma20": 192451.24, "date": "2017-07-07"}, {"open": 20.86, "high": 21.19, "close": 20.98, "low": 20.69, "volume": 93068.35, "price_change": -0.03, "p_change": -0.14, "ma5": 21.262, "ma10": 21.852, "ma20": 21.562, "v_ma5": 143812.95, "v_ma10": 210768.22, "v_ma20": 189283.48, "date": "2017-07-06"}, {"open": 20.59, "high": 21.14, "close": 21.01, "low": 20.51, "volume": 123547.26, "price_change": 0.23, "p_change": 1.11, "ma5": 21.414, "ma10": 22.347, "ma20": 21.463, "v_ma5": 154475.33, "v_ma10": 243628.74, "v_ma20": 186661.35, "date": "2017-07-05"}, {"open": 21.97, "high": 21.99, "close": 20.78, "low": 20.75, "volume": 180345.66, "price_change": -1.2, "p_change": -5.46, "ma5": 21.546, "ma10": 22.603, "ma20": 21.378, "v_ma5": 176393.3, "v_ma10": 251783.78, "v_ma20": 183077.72, "date": "2017-07-04"}, {"open": 21.59, "high": 22.14, "close": 21.98, "low": 21.37, "volume": 174278.0, "price_change": 0.42, "p_change": 1.95, "ma5": 21.83, "ma10": 22.933, "ma20": 21.266, "v_ma5": 198035.52, "v_ma10": 271149.75, "v_ma20": 175424.65, "date": "2017-07-03"}, {"open": 21.6, "high": 21.74, "close": 21.56, "low": 21.13, "volume": 147825.48, "price_change": -0.18, "p_change": -0.83, "ma5": 22.086, "ma10": 22.985, "ma20": 21.102, "v_ma5": 219634.25, "v_ma10": 276623.48, "v_ma20": 169829.99, "date": "2017-06-30"}, {"open": 21.78, "high": 21.94, "close": 21.74, "low": 21.47, "volume": 146380.23, "price_change": 0.07, "p_change": 0.32, "ma5": 22.442, "ma10": 22.909, "ma20": 20.933, "v_ma5": 277723.49, "v_ma10": 274405.71, "v_ma20": 163967.44, "date": "2017-06-29"}, {"open": 22.2, "high": 22.37, "close": 21.67, "low": 21.41, "volume": 233137.12, "price_change": -0.53, "p_change": -2.39, "ma5": 23.28, "ma10": 22.756, "ma20": 20.743, "v_ma5": 332782.16, "v_ma10": 269586.69, "v_ma20": 158480.44, "date": "2017-06-28"}, {"open": 23.1, "high": 23.24, "close": 22.2, "low": 22.06, "volume": 288556.75, "price_change": -1.06, "p_change": -4.56, "ma5": 23.66, "ma10": 22.519, "ma20": 20.555, "v_ma5": 327174.26, "v_ma10": 253323.02, "v_ma20": 148477.09, "date": "2017-06-27"}, {"open": 23.3, "high": 23.87, "close": 23.26, "low": 22.57, "volume": 282271.66, "price_change": -0.08, "p_change": -0.34, "ma5": 24.036, "ma10": 22.211, "ma20": 20.333, "v_ma5": 344263.97, "v_ma10": 230982.02, "v_ma20": 136002.95, "date": "2017-06-26"}, {"open": 24.0, "high": 24.47, "close": 23.34, "low": 23.34, "volume": 438271.69, "price_change": -2.59, "p_change": -9.99, "ma5": 23.884, "ma10": 21.699, "ma20": 20.02, "v_ma5": 333612.72, "v_ma10": 206858.19, "v_ma20": 123274.25, "date": "2017-06-23"}, {"open": 23.32, "high": 25.93, "close": 25.93, "low": 23.26, "volume": 421673.59, "price_change": 2.36, "p_change": 10.01, "ma5": 23.376, "ma10": 21.272, "ma20": 19.694, "v_ma5": 271087.94, "v_ma10": 167798.74, "v_ma20": 103052.22, "date": "2017-06-22"}, {"open": 23.0, "high": 23.84, "close": 23.57, "low": 22.9, "volume": 205097.59, "price_change": -0.51, "p_change": -2.12, "ma5": 22.232, "ma10": 20.579, "ma20": 19.268, "v_ma5": 206391.22, "v_ma10": 129693.95, "v_ma20": 82884.05, "date": "2017-06-21"}, {"open": 23.75, "high": 24.45, "close": 24.08, "low": 22.22, "volume": 374005.34, "price_change": 1.58, "p_change": 7.02, "ma5": 21.378, "ma10": 20.152, "ma20": 18.976, "v_ma5": 179471.78, "v_ma10": 114371.67, "v_ma20": 73335.91, "date": "2017-06-20"}, {"open": 21.0, "high": 22.85, "close": 22.5, "low": 20.94, "volume": 229015.38, "price_change": 1.7, "p_change": 8.17, "ma5": 20.386, "ma10": 19.599, "ma20": 18.665, "v_ma5": 117700.07, "v_ma10": 79699.55, "v_ma20": 55293.91, "date": "2017-06-19"}, {"open": 20.41, "high": 21.78, "close": 20.8, "low": 20.41, "volume": 125647.79, "price_change": 0.59, "p_change": 2.92, "ma5": 19.514, "ma10": 19.218, "ma20": 18.43, "v_ma5": 80103.66, "v_ma10": 63036.5, "v_ma20": 44539.8, "date": "2017-06-16"}, {"open": 19.33, "high": 20.35, "close": 20.21, "low": 19.33, "volume": 98190.0, "price_change": 0.91, "p_change": 4.71, "ma5": 19.168, "ma10": 18.956, "ma20": 18.286, "v_ma5": 64509.53, "v_ma10": 53529.16, "v_ma20": 39407.28, "date": "2017-06-15"}, {"open": 19.31, "high": 19.91, "close": 19.3, "low": 19.11, "volume": 70500.37, "price_change": 0.18, "p_change": 0.94, "ma5": 18.926, "ma10": 18.729, "ma20": 18.161, "v_ma5": 52996.68, "v_ma10": 47374.18, "v_ma20": 35624.83, "date": "2017-06-14"}, {"open": 18.25, "high": 19.35, "close": 19.12, "low": 18.25, "volume": 65146.83, "price_change": 0.98, "p_change": 5.4, "ma5": 18.926, "ma10": 18.59, "ma20": 18.071, "v_ma5": 49271.56, "v_ma10": 43631.15, "v_ma20": 32830.88, "date": "2017-06-13"}, {"open": 18.8, "high": 18.8, "close": 18.14, "low": 18.1, "volume": 41033.32, "price_change": -0.93, "p_change": -4.88, "ma5": 18.812, "ma10": 18.455, "ma20": 17.995, "v_ma5": 41699.02, "v_ma10": 41023.88, "v_ma20": 31194.55, "date": "2017-06-12"}, {"open": 19.2, "high": 19.2, "close": 19.07, "low": 18.6, "volume": 47677.14, "price_change": 0.07, "p_change": 0.37, "ma5": 18.922, "ma10": 18.34, "ma20": 17.984, "v_ma5": 45969.33, "v_ma10": 39690.31, "v_ma20": 30424.58, "date": "2017-06-09"}, {"open": 19.35, "high": 19.5, "close": 19.0, "low": 18.93, "volume": 40625.74, "price_change": -0.3, "p_change": -1.55, "ma5": 18.744, "ma10": 18.115, "ma20": 17.947, "v_ma5": 42548.78, "v_ma10": 38305.7, "v_ma20": 29018.31, "date": "2017-06-08"}, {"open": 18.59, "high": 19.44, "close": 19.3, "low": 18.59, "volume": 51874.76, "price_change": 0.75, "p_change": 4.04, "ma5": 18.532, "ma10": 17.956, "ma20": 17.933, "v_ma5": 41751.68, "v_ma10": 36074.15, "v_ma20": 27758.64, "date": "2017-06-07"}, {"open": 18.74, "high": 18.8, "close": 18.55, "low": 18.4, "volume": 27284.12, "price_change": -0.14, "p_change": -0.75, "ma5": 18.254, "ma10": 17.8, "ma20": 17.894, "v_ma5": 37990.75, "v_ma10": 32300.16, "v_ma20": 26154.61, "date": "2017-06-06"}, {"open": 18.16, "high": 18.94, "close": 18.69, "low": 18.14, "volume": 62384.89, "price_change": 0.51, "p_change": 2.81, "ma5": 18.098, "ma10": 17.73, "ma20": 17.898, "v_ma5": 40348.75, "v_ma10": 30888.27, "v_ma20": 26522.92, "date": "2017-06-05"}]';
    var FT = JSON.parse(data_json),
        Time = new Array(),
        Price = new Array(),
        Volume = new Array();
    for (var i = 0; i < FT.length; i++) {
        Time.push(FT[i].date);
        Price.push(FT[i].close);
        Volume.push(FT[i].volume);
    }
    var oMyChart = echarts.init(document.getElementById("chart1"));
    var option = {
        xAxis:
            {
                axisLabel:{
                    rotate: 30,
                    interval:parseInt(Time.length/15)
                },
                axisLine:{
                    lineStyle :{
                        color: '#CECECE'
                    }
                },
                type : 'category',
                boundaryGap : false,
                data:Time
            },
        yAxis :
            {
                min: parseFloat(Math.min(...Price)).toFixed(2),
                max: parseFloat(Math.max(...Price)).toFixed(2),
                interval: parseFloat(parseFloat((Math.max(...Price) - Math.min(...Price))/7).toFixed(2)),
                type : 'value',
                axisLine:{
                    lineStyle :{
                        color: '#CECECE'
                    }
                }
            },
        series:
            {
                name:'close',
                type:'line',
                symbol:'none',
                smooth: 0.2,
                color:['#66AEDE'],
                data:Price
            }
    };
    oMyChart.setOption(option);
    var oMyChart = echarts.init(document.getElementById("chart2"));
    var option = {
        xAxis: {
            data: Time,
            silent: false,
            splitLine: {
                show: false
            },
            splitArea: {
                show: false
            },
            axisLabel: {
                rotate: 30,
                interval: parseInt(Time.length / 15)
            },
            axisLine:{
                lineStyle :{
                    color: '#CECECE'
                }
            }
        },
        yAxis: {
            splitArea: {
                show: false
            },
            axisLine:{
                lineStyle :{
                    color: '#CECECE'
                }
            }
        },
        series: {
            type: 'bar',
            itemStyle: {
                normal: {
                    color: function(params){
                        var colorList = ["rgb(253,16,80)"];
                        for (var i=1; i<Price.length; i++){
                            if (Price[i]>Price[i-1]){
                                colorList.push("rgb(253,16,80)");
                            }
                            else{
                                colorList.push("rgb(13,244,155)");
                            }
                        }
                        return colorList[params.dataIndex];
                    }
                },
            },
            data: Volume,
            // Set `large` for large data amount
            large: true
        }
    };
    oMyChart.setOption(option);
}

function end(){
    gameState.state = 0;
    document.getElementById("count").innerText = "End State";
    homeState();
    alert("游戏结束");
}

function placeOrder(){
    var vol = prompt("买入多少单位:");
    selllevelno = info["selllevelno"];
    var idx = 1;
    vol = parseFloat(vol);
    while ((vol>0) && (idx <= selllevelno)){
        var sellVol = info["sellvolume"+String(idx).padStart(2, '0')],
            time = info["tradingtime"].split(' ')[1],
            price = info["sellprice"+String(idx).padStart(2, '0')],
            mvwap = info["totalamount"]/info["totalvolume"];
        sellVol = parseFloat(sellVol);
        if (vol<=sellVol){
            makeDeal(time, price, vol, vol, mvwap);
            vol = 0;
        }
        else{
            makeDeal(time, price, sellVol, sellVol, mvwap);
            vol -= sellVol;
        }
        idx++;
    }
    if (vol>0){
        makeDeal(time, price, vol, 0, mvwap);
    }
}

function makeDeal(time, price, vol, deal, mvwap){
    account.Time = time;
    account.mvwap = mvwap;
    account.vwap = ((parseFloat(account.total) - parseFloat(account.target))*parseFloat(account.vwap) + parseFloat(price)*parseFloat(deal))/(parseFloat(account.total) - parseFloat(account.target) + parseFloat(deal));

    account.target -= parseFloat(deal);
    if (account.target<=0){
        alert("Today's targets finished!");
    }
    account.numOrder += 1;
    var process = document.getElementById("process_table"),
        result = document.getElementById("result_table"),
        table = '';
    table = '<tr><td width="25%">CurTime</td><td>'+time+'</td><td width="25%">Price</td><td>'+parseFloat(price).toFixed(2)+'</td><td width="25%">Order</td><td>'+String(vol)+'</td></tr><tr><td width="25%">Targets</td><td>'+String(account.target)+'</td><td width="25%">MVWAP</td><td>'+parseFloat(mvwap).toFixed(2)+'</td><td width="25%">Deal</td><td >'+String(deal)+'</td></tr>';
    process.innerHTML = table;
    table = '<tr><td width="25%">FinishingTime</td><td>'+time+'</td><td width="25%">OrderNum</td><td>'+String(account.numOrder)+'</td><td width="25%">VWAP</td><td>'+parseFloat(account.vwap).toFixed(2)+'</td></tr><tr><td width="25%">Total</td><td>'+String(account.total)+'</td><td width="25%">Finished</td><td>'+String(account.total-account.target)+'</td><td width="25%">Ratio</td><td >'+parseFloat((account.total-account.target)/account.total).toFixed(2)+'</td></tr>';
    result.innerHTML = table;
}

function placeOrderNum(vol){
    selllevelno = info["selllevelno"];
    var idx = 1;
    vol = parseFloat(vol);
    while ((vol>0) && (idx <= selllevelno)){
        var sellVol = info["sellvolume"+String(idx).padStart(2, '0')],
            time = info["tradingtime"],
            price = info["sellprice"+String(idx).padStart(2, '0')],
            mvwap = info["totalamount"]/info["totalvolume"];
        sellVol = parseFloat(sellVol);
        time = time.split(' ')[1];
        if (vol<=sellVol){
            makeDeal(time, price, vol, vol, mvwap);
            vol = 0;
        }
        else{
            makeDeal(time, price, sellVol, sellVol, mvwap);
            vol -= sellVol;
        }
        idx++;
    }
    if (vol>0){
        makeDeal(time, price, vol, 0, mvwap);
    }
}

function selectDate(){
    var select = document.getElementById("dates"),
        text = 'Select date:';
    for (var i=0; i<dateList.length; i++){
        text += '<button style="margin-right:5px" onclick="paramsUpdate(';
        text += dateList[i];
        text += ')">';
        text += dateList[i];
        text += '</button>';
    }
    select.innerHTML = text;
}

function paramsUpdate(date){
    params.date = date;
    var textInput = document.getElementById("textInput_targets");
    if(textInput.value && textInput.text!=""){
        account.total = parseFloat(textInput.value);
        account.target = parseFloat(textInput.value);
    }
    else {
        alert("invalid targets inputs!")
    }
}