let bills = JSON.parse(localStorage.getItem("bills") || "[]");
let productListArr = JSON.parse(localStorage.getItem("products") || "[]");

const btn = document.querySelector("button[onclick='addBill()']") || document.getElementById("addBillBtn") || document.querySelector("button");
let currentEditIndex = null;

function toggleAddProduct() {
  const sec = document.getElementById('addProductSection');
  sec.style.display = sec.style.display === 'none' || !sec.style.display ? 'block' : 'none';
}

function addProduct() {
  const name = document.getElementById('newProductName').value.trim();
  const price = parseFloat(document.getElementById('newProductPrice').value);

  if (!name || isNaN(price)) {
    alert('Enter valid product name & price');
    return;
  }

  const existingProduct = productListArr.find(p => p.name.toLowerCase() === name.toLowerCase() && p.price === price);
  if (existingProduct) {
    alert('Product with same name and price already exists');
    return;
  }

  const existingProductWithName = productListArr.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (existingProductWithName) {
    existingProductWithName.price = price;
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

function renderProductList() {
  const listEl = document.getElementById('productList');
  listEl.innerHTML = '';
  productListArr.forEach((prod, idx) => {
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

function populateProductSelect() {
  const select = document.getElementById('productName');
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

function onProductSelect() {
  const select = document.getElementById('productName');
  const selectedName = select.value;
  const product = productListArr.find(p => p.name === selectedName);
  if (product) {
    document.getElementById('productPrice').value = product.price;
  } else {
    document.getElementById('productPrice').value = '';
  }
}

btn.addEventListener("click", async () => {
  btn.disabled = true;
  btn.textContent = currentEditIndex === null ? "⏳ Generating..." : "⏳ Saving...";
  await addBill(currentEditIndex);
  btn.disabled = false;
  btn.textContent = "💾 Generate & Download PDF";
});

async function addBill(editIndex = null) {
  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const address = document.getElementById("customerAddress").value.trim();
  const product = document.getElementById("productName").value.trim();
  const qty = parseInt(document.getElementById("productQty").value);
  const price = parseFloat(document.getElementById("productPrice").value);
  const discount = parseFloat(document.getElementById("productDiscount").value) || 0;
  const total = (qty * price) - discount;

  if (!name || !product || isNaN(qty) || isNaN(price) || isNaN(discount)) {
    alert("Please fill all required fields with valid values.");
    return;
  }

  const bill = { name, phone, address, product, qty, price, discount, total };
  if (editIndex !== null) bills[editIndex] = bill;
  else bills.push(bill);

  localStorage.setItem("bills", JSON.stringify(bills));
  updateTable();
  updateCustomerSuggestions();

  await new Promise(resolve => setTimeout(resolve, 300));
  await generatePDF(bill);

  clearForm();
  currentEditIndex = null;
}

function formatINR(amount) {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function generatePDF(bill) {
  return new Promise((resolve) => {
    const docDefinition = {
      pageMargins: [40, 60, 40, 60],
      content: [
        { text: 'Pro shop bill', style: 'header', alignment: 'right' },
        {
          text: 'Shop Name:PRO SHOP\nShop Address:2/70 big street, Zip Code:631052\nPhone Number:789456781',
          style: 'subheader'
        },
        { text: '\nBill To:', style: 'subheader' },
        `Name: ${bill.name}`,
        `Phone: ${bill.phone}`,
        `Address: ${bill.address}`,
        {
          columns: [
            { width: '*', text: '' },
            [
              { text: `Bill Date: ${new Date().toISOString().split("T")[0]}`, alignment: 'right' },
              { text: `Total: ${formatINR(bill.total)}`, bold: true, alignment: 'right' }
            ]
          ],
          columnGap: 10,
          margin: [0, 15, 0, 15]
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Item', fillColor: '#4a90e2', color: 'white', margin: [8, 10, 8, 10], alignment: 'left', bold: true },
                { text: 'Rate', fillColor: '#4a90e2', color: 'white', margin: [8, 10, 8, 10], alignment: 'right', bold: true },
                { text: 'Quantity', fillColor: '#4a90e2', color: 'white', margin: [8, 10, 8, 10], alignment: 'right', bold: true },
                { text: 'Discount', fillColor: '#4a90e2', color: 'white', margin: [8, 10, 8, 10], alignment: 'right', bold: true },
                { text: 'Total', fillColor: '#4a90e2', color: 'white', margin: [8, 10, 8, 10], alignment: 'right', bold: true }
              ],
              [
                { text: bill.product, margin: [8, 8, 8, 8], alignment: 'left' },
                { text: formatINR(bill.price), margin: [8, 8, 8, 8], alignment: 'right' },
                { text: bill.qty.toString(), margin: [8, 8, 8, 8], alignment: 'right' },
                { text: formatINR(bill.discount), margin: [8, 8, 8, 8], alignment: 'right' },
                { text: formatINR(bill.total), margin: [8, 8, 8, 8], alignment: 'right' }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#cccccc',
            vLineColor: () => '#cccccc',
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 6,
            paddingBottom: () => 6,
            fillColor: (rowIndex) => (rowIndex % 2 === 0 && rowIndex !== 0) ? '#f3f6fb' : null
          }
        },
        {
          columns: [
            { width: '*', text: '' },
            {
              stack: [
                { text: `Subtotal: ${formatINR(bill.qty * bill.price)}`, margin: [0, 3, 0, 3] },
                { text: `Discount: ${formatINR(bill.discount)}`, margin: [0, 3, 0, 3] },
                { text: `Total: ${formatINR(bill.total)}`, bold: true, margin: [0, 8, 0, 0] }
              ],
              alignment: 'right'
            }
          ],
          margin: [0, 20, 0, 0]
        },
        { text: '\nThank You For Purchasing In Our Store.', style: 'terms' }
      ],
      styles: {
        header: { fontSize: 20, bold: true, margin: [0, 0, 0, 20] },
        subheader: { fontSize: 12, bold: true, margin: [0, 10, 0, 5] },
        terms: { fontSize: 10, italics: true, margin: [0, 30, 0, 0] }
      },
      defaultStyle: { fontSize: 11, lineHeight: 1.2 }
    };

    pdfMake.createPdf(docDefinition).download(`pro_store.pdf`, () => {
  resolve();
});

  });
}

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

function deleteBill(i) {
  if (confirm("Delete this bill?")) {
    bills.splice(i, 1);
    localStorage.setItem("bills", JSON.stringify(bills));
    updateTable();
    updateCustomerSuggestions();
  }
}

function toggleTable() {
  const modal = document.getElementById("tableModal");
  modal.style.display = modal.style.display === "flex" ? "none" : "flex";
  updateTable();
}

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

function autoFillCustomer() {
  const name = document.getElementById("customerName").value;
  const match = bills.slice().reverse().find(b => b.name === name);
  document.getElementById("customerPhone").value = match?.phone || "";
  document.getElementById("customerAddress").value = match?.address || "";
  document.getElementById("productName").value = match?.product || "";
  onProductSelect();
  document.getElementById("lastPurchaseInfo").textContent = match ? `Last purchase: ${match.product}` : "";
}

function clearForm() {
  document.querySelectorAll("input").forEach(i => i.value = "");
  document.getElementById("productName").value = "";
  document.getElementById("lastPurchaseInfo").textContent = "";
  currentEditIndex = null;
  btn.textContent = "💾 Generate & Download PDF";
}

window.addEventListener('DOMContentLoaded', () => {
  updateCustomerSuggestions();
  updateTable();
  clearForm();
  renderProductList();
  populateProductSelect();

  document.getElementById('productName').addEventListener('change', onProductSelect);
  document.getElementById('customerName').addEventListener('input', autoFillCustomer);
});
