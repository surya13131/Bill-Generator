document.getElementById('invoiceForm').addEventListener('submit', function(e) {
  e.preventDefault();

  // Number to words function (Indian Numbering System)
  function numberToWords(num) {
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven',
      'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if ((num = num.toString()).length > 9) return 'Overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;

    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || (b[n[1][0]] + ' ' + a[n[1][1]])) + ' Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || (b[n[2][0]] + ' ' + a[n[2][1]])) + ' Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || (b[n[3][0]] + ' ' + a[n[3][1]])) + ' Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || (b[n[4][0]] + ' ' + a[n[4][1]])) + ' Hundred ' : '';
    str += (n[5] != 0) ? ((str !== '' ? 'and ' : '') + (a[Number(n[5])] || (b[n[5][0]] + ' ' + a[n[5][1]]))) + ' ' : '';
    return str.trim() + ' Rupees Only';
  }

  const form = new FormData(this);

  // **Get all checked copyType checkbox values**
  const checkedCopies = form.getAll('copyType[]');

  const now = new Date();

  const invoiceNo = `INV${now.getFullYear()}${('0' + (now.getMonth() + 1)).slice(-2)}${('0' + now.getDate()).slice(-2)}${('0' + now.getHours()).slice(-2)}${('0' + now.getMinutes()).slice(-2)}`;
  const dateStr = now.toLocaleDateString('en-IN');

  // Gather billed to data
  const billed = {
    name: form.get('billName') || '',
    address: form.get('billAddress') || '',
 gstin: '33DBQPR7500Q2ZV',
    state: form.get('billState') || '',
    code: form.get('billCode') || ''
  };

  // Gather shipped to data
  const shipped = {
    name: form.get('shipName') || '',
    address: form.get('shipAddress') || '',
  gstin: '33DBQPR7500Q2ZV',
    state: form.get('shipState') || '',
    code: form.get('shipCode') || ''
  };

  // Additional fields
  const extras = {
    reverse: form.get('reverseCharge') || '',
    challan: form.get('challanNo') || '',
    vehicle: form.get('vehicleNo') || '',
    place: form.get('placeSupply') || ''
  };

  // Get arrays for products
  const names = form.getAll('prodName[]');
  const hsns = form.getAll('hsn[]');
  const qtys = form.getAll('qty[]');
  const units = form.getAll('unit[]');
  const rates = form.getAll('rate[]');

  const rows = [];
  let taxableSum = 0;

  for (let i = 0; i < names.length; i++) {
    const qty = parseFloat(qtys[i]) || 0;
    const rate = parseFloat(rates[i]) || 0;
    const total = qty * rate;
    taxableSum += total;

    rows.push([
      i + 1,
      names[i] || '',
      hsns[i] || '',
      qty || 0,
      units[i] || '',
      rate.toFixed(2),
      total.toFixed(2)
    ]);
  }

  const cgstAmount = taxableSum * 0.09;
  const sgstAmount = taxableSum * 0.09;
  const totalGST = cgstAmount + sgstAmount;
  const grandTotal = taxableSum + totalGST;

  // Helper for small box with code
  function smallBox(text) {
    return {
      stack: [{ text: text, fontSize: 8, alignment: 'center', margin: [0, 2, 0, 2] }],
      margin: [2, 0, 0, 0],
      border: [true, true, true, true],
      width: 25,
      height: 15,
      alignment: 'center'
    };
  }

  // Layout with full borders (all horizontal & vertical lines)
  const fullBorderLayout = {
    hLineWidth: () => 1,
    vLineWidth: () => 1,
    hLineColor: () => 'black',
    vLineColor: () => 'black',
    paddingLeft: () => 4,
    paddingRight: () => 4,
    paddingTop: () => 2,
    paddingBottom: () => 2,
  };



  const doc = {
    pageMargins: [40, 40, 40, 40],
    content: [
      {
        text: 'JEEVITHA ENTERPRISES',
        style: 'header',
        alignment: 'center',
        color: '#0277bd',
        margin: [0, 0, 0, 6]
      },
      {
        text: 'S.No.255/2, Dusi Village & Post, Vembakkam, TK, T.V.Malai Dist - 631 702.\nGSTIN : 33BDXPS0279G2ZY',
        alignment: 'center',
        margin: [0, 0, 0, 10],
        color: '#0288d1',
        fontSize: 9
      },
      { text: 'TAX INVOICE', style: 'title', alignment: 'center', margin: [0, 0, 0, 20], color: '#01579b' },

      // **Display Copy Type here**
      {
        text: 'Copy Type: ' + (checkedCopies.length ? checkedCopies.join(', ') : 'None'),
        margin: [0, 0, 0, 10],
        bold: true,
        fontSize: 10,
        color: '#000'
      },

      // Top details (invoice info)
      {
        columns: [
          {
            width: '50%',
            table: {
              widths: ['40%', '60%'],
              body: [
                [{ text: 'Reverse Charge', bold: true, fillColor: '#bbdefb', fontSize: 9 }, extras.reverse || ''],
                [{ text: 'Challan No.', bold: true, fillColor: '#bbdefb', fontSize: 9 }, extras.challan || ''],
                [{ text: 'Invoice No.', bold: true, fillColor: '#bbdefb', fontSize: 9 }, invoiceNo],
                [{ text: 'Invoice Date', bold: true, fillColor: '#bbdefb', fontSize: 9 }, dateStr],
                [{ text: 'State', bold: true, fillColor: '#bbdefb', fontSize: 9 }, billed.state]
              ]
            },
            layout: fullBorderLayout
          },
          {
            width: '50%',
            table: {
              widths: ['50%', '50%'],
              body: [
                [{ text: 'Challan No.', bold: true, fillColor: '#bbdefb', fontSize: 9 }, { text: extras.challan || '', alignment: 'right' }],
                [{ text: 'Vehicle No.', bold: true, fillColor: '#bbdefb', fontSize: 9 }, extras.vehicle || ''],
                [{ text: 'Date of Supply', bold: true, fillColor: '#bbdefb', fontSize: 9 }, dateStr],
                [{ text: 'Place of Supply', bold: true, fillColor: '#bbdefb', fontSize: 9 }, extras.place || '']
              ]
            },
            layout: fullBorderLayout
          }
        ],
        columnGap: 10,
        margin: [0, 10, 0, 10]
      },

      // Billing + Shipping details
      {
        columns: [
          {
            width: '50%',
            table: {
              widths: ['*', 40],
              body: [
                [
                  {
                    stack: [
                      { text: 'Details of Receiver / Billed to:', bold: true, fillColor: '#bbdefb', fontSize: 10, margin: [0, 0, 0, 4] },
                      { text: billed.name }, { text: billed.address }, { text: 'GSTIN: ' + billed.gstin }
                    ],
                    margin: [4, 0, 0, 0]
                  },
                  smallBox(billed.code)
                ],
                [{ text: 'State:', bold: true, fontSize: 9, margin: [4, 4, 0, 0] }, smallBox(billed.state)]
              ]
            },
            layout: fullBorderLayout
          },
          {
            width: '50%',
            table: {
              widths: ['*', 40],
              body: [
                [
                  {
                    stack: [
                      { text: 'Details of Consignee / Shipped to:', bold: true, fillColor: '#bbdefb', fontSize: 10, margin: [0, 0, 0, 4] },
                      { text: shipped.name }, { text: shipped.address }, { text: 'GSTIN: ' + shipped.gstin }
                    ],
                    margin: [4, 0, 0, 0]
                  },
                  smallBox(shipped.code)
                ],
                [{ text: 'State:', bold: true, fontSize: 9, margin: [4, 4, 0, 0] }, smallBox(shipped.state)]
              ]
            },
            layout: fullBorderLayout
          }
        ],
        columnGap: 10,
        margin: [0, 10, 0, 10]
      },

      // Products Table
      {
        table: {
          headerRows: 1,
          widths: ['6%', 'auto', '10%', '6%', '6%', '10%', '12%', '12%', '12%', '12%'],
          body: [
            [
              { text: 'Sr.', bold: true, fillColor: '#bbdefb', fontSize: 8, alignment: 'center' },
              { text: 'Name of product', bold: true, fillColor: '#bbdefb', fontSize: 8, alignment: 'center' },
              { text: 'HSN/SAC', bold: true, fillColor: '#bbdefb', fontSize: 8, alignment: 'center' },
              { text: 'QTY', bold: true, fillColor: '#bbdefb', fontSize: 8, alignment: 'center' },
              { text: 'Unit', bold: true, fillColor: '#bbdefb', fontSize: 8, alignment: 'center' },
              { text: 'Rate', bold: true, fillColor: '#bbdefb', fontSize: 8, alignment: 'center' },
              { text: 'Taxable Value', bold: true, fillColor: '#bbdefb', fontSize: 8, alignment: 'center' },
              { text: 'CGST (9%)', bold: true, fillColor: '#bbdefb', fontSize: 8, alignment: 'center' },
              { text: 'SGST (9%)', bold: true, fillColor: '#bbdefb', fontSize: 8, alignment: 'center' },
              { text: 'Total', bold: true, fillColor: '#bbdefb', fontSize: 8, alignment: 'center' }
            ],
            ...rows.map((r) => {
              const taxable = parseFloat(r[6]) || 0;
              return [
                { text: r[0], alignment: 'center' },
                { text: r[1] },
                { text: r[2], alignment: 'center' },
                { text: r[3], alignment: 'center' },
                { text: r[4], alignment: 'center' },
                { text: `₹${parseFloat(r[5]).toFixed(2)}`, alignment: 'right' },
                { text: `₹${taxable.toFixed(2)}`, alignment: 'right', fillColor: '#e3f2fd' },
                { text: `₹${(taxable * 0.09).toFixed(2)}`, alignment: 'right', fillColor: '#e3f2fd' },
                { text: `₹${(taxable * 0.09).toFixed(2)}`, alignment: 'right', fillColor: '#e3f2fd' },
                { text: `₹${(taxable + taxable * 0.18).toFixed(2)}`, alignment: 'right' }
              ];
            })
          ]
        },
        layout: fullBorderLayout,
        margin: [0, 10, 0, 20]
      },

      // Invoice Amount Summary
      {
        table: {
          widths: ['60%', '40%'],
          body: [[
            { text: `Total Invoice Amount`, italics: true, fillColor: '#e3f2fd', margin: [4, 8, 0, 8] },
            {
              table: {
                widths: ['60%', '40%'],
                body: [
                  ['Total Amount Before Tax', { text: `₹${taxableSum.toFixed(2)}`, alignment: 'right' }],
                  ['Add : CGST', { text: `₹${cgstAmount.toFixed(2)}`, alignment: 'right' }],
                  ['Add : SGST', { text: `₹${sgstAmount.toFixed(2)}`, alignment: 'right' }],
                  ['Tax Amount : GST', { text: `₹${totalGST.toFixed(2)}`, alignment: 'right' }],
                  ['Round Off Value', { text: '', alignment: 'right' }],
                  ['Amount With Tax', { text: `₹${grandTotal.toFixed(2)}`, alignment: 'right', bold: true }]
                ]
              },
              layout: fullBorderLayout
            }
          ]]
        },
        margin: [0, 0, 0, 15]
      },

      // Amount in Words Display
      {
        text: 'Total Amount in Words: ' + numberToWords(Math.round(grandTotal)),
        margin: [0, 0, 0, 20],
        color: '#01579b',
        bold: true
      },

      // Terms & Conditions
      {
        text: 'Terms & Conditions:',
        bold: true,
        fontSize: 9,
        margin: [0, 0, 0, 4]
      },
      {
        ul: [
          ' 1. This is an electronically generated document. ',
          '2. All disputes are subject to Kancheepuram jurisdiction'
        ],
        fontSize: 8
      },

      // Signature block
      {
        columns: [
          { width: '60%', text: '' },
          {
            width: '40%',
            stack: [
  {
    text: 'Certified that the particulars given above are true and correct',
    alignment: 'center',
    margin: [0, 20, 0, 10],
    fontSize: 9
  },
  {
    text: 'For Jeevitha Enterprises',
    alignment: 'center',
    margin: [0, 10, 0, 30],
    fontSize: 10,
    bold: true
  },
  {
    text: 'Authorised Signatory',
    alignment: 'center',
    fontSize: 9
  }
]

          }
        ]
      }
    ],
    styles: {
      header: { fontSize: 16, bold: true },
      title: { fontSize: 14, bold: true }
    },
    defaultStyle: {
      fontSize: 10
    }
  };

  pdfMake.createPdf(doc).download(`Invoice_${invoiceNo}.pdf`);
});
