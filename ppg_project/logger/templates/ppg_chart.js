function renderPPGChart() {
    fetch('/api/ppg/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        var ppgData = data.ppg_data;
        var chartData = [];
        var inferenceResults = data.inference_results;

        if (ppgData.length === 0) {
            console.error('No PPG data found');
        }

        ppgData.forEach((ppgArray, index) => {
            ppgArray.forEach((value, idx) => {
                chartData.push({ x: idx, y: value });
            });
        });

        if (chartData.length === 0) {
            console.error('No chart data generated');
        }

        var chart = new CanvasJS.Chart("chartContainer", {
            title: {
                text: "Peaks with Prediction Colors"
            },
            axisX: {
                title: "Sample Index"
            },
            axisY2: {
                title: "Signal Value"
            },
            toolTip: {
                shared: true
            },
            legend: {
                cursor: "pointer",
                verticalAlign: "top",
                horizontalAlign: "center",
                dockInsidePlotArea: true,
                itemclick: toggleDataSeries
            },
            data: [{
                type: "line",
                axisYType: "secondary",
                name: "PPG Data",
                showInLegend: true,
                markerSize: 0,
                dataPoints: chartData
            }]
        });
        chart.render();

        function toggleDataSeries(e) {
            if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }
            chart.render();
        }

        var inferenceContainer = document.getElementById('inferenceResults');
        inferenceContainer.innerHTML = '<h3>Inference Results</h3>';
        inferenceResults.forEach(result => {
            var resultItem = document.createElement('p');
            resultItem.textContent = result;
            inferenceContainer.appendChild(resultItem);
        });
    })
    .catch(error => console.error('Error fetching data:', error));
}
