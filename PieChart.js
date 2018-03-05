

var pieChart = {

    pie: null,
    svg: null,
    tip: null,

    chart: function(data){
        console.log(data);
        pieChart.pie = d3.pie()
            .sort(null)
            .value(function(d){ return d.value });

        pieChart.tip = d3.tip()
            .attr('class', 'd3-tip')
            .html(function (d) {
                console.log(d);
                return "<strong>" + d.data.name + ":</strong> <span style='color:red'>$" + d.data.value + "million</span>";
            });

        pieChart.svg = d3.select("#pie-svg");
        var width = +pieChart.svg.attr("width"),
            height = +pieChart.svg.attr("height"),
            radius = Math.min(width, height) / 2,
            g = pieChart.svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        var color = d3.scaleOrdinal(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

        var path = d3.arc()
            .outerRadius(radius - 10)
            .innerRadius(0);

        var label = d3.arc()
            .outerRadius(radius - 40)
            .innerRadius(radius - 40);

        var arc = g.selectAll(".arc")
            .data(pieChart.pie(data))
            .enter().append("g")
            .attr("class", "arc")
            .on('mouseover', pieChart.showTooltip)
            .on('mouseout', pieChart.hideTooltip);

        pieChart.svg.call(pieChart.tip);

        arc.append("path")
            .attr("d", path)
            .attr("fill", function(d) { return color(d.value); });

        arc.append("text")
            .attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
            .attr("dy", "0.35em")
            .text(function(d) { return d.data.label; });

    },

    showTooltip: function (evt) {
        pieChart.tip.show(evt);

        // d3.select("#id_item_" + evt.name.replace(/\W/g, '').split(" ").join("_")).classed('active', true);
        // d3.select("#id_" + evt.name.replace(/\W/g, '').split(" ").join("_")).classed('active', true);

    },

    hideTooltip: function (evt) {
        pieChart.tip.hide(evt);

        // d3.select("#id_item_" + evt.name.replace(/\W/g, '').split(" ").join("_")).classed('active', false);
        // d3.select("#id_" + evt.name.replace(/\W/g, '').split(" ").join("_")).classed('active', false);

    }

}