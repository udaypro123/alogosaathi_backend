 export function generateHostelReceiptHTML({
    receiptNumber,
    name,
    roomNumber,
    totalAmount,
    paymentMethod,
    hostelName,
    paymentDate
}) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Hostel Receipt</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f7fa;
                margin: 0;
                padding: 20px;
            }
            .receipt-container {
                background-color: #fff;
                border-radius: 12px;
                padding: 20px;
                max-width: 600px;
                margin: auto;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .receipt-header {
                text-align: center;
                border-bottom: 2px solid #4CAF50;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            .receipt-header h1 {
                margin: 0;
                color: #4CAF50;
            }
            .receipt-header p {
                margin: 5px 0;
                color: #555;
            }
            .receipt-details {
                margin-bottom: 20px;
            }
            .receipt-details table {
                width: 100%;
                border-collapse: collapse;
            }
            .receipt-details td {
                padding: 8px;
                border-bottom: 1px dashed #ddd;
            }
            .receipt-details td:first-child {
                font-weight: bold;
                color: #333;
            }
            .receipt-footer {
                text-align: center;
                font-size: 12px;
                color: #777;
                border-top: 2px solid #4CAF50;
                padding-top: 10px;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="receipt-container">
            <div class="receipt-header">
                <h1>${hostelName}</h1>
                <p><strong>Receipt No:</strong> ${receiptNumber}</p>
            </div>
            <div class="receipt-details">
                <table>
                    <tr>
                        <td>Issued To:</td>
                        <td>${name}</td>
                    </tr>
                    <tr>
                        <td>Room No:</td>
                        <td>${roomNumber}</td>
                    </tr>
                    <tr>
                        <td>Total Amount:</td>
                        <td>₹${totalAmount}</td>
                    </tr>
                    <tr>
                        <td>Payment Method:</td>
                        <td>${paymentMethod ? paymentMethod : "-"}</td>
                    </tr>
                    <tr>
                        <td>Payment Date:</td>
                        <td>${paymentDate ? `${new Date(paymentDate).toLocaleDateString()} ${new Date(paymentDate).toLocaleTimeString()}` : "-" }</td>
                    </tr>
                </table>
            </div>
            <div class="receipt-footer">
                Thank you for staying with us!<br>
            </div>
        </div>
    </body>
    </html>
    `;
}
