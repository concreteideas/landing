# Concrete Ideas — Google Workspace enquiry backend

`Code.gs` contains the Apps Script backend for:
- Product Pricing tab with initial assumed base prices
- Enquiries / Enquiry Items schema
- Status dropdowns and internal notes
- Google Sheets Dashboard tab
- Base-price lookup and snapshotting on enquiry submission
- Business + customer email notifications
- Confirmation ID generation independent of sheet row number

Run `setupConcreteIdeasCRM()` once from the Apps Script project after replacing Code.gs.

The initial prices are assumptions only. Edit them in the `Product Pricing` tab.
