const maxLength = 40;

var webSocket;
var chart;
var scatterChart;
var dynamicChart;
var datasets = [];
var dps = [];
var pieChart;
var dynamicSVMChart;
var svmDps = [];

function connectWebSocket() {
    webSocket = new WebSocket("ws://" + window.location.host + "/ws/logger/receive/");
    webSocket.onmessage = function (e) {
        var data = JSON.parse(e.data);
        // 수신된 데이터 확인
        console.log("Received data-js:", data);

        updateChart(data["x_test_twelve_sec"]);
        updateDynamicPPGChart(data["ppg_data"]);
        updateScatter(data["predictions"]);
        updatePieChart(data["acc_predictions"]);
        updateDynamicSVMChart(data["svm_acc_data"]);
    };
    webSocket.onclose = function (e) {
        setTimeout(connectWebSocket, 1000);
    };
}

function updateChart(x_test_twelve_sec) {
    datasets = [];
    x_test_twelve_sec.forEach((subArray, index) => {
        var chartData = [];
        subArray.forEach((value, idx) => {
            chartData.push({ x: idx, y: value });
        });

        datasets.push({
            type: "line",
            name: "" + (index + 1),
            showInLegend: true,
            markerSize: 0,
            dataPoints: chartData,
            color: getRandomColor()
        });
    });

    if (!chart) {
        chart = new CanvasJS.Chart("chartContainer", {
            title: {
                text: "Normalized PPG Data"
            },
            axisX: {
                title: "Sample Index"
            },
            axisY: {
                title: "Signal Value",
                minimum: 0,
                maximum: 1
            },
            data: datasets
        });
    } else {
        chart.options.data = datasets;
    }

    chart.render();
}

function updateScatter(predictions) {
    // 로그 추가 - 업데이트할 산점도 데이터 확인
    console.log("Updating scatter chart with predictions:", predictions);
    dataPoints = predictions.map((y, x) => ({
        x: x,
        y: y,
        color: y <= 0.75 ? "blue" : "red" // 색상 조건 설정
    }));


    if (!scatterChart) {
        scatterChart = new CanvasJS.Chart("scatterChartContainer", {
            animationEnabled: true,
            zoomEnabled: true,
            title: {
                text: "Predictions Scatter Plot"
            },
            axisX: {
                title: "Index",
                minimum: 0,
                maximum: predictions.length
            },
            axisY: {
                title: "Prediction",
                valueFormatString: "#0.00",
                minimum: 0,
                maximum: 1,
                interval: 0.25
            },
            data: [{
                type: "scatter",
                toolTipContent: "<b>Index: </b>{x}<br/><b>Prediction: </b>{y}",
                dataPoints: dataPoints
            }]
        });
    } else {
        scatterChart.options.data[0].dataPoints = dataPoints;
        scatterChart.options.axisX.minimum = 0;
        scatterChart.options.axisX.maximum = predictions.length;
        scatterChart.options.axisY = {
            title: "Prediction",
            minimum: 0,
            maximum: 1,
            interval: 0.25,
            valueFormatString: "#0.00"
        };
    }
    scatterChart.render();
    document.getElementById("inferenceResults").innerText = "추론 결과: Inference Result";
}

function updatePieChart(acc_predictions) {
    console.log("Updating pie chart with acc_predictions:", acc_predictions);

    const counts = {0: 0, 1: 0, 2: 0, 3: 0};
    acc_predictions.forEach(prediction => {
        counts[prediction] = (counts[prediction] || 0) + 1;
    });

    const total = acc_predictions.length;

    const dataPoints = Object.keys(counts).map(key => {
        let label;
        let color;
        switch (key) {
            case '0':
                label = 'walk';
                color = 'blue';
                break;
            case '1':
                label = 'run';
                color = 'red';
                break;
            case '2':
                label = 'danger';
                color = 'green';
                break;
            case '3':
                label = 'desk-work';
                color = 'orange';
                break;
            default:
                label = `Class ${key}`;
                color = 'grey';
        }
        const percentage = ((counts[key] / total) * 100).toFixed(2);
        return { y: counts[key], label: `${label} ${percentage}%`, color: color };
    });

    console.log("Generated data points for pie chart:", dataPoints);

    if (!pieChart) {
        pieChart = new CanvasJS.Chart("pieChartContainer", {
            animationEnabled: true,
            title: {
                text: "ACC Predictions Distribution"
            },
            data: [{
                type: "doughnut",
                startAngle: 240,
                yValueFormatString: "",
                indexLabel: "{label}",
                dataPoints: dataPoints
            }]
        });
    } else {
        pieChart.options.data[0].dataPoints = dataPoints;
    }
    pieChart.render();

    // 라벨 텍스트
    const labelCountsContainer = document.getElementById("labelCounts");
    labelCountsContainer.innerHTML = "";
    for (const [key, count] of Object.entries(counts)) {
        if (count > 0) {
            let label;
            switch (key) {
                case '0':
                    label = 'walk';
                    break;
                case '1':
                    label = 'run';
                    break;
                case '2':
                    label = 'danger';
                    break;
                case '3':
                    label = 'desk-work';
                    break;
                default:
                    label = `Class ${key}`;
            }
            const labelCountElement = document.createElement("p");
            const percentage = ((count / total) * 100).toFixed(2);
            labelCountElement.textContent = `${label} ${percentage}%`;
            labelCountsContainer.appendChild(labelCountElement);
        }
    }

    // 레전드 설정
    const legendContainer = document.getElementById("legendContainer");
    legendContainer.innerHTML = "";

    dataPoints.forEach(point => {
        const legendItem = document.createElement("div");
        legendItem.className = "legend-item";
        const colorBox = document.createElement("span");
        colorBox.style.backgroundColor = point.color;
        const labelText = document.createTextNode(point.label.split(' ')[0]);
        legendItem.appendChild(colorBox);
        legendItem.appendChild(labelText);
        legendContainer.appendChild(legendItem);
    });
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

var ppgQueue = [];

function updateDynamicPPGChart(ppg_data) {
    ppgQueue = ppgQueue.concat(ppg_data);

    while (ppgQueue.length > 300) {
        ppgQueue.shift();
    }

    dps = ppgQueue.map((value, index) => ({ x: index, y: value }));

    if (!dynamicChart) {
        dynamicChart = new CanvasJS.Chart("dynamicChartContainer", {
            exportEnabled: true,
            title :{
                text: "Dynamic PPG Chart"
            },
            data: [{
                type: "spline",
                markerSize: 0,
                dataPoints: dps
            }]
        });
    } else {
        dynamicChart.options.data[0].dataPoints = dps;
    }

    dynamicChart.render();
}

var svmAccQueue = [];

function updateDynamicSVMChart(svm_acc_data) {
    svmAccQueue = svmAccQueue.concat(svm_acc_data);

    while (svmAccQueue.length > 300) {
        svmAccQueue.shift();
    }

    svmDps = svmAccQueue.map((value, index) => ({ x: index, y: value }));

    if (!dynamicSVMChart) {
        dynamicSVMChart = new CanvasJS.Chart("dynamicSVMChartContainer", {
            exportEnabled: true,
            title: {
                text: "Dynamic IMU Chart"
            },
            data: [{
                type: "spline",
                markerSize: 0,
                dataPoints: svmDps
            }]
        });
    } else {
        dynamicSVMChart.options.data[0].dataPoints = svmDps;
    }

    dynamicSVMChart.render();
}

function init() {
    connectWebSocket();
}

init();
