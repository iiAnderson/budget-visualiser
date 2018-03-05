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

        bubbleChart.tip = d3.tip()
            .attr('class', 'd3-tip')
            .html(function (d) {
                return "<strong>" + d.name + ":</strong> <span style='color:red'>"+
                    DataProcessing.getCostMetricText(d.data === undefined? d.value: d.data.value)+"</span>";
            });


        // Here we create a force layout and
        // @v4 We create a force simulation now and
        //  add forces to it.
        bubbleChart.simulation = d3.forceSimulation()
            .velocityDecay(0.4)
            .force('x', d3.forceX().strength(bubbleChart.forceStrength).x(bubbleChart.center.x))
            .force('y', d3.forceY().strength(bubbleChart.forceStrength).y(bubbleChart.center.y))
            .force('charge', d3.forceManyBody().strength(charge))
            .on('tick', ticked);

        var colours_neg = [d3.rgb("#E5FFE5")];
        var colours_pos = [d3.rgb("#FFE5E5")];

        for(var i = 1; i < 3; i++){
            colours_neg.push(colours_neg[i-1].darker());
            colours_pos.push(colours_pos[i-1].darker());
        }

        var colour = function (d) {
            if (d.variance === "Over") {
                return colours_pos[d.colorCategory];
            } else {
                return colours_neg[Math.abs(d.colorCategory)];
            }
        };

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
        }

        var chart = function chart(selector, rawData) {
            bubbleChart.nodes = createNodes(rawData);

            bubbleChart.displayNodesOnSidebar(bubbleChart.nodes);

            bubbleChart.svg = d3.select(selector)
                .append('svg')
                .attr('width', bubbleChart.width)
                .attr('height', bubbleChart.height);

            bubbleChart.g = bubbleChart.svg;


            bubbleChart.bubbles = bubbleChart.g.selectAll('.bubble')
                .data(bubbleChart.nodes);

            bubbleChart.text = bubbleChart.g.selectAll('text')
                .data(bubbleChart.nodes, function (d) {
                    return d.label
                });

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


            var newText = bubbleChart.text.enter().append("text")
                .attr("opacity", 1e-6)
                .text(function (d) {
                    return d.radius > 20 ? d.label : "";
                })
                .on('mouseover', bubbleChart.showTooltip)
                .on('mouseout', bubbleChart.hideTooltip)
                .on('click', bubbleChart.handleClick);

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

            var title = "";
            var navigator = "";

            if (bubbleChart.currentAgency === null) {
                title = "US Government Departments by Allocated Budget";
            } else {
                var spl = bubbleChart.currentAgency.split("/");

                if (spl.length === 2) {
                    title = "US Government " + spl[1] + " Investments by Allocated Budget";
                    navigator = spl[1];
                } else {
                    title = spl[1] + " Investment " + spl[2] + " Projects by Allocated Budget";
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

            d3.select("#circle-vis-title").text(title);

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

    },

    handleClick: function (evt) {
        try {
            bubbleChart.tip.hide();
        } catch (e) {
        }
        resetGraph(evt);

        function callback(data) {
            bubbleChart.chart("#vis", data);
            displayedPieChart.chart(data);
        }


        if (bubbleChart.currentAgency === null) {
            bubbleChart.currentAgency = bubbleChart.currentAgency + "/" + evt.name;

            DataProcessing.agencyInvestmentData(null, csvData, evt.agency, callback);
        } else {
            bubbleChart.currentAgency = bubbleChart.currentAgency + "/" + evt.name;

            DataProcessing.agencyData(null, csvData, evt.agency, evt.name, callback);
        }
    },


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

    toggleCostMeasure: function(costID){
        try {
            bubbleChart.tip.hide();
        } catch (e) {
        }
        resetGraph(null);
        function callback(data) {
            bubbleChart.chart("#vis", data);
        }

        DataProcessing.switchCostMetric(null, csvData, callback, costID);
    },

    toggleDisplay: function (displayName) {
        if (displayName === 'budgetstate') {
            bubbleChart.splitBubbles();
        } else {
            bubbleChart.groupBubbles();
        }
    },

    groupBubbles: function () {
        bubbleChart.hideYears();

        bubbleChart.simulation.force('x', d3.forceX().strength(bubbleChart.forceStrength).x(bubbleChart.center.x));
        bubbleChart.simulation.alpha(1).restart();
    },

    nodeYearPos: function (d) {
        return bubbleChart.centerBudgetState[d.variance].x;
    },

    splitBubbles: function () {
        bubbleChart.showYears();

        bubbleChart.simulation.force('x', d3.forceX().strength(bubbleChart.forceStrength).x(bubbleChart.nodeYearPos));
        bubbleChart.simulation.alpha(1).restart();
    },

    hideYears: function () {
        bubbleChart.svg.selectAll('.year').remove();
    },

    showYears: function () {
        // Another way to do this would be to create
        // the year texts once and then just hide them.
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
