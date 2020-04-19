var canvas_width = 1500,
    canvas_height = 500;

var svg = d3
    .select("div#simple-chart")
    .append("svg")
    .attr("width", canvas_width)
    .attr("height", canvas_height);


var margin = {
    top: 10,
    right: 200,
    bottom: 60,
    left: 50
};

var width = canvas_width - margin.left - margin.right;
var height = canvas_height - margin.top - margin.bottom;

async function renderChart() {
    let data = await d3.json("../data/WDIData.json");

    let source = d3.entries(data.bands).map(band => { return { key: band.key, value: d3.entries(band.value.years) }; });

    let legend_keys = source.map(band => { return band.key; });
    console.log(legend_keys);

    let reference_age = 70;

    var colorScale = d3.scaleOrdinal()
        .domain(legend_keys)
        //.range(['#00429d', '#32579f', '#4e6c9d', '#67829a', '#7f9795', '#97ac92', '#b0c292', '#cad699', '#e4eba9']);
        //.range(['#00429d', '#40559d', '#5e699d', '#767e9c', '#8c939a', '#a1a998', '#b4c096', '#c7d892', '#d9ef8d']);
        .range(d3.schemeCategory10);

    var xScale = d3.scaleBand()
        .domain(data.years)
        .range([0, width])
        ;

    var yScale = d3.scaleLinear()
        .domain([40, 90])
        .range([height, 0]);

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Axes
    var xAxisCall = d3.axisBottom(xScale)
    var xAxis = g.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(" + 0 + "," + height + ")")
        .call(xAxisCall)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    var yAxisCall = d3.axisLeft(yScale)
    var yAxis = g.append("g")
        .attr("class", "y-axis")
        .call(yAxisCall)

    // Labels
    svg.append("text")
        .attr("class", "axis-title")
        .attr("transform", `translate(${width / 2}, ${height + margin.bottom / 1.1})`)
        .text("Years (1960 - 2019)")

    yAxis.append("text")
        .attr("class", "axis-title")
        .attr("transform", `translate(-${margin.left / 1.5}, ${height / 2}) rotate(-90)`)
        .text("Life expectancy at birth, female (years)");

    // Render the reference area
    renderReferenceArea(g, width, yScale, reference_age);

    let legendVerticalOffset = 50 + margin.top;

    // Include the legend circles 
    svg.selectAll(".legend")
        .data(legend_keys)
        .enter()
        .append("circle")
        .attr("cx", width + margin.left + 14)
        .attr("cy", function (d, i) { return legendVerticalOffset + i * 25 }) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("r", 7)
        .style("fill", function (d) { return colorScale(d) });

    // Include the labels for the legend
    svg.selectAll()
        .data(legend_keys)
        .enter()
        .append("text")
        .attr("x", width + margin.left + 30)
        .attr("y", function (d, i) { return legendVerticalOffset + i * 25 }) // 100 is where the first dot appears. 25 is the distance between dots
        .classed("legend_labels", true)
        //.style("fill", function (d) { return colorScale(d) })
        .text(d => getTextForBand(d))
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")

    // Draw the lines
    g.selectAll(".line")
        .data(source)
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", function (d) {
            return colorScale(d.key);
        })
        .attr("stroke-width", 3)
        .attr("d", function (d) {
            return d3.line()
                .defined(d => d.value.total_population != 0)
                .x(function (d) { return xScale(d.key); }) // set the x values for the line generator
                .y(function (d) { return yScale(d.value.weighted_average_expectancy); }) // set the y values for the line generator
                (d.value)
        });

    // Draw points
    g.selectAll("myDots")
        .data(source)
        .enter()
        .append('g')
        .style('fill', d => colorScale(d.key))
        .selectAll("myPoints")
        .data(d => d.value)
        .enter()
        .append("circle")
        .classed("dots", true)
        .attr("stroke-width", 3)
        .attr("cx", d => xScale(d.key))
        .attr("cy", d => yScale(d.value.weighted_average_expectancy))
        .attr("r", 5)
        .on("mouseover", function (a, b, c) {
            console.log(a);
        })


    // Add a legend at the end of each line
    //addLegendAtTheEndOfLine(g, source, xScale, yScale);

    addHtmlTextBox(g,
        width + 8,
        0,
        margin.right,
        40,
        'Fertility rate, total (births per woman)');

    addHtmlTextBox(g,
        8,
        0,
        640,
        60,
        '<b>Trade-off between fertility and lifespan: </b> Increased lifespan comes at the cost of reduced fertility.<br> (Data from: <em>https://datacatalog.worldbank.org/dataset/world-development-indicators<em>)');
}

function addHtmlTextBox(g, x, y, width, height, text) {
    let fo = g.append('foreignObject')
        .attr("transform", `translate(${x}, ${y})`)
        .attr('width', width)
        .attr('height', height)
        .classed('full-container', true);

    let divLegend = fo.append('xhtml:div')
        .append('div')
        .classed('legend_header_box', true)
        .append('p')
        .html(`${text}`);
}

function renderReferenceArea(g, width, yScale, reference_age) {
    g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', yScale(reference_age))
        .attr('opacity', '0.1')
}

function getLastValidValue(d) {
    for (var i = d.value.length - 1; i >= 0; i--) {
        if (d.value[i].value.total_population > 0) {
            return d.value[i];
        }
    }
    return d.value[0];
}

function getTextForBand(band) {
    var next = parseInt(band) + 1;
    return `From ${band} to less than ${next} birth(s)`;
}

function addLegendAtTheEndOfLine(g, source, xScale, yScale) {
    g.selectAll("myLabels")
        .data(source)
        .enter()
        .append('g')
        .append("text")
        .datum(function (d) {
            console.log(`last key: ${d.key}`);
            console.log(`last value:\n`);
            console.log(d.value)
            return {
                name: getTextForBand(d.key),
                value: getLastValidValue(d)
            };
        }) // keep only the last value of each time series
        .attr("transform", function (d) { return "translate(" + xScale(d.value.key) + "," + yScale(d.value.value.weighted_average_expectancy) + ")"; }) // Put the text at the position of the last point
        .attr("x", 12) // shift the text a bit more right
        .text(function (d) { return d.name; })
        .style("fill", "black")
        .style("font-size", 15)
}

function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}
renderChart();
