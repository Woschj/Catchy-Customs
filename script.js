document.addEventListener("DOMContentLoaded", async () => {
  const REPO_OWNER = "Woschj";
  const REPO_NAME = "Catchy-Customs";
  const DESIGN_FOLDER = "design";
  const MATERIAL_FOLDER = "material"; // Corrected folder path

  const manufacturerSelect = document.getElementById("manufacturer-select");
  const modelSelect = document.getElementById("model-select");
  const designSelect = document.getElementById("design-select");
  const materialSelect = document.getElementById("material-select");
  const previewCanvas = document.getElementById("preview-canvas");
  const ctx = previewCanvas.getContext("2d");

  const CANVAS_WIDTH = 544;
  const CANVAS_HEIGHT = 544;
  previewCanvas.width = CANVAS_WIDTH;
  previewCanvas.height = CANVAS_HEIGHT;

  function populateDropdown(dropdown, items, selectFirst = true) {
    dropdown.innerHTML = "";
    items.forEach((item, index) => {
      const option = document.createElement("option");
      option.value = item.url;
      option.textContent = item.name;
      dropdown.appendChild(option);
    });

    if (selectFirst && items.length > 0) {
      dropdown.selectedIndex = 0;
    }
  }

  async function fetchFolders(folder) {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folder}`
    );
    const folders = await response.json();
    return folders
      .filter((folder) => folder.type === "dir")
      .map((folder) => folder.name);
  }

  async function fetchImages(folder) {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DESIGN_FOLDER}/${folder}`
    );
    const files = await response.json();
    return files
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
      .map((file) => ({
        name: file.name,
        url: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${DESIGN_FOLDER}/${folder}/${file.name}`
      }));
  }

  async function fetchMaterials() {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${MATERIAL_FOLDER}`
    );
    const files = await response.json();
    return files
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
      .map((file) => ({
        name: file.name,
        url: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${MATERIAL_FOLDER}/${file.name}`
      }));
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.crossOrigin = "Anonymous";
      img.src = src;
    });
  }

  async function updatePreview() {
    const selectedDesign = designSelect.value;
    const selectedMaterial = materialSelect.value;

    if (selectedDesign) {
      try {
        const designImg = await loadImage(selectedDesign);
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        const canvasRatio = previewCanvas.width / previewCanvas.height;
        const imageRatio = designImg.width / designImg.height;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasRatio > imageRatio) {
          drawHeight = previewCanvas.height;
          drawWidth = drawHeight * imageRatio;
          offsetX = (previewCanvas.width - drawWidth) / 2;
          offsetY = 0;
        } else {
          drawWidth = previewCanvas.width;
          drawHeight = drawWidth / imageRatio;
          offsetX = 0;
          offsetY = (previewCanvas.height - drawHeight) / 2;
        }

        ctx.drawImage(designImg, offsetX, offsetY, drawWidth, drawHeight);

        if (selectedMaterial && selectedMaterial !== "No Material") {
          try {
            const materialImg = await loadImage(selectedMaterial);
            const designData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
            const materialCanvas = document.createElement("canvas");
            const materialCtx = materialCanvas.getContext("2d");
            materialCanvas.width = previewCanvas.width;
            materialCanvas.height = previewCanvas.height;
            materialCtx.drawImage(materialImg, offsetX, offsetY, drawWidth, drawHeight);
            const materialData = materialCtx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);

            for (let i = 0; i < designData.data.length; i += 4) {
              const r = designData.data[i];
              const g = designData.data[i + 1];
              const b = designData.data[i + 2];
              const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

              if (brightness < 128) { // Dark pixel
                const alpha = brightness / 255;

                designData.data[i] = designData.data[i] * alpha + materialData.data[i] * (1 - alpha);
                designData.data[i + 1] = designData.data[i + 1] * alpha + materialData.data[i + 1] * (1 - alpha);
                designData.data[i + 2] = designData.data[i + 2] * alpha + materialData.data[i + 2] * (1 - alpha);
              }
            }

            ctx.putImageData(designData, 0, 0);
          } catch (err) {
            console.error("Error loading material image:", err);
          }
        }
      } catch (err) {
        console.error("Error loading design image:", err);
      }
    }
  }

  async function handleManufacturerChange() {
    const selectedManufacturer = manufacturerSelect.value;
    if (selectedManufacturer && selectedManufacturer !== "Select Manufacturer") {
      const images = await fetchImages(selectedManufacturer);
      const models = [...new Set(images.map((image) => image.name.split("_")[0]))];
      populateDropdown(
        modelSelect,
        models.map((model) => ({ name: model, url: model }))
      );

      if (models.length > 0) {
        modelSelect.value = models[0].url;
        await handleModelChange(); // Fetch and populate designs
      }
    }
  }

  async function handleModelChange() {
    const selectedManufacturer = manufacturerSelect.value;
    const selectedModel = modelSelect.value;
    if (selectedManufacturer && selectedModel) {
      const images = await fetchImages(selectedManufacturer);
      const designs = images
        .filter((image) => image.name.startsWith(selectedModel))
        .map((image) => ({
          name: image.name.split("_")[1],
          url: image.url
        }));
      populateDropdown(designSelect, designs);

      if (designs.length > 0) {
        designSelect.value = designs[0].url;
        updatePreview();
      }
    }
  }

  manufacturerSelect.addEventListener("change", handleManufacturerChange);
  modelSelect.addEventListener("change", handleModelChange);

  const manufacturers = await fetchFolders(DESIGN_FOLDER);
  populateDropdown(
    manufacturerSelect,
    manufacturers.map((manufacturer) => ({
      name: manufacturer,
      url: manufacturer
    })),
    false
  );
  manufacturerSelect.value = "Select Manufacturer";

  const materials = await fetchMaterials();
  populateDropdown(materialSelect, materials);
  materialSelect.insertAdjacentHTML(
    "afterbegin",
    '<option value="No Material" selected>No Material</option>'
  );

  designSelect.addEventListener("change", updatePreview);
  materialSelect.addEventListener("change", updatePreview);

  // Initial preview update if necessary
  if (designSelect.options.length > 0 && modelSelect.options.length > 0) {
    updatePreview();
  }
});
