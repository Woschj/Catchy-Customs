document.addEventListener('DOMContentLoaded', async () => {
    const REPO_OWNER = 'Woschj';
    const REPO_NAME = 'CatchyCases';
    const DESIGN_FOLDER = 'design';
    const MATERIAL_FOLDER = 'materials';

    const manufacturerSelect = document.getElementById('manufacturer-select');
    const modelSelect = document.getElementById('model-select');
    const designSelect = document.getElementById('design-select');
    const materialSelect = document.getElementById('material-select');
    const previewCanvas = document.getElementById('preview-canvas');
    const ctx = previewCanvas.getContext('2d');

    const CANVAS_WIDTH = 544;
    const CANVAS_HEIGHT = 544;
    previewCanvas.width = CANVAS_WIDTH;
    previewCanvas.height = CANVAS_HEIGHT;

    function populateDropdown(dropdown, items, selectFirst = true) {
        dropdown.innerHTML = '';
        items.forEach((item, index) => {
            const option = document.createElement('option');
            option.value = item.url;
            option.textContent = item.name;
            dropdown.appendChild(option);
        });

        if (selectFirst && items.length > 0) {
            dropdown.selectedIndex = 0;
        }
    }

    async function fetchFolders(folder) {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folder}`);
        const folders = await response.json();
        return folders.filter(folder => folder.type === 'dir').map(folder => folder.name);
    }

    async function fetchImages(folder) {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DESIGN_FOLDER}/${folder}`);
        const files = await response.json();
        return files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file.name)).map(file => ({
            name: file.name,
            url: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${DESIGN_FOLDER}/${folder}/${file.name}`
        }));
    }

    async function fetchMaterials() {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${MATERIAL_FOLDER}`);
        const files = await response.json();
        return files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file.name)).map(file => ({
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

    async function detectAndMaskLenses(imageData) {
        const threshold = 100; // Adjust this value based on your specific use case
        const minBlobSize = 100; // Minimum size of a blob to be considered a lens

        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        const mask = new Uint8ClampedArray(data.length);

        // Simple color thresholding to detect potential lens areas
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Detect dark areas (simplified assumption for lenses)
            if (r < threshold && g < threshold && b < threshold) {
                mask[i / 4] = 1;
            }
        }

        // Blob detection to identify contiguous regions
        const blobs = [];
        const visited = new Uint8ClampedArray(mask.length);

        function visit(x, y, blob) {
            const index = y * width + x;
            if (x < 0 || x >= width || y < 0 || y >= height || visited[index] || !mask[index]) {
                return;
            }

            visited[index] = 1;
            blob.push(index);

            visit(x - 1, y, blob);
            visit(x + 1, y, blob);
            visit(x, y - 1, blob);
            visit(x, y + 1, blob);
        }

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                if (!visited[index] && mask[index]) {
                    const blob = [];
                    visit(x, y, blob);
                    if (blob.length >= minBlobSize) {
                        blobs.push(blob);
                    }
                }
            }
        }

        // Mask out detected blobs
        for (const blob of blobs) {
            for (const index of blob) {
                const i = index * 4;
                data[i] = 255;
                data[i + 1] = 255;
                data[i + 2] = 255;
                data[i + 3] = 255;
            }
        }
    }

    async function updatePreview() {
        const selectedDesign = designSelect.value;
        const selectedMaterial = materialSelect.value;

        if (selectedDesign) {
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

            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = drawWidth;
            tempCanvas.height = drawHeight;
            tempCtx.drawImage(designImg, 0, 0, drawWidth, drawHeight);

            // Detect and mask out camera lenses
            const designData = tempCtx.getImageData(0, 0, drawWidth, drawHeight);
            await detectAndMaskLenses(designData);
            tempCtx.putImageData(designData, 0, 0);

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

            ctx.drawImage(tempCanvas, offsetX, offsetY, drawWidth, drawHeight);
        }
    }

    async function handleManufacturerChange() {
        const selectedManufacturer = manufacturerSelect.value;
        if (selectedManufacturer && selectedManufacturer !== 'Select Manufacturer') {
            const images = await fetchImages(selectedManufacturer);
            const models = [...new Set(images.map(image => image.name.split('_')[0]))];
            populateDropdown(modelSelect, models.map(model => ({ name: model, url: model })));

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
            const designs = images.filter(image => image.name.startsWith(selectedModel)).map(image => ({
                name: image.name.split('_')[1],
                url: image.url
            }));
            populateDropdown(designSelect, designs);

            if (designs.length > 0) {
                designSelect.value = designs[0].url;
                updatePreview();
            }
        }
    }

    manufacturerSelect.addEventListener('change', handleManufacturerChange);
    modelSelect.addEventListener('change', handleModelChange);

    const manufacturers = await fetchFolders(DESIGN_FOLDER);
    populateDropdown(manufacturerSelect, manufacturers.map(manufacturer => ({ name: manufacturer, url: manufacturer })), false);
    manufacturerSelect.value = 'Select Manufacturer';

    const materials = await fetchMaterials();
    populateDropdown(materialSelect, materials);
    materialSelect.insertAdjacentHTML('afterbegin', '<option value="No Material" selected>No Material</option>');

    designSelect.addEventListener('change', updatePreview);
    materialSelect.addEventListener('change', updatePreview);

    // Initial preview update if necessary
    if (designSelect.options.length > 0 && modelSelect.options.length > 0) {
        updatePreview();
    }
});