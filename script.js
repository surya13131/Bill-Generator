// Load bills and products from localStorage
let bills = JSON.parse(localStorage.getItem("bills") || "[]");
let productListArr = JSON.parse(localStorage.getItem("products") || "[]");

// Ensure product list persists even after refresh
if (!Array.isArray(productListArr)) productListArr = [];
if (!Array.isArray(bills)) bills = [];

const btn = document.querySelector("button[onclick='addBill()']") || document.getElementById("addBillBtn") || document.querySelector("button");
let currentEditIndex = null;

// Toggle Add Product Section
function toggleAddProduct() {
  const sec = document.getElementById('addProductSection');
  sec.style.display = sec.style.display === 'none' || !sec.style.display ? 'block' : 'none';
}

// Add Product to localStorage
function addProduct() {
  const name = document.getElementById('newProductName').value.trim();
  const price = parseFloat(document.getElementById('newProductPrice').value);

  if (!name || isNaN(price)) {
    alert('Enter valid product name & price');
    return;
  }

  const existingProduct = productListArr.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (existingProduct) {
    existingProduct.price = price;
    alert('Product price updated');
  } else {
    productListArr.push({ name, price });
    alert('New product added');
  }

  localStorage.setItem("products", JSON.stringify(productListArr));
  document.getElementById('newProductName').value = '';
  document.getElementById('newProductPrice').value = '';
  renderProductList();
  populateProductSelect();
  toggleAddProduct();
}

// Render product list on UI
function renderProductList() {
  const listEl = document.getElementById('productList');
  if (!listEl) return;
  listEl.innerHTML = '';
  productListArr.forEach(prod => {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.textContent = `${prod.name} — ₹${prod.price.toFixed(2)}`;
    div.onclick = () => {
      const select = document.getElementById('productName');
      select.value = prod.name;
      onProductSelect();
      document.getElementById('productQty').focus();
    };
    listEl.appendChild(div);
  });
}

// Fill product dropdown
function populateProductSelect() {
  const select = document.getElementById('productName');
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '<option value="" disabled selected>Choose a product</option>';
  productListArr.forEach(prod => {
    const option = document.createElement('option');
    option.value = prod.name;
    option.textContent = prod.name;
    select.appendChild(option);
  });
  if (productListArr.some(p => p.name === currentValue)) {
    select.value = currentValue;
  }
}

// When product is selected, fill price
function onProductSelect() {
  const select = document.getElementById('productName');
  const selectedName = select.value;
  const product = productListArr.find(p => p.name === selectedName);
  document.getElementById('productPrice').value = product ? product.price : '';
}

// Button click to generate/save bill
btn.addEventListener("click", async () => {
  btn.disabled = true;
  btn.textContent = currentEditIndex === null ? "⏳ Generating..." : "⏳ Saving...";
  await addBill(currentEditIndex);
  btn.disabled = false;
  btn.textContent = "💾 Generate & Download PDF";
});

// Add bill logic
async function addBill(editIndex = null) {
  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const address = document.getElementById("customerAddress").value.trim();
  const product = document.getElementById("productName").value.trim();
  const qty = parseInt(document.getElementById("productQty").value);
  const price = parseFloat(document.getElementById("productPrice").value);
  const discount = parseFloat(document.getElementById("productDiscount").value) || 0;
  const total = (qty * price) - discount;

  if (!name || !product || isNaN(qty) || isNaN(price)) {
    alert("Please fill all required fields with valid values.");
    return;
  }

  const bill = { name, phone, address, product, qty, price, discount, total };
  if (editIndex !== null) bills[editIndex] = bill;
  else bills.push(bill);

  localStorage.setItem("bills", JSON.stringify(bills));
  updateTable();
  updateCustomerSuggestions();
  await generatePDF(bill);
  clearForm();
  currentEditIndex = null;
}

// Show table with all bills
function updateTable() {
  const tbody = document.querySelector("#billsTable tbody");
  tbody.innerHTML = "";
  bills.forEach((b, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${b.name}</td><td>${b.phone}</td><td>${b.product}</td>
      <td>${b.qty}</td><td>${formatINR(b.price)}</td>
      <td>${formatINR(b.discount)}</td><td>${formatINR(b.total)}</td>
      <td><button onclick="editBill(${i})">✏️</button></td>
      <td><button onclick="deleteBill(${i})">🗑️</button></td>`;
    tbody.appendChild(row);
  });
}

// Edit an existing bill
function editBill(index) {
  const b = bills[index];
  document.getElementById("customerName").value = b.name;
  document.getElementById("customerPhone").value = b.phone;
  document.getElementById("customerAddress").value = b.address;
  document.getElementById("productName").value = b.product;
  onProductSelect();
  document.getElementById("productQty").value = b.qty;
  document.getElementById("productPrice").value = b.price;
  document.getElementById("productDiscount").value = b.discount;

  currentEditIndex = index;
  btn.textContent = "💾 Save Edited Bill";
}

// Delete a bill
function deleteBill(index) {
  if (confirm("Delete this bill?")) {
    bills.splice(index, 1);
    localStorage.setItem("bills", JSON.stringify(bills));
    updateTable();
    updateCustomerSuggestions();
  }
}

// INR currency formatter
function formatINR(amount) {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

// Generate PDF (using pdfMake)
function generatePDF(bill) {
  return new Promise((resolve) => {
    const docDefinition = {
      content: [
        { text: 'Pro shop bill', style: 'header', alignment: 'right' },
        { text: 'Shop Name: PRO SHOP\nAddress: 2/70 Big Street, Zip Code: 631052\nPhone: 789456781', style: 'subheader' },
        { text: '\nBill To:', style: 'subheader' },
        `Name: ${bill.name}\nPhone: ${bill.phone}\nAddress: ${bill.address}`,
        {
          table: {
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              ['Item', 'Rate', 'Qty', 'Discount', 'Total'],
              [bill.product, formatINR(bill.price), bill.qty, formatINR(bill.discount), formatINR(bill.total)]
            ]
          },
          margin: [0, 20, 0, 0]
        },
        { text: `Total: ${formatINR(bill.total)}`, alignment: 'right', bold: true, margin: [0, 10, 0, 0] },
        { text: '\nThank you for shopping with us!', style: 'footer' }
      ],
      styles: {
        header: { fontSize: 18, bold: true },
        subheader: { fontSize: 12, margin: [0, 10, 0, 5] },
        footer: { fontSize: 10, italics: true, alignment: 'center', margin: [0, 20, 0, 0] }
      }
    };
    pdfMake.createPdf(docDefinition).download('pro_store.pdf', () => resolve());
  });
}

// Auto-fill customer details if they exist
function autoFillCustomer() {
  const name = document.getElementById("customerName").value;
  const match = bills.slice().reverse().find(b => b.name === name);
  document.getElementById("customerPhone").value = match?.phone || "";
  document.getElementById("customerAddress").value = match?.address || "";
  document.getElementById("productName").value = match?.product || "";
  onProductSelect();
  document.getElementById("lastPurchaseInfo").textContent = match ? `Last purchase: ${match.product}` : "";
}

// Show saved customer names in datalist
function updateCustomerSuggestions() {
  const list = document.getElementById("customerList");
  list.innerHTML = "";
  const names = [...new Set(bills.map(b => b.name))];
  names.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    list.appendChild(opt);
  });
}

// Clear the form
function clearForm() {
  document.querySelectorAll("input").forEach(i => i.value = "");
  document.getElementById("productName").value = "";
  document.getElementById("lastPurchaseInfo").textContent = "";
  currentEditIndex = null;
  btn.textContent = "💾 Generate & Download PDF";
}

// Load on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  updateCustomerSuggestions();
  updateTable();
  clearForm();
  renderProductList();
  populateProductSelect();

  document.getElementById('productName').addEventListener('change', onProductSelect);
  document.getElementById('customerName').addEventListener('input', autoFillCustomer);
});
