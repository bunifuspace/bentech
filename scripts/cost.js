const quotationPrices = {
  cctv: {
    name: "CCTV Installation",
    base: 250000,
    unit: 180000,
    unitLabel: "camera",
    defaultQuantity: 4,
    minimumQuantity: 1,
    maximumQuantity: 32,
  },

  fence: {
    name: "Electric Fencing",
    base: 350000,
    unit: 18000,
    unitLabel: "metre",
    defaultQuantity: 20,
    minimumQuantity: 10,
    maximumQuantity: 1000,
  },

  gate: {
    name: "Gate Automation",
    base: 850000,
    unit: 0,
    unitLabel: "gate",
    defaultQuantity: 1,
    minimumQuantity: 1,
    maximumQuantity: 4,
  },

  intercom: {
    name: "Video Intercom",
    base: 450000,
    unit: 0,
    unitLabel: "system",
    defaultQuantity: 1,
    minimumQuantity: 1,
    maximumQuantity: 8,
  },

  alarm: {
    name: "Alarm Systems",
    base: 550000,
    unit: 0,
    unitLabel: "system",
    defaultQuantity: 1,
    minimumQuantity: 1,
    maximumQuantity: 8,
  },

  telephone: {
    name: "Telephone Systems",
    base: 400000,
    unit: 75000,
    unitLabel: "extension",
    defaultQuantity: 4,
    minimumQuantity: 1,
    maximumQuantity: 64,
  },

  tv: {
    name: "TV Installation",
    base: 80000,
    unit: 100000,
    unitLabel: "TV",
    defaultQuantity: 1,
    minimumQuantity: 1,
    maximumQuantity: 20,
  },
};

const quotationForm = document.getElementById("quotationForm");
const estimateTotal = document.getElementById("estimateTotal");
const estimateRange = document.getElementById("estimateRange");
const estimateBreakdown = document.getElementById("estimateBreakdown");

if (!quotationForm) {
  console.warn("Quotation form not found.");
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
  })
    .format(Math.round(amount))
    .replace("TZS", "TSh");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-TZ", {
    maximumFractionDigits: 0,
  }).format(value);
}

function getSelectedServices() {
  if (!quotationForm) return [];

  return [...quotationForm.querySelectorAll('input[name="service"]:checked')]
    .map((input) => input.value)
    .filter((service) => quotationPrices[service]);
}

function getQuantity(service) {
  const item = quotationPrices[service];

  const input = quotationForm.querySelector(`[name="${service}Quantity"]`);

  if (!input) {
    return item.defaultQuantity;
  }

  let quantity = Number.parseInt(input.value, 10);

  if (!Number.isInteger(quantity)) {
    quantity = item.minimumQuantity;
  }

  quantity = Math.max(
    item.minimumQuantity,
    Math.min(item.maximumQuantity, quantity),
  );

  input.value = quantity;

  return quantity;
}

function calculateService(service) {
  const item = quotationPrices[service];
  const quantity = getQuantity(service);

  const total = item.base + item.unit * quantity;

  return {
    service,
    name: item.name,
    quantity,
    unitLabel: item.unitLabel,
    base: item.base,
    unit: item.unit,
    total,
  };
}

function calculateEstimate() {
  return getSelectedServices().map(calculateService);
}

function updateEstimate() {
  if (!quotationForm) return;

  const estimates = calculateEstimate();

  if (estimates.length === 0) {
    estimateTotal.textContent = "TSh 0";
    estimateRange.textContent = "Select a service to begin";
    estimateBreakdown.innerHTML = "";
    return;
  }

  const total = estimates.reduce((sum, item) => sum + item.total, 0);

  const minimum = Math.round(total * 0.85);
  const maximum = Math.round(total * 1.15);

  estimateTotal.textContent = formatCurrency(total);
  estimateRange.textContent = `${formatCurrency(minimum)} – ${formatCurrency(maximum)}`;

  estimateBreakdown.innerHTML = estimates
    .map((item) => {
      const quantityText =
        item.quantity === 1
          ? `${formatNumber(item.quantity)} ${item.unitLabel}`
          : `${formatNumber(item.quantity)} ${item.unitLabel}s`;

      return `
        <div class="estimate-item">
          <span>
            ${item.name} · ${quantityText}
          </span>

          <strong>
            ${formatCurrency(item.total)}
          </strong>
        </div>
      `;
    })
    .join("");
}

function createQuantityInput(service) {
  const item = quotationPrices[service];

  return `
    <div
      class="quantity-control"
      data-service="${service}"
    >
      <label for="${service}Quantity">
        ${item.unitLabel}
      </label>

      <div class="quantity-input">
        <button
          type="button"
          class="quantity-button"
          data-action="decrease"
          aria-label="Decrease ${item.name} quantity"
        >
          <i class="fa-solid fa-minus"></i>
        </button>

        <input
          type="number"
          id="${service}Quantity"
          name="${service}Quantity"
          value="${item.defaultQuantity}"
          min="${item.minimumQuantity}"
          max="${item.maximumQuantity}"
          step="1"
          inputmode="numeric"
          aria-label="${item.name} quantity"
        >

        <button
          type="button"
          class="quantity-button"
          data-action="increase"
          aria-label="Increase ${item.name} quantity"
        >
          <i class="fa-solid fa-plus"></i>
        </button>
      </div>

      <small>
        ${item.minimumQuantity}–${item.maximumQuantity}
        ${item.unitLabel}s
      </small>
    </div>
  `;
}

function addQuantityControls(service) {
  const input = quotationForm.querySelector(
    `input[name="service"][value="${service}"]`,
  );

  if (!input) return;

  const option = input.closest(".service-option");

  if (!option) return;

  if (
    quotationForm.querySelector(`.quantity-control[data-service="${service}"]`)
  ) {
    return;
  }

  option.insertAdjacentHTML("afterend", createQuantityInput(service));

  const quantityControl = quotationForm.querySelector(
    `.quantity-control[data-service="${service}"]`,
  );

  if (!quantityControl) return;

  const quantityInput = quantityControl.querySelector("input");
  const buttons = quantityControl.querySelectorAll(".quantity-button");

  quantityInput.addEventListener("input", () => {
    quantityInput.value = quantityInput.value.replace(/[^\d]/g, "");
    updateEstimate();
  });

  quantityInput.addEventListener("blur", () => {
    getQuantity(service);
    updateEstimate();
  });

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const item = quotationPrices[service];

      let quantity = Number.parseInt(quantityInput.value, 10);

      if (!Number.isInteger(quantity)) {
        quantity = item.defaultQuantity;
      }

      if (button.dataset.action === "increase") {
        quantity += 1;
      }

      if (button.dataset.action === "decrease") {
        quantity -= 1;
      }

      quantity = Math.max(
        item.minimumQuantity,
        Math.min(item.maximumQuantity, quantity),
      );

      quantityInput.value = quantity;

      updateEstimate();
    });
  });
}

function removeQuantityControls(service) {
  const control = quotationForm.querySelector(
    `.quantity-control[data-service="${service}"]`,
  );

  if (control) {
    control.remove();
  }
}

function updateServiceControls() {
  const selectedServices = getSelectedServices();

  Object.keys(quotationPrices).forEach((service) => {
    if (selectedServices.includes(service)) {
      addQuantityControls(service);
    } else {
      removeQuantityControls(service);
    }
  });

  updateEstimate();
}

function validateQuotationForm() {
  const selectedServices = getSelectedServices();

  if (selectedServices.length === 0) {
    showFormMessage("Please select at least one service.", "error");

    quotationForm.querySelector(".service-options")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    return false;
  }

  for (const service of selectedServices) {
    const item = quotationPrices[service];

    const input = quotationForm.querySelector(`[name="${service}Quantity"]`);

    if (!input) continue;

    const quantity = Number.parseInt(input.value, 10);

    if (
      !Number.isInteger(quantity) ||
      quantity < item.minimumQuantity ||
      quantity > item.maximumQuantity
    ) {
      input.value = Math.max(
        item.minimumQuantity,
        Math.min(
          item.maximumQuantity,
          Number.isInteger(quantity) ? quantity : item.defaultQuantity,
        ),
      );

      input.focus();

      showFormMessage(
        `${item.name}: enter a quantity between ${item.minimumQuantity} and ${item.maximumQuantity}.`,
        "error",
      );

      return false;
    }
  }

  if (!quotationForm.checkValidity()) {
    quotationForm.reportValidity();
    return false;
  }

  return true;
}

function getQuotationData() {
  const formData = new FormData(quotationForm);
  const estimates = calculateEstimate();

  const total = estimates.reduce((sum, item) => sum + item.total, 0);

  const minimum = Math.round(total * 0.85);
  const maximum = Math.round(total * 1.15);

  return {
    customer: {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      preferredContact: formData.get("preferred"),
    },

    project: {
      property: formData.get("property"),
      location: formData.get("location"),
      description: formData.get("description"),
    },

    services: estimates.map((item) => ({
      service: item.name,
      quantity: item.quantity,
      unit: item.unitLabel,
      estimatedCost: item.total,
    })),

    estimate: {
      total,
      minimum,
      maximum,
      currency: "TZS",
    },

    createdAt: new Date().toISOString(),
  };
}

function handleQuotationSubmit(event) {
  event.preventDefault();

  if (!validateQuotationForm()) {
    return;
  }

  const quotation = getQuotationData();

  localStorage.setItem("bentechQuotation", JSON.stringify(quotation));

  showFormMessage(
    "Your approximate quotation has been prepared successfully.",
    "success",
  );

  quotationForm.dispatchEvent(
    new CustomEvent("quotationReady", {
      detail: quotation,
    }),
  );

  console.log("BenTech quotation:", quotation);
}

function showFormMessage(message, type) {
  let messageElement = quotationForm.querySelector(".form-message");

  if (!messageElement) {
    messageElement = document.createElement("div");
    messageElement.className = "form-message";
    quotationForm.appendChild(messageElement);
  }

  messageElement.className = `form-message ${type}`;
  messageElement.textContent = message;

  messageElement.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

if (quotationForm) {
  const serviceInputs = quotationForm.querySelectorAll('input[name="service"]');

  serviceInputs.forEach((input) => {
    input.addEventListener("change", updateServiceControls);
  });

  quotationForm.addEventListener("submit", handleQuotationSubmit);

  updateServiceControls();
}

const whatsappQuotation = document.getElementById("whatsappQuotation");
const pdfQuotation = document.getElementById("pdfQuotation");

function buildQuotationMessage() {
  if (!quotationForm) return "";

  const quotation = getQuotationData();

  const services = quotation.services
    .map((item) => {
      return `• ${item.service}
  Quantity: ${item.quantity} ${item.unit}
  Estimated: ${formatCurrency(item.estimatedCost)}`;
    })
    .join("\n\n");

  return `BEN TECH SECURITY SYSTEMS

QUOTATION REQUEST

Customer
${quotation.customer.name}

Phone
${quotation.customer.phone}

Email
${quotation.customer.email || "Not provided"}

Property
${quotation.project.property || "Not specified"}

Location
${quotation.project.location || "Not specified"}

SERVICES

${services}

ESTIMATED TOTAL
${formatCurrency(quotation.estimate.total)}

APPROXIMATE RANGE
${formatCurrency(quotation.estimate.minimum)} – ${formatCurrency(
    quotation.estimate.maximum,
  )}

PROJECT DETAILS
${quotation.project.description || "Not provided"}

This is an approximate quotation. Final pricing is subject to site assessment, equipment selection, installation requirements and project specifications.`;
}

function sendQuotationToWhatsApp() {
  if (!validateQuotationForm()) {
    return;
  }

  const message = buildQuotationMessage();
  const encodedMessage = encodeURIComponent(message);

  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
}

function createQuotationPrintDocument() {
  if (!validateQuotationForm()) {
    return;
  }

  const quotation = getQuotationData();

  const services = quotation.services
    .map((item) => {
      return `
        <tr>
          <td>${escapeHtml(item.service)}</td>
          <td>${item.quantity} ${escapeHtml(item.unit)}</td>
          <td>${formatCurrency(item.estimatedCost)}</td>
        </tr>
      `;
    })
    .join("");

  const documentWindow = window.open("", "_blank", "width=900,height=700");

  if (!documentWindow) {
    showFormMessage(
      "Please allow pop-ups to generate the PDF quotation.",
      "error",
    );

    return;
  }

  documentWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        >

        <title>BenTech Quotation</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 3rem;
            color: #1d1d1f;
            background: #ffffff;
            font-family:
              Inter,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
            line-height: 1.5;
          }

          .document {
            max-width: 800px;
            margin: 0 auto;
          }

          .header {
            display: flex;
            justify-content: space-between;
            gap: 2rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid #d2d2d7;
          }

          .brand {
            font-size: 1.5rem;
            font-weight: 700;
            letter-spacing: -0.04em;
          }

          .brand span {
            display: block;
            margin-top: 0.25rem;
            color: #6e6e73;
            font-size: 0.65rem;
            font-weight: 500;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .quotation-title {
            text-align: right;
          }

          .quotation-title h1 {
            margin: 0;
            font-size: 1.75rem;
            letter-spacing: -0.04em;
          }

          .quotation-title p {
            margin: 0.35rem 0 0;
            color: #6e6e73;
            font-size: 0.75rem;
          }

          .section {
            margin-top: 2rem;
          }

          .section-title {
            margin-bottom: 0.75rem;
            color: #6e6e73;
            font-size: 0.65rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }

          .details {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .detail {
            padding: 1rem;
            background: #f5f5f7;
            border-radius: 0.75rem;
          }

          .detail small {
            display: block;
            margin-bottom: 0.25rem;
            color: #86868b;
            font-size: 0.65rem;
          }

          .detail strong {
            font-size: 0.8rem;
            font-weight: 600;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th {
            padding: 0.75rem 0;
            color: #86868b;
            border-bottom: 1px solid #d2d2d7;
            font-size: 0.65rem;
            text-align: left;
          }

          td {
            padding: 1rem 0;
            border-bottom: 1px solid #e5e5e7;
            font-size: 0.75rem;
          }

          th:last-child,
          td:last-child {
            text-align: right;
          }

          .total {
            margin-top: 1.5rem;
            padding: 1.5rem;
            background: #f5f5f7;
            border-radius: 1rem;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            gap: 2rem;
            padding: 0.4rem 0;
            font-size: 0.75rem;
          }

          .total-row.main {
            margin-top: 0.5rem;
            padding-top: 1rem;
            border-top: 1px solid #d2d2d7;
            font-size: 1.15rem;
            font-weight: 700;
          }

          .range {
            color: #0071e3;
          }

          .description {
            padding: 1rem;
            background: #f5f5f7;
            border-radius: 0.75rem;
            color: #424245;
            font-size: 0.75rem;
            white-space: pre-wrap;
          }

          .notice {
            margin-top: 2rem;
            padding-top: 1.25rem;
            border-top: 1px solid #d2d2d7;
            color: #86868b;
            font-size: 0.65rem;
          }

          .footer {
            margin-top: 3rem;
            padding-top: 1rem;
            border-top: 1px solid #d2d2d7;
            color: #86868b;
            font-size: 0.6rem;
            text-align: center;
          }

          @media print {
            body {
              padding: 0;
            }

            .document {
              max-width: none;
            }
          }
        </style>
      </head>

      <body>
        <div class="document">

          <header class="header">
            <div class="brand">
              BenTech

              <span>
                Security Systems
              </span>
            </div>

            <div class="quotation-title">
              <h1>Quotation</h1>

              <p>
                ${new Date().toLocaleDateString("en-TZ")}
              </p>
            </div>
          </header>

          <section class="section">
            <div class="section-title">
              Customer
            </div>

            <div class="details">

              <div class="detail">
                <small>Name</small>

                <strong>
                  ${escapeHtml(quotation.customer.name)}
                </strong>
              </div>

              <div class="detail">
                <small>Phone</small>

                <strong>
                  ${escapeHtml(quotation.customer.phone)}
                </strong>
              </div>

              <div class="detail">
                <small>Email</small>

                <strong>
                  ${escapeHtml(quotation.customer.email || "Not provided")}
                </strong>
              </div>

              <div class="detail">
                <small>Location</small>

                <strong>
                  ${escapeHtml(quotation.project.location || "Not specified")}
                </strong>
              </div>

            </div>
          </section>

          <section class="section">
            <div class="section-title">
              Services
            </div>

            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Quantity</th>
                  <th>Estimated Cost</th>
                </tr>
              </thead>

              <tbody>
                ${services}
              </tbody>
            </table>
          </section>

          <section class="total">

            <div class="total-row">
              <span>Estimated total</span>

              <strong>
                ${formatCurrency(quotation.estimate.total)}
              </strong>
            </div>

            <div class="total-row">
              <span>Approximate range</span>

              <strong class="range">
                ${formatCurrency(quotation.estimate.minimum)}
                –
                ${formatCurrency(quotation.estimate.maximum)}
              </strong>
            </div>

          </section>

          ${
            quotation.project.description
              ? `
                <section class="section">
                  <div class="section-title">
                    Project Details
                  </div>

                  <div class="description">
                    ${escapeHtml(quotation.project.description)}
                  </div>
                </section>
              `
              : ""
          }

          <div class="notice">
            This quotation is an approximate estimate and
            is not a final invoice. Final pricing may vary
            following site assessment, equipment selection,
            installation requirements and project specifications.
          </div>

          <footer class="footer">
            BenTech Security Systems · Professional
            security and automation solutions
          </footer>

        </div>
      </body>
    </html>
  `);

  documentWindow.document.close();
  documentWindow.focus();

  setTimeout(() => {
    documentWindow.print();
  }, 500);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

if (whatsappQuotation) {
  whatsappQuotation.addEventListener("click", sendQuotationToWhatsApp);
}

if (pdfQuotation) {
  pdfQuotation.addEventListener("click", createQuotationPrintDocument);
}
