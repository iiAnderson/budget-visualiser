var displayedBubbleChart = null;
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
                displayedBubbleChart.toggleDisplay(button.attr('id'));
            });
        d3.select("#costMeasure")
            .selectAll('.btn')
            .on('click', function () {
                d3.selectAll('.btn').classed('active', false);
                var button = d3.select(this);
                button.classed('active', true);


                displayedBubbleChart.toggleCostMeasure(button.attr('id'));
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

        var popup = d3.select('#descPopup');
        var closePopup = d3.select('#closePopup');

        window.onclick = function(event) {
            if (event.target == document.getElementById("descPopup")) {
                popup.attr('style', 'display:none');
            }
        };

        d3.select('#info')
            .on('click', function () {
            popup.attr('style', 'display:block');
        });
        closePopup
            .on('click', function () {
                popup.attr('style', 'display:none');
            });

    }

    function display(data) {
        console.log(data);
        displayedBubbleChart.chart('#vis', data);
        displayedLineChart.chart(data)
    }


    function processData(err, data) {
        csvData = data;
        resetGraph(null);
        DataProcessing.resetData(err, data, display);
    }

    d3.csv('out3.csv', processData);

    setupButtons();
};

var resetGraph = function (evt) {
    if (displayedBubbleChart !== null) {
        if (evt !== null) {
            displayedBubbleChart.bubbles.transition()
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
            displayedBubbleChart.chart('#vis', data);
            displayedLineChart.chart(data)
        }

        d3.select('#reset')
            .on('click', function () {
                bubbleChart.currentAgency = null;
                resetGraph(null);
                DataProcessing.resetData(null, csvData, display);
            });
    }

    displayedBubbleChart = bubbleChart;
    displayedLineChart = scatterChart;

};