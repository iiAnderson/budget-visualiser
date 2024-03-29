var scatterChart = {

    svg: null,
    height: 600,
    width: 900,

    createNodes: function (rawData) {
        // Use map() to convert raw data into node data.
        // Checkout http://learnjsdata.com/ for more on
        // working with data.

        var maxAmount = d3.max(rawData, function (d) {
            return +d.value;
        });

        var sum = 0;
        for (var i = 0; i < rawData.length; i++) {
            sum += rawData[i].value;
        }

        var rScale = d3.scaleSqrt()
            .domain([0, maxAmount > 1000 ? 1500 : maxAmount])
            .range([0, rawData.length > 100 ? 130 : 150]);

        var myNodes = rawData.map(function (d) {
            d.radius = rScale(+parseFloat(d.value));
            return d
        });

        myNodes.sort(function (a, b) {
            return b.value - a.value;
        });


        return myNodes;
    },

    chart: function (data) {
        scatterChart.width = d3.select("#secondary-graph").node().getBoundingClientRect().width;

        var colours_neg = [d3.rgb("#A5D6A7"), d3.rgb("#66BB6A"), d3.rgb("#43A047")];
        var colours_pos = [d3.rgb("#FF9E80"), d3.rgb("#FF6E40"), d3.rgb("#FF3D00")];

        var colourZero = d3.rgb("#D3D3D3");

        var colour = function (d) {
            if(Math.abs(d.colorCategory) === 0){
                return colourZero;
            }
            if (d.variance === "Over") {
                return colours_pos[d.colorCategory-1];
            } else {
                return colours_neg[Math.abs(d.colorCategory)-1];
            }
        };

        var margin = {top: 20, right: 20, bottom: 40, left: 60};

        var nodes = scatterChart.createNodes(data);

        scatterChart.svg = d3.select("#secondary-graph")
            .append('svg')
            .attr('width', scatterChart.width)
            .attr('height', scatterChart.height)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        var width = scatterChart.width - margin.left - margin.right,
            height = scatterChart.height - margin.top - margin.bottom;

        var min = d3.min(nodes, function (d) {
            return d.value < d.plannedValue ? d.value : d.plannedValue;
        });

        var x = d3.scaleBand().rangeRound([0, width]),
            y = d3.scaleLog()
                .base(2)
                // Log scale requires number above 0, so make sure value isnt 0.
                .domain([min <= 0? 0.5 : min, d3.max(nodes, function (d) {
                    return d.value > d.plannedValue ? d.value : d.plannedValue;
                })])
                .range([height, 0]);

        x.domain(nodes.map(function (d) {
            return d.label;
        }));


        var valueline = d3.line()
            .x(function(d) { return x(d.label); })
            .y(function(d) { return d.value < 0.5 ? y(0.5): y(d.value); });

        var predictedline = d3.line()
            .x(function(d) { return x(d.label); })
            .y(function(d) { return d.plannedValue < 0.5 ? y(0.5): y(d.plannedValue); });

        scatterChart.svg.append("path")
            .data([nodes])
            .attr("class", "line")
            .attr("d", valueline);

        scatterChart.svg.append("path")
            .data([nodes])
            .attr("class", "predictedline")
            .attr("d", predictedline);

        scatterChart.svg.selectAll("dot")
            .data(nodes)
            .enter().append("circle")
            .attr('id', function (d) {
                return "id_seconditem_" + d.name.replace(/\W/g, '').split(" ").join("_");
             })
            .attr("r", 7)
            .attr("fill", function(d) { return colour(d) })
            .attr("cx", function(d) { return x(d.label); })
            .attr("cy", function(d) { return d.value < 0.5 ? y(0.5): y(d.value); })
            .on("mouseover", scatterChart.showTooltip)
            .on("mouseout", scatterChart.hideTooltip);

        // Add the x Axis
        scatterChart.svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .classed("xaxis", true)
            .call(d3.axisBottom(x));

        // Add the Y Axis
        scatterChart.svg.append("g")
            .call(d3.axisLeft(y));

        d3.select("#secondary-vis-title").text("Line Graph displaying " + bubbleChart.title);

        scatterChart.svg.selectAll(".xaxis text")  // select all the text elements for the xaxis
            .attr("transform", function(d) {
                return "translate(" + this.getBBox().height*-2 + "," + this.getBBox().height + ")rotate(-45)";
            });

        var title = "";
        if (bubbleChart.currentAgency === null) {
            title = "Department";
        } else {
            var spl = bubbleChart.currentAgency.split("/");

            if (spl.length === 2) {
                title = "Investments";
            } else {
                title = "Projects";
            }
        }

        scatterChart.svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate("+ (width/2) +","+(height+35)+")")
            .text(title);

        scatterChart.svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate("+ -40 +","+(height/2)+")rotate(-90)")
            .text("Value log2(" + DataProcessing.getCostMetricText("") + ")");

        var legend = scatterChart.svg.selectAll(".legend").data([{"label":"Actual", "class": "steelblue"}, {"label":"Planned", "class":"red"}])
            .enter().append("g")
            // .attr("class", function(d){return d.class})
            .attr("transform", function (d,i) {
                return "translate(" + (width-100) + "," + (5+(-(i*20)))+")";
            });

        legend.append("text").text(function (d) {return d.label;})
            .attr("transform", "translate(15,9)"); //align texts with boxes

        legend.append("rect")
            .attr("fill", function (d, i) {return d3.color(d.class)})
            .attr("width", 10).attr("height", 10);

    },

    showTooltip: function (evt) {
        bubbleChart.tip.show(evt);

        d3.select("#id_item_" + evt.name.replace(/\W/g, '').split(" ").join("_")).classed('active', true);
        d3.select("#id_" + evt.name.replace(/\W/g, '').split(" ").join("_")).classed('active', true);
        d3.select("#id_seconditem_" + evt.name.replace(/\W/g, '').split(" ").join("_")).classed('active', true);

    },

    hideTooltip: function (evt) {
        bubbleChart.tip.hide(evt);

        d3.select("#id_item_" + evt.name.replace(/\W/g, '').split(" ").join("_")).classed('active', false);
        d3.select("#id_" + evt.name.replace(/\W/g, '').split(" ").join("_")).classed('active', false);
        d3.select("#id_seconditem_" + evt.name.replace(/\W/g, '').split(" ").join("_")).classed('active', false);

    }
};

