/************************************************************
 * CONCRETE IDEAS — SIMPLE ORDER + PAYMENT BACKEND
 *
 * One order = one commercial record.
 * No quotation versions are maintained.
 *
 * Sheets:
 *   Enquiries
 *   Enquiry Items
 *   Payment Confirmed Orders
 *   Dashboard
 ************************************************************/

const CONFIG = {
  BUSINESS_NAME: "Concrete Ideas",
  WEBSITE: "https://concreteideas.co",
  ORDER_PREFIX: "CI",
  PAYMENT_UPI_ID: "payme12@okhdfcbank",
  PAYMENT_NAME: "Concrete Ideas",
  SHIPMENT_RATE: 0.05,
  QUOTATION_VALID_DAYS: 7,
  SALES_EMAIL: "concreteideas.sales@gmail.com",
  NEW_ORDER_ALERT_EMAIL: "info@concreteideas.co",
  QUOTATION_FOLDER: "Concrete Ideas Quotations",
  BILL_FOLDER: "Concrete Ideas Bills"
};

function setupConcreteIdeasCRM() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const enquiries = getOrCreateSheet_(ss, "Enquiries");
  const enquiryHeaders = [
    "Order ID","Created At","Status","Name","Company / Studio","Email",
    "Phone / WhatsApp","Project","Delivery Location","Message","Item Count",
    "Product Value","Shipment Charge","Order Total","Last Updated","Quote Sent At",
    "Quote PDF URL","Payment Done At","Bill PDF URL","Internal Notes"
  ];
  ensureHeaders_(enquiries, enquiryHeaders);
  formatHeader_(enquiries, enquiryHeaders.length);

  const items = getOrCreateSheet_(ss, "Enquiry Items");
  const itemHeaders = [
    "Order ID","Product ID","Product","Size","Dimension","Weight",
    "Quantity","Rate","Line Value"
  ];
  ensureHeaders_(items, itemHeaders);
  formatHeader_(items, itemHeaders.length);

  const confirmed = getOrCreateSheet_(ss, "Payment Confirmed Orders");
  const confirmedHeaders = [
    "Order ID","Payment Confirmed At","Name","Company / Studio","Email",
    "Phone / WhatsApp","Project","Delivery Location","Product ID","Product",
    "Size","Dimension","Weight","Quantity","Rate","Line Value","Order Total",
    "Manufacturing Status","Notes"
  ];
  ensureHeaders_(confirmed, confirmedHeaders);
  formatHeader_(confirmed, confirmedHeaders.length);

  const dashboard = getOrCreateSheet_(ss, "Dashboard");
  createSheetDashboard_(dashboard, enquiries);

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["NEW", "Quote Sent", "Payment done"], true)
    .setAllowInvalid(false).build();
  enquiries.getRange(2,3,Math.max(enquiries.getMaxRows()-1,1),1).setDataValidation(statusRule);

  // Remove legacy quote/pricing/discount workflow sheets. Historical data is no
  // longer used by the order system; the Enquiries + Enquiry Items records are the source.
  ["Product Pricing","Quotes","Quote Items","Follow-ups","Discount Rules"].forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet && ss.getSheets().length > 1) ss.deleteSheet(sheet);
  });

  ensurePublicOrderDeliveryTrigger_();
  Logger.log("Concrete Ideas simple order CRM setup complete.");
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile("Admin")
    .setTitle("Concrete Ideas — Order Review")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.parameter.payload || "{}");
    if (String(data.type || "").toLowerCase() !== "order") {
      throw new Error("Unsupported submission type.");
    }
    return processPublicOrder_(data);
  } catch (error) {
    return createResultPage_(false, "", cleanErrorMessage_(error), "concreteideas-order-result");
  }
}

function processPublicOrder_(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const enquiries = ss.getSheetByName("Enquiries");
  const itemsSheet = ss.getSheetByName("Enquiry Items");
  if (!enquiries || !itemsSheet) throw new Error("Required sheets not found. Run setupConcreteIdeasCRM().");

  const customer = data.customer || {};
  const items = Array.isArray(data.items) ? data.items : [];
  if (!customer.name || !customer.email || !customer.phone || !customer.location) {
    throw new Error("Name, email, phone and delivery location are required.");
  }
  if (!items.length) throw new Error("Order contains no products.");

  const processed = [];
  let itemCount = 0;
  let productValue = 0;

  items.forEach(item => {
    const quantity = Number(item.quantity || 0);
    const rate = Number(item.rate);
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Invalid quantity for " + (item.product || item.productId) + ".");
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("Missing or invalid rate for product '" + (item.productId || item.product) + "', size '" + (item.size || "") + "'.");
    }
    const lineValue = rate * quantity;
    itemCount += quantity;
    productValue += lineValue;
    processed.push({
      productId:String(item.productId || ""), product:String(item.product || ""), size:String(item.size || ""),
      dimension:String(item.dimension || ""), weight:String(item.weight || ""), quantity, rate, lineValue
    });
  });

  const shipment = productValue * CONFIG.SHIPMENT_RATE;
  const total = productValue + shipment;
  const orderId = generateOrderId_();
  const now = new Date();

  enquiries.appendRow([
    orderId, now, "NEW", customer.name || "", customer.company || "", customer.email || "",
    customer.phone || "", customer.project || "", customer.location || "", customer.message || "",
    itemCount, productValue, shipment, total, now, "", "", "", "", ""
  ]);

  const rows = processed.map(item => [
    orderId,item.productId,item.product,item.size,item.dimension,item.weight,
    item.quantity,item.rate,item.lineValue
  ]);
  itemsSheet.getRange(itemsSheet.getLastRow()+1,1,rows.length,rows[0].length).setValues(rows);

  // Send an immediate internal alert as soon as the order is safely recorded.
  // Failure to send the alert must never cause the customer's order to fail.
  try {
    sendNewOrderAlert_(orderId);
  } catch (alertError) {
    console.error("New order alert email failed", orderId, cleanErrorMessage_(alertError));
  }

  enqueuePublicOrderDelivery_({orderId, attempts:0, queuedAt:now.toISOString()});

  return createResultPage_(true, orderId, "", "concreteideas-order-result", "",
    "Your order has been received. We are preparing your quotation and will email it shortly.");
}

function generateOrderId_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const props = PropertiesService.getScriptProperties();
    const year = String(new Date().getFullYear());
    let storedYear = props.getProperty("ORDER_COUNTER_YEAR");
    let counter = Number(props.getProperty("ORDER_COUNTER") || 0);
    if (storedYear !== year) counter = 0;
    counter++;
    props.setProperty("ORDER_COUNTER", String(counter));
    props.setProperty("ORDER_COUNTER_YEAR", year);
    return CONFIG.ORDER_PREFIX + "-" + year + "-" + String(counter).padStart(4,"0");
  } finally { lock.releaseLock(); }
}

function sendNewOrderAlert_(orderId) {
  const order = getOrder_(orderId);
  if (!order) throw new Error("Order not found: " + orderId);

  const lines = order.items.map(i =>
    "• " + i.product + " — " + i.size + " × " + i.quantity +
    " @ " + formatCurrency_(i.rate) + " = " + formatCurrency_(i.lineValue)
  ).join("\n");

  const body =
    "A new order has been received on the Concrete Ideas website.\n\n" +
    "Order ID: " + order.orderId + "\n" +
    "Customer: " + order.name + "\n" +
    "Company / Studio: " + (order.company || "—") + "\n" +
    "Email: " + order.email + "\n" +
    "Phone / WhatsApp: " + order.phone + "\n" +
    "Project: " + (order.project || "—") + "\n" +
    "Delivery Location: " + order.location + "\n\n" +
    "Items:\n" + lines + "\n\n" +
    "Product value: " + formatCurrency_(order.productValue) + "\n" +
    "Shipment (5%): " + formatCurrency_(order.shipment) + "\n" +
    "Order total: " + formatCurrency_(order.orderTotal) + "\n\n" +
    "Status: NEW\n" +
    "Quotation generation and customer email are being processed automatically.";

  MailApp.sendEmail({
    to: CONFIG.NEW_ORDER_ALERT_EMAIL,
    subject: "New order received — " + order.orderId,
    body: body,
    name: CONFIG.BUSINESS_NAME
  });
}

function enqueuePublicOrderDelivery_(job) {
  const props = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    let jobs = [];
    try { jobs = JSON.parse(props.getProperty("PUBLIC_ORDER_DELIVERY_QUEUE") || "[]"); } catch (_) {}
    if (!Array.isArray(jobs)) jobs = [];
    jobs.push(job);
    props.setProperty("PUBLIC_ORDER_DELIVERY_QUEUE", JSON.stringify(jobs));
  } finally { lock.releaseLock(); }
}

function processPublicOrderDeliveryQueue_() {
  const props = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    let jobs = [];
    try { jobs = JSON.parse(props.getProperty("PUBLIC_ORDER_DELIVERY_QUEUE") || "[]"); } catch (_) {}
    if (!Array.isArray(jobs) || !jobs.length) return;
    const remaining = [];
    jobs.slice(0,3).forEach(job => {
      try {
        sendQuotationForOrder_(job.orderId);
      } catch (error) {
        job.attempts = Number(job.attempts || 0) + 1;
        job.lastError = cleanErrorMessage_(error);
        job.lastAttemptAt = new Date().toISOString();
        if (job.attempts <= 10) remaining.push(job);
        console.error("Order quotation delivery failed", job.orderId, job.lastError);
      }
    });
    if (jobs.length > 3) remaining.push.apply(remaining, jobs.slice(3));
    props.setProperty("PUBLIC_ORDER_DELIVERY_QUEUE", JSON.stringify(remaining));
  } finally { lock.releaseLock(); }
}

function sendQuotationForOrder_(orderId) {
  const order = getOrder_(orderId);
  if (!order) throw new Error("Order not found: " + orderId);
  if (String(order.status).toLowerCase() === "quote sent" || String(order.status).toLowerCase() === "payment done") return;
  const pdf = generateOrderQuotePdf(orderId);
  const file = DriveApp.getFileById(pdf.fileId);
  const greeting = order.name ? "Dear " + order.name + "," : "Dear Sir / Madam,";
  const body = greeting + "\n\nPlease find attached your quotation from Concrete Ideas.\n\n" +
    "Order: " + order.orderId + "\n" +
    "Total: " + formatCurrency_(order.orderTotal) + "\n" +
    "Valid until: " + formatQuoteDate_(new Date(Date.now()+CONFIG.QUOTATION_VALID_DAYS*86400000)) + "\n\n" +
    "The quotation includes the applicable 5% shipment charge. Please use the payment QR code in the quotation when you are ready to proceed.\n\n" +
    "Regards,\nConcrete Ideas\n" + CONFIG.WEBSITE;
  MailApp.sendEmail({to:order.email, subject:"Quotation " + order.orderId + " — Concrete Ideas", body, attachments:[file.getBlob()], name:CONFIG.BUSINESS_NAME});
  updateOrderStatus_(orderId,"Quote Sent",{"Quote Sent At":new Date(),"Quote PDF URL":pdf.url});
}

function generateOrderQuotePdf(orderId) {
  const order = getOrder_(orderId);
  if (!order) throw new Error("Order not found: " + orderId);
  const folder = getOrCreateFolder_(CONFIG.QUOTATION_FOLDER);
  const doc = DocumentApp.create(CONFIG.BUSINESS_NAME + " - Quotation " + order.orderId);
  try {
    const body = doc.getBody(); body.clear();
    body.setMarginTop(40); body.setMarginBottom(40); body.setMarginLeft(48); body.setMarginRight(48);
    const title = body.appendParagraph(CONFIG.BUSINESS_NAME.toUpperCase()); title.setHeading(DocumentApp.ParagraphHeading.TITLE); title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    const subtitle = body.appendParagraph("QUOTATION"); subtitle.setAlignment(DocumentApp.HorizontalAlignment.CENTER); subtitle.setBold(true);
    body.appendParagraph("");
    const meta = body.appendTable([["Order",order.orderId],["Date",formatQuoteDate_(order.createdAt)],["Valid Until",formatQuoteDate_(new Date(new Date(order.createdAt).getTime()+CONFIG.QUOTATION_VALID_DAYS*86400000))],["Project",order.project || "—"]]); meta.setBorderWidth(0);
    body.appendParagraph("");
    const customer = body.appendParagraph("TO"); customer.setBold(true);
    body.appendParagraph(order.name || ""); if (order.company) body.appendParagraph(order.company); if (order.email) body.appendParagraph(order.email); if (order.phone) body.appendParagraph(order.phone); if (order.location) body.appendParagraph(order.location);
    body.appendParagraph("");
    const table = body.appendTable();
    const header = table.appendTableRow();
    ["Product","Size","Dimensions","Weight","Qty","Unit Price","Value"].forEach(t=>{const c=header.appendTableCell(t);c.setBackgroundColor("#eee9e2");c.getChild(0).asParagraph().setBold(true);});
    order.items.forEach(item=>{const r=table.appendTableRow();[item.product,item.size,item.dimension,item.weight,String(item.quantity),formatCurrency_(item.rate),formatCurrency_(item.lineValue)].forEach(t=>r.appendTableCell(String(t||"")));});
    body.appendParagraph("");
    const totals = body.appendTable([["Products",formatCurrency_(order.productValue)],["Shipment (5%)",formatCurrency_(order.shipment)],["TOTAL",formatCurrency_(order.orderTotal)]]); totals.setBorderWidth(0); totals.getRow(2).getCell(0).getChild(0).asParagraph().setBold(true); totals.getRow(2).getCell(1).getChild(0).asParagraph().setBold(true);
    body.appendParagraph("");
    const pt=body.appendParagraph("PAYMENT"); pt.setBold(true);
    body.appendParagraph("Please scan the QR code below with Google Pay or another UPI app to make payment.");
    const qr=createPaymentQrBlob_(order.orderId,order.orderTotal); const qp=body.appendParagraph(""); qp.setAlignment(DocumentApp.HorizontalAlignment.CENTER); qp.appendInlineImage(qr).setWidth(150).setHeight(150);
    body.appendParagraph("UPI ID: " + CONFIG.PAYMENT_UPI_ID).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph(""); body.appendParagraph("Once payment is completed, please retain your payment confirmation. Concrete Ideas will verify the payment and confirm the order for manufacturing.").setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph(""); body.appendParagraph("Thank you for considering Concrete Ideas.").setAlignment(DocumentApp.HorizontalAlignment.CENTER); body.appendParagraph(CONFIG.WEBSITE).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    doc.saveAndClose(); Utilities.sleep(500);
    const docFile=DriveApp.getFileById(doc.getId()); const pdfBlob=docFile.getBlob().setName(order.orderId+".pdf"); const pdfFile=folder.createFile(pdfBlob); pdfFile.setName(order.orderId+".pdf"); docFile.setTrashed(true);
    return {success:true,fileId:pdfFile.getId(),url:pdfFile.getUrl()};
  } catch(error){ try{DriveApp.getFileById(doc.getId()).setTrashed(true);}catch(_){} throw error; }
}

function markPaymentDone(orderId) {
  const lock=LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const order=getOrder_(orderId); if(!order) throw new Error("Order not found: " + orderId);
    if(String(order.status).toLowerCase()==="payment done") return {success:true,orderId,alreadyDone:true,billPdfUrl:order.billPdfUrl||""};
    if(String(order.status).toLowerCase()!=="quote sent") throw new Error("Only orders with status 'Quote Sent' can be marked Payment done.");

    const confirmedAt=new Date();
    updateOrderStatus_(orderId,"Payment done",{"Payment Done At":confirmedAt});

    const bill=generateOrderBillPdf(orderId);
    updateOrderStatus_(orderId,"Payment done",{"Bill PDF URL":bill.url});
    emailBillToCustomer_(order,bill);
    appendPaymentConfirmedOrders_(order,confirmedAt);
    sendSalesPaymentConfirmation_(orderId);

    return {success:true,orderId,billPdfUrl:bill.url};
  } finally { lock.releaseLock(); }
}

function generateOrderBillPdf(orderId) {
  const order=getOrder_(orderId); if(!order) throw new Error("Order not found: "+orderId);
  const folder=getOrCreateFolder_(CONFIG.BILL_FOLDER);
  const billId=order.orderId+"-BILL";
  const doc=DocumentApp.create(CONFIG.BUSINESS_NAME+" - Bill "+billId);
  try{
    const body=doc.getBody(); body.clear(); body.setMarginTop(40);body.setMarginBottom(40);body.setMarginLeft(48);body.setMarginRight(48);
    const title=body.appendParagraph(CONFIG.BUSINESS_NAME.toUpperCase()); title.setHeading(DocumentApp.ParagraphHeading.TITLE);title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    const sub=body.appendParagraph("BILL / PAYMENT RECEIPT");sub.setAlignment(DocumentApp.HorizontalAlignment.CENTER);sub.setBold(true);body.appendParagraph("");
    const meta=body.appendTable([["Bill",billId],["Order",order.orderId],["Date",formatQuoteDate_(new Date())],["Project",order.project||"—"]]);meta.setBorderWidth(0);body.appendParagraph("");
    const customer=body.appendParagraph("BILLED TO");customer.setBold(true);body.appendParagraph(order.name||"");if(order.company)body.appendParagraph(order.company);if(order.email)body.appendParagraph(order.email);if(order.phone)body.appendParagraph(order.phone);if(order.location)body.appendParagraph(order.location);body.appendParagraph("");
    const table=body.appendTable();const h=table.appendTableRow();["Product","Size","Dimensions","Qty","Rate","Value"].forEach(t=>{const c=h.appendTableCell(t);c.setBackgroundColor("#eee9e2");c.getChild(0).asParagraph().setBold(true);});
    order.items.forEach(i=>{const r=table.appendTableRow();[i.product,i.size,i.dimension,String(i.quantity),formatCurrency_(i.rate),formatCurrency_(i.lineValue)].forEach(t=>r.appendTableCell(String(t||"")));});
    body.appendParagraph("");const totals=body.appendTable([["Products",formatCurrency_(order.productValue)],["Shipment (5%)",formatCurrency_(order.shipment)],["TOTAL PAID",formatCurrency_(order.orderTotal)]]);totals.setBorderWidth(0);totals.getRow(2).getCell(0).getChild(0).asParagraph().setBold(true);totals.getRow(2).getCell(1).getChild(0).asParagraph().setBold(true);
    body.appendParagraph("");body.appendParagraph("Payment received and verified. Thank you for your order.").setAlignment(DocumentApp.HorizontalAlignment.CENTER);body.appendParagraph(CONFIG.WEBSITE).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    doc.saveAndClose();Utilities.sleep(500);const df=DriveApp.getFileById(doc.getId());const pdf=df.getBlob().setName(billId+".pdf");const pf=folder.createFile(pdf);pf.setName(billId+".pdf");df.setTrashed(true);return{success:true,fileId:pf.getId(),url:pf.getUrl()};
  }catch(error){try{DriveApp.getFileById(doc.getId()).setTrashed(true);}catch(_){}throw error;}
}

function emailBillToCustomer_(order,bill){
  const file=DriveApp.getFileById(bill.fileId);
  const greeting=order.name?"Dear "+order.name+",":"Dear Sir / Madam,";
  const body=greeting+"\n\nThank you. We have verified your payment for order "+order.orderId+". Please find your bill attached.\n\nYour order is now confirmed for manufacturing.\n\nRegards,\nConcrete Ideas\n"+CONFIG.WEBSITE;
  MailApp.sendEmail({to:order.email,subject:"Bill " + order.orderId + " — Concrete Ideas",body,attachments:[file.getBlob()],name:CONFIG.BUSINESS_NAME});
}

function appendPaymentConfirmedOrders_(order,confirmedAt){
  const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Payment Confirmed Orders");
  if(!sheet) throw new Error("Payment Confirmed Orders sheet not found. Run setupConcreteIdeasCRM().");
  const rows=order.items.map(i=>[order.orderId,confirmedAt,order.name,order.company,order.email,order.phone,order.project,order.location,i.productId,i.product,i.size,i.dimension,i.weight,i.quantity,i.rate,i.lineValue,order.orderTotal,"Ready for manufacturing",""]);
  if(rows.length) sheet.getRange(sheet.getLastRow()+1,1,rows.length,rows[0].length).setValues(rows);
}

function sendSalesPaymentConfirmation_(orderId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const order = getOrder_(orderId);
  if (!order) throw new Error("Order not found: " + orderId);

  const sheet = ss.getSheetByName("Enquiry Items");
  if (!sheet) throw new Error("Enquiry Items sheet not found.");

  const values = sheet.getDataRange().getValues();
  if (!values.length) throw new Error("Enquiry Items sheet is empty.");

  const headers = values[0].map(String);
  const idx = {};
  headers.forEach(function(h, i) { idx[h] = i; });

  const items = values.slice(1)
    .filter(function(row) { return String(row[idx["Order ID"]] || "") === String(orderId); })
    .map(function(row) {
      return {
        product: row[idx["Product"]],
        size: row[idx["Size"]],
        dimension: row[idx["Dimension"]],
        weight: row[idx["Weight"]],
        quantity: row[idx["Quantity"]]
      };
    });

  const lines = [
    "New Concrete Ideas order ready for manufacturing / fulfilment",
    "",
    "Order ID: " + order.orderId,
    "Order Date: " + order.createdAt,
    "",
    "Customer",
    "Name: " + order.name,
    "Company / Studio: " + order.company,
    "Phone / WhatsApp: " + order.phone,
    "Email: " + order.email,
    "Project: " + order.project,
    "Delivery Location: " + order.deliveryLocation,
    "",
    "Items"
  ];

  items.forEach(function(item, index) {
    lines.push(
      (index + 1) + ". " + item.product +
      " | Size: " + item.size +
      " | Dimension: " + item.dimension +
      " | Weight: " + item.weight +
      " | Quantity: " + item.quantity
    );
  });

  lines.push(
    "",
    "Manufacturing Status: Pending",
    "Notes: " + (order.internalNotes || "")
  );

  MailApp.sendEmail({
    to: CONFIG.SALES_EMAIL,
    subject: "Manufacturing Order " + order.orderId + " — Concrete Ideas",
    body: lines.join("\n")
  });
}

function getReviewOrders(){
  return getAllOrders_().filter(o=>String(o.status).toLowerCase()==="quote sent");
}

function getAllOrders(){ return getAllOrders_(); }

function getAllOrders_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const sheet=ss.getSheetByName("Enquiries");
  const itemSheet=ss.getSheetByName("Enquiry Items");
  if(!sheet||!itemSheet) throw new Error("CRM sheets not found. Run setupConcreteIdeasCRM().");

  const v=sheet.getDataRange().getValues();
  if(v.length<2) return [];
  const h=v[0].map(String);
  const idx=n=>h.indexOf(n);
  const iv=itemSheet.getDataRange().getValues();
  const ih=iv.length ? iv[0].map(String) : [];
  const ii=n=>ih.indexOf(n);
  const by={};

  for(let r=1;r<iv.length;r++){
    const row=iv[r];
    const id=String(row[ii("Order ID")]||"").trim();
    if(!id) continue;
    const quantity=Number(row[ii("Quantity")]||0);
    const rate=Number(row[ii("Rate")]||0);
    const storedLineValue=Number(row[ii("Line Value")]||0);
    // Always derive line value from quantity × rate. This prevents corrupted
    // summary/formula cells from contaminating dashboard and PDF totals.
    const lineValue=Number.isFinite(quantity)&&Number.isFinite(rate) ? quantity*rate : storedLineValue;
    (by[id]||(by[id]=[])).push({
      productId:String(row[ii("Product ID")]||""),
      product:String(row[ii("Product")]||""),
      size:String(row[ii("Size")]||""),
      dimension:String(row[ii("Dimension")]||""),
      weight:String(row[ii("Weight")]||""),
      quantity,
      rate,
      lineValue
    });
  }

  return v.slice(1).map(r=>{
    const orderId=String(r[idx("Order ID")]||"");
    const items=by[orderId]||[];
    // The item rows are the authoritative commercial calculation for an order.
    // Recompute totals instead of trusting potentially corrupted summary cells.
    const itemCount=items.reduce((sum,i)=>sum+(Number.isFinite(i.quantity)?i.quantity:0),0);
    const productValue=items.reduce((sum,i)=>sum+(Number.isFinite(i.lineValue)?i.lineValue:0),0);
    const shipment=productValue*CONFIG.SHIPMENT_RATE;
    const orderTotal=productValue+shipment;

    return {
      orderId,
      createdAt:toIsoDate_(r[idx("Created At")]),
      status:String(r[idx("Status")]||""),
      name:String(r[idx("Name")]||""),
      company:String(r[idx("Company / Studio")]||""),
      email:String(r[idx("Email")]||""),
      phone:String(r[idx("Phone / WhatsApp")]||""),
      project:String(r[idx("Project")]||""),
      location:String(r[idx("Delivery Location")]||""),
      message:String(r[idx("Message")]||""),
      itemCount,
      productValue,
      shipment,
      orderTotal,
      lastUpdated:toIsoDate_(r[idx("Last Updated")]),
      quoteSentAt:toIsoDate_(r[idx("Quote Sent At")]),
      quotePdfUrl:String(r[idx("Quote PDF URL")]||""),
      paymentDoneAt:toIsoDate_(r[idx("Payment Done At")]),
      billPdfUrl:String(r[idx("Bill PDF URL")]||""),
      notes:String(r[idx("Internal Notes")]||""),
      items
    };
  }).reverse();
}

function getOrder_(orderId){return getAllOrders_().find(o=>o.orderId===orderId)||null;}

function updateOrderStatus_(orderId,status,extra){
  const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Enquiries");if(!sheet)throw new Error("Enquiries sheet not found.");
  const data=sheet.getDataRange().getValues();const h=data[0].map(String);const rowIndex=data.findIndex(r=>String(r[h.indexOf("Order ID")]||"").trim()===String(orderId).trim());if(rowIndex<1)throw new Error("Order not found: "+orderId);
  const row=rowIndex+1;sheet.getRange(row,h.indexOf("Status")+1).setValue(status);sheet.getRange(row,h.indexOf("Last Updated")+1).setValue(new Date());Object.keys(extra||{}).forEach(k=>{const c=h.indexOf(k);if(c>=0)sheet.getRange(row,c+1).setValue(extra[k]);});
}

function createPaymentQrBlob_(orderId,amount){
  const upi=String(CONFIG.PAYMENT_UPI_ID||"").trim();if(!upi)throw new Error("Configure CONFIG.PAYMENT_UPI_ID in Code.gs.");
  const params=["pa="+encodeURIComponent(upi),"pn="+encodeURIComponent(CONFIG.PAYMENT_NAME),"am="+encodeURIComponent(Number(amount||0).toFixed(2)),"cu=INR","tn="+encodeURIComponent(orderId)].join("&");
  const url="https://quickchart.io/qr?size=320&margin=2&text="+encodeURIComponent("upi://pay?"+params);const response=UrlFetchApp.fetch(url,{muteHttpExceptions:true});if(response.getResponseCode()!==200)throw new Error("Could not generate the payment QR code.");return response.getBlob().setName(orderId+"-payment-qr.png");
}

function ensurePublicOrderDeliveryTrigger_(){
  const triggers=ScriptApp.getProjectTriggers();if(triggers.some(t=>t.getHandlerFunction()==="processPublicOrderDeliveryQueue_"))return;
  ScriptApp.newTrigger("processPublicOrderDeliveryQueue_").timeBased().everyMinutes(1).create();
}

function createResultPage_(success,orderId,errorMessage,resultType,quoteId,warningMessage){
  const result=JSON.stringify({type:resultType||"concreteideas-order-result",success:!!success,enquiryId:orderId||"",orderId:orderId||"",quoteId:quoteId||"",error:errorMessage||"",warning:warningMessage||""});
  return HtmlService.createHtmlOutput('<!DOCTYPE html><html><head><base target="_top"></head><body><script>window.top.postMessage('+result+',"*");</script></body></html>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getOrCreateSheet_(ss,name){return ss.getSheetByName(name)||ss.insertSheet(name);}
function ensureHeaders_(sheet,headers){const current=sheet.getLastColumn()?sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(String):[];if(current.join("|")!==headers.join("|")){sheet.getRange(1,1,1,headers.length).setValues([headers]);}}
function formatHeader_(sheet,count){sheet.getRange(1,1,1,count).setFontWeight("bold").setBackground("#eee9e2");sheet.setFrozenRows(1);}
function getOrCreateFolder_(name){const it=DriveApp.getFoldersByName(name);return it.hasNext()?it.next():DriveApp.createFolder(name);}
function formatCurrency_(n){return "₹"+Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});}
function formatQuoteDate_(d){return d?Utilities.formatDate(new Date(d),Session.getScriptTimeZone(),"dd MMM yyyy"):"—";}
function toIsoDate_(v){return v?new Date(v).toISOString():"";}
function cleanErrorMessage_(e){return e&&e.message?e.message:String(e||"Unknown error");}
function createSheetDashboard_(sheet,enquiries){sheet.clear();sheet.getRange("A1:B1").setValues([["Concrete Ideas Order Dashboard","Value"]]).setFontWeight("bold");sheet.getRange("A2:B5").setValues([["NEW","=COUNTIF(Enquiries!C:C,\"NEW\")"],["Quote Sent","=COUNTIF(Enquiries!C:C,\"Quote Sent\")"],["Payment done","=COUNTIF(Enquiries!C:C,\"Payment done\")"],["Total orders","=COUNTA(Enquiries!A:A)-1"]]);}
