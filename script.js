// Initialize scrollama for each section
function initScrollama() {
  // Get all scrolly sections
  const scrollySections = document.querySelectorAll(".scrolly");

  // Initialize scrollama for each section
  scrollySections.forEach((section) => {
    const id = section.id;
    const figure = section.querySelector("figure");
    const article = section.querySelector("article");
    const steps = article.querySelectorAll(".step");
    const svg = figure.querySelector("svg");

    // Initialize scrollama
    const scroller = scrollama();

    // Handle resize
    function handleResize() {
      // Set step height
      const stepHeight = Math.floor(window.innerHeight * 0.75);
      steps.forEach((step) => {
        step.style.height = `${stepHeight}px`;
      });

      // Set figure height and position
      const figureHeight = window.innerHeight * 0.8;
      figure.style.height = `${figureHeight}px`;

      // Resize scrollama
      scroller.resize();
    }

    // Handle step enter
    function handleStepEnter(response) {
      // Update active step
      steps.forEach((step, i) => {
        step.classList.toggle("is-active", i === response.index);
      });

      // Update visualization based on the current section and step
      updateVisualization(id, response.index + 1, svg);
    }

    // Set up scrollama
    scroller
      .setup({
        step: `#${id} .step`,
        offset: 0.5,
        debug: false,
      })
      .onStepEnter(handleStepEnter);

    // Handle resize
    handleResize();
    window.addEventListener("resize", handleResize);
  });
}

// Function to update visualizations (placeholder for future D3 implementations)
function updateVisualization(sectionId, stepIndex, svg) {
  console.log(`Updating visualization for ${sectionId}, step ${stepIndex}`);

  // Clear the SVG
  d3.select(svg).selectAll("*").remove();

  // Add a text label (placeholder for actual visualizations)
  d3.select(svg)
    .append("text")
    .attr("x", "50%")
    .attr("y", "50%")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", "2em")
    .style("fill", "#333")
    .text(`${sectionId.replace("scrolly-", "")}: Step ${stepIndex}`);
}

// Initialize everything when the page loads
document.addEventListener("DOMContentLoaded", function () {
  initScrollama();
});
