document.addEventListener("DOMContentLoaded", async () => {
  const REPO_OWNER = "Woschj";
  const REPO_NAME = "Catchy-Customs";
  const DESIGN_FOLDER = "design";
  const MATERIAL_FOLDER = "material";
  const STAMP_FOLDER = "stamps"; // New folder for stamps
  const CANVAS_WIDTH = 544;
  const CANVAS_HEIGHT = 544;

  const manufacturerSelect = document.getElementById("manufacturer-select");
  const modelSelect = document.getElementById("model-select");
  const designSelect = document.getElementById("design-select");
  const materialSelect = document.getElementById("material-select");
  const stampSelect = document.getElementById("stamp-select"); // New stamp dropdown
  const customImageUpload = document.getElementById("custom-image-upload");
  const stampButton = document.getElementById("stamp-image");
  const zoomInButton = document.getElementById("zoomIn");
  const zoomOutButton = document.getElementById("zoomOut");
  const exportButton = document.getElementById("export-image");
  const removeBackgroundButton = document.getElementById("remove-background");
  const previewCanvas = document.getElementById("preview-canvas");
  const ctx = previewCanvas.getContext("2d");
  const colorPicker = document.getElementById("color-picker");
  const toleranceSlider = document.getElementById("tolerance-slider");
  const stampList = document.getElementById("stamp-list");
  const colorPickerPreview = document.getElementById("color-picker-preview");

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
  let designBounds = { x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  let darkAreaBounds = { x: 0, y: 0, width: 0, height: 0 };
  let selectedColor = colorPicker.value;
  let tolerance = toleranceSlider.value;
  let selectedStampIndex = -1;

  function populateDropdown(dropdown, items, selectFirst = true) {
    dropdown.innerHTML = "";
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.url;
      option.textContent = item.name.replace(/\.[^/.]+$/, "");
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
        name: file.name.replace(/\.[^/.]+$/, ""),
        url:
          file.name === "Nichts"
            ? ""
            : `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${MATERIAL_FOLDER}/${file.name}`
      }));
  }

  async function fetchStamps() {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${STAMP_FOLDER}`
    );
    const files = await response.json();
    return files
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
      .map((file) => ({
        name: file.name,
        url: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${STAMP_FOLDER}/${file.name}`
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
          name: image.name.split("_")[1].replace(/\.[^/.]+$/, ""),
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

  const stamps = await fetchStamps(); // Fetch stamps
  populateDropdown(stampSelect, stamps); // Populate stamp dropdown

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

        designBounds = {
          x: offsetX,
          y: offsetY,
          width: drawWidth,
          height: drawHeight
        };

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

        stampedImages.forEach(
          ({ image, position, width, height, color, tolerance }, index) => {
            if (index === selectedStampIndex) {
              drawCustomImage(image, position, width, height, color, tolerance);
            } else {
              ctx.drawImage(image, position.x, position.y, width, height);
            }
          }
        );

        if (customImagePreview && selectedStampIndex === -1) {
          drawCustomImage();
        }

        calculateDarkAreaBounds();
      } catch (error) {
        console.error("Error loading images:", error);
      }
    }
  }

  function createGrayscaleImage(imageData) {
    const grayscaleData = new ImageData(imageData.width, imageData.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const alpha = imageData.data[i + 3];
      const grayscale = 0.299 * r + 0.587 * g + 0.114 * b;
      grayscaleData.data[i] = grayscale;
      grayscaleData.data[i + 1] = grayscale;
      grayscaleData.data[i + 2] = grayscale;
      grayscaleData.data[i + 3] = alpha;
    }
    return grayscaleData;
  }

  function calculateDarkAreaBounds() {
    const designData = ctx.getImageData(
      designBounds.x,
      designBounds.y,
      designBounds.width,
      designBounds.height
    );
    const grayscaleData = createGrayscaleImage(designData);

    let minX = designBounds.width;
    let minY = designBounds.height;
    let maxX = 0;
    let maxY = 0;

    for (let i = 0; i < grayscaleData.data.length; i += 4) {
      const luminance = grayscaleData.data[i] / 255;
      if (luminance < 0.5) {
        const x = (i / 4) % designBounds.width;
        const y = Math.floor(i / 4 / designBounds.width);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    darkAreaBounds = {
      x: designBounds.x + minX,
      y: designBounds.y + minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  customImageUpload.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      customImageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        customImagePreview = new Image();
        customImagePreview.onload = () => {
          customImagePosition = {
            x: darkAreaBounds.x,
            y: darkAreaBounds.y
          };
          scaleCustomImage();
          updatePreview();
        };
        customImagePreview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  function scaleCustomImage() {
    const maxWidth = darkAreaBounds.width;
    const maxHeight = darkAreaBounds.height;
    const imageWidth = customImagePreview.width;
    const imageHeight = customImagePreview.height;

    if (imageWidth > maxWidth || imageHeight > maxHeight) {
      const widthRatio = maxWidth / imageWidth;
      const heightRatio = maxHeight / imageHeight;
      scale = Math.min(widthRatio, heightRatio);
    } else {
      scale = 1;
    }
  }

  previewCanvas.addEventListener("mousedown", (event) => {
    if (customImagePreview) {
      const { x, y } = getCanvasCoordinates(event);
      if (isInsideCustomImage(x, y)) {
        isDragging = true;
        offset.x = x - customImagePosition.x;
        offset.y = y - customImagePosition.y;
      }
    }
  });

  previewCanvas.addEventListener("mousemove", (event) => {
    if (isDragging) {
      const { x, y } = getCanvasCoordinates(event);
      customImagePosition.x = Math.max(
        darkAreaBounds.x,
        Math.min(
          x - offset.x,
          darkAreaBounds.x +
            darkAreaBounds.width -
            customImagePreview.width * scale
        )
      );
      customImagePosition.y = Math.max(
        darkAreaBounds.y,
        Math.min(
          y - offset.y,
          darkAreaBounds.y +
            darkAreaBounds.height -
            customImagePreview.height * scale
        )
      );
      updatePreview();
    }
  });

  previewCanvas.addEventListener("mouseup", () => {
    isDragging = false;
  });

  previewCanvas.addEventListener("mouseleave", () => {
    isDragging = false;
  });

  function getCanvasCoordinates(event) {
    const rect = previewCanvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (previewCanvas.width / rect.width),
      y: (event.clientY - rect.top) * (previewCanvas.height / rect.height)
    };
  }

  function isInsideCustomImage(x, y) {
    return (
      x >= customImagePosition.x &&
      x <= customImagePosition.x + customImagePreview.width * scale &&
      y >= customImagePosition.y &&
      y <= customImagePosition.y + customImagePreview.height * scale
    );
  }

  function drawCustomImage(
    image = customImagePreview,
    position = customImagePosition,
    width = customImagePreview.width * scale,
    height = customImagePreview.height * scale,
    color = selectedColor,
    tolerance = toleranceSlider.value
  ) {
    const { x, y } = position;

    if (removeBackground) {
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      tempCanvas.width = image.width;
      tempCanvas.height = image.height;
      tempCtx.drawImage(image, 0, 0);

      const imageData = tempCtx.getImageData(0, 0, image.width, image.height);
      const data = imageData.data;

      const [r1, g1, b1] = hexToRgb(color);
      const toleranceValue = parseInt(tolerance, 10);

      for (let i = 0; i < data.length; i += 4) {
        const r2 = data[i];
        const g2 = data[i + 1];
        const b2 = data[i + 2];

        if (colorWithinTolerance(r1, g1, b1, r2, g2, b2, toleranceValue)) {
          data[i + 3] = 0; // Alpha-Kanal auf 0 setzen, um den Hintergrund transparent zu machen
        }
      }

      tempCtx.putImageData(imageData, 0, 0);
      ctx.drawImage(tempCanvas, x, y, width, height);
    } else {
      ctx.drawImage(image, x, y, width, height);
    }
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16)
        ]
      : null;
  }

  function colorWithinTolerance(r1, g1, b1, r2, g2, b2, tolerance) {
    return (
      Math.abs(r1 - r2) <= tolerance &&
      Math.abs(g1 - g2) <= tolerance &&
      Math.abs(b1 - b2) <= tolerance
    );
  }

  stampButton.addEventListener("click", () => {
    if (customImagePreview) {
      const stamp = {
        image: customImagePreview,
        position: { ...customImagePosition },
        width: customImagePreview.width * scale,
        height: customImagePreview.height * scale,
        color: selectedColor,
        tolerance: tolerance
      };
      stampedImages.push(stamp);
      customImageFile = null;
      customImagePreview = null;
      updatePreview();
      updateStampList();
    }
  });

  function updateStampList() {
    stampList.innerHTML = "";
    stampedImages.forEach((stamp, index) => {
      const li = document.createElement("li");
      li.textContent = `Stamp ${index + 1}`;
      if (index === selectedStampIndex) {
        li.classList.add("selected");
      }
      li.addEventListener("click", () => {
        selectedStampIndex = index;
        updatePreview();
        updateStampList();
      });
      const editButton = document.createElement("button");
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => {
        selectedStampIndex = index;
        customImagePreview = stamp.image;
        customImagePosition = { ...stamp.position };
        scale = stamp.width / stamp.image.width;
        colorPicker.value = stamp.color;
        toleranceSlider.value = stamp.tolerance;
        colorPickerPreview.style.backgroundColor = stamp.color;
        updatePreview();
        updateStampList();
      });
      li.appendChild(editButton);
      const removeButton = document.createElement("button");
      removeButton.textContent = "Remove";
      removeButton.addEventListener("click", () => {
        stampedImages.splice(index, 1);
        selectedStampIndex = -1;
        updatePreview();
        updateStampList();
      });
      li.appendChild(removeButton);
      stampList.appendChild(li);
    });
  }

  zoomInButton.addEventListener("click", () => {
    if (customImagePreview) {
      const newScale = scale + 0.1;
      const scaledWidth = customImagePreview.width * newScale;
      const scaledHeight = customImagePreview.height * newScale;

      if (
        scaledWidth <= darkAreaBounds.width &&
        scaledHeight <= darkAreaBounds.height
      ) {
        scale = newScale;
        updatePreview();
      }
    }
  });

  zoomOutButton.addEventListener("click", () => {
    if (customImagePreview) {
      scale = Math.max(0.1, scale - 0.1);
      updatePreview();
    }
  });

  exportButton.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = previewCanvas.toDataURL();
    link.download = "custom_image.png";
    link.click();
  });

  removeBackgroundButton.addEventListener("click", () => {
    removeBackground = !removeBackground;
    updatePreview();
  });

  colorPicker.addEventListener("change", () => {
    selectedColor = colorPicker.value;
    colorPickerPreview.style.backgroundColor = selectedColor;
    updatePreview();
  });

  toleranceSlider.addEventListener("input", () => {
    tolerance = toleranceSlider.value;
    updatePreview();
  });

  stampSelect.addEventListener("change", async () => {
    const selectedStamp = stampSelect.value;
    if (selectedStamp) {
      const stampImg = await loadImage(selectedStamp);
      customImagePreview = stampImg;
      customImagePosition = {
        x: darkAreaBounds.x,
        y: darkAreaBounds.y
      };
      scaleCustomImage();
      updatePreview();
    }
  });
});
