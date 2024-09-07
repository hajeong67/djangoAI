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
var dataStorage = [];
var count = 0; // 예측횟수

function Unix_timestamp(t) {
    var date = new Date(t);
    var year = date.getFullYear();
    var month = "0" + (date.getMonth() + 1);
    var day = "0" + date.getDate();
    var hour = "0" + date.getHours();
    var minute = "0" + date.getMinutes();
    var second = "0" + date.getSeconds();
    return year + "-" + month.substr(-2) + "-" + day.substr(-2) + " " + hour.substr(-2) + ":" + minute.substr(-2) + ":" + second.substr(-2);
}

function connectWebSocket() {
    webSocket = new WebSocket("ws://" + window.location.host + "/ws/logger/receive/");
    webSocket.onmessage = function (e) {
        var data = JSON.parse(e.data);
        // 수신된 데이터 확인
        console.log("Received data-js:", data);

        count++;
        document.getElementById('countDisplay').innerText = "Count: " + count;

        // SVM 데이터 순차적으로 처리
        let svmAccData = data["svm_acc_data"];
        let svmIndex = 0;

        function processNextSVMData() {
            if (svmIndex < svmAccData.length) {
                updateDynamicSVMChart([svmAccData[svmIndex]]);
                svmIndex++;
                setTimeout(processNextSVMData, 300);
            }
        }

        processNextSVMData();

        // PPG 데이터 순차적으로 처리
        let ppgData = data["ppg_data"];
        let ppgIndex = 0;

        function processNextPPGData() {
            if (ppgIndex < ppgData.length) {
                updateDynamicPPGChart([ppgData[ppgIndex]]);
                ppgIndex++;
                setTimeout(processNextPPGData, 250);
            }
        }

        processNextPPGData();

        updateChart(data["x_test_twelve_sec"]);
        updateDynamicPPGChart(data["ppg_data"]);
        updateScatter(data["predictions"]);
        updatePieChart(data["acc_predictions"]);
        updateInferenceResults(data.state);

        // 밀리초 타임스탬프를 실제 날짜와 시간으로 변환
        var timestamp = data["time"];
        var formattedTime = Unix_timestamp(timestamp);

        //csv 데이터 저장
        dataStorage.push({
            time: formattedTime,
            ppgPrediction: JSON.stringify(data.state),
            accPrediction: JSON.stringify(data["acc_predictions"]),
            count: count
        });
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
    console.log("Updating scatter chart with predictions:", predictions);
    dataPoints = predictions.map((y, x) => ({
        x: x,
        y: y,
        color: y === -1 ? "yellow" : (y <= 0.73 ? "blue" : "red")
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
                minimum: -1,
                maximum: 1,
                interval: 0.25,
                stripLines: [{
                value: 0.74,
                color: "red",
                thickness: 1
            }]
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
            minimum: -1,
            maximum: 1,
            interval: 0.25,
            valueFormatString: "#0.00",
            stripLines: [{
                value: 0.74,
                color: "red",
                thickness: 1
            }]
        };
    }
    scatterChart.render();
}

function updateInferenceResults(state) {
    let inferenceText = "";

    if (state === 1) {
        inferenceText += "negative(위험)";

        let body = document.body;
        let blinkInterval = setInterval(() => {
            body.style.backgroundColor = body.style.backgroundColor === "rgba(255, 0, 0, 0.5)" ? "" : "rgba(255, 0, 0, 0.5)";
        }, 500);
        setTimeout(() => {
            clearInterval(blinkInterval);
            body.style.backgroundColor = "";
        }, 12000);
    } else if (state === 0) {
        inferenceText += "positive(정상)";
    } else if (state === -1) {
        inferenceText += "판단불가";
    } else {
        inferenceText += "Unknown state";
    }

    document.getElementById("inferenceResults").innerText = inferenceText;
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
                color = 'orange';
                break;
            case '2':
                label = 'danger';
                color = 'red';
                break;
            case '3':
                label = 'desk-work';
                color = 'green';
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

    // 최대 count와 그에 해당하는 key 찾기
    let maxCount = 0;
    let maxKey = null;

    for (const [key, count] of Object.entries(counts)) {
        if (count >= maxCount) {
            maxCount = count;
            maxKey = key;
        }
    }

    // 최대 count가 0 이상인 경우 라벨 출력
    if (maxCount > 0 && maxKey !== null) {
        let label;
        switch (maxKey) {
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
                label = `Class ${maxKey}`;
        }
        const labelCountElement = document.createElement("p");
        const percentage = ((maxCount / total) * 100).toFixed(2);
        labelCountElement.textContent = `${label} ${percentage}%`;
        labelCountsContainer.appendChild(labelCountElement);
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

    while (ppgQueue.length > 50) {
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

    // 보여질 데이터의 수를 50개로 제한
    while (svmAccQueue.length > 50) {
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

function downloadCSV(csv, filename) {
    try {
        var csvFile;
        var downloadLink;

        // Blob 객체 생성
        csvFile = new Blob([csv], { type: "text/csv" });

        // 다운로드 링크 생성
        downloadLink = document.createElement("a");
        downloadLink.download = filename;
        downloadLink.href = window.URL.createObjectURL(csvFile);

        // 링크 숨기고 다운로드 실행
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // 성공 메시지 로그
        console.log(`CSV 파일이 성공적으로 다운로드되었습니다: ${filename}`);
    } catch (error) {
        // 오류 메시지 로그
        console.error("CSV 파일 다운로드 중 오류가 발생했습니다:", error);
    }
}

function exportToCSV() {
    try {
        if (dataStorage.length === 0) {
            console.warn("저장된 데이터가 없습니다. CSV 파일을 생성할 수 없습니다.");
            return;
        }

        var csv = ["time,ppg prediction,acc prediction,count"];  // 헤더에 count 추가

        dataStorage.forEach(function (row) {
            let ppgPredictionValue = row.ppgPrediction;

            // accPrediction에서 가장 높은 비율을 갖는 숫자를 텍스트로 변환
            let accPredictionArray = JSON.parse(row.accPrediction);
            const counts = {0: 0, 1: 0, 2: 0, 3: 0};

            accPredictionArray.forEach(prediction => {
                counts[prediction] = (counts[prediction] || 0) + 1;
            });

            let maxCount = 0;
            let maxKey = null;

            for (const [key, count] of Object.entries(counts)) {
                if (count >= maxCount) {  // 동일한 maxCount일 경우에도 maxKey를 업데이트
                    maxCount = count;
                    maxKey = key;
                }
            }

            let accPredictionText = '';
            switch (maxKey) {
                case '0':
                    accPredictionText = 'walk';
                    break;
                case '1':
                    accPredictionText = 'run';
                    break;
                case '2':
                    accPredictionText = 'danger';
                    break;
                case '3':
                    accPredictionText = 'desk-work';
                    break;
                default:
                    accPredictionText = 'Unknown';
            }

            csv.push([
                row.time,  // time 데이터
                ppgPredictionValue,
                '"' + accPredictionText.replace(/"/g, '""') + '"',  // acc 예측 텍스트
                row.count  // 예측 횟수 count
            ].join(","));
        });

        var filename = 'log-' + Date.now() + '.csv';

        console.log("CSV 파일을 생성 중입니다...");
        downloadCSV(csv.join("\n"), filename);
    } catch (error) {
        console.error("CSV 파일 생성 중 오류가 발생했습니다:", error);
    }
}

function init() {
    connectWebSocket();
}

init();
