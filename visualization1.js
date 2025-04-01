// SVG margins
const margin = { top: 20, right: 30, bottom: 30, left: 40 };

// Create the first SVG canvas
function createVisualization1() {
  const svg1 = d3
    .select("#visualization1")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Load and process data for the first visualization
  d3.csv("./data/march28 and earlier/author_analysis_20250327_143844.csv")
    .then(function (data) {
      // Filter out records without avg_cred_score
      const filteredData = data.filter(
        (d) => d.avg_cred_score !== "" && d.avg_cred_score !== undefined
      );

      // Convert string values to numbers
      filteredData.forEach((d) => {
        d.avg_star_rating = +d.avg_star_rating;
        d.avg_cred_score = +d.avg_cred_score;
      });

      // Set up scales
      const xScale = d3
        .scaleLinear()
        .domain([2.5, d3.max(filteredData, (d) => d.avg_star_rating)])
        .range([
          0,
          d3.select("#visualization1").node().clientWidth -
            margin.left -
            margin.right,
        ]);

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(filteredData, (d) => d.avg_cred_score)])
        .range([
          d3.select("#visualization1").node().clientHeight -
            margin.top -
            margin.bottom,
          0,
        ]);

      // Add X axis
      svg1
        .append("g")
        .attr(
          "transform",
          `translate(0,${
            d3.select("#visualization1").node().clientHeight -
            margin.top -
            margin.bottom
          })`
        )
        .call(d3.axisBottom(xScale));

      // Add Y axis
      svg1.append("g").call(d3.axisLeft(yScale));

      // Add dots
      svg1
        .selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale(d.avg_star_rating))
        .attr("cy", (d) => yScale(d.avg_cred_score))
        .attr("r", 5)
        .style("fill", "steelblue")
        .style("opacity", 0.7)
        .append("title") // Add tooltip with author name on hover
        .text((d) => d.author_clean);
    })
    .catch(function (error) {
      console.log("Error loading the CSV file:", error);
    });
}
