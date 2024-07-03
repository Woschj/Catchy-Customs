document.addEventListener("DOMContentLoaded", async () => {
  const REPO_OWNER = "Woschj";
  const REPO_NAME = "Catchy-Customs";
  const DESIGN_FOLDER = "design";
  const MATERIAL_FOLDER = "material";

  const manufacturerSelect = document.getElementById("manufacturer-select");
  const modelSelect = document.getElementById("model-select");
  const designSelect = document.getElementById("design-select");
  const materialSelect = document.getElementById("material-select");
  const customImageUpload = document.getElementById("custom-image-upload");
  const stampButton = document.getElementById("stamp-image");
  const zoomInButton = document.getElementById("zoomIn");
  const zoomOutButton = document.getElementById("zoomOut");
  const exportButton = document.getElementById("export-image");
  const removeBackgroundButton = document.getElementById("remove-background");
  const previewCanvas = document.getElementById("preview-canvas");
  const ctx = previewCanvas.getContext("2d");

  const CANVAS_WIDTH = 544;
  const CANVAS_HEIGHT = 544;
  previewCanvas.width = CANVAS_WIDTH;
  previewCanvas.height = CANVAS_HEIGHT;

  let customImageFile = null;
  let customImagePreview = null;
  let isDragging = false;
  let offset = { x: 0, y: 0 };
  let scale = 1;
  let customImagePosition = { x: 0, y: 0 };
  let stampedImages = [];
  let removeBackground = false;

  function populateDropdown(dropdown, items, selectFirst = true) {
    dropdown.innerHTML = "";
    items.forEach((item, index) => {
      const option = document.createElement("option");
      option.value = item.url;
      option.textContent = item.name.replace(/\.[^/.]+$/, ""); // Remove file extension
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
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        url:
          file.name === "Nichts"
            ? ""
            : `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${MATERIAL_FOLDER}/${file.name}`
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

  async function handleManufacturerChange() {
    const selectedManufacturer = manufacturerSelect.value;
    if (
      selectedManufacturer &&
      selectedManufacturer !== "Select Manufacturer"
    ) {
      const images = await fetchImages(selectedManufacturer);
      const models = [
        ...new Set(images.map((image) => image.name.split("_")[0]))
      ];
      populateDropdown(
        modelSelect,
        models.map((model) => ({ name: model, url: model }))
      );

      if (models.length > 0) {
        modelSelect.value = models[0].url;
        await handleModelChange();
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
          name: image.name.split("_")[1].replace(/\.[^/.]+$/, ""), // Remove file extension
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
  materialSelect.value = materials.find(
    (material) => material.name === "Nichts"
  ).url;

  designSelect.addEventListener("change", updatePreview);
  materialSelect.addEventListener("change", updatePreview);

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

        if (selectedMaterial) {
          const materialImg = await loadImage(selectedMaterial);
          const materialCanvas = document.createElement("canvas");
          const materialCtx = materialCanvas.getContext("2d");
          materialCanvas.width = drawWidth;
          materialCanvas.height = drawHeight;
          materialCtx.drawImage(materialImg, 0, 0, drawWidth, drawHeight);
          const materialData = materialCtx.getImageData(
            0,
            0,
            drawWidth,
            drawHeight
          );

          const designData = ctx.getImageData(
            offsetX,
            offsetY,
            drawWidth,
            drawHeight
          );
          const grayscaleData = createGrayscaleImage(designData);

          for (let i = 0; i < designData.data.length; i += 4) {
            const alpha = designData.data[i + 3] / 255;
            const designLuminance = grayscaleData.data[i] / 255;
            const materialR = materialData.data[i];
            const materialG = materialData.data[i + 1];
            const materialB = materialData.data[i + 2];

            if (designLuminance < 0.5) {
              designData.data[i] =
                designLuminance * materialR * 1.5 + designData.data[i] * 0.5;
              designData.data[i + 1] =
                designLuminance * materialG * 1.5 +
                designData.data[i + 1] * 0.5;
              designData.data[i + 2] =
                designLuminance * materialB * 1.5 +
                designData.data[i + 2] * 0.5;
            }
          }

          ctx.putImageData(designData, offsetX, offsetY);
        }

        if (customImagePreview) {
          drawCustomImage();
        }

        stampedImages.forEach((img) => {
          ctx.drawImage(
            img.image,
            img.position.x,
            img.position.y,
            img.width,
            img.height
          );
        });
      } catch (err) {
        console.error("Fehler beim Laden des Designbilds:", err);
      }
    }
  }

  function createGrayscaleImage(imageData) {
    const grayscaleData = new Uint8ClampedArray(imageData.data.length);

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const grayscale = 0.299 * r + 0.587 * g + 0.114 * b;

      grayscaleData[i] = grayscale;
      grayscaleData[i + 1] = grayscale;
      grayscaleData[i + 2] = grayscale;
      grayscaleData[i + 3] = imageData.data[i + 3]; // Preserve alpha
    }

    return new ImageData(grayscaleData, imageData.width, imageData.height);
  }

  customImageUpload.addEventListener("change", handleCustomImageUpload);
  stampButton.addEventListener("click", stampImage);
  zoomInButton.addEventListener("click", zoomIn);
  zoomOutButton.addEventListener("click", zoomOut);
  exportButton.addEventListener("click", exportImage);
  removeBackgroundButton.addEventListener("click", toggleRemoveBackground);

  function handleCustomImageUpload(event) {
    customImageFile = event.target.files[0];
    if (customImageFile) {
      const customImageUrl = URL.createObjectURL(customImageFile);
      customImagePreview = new Image();
      customImagePreview.src = customImageUrl;

      customImagePreview.onload = () => {
        updatePreview();
      };
    }
  }

  function drawCustomImage() {
    const canvas = document.getElementById("preview-canvas");
    const ctx = canvas.getContext("2d");

    const canvasRatio = canvas.width / canvas.height;
    const imageRatio = customImagePreview.width / customImagePreview.height;
    let drawWidth, drawHeight;

    if (canvasRatio > imageRatio) {
      drawHeight = canvas.height * scale;
      drawWidth = drawHeight * imageRatio;
    } else {
      drawWidth = canvas.width * scale;
      drawHeight = drawWidth / imageRatio;
    }

    if (removeBackground) {
      const customImageCanvas = document.createElement("canvas");
      const customImageCtx = customImageCanvas.getContext("2d");
      customImageCanvas.width = customImagePreview.width;
      customImageCanvas.height = customImagePreview.height;
      customImageCtx.drawImage(customImagePreview, 0, 0);

      const customImageData = customImageCtx.getImageData(
        0,
        0,
        customImagePreview.width,
        customImagePreview.height
      );
      const bgColor = customImageData.data.slice(0, 4);

      for (let i = 0; i < customImageData.data.length; i += 4) {
        if (
          Math.abs(customImageData.data[i] - bgColor[0]) < 30 &&
          Math.abs(customImageData.data[i + 1] - bgColor[1]) < 30 &&
          Math.abs(customImageData.data[i + 2] - bgColor[2]) < 30
        ) {
          customImageData.data[i + 3] = 0; // Make the pixel transparent
        }
      }

      customImageCtx.putImageData(customImageData, 0, 0);

      ctx.globalAlpha = 0.5;
      ctx.drawImage(
        customImageCanvas,
        customImagePosition.x,
        customImagePosition.y,
        drawWidth,
        drawHeight
      );
      ctx.globalAlpha = 1.0;
    } else {
      ctx.globalAlpha = 0.5;
      ctx.drawImage(
        customImagePreview,
        customImagePosition.x,
        customImagePosition.y,
        drawWidth,
        drawHeight
      );
      ctx.globalAlpha = 1.0;
    }
  }

  function startDrag(event) {
    isDragging = true;
    offset.x = event.offsetX - customImagePosition.x;
    offset.y = event.offsetY - customImagePosition.y;
  }

  function drag(event) {
    if (isDragging) {
      const canvas = document.getElementById("preview-canvas");
      const ctx = canvas.getContext("2d");

      customImagePosition.x = event.offsetX - offset.x;
      customImagePosition.y = event.offsetY - offset.y;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      updatePreview();
      drawCustomImage();
    }
  }

  function endDrag(event) {
    isDragging = false;
  }

  function zoomIn() {
    scale += 0.1;
    updatePreview();
  }

  function zoomOut() {
    scale -= 0.1;
    if (scale < 0.1) {
      scale = 0.1;
    }
    updatePreview();
  }

  function stampImage() {
    if (customImagePreview) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = customImagePreview.width;
      canvas.height = customImagePreview.height;
      ctx.drawImage(customImagePreview, 0, 0);

      if (removeBackground) {
        const customImageData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const bgColor = customImageData.data.slice(0, 4);

        for (let i = 0; i < customImageData.data.length; i += 4) {
          if (
            Math.abs(customImageData.data[i] - bgColor[0]) < 30 &&
            Math.abs(customImageData.data[i + 1] - bgColor[1]) < 30 &&
            Math.abs(customImageData.data[i + 2] - bgColor[2]) < 30
          ) {
            customImageData.data[i + 3] = 0; // Make the pixel transparent
          }
        }

        ctx.putImageData(customImageData, 0, 0);
      }

      const stampedImage = {
        image: canvas,
        position: { ...customImagePosition },
        width: customImagePreview.width * scale,
        height: customImagePreview.height * scale,
        filename: customImageFile.name // Store the filename
      };

      stampedImages.push(stampedImage);
      customImagePreview = null; // Reset custom image to allow adding new images
      customImageUpload.value = ""; // Reset file input
      updatePreview();
      updateImageList();
    }
  }

  function updateImageList() {
    const imageList = document.getElementById("image-list");
    imageList.innerHTML = "";
    stampedImages.forEach((img, index) => {
      const listItem = document.createElement("li");
      listItem.textContent = img.filename; // Display the filename
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Löschen";
      deleteButton.addEventListener("click", () => {
        stampedImages.splice(index, 1);
        updatePreview();
        updateImageList();
      });
      listItem.appendChild(deleteButton);
      imageList.appendChild(listItem);
    });
  }

  function exportImage() {
    const canvas = document.getElementById("preview-canvas");
    const link = document.createElement("a");
    link.download = "custom-case.jpg";
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  }

  function toggleRemoveBackground() {
    removeBackground = !removeBackground;
    removeBackgroundButton.textContent = removeBackground
      ? "Hintergrund beibehalten"
      : "Hintergrund entfernen";
    updatePreview();
  }

  previewCanvas.addEventListener("mousedown", startDrag);
  previewCanvas.addEventListener("mousemove", drag);
  previewCanvas.addEventListener("mouseup", endDrag);
  previewCanvas.addEventListener("mouseleave", endDrag);
});
