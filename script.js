document.addEventListener('DOMContentLoaded', () => {
    const manufacturers = {
        "Apple": ["iPhone SE", "iPhone 12", "iPhone 12 Pro", "iPhone 13", "iPhone 13 Pro"],
        "Samsung": ["Galaxy S21", "Galaxy S21+", "Galaxy Note 20", "Galaxy A52", "Galaxy A52"],
        "Google": ["Pixel 4", "Pixel 4a", "Pixel 5", "Pixel 5a", "Pixel 6"],
    };

    const designs = ["None", "Design1", "Design2", "Design3"];
    const materials = ["None", "Leder", "Stoff", "Holz", "Plexiglas", "Kork"];

    const manufacturerSelect = document.getElementById('manufacturer-select');
    const modelSelect = document.getElementById('model-select');
    const designSelect = document.getElementById('design-select');
    const materialSelect = document.getElementById('material-select');
    const customImageSelect = document.getElementById('custom-image-select');
    const previewCanvas = document.getElementById('preview-canvas');
    const previewCtx = previewCanvas.getContext('2d');

    let customImage = null;
    let customImagePosition = { x: 0, y: 0 };
    let customImageScale = 1.0;

    function populateDropdowns() {
        // Populate manufacturers dropdown
        Object.keys(manufacturers).forEach(manufacturer => {
            const option = document.createElement('option');
            option.value = manufacturer;
            option.textContent = manufacturer;
            manufacturerSelect.appendChild(option);
        });

        // Populate designs dropdown
        designs.forEach(design => {
            const option = document.createElement('option');
            option.value = design;
            option.textContent = design;
            designSelect.appendChild(option);
        });

        // Populate materials dropdown
        materials.forEach(material => {
            const option = document.createElement('option');
            option.value = material;
            option.textContent = material;
            materialSelect.appendChild(option);
        });

        customImageSelect.appendChild(new Option('None', 'None'));

        // Add event listener for manufacturer select change
        manufacturerSelect.addEventListener('change', updateModels);
    }

    function updateModels() {
        const manufacturer = manufacturerSelect.value;
        modelSelect.innerHTML = '';
        manufacturers[manufacturer].forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelSelect.appendChild(option);
        });
        updatePreview();
    }

    function loadImage(src, callback) {
        const img = new Image();
        img.onload = () => callback(img);
        img.src = src;
    }

    // Improved drawImageWithAspectRatio function to consider canvas overflow
    function drawImageWithAspectRatio(ctx, img, x, y, maxWidth, maxHeight) {
        const aspectRatio = img.width / img.height;
        let drawWidth, drawHeight;

        if (aspectRatio > 1) {
            drawWidth = maxWidth;
            drawHeight = maxWidth / aspectRatio;
        } else {
            drawHeight = maxHeight;
            drawWidth = maxHeight * aspectRatio;
        }

        const offsetX = (maxWidth - drawWidth) / 2;
        const offsetY = (maxHeight - drawHeight) / 2;

        ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
    }

    // Custom Image Selection (using a file input element)
    const customImageInput = document.getElementById('custom-image-input');
    customImageInput.addEventListener('change', loadCustomImage);

    function loadCustomImage(event) {
        const file = event.target.files[0];
        if (file) {
            customImage = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                customImageSelect.appendChild(new Option(file.name, e.target.result));
                customImageSelect.value = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    populateDropdowns();
    updateModels(); // Ensure models are populated initially
});
