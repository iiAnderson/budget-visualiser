var myBubbleChart = null;
var csvData = [];

window.onload = function () {

    function setupButtons() {
        d3.select('#toolbar')
            .selectAll('.btn')
            .on('click', function () {
                // Remove active class from all buttons
                d3.selectAll('.btn').classed('active', false);
                // Find the button just clicked
                var button = d3.select(this);

                // Set it as the active button
                button.classed('active', true);

                // Get the id of the button
                var buttonId = button.attr('id');

                // Toggle the bubble chart based on
                // the currently clicked button.
                console.log("TOGGLE");
                myBubbleChart.toggleDisplay(buttonId);
            });
        d3.select('#reset')
            .on('click', function () {
                bubbleChart.currentAgency = null;
                resetGraph(null);
                DataProcessing.resetData(null, csvData, display);
            });

    }

    function display(data) {
        console.log(data);
        myBubbleChart.chart('#vis', data);
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
    console.log(myBubbleChart);
    if (myBubbleChart !== null) {
        if (evt !== null) {
            myBubbleChart.bubbles.transition()
                .duration(2000)
                .attr("opacity", function (d) {
                    return evt.agency === d.agency ? "1" : "0";
                });
        }
        console.log("removing chart");
        d3.selectAll("svg > *").remove();
        document.getElementById("vis").innerHTML = "<p id=\"reset\" class=\"reset-btn\"><i class=\"fa fa-refresh\"></i> Reset</p>";

        function display(data) {
            console.log(data);
            myBubbleChart.chart('#vis', data);
        }

        d3.select('#reset')
            .on('click', function () {
                bubbleChart.currentAgency = null;
                resetGraph(null);
                DataProcessing.resetData(null, csvData, display);
            });
    }

    myBubbleChart = bubbleChart;

};