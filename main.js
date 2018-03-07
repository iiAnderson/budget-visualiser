var myBubbleChart = null;
var csvData = [];
var displayedPieChart = null;
var displayedLineChart = null;

window.onload = function () {

    function setupButtons() {
        d3.select('#toolbar')
            .selectAll('.btn')
            .on('click', function () {
                d3.selectAll('.btn').classed('active', false);
                var button = d3.select(this);

                button.classed('active', true);
                myBubbleChart.toggleDisplay(button.attr('id'));
            });
        d3.select("#costMeasure")
            .selectAll('.btn')
            .on('click', function () {
                d3.selectAll('.btn').classed('active', false);
                var button = d3.select(this);
                button.classed('active', true);


                myBubbleChart.toggleCostMeasure(button.attr('id'));
            });
        d3.select('#reset')
            .on('click', function () {
                bubbleChart.currentAgency = null;
                resetGraph(null);
                DataProcessing.resetData(null, csvData, display);
            });
        d3.select("#node-elem")
            .on('click', function () {

                console.log(d3.select("#sidebar").classed('active'));

                if (d3.select("#sidebar").classed('active')) {
                    $('#sidebar').toggleClass('active');
                    $("#dismiss").toggleClass('active');
                }
            });
        d3.select("#control-elem")
            .on('click', function () {

                console.log(d3.select("#sidebar").classed('active'));

                if (d3.select("#sidebar").classed('active')) {
                    $('#sidebar').toggleClass('active');
                    $("#dismiss").toggleClass('active');
                }
            });

    }

    function display(data) {
        console.log(data);
        myBubbleChart.chart('#vis', data);
        displayedLineChart.chart(data)
    }


    function processData(err, data) {
        csvData = data;
        resetGraph(null);
        DataProcessing.resetData(err, data, display);
    }

    d3.csv('out2.csv', processData);

    setupButtons();
};

var resetGraph = function (evt) {
    if (myBubbleChart !== null) {
        if (evt !== null) {
            myBubbleChart.bubbles.transition()
                .duration(2000)
                .attr("opacity", function (d) {
                    return evt.agency === d.agency ? "1" : "0";
                });
        }
        console.log("Resetting\q");
        d3.selectAll("svg > *").remove();
        document.getElementById("vis").innerHTML = "";
        document.getElementById("secondary-graph").innerHTML = "";

        function display(data) {
            console.log("Display Data");
            myBubbleChart.chart('#vis', data);
            displayedLineChart.chart(data)
        }

        d3.select('#reset')
            .on('click', function () {
                bubbleChart.currentAgency = null;
                resetGraph(null);
                DataProcessing.resetData(null, csvData, display);
            });
    }

    myBubbleChart = bubbleChart;
    displayedLineChart = barChart;

};