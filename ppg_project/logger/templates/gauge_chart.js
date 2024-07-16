function renderGaugeChart() {
    var gaugeOptions = {
        chart: {
            height: 200,
            type: 'radialBar',
        },
        series: [78],
        plotOptions: {
            radialBar: {
                hollow: {
                    margin: 0,
                    size: "70%",
                },
                dataLabels: {
                    showOn: "always",
                    name: {
                        show: true,
                        fontSize: "22px",
                    },
                    value: {
                        show: true,
                        fontSize: "16px",
                        formatter: function (val) {
                            return val + "%";
                        },
                    }
                }
            }
        },
        stroke: {
            lineCap: "round",
        },
        labels: ["Accuracy"],
        colors: ['#7367F0'],
    };

    var gaugeChart = new ApexCharts(document.querySelector("#growthGaugeChart"), gaugeOptions);
    gaugeChart.render();
}
