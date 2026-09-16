document.addEventListener('DOMContentLoaded', () => {
    const receiptForm = document.getElementById('receiptForm');
    const formContainer = document.getElementById('formContainer');
    const stepTracker = document.getElementById('stepTracker');
    const loadingContainer = document.getElementById('loadingContainer');
    const loadingText = document.getElementById('loadingText');
    const receiptResultContainer = document.getElementById('receiptResultContainer');
    
    // Form fields
    const providerSelect = document.getElementById('provider');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const consumptionInput = document.getElementById('consumption');
    const optNameInput = document.getElementById('optName');
    const optEmailInput = document.getElementById('optEmail');
    const optCityInput = document.getElementById('optCity');

    // Error elements
    const providerError = document.getElementById('providerError');
    const dateError = document.getElementById('dateError');
    const consumptionError = document.getElementById('consumptionError');

    // Receipt display elements
    const resReceiptId = document.getElementById('resReceiptId');
    const resProvider = document.getElementById('resProvider');
    const resBillingPeriod = document.getElementById('resBillingPeriod');
    const optionalUserBlock = document.getElementById('optionalUserBlock');
    const resConsumer = document.getElementById('resConsumer');
    const resUsage = document.getElementById('resUsage');
    const resCo2Kg = document.getElementById('resCo2Kg');
    const resCo2Tonnes = document.getElementById('resCo2Tonnes');
    const resRegistryRef = document.getElementById('resRegistryRef');
    const resTimestamp = document.getElementById('resTimestamp');
    const resStatusText = document.getElementById('resStatusText');
    
    // Action buttons
    const copyJsonBtn = document.getElementById('copyJsonBtn');
    const resetFormBtn = document.getElementById('resetFormBtn');
    
    let currentReceiptJson = '';
    let qrCodeInstance = null;

    receiptForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let isValid = true;

        // Reset error states
        document.querySelectorAll('.input-group').forEach(group => group.classList.remove('error'));

        // 1. Validate Provider
        if (!providerSelect.value) {
            providerSelect.closest('.input-group').classList.add('error');
            isValid = false;
        }

        // 2. Validate Dates
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) {
            endDateInput.closest('.input-group').classList.add('error');
            isValid = false;
        }

        // 3. Validate Consumption (> 0)
        const consumptionValue = parseFloat(consumptionInput.value);
        if (isNaN(consumptionValue) || consumptionValue <= 0) {
            consumptionInput.closest('.input-group').classList.add('error');
            isValid = false;
        }

        if (!isValid) return;

        // Form valid -> Begin Loading Sequence on the same page
        formContainer.classList.add('hidden');
        stepTracker.classList.add('hidden');
        loadingContainer.classList.remove('hidden');

        // Multi-step loading messages
        setTimeout(() => {
            loadingText.textContent = "Calculating your carbon impact…";
        }, 900);

        setTimeout(() => {
            loadingText.textContent = "Generating your receipt…";
        }, 1800);

        // After loading, calculate emissions and render receipt
        setTimeout(() => {
            loadingContainer.classList.add('hidden');
            renderReceipt({
                provider: providerSelect.value,
                startDate: startDate,
                endDate: endDate,
                consumption: consumptionValue,
                name: optNameInput.value.trim(),
                email: optEmailInput.value.trim(),
                city: optCityInput.value.trim()
            });
            receiptResultContainer.classList.remove('hidden');
        }, 2700);
    });

    function renderReceipt(data) {
        // Calculations
        const emissionsFactor = 0.7; // kg CO2e / kWh
        const co2Kg = Number((data.consumption * emissionsFactor).toFixed(2));
        const co2Tonnes = Number((co2Kg / 1000).toFixed(4));
        
        // Generate unique dynamic ID
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        const receiptId = `RCP-2026-${randomNum}`;
        const registryRef = "DEMO-REGISTRY-001";
        const verificationStatus = "Verified for demo";
        const timestamp = new Date().toUTCString();

        // Populate receipt view fields
        resReceiptId.textContent = receiptId;
        resProvider.textContent = data.provider;
        resBillingPeriod.textContent = `${data.startDate} to ${data.endDate}`;
        
        if (data.name || data.city) {
            optionalUserBlock.style.display = 'flex';
            let consumerText = data.name || "Anonymous";
            if (data.city) consumerText += ` (${data.city})`;
            resConsumer.textContent = consumerText;
        } else {
            optionalUserBlock.style.display = 'none';
        }

        resUsage.textContent = `${data.consumption} kWh`;
        resCo2Kg.textContent = `${co2Kg} kg CO₂e`;
        resCo2Tonnes.textContent = `(${co2Tonnes} t CO₂e)`;
        resRegistryRef.textContent = registryRef;
        resTimestamp.textContent = timestamp;
        resStatusText.textContent = verificationStatus;

        // Build receipt object for JSON & QR Code
        const receiptObject = {
            receiptId: receiptId,
            provider: data.provider,
            billingPeriod: `${data.startDate} to ${data.endDate}`,
            usageKwh: data.consumption,
            emissionsFactorKgPerKwh: emissionsFactor,
            co2eKg: co2Kg,
            co2eTonnes: co2Tonnes,
            verificationStatus: verificationStatus,
            registryReference: registryRef,
            timestamp: timestamp,
            consumer: {
                name: data.name || null,
                email: data.email || null,
                city: data.city || null
            },
            disclaimer: "This prototype records a digital receipt. It does not independently retire a real carbon credit."
        };

        currentReceiptJson = JSON.stringify(receiptObject, null, 2);

        // Generate Real Scannable QR Code using qrcode.js
        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = ""; // Clear prior QR if any
        
        qrCodeInstance = new QRCode(qrContainer, {
            text: currentReceiptJson,
            width: 85,
            height: 85,
            colorDark: "#1C241F",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
    }

    // Copy Receipt Data JSON Button
    copyJsonBtn.addEventListener('click', () => {
        if (!currentReceiptJson) return;
        navigator.clipboard.writeText(currentReceiptJson).then(() => {
            const originalText = copyJsonBtn.textContent;
            copyJsonBtn.textContent = "✔ Copied to Clipboard!";
            setTimeout(() => {
                copyJsonBtn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            alert("Failed to copy receipt data.");
        });
    });

    // Reset Form & Create Another Receipt Button
    resetFormBtn.addEventListener('click', () => {
        receiptForm.reset();
        receiptResultContainer.classList.add('hidden');
        formContainer.classList.remove('hidden');
        stepTracker.classList.remove('hidden');
        currentReceiptJson = '';
    });
});