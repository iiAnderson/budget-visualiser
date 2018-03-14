var bubbleChart = {

    bubbles: [],
    text: [],
    centerBudgetState: null,
    budgetStateTitleX: null,
    center: null,
    simulation: null,
    svg: null,
    forceStrength: 0.2,
    tip: null,
    currentAgency: null,
    years: null,
    g: null,
    width: 1200,
    height: 800,
    nodes: [],
    title: null,

    chart: function (selector, data) {
        bubbleChart.width = d3.select(selector).node().getBoundingClientRect().width;
        console.log("vis width " + bubbleChart.width);

        bubbleChart.centerBudgetState = {
            "Over": {x: bubbleChart.width / 3, y: bubbleChart.height / 2},
            "Under": {x: 2 * (bubbleChart.width / 3), y: bubbleChart.height / 2}
        };

        bubbleChart.center = {x: bubbleChart.width / 2, y: bubbleChart.height / 2};

        bubbleChart.budgetStateTitleX = {
            "Over": bubbleChart.width / 3,
            "Under": 2 * (bubbleChart.width / 3)
        };

        function charge(d) {
            return -Math.pow(d.radius, 2.0) / 4;
        }

        //Creates the tooltip
        bubbleChart.tip = d3.tip()
            .attr('class', 'd3-tip')
            .html(function (d) {

                var data = d.data === undefined? d: d.data;
                var col = data.variance === "Under"? 'color:green': "color:red";

                return "<strong>" + d.name + ":</strong> <span style='color:red'>"+
                    DataProcessing.getCostMetricText(data.value)+"</span> </br>" +
                    "<span style="+col+"> "+(Math.round(Math.abs((((data.value-data.plannedValue)/data.plannedValue)* 100)) * 100)/100)+" </span><strong>% " + data.variance + " Budget</strong> ";
            });


        //Simulation allows the nodes to move based on a given location
        bubbleChart.simulation = d3.forceSimulation()
            .velocityDecay(0.4)
            .force('x', d3.forceX().strength(bubbleChart.forceStrength).x(bubbleChart.center.x))
            .force('y', d3.forceY().strength(bubbleChart.forceStrength).y(bubbleChart.center.y))
            .force('charge', d3.forceManyBody().strength(charge))
            .on('tick', ticked);

        // Legend Colours to be used for colouring nodes
        var colours_neg = [d3.rgb("#A5D6A7"), d3.rgb("#66BB6A"), d3.rgb("#43A047")];
        var colours_pos = [d3.rgb("#FF9E80"), d3.rgb("#FF6E40"), d3.rgb("#FF3D00")];
        var colourZero = d3.rgb("#D3D3D3");

        // Colour selection function
        var colour = function (d) {
            if(Math.abs(d.colorCategory) === 0){
                return colourZero;
            }
            if (d.variance === "Over") {
                return colours_pos[Math.abs(d.colorCategory)-1];
            } else {
                return colours_neg[Math.abs(d.colorCategory)-1];
            }
        };

        //Function to create the nodes from Raw Data, and create Sqrt scale for sizing nodes
        function createNodes(rawData) {
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

            //Scaling function, these are mostly manually inputted as they work for **MOST** screen sizes, but very
            //difficult to test for.
            var rScale = d3.scaleSqrt()
                .domain([0.01, maxAmount])
                .range([0.01, 600/(rawData.length > 20? Math.sqrt(rawData.length/DataProcessing.getCostRadiusFactor()): 3)]);

            var myNodes = rawData.map(function (d) {
                d.radius = rScale(+parseFloat(d.value));
                return d
            });

            myNodes.sort(function (a, b) {
                return b.value - a.value;
            });

            return myNodes;
        }

        // Create the chart
        var chart = function chart(selector, rawData) {
            bubbleChart.nodes = createNodes(rawData);

            bubbleChart.displayNodesOnSidebar(bubbleChart.nodes);

            bubbleChart.svg = d3.select(selector)
                .append('svg')
                .attr('width', bubbleChart.width)
                .attr('height', bubbleChart.height);

            bubbleChart.g = bubbleChart.svg;

            // Create the node
            bubbleChart.bubbles = bubbleChart.g.selectAll('.bubble')
                .data(bubbleChart.nodes);

            // Create node label
            bubbleChart.text = bubbleChart.g.selectAll('text')
                .data(bubbleChart.nodes, function (d) {
                    return d.label
                });

            // Create the node with the given data
            var newBubbles = bubbleChart.bubbles.enter().append('circle')
                .classed('bubble', true)
                .attr('r', 0)
                .attr('fill', function (d, i) {
                    return colour(d);
                })
                .attr('stroke', function (d, i) {
                    return d3.rgb(colour(d)).darker();
                })
                .attr('id', function (d) {
                    return "id_" + d.name.replace(/\W/g, '').split(" ").join("_");
                })
                .attr('stroke-width', 2)
                .on('mouseover', bubbleChart.showTooltip)
                .on('mouseout', bubbleChart.hideTooltip)
                .on('click', bubbleChart.handleClick);

            // Create the node label with the given data
            var newText = bubbleChart.text.enter().append("text")
                .attr("opacity", 1e-6)
                .text(function (d) {
                    return d.radius > 20 ? d.label : "";
                })
                .on('mouseover', bubbleChart.showTooltip)
                .on('mouseout', bubbleChart.hideTooltip)
                .on('click', bubbleChart.handleClick);

            // Merge the newly created data with the previous data set (should be [], but can not be in cases)
            bubbleChart.bubbles = bubbleChart.bubbles.merge(newBubbles);
            bubbleChart.text = bubbleChart.text.merge(newText);

            var zoom_handler = d3.zoom()
                .on("zoom", zoom_actions);

            function zoom_actions() {
                bubbleChart.bubbles.attr("transform", d3.event.transform);
                bubbleChart.text.attr("transform", d3.event.transform);
                if(bubbleChart.years !== null){
                    bubbleChart.years.attr("transform", d3.event.transform);
                }
            }

            // Create the zoom handler to manage the redrawing of nodes on the scrolled/zoomed canvas
            zoom_handler(bubbleChart.g);

            bubbleChart.text.transition()
                .duration(2000)
                .attr("opacity", 1);

            bubbleChart.bubbles.transition()
                .duration(2000)
                .attr('r', function (d) {
                    return d.radius;
                });

            bubbleChart.svg.call(bubbleChart.tip);

            // Create the title for the visualisation based on the data being viewed by the user
            bubbleChart.title = "";
            var navigator = "";

            if (bubbleChart.currentAgency === null) {
                bubbleChart.title = "US Government Departments by " + DataProcessing.getCostMetricTitle();
            } else {
                var spl = bubbleChart.currentAgency.split("/");

                if (spl.length === 2) {
                    bubbleChart.title = "US Government " + spl[1] + " Investments by " + DataProcessing.getCostMetricTitle();
                    navigator = spl[1];
                } else {
                    bubbleChart.title = spl[1] + " Investment " + spl[2] + " Projects by " + DataProcessing.getCostMetricTitle();
                    navigator = spl[1] + " > " + spl[2];
                }
            }

            bubbleChart.svg.append("text")
                .attr("x", 0)
                .attr("y", 20)
                .attr("text-anchor", "left")
                .style("font-size", "10px")
                .style("fill", "#A9A9A9")
                .text(navigator);

            d3.select("#circle-vis-title").text(bubbleChart.title);

            bubbleChart.simulation.nodes(bubbleChart.nodes);

            bubbleChart.groupBubbles();
        };


        function ticked() {
            bubbleChart.bubbles
                .attr('cx', function (d) {
                    return d.x;
                })
                .attr('cy', function (d) {
                    return d.y;
                });
            bubbleChart.text
                .attr('x', function (d) {
                    return d.x - (d.label.length * 5);
                })
                .attr('y', function (d) {
                    return d.y;
                })
        }

        return chart(selector, data);
    },

    //Shows the tooltip to the user
    showTooltip: function (evt) {
        console.log(d3.select("#legend_colorcategory" + evt.colorCategory));
        bubbleChart.tip.show(evt);

        d3.select("#id_item_" + evt.name.replace(/\W/g, '').split(" ").join("_")).classed('active', true);
        d3.select("#id_" + evt.name.replace(/\W/g, '').split(" ").join("_")).classed('active', true);
        d3.select("#id_seconditem_" + evt.name.replace(/\W/g, '').split(" ").join("_")).classed('active', true);
        d3.select("#legend_colorcategory" + evt.colorCategory).classed('active-legend', true);

    },

    //Hides the tooltip from the user
    hideTooltip: function (evt) {
        bubbleChart.tip.hide(evt);

        d3.select("#id_item_" + evt.name.replace(/\W/g, '').split(" ").join("_")).classed('active', false);
        d3.select("#id_" + evt.name.replace(/\W/g, '').split(" ").join("_")).classed('active', false);
        d3.select("#id_seconditem_" + evt.name.replace(/\W/g, '').split(" ").join("_")).classed('active', false);
        d3.select("#legend_colorcategory" + evt.colorCategory).classed('active-legend', false);
    },

    // Handles a user clicking on a clickable node (either in node-list or a node in the bubble chart)
    handleClick: function (evt) {
        try {
            bubbleChart.tip.hide();
        } catch (e) {
        }
        resetGraph(evt);

        function callback(data) {
            bubbleChart.chart("#vis", data);
            displayedLineChart.chart(data);
        }


        if (bubbleChart.currentAgency === null) {
            bubbleChart.currentAgency = bubbleChart.currentAgency + "/" + evt.name;

            DataProcessing.agencyInvestmentData(null, csvData, evt.agency, callback);
        } else {
            bubbleChart.currentAgency = bubbleChart.currentAgency + "/" + evt.name;

            DataProcessing.agencyData(null, csvData, evt.agency, evt.name, callback);
        }
    },

    // Displays the node-list on the sidebar
    displayNodesOnSidebar: function (nodes) {
        d3.select("#node-list")
            .selectAll('li')
            .remove();

        var list = d3.select("#node-list")
            .selectAll('li')
            .data(nodes);

        list.enter()
            .append('li')
            .attr('id', function (d) {
                return 'id_item_' + d.name.replace(/\W/g, '').split(" ").join("_");
            })
            .attr("class", "list-group-item")
            .text(function (d) {
                return d.name;
            })
            .on('mouseover', function (d) {
                var id = d.name.replace(/\W/g, '').split(" ").join("_");

                d3.select("#id_" + id).classed('active', true);
                d3.select("#id_item_" + id).classed('active', true);
                d3.select("#id_seconditem_" + id).classed('active', true);

            })
            .on('mouseout', function (d) {
                var id = d.name.replace(/\W/g, '').split(" ").join("_");

                d3.select("#id_" + id).classed('active', false);
                d3.select("#id_item_" + id).classed('active', false);
                d3.select("#id_seconditem_" + id).classed('active', false);

            })
            .on('click', bubbleChart.handleClick);
    },

    // Toggles between dollar/time
    toggleCostMeasure: function(costID){
        try {
            bubbleChart.tip.hide();
        } catch (e) {
        }
        resetGraph(null);
        function callback(data) {
            bubbleChart.chart("#vis", data);
            displayedLineChart.chart(data);
        }

        DataProcessing.switchCostMetric(null, csvData, callback, costID);
    },

    // Toggles between Random/Budget State grouping of nodes
    toggleDisplay: function (displayName) {
        if (displayName === 'budgetstate') {
            bubbleChart.splitBubbles();
        } else {
            bubbleChart.groupBubbles();
        }
    },

    //Performs the grouping, can be easily extended to further groupings if needed
    groupBubbles: function () {
        bubbleChart.hideStateLabels();

        bubbleChart.simulation.force('x', d3.forceX().strength(bubbleChart.forceStrength).x(bubbleChart.center.x));
        bubbleChart.simulation.alpha(1).restart();
    },

    // Gets the location needed for the node center
    nodeStatePosition: function (d) {
        return bubbleChart.centerBudgetState[d.variance].x;
    },

    //Splits the bubbles using the force to move them to the correct side of the graph.
    splitBubbles: function () {
        bubbleChart.showStateLabels();

        bubbleChart.simulation.force('x', d3.forceX().strength(bubbleChart.forceStrength).x(bubbleChart.nodeStatePosition));
        bubbleChart.simulation.alpha(1).restart();
    },

    //Hides (removes) the state labels for the grouping
    hideStateLabels: function () {
        bubbleChart.svg.selectAll('.year').remove();
    },

    //Shows (creates) the state labels for the grouping
    showStateLabels: function () {

        var yearsData = d3.keys(bubbleChart.budgetStateTitleX);
        var years = bubbleChart.svg.selectAll('.year')
            .data(yearsData);

        years.enter().append('text')
            .attr('class', 'year')
            .attr('x', function (d) {
                return bubbleChart.budgetStateTitleX[d];
            })
            .attr('y', 80)
            .attr('text-anchor', 'middle')
            .text(function (d) {
                return d + " Budget";
            });
    }

};
