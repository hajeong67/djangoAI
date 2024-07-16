function renderDynamicChart() {
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

        // Render dynamic chart with PPG data
        var dps = [];
        var dynamicChart = new CanvasJS.Chart("dynamicChartContainer", {
            exportEnabled: true,
            title :{
                text: "Dynamic Spline Chart"
            },
            data: [{
                type: "spline",
                markerSize: 0,
                dataPoints: dps
            }]
        });

        var xVal = 0;
        var dataLength = 50;

        var updateChart = function () {
            chartData.forEach((dataPoint, idx) => {
                if (idx < dataLength) {
                    dps.push(dataPoint);
                    xVal++;
                }
            });

            if (dps.length > dataLength) {
                dps.splice(0, dps.length - dataLength);
            }
            dynamicChart.render();
        };

        updateChart();
    })
    .catch(error => console.error('Error fetching data:', error));
}
