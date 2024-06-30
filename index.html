<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Image Customizer</title>
  <style>
    #preview-canvas {
      border: 1px solid black;
    }
    #controls {
      display: flex;
      flex-direction: column;
      margin-top: 20px;
    }
    #controls label, #controls select, #controls input, #controls button {
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <h1>Image Customizer</h1>
  <div id="controls">
    <label for="manufacturer-select">Manufacturer:</label>
    <select id="manufacturer-select"></select>
    
    <label for="model-select">Model:</label>
    <select id="model-select"></select>
    
    <label for="design-select">Design:</label>
    <select id="design-select"></select>
    
    <label for="material-select">Material:</label>
    <select id="material-select"></select>
    
    <label for="custom-upload">Upload Custom Image:</label>
    <input type="file" id="custom-upload" accept="image/*">
    
    <button id="apply-custom">Apply Custom Image</button>
  </div>
  <canvas id="preview-canvas"></canvas>
  
  <script>
    document.addEventListener("DOMContentLoaded", async () => {
      const REPO_OWNER = "Woschj";
      const REPO_NAME = "Catchy-Customs";
      const DESIGN_FOLDER = "design";
      const MATERIAL_FOLDER = "material"; // Corrected folder path

      const manufacturerSelect = document.getElementById("manufacturer-select");
      const modelSelect = document.getElementById("model-select");
      const designSelect = document.getElementById("design-select");
      const materialSelect = document.getElementById("material-select");
      const customUpload = document.getElementById("custom-upload");
      const applyCustomButton = document.getElementById("apply-custom");
      const previewCanvas = document.getElementById("preview-canvas");
      const ctx = previewCanvas.getContext("2d");

      const CANVAS_WIDTH = 544;
      const CANVAS_HEIGHT = 544;
      previewCanvas.width = CANVAS_WIDTH;
      previewCanvas.height = CANVAS_HEIGHT;

      let customImage = null;
      let customImageApplied = false;

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

                const threshold = 100; // Adjust the threshold for dark areas

                for (let i = 0; i < designData.data.length; i += 4) {
                  const r = designData.data[i];
                  const g = designData.data[i + 1];
                  const b = designData.data[i + 2];
                  const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

                  if (brightness < threshold) { // Apply material only on darkest pixels
                    designData.data[i] = materialData.data[i];
                    designData.data[i + 1] = materialData.data[i + 1];
                    designData.data[i + 2] = materialData.data[i + 2];
                  }
                }

                ctx.putImageData(designData, 0, 0);
              } catch (err) {
                console.error("Error loading material image:", err);
              }
            }

            if (customImage && !customImageApplied) {
              ctx.drawImage(customImage.img, customImage.x, customImage.y, customImage.width, customImage.height);
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

      customUpload.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          const img = await loadImage(url);
          const scale = Math.min(previewCanvas.width / img.width, previewCanvas.height / img.height);
          customImage = {
            img,
            x: (previewCanvas.width - img.width * scale) / 2,
            y: (previewCanvas.height - img.height * scale) / 2,
            width: img.width * scale,
            height: img.height * scale
          };
          customImageApplied = false;
          updatePreview();
        }
      });

      previewCanvas.addEventListener("mousedown", (event) => {
        const rect = previewCanvas.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;

        if (customImage) {
          customImage.offsetX = offsetX - customImage.x;
          customImage.offsetY = offsetY - customImage.y;
          customImage.dragging = true;
        }
      });

      previewCanvas.addEventListener("mousemove", (event) => {
        if (customImage && customImage.dragging) {
          const rect = previewCanvas.getBoundingClientRect();
          const offsetX = event.clientX - rect.left;
          const offsetY = event.clientY - rect.top;

          customImage.x = offsetX - customImage.offsetX;
          customImage.y = offsetY - customImage.offsetY;

          updatePreview();
        }
      });

      previewCanvas.addEventListener("mouseup", () => {
        if (customImage) {
          customImage.dragging = false;
        }
      });

      previewCanvas.addEventListener("wheel", (event) => {
        if (customImage) {
          const delta = event.deltaY < 0 ? 1.1 : 0.9;
          customImage.width *= delta;
          customImage.height *= delta;

          updatePreview();
        }
      });

      applyCustomButton.addEventListener("click", () => {
        if (customImage) {
          const selectedDesign = designSelect.value;
          if (selectedDesign) {
            loadImage(selectedDesign).then((designImg) => {
              const designCanvas = document.createElement("canvas");
              const designCtx = designCanvas.getContext("2d");
              designCanvas.width = previewCanvas.width;
              designCanvas.height = previewCanvas.height;
              designCtx.drawImage(designImg, 0, 0, previewCanvas.width, previewCanvas.height);

              const designData = designCtx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
              const customData = ctx.getImageData(customImage.x, customImage.y, customImage.width, customImage.height);
              const blendedData = new ImageData(customImage.width, customImage.height);

              const threshold = 100; // Adjust the threshold for dark areas

              for (let i = 0; i < customData.data.length; i += 4) {
                const r = designData.data[i];
                const g = designData.data[i + 1];
                const b = designData.data[i + 2];
                const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

                if (brightness < threshold) { // Apply custom image only on dark pixels
                  blendedData.data[i] = customData.data[i];
                  blendedData.data[i + 1] = customData.data[i + 1];
                  blendedData.data[i + 2] = customData.data[i + 2];
                  blendedData.data[i + 3] = customData.data[i + 3]; // Retain alpha value
                } else {
                  blendedData.data[i + 3] = 0; // Make non-dark areas fully transparent
                }
              }

              ctx.putImageData(blendedData, customImage.x, customImage.y);
              customImageApplied = true;
            }).catch((err) => {
              console.error("Error loading design image for masking:", err);
            });
          }
        }
      });

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
  </script>
</body>
</html>
