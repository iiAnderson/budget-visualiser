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

    chart: function (selector, data) {
        var width = document.getElementById("vis").clientWidth,
            height = document.getElementById("vis").clientHeight;



        bubbleChart.centerBudgetState = {
            "Over": {x: width / 3, y: height / 2},
            "Under": {x: 2 * (width / 3), y: height / 2}
        };

        bubbleChart.center = {x: width / 2, y: height / 2};

        bubbleChart.budgetStateTitleX = {
            "Over": width / 3,
            "Under": 2 * (width / 3)
        };

        var nodes = [];

        function charge(d) {
            return -Math.pow(d.radius, 2.0) / 4;
        }

        bubbleChart.tip = d3.tip()
            .attr('class', 'd3-tip')
            .html(function (d) {
                return "<strong>" + d.name + ":</strong> <span style='color:red'>$" + d.value + "million</span>";
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

        var colour = function(variance){
            if(variance === "Under"){
                return "#AED581";
            } else {
                return "#FF6E40";
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
            for(var i = 0; i < rawData.length; i++){
                sum += rawData[i].value;
            }

            var rScale = d3.scaleSqrt()
                .domain([0, maxAmount > 1000? 1500: maxAmount])
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
            nodes = createNodes(rawData);

            bubbleChart.displayNodesOnSidebar(nodes);

            bubbleChart.svg = d3.select(selector)
                .append('svg')
                .attr('width', width)
                .attr('height', height);

            bubbleChart.bubbles = bubbleChart.svg.selectAll('.bubble')
                .data(nodes, function (d) {
                    return d.label;
                });

            bubbleChart.text = bubbleChart.svg.selectAll('text')
                .data(nodes, function (d) {
                    return d.label
                });

            var newBubbles = bubbleChart.bubbles.enter().append('circle')
                .classed('bubble', true)
                .attr('r', 0)
                .attr('fill', function (d, i) {
                    return colour(d.variance);
                })
                .attr('stroke', function (d, i) {
                    return d3.rgb(colour(d.variance)).darker();
                })
                .attr('id', function(d){return "id_"+d.label;})
                .attr('stroke-width', 2)
                .on('mouseover', bubbleChart.showTooltip)
                .on('mouseout', bubbleChart.hideTooltip)
                .on('click', bubbleChart.handleClick);

            // bubbleChart.svg.call(d3.zoom()
            //     .scaleExtent([1 / 2, 8])
            //     .on("zoom", bubbleChart.zoomed));

            var newText = bubbleChart.text.enter().append("text")
                .attr("opacity", 1e-6)
                .text(function (d) {
                    return d.radius > 20? d.label: "";
                })
                .on('mouseover', bubbleChart.showTooltip)
                .on('mouseout', bubbleChart.hideTooltip)
                .on('click', bubbleChart.handleClick);

            bubbleChart.bubbles = bubbleChart.bubbles.merge(newBubbles);
            bubbleChart.text = bubbleChart.text.merge(newText);


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

            if(bubbleChart.currentAgency === null){
                title = "US Government Departments by Allocated Budget";
            } else {
                var spl = bubbleChart.currentAgency.split("/");

                if(spl.length === 2){
                    title = "US Government " + spl[1] + " Investments by Allocated Budget";
                } else {
                    title = spl[1] + " Investment " + spl[2] + " Projects by Allocated Budget";
                }
            }

            bubbleChart.svg.append("text")
                .attr("x", (width / 2))
                .attr("y", 30)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("text-decoration", "underline")
                .text(title);

            bubbleChart.simulation.nodes(nodes);

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

    showTooltip: function(evt){
        bubbleChart.tip.show(evt);

        d3.select("#id_item_"+evt.label).classed('active', true);

    },

    hideTooltip: function(evt){
        bubbleChart.tip.hide(evt);

        d3.select("#id_item_"+evt.label).classed('active', false);
    },

    handleClick :function(evt) {
        try {
            bubbleChart.tip.hide();
        } catch (e) {
        }
        resetGraph(evt);

        function callback(data) {
            bubbleChart.chart("#vis", data);
        }

        console.log("Current Agency " + bubbleChart.currentAgency);

        if(bubbleChart.currentAgency === null) {
            bubbleChart.currentAgency = "/" + evt.name;

            DataProcessing.agencyInvestmentData(null, csvData, evt.agency, callback);
        } else {
            bubbleChart.currentAgency = "/" + evt.name;

            DataProcessing.agencyData(null, csvData, evt.agency, evt.name, callback);
        }
    },


    displayNodesOnSidebar: function(nodes){
        d3.select("#node-list")
            .selectAll('li')
            .remove();

        var list = d3.select("#node-list")
            .selectAll('li')
            .data(nodes);

        list.enter()
            .append('li')
            .attr('id', function(d){ return 'id_item_'+d.label})
            .attr("class", "list-group-item")
            .text(function(d){ return d.name; })
            .on('mouseover', function(d){ d3.select("#id_"+d.label).attr('stroke-width', 5).attr('stroke-color', 'black'); })
            .on('mouseout', function(d){ d3.select("#id_"+d.label).attr('stroke-width', 2); })
            .on('click', bubbleChart.handleClick);
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
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .text(function (d) {
                return d + " Budget";
            });
    },

    zoomed: function () {
        bubbleChart.svg.attr("transform", d3.event.transform);
    }


};
