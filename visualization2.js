// Create the second visualization: 3D scatter plot using D3.js and THREE.js
function createVisualization2() {
  // Container dimensions
  const container = document.getElementById("visualization2");
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Create scene, camera, and renderer
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 2.5;
  camera.position.x = 1;
  camera.position.y = 1;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  // Add orbit controls for interaction
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xcccccc, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // Add axes
  const axesHelper = new THREE.AxesHelper(1.5);
  scene.add(axesHelper);

  // Add axes labels
  const createTextLabel = (text, position, color) => {
    const div = document.createElement("div");
    div.className = "axis-label";
    div.textContent = text;
    div.style.position = "absolute";
    div.style.color = color;
    div.style.fontSize = "14px";
    div.style.fontWeight = "bold";
    div.style.fontFamily = "Arial";
    div.style.pointerEvents = "none";
    container.appendChild(div);

    return {
      element: div,
      position: position,
      update: function () {
        const vector = new THREE.Vector3(
          this.position.x,
          this.position.y,
          this.position.z
        );
        vector.project(camera);

        const x = (vector.x * width) / 2 + width / 2;
        const y = -((vector.y * height) / 2) + height / 2;

        this.element.style.left = x + "px";
        this.element.style.top = y + "px";
      },
    };
  };

  const xLabel = createTextLabel(
    "Avg Star Rating (log)",
    new THREE.Vector3(1.6, 0, 0),
    "#ff0000"
  );
  const yLabel = createTextLabel(
    "Avg Cred Score",
    new THREE.Vector3(0, 1.6, 0),
    "#00ff00"
  );
  const zLabel = createTextLabel(
    "Author Followers (log)",
    new THREE.Vector3(0, 0, 1.6),
    "#0000ff"
  );

  const labels = [xLabel, yLabel, zLabel];

  // Load and process data
  d3.csv("author_analysis_20250327_143844 copy.csv")
    .then(function (data) {
      // Filter out records without required data
      const filteredData = data.filter(
        (d) =>
          d.avg_star_rating &&
          d.avg_cred_score &&
          d.author_num_followers &&
          !isNaN(+d.avg_star_rating) &&
          !isNaN(+d.avg_cred_score) &&
          !isNaN(+d.author_num_followers)
      );

      // Convert string values to numbers
      filteredData.forEach((d) => {
        d.avg_star_rating = +d.avg_star_rating;
        d.avg_cred_score = +d.avg_cred_score;
        d.author_num_followers = +d.author_num_followers;
      });

      // Create scales with log scales for star rating and followers
      const xScale = d3
        .scaleLog()
        .domain([
          Math.max(
            0.1,
            d3.min(filteredData, (d) => d.avg_star_rating)
          ),
          d3.max(filteredData, (d) => d.avg_star_rating),
        ])
        .range([-1, 1]);

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(filteredData, (d) => d.avg_cred_score)])
        .range([-1, 1]);

      const zScale = d3
        .scaleLog()
        .domain([
          Math.max(
            1,
            d3.min(filteredData, (d) => d.author_num_followers)
          ),
          d3.max(filteredData, (d) => d.author_num_followers),
        ])
        .range([-1, 1]);

      // Color scale based on credibility score
      const colorScale = d3
        .scaleSequential(d3.interpolateViridis)
        .domain([0, d3.max(filteredData, (d) => d.avg_cred_score)]);

      // Size scale based on number of followers
      const sizeScale = d3
        .scaleLog()
        .domain([
          Math.max(
            1,
            d3.min(filteredData, (d) => d.author_num_followers)
          ),
          d3.max(filteredData, (d) => d.author_num_followers),
        ])
        .range([0.01, 0.05]);

      // Create a group to hold all points
      const pointsGroup = new THREE.Group();
      scene.add(pointsGroup);

      // Add data points
      filteredData.forEach((d) => {
        try {
          const x = xScale(Math.max(0.1, d.avg_star_rating));
          const y = yScale(d.avg_cred_score);
          const z = zScale(Math.max(1, d.author_num_followers));

          const geometry = new THREE.SphereGeometry(
            sizeScale(Math.max(1, d.author_num_followers)),
            16,
            16
          );
          const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(colorScale(d.avg_cred_score)),
            transparent: true,
            opacity: 0.7,
          });

          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.set(x, y, z);
          sphere.userData = {
            data: d,
            originalColor: colorScale(d.avg_cred_score),
          };

          pointsGroup.add(sphere);
        } catch (err) {
          console.log("Error with data point:", d, err);
        }
      });

      // Add hover interaction using raycaster
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      let hoveredObject = null;

      // Add tooltip
      const tooltip = document.createElement("div");
      tooltip.style.position = "absolute";
      tooltip.style.padding = "10px";
      tooltip.style.background = "rgba(0,0,0,0.7)";
      tooltip.style.color = "white";
      tooltip.style.borderRadius = "5px";
      tooltip.style.pointerEvents = "none";
      tooltip.style.display = "none";
      tooltip.style.zIndex = "100";
      container.appendChild(tooltip);

      renderer.domElement.addEventListener("mousemove", (event) => {
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.offsetX / width) * 2 - 1;
        mouse.y = -(event.offsetY / height) * 2 + 1;

        // Update tooltip position
        tooltip.style.left = event.offsetX + 10 + "px";
        tooltip.style.top = event.offsetY + 10 + "px";
      });

      // Animation loop
      function animate() {
        requestAnimationFrame(animate);

        // Update controls
        controls.update();

        // Update axis labels
        labels.forEach((label) => label.update());

        // Raycasting for hover effects
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(pointsGroup.children);

        // Reset previously hovered object
        if (
          hoveredObject &&
          (!intersects.length || hoveredObject !== intersects[0].object)
        ) {
          hoveredObject.material.color.set(
            hoveredObject.userData.originalColor
          );
          hoveredObject.scale.set(1, 1, 1);
          hoveredObject = null;
          tooltip.style.display = "none";
        }

        // Handle new hover
        if (intersects.length && hoveredObject !== intersects[0].object) {
          hoveredObject = intersects[0].object;
          hoveredObject.material.color.set(0xffff00);
          hoveredObject.scale.set(1.2, 1.2, 1.2);

          const data = hoveredObject.userData.data;
          tooltip.innerHTML = `
          <strong>${data.author_clean}</strong><br>
          Star Rating: ${data.avg_star_rating.toFixed(2)}<br>
          Cred Score: ${data.avg_cred_score.toFixed(2)}<br>
          Followers: ${data.author_num_followers.toLocaleString()}
        `;
          tooltip.style.display = "block";
        }

        renderer.render(scene, camera);
      }

      animate();

      // Handle window resize
      window.addEventListener("resize", () => {
        const width = container.clientWidth;
        const height = container.clientHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
      });
    })
    .catch(function (error) {
      console.log("Error loading the CSV file:", error);
      container.innerHTML = `<div class="error">Error loading data: ${error.message}</div>`;
    });
}
