<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Custom Design Preview</title>
    <style>
        canvas {
            border: 1px solid black;
        }
    </style>
</head>
<body>
    <select id="manufacturer-select">
        <option value="">Select Manufacturer</option>
    </select>
    <select id="model-select">
        <option value="">Select Model</option>
    </select>
    <select id="design-select">
        <option value="">Select Design</option>
    </select>
    <select id="material-select">
        <option value="No Material" selected>No Material</option>
    </select>
    <canvas id="preview-canvas"></canvas>

    <script>
        document.addEventListener('DOMContentLoaded', async () => {
            const REPO_OWNER = 'Woschj';
            const REPO_NAME = 'Catchy-Customs';
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
                try {
                    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folder}`);
                    if (!response.ok) throw new Error('Network response was not ok ' + response.statusText);
                    const folders = await response.json();
                    return folders.filter(folder => folder.type === 'dir').map(folder => folder.name);
                } catch (error) {
                    console.error('There was a problem fetching folders:', error);
                    return [];
                }
            }

            async function fetchImages(folder) {
                try {
                    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DESIGN_FOLDER}/${folder}`);
                    if (!response.ok) throw new Error('Network response was not ok ' + response.statusText);
                    const files = await response.json();
                    return files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file.name)).map(file => ({
                        name: file.name,
                        url: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${DESIGN_FOLDER}/${folder}/${file.name}`
                    }));
                } catch (error) {
                    console.error('There was a problem fetching images:', error);
                    return [];
                }
            }

            async function fetchMaterials() {
                try {
                    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${MATERIAL_FOLDER}`);
                    if (!response.ok) throw new Error('Network response was not ok ' + response.statusText);
                    const files = await response.json();
                    return files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file.name)).map(file => ({
                        name: file.name,
                        url: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${MATERIAL_FOLDER}/${file.name}`
                    }));
                } catch (error) {
                    console.error('There was a problem fetching materials:', error);
                    return [];
                }
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

            manufacturerSelect.addEventListener('change', async () => {
                const selectedManufacturer = manufacturerSelect.value;
                modelSelect.innerHTML = '<option value="">Loading Models...</option>';
                designSelect.innerHTML = '<option value="">Loading Designs...</option>';

                if (selectedManufacturer && selectedManufacturer !== 'Select Manufacturer') {
                    const images = await fetchImages(selectedManufacturer);
                    const models = [...new Set(images.map(image => image.name.split('_')[0]))];
                    populateDropdown(modelSelect, models.map(model => ({ name: model, url: model })));

                    if (models.length > 0) {
                        setTimeout(async () => {
                            modelSelect.value = models[0].url;
                            const selectedModel = models[0].url;
                            const designs = images.filter(image => image.name.startsWith(selectedModel)).map(image => ({
                                name: image.name.split('_')[1],
                                url: image.url
                            }));
                            populateDropdown(designSelect, designs);

                            if (designs.length > 0) {
                                setTimeout(() => {
                                    designSelect.value = designs[0].url;
                                    updatePreview();
                                }, 100);
                            }
                        }, 100);
                    }
                }

                materialSelect.selectedIndex = 0;
            });

            modelSelect.addEventListener('change', async () => {
                const selectedManufacturer = manufacturerSelect.value;
                const selectedModel = modelSelect.value;
                designSelect.innerHTML = '<option value="">Loading Designs...</option>';

                if (selectedManufacturer && selectedModel) {
                    const images = await fetchImages(selectedManufacturer);
                    const designs = images.filter(image => image.name.startsWith(selectedModel)).map(image => ({
                        name: image.name.split('_')[1],
                        url: image.url
                    }));
                    populateDropdown(designSelect, designs);

                    if (designs.length > 0) {
                        setTimeout(() => {
                            designSelect.value = designs[0].url;
                            updatePreview();
                        }, 100);
                    }
                }

                materialSelect.selectedIndex = 0;
            });

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
    </script>
</body>
</html>
