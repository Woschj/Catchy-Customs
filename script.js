document.addEventListener('DOMContentLoaded', async () => {
    const REPO_OWNER = 'Woschj';
    const REPO_NAME = 'CatchyCases';
    const DESIGN_FOLDER = 'design';
    const MATERIAL_FOLDER = 'materials';

    const manufacturers = {
        "Apple": ["iPhone SE", "iPhone 12", "iPhone 12 Pro", "iPhone 13", "iPhone 13 Pro"],
        "Samsung": ["Galaxy S21", "Galaxy S21+", "Galaxy Note 20", "Galaxy A52", "Galaxy A52"],
        "Google": ["Pixel 4", "Pixel 4a", "Pixel 5", "Pixel 5a", "Pixel 6"],
    };

    const manufacturerSelect = document.getElementById('manufacturer-select');
    const modelSelect = document.getElementById('model-select');
    const designSelect = document.getElementById('design-select');
    const materialSelect = document.getElementById('material-select');
    const previewCanvas = document.getElementById('preview-canvas');
    const ctx = previewCanvas.getContext('2d');

    // Set high-resolution canvas size (15% smaller than previously)
    const CANVAS_WIDTH = 544;  // Example width (15% smaller than 640)
    const CANVAS_HEIGHT = 544; // Example height (15% smaller than 640)
    previewCanvas.width = CANVAS_WIDTH;
    previewCanvas.height = CANVAS_HEIGHT;

    function populateDropdown(dropdown, items, selectFirst = false) {
        dropdown.innerHTML = ''; // Clear the dropdown to avoid duplicates
        items.forEach((item, index) => {
            const option = document.createElement('option');
            option.value = item.url;
            option.textContent = item.name;
            if (selectFirst && index === 0) {
                option.selected = true;
            }
            dropdown.appendChild(option);
        });
    }

    async function fetchFiles(folder) {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folder}`);
        const files = await response.json();
        return files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file.path)).map(file => ({
            name: file.name,
            url: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${file.path}`
        }));
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.crossOrigin = "Anonymous"; // Handle CORS issues
            img.src = src;
        });
    }

    async function updatePreview() {
        const selectedDesign = designSelect.value;
        const selectedMaterial = materialSelect.value;

        if (selectedDesign) {
            const designImg = await loadImage(selectedDesign);
            ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

            // Maintain aspect ratio and avoid pixelation
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

            // Create a temporary high-resolution canvas
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = drawWidth;
            tempCanvas.height = drawHeight;
            tempCtx.drawImage(designImg, 0, 0, drawWidth, drawHeight);

            if (selectedMaterial && selectedMaterial !== 'No Material') {
                const materialImg = await loadImage(selectedMaterial);
                const materialCanvas = document.createElement('canvas');
                const materialCtx = materialCanvas.getContext('2d');
                materialCanvas.width = drawWidth;
                materialCanvas.height = drawHeight;
                materialCtx.drawImage(materialImg, 0, 0, drawWidth, drawHeight);

                const materialData = materialCtx.getImageData(0, 0, drawWidth, drawHeight);
                const designData = tempCtx.getImageData(0, 0, drawWidth, drawHeight);

                for (let i = 0; i < designData.data.length; i += 4) {
                    const avg = (designData.data[i] + designData.data[i + 1] + designData.data[i + 2]) / 3;
                    if (avg < 128) { // Dark areas
                        designData.data[i] = designData.data[i] * 0.5 + materialData.data[i] * 0.5; // Blend colors
                        designData.data[i + 1] = designData.data[i + 1] * 0.5 + materialData.data[i + 1] * 0.5;
                        designData.data[i + 2] = designData.data[i + 2] * 0.5 + materialData.data[i + 2] * 0.5;
                    }
                }

                tempCtx.putImageData(designData, 0, 0);
            }

            // Draw the final combined image onto the preview canvas
            ctx.drawImage(tempCanvas, offsetX, offsetY, drawWidth, drawHeight);
        }
    }

    manufacturerSelect.addEventListener('change', () => {
        const selectedManufacturer = manufacturerSelect.value;
        modelSelect.innerHTML = '<option value="">Select Model</option>';
        if (selectedManufacturer && manufacturers[selectedManufacturer]) {
            populateDropdown(modelSelect, manufacturers[selectedManufacturer].map(model => ({ name: model, url: model })));
        }
    });

    modelSelect.addEventListener('change', () => {
        if (designSelect.options.length > 0) {
            designSelect.selectedIndex = 0; // Select the first design by default
        }
        materialSelect.selectedIndex = 0; // Select "No Material" by default
        updatePreview(); // Update preview once the model is selected
    });

    const designs = await fetchFiles(DESIGN_FOLDER);
    const materials = await fetchFiles(MATERIAL_FOLDER);

    populateDropdown(designSelect, designs, true); // Select the first design by default
    populateDropdown(materialSelect, materials);
    materialSelect.insertAdjacentHTML('afterbegin', '<option value="No Material" selected>No Material</option>');

    designSelect.addEventListener('change', updatePreview);
    materialSelect.addEventListener('change', updatePreview);

    // Initial preview update if necessary
    if (designSelect.options.length > 0 && modelSelect.options.length > 0) {
        updatePreview();
    }
});
