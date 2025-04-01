// Create a stacked area chart showing problem origin (INTERNAL vs EXTERNAL) over time
function createVisualization3() {
  // Set dimensions and margins
  const margin = { top: 40, right: 100, bottom: 60, left: 60 };
  const containerWidth = document.getElementById("visualization3").clientWidth;
  const containerHeight =
    document.getElementById("visualization3").clientHeight;
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;

  // Colors for the two categories
  const colors = {
    INTERNAL: "#4daf4a", // Green
    EXTERNAL: "#377eb8", // Blue
  };

  // Create the SVG container
  const svg3 = d3
    .select("#visualization3")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Add a title to the visualization
  svg3
    .append("text")
    .attr("x", width / 2)
    .attr("y", -15)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Self-Help Book Problem Origins Over Time (Internal vs. External)");

  // Load and process the data
  d3.csv("all_self_help.csv")
    .then((data) => {
      // Filter out rows missing year_published or problem_origin
      data = data.filter(
        (d) =>
          d.year_published &&
          d.problem_origin &&
          (d.problem_origin === "INTERNAL" || d.problem_origin === "EXTERNAL")
      );

      // Group data by year and count INTERNAL vs EXTERNAL
      const dataByYear = d3.group(data, (d) => d.year_published);

      // Create an array with year, internal count, external count, and percentages
      const processedData = Array.from(dataByYear, ([year, books]) => {
        const internalCount = books.filter(
          (b) => b.problem_origin === "INTERNAL"
        ).length;
        const externalCount = books.filter(
          (b) => b.problem_origin === "EXTERNAL"
        ).length;
        const total = internalCount + externalCount;

        return {
          year: +year,
          INTERNAL: internalCount,
          EXTERNAL: externalCount,
          internalPercentage: internalCount / total,
          externalPercentage: externalCount / total,
          total: total,
        };
      });

      // Sort by year
      processedData.sort((a, b) => a.year - b.year);

      // Filter out years with too few books (optional)
      const minBooksPerYear = 3; // Minimum number of books required for a year to be included
      const filteredData = processedData.filter(
        (d) => d.total >= minBooksPerYear
      );

      // Prepare data for stacked area chart
      const stackedData = [
        filteredData.map((d) => ({
          year: d.year,
          value: d.internalPercentage,
          category: "INTERNAL",
        })),
        filteredData.map((d) => ({
          year: d.year,
          value: d.externalPercentage,
          category: "EXTERNAL",
        })),
      ].flat();

      // Format data for d3.stack()
      const stackKeys = ["INTERNAL", "EXTERNAL"];
      const years = [...new Set(stackedData.map((d) => d.year))];

      const pivotedData = years.map((year) => {
        const yearData = { year };
        stackKeys.forEach((key) => {
          const entry = stackedData.find(
            (d) => d.year === year && d.category === key
          );
          yearData[key] = entry ? entry.value : 0;
        });
        return yearData;
      });

      // Create the stack generator
      const stack = d3
        .stack()
        .keys(stackKeys)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetExpand); // Use expand to show percentages

      const series = stack(pivotedData);

      // Create scales
      const xScale = d3
        .scaleLinear()
        .domain(d3.extent(pivotedData, (d) => d.year))
        .range([0, width]);

      const yScale = d3
        .scaleLinear()
        .domain([0, 1]) // For percentages
        .range([height, 0]);

      // Create a color scale
      const colorScale = d3
        .scaleOrdinal()
        .domain(stackKeys)
        .range([colors.INTERNAL, colors.EXTERNAL]);

      // Create and add the x-axis
      const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")); // Format as integers for years

      svg3
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);

      // Add x-axis label
      svg3
        .append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .text("Year Published");

      // Create and add the y-axis
      const yAxis = d3.axisLeft(yScale).tickFormat(d3.format(".0%")); // Format as percentages

      svg3.append("g").attr("class", "y-axis").call(yAxis);

      // Add y-axis label
      svg3
        .append("text")
        .attr("class", "y-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .text("Percentage of Books");

      // Create the area generator
      const area = d3
        .area()
        .x((d) => xScale(d.data.year))
        .y0((d) => yScale(d[0]))
        .y1((d) => yScale(d[1]))
        .curve(d3.curveMonotoneX); // Use a smoother curve

      // Add the areas
      svg3
        .selectAll(".area")
        .data(series)
        .join("path")
        .attr("class", "area")
        .attr("d", area)
        .attr("fill", (d) => colorScale(d.key))
        .attr("opacity", 0.8)
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5);

      // Add a legend
      const legend = svg3
        .append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width + 10}, 0)`);

      // Add legend items
      stackKeys.forEach((key, i) => {
        const legendItem = legend
          .append("g")
          .attr("transform", `translate(0, ${i * 25})`);

        legendItem
          .append("rect")
          .attr("width", 18)
          .attr("height", 18)
          .attr("fill", colorScale(key));

        legendItem
          .append("text")
          .attr("x", 24)
          .attr("y", 9)
          .attr("dy", "0.35em")
          .text(key);
      });

      // Add tooltip
      const tooltip = d3
        .select("#visualization3")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "4px")
        .style("padding", "10px")
        .style("pointer-events", "none");

      // Add a vertical line to show specific year data
      const focusLine = svg3
        .append("line")
        .attr("class", "focus-line")
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3")
        .style("opacity", 0);

      // Add invisible overlay for mouse events
      svg3
        .append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", () => {
          focusLine.style("opacity", 1);
          tooltip.style("opacity", 1);
        })
        .on("mouseout", () => {
          focusLine.style("opacity", 0);
          tooltip.style("opacity", 0);
        })
        .on("mousemove", function (event) {
          const [mouseX] = d3.pointer(event);
          const year = Math.round(xScale.invert(mouseX));
          const yearData = pivotedData.find((d) => d.year === year);

          if (yearData) {
            focusLine.attr("x1", xScale(year)).attr("x2", xScale(year));

            tooltip
              .html(
                `<strong>Year:</strong> ${year}<br>
                       <strong>Internal:</strong> ${d3.format(".1%")(
                         yearData.INTERNAL
                       )}<br>
                       <strong>External:</strong> ${d3.format(".1%")(
                         yearData.EXTERNAL
                       )}`
              )
              .style("left", event.pageX + 15 + "px")
              .style("top", event.pageY - 30 + "px");
          }
        });
    })
    .catch((error) => {
      console.error("Error loading or processing data:", error);
      svg3
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("fill", "red")
        .text("Error loading data. Check console for details.");
    });
}
